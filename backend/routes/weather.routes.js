"use strict";
const weather = require("../services/weatherService");
const { sendJson } = require("../middleware/errorHandler");
const { str, float } = require("../middleware/validation");
function register(routes, cfg) {
  routes.push({
    method: "GET", path: "/api/weather",
    fn: async (req, res, q) => {
      const lat = float(q.lat, "lat", -90, 90), lon = float(q.lon, "lon", -180, 180);
      const place = str(q.q || q.place, "place");
      if ((lat === undefined) !== (lon === undefined)) {
        const e = new Error("lat and lon must be provided together, or use q=placename.");
        e.code = "BAD_REQUEST"; e.status = 400; throw e;
      }
      if (lat === undefined && !place) {
        const e = new Error("Provide lat+lon or q=placename.");
        e.code = "BAD_REQUEST"; e.status = 400; throw e;
      }
      const out = await weather.getWeather(cfg, { lat, lon, q: place });
      sendJson(res, 200, out);
    },
  });
}
module.exports = { register };
