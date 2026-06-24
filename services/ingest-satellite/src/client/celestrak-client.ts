import axios from 'axios';
import * as satellite from 'satellite.js';
import { GeoEntity } from '@osiris/shared';

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
}

const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

// ponytail: CelesTrak moved from /NORAD/elements/<group>.php to a single
// /NORAD/elements/gp.php with ?GROUP=<name>. The set of valid groups is
// smaller than the old category list. Defaults to 'stations' because the
// 'active' group rate-limits with a "data has not updated" reply if polled
// within the 2-hour refresh window.
const CELESTRAK_GROUPS = new Set([
  'active', 'analyst', 'stations', 'weather', 'amateur', 'cubesat',
  'dmc', 'earth-obs', 'engineering', 'geo', 'geodetic', 'gps-ops',
  'intelsat', 'iridium', 'iridium-next', 'molniya', 'noaa', 'orbcomm',
  'sarsat', 'sbas', 'spire', 'starlink', 'telesat', 'x-comm',
]);

export async function fetchSatelliteTLEs(category: string = 'stations'): Promise<TLEData[]> {
  const group = CELESTRAK_GROUPS.has(category) ? category : 'stations';
  const response = await axios.get(CELESTRAK_BASE, {
    params: { GROUP: group, FORMAT: 'tle' },
    timeout: 30000,
    responseType: 'text',
  });
  return parseTLE(response.data);
}

export function parseTLE(tleText: string): TLEData[] {
  const lines = tleText.split('\n').filter(l => l.trim());
  const tles: TLEData[] = [];
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      tles.push({
        name: (lines[i] ?? '').trim(),
        line1: (lines[i + 1] ?? '').trim(),
        line2: (lines[i + 2] ?? '').trim()
      });
    }
  }
  return tles;
}

/**
 * Propagate a TLE to current lat/lon/alt using SGP4. Returns null if the TLE is invalid.
 */
export function tleToEntity(tle: TLEData): GeoEntity {
  let propagated = { lat: 0, lon: 0, alt: 0 };
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const now = new Date();
    const posVel = satellite.propagate(satrec, now);
    if (posVel && typeof posVel !== 'boolean' && posVel.position && typeof posVel.position !== 'boolean') {
      const gmst = satellite.gstime(now);
      const geo = satellite.eciToGeodetic(posVel.position, gmst);
      propagated = {
        lat: satellite.degreesLat(geo.latitude),
        lon: satellite.degreesLong(geo.longitude),
        alt: (geo.height as number) || 0, // km
      };
    }
  } catch {
    // Invalid TLE — return 0,0; the writer will still record the row.
  }
  return {
    id: tle.name.replace(/\s+/g, '-') || tle.line1.substring(2, 7).trim(),
    type: 'satellite',
    lat: propagated.lat,
    lon: propagated.lon,
    altitude: propagated.alt,
    timestamp: Date.now(),
    metadata: {
      tle: tle,
      status: 'tracked',
    },
  };
}
