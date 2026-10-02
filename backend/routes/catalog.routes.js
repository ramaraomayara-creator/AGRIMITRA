"use strict";
/* Catalog: crops, seeds, fertilizers, farming-types, paddy — served from the
 * verified local data bridge (same data as the frontend). */
const ds = require("../services/dataStore");
const FERT_ALIASES = require("../../shared/fertAliases");
function fertAN(f) {
  const A = (FERT_ALIASES || {})[f.id] || { nick: [], codes: [] };
  const g = /(\d{1,2}:\d{1,2}:\d{1,2})/.exec(f.name || "");
  const seen = {}, nick = [], codes = [];
  [f.name].concat(A.nick || []).forEach((n) => { n = String(n || ""); const k = n.toLowerCase(); if (n && !seen[k]) { seen[k] = 1; nick.push(n); } });
  (g ? [g[1]] : []).concat(A.codes || []).forEach((c) => { c = String(c || ""); const k = c.toLowerCase(); if (c && !seen[k]) { seen[k] = 1; codes.push(c); } });
  return { nicknames: nick, codes };
}
function fertFormulation(f) {
  const c = f.category || "";
  if (c === "Water-Soluble Fertilizers" || c === "Specialty Fertilizers") return "Water-soluble";
  if (c === "Biofertilizers") return "Live culture";
  if (c === "Organic Fertilizers") return "Bulk organic";
  if (c === "Soil Conditioners / Amendments") return "Bulk mineral";
  return "Granular/solid";
}
function fertSearchText(f) {
  const an = fertAN(f);
  return [f.name, f.chemicalName, f.category, f.type, f.purpose, (f.uses || []).join(" "),
    (f.suitableCrops || []).join(" "),
    (f.nutrientComposition ? Object.keys(f.nutrientComposition).join(" ") : ""),
    an.nicknames.join(" "), an.codes.join(" ")].join(" ");
}
const { sendJson } = require("../middleware/errorHandler");
const { str, int } = require("../middleware/validation");
const fs = require("fs");
const path = require("path");
let fertUpdated = null;
try { fertUpdated = fs.statSync(path.join(__dirname, "..", "..", "src", "data", "fertilizers.js")).mtime.toISOString(); } catch (e) { fertUpdated = null; }
let seedUpdated = null;
try { seedUpdated = fs.statSync(path.join(__dirname, "..", "..", "src", "data", "seedVarieties.js")).mtime.toISOString(); } catch (e) { seedUpdated = null; }
function page(arr, q) {
  const limit = int(q.limit, "limit", 1, 500, 200);
  let offset = int(q.offset, "offset", 0, 100000, 0);
  let pageNum = 1, pages = 1;
  if (q.page !== undefined && q.page !== null && q.page !== "") {
    pageNum = int(q.page, "page", 1, 100000, 1);
    offset = (pageNum - 1) * limit;
  }
  pages = Math.max(1, Math.ceil(arr.length / limit));
  return { items: arr.slice(offset, offset + limit), total: arr.length, limit, offset, page: pageNum, pages };
}
function normFert(f) {
  const comp = f.nutrientComposition || {};
  const present = ["N", "P", "K", "S", "Ca", "Mg", "Zn", "Fe", "B", "Mn", "Cu", "Mo"].filter((k) => comp[k] && comp[k] !== "-");
  const gm = /(\d{1,2}:\d{1,2}:\d{1,2})/.exec(f.name || "");
  const cu = ds.fertCurated(f.id) || null;
  return {
    id: f.id, name: f.name, brand: null, manufacturer: null, productName: f.name,
    productCode: null, sku: null, gtin: null, barcode: null, registrationNumber: null,
    nicknames: fertAN(f).nicknames, codes: fertAN(f).codes,
    category: f.category, type: f.type, grade: gm ? gm[1] : null, formulation: fertFormulation(f),
    chemicalName: f.chemicalName, nutrientComposition: comp,
    nutrients: present, purpose: f.purpose, uses: f.uses || [], benefits: f.benefits || [],
    suitableCrops: f.suitableCrops || [], suitableSoils: f.suitableSoils || "",
    applicationMethod: f.applicationMethods || [], applicationRate: null,
    acreRequirement: null, seedRequirement: null,
    performanceIndicators: f.performanceIndicators || [],
    compatibility: f.compatibility || "", precautions: f.precautions || [], storage: f.storage || [],
    source: "AgriMitra verified fertilizer database (FCO grades)", sourceUrl: null,
    lastUpdated: fertUpdated,
    imageUrl: (cu && cu.imageUrl) || null, thumbnailUrl: (cu && cu.imageUrl ? cu.imageUrl.replace("width=640", "width=320") : null),
    imageSource: (cu && cu.sourceName) || null, imageSourceUrl: (cu && cu.page) || null,
    imageLicense: (cu && cu.license) || null, imageAuthor: (cu && cu.author) || null,
    imageAttribution: (cu && cu.attribution) || null,
    imageType: (cu && cu.type === "exact") ? "exact-product" : "verified-representative",
  };
}
function register(routes) {
  const add = (method, path, fn) => routes.push({ method, path, fn });
  add("GET", "/api/crops", (req, res, q) => {
    let L = ds.crops();
    if (q.category) L = L.filter((c) => c.category === q.category);
    if (q.season) L = L.filter((c) => (c.season || "").includes(q.season));
    if (q.q) L = L.filter((c) => ds.contains(c.name + " " + (c.scientificName || ""), q.q));
    sendJson(res, 200, { ...page(L, q), source: "AgriMitra verified crop database" });
  });
  add("GET", "/api/crops/:cropId", (req, res, q, p) => {
    const c = ds.crop(decodeURIComponent(p.id));
    if (!c) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Crop not found." } });
    sendJson(res, 200, { item: c, source: "AgriMitra verified crop database" });
  });
  const normSeed = (s) => ({
    id: s.id, name: s.name, variety: s.variety || s.name, crop: s.crop || "",
    category: s.category || "", brand: null, manufacturer: null,
    seedType: null, productCode: null, varietyCode: null, sku: null, gtin: null, barcode: null,
    maturityDuration: s.duration || null, climate: null,
    soil: s.soil || null, sowingSeason: s.season || null, sowingMethod: null,
    suitableRegions: s.suitableRegions || null, suitableCrops: null,
    purpose: "Information not available", uses: [], benefits: (s.features || []).slice(),
    diseaseResistance: null, pestResistance: null,
    imageUrl: s.image || null, thumbnailUrl: null, imageType: "representative",
    imageSource: null, imageSourceUrl: null,
    source: s.source || "AgriMitra verified seed database", sourceUrl: null,
    lastUpdated: seedUpdated,
  });
  const seedText = (s) => [s.name, s.variety, s.crop, s.category, s.description,
    s.season, s.duration, s.soil, s.suitableRegions, (s.features || []).join(" ")].join(" ");
  add("GET", "/api/seeds", (req, res, q) => {
    let L = ds.seeds();
    if (q.crop) L = L.filter((s) => (s.crop || "").toLowerCase().includes(String(q.crop).toLowerCase()));
    if (q.q) L = L.filter((s) => ds.contains(seedText(s), q.q));
    sendJson(res, 200, { ...page(L.map(normSeed), q), source: "AgriMitra verified seed database", dataKind: "reference", lastUpdated: seedUpdated });
  });
  add("GET", "/api/seeds/search", (req, res, q) => {
    const term = str(q.q, "q", 80);
    if (!term) { const e = new Error("A search query is required."); e.code = "BAD_REQUEST"; e.status = 400; throw e; }
    const L = ds.seeds().filter((s) => ds.contains(seedText(s), term));
    sendJson(res, 200, { ...page(L.map(normSeed), q), source: "AgriMitra verified seed database", dataKind: "reference", lastUpdated: seedUpdated });
  });
  add("GET", "/api/seeds/code/:code", (req, res, q, p) => {
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const code = norm(decodeURIComponent(p.code || ""));
    if (!code) { const e = new Error("A product code is required."); e.code = "BAD_REQUEST"; e.status = 400; throw e; }
    const hit = ds.seeds().find((s) => [s.productCode, s.sku, s.gtin, s.barcode, s.varietyCode].filter(Boolean).some((c) => norm(c) === code));
    if (!hit) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Seed product code not found in the verified catalog." } });
    sendJson(res, 200, { item: normSeed(hit), source: "AgriMitra verified seed database", dataKind: "reference", lastUpdated: seedUpdated });
  });
  add("GET", "/api/seeds/barcode/:barcode", (req, res, q, p) => {
    const digits = String(decodeURIComponent(p.barcode || "")).replace(/\D/g, "");
    if (!digits) { const e = new Error("A barcode number is required."); e.code = "BAD_REQUEST"; e.status = 400; throw e; }
    const hit = ds.seeds().find((s) => [s.gtin, s.barcode, s.sku, s.productCode].filter(Boolean).some((c) => String(c).replace(/\D/g, "") === digits));
    if (!hit) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Barcode not found in the verified seed catalog." } });
    sendJson(res, 200, { item: normSeed(hit), source: "AgriMitra verified seed database", dataKind: "reference", lastUpdated: seedUpdated });
  });
  add("GET", "/api/seeds/brand/:brand", (req, res, q, p) => {
    const b = str(decodeURIComponent(p.brand || ""), "brand", 60);
    const L = ds.seeds().filter((s) => s.brand && ds.contains(s.brand, b));
    sendJson(res, 200, { ...page(L.map(normSeed), q), source: "AgriMitra verified seed database", dataKind: "reference", lastUpdated: seedUpdated, note: L.length ? "" : "No verified products for this brand in the current catalog." });
  });
  add("GET", "/api/seeds/crop/:crop", (req, res, q, p) => {
    const c = str(decodeURIComponent(p.crop || ""), "crop", 60);
    const L = ds.seeds().filter((s) => (s.crop || "").toLowerCase().includes(c.toLowerCase()));
    sendJson(res, 200, { ...page(L.map(normSeed), q), source: "AgriMitra verified seed database", dataKind: "reference", lastUpdated: seedUpdated });
  });
  add("GET", "/api/seeds/:seedId", (req, res, q, p) => {
    const s = ds.seed(decodeURIComponent(p.id));
    if (!s) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Seed variety not found." } });
    sendJson(res, 200, { item: normSeed(s), source: "AgriMitra verified seed database", dataKind: "reference", lastUpdated: seedUpdated });
  });
  add("GET", "/api/fertilizers", (req, res, q) => {
    let L = ds.fertilizers();
    if (q.category) L = L.filter((f) => f.category === q.category);
    if (q.type) L = L.filter((f) => f.type === q.type);
    if (q.brand) L = L.filter((f) => ds.contains(f.name, q.brand));
    if (q.crop) L = L.filter((f) => (f.suitableCrops || []).join(" ").toLowerCase().includes(String(q.crop).toLowerCase()));
    if (q.formulation) L = L.filter((f) => fertFormulation(f) === q.formulation);
    if (q.grade) L = L.filter((f) => { const g = /(\d{1,2}:\d{1,2}:\d{1,2})/.exec(f.name || ""); return g ? g[1] === q.grade : false; });
    if (q.q) L = L.filter((f) => ds.contains(fertSearchText(f), q.q));
    sendJson(res, 200, { ...page(L.map(normFert), q), source: "AgriMitra verified fertilizer database (FCO grades)", dataKind: "reference", lastUpdated: fertUpdated });
  });
  add("GET", "/api/fertilizers/search", (req, res, q) => {
    const term = str(q.q, "q", 80);
    if (!term) { const e = new Error("A search query is required."); e.code = "BAD_REQUEST"; e.status = 400; throw e; }
    const L = ds.fertilizers().filter((f) => ds.contains(fertSearchText(f), term));
    sendJson(res, 200, { ...page(L.map(normFert), q), source: "AgriMitra verified fertilizer database (FCO grades)", dataKind: "reference", lastUpdated: fertUpdated });
  });
  add("GET", "/api/fertilizers/brands", (req, res) => {
    sendJson(res, 200, { brands: [], note: "No verified brand records in this database. Brand/manufacturer fields are null — never invented." });
  });
  add("GET", "/api/fertilizers/categories", (req, res) => {
    const cats = [...new Set(ds.fertilizers().map((f) => f.category).filter(Boolean))].sort();
    sendJson(res, 200, { categories: cats });
  });
  add("GET", "/api/fertilizers/crops", (req, res) => {
    const set = new Set();
    ds.fertilizers().forEach((f) => (f.suitableCrops || []).forEach((c) => { if (c) set.add(c); }));
    sendJson(res, 200, { crops: [...set].sort() });
  });
  add("GET", "/api/fertilizers/code/:code", (req, res, q, p) => {
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const code = norm(decodeURIComponent(p.code || ""));
    if (!code) { const e = new Error("A product code is required."); e.code = "BAD_REQUEST"; e.status = 400; throw e; }
    const hit = ds.fertilizers().find((f) => [f.productCode, f.sku, f.gtin, f.barcode, f.registrationNumber].filter(Boolean).some((c) => norm(c) === code));
    if (!hit) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Product code not found in the verified catalog." } });
    sendJson(res, 200, { item: normFert(hit), source: "AgriMitra verified fertilizer database (FCO grades)", dataKind: "reference", lastUpdated: fertUpdated });
  });
  add("GET", "/api/fertilizers/barcode/:barcode", (req, res, q, p) => {
    const digits = String(decodeURIComponent(p.barcode || "")).replace(/\D/g, "");
    if (!digits) { const e = new Error("A barcode number is required."); e.code = "BAD_REQUEST"; e.status = 400; throw e; }
    const hit = ds.fertilizers().find((f) => [f.gtin, f.barcode, f.sku, f.productCode].filter(Boolean).some((c) => String(c).replace(/\D/g, "") === digits));
    if (!hit) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Product code not found in the verified catalog." } });
    sendJson(res, 200, { item: normFert(hit), source: "AgriMitra verified fertilizer database (FCO grades)", dataKind: "reference", lastUpdated: fertUpdated });
  });
  add("GET", "/api/fertilizers/brand/:brand", (req, res, q, p) => {
    const b = str(decodeURIComponent(p.brand || ""), "brand", 60);
    const L = ds.fertilizers().filter((f) => f.brand && ds.contains(f.brand, b));
    sendJson(res, 200, { ...page(L.map(normFert), q), source: "AgriMitra verified fertilizer database (FCO grades)", dataKind: "reference", lastUpdated: fertUpdated, note: L.length ? "" : "No verified products for this brand in the current catalog." });
  });
  add("GET", "/api/fertilizers/:fertilizerId", (req, res, q, p) => {
    const f = ds.fertilizer(decodeURIComponent(p.id));
    if (!f) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Fertilizer not found." } });
    sendJson(res, 200, { item: normFert(f), source: "AgriMitra verified fertilizer database (FCO grades)", dataKind: "reference", lastUpdated: fertUpdated });
  });
  add("GET", "/api/farming-types", (req, res, q) => {
    let L = ds.farmingTypes();
    if (q.q) L = L.filter((f) => ds.contains(f.name + " " + (f.overview || ""), q.q));
    sendJson(res, 200, { ...page(L, q), source: "AgriMitra verified farming-types database" });
  });
  add("GET", "/api/farming-types/:farmingTypeId", (req, res, q, p) => {
    const f = ds.farmingType(decodeURIComponent(p.id));
    if (!f) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Farming type not found." } });
    sendJson(res, 200, { item: f, source: "AgriMitra verified farming-types database" });
  });
  add("GET", "/api/paddy-varieties", (req, res, q) => {
    let L = ds.paddy();
    if (q.group) L = L.filter((v) => ds.contains(v.name, q.group));
    if (q.q) L = L.filter((v) => ds.contains(v.name, q.q));
    sendJson(res, 200, { ...page(L, q), source: "AgriMitra verified paddy database" });
  });
  add("GET", "/api/paddy-varieties/:varietyId", (req, res, q, p) => {
    const v = ds.paddyOne(decodeURIComponent(p.id));
    if (!v) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Paddy variety not found." } });
    sendJson(res, 200, { item: v, source: "AgriMitra verified paddy database" });
  });
}
module.exports = { register };
