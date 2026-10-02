"use strict";
/* Loads the existing frontend data files once at boot (no duplication):
 * js/data.js, src/data/crops.js, farmingTypes.js, fertilizers.js,
 * paddyVarieties.js, seedVarieties.js — evaluated in a sandbox with window={}. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const logger = require("../utils/logger");

const ROOT = path.join(__dirname, "..", "..");
const FILES = [
  "js/data.js",
  "src/data/crops.js",
  "src/data/farmingTypes.js",
  "src/data/fertilizers.js",
  "src/data/paddyVarieties.js",
  "src/data/seedVarieties.js",
  "js/fertImages.js",
];
let W = null;
function slug(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}
function load() {
  if (W) return W;
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  FILES.forEach((f) => {
    const code = fs.readFileSync(path.join(ROOT, f), "utf8");
    vm.runInContext(code, sandbox, { filename: f });
  });
  W = sandbox.window;
  if (!W.DB) throw new Error("data bridge failed: js/data.js missing");
  logger.info("data bridge loaded", {
    crops: (W.CROPS_DATA || []).length,
    fertilizers: (W.FERTILIZERS || []).length,
    farmingTypes: ((W.DB.farmingTypes || []).length) + ((W.FT_NEW || []).length) + ((W.FT_MORE || []).length),
    paddy: (W.PADDY_VARIETIES || []).length,
    seeds: (W.SEED_VARIETIES || []).length,
  });
  return W;
}
function farmingTypesAll() {
  const ext = W.FT_EXT || {};
  const seen = {}, out = [];
  const push = (b, e) => {
    const name = b.name || e.name;
    let id = slug((e && e.id) || name);
    if (seen[id]) id = id + "-2";
    seen[id] = true;
    out.push({
      id, name, icon: b.icon || "🌾",
      definition: b.def || e.def || "", overview: e.short || b.def || "",
      purpose: e.purpose || b.adv || "", features: e.best || [],
      suitableCrops: b.crops || "", suitableSoils: b.soil || "",
      climate: b.climate || "", waterRequirement: b.water || "",
      landRequirement: e.land || "", process: e.proc || [],
      advantages: b.adv || "", limitations: b.lim || "",
      equipment: e.equipment || e.equip || [], technology: e.tech ? [e.tech] : [],
      investment: b.invest || "", suitableRegions: b.regions || "",
      bestPractices: e.best || [], image: e.img || "",
      sources: e.sources || "",
    });
  };
  (W.DB.farmingTypes || []).forEach((b) => { if (b && (b.name || b.def)) push(b, ext[b.name] || { name: b.name }); });
  ((W.FT_NEW || []).concat(W.FT_MORE || [])).forEach((n) => push(n, n));
  return out;
}
const contains = (hay, q) => String(hay || "").toLowerCase().includes(String(q || "").toLowerCase());
module.exports = {
  load, contains,
  crops: () => W.CROPS_DATA || [],
  crop: (id) => (W.CROPS_DATA || []).find((c) => c && (c.id === id || c.name === id)) || null,
  fertilizers: () => W.FERTILIZERS || [],
  fertilizer: (id) => (W.FERTILIZERS || []).find((f) => f && f.id === id) || null,
  fertCurated: (fertOrId) => {
  try {
    if (W.FERT_CURATED && W.FERT_CURATED.get) {
        const f = typeof fertOrId === "string" ? { id: fertOrId } : fertOrId;
        const c = W.FERT_CURATED.get(f);
        return c && c.imageUrl ? c : null;
      }
    } catch (e) {}
    return null;
  },
  farmingTypes: () => farmingTypesAll(),
  farmingType: (id) => farmingTypesAll().find((f) => f.id === id || f.name === id) || null,
  paddy: () => W.PADDY_VARIETIES || [],
  paddyOne: (id) => (W.PADDY_VARIETIES || []).find((v) => v && v.id === id) || null,
  seeds: () => W.SEED_VARIETIES || [],
  seed: (id) => (W.SEED_VARIETIES || []).find((s) => s && s.id === id) || null,
};
