/**
 * OSIRIS Intelligence Layer — Entity Resolution
 * 
 * Cross-references entities against sanctions lists and Wikidata
 * 
 * Data sources:
 *   - OpenSanctions (OFAC SDN) — bulk CSV, refreshed every 24h
 *   - Wikidata SPARQL — on-demand with aggressive LRU cache
 */

import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// §1 — CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const SDN_CSV_URL = 'https://data.opensanctions.org/datasets/latest/us_ofac_sdn/targets.simple.csv';
const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIDATA_UA = 'OSIRIS-Intel/1.0 (https://osirisai.live; ontology engine)';
const SDN_REFRESH_MS = 24 * 60 * 60 * 1000; // 24h
const WIKIDATA_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const WIKIDATA_CACHE_MAX = 10_000;

// ═══════════════════════════════════════════════════════════════
// §2 — SANCTIONS INDEX (in-memory graph)
// ═══════════════════════════════════════════════════════════════

interface SanctionEntry {
  id: string;
  schema: string;
  name: string;
  aliases: string[];
  countries: string[];
  programs: string[];
  sanctions: string;
  first_seen: string;
  last_seen: string;
}

let sanctionsIndex: {
  entries: SanctionEntry[];
  byNorm: Map<string, SanctionEntry[]>;
  fetchedAt: number;
} = {
  entries: [],
  byNorm: new Map(),
  fetchedAt: 0,
};

