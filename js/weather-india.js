"use strict";
/* India-wide weather UI: searchable cities/districts plus state/UT capital shortcuts.
 * Uses Open-Meteo's keyless geocoding and forecast APIs; no invented fallback values. */
(function () {
  const GEO = "https://geocoding-api.open-meteo.com/v1/search";
  const FORECAST = "https://api.open-meteo.com/v1/forecast";
  const LOCATIONS = [
    ["Andhra Pradesh","Vijayawada",16.5062,80.648],
    ["Arunachal Pradesh","Itanagar",27.0844,93.6053],
    ["Assam","Guwahati",26.1445,91.7362],
    ["Bihar","Patna",25.5941,85.1376],
    ["Chhattisgarh","Raipur",21.2514,81.6296],
    ["Goa","Panaji",15.4909,73.8278],
    ["Gujarat","Gandhinagar",23.2156,72.6369],
    ["Haryana","Chandigarh",30.7333,76.7794],
    ["Himachal Pradesh","Shimla",31.1048,77.1734],
    ["Jharkhand","Ranchi",23.3441,85.3096],
    ["Karnataka","Bengaluru",12.9716,77.5946],
    ["Kerala","Thiruvananthapuram",8.5241,76.9366],
    ["Madhya Pradesh","Bhopal",23.2599,77.4126],
    ["Maharashtra","Mumbai",19.076,72.8777],
    ["Manipur","Imphal",24.817,93.9368],
    ["Meghalaya","Shillong",25.5788,91.8933],
    ["Mizoram","Aizawl",23.7271,92.7176],
    ["Nagaland","Kohima",25.6751,94.1086],
    ["Odisha","Bhubaneswar",20.2961,85.8245],
    ["Punjab","Amritsar",31.634,74.8723],
    ["Rajasthan","Jaipur",26.9124,75.7873],
    ["Sikkim","Gangtok",27.3389,88.6065],
    ["Tamil Nadu","Chennai",13.0827,80.2707],
    ["Telangana","Hyderabad",17.385,78.4867],
    ["Tripura","Agartala",23.8315,91.2868],
    ["Uttar Pradesh","Lucknow",26.8467,80.9462],
    ["Uttarakhand","Dehradun",30.3165,78.0322],
    ["West Bengal","Kolkata",22.5726,88.3639],
    ["Andaman and Nicobar Islands","Port Blair",11.6234,92.7265],
    ["Chandigarh","Chandigarh",30.7333,76.7794],
    ["Dadra and Nagar Haveli and Daman and Diu","Daman",20.3974,72.8328],
    ["Delhi","New Delhi",28.6139,77.209],
    ["Jammu and Kashmir","Srinagar",34.0837,74.7973],
    ["Ladakh","Leh",34.1526,77.5771],
    ["Lakshadweep","Kavaratti",10.5667,72.6417],
    ["Puducherry","Puducherry",11.9416,79.8083]
  ];
  let searchSeq = 0;
  let activePlace = null;

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }
  function icon(code) {
    if (code === 0) return "☀️";
    if ([1,2].includes(code)) return "⛅";
    if (code === 3) return "☁️";
    if ([45,48].includes(code)) return "🌫️";
    if ([51,53,55,56,57].includes(code)) return "🌦️";
    if ([61,63,65,66,67,80,81,82].includes(code)) return "🌧️";
    if ([71,73,75,77,85,86].includes(code)) return "🌨️";
    if ([95,96,99].includes(code)) return "⛈️";
    return "🌤️";
  }
  function condition(code) {
    const labels = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",
      51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Heavy freezing drizzle",
      61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Heavy freezing rain",
      71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Rain showers",81:"Rain showers",
      82:"Heavy rain showers",85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorm",
      96:"Thunderstorm with hail",99:"Thunderstorm with hail"};
    return labels[code] || "Conditions unavailable";
  }
  async function getJSON(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, {headers:{Accept:"application/json"}, signal:controller.signal, cache:"no-store"});
      if (!res.ok) throw new Error("HTTP_" + res.status);
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }
  function renderPlaceOptions(items) {
    const box = document.getElementById("wxIndiaSuggest");
    if (!box) return;
    box.innerHTML = items.length ? items.map((p, i) =>
      '<button type="button" class="btn btn-sm" data-wx-choice="' + i + '" style="margin:4px">' +
      esc(p.name) + (p.admin1 ? ", " + esc(p.admin1) : "") + '</button>'
    ).join("") : "";
    box._wxItems = items;
    box.querySelectorAll("[data-wx-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = box._wxItems[Number(btn.getAttribute("data-wx-choice"))];
        if (!p) return;
        activePlace = p;
        const input = document.getElementById("wxIndiaPlace");
        if (input) input.value = [p.name, p.admin1].filter(Boolean).join(", ");
        box.innerHTML = "";
        loadWeather(p);
      });
    });
  }
  async function searchPlaces(query) {
    const seq = ++searchSeq;
    if (query.trim().length < 2) { renderPlaceOptions([]); return; }
    try {
      const url = GEO + "?name=" + encodeURIComponent(query.trim()) +
        "&count=8&language=en&format=json&countryCode=IN";
      const data = await getJSON(url);
      if (seq !== searchSeq) return;
      const items = (data.results || []).filter(p => p.country_code === "IN");
      renderPlaceOptions(items);
      if (!items.length) {
        const box = document.getElementById("wxIndiaSuggest");
        if (box) box.textContent = "No matching Indian city or district found. Try another spelling.";
      }
    } catch (_) {
      if (seq === searchSeq) renderPlaceOptions([]);
    }
  }
  function fmtTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit"});
  }
  function fmtDay(value) {
    const d = new Date(value + "T00:00:00");
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN", {weekday:"short",day:"2-digit",month:"short"});
  }
  function pageWeatherIndia() {
    const savedRaw = store.get("location", "Guntur, Andhra Pradesh");
    const saved = String(savedRaw || "Guntur, Andhra Pradesh").replace(/,\\s*AP$/i, ", Andhra Pradesh").replace(/,\\s*TS$/i, ", Telangana");
    const options = LOCATIONS.map((p, i) => '<option value="' + i + '">' + esc(p[0] + " — " + p[1]) + '</option>').join("");
    return '<div class="section-title"><h2>India Weather Dashboard <span class="badge blue">Open-Meteo forecast</span></h2></div>' +
      '<div class="card" style="margin-bottom:14px">' +
      '<div class="form"><label>State / Union Territory<select id="wxIndiaState"><option value="">Choose a state or UT</option>' + options + '</select></label>' +
      '<label>Search city, town or district<input id="wxIndiaPlace" value="' + esc(saved) + '" placeholder="e.g. Guntur, Vijayawada, Pune" autocomplete="off"></label>' +
      '<button class="btn btn-primary" id="wxIndiaGo" type="button">Get weather</button></div>' +
      '<div id="wxIndiaSuggest" aria-live="polite" style="margin-top:8px"></div></div>' +
      '<div id="wxIndiaOut" aria-live="polite"><div class="card">Choose a state or search for an Indian city or district.</div></div>' +
      '<p class="muted small">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>. Forecast/model data may differ from local observations. Follow official IMD alerts and local agriculture advisories for field decisions.</p>';
  }
  async function loadWeather(place) {
    const out = document.getElementById("wxIndiaOut");
    if (!out) return;
    out.innerHTML = '<div class="card"><p>Loading forecast…</p></div>';
    try {
      let p = place;
      if (!p || typeof p.latitude !== "number" || typeof p.longitude !== "number") {
        const query = typeof place === "string" ? place : "";
        const g = await getJSON(GEO + "?name=" + encodeURIComponent(query) + "&count=1&language=en&format=json&countryCode=IN");
        p = (g.results || []).find(x => x.country_code === "IN");
        if (!p) throw new Error("PLACE_NOT_FOUND");
      }
      const qs = new URLSearchParams({
        latitude:String(p.latitude), longitude:String(p.longitude),
        current:"temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset",
        forecast_days:"7", timezone:"auto", temperature_unit:"celsius", wind_speed_unit:"kmh", precipitation_unit:"mm"
      });
      const d = await getJSON(FORECAST + "?" + qs.toString());
      const c = d.current || {}, day = d.daily || {};
      if (typeof c.temperature_2m !== "number") throw new Error("NO_WEATHER_DATA");
      const days = (day.time || []).map((date, i) =>
        '<div class="card" style="text-align:center"><b>' + esc(fmtDay(date)) + '</b>' +
        '<div style="font-size:30px">' + icon(day.weather_code && day.weather_code[i]) + '</div>' +
        '<p><b>' + esc(day.temperature_2m_max && day.temperature_2m_max[i]) + '° / ' +
        esc(day.temperature_2m_min && day.temperature_2m_min[i]) + '°C</b><br><small>Rain chance ' +
        esc(day.precipitation_probability_max && day.precipitation_probability_max[i] != null ? day.precipitation_probability_max[i] + "%" : "—") +
        ' • ' + esc(day.precipitation_sum && day.precipitation_sum[i] != null ? day.precipitation_sum[i] + " mm" : "—") + '</small></p></div>'
      ).join("");
      const placeName = [p.name, p.admin1, p.country].filter(Boolean).join(", ");
      const advice = [];
      const rain = day.precipitation_probability_max && day.precipitation_probability_max[0];
      if (typeof rain === "number" && rain >= 60) advice.push("Rain probability is high today; check drainage and avoid unnecessary irrigation.");
      else if (typeof rain === "number") advice.push("Check soil moisture and crop stage before irrigating; forecast rain probability is " + rain + "%.");
      if (typeof c.wind_speed_10m === "number" && c.wind_speed_10m >= 20) advice.push("Wind is elevated; check local advisories and product labels before any spraying.");
      if (typeof c.relative_humidity_2m === "number" && c.relative_humidity_2m >= 80) advice.push("High humidity may increase disease pressure; scout susceptible crops.");
      if (!advice.length) advice.push("Use the forecast together with soil moisture, crop stage and local agriculture advisories.");
      out.innerHTML = '<div class="grid g4">' +
        '<div class="card"><div class="icon">' + icon(c.weather_code) + '</div><h3>' + esc(c.temperature_2m) + '°C</h3><p class="muted">' + esc(placeName) + ' • ' + esc(condition(c.weather_code)) + '</p></div>' +
        '<div class="card"><h3>Humidity</h3><p><b>' + esc(c.relative_humidity_2m) + '%</b></p><p class="muted">Precipitation: ' + esc(c.precipitation) + ' mm</p></div>' +
        '<div class="card"><h3>Wind</h3><p><b>' + esc(c.wind_speed_10m) + ' km/h</b></p><p class="muted">Feels like ' + esc(c.apparent_temperature) + '°C</p></div>' +
        '<div class="card"><h3>Sun</h3><p>Rise ' + esc(fmtTime(day.sunrise && day.sunrise[0])) + '<br>Set ' + esc(fmtTime(day.sunset && day.sunset[0])) + '</p><p class="muted">Model time: ' + esc(c.time || "—") + '</p></div>' +
        '</div><div class="section-title"><h2>7-day forecast</h2></div><div class="grid g4">' + days + '</div>' +
        '<div class="section-title"><h2>Farm weather checks</h2></div><div class="card"><ul>' + advice.map(x => '<li>' + esc(x) + '</li>').join("") + '</ul></div>';
      store.set("location", placeName);
    } catch (e) {
      const msg = e.message === "PLACE_NOT_FOUND" ? "Place not found in India. Try a city or district name, or choose a state / UT." :
        e.name === "AbortError" ? "Weather request timed out. Please try again." :
        e.message === "NO_WEATHER_DATA" ? "The weather service returned no current forecast for this location." :
        "The weather service could not be reached. Check your connection and try again.";
      out.innerHTML = '<div class="alert"><b>Weather unavailable.</b> ' + esc(msg) + '<br><button class="btn btn-sm" id="wxIndiaRetry" type="button">Try again</button></div>';
      const retry = document.getElementById("wxIndiaRetry");
      if (retry) retry.addEventListener("click", () => loadWeather(activePlace || (document.getElementById("wxIndiaPlace") || {}).value || ""));
    }
  }
  function bindWeatherIndia() {
    if (!document.getElementById("wxIndiaOut")) return;
    const state = document.getElementById("wxIndiaState");
    const input = document.getElementById("wxIndiaPlace");
    const go = document.getElementById("wxIndiaGo");
    if (state) state.addEventListener("change", () => {
      const index = state.value === "" ? -1 : Number(state.value);
      const entry = LOCATIONS[index];
      if (!entry) return;
      if (input) input.value = entry[1] + ", " + entry[0];
      activePlace = {name:entry[1],admin1:entry[0],country:"India",latitude:entry[2],longitude:entry[3]};
      loadWeather(activePlace);
    });
    if (input) {
      input.addEventListener("input", () => { activePlace = null; searchPlaces(input.value); });
      input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); loadWeather(activePlace || input.value.trim()); } });
    }
    if (go) go.addEventListener("click", () => loadWeather(activePlace || (input ? input.value.trim() : "")));
    loadWeather(input ? input.value.trim() : "Guntur, Andhra Pradesh");
  }
  window.pageWeather = pageWeatherIndia;
  const previousRender = window.render;
  if (typeof previousRender === "function") {
    window.render = function () {
      previousRender.apply(this, arguments);
      if ((location.hash || "").replace(/^#\/?/, "").split("?")[0] === "weather") setTimeout(bindWeatherIndia, 0);
    };
  }
})();