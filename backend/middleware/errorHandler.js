"use strict";
const logger = require("../utils/logger");
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}
/* Never leak stacks or keys to clients; log full detail server-side. */
function errorHandler(err, req, res) {
  logger.error("request failed", { url: req.url, code: err && err.code, message: err && err.message });
  if (err && err.code === "BAD_REQUEST") return sendJson(res, 400, { error: { code: "BAD_REQUEST", message: err.message || "Invalid request." } });
  if (err && err.code === "NOT_CONFIGURED") return sendJson(res, 503, { error: { code: "NOT_CONFIGURED", message: "This data source is not configured on the server." } });
  if (err && (err.code === "RATE_LIMITED" || err.code === "UPSTREAM_AUTH")) return sendJson(res, 502, { error: { code: "UPSTREAM_UNAVAILABLE", message: "External data service is unavailable right now." } });
  if (err && (err.code === "TIMEOUT" || err.code === "NETWORK" || err.code === "TOOBIG" || err.code === "BADJSON" || (err.code || "").startsWith("HTTP_"))) {
    return sendJson(res, 502, { error: { code: "UPSTREAM_UNAVAILABLE", message: "External data service is unavailable right now." } });
  }
  return sendJson(res, 500, { error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again later." } });
}
function notFound(req, res) {
  sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Unknown API endpoint." } });
}
module.exports = { sendJson, errorHandler, notFound };
