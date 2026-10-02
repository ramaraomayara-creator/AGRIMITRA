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
      market: "AGMARKNET 2.0 → OGD → CEDA fallback chain",
      images: "configured",
      weather: "configured (Open-Meteo, keyless)",
    },
  }),
});
require("./routes/catalog.routes").register(routes);
require("./routes/market.routes").register(routes, cfg);
require("./routes/weather.routes").register(routes, cfg);
require("./routes/images.routes").register(routes, cfg);
createApp(cfg, routes).listen(cfg.port, () => {
  logger.info(`AgriMitra backend on http://localhost:${cfg.port}`);
  logger.info(`market=AGMARKNET 2.0 primary; OGD/CEDA optional fallbacks weather=Open-Meteo (keyless) images=commons (keyless)`);
});
