"use strict";
/* Keyless weather provider using Open-Meteo. No weather API key is required for the free non-commercial API. */
const { fetchJson } = require("../utils/http");
const { createCache } = require("../utils/cache");
const cache = createCache();

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function weatherText(code) {
  const m = {
    0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",
    51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Heavy freezing drizzle",
    61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Heavy freezing rain",
    71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Rain showers",81:"Rain showers",
    82:"Heavy rain showers",85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorm",
    96:"Thunderstorm with hail",99:"Thunderstorm with hail"
  };
  return m[code] || "Current conditions";
}

async function getWeather(cfg, f) {
  const key = "wx-open-meteo:" + JSON.stringify(f);
  const hit = cache.get(key);
  if (hit) { hit.cached = true; return hit; }

  let lat = f.lat, lon = f.lon, place = f.q || "";
  if (lat === undefined || lon === undefined) {
    const g = await fetchJson(GEOCODE_URL + "?name=" + encodeURIComponent(place) + "&count=1&language=en&format=json");
    if (!g.results || !g.results.length) {
      const e = new Error("Place not found"); e.code = "PLACE_NOT_FOUND"; throw e;
    }
    lat = g.results[0].latitude;
    lon = g.results[0].longitude;
    place = g.results[0].name;
  }

  const qs = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset",
    forecast_days: "7", timezone: "auto",
    temperature_unit: "celsius", wind_speed_unit: "kmh", precipitation_unit: "mm"
  });

  const d = await fetchJson(FORECAST_URL + "?" + qs.toString());
  const c = d.current || {}, dl = d.daily || {};
  const forecast = (dl.time || []).map((date, i) => ({
    date,
    tempMin: num(dl.temperature_2m_min && dl.temperature_2m_min[i]),
    tempMax: num(dl.temperature_2m_max && dl.temperature_2m_max[i]),
    rainChance: num(dl.precipitation_probability_max && dl.precipitation_probability_max[i]),
    precipitation: num(dl.precipitation_sum && dl.precipitation_sum[i]),
    weatherCode: dl.weather_code && dl.weather_code[i],
    condition: weatherText(dl.weather_code && dl.weather_code[i])
  }));

  const out = {
    location: place || (lat + ", " + lon),
    latitude: num(lat), longitude: num(lon),
    temperature: num(c.temperature_2m),
    apparentTemperature: num(c.apparent_temperature),
    humidity: num(c.relative_humidity_2m),
    rainfall: num(c.precipitation),
    windSpeed: num(c.wind_speed_10m),
    weatherCode: c.weather_code,
    weatherCondition: weatherText(c.weather_code),
    forecast,
    timezone: d.timezone || "",
    timezoneAbbreviation: d.timezone_abbreviation || "",
    currentTime: c.time || "",
    source: "Open-Meteo",
    sourceUrl: "https://open-meteo.com/",
    fetchedAt: new Date().toISOString(),
    isLive: true,
    cached: false
  };
  cache.set(key, out, cfg.cacheTtlMs);
  return out;
}
module.exports = { getWeather };