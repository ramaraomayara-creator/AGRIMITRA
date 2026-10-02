"use strict";
const market = require("../services/marketService");
const { sendJson } = require("../middleware/errorHandler");
const { str, int } = require("../middleware/validation");
function register(routes, cfg) {
  routes.push({
    method: "GET", path: "/api/market/prices",
    fn: async (req, res, q) => {
      const out = await market.getPrices(cfg, {
        state: str(q.state, "state"), district: str(q.district, "district"),
        market: str(q.market, "market"), commodity: str(q.commodity || q.crop, "commodity"),
        variety: str(q.variety, "variety"), arrival_date: str(q.arrival_date || q.date, "date", 20),
        limit: int(q.limit, "limit", 1, 500, 200), offset: int(q.offset, "offset", 0, 100000, 0),
      });
      sendJson(res, 200, out);
    },
  });
  routes.push({
    method: "GET", path: "/api/market",
    fn: async (req, res, q) => {
      const out = await market.getPrices(cfg, {
        state: str(q.state, "state"), district: str(q.district, "district"),
        market: str(q.market, "market"), commodity: str(q.commodity || q.crop, "commodity"),
        variety: str(q.variety, "variety"), arrival_date: str(q.arrival_date || q.date, "date", 20),
        limit: int(q.limit, "limit", 1, 500, 100), offset: int(q.offset, "offset", 0, 100000, 0),
      });
      sendJson(res, 200, out);
    },
  });
  routes.push({
    method: "GET", path: "/api/market/markets",
    fn: async (req, res, q) => {
      const out = await market.getMarkets(cfg, { state: str(q.state, "state"), district: str(q.district, "district") });
      sendJson(res, 200, out);
    },
  });
}
module.exports = { register };
