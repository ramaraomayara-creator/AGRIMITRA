"use strict";
/* Wikimedia Commons image search (no key needed) → normalized + attributed.
 * Only the fixed Commons host is ever fetched — user input becomes a query string. */
const { fetchJson } = require("../utils/http");
const { createCache } = require("../utils/cache");
const logger = require("../utils/logger");
const cache = createCache();
function pick(obj, ...keys) {
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  return "";
}
async function searchImages(cfg, query) {
  const key = "img:" + query.toLowerCase();
  const hit = cache.get(key);
  if (hit) { hit.cached = true; return hit; }
  const p = new URLSearchParams({
    action: "query", generator: "search",
    gsrsearch: query + " filetype:bitmap", gsrnamespace: "6", gsrlimit: "8",
    prop: "imageinfo", iiprop: "url|user|extmetadata", iiurlwidth: "640",
    format: "json", origin: "*",
  });
  let body;
  try {
    body = await fetchJson(`${cfg.imageApiUrl}?${p.toString()}`);
  } catch (e) {
    logger.warn("image upstream failed", { code: e && e.code });
    const y = new Error("Upstream unavailable"); y.code = "UPSTREAM_UNAVAILABLE"; throw y;
  }
  const pages = (body.query && body.query.pages) || {};
  const results = Object.values(pages).map((pg) => {
    const info = (pg.imageinfo || [])[0] || {};
    const meta = info.extmetadata || {};
    const lic = pick(meta.LicenseShortName, "value");
    return {
      imageUrl: info.thumburl || info.url || "",
      thumbnailUrl: info.thumburl || info.url || "",
      title: pg.title || "",
      sourceName: "Wikimedia Commons",
      sourceUrl: (info.descriptionurl || "").split("?")[0],
      author: String(pick(meta.Artist, "value")).replace(/<[^>]*>/g, "").slice(0, 120),
      license: lic,
      attribution: `${String(pick(meta.Artist, "value")).replace(/<[^>]*>/g, "").slice(0, 80) || "Unknown"} / Wikimedia Commons${lic ? " / " + lic : ""}`,
      imageType: "verified",
      fetchedAt: new Date().toISOString(),
    };
  }).filter((r) => r.imageUrl);
  const out = { query, results, isLive: true, cached: false, fetchedAt: new Date().toISOString() };
  cache.set(key, out, cfg.imageCacheTtlMs);
  return out;
}
async function checkImage(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10000);
    const r = await fetch(url, { method: "HEAD", signal: ctl.signal, headers: { "User-Agent": "AgriMitra-Backend/1.0" } });
    clearTimeout(t);
    const ct = r.headers.get("content-type") || "";
    const len = parseInt(r.headers.get("content-length") || "0", 10);
    return r.ok && ct.startsWith("image/") && (!len || len < 15 * 1024 * 1024);
  } catch (e) { return false; }
}
/* Fertilizer-specific search: targeted per-product queries, validated candidates,
 * duplicate-URL protection (one exact image is never assigned to two products),
 * TTL cache. opts: {brand, type, grade, category}. */
const usedImageUrls = new Map();
async function searchFertilizer(cfg, name, opts) {
  opts = opts || {};
  const key = "fertimg:" + String(name || "").toLowerCase().slice(0, 60);
  const hit = cache.get(key);
  if (hit) { hit.cached = true; return hit; }
  const brandBit = opts.brand ? `${opts.brand} ` : "";
  const detailBit = [opts.grade, opts.type, opts.category].filter(Boolean).join(" ");
  const codeBit = opts.productCode ? ` ${opts.productCode}` : "";
  const queries = [
    `${brandBit}${name}${codeBit} fertilizer bag product`.trim(),
    `${name} ${detailBit} fertilizer bag agriculture`.trim(),
    `${name} fertilizer agriculture`,
    `${name} fertilizer`,
  ].filter((q, i, a) => q && a.indexOf(q) === i);
  for (const q of queries) {
    let res;
    try { res = await searchImages(cfg, q); }
    catch (e) { continue; }
    const cands = (res.results || []).filter((r) => r.imageUrl);
    for (const c of cands.slice(0, 4)) {
      if (!(await checkImage(c.imageUrl))) continue;
      const owner = usedImageUrls.get(c.imageUrl);
      if (owner && owner !== key) continue;
      usedImageUrls.set(c.imageUrl, key);
      if (usedImageUrls.size > 1000) usedImageUrls.delete(usedImageUrls.keys().next().value);
      const out = {
        query: name, result: { ...c, imageType: "verified" },
        cached: false, fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + cfg.imageCacheTtlMs).toISOString(),
      };
      cache.set(key, out, cfg.imageCacheTtlMs);
      return out;
    }
  }
  const e = new Error("No verified image found");
  e.code = "NO_IMAGE";
  throw e;
}
/* Seed-specific search: targeted per-variety queries, validated candidates, TTL cache. */
async function searchSeed(cfg, name, opts) {
  opts = opts || {};
  const key = "seedimg:" + String(name || "").toLowerCase().slice(0, 60);
  const hit = cache.get(key);
  if (hit) { hit.cached = true; return hit; }
  const brandBit = opts.brand ? `${opts.brand} ` : "";
  const detailBit = [opts.variety, opts.crop, opts.category].filter(Boolean).join(" ");
  const codeBit = opts.productCode ? ` ${opts.productCode}` : "";
  const queries = [
    `${brandBit}${name}${codeBit} seed packet product`.trim(),
    `${name} ${detailBit} seed variety agriculture`.trim(),
    `${name} seed agriculture`,
    `${name} seed`,
  ].filter((q, i, a) => q && a.indexOf(q) === i);
  for (const q of queries) {
    let res;
    try { res = await searchImages(cfg, q); }
    catch (e) { continue; }
    const cands = (res.results || []).filter((r) => r.imageUrl);
    for (const c of cands.slice(0, 4)) {
      if (!(await checkImage(c.imageUrl))) continue;
      const owner = usedImageUrls.get(c.imageUrl);
      if (owner && owner !== key) continue;
      usedImageUrls.set(c.imageUrl, key);
      if (usedImageUrls.size > 1000) usedImageUrls.delete(usedImageUrls.keys().next().value);
      const out = {
        query: name, result: { ...c, imageType: "verified" },
        cached: false, fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + cfg.imageCacheTtlMs).toISOString(),
      };
      cache.set(key, out, cfg.imageCacheTtlMs);
      return out;
    }
  }
  const e = new Error("No verified image found");
  e.code = "NO_IMAGE";
  throw e;
}
module.exports = { searchImages, searchFertilizer, searchSeed };