function normName(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { 
        if (text[i + 1] === '"') { field += '"'; i++; } 
        else inQ = false; 
      }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function loadSanctions(): Promise<void> {
  console.log('[INTEL] Loading OpenSanctions OFAC SDN...');
  try {
    const res = await fetch(SDN_CSV_URL, {
      signal: AbortSignal.timeout(30000),
      headers: { Accept: 'text/csv' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error('CSV empty');

    const headers = rows[0];
    const idx = (col: string) => headers.indexOf(col);
    const i: Record<string, number> = {
      id: idx('id'),
      schema: idx('schema'),
      name: idx('name'),
      aliases: idx('aliases'),
      countries: idx('countries'),
      programs: idx('program_ids'),
      sanctions: idx('sanctions'),
      first_seen: idx('first_seen'),
      last_seen: idx('last_seen'),
    };

    const entries: SanctionEntry[] = [];
    const byNorm = new Map<string, SanctionEntry[]>();

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row[i.name]) continue;
      const entry = {
        id: row[i.id] || '',
        schema: row[i.schema] || 'LegalEntity',
        name: row[i.name],
        aliases: (row[i.aliases] || '').split(';').map(s => s.trim()).filter(Boolean),
        countries: (row[i.countries] || '').split(';').map(s => s.trim()).filter(Boolean),
        programs: (row[i.programs] || '').split(';').map(s => s.trim()).filter(Boolean),
        sanctions: row[i.sanctions] || '',
        first_seen: row[i.first_seen] || '',
        last_seen: row[i.last_seen] || '',
      };
      entries.push(entry);
      
      // Index by normalized name
      const n = normName(entry.name);
      if (!byNorm.has(n)) byNorm.set(n, []);
      byNorm.get(n)!.push(entry);
      
      // Also index aliases
      for (const a of entry.aliases) {
        const na = normName(a);
        if (!byNorm.has(na)) byNorm.set(na, []);
        byNorm.get(na)!.push(entry);
      }
    }

    sanctionsIndex = { entries, byNorm, fetchedAt: Date.now() };
    console.log(`[INTEL] Loaded ${entries.length} sanctions entries`);
  } catch (e) {
    console.error('[INTEL] Failed to load sanctions:', e);
  }
}

// Initialize sanctions on first request
let sanctionsLoaded = false;
async function ensureSanctions(): Promise<void> {
  if (!sanctionsLoaded || Date.now() - sanctionsIndex.fetchedAt > SDN_REFRESH_MS) {
    await loadSanctions();
    sanctionsLoaded = true;
  }
}

// Search sanctions by name
function searchSanctions(query: string): SanctionEntry[] {
  const n = normName(query);
  const results: SanctionEntry[] = [];
  
  // Exact match
  const exact = sanctionsIndex.byNorm.get(n);
  if (exact) results.push(...exact);
  
  // Partial match (contains)
  for (const [key, entries] of sanctionsIndex.byNorm) {
    if (key.includes(n) || n.includes(key)) {
      for (const e of entries) {
        if (!results.find(r => r.id === e.id)) {
          results.push(e);
        }
      }
    }
  }
  
  return results.slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════
// §3 — WIKIDATA (on-demand with LRU cache)
// ═══════════════════════════════════════════════════════════════

interface WikidataResult {
  id: string;
  label: string;
  description: string;
  type: string;
  coordinates?: { lat: number; lon: number };
  country?: string;
  instanceOf?: string[];
}

const wdCache = new Map<string, { data: WikidataResult[]; ts: number }>();

async function sparql(query: string): Promise<any> {
  const url = WIKIDATA_ENDPOINT + '?query=' + encodeURIComponent(query) + '&format=json';
  const res = await fetch(url, {
    headers: { 'User-Agent': WIKIDATA_UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}`);
  return res.json();
}

async function wdSearch(query: string, type: string = 'item'): Promise<WikidataResult[]> {
  const cacheKey = `${type}:${query}`;
  const cached = wdCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < WIKIDATA_CACHE_TTL) {
    return cached.data;
  }

  const q = `
    SELECT ?item ?itemLabel ?desc ?typeLabel ?coord ?countryLabel ?instanceLabel WHERE {
      ?item rdfs:label "${query}"@en .
      OPTIONAL { ?item rdfs:comment ?desc }
      OPTIONAL { ?item wdt:P31 ?instance }
      OPTIONAL { ?item wdt:P276 ?country }
      OPTIONAL { ?item wdt:P625 ?coord }
      BIND(wdt:${type === 'item' ? 'Q5' : 'Q'} AS ?type)
    }
    LIMIT 10
  `;

  try {
    const data = await sparql(q);
    const results: WikidataResult[] = [];
    for (const binding of data.results?.bindings || []) {
      results.push({
        id: binding.item?.value?.split('/').pop() || '',
        label: binding.itemLabel?.value || query,
        description: binding.desc?.value || '',
        type: binding.typeLabel?.value || type,
        coordinates: binding.coord ? {
          lat: parseFloat(binding.coord.value.latitude),
          lon: parseFloat(binding.coord.value.longitude),
        } : undefined,
        country: binding.countryLabel?.value,
        instanceOf: binding.instanceLabel?.value ? [binding.instanceLabel.value] : undefined,
      });
    }

    // Cache management
    if (wdCache.size >= WIKIDATA_CACHE_MAX) {
      let oldest = cacheKey;
      let oldestTs = Date.now();
      for (const [k, v] of wdCache) {
        if (v.ts < oldestTs) { oldest = k; oldestTs = v.ts; }
      }
      wdCache.delete(oldest);
    }
    wdCache.set(cacheKey, { data: results, ts: Date.now() });
    return results;
  } catch (e) {
    console.error('[INTEL] Wikidata error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// §4 — RESOLVERS
// ═══════════════════════════════════════════════════════════════

interface ResolveResult {
  nodes: Array<{ id: string; label: string; type: string; data: Record<string, any> }>;
  links: Array<{ source: string; target: string; type: string }>;
}

async function resolveAircraft(id: string, properties: Record<string, string> = {}): Promise<ResolveResult> {
  const nodes: ResolveResult['nodes'] = [];
  const links: ResolveResult['links'] = [];

  // Add the aircraft node
  nodes.push({ id, label: id, type: 'aircraft', data: properties });

  // Search sanctions by registration
  const sanctions = searchSanctions(properties.registration || id);
  for (const s of sanctions) {
    nodes.push({ id: s.id, label: s.name, type: 'sanction', data: s });
    links.push({ source: id, target: s.id, type: 'sanction_match' });
  }

  // Search Wikidata for aircraft
  const wd = await wdSearch(id, 'item');
  for (const w of wd) {
    nodes.push({ id: w.id, label: w.label, type: 'wikidata', data: w });
    links.push({ source: id, target: w.id, type: 'wikidata_match' });
  }

  return { nodes, links };
}

async function resolveVessel(id: string): Promise<ResolveResult> {
  const nodes: ResolveResult['nodes'] = [];
  const links: ResolveResult['links'] = [];

  nodes.push({ id, label: id, type: 'vessel', data: {} });

  const sanctions = searchSanctions(id);
  for (const s of sanctions) {
    nodes.push({ id: s.id, label: s.name, type: 'sanction', data: s });
    links.push({ source: id, target: s.id, type: 'sanction_match' });
  }

  const wd = await wdSearch(id, 'item');
  for (const w of wd) {
    nodes.push({ id: w.id, label: w.label, type: 'wikidata', data: w });
    links.push({ source: id, target: w.id, type: 'wikidata_match' });
  }

  return { nodes, links };
}

async function resolveCompany(id: string): Promise<ResolveResult> {
  const nodes: ResolveResult['nodes'] = [];
  const links: ResolveResult['links'] = [];

  nodes.push({ id, label: id, type: 'company', data: {} });

  const sanctions = searchSanctions(id);
  for (const s of sanctions) {
    nodes.push({ id: s.id, label: s.name, type: 'sanction', data: s });
    links.push({ source: id, target: s.id, type: 'sanction_match' });
  }

  const wd = await wdSearch(id, 'item');
  for (const w of wd) {
    nodes.push({ id: w.id, label: w.label, type: 'wikidata', data: w });
    links.push({ source: id, target: w.id, type: 'wikidata_match' });
  }

  return { nodes, links };
}

async function resolvePerson(id: string): Promise<ResolveResult> {
  const nodes: ResolveResult['nodes'] = [];
  const links: ResolveResult['links'] = [];

  nodes.push({ id, label: id, type: 'person', data: {} });

  const sanctions = searchSanctions(id);
  for (const s of sanctions) {
    nodes.push({ id: s.id, label: s.name, type: 'sanction', data: s });
    links.push({ source: id, target: s.id, type: 'sanction_match' });
  }

  const wd = await wdSearch(id, 'item');
  for (const w of wd) {
    nodes.push({ id: w.id, label: w.label, type: 'wikidata', data: w });
    links.push({ source: id, target: w.id, type: 'wikidata_match' });
  }

  return { nodes, links };
}

const RESOLVERS: Record<string, (id: string, props?: Record<string, string>) => Promise<ResolveResult>> = {
  aircraft: resolveAircraft,
  vessel: resolveVessel,
  company: resolveCompany,
  person: resolvePerson,
};

const ALLOWED_TYPES = new Set(Object.keys(RESOLVERS));

// Sanitize ID input
function sanitizeId(raw: string): string {
  return raw.replace(/[^\p{L}\p{N}\s\-_,.+]/gu, '').slice(0, 200);
}

// ═══════════════════════════════════════════════════════════════
// §5 — API ROUTES
// ═══════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || '').toLowerCase().trim();
  const rawId = (searchParams.get('id') || '').trim();

  if (!type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: `Invalid type. Allowed: ${[...ALLOWED_TYPES].join(', ')}` },
      { status: 400 }
    );
  }
  if (!rawId || rawId.length < 2 || rawId.length > 200) {
    return NextResponse.json(
      { error: 'Invalid id (2-200 chars)' },
      { status: 400 }
    );
  }

  const id = sanitizeId(rawId);
  
  // Collect extra properties
  const props: Record<string, string> = {};
  const registration = searchParams.get('registration');
  const model = searchParams.get('model');
  const icao24 = searchParams.get('icao24');
  if (registration) props.registration = sanitizeId(registration);
  if (model) props.model = sanitizeId(model);
  if (icao24) props.icao24 = sanitizeId(icao24);

  try {
    // Ensure sanctions data is loaded
    await ensureSanctions();

    const resolver = RESOLVERS[type];
    const result = await resolver(id, props);

    return NextResponse.json({
      ...result,
      entity: { type, id },
      source: 'OSIRIS Intelligence Layer',
      sanctions_index_size: sanctionsIndex.entries.length,
      wikidata_cache_size: wdCache.size,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[INTEL] Resolve error:', e);
    return NextResponse.json(
      { error: 'Resolution failed', nodes: [], links: [] },
      { status: 500 }
    );
  }
}