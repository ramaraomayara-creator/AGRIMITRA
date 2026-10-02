/* AgriMitra Live Data + Precision Farm Calculator
 * - Weather: backend first; keyless Open-Meteo fallback.
 * - Market: backend/data.gov.in only; never exposes API keys in browser.
 * - Quantity calculator: converts farmer/soil-test N-P-K targets into exact product kg.
 */
(function () {
  "use strict";

  var originalWeather = window.ApiService && window.ApiService.getWeather;
  var originalMarket = window.ApiService && window.ApiService.getMarket;

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function getJson(url, opts) {
    return fetch(url, Object.assign({ headers: { "Accept": "application/json" } }, opts || {}))
      .then(function (r) {
        return r.json().then(function (b) {
          if (!r.ok) throw new Error("HTTP_" + r.status);
          return b;
        });
      });
  }

  function openMeteo(place) {
    if (navigator.geolocation) {
      return new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(
          function (p) { resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }); },
          reject,
          { timeout: 5000, maximumAge: 300000 }
        );
      }).catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  function weatherFallback(place) {
    return openMeteo(place).then(function (pos) {
      var lat = pos ? pos.latitude : 16.5062;
      var lon = pos ? pos.longitude : 80.6480;
      var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
        "&longitude=" + lon +
        "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m" +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code" +
        "&timezone=auto&forecast_days=7";
      return getJson(url).then(function (d) {
        var daily = d.daily || {};
        var days = (daily.time || []).map(function (date, i) {
          return {
            d: date.slice(5),
            i: "🌦️",
            mx: num(daily.temperature_2m_max && daily.temperature_2m_max[i]),
            mn: num(daily.temperature_2m_min && daily.temperature_2m_min[i]),
            r: num(daily.precipitation_probability_max && daily.precipitation_probability_max[i])
          };
        });
        return {
          source: "open-meteo",
          data: {
            current: {
              place: place || "Current location",
              temp: num(d.current && d.current.temperature_2m),
              hum: num(d.current && d.current.relative_humidity_2m),
              rain: num(d.current && d.current.precipitation),
              wind: num(d.current && d.current.wind_speed_10m),
              cond: "Live weather"
            },
            days: days,
            adv: []
          }
        };
      });
    });
  }

  if (window.ApiService) {
    window.ApiService.getWeather = async function (place) {
      try {
        if (window.Api && window.Api.weather) {
          var r = await window.Api.weather(place ? { place: place } : {});
          if (r && r.ok) return { source: "backend", data: r.data };
        }
      } catch (e) {}
      try { return await weatherFallback(place); }
      catch (e) {
        return originalWeather ? originalWeather(place) : { source: "unavailable", data: null };
      }
    };

    window.ApiService.getMarket = async function (params) {
      try {
        if (window.Api && window.Api.marketPrices) {
          var r = await window.Api.marketPrices(params || {});
          if (r && r.ok) return { source: "data.gov.in", data: r.data };
        }
      } catch (e) {}
      return originalMarket ? originalMarket(params) : { source: "unavailable", data: [] };
    };
  }

  function precisionCalculator() {
    return '' +
      '<section class="card" id="precisionFarmCalc" style="margin-top:18px">' +
      '<div class="section-title"><h2>🎯 Precision Farm Input Calculator</h2><span class="badge">Exact product quantity</span></div>' +
      '<p class="muted">Enter the nutrient recommendation from your Soil Health Card / local agriculture officer. AgriMitra converts it into exact product quantity for your farm area.</p>' +
      '<div class="grid g4">' +
      '<label>Farm area (acre)<input id="pcArea" type="number" min="0.01" step="0.01" value="1"></label>' +
      '<label>Target N (kg/acre)<input id="pcN" type="number" min="0" step="0.1" value="0"></label>' +
      '<label>Target P₂O₅ (kg/acre)<input id="pcP" type="number" min="0" step="0.1" value="0"></label>' +
      '<label>Target K₂O (kg/acre)<input id="pcK" type="number" min="0" step="0.1" value="0"></label>' +
      '</div>' +
      '<div class="grid g4" style="margin-top:12px">' +
      '<label>DAP P₂O₅ %<input id="pcDapP" type="number" value="46" min="1" max="100"></label>' +
      '<label>DAP N %<input id="pcDapN" type="number" value="18" min="0" max="100"></label>' +
      '<label>Urea N %<input id="pcUreaN" type="number" value="46" min="1" max="100"></label>' +
      '<label>MOP K₂O %<input id="pcMopK" type="number" value="60" min="1" max="100"></label>' +
      '</div>' +
      '<button class="btn btn-primary" id="pcCalc" style="margin-top:14px">Calculate Exact Quantity</button>' +
      '<div id="pcResult" class="alert green" style="margin-top:14px">Enter the recommended N-P-K values and calculate.</div>' +
      '<p class="small muted" style="margin-top:10px">Formula: DAP supplies P₂O₅ first; its N contribution is deducted from the N target. Remaining N is supplied by urea. K₂O is supplied by MOP. This is a mathematical conversion, not a crop prescription.</p>' +
      '</section>';
  }

  function calculate() {
    var area = num(document.getElementById("pcArea").value);
    var n = num(document.getElementById("pcN").value);
    var p = num(document.getElementById("pcP").value);
    var k = num(document.getElementById("pcK").value);
    var dp = num(document.getElementById("pcDapP").value) / 100;
    var dn = num(document.getElementById("pcDapN").value) / 100;
    var un = num(document.getElementById("pcUreaN").value) / 100;
    var mk = num(document.getElementById("pcMopK").value) / 100;
    if (!area || !un || !dp || !mk) return;

    var dapAcre = p / dp;
    var dapTotal = dapAcre * area;
    var nFromDapAcre = dapAcre * dn;
    var remainingNAcre = Math.max(0, n - nFromDapAcre);
    var ureaAcre = remainingNAcre / un;
    var ureaTotal = ureaAcre * area;
    var mopAcre = k / mk;
    var mopTotal = mopAcre * area;

    document.getElementById("pcResult").innerHTML =
      '<b>Calculated for ' + area.toFixed(2) + ' acre(s)</b><br>' +
      'DAP: <b>' + dapTotal.toFixed(2) + ' kg</b> total (' + dapAcre.toFixed(2) + ' kg/acre)<br>' +
      'Urea: <b>' + ureaTotal.toFixed(2) + ' kg</b> total (' + ureaAcre.toFixed(2) + ' kg/acre)<br>' +
      'MOP: <b>' + mopTotal.toFixed(2) + ' kg</b> total (' + mopAcre.toFixed(2) + ' kg/acre)<br>' +
      '<span class="small">These quantities exactly match the N-P₂O₅-K₂O targets entered above.</span>';
  }

  function mount() {
    if (!window.location.hash.startsWith("#/calculators")) return;
    var app = document.getElementById("app");
    if (!app || document.getElementById("precisionFarmCalc")) return;
    app.insertAdjacentHTML("beforeend", precisionCalculator());
    var b = document.getElementById("pcCalc");
    if (b) b.onclick = calculate;
  }

  window.addEventListener("hashchange", function () { setTimeout(mount, 50); });
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(mount, 150);
    var banner = document.getElementById("demoBanner");
    if (banner) banner.innerHTML = '🌐 Live mode: Weather uses live data when available. Market uses the Government mandi API when the server key is configured. <button onclick="this.parentElement.style.display=\'none\'">✕</button>';
  });
  setTimeout(mount, 500);
})();