"use strict";
/* AgriMitra backend entry. Run: node server.js (from agrimitra/backend). */
const cfg = require("./config");
const logger = require("./utils/logger");
const ds = require("./services/dataStore");
const { createApp } = require("./app");
const { sendJson } = require("./middleware/errorHandler");
try {
  ds.load();
} catch (e) {
  logger.error("data bridge failed — cannot start", { message: e.message });
  process.exit(1);
}
const routes = [];
routes.push({
  method: "GET", path: "/api/health",
  fn: async (req, res) => sendJson(res, 200, {
    status: "ok", service: "AgriMitra Backend", timestamp: new Date().toISOString(),
    services: {
      market: cfg.marketApiKey ? "configured" : "unavailable",
      images: "configured",
      weather: cfg.weatherApiKey ? "configured" : "unavailable",
    },
  }),
});
require("./routes/catalog.routes").register(routes);
require("./routes/market.routes").register(routes, cfg);
require("./routes/weather.routes").register(routes, cfg);
require("./routes/images.routes").register(routes, cfg);
createApp(cfg, routes).listen(cfg.port, () => {
  logger.info(`AgriMitra backend on http://localhost:${cfg.port}`);
  logger.info(`market=${cfg.marketApiKey ? "configured" : "NOT configured (set DATA_GOV_API_KEY)"} weather=${cfg.weatherApiKey ? "configured" : "NOT configured"} images=commons (keyless)`);
});
