"use strict";
/* Weather provider (OpenWeather-compatible base, replaceable) → normalized. */
const { fetchJson } = require("../utils/http");
const { createCache } = require("../utils/cache");
const logger = require("../utils/logger");
const cache = createCache();
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
async function getWeather(cfg, f) {
  if (!cfg.weatherApiKey) { const e = new Error("Weather API not configured"); e.code = "NOT_CONFIGURED"; throw e; }
  const key = "wx:" + JSON.stringify(f);
  const hit = cache.get(key);
  if (hit) { hit.cached = true; return hit; }
  const loc = f.lat !== undefined ? `lat=${f.lat}&lon=${f.lon}` : `q=${encodeURIComponent(f.q || "")}`;
  let cur, fc;
  try {
    cur = await fetchJson(`${cfg.weatherApiUrl}/weather?${loc}&appid=${cfg.weatherApiKey}&units=metric`);
    fc = await fetchJson(`${cfg.weatherApiUrl}/forecast?${loc}&appid=${cfg.weatherApiKey}&units=metric&cnt=40`);
  } catch (e) {
    logger.warn("weather upstream failed", { code: e && e.code });
    const y = new Error("Upstream unavailable"); y.code = "UPSTREAM_UNAVAILABLE"; throw y;
  }
  const byDay = {};
  (fc.list || []).forEach((it) => {
    const d = String(it.dt_txt || "").slice(0, 10);
    if (!d) return;
    (byDay[d] = byDay[d] || []).push(it);
  });
  const forecast = Object.keys(byDay).sort().slice(0, 7).map((d) => {
    const arr = byDay[d];
    const ts = arr.map((x) => x.main && x.main.temp).filter((x) => typeof x === "number");
    const rains = arr.filter((x) => (x.rain && x.rain["3h"]) || /rain/i.test((x.weather || [])[0] ? x.weather[0].main : "")).length;
    return {
      date: d,
      tempMin: ts.length ? Math.min(...ts) : null,
      tempMax: ts.length ? Math.max(...ts) : null,
      condition: (arr[Math.floor(arr.length / 2)].weather || [])[0] ? arr[Math.floor(arr.length / 2)].weather[0].main : "",
      rainChance: Math.round((rains / arr.length) * 100),
    };
  });
  const out = {
    location: (cur.name || f.q || "") + (cur.sys && cur.sys.country ? ", " + cur.sys.country : ""),
    temperature: num(cur.main && cur.main.temp),
    humidity: num(cur.main && cur.main.humidity),
    rainfall: num(cur.rain && (cur.rain["1h"] || cur.rain["3h"])),
    windSpeed: num(cur.wind && cur.wind.speed),
    weatherCondition: (cur.weather || [])[0] ? cur.weather[0].main : "",
    forecast,
    source: "OpenWeather (configurable provider)", fetchedAt: new Date().toISOString(),
    isLive: true, cached: false,
  };
  cache.set(key, out, cfg.cacheTtlMs);
  return out;
}
module.exports = { getWeather };
