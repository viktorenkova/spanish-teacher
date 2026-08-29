import assert from "node:assert/strict";

const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const expectedVersion = process.env.SMOKE_EXPECTED_VERSION;

async function fetchWithRetry(pathname, attempts = 30) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${pathname}`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) return response;
      lastError = new Error(`${pathname} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw lastError;
}

async function run() {
  const pageResponse = await fetchWithRetry("/");
  assert.match(await pageResponse.text(), /Spanish Coach/);

  const liveResponse = await fetchWithRetry("/api/health/live");
  assert.match(liveResponse.headers.get("cache-control") ?? "", /no-store/);
  const live = await liveResponse.json();
  assert.equal(live.status, "ok");
  assert.equal(live.service, "spanish-coach");

  const readyResponse = await fetchWithRetry("/api/health/ready");
  assert.match(readyResponse.headers.get("cache-control") ?? "", /no-store/);
  const ready = await readyResponse.json();
  assert.equal(ready.status, "ready");
  assert.equal(ready.checks.database.status, "ok");
  if (expectedVersion) assert.equal(ready.version, expectedVersion);

  console.info(JSON.stringify({
    level: "info",
    event: "production_smoke_passed",
    baseUrl,
    version: ready.version,
  }));
}

run().catch((error) => {
  console.error(JSON.stringify({
    level: "error",
    event: "production_smoke_failed",
    baseUrl,
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exitCode = 1;
});
