/* AgriMitra frontend API client — talks to OUR backend only. No API keys here.
 * Base: same-origin by default (backend serves this site); override with
 * window.AGRIMITRA_API_BASE = "http://localhost:5000" when served separately.
 * Every call resolves to {ok, data} or {ok:false, code} — never throws. */
(function () {
  var BASE = (window.AGRIMITRA_API_BASE || "https://agrimitra-ramarao-api.onrender.com").replace(/\/$/, "");
  var mem = {};
  var TTL = 5 * 60 * 1000;
  function url(p) { return BASE + p; }
  function cached(k) {
    var e = mem[k];
    if (!e || Date.now() - e.at > TTL) return null;
    return e.data;
  }
  function setc(k, d) {
    mem[k] = { at: Date.now(), data: d };
    var ks = Object.keys(mem);
    if (ks.length > 80) delete mem[ks[0]];
  }
  function get(path, params) {
    var qs = "";
    if (params) {
      var p = new URLSearchParams();
      Object.keys(params).forEach(function (k) {
        if (params[k] !== undefined && params[k] !== null && params[k] !== "") p.set(k, params[k]);
      });
      var s = p.toString();
      if (s) qs = "?" + s;
    }
    var u = url(path) + qs;
    var hit = cached(u);
    if (hit) return Promise.resolve(hit);
    var ctrl = null, timer = null;
    try { ctrl = new AbortController(); timer = setTimeout(function () { ctrl.abort(); }, 25000); } catch (e) {}
    var opts = {};
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(u, opts).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok || (body && body.error)) {
          return { ok: false, code: (body.error && body.error.code) || ("HTTP_" + res.status) };
        }
        var out = { ok: true, data: body };
        setc(u, out);
        return out;
      });
    }, function () {
      if (timer) clearTimeout(timer);
      return { ok: false, code: "NETWORK_ERROR" };
    });
  }
  function friendly(code) {
    if (code === "NOT_CONFIGURED") return "This live data source is not configured on the server.";
    return "Live data temporarily unavailable.";
  }
  window.Api = {
    base: function () { return BASE || "(same origin)"; },
    clearCache: function () { mem = {}; },
    health: function () { return get("/api/health"); },
    crops: function (p) { return get("/api/crops", p); },
    crop: function (id) { return get("/api/crops/" + encodeURIComponent(id)); },
    seeds: function (p) { return get("/api/seeds", p); },
    seed: function (id) { return get("/api/seeds/" + encodeURIComponent(id)); },
    seedImage: function (name, opts) { const p = { name: name }; opts = opts || {}; ["variety", "crop", "brand", "manufacturer", "productCode", "category"].forEach(k => { if (opts[k]) p[k] = opts[k]; }); return get("/api/images/seed", p); },
    seedByCode: function (code) { return get("/api/seeds/code/" + encodeURIComponent(code)); },
    seedByBarcode: function (code) { return get("/api/seeds/barcode/" + encodeURIComponent(code)); },
    fertilizers: function (p) { return get("/api/fertilizers", p); },
    fertilizer: function (id) { return get("/api/fertilizers/" + encodeURIComponent(id)); },
    farmingTypes: function (p) { return get("/api/farming-types", p); },
    farmingType: function (id) { return get("/api/farming-types/" + encodeURIComponent(id)); },
    paddyVarieties: function (p) { return get("/api/paddy-varieties", p); },
    paddyVariety: function (id) { return get("/api/paddy-varieties/" + encodeURIComponent(id)); },
    marketPrices: function (p) { return get("/api/market/prices", p); },
    markets: function (p) { return get("/api/market/markets", p); },
    weather: function (p) { return get("/api/weather", p); },
    searchImages: function (q) { return get("/api/images/search", { query: q }); },
    fertilizerImage: function (name, opts) { const p = { name: name }; opts = opts || {}; ["brand", "type", "grade", "category"].forEach(k => { if (opts[k]) p[k] = opts[k]; }); return get("/api/images/fertilizer", p); },
    fertilizerImageById: function (id) { return get("/api/fertilizers/" + encodeURIComponent(id) + "/image"); },
    fertSearch: function (q) { return get("/api/fertilizers/search", { q: q }); },
    fertByCode: function (code) { return get("/api/fertilizers/code/" + encodeURIComponent(code)); },
    fertByBarcode: function (code) { return get("/api/fertilizers/barcode/" + encodeURIComponent(code)); },
    fertBrands: function () { return get("/api/fertilizers/brands"); },
    fertCats: function () { return get("/api/fertilizers/categories"); },
    fertCrops: function () { return get("/api/fertilizers/crops"); },
    friendly: friendly,
  };
  /* Optional hero-image upgrade: swap in a verified image when backend has one.
   * Never breaks layout; silently keeps the current image otherwise. */
  var healthOk = null;
  window.hydrateLiveImages = function () {
    if (healthOk !== null) { if (healthOk) swapAll(); return; }
    get("/api/health").then(function (r) {
      healthOk = !!(r.ok && r.data && r.data.status === "ok");
      if (healthOk) swapAll();
    });
    function swapAll() {
      document.querySelectorAll("img[data-liveq]").forEach(function (img) {
        var q = img.getAttribute("data-liveq");
        if (!q || img.datasetlivedone) return;
        img.datasetlivedone = "1";
        get("/api/images/search", { query: q }).then(function (r) {
          var u = r.ok && r.data && r.data.results && r.data.results[0] && r.data.results[0].imageUrl;
          if (u) {
            img.src = u;
            var cap = img.closest(".guide-hero");
                            cap = cap ? cap.querySelector(".inner .small") : null;
            if (cap) cap.textContent = "Verified image: " + (r.data.results[0].attribution || r.data.results[0].sourceName);
          }
        });
      });
    }
  };
})();
