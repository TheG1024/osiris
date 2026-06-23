#!/usr/bin/env node
// ponytail: load test the public /api/v1/health endpoint with Node's built-in fetch.
// No autocannon / k6 dep. Configurable: TARGET, CONCURRENCY, REQUESTS, DURATION_SEC.
const TARGET = process.env.TARGET || 'http://localhost:4000/api/v1/health';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const REQUESTS = parseInt(process.env.REQUESTS || '1000', 10);
const DURATION_SEC = parseFloat(process.env.DURATION_SEC || '0');

async function hit() {
  const t0 = Date.now();
  try {
    const r = await fetch(TARGET);
    return { ok: r.ok, status: r.status, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, err: String(e) };
  }
}

async function main() {
  console.log(`load: target=${TARGET} concurrency=${CONCURRENCY} ${REQUESTS ? `requests=${REQUESTS}` : `duration=${DURATION_SEC}s`}`);
  const start = Date.now();
  const results = [];
  let dispatched = 0;
  let stop = false;

  const deadline = DURATION_SEC > 0 ? start + DURATION_SEC * 1000 : 0;
  const limit = REQUESTS > 0 ? REQUESTS : Infinity;

  async function worker() {
    while (!stop && dispatched < limit && (!deadline || Date.now() < deadline)) {
      dispatched++;
      results.push(await hit());
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const total = results.length;
  const ok = results.filter((r) => r.ok).length;
  const fails = total - ok;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const p = (q) => times[Math.floor(times.length * q)] || 0;
  const elapsed = (Date.now() - start) / 1000;
  const rps = total / elapsed;
  console.log(`done: ${total} req in ${elapsed.toFixed(2)}s (${rps.toFixed(1)} rps)`);
  console.log(`ok=${ok} fail=${fails}`);
  if (times.length) {
    console.log(`latency ms: p50=${p(0.5)} p95=${p(0.95)} p99=${p(0.99)} max=${times[times.length - 1]}`);
  }
  process.exit(fails > total * 0.1 ? 1 : 0);
}

main();
