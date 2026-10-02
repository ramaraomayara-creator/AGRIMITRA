"use strict";
/* Minimal .env loader (no dependencies): reads backend/.env, never overrides real env. */
const fs = require("fs");
const path = require("path");
function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
    txt.split(/\r?\n/).forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return;
      const i = t.indexOf("=");
      if (i < 0) return;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (k && !(k in process.env)) process.env[k] = v;
    });
  } catch (e) { /* .env optional */ }
}
loadEnv();
const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const cfg = {
  port: num(process.env.PORT, 5000),
  frontendUrl: (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, ""),
  marketApiKey: process.env.DATA_GOV_API_KEY || process.env.MARKET_API_KEY || "",
  agmarknetApiUrl: (process.env.AGMARKNET_API_URL || "https://api.agmarknet.gov.in/v1").replace(/\/$/, ""),
  cedaApiUrl: (process.env.CEDA_API_URL || "https://api.ceda.ashoka.edu.in").replace(/\/$/, ""),
  cedaApiKey: process.env.CEDA_API_KEY || "",
  marketApiUrl: process.env.MARKET_API_URL || "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
  marketDatasetUrl: process.env.MARKET_DATASET_URL || "https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi",
  imageApiUrl: process.env.IMAGE_API_URL || "https://commons.wikimedia.org/w/api.php",
  imageApiKey: process.env.IMAGE_API_KEY || "",
  weatherApiKey: process.env.WEATHER_API_KEY || "",
  weatherApiUrl: (process.env.WEATHER_API_URL || "https://api.openweathermap.org/data/2.5").replace(/\/$/, ""),
  cacheTtlMs: num(process.env.CACHE_TTL, 900) * 1000,
  imageCacheTtlMs: num(process.env.IMAGE_CACHE_TTL, 86400) * 1000,
};
module.exports = cfg;
