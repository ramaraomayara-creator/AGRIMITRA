"use strict";
/* fetch() with timeout + response-size guard. Throws {code, status?, message}. */
async function fetchJson(url, { timeoutMs = 20000, maxBytes = 2 * 1024 * 1024, method = "GET", headers = {}, body } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { signal: ctl.signal, method, headers: { "User-Agent": "AgriMitra-Backend/1.0", ...headers }, body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)) });
  } catch (e) {
    throw { code: e && e.name === "AbortError" ? "TIMEOUT" : "NETWORK", message: "Upstream request failed" };
  } finally { clearTimeout(t); }
  if (!res.ok) throw { code: "HTTP_" + res.status, status: res.status, message: "Upstream HTTP " + res.status };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw { code: "TOOBIG", message: "Upstream response too large" };
  try { return JSON.parse(buf.toString("utf8")); }
  catch (e) { throw { code: "BADJSON", message: "Upstream returned invalid JSON" }; }
}
module.exports = { fetchJson };
