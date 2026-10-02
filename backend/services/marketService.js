"use strict";
/* data.gov.in mandi prices → normalized records. Never invents prices. */
const { fetchJson } = require("../utils/http");
const { createCache } = require("../utils/cache");
const logger = require("../utils/logger");
const cache = createCache();
const DATASET_PAGE = "https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi";
const num = (v) => { if (v === null || v === undefined || v === "") return null; const n = parseFloat(String(v).replace(/,/g, "")); return Number.isFinite(n) ? n : null; };
function normalize(r) {
  return {
    commodity: r.commodity || r.Commodity || "",
    variety: r.variety || r.Variety || "",
    grade: r.grade || r.Grade || "",
    state: r.state || r.State || "",
    district: r.district || r.District || "",
    market: r.market || r.Market || "",
    arrivalDate: r.arrival_date || r.Arrival_Date || "",
    minPrice: num(r.min_price), maxPrice: num(r.max_price), modalPrice: num(r.modal_price),
    unit: r.unit || r.Unit || "Quintal",
    unitNote: (r.unit || r.Unit) ? "Unit as published in the dataset record." : "Unit is not published in this dataset; mandi prices are conventionally per quintal — verify with the APMC.",
    source: "Government of India Open Government Data Platform",
    sourceUrl: DATASET_PAGE,
    isLive: true,
    fetchedAt: new Date().toISOString(),
  };
}
async function getPrices(cfg, f) {
  if (!cfg.marketApiKey) { const e = new Error("Market API not configured"); e.code = "NOT_CONFIGURED"; throw e; }
  const key = "prices:" + JSON.stringify(f);
  const hit = cache.get(key);
  if (hit) { hit.cached = true; return hit; }
  const p = new URLSearchParams({ "api-key": cfg.marketApiKey, format: "json", limit: String(f.limit), offset: String(f.offset) });
  ["state", "district", "market", "commodity", "variety", "arrival_date"].forEach((k) => {
    if (f[k]) p.set(`filters[${k}]`, f[k]);
  });
  let body;
  try {
    body = await fetchJson(`${cfg.marketApiUrl}?${p.toString()}`);
  } catch (e) {
    if (e && (e.status === 401 || e.status === 403)) { const x = new Error("Upstream auth"); x.code = "UPSTREAM_AUTH"; throw x; }
    logger.warn("market upstream failed", { code: e && e.code });
    const y = new Error("Upstream unavailable"); y.code = "UPSTREAM_UNAVAILABLE"; throw y;
  }
  const records = Array.isArray(body.records) ? body.records.map(normalize) : [];
  let dataDate = "";
  records.forEach((r) => { if (r.arrivalDate && r.arrivalDate > dataDate) dataDate = r.arrivalDate; });
  const out = {
    records, total: parseInt(body.total || records.length, 10) || records.length,
    dataDate, fetchedAt: new Date().toISOString(),
    source: "Government of India Open Government Data Platform", sourceUrl: DATASET_PAGE,
    isLive: true, cached: false,
  };
  cache.set(key, out, cfg.cacheTtlMs);
  return out;
}
async function getMarkets(cfg, f) {
  /* Distinct markets derived from real records only — contacts never invented. */
  const res = await getPrices(cfg, { limit: 500, offset: 0, state: f.state, district: f.district });
  const map = new Map();
  res.records.forEach((r) => {
    const k = `${r.state}||${r.district}||${r.market}`;
    if (!map.has(k)) {
      map.set(k, {
        id: k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        marketName: r.market, state: r.state, district: r.district, location: "",
        commodities: [], contact: null,
        contactNote: "Contact details are not published in this dataset. Confirm with the district APMC.",
        source: res.source, sourceUrl: res.sourceUrl, lastUpdated: res.dataDate,
      });
    }
    const m = map.get(k);
    if (r.commodity && !m.commodities.includes(r.commodity)) m.commodities.push(r.commodity);
  });
  return { markets: [...map.values()], isLive: true, cached: !!res.cached, fetchedAt: res.fetchedAt, source: res.source, sourceUrl: res.sourceUrl };
}
module.exports = { getPrices, getMarkets };
