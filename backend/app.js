"use strict";
/* Minimal app: middleware chain + :param routes + static frontend host. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { security } = require("./middleware/security");
const { rateLimiter } = require("./middleware/rateLimiter");
const { sendJson, errorHandler, notFound } = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const ROOT = path.join(__dirname, "..");
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon",
};
function compile(pathStr) {
  const names = [];
  const rx = "^" + pathStr.split("/").map((seg) => {
    if (seg.startsWith(":")) { names.push(seg.slice(1)); return "([^/]+)"; }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/") + "$";
  return { rx: new RegExp(rx), names };
}
function createApp(cfg, routes) {
  const compiled = routes.map((r) => ({ ...r, ...compile(r.path) }));
  const sec = security(cfg);
  const limit = rateLimiter({ windowMs: 60000, max: 120 });
  const strict = rateLimiter({ windowMs: 60000, max: 30 });
  return http.createServer((req, res) => {
    sec(req, res, () => {
      const u = new URL(req.url, "http://localhost");
      const q = Object.fromEntries(u.searchParams.entries());
      const run = async () => {
        if (u.pathname.startsWith("/api/")) {
          if (/^\/(api\/(market|images))(\/|$)/.test(u.pathname)) {
            await new Promise((ok) => strict(req, res, ok));
            if (res.writableEnded) return;
          } else {
            await new Promise((ok) => limit(req, res, ok));
            if (res.writableEnded) return;
          }
          if (req.method !== "GET" && req.method !== "OPTIONS") {
            return sendJson(res, 405, { error: { code: "NOT_FOUND", message: "Method not allowed." } });
          }
          for (const r of compiled) {
            if (r.method !== req.method) continue;
            const m = r.rx.exec(u.pathname);
            if (!m) continue;
            const params = {};
            r.names.forEach((n, i) => { params[n] = m[i + 1]; });
            try { await r.fn(req, res, q, params); }
            catch (e) { errorHandler(e, req, res); }
            return;
          }
          return notFound(req, res);
        }
        serveStatic(u, res);
      };
      run().catch((e) => errorHandler(e, req, res));
    });
  });
}
function serveStatic(u, res) {
  try {
    let p = decodeURIComponent(u.pathname);
    if (p === "/") p = "/index.html";
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT)) return sendJson(res, 403, { error: { code: "NOT_FOUND", message: "Not found." } });
    let stat;
    try { stat = fs.statSync(file); } catch (e) { stat = null; }
    if (!stat || stat.isDirectory() || path.extname(file) === "") {
      const idx = path.join(ROOT, "index.html");
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      fs.createReadStream(idx).pipe(res);
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    logger.error("static failed", { message: e.message });
    sendJson(res, 500, { error: { code: "SERVER_ERROR", message: "Something went wrong." } });
  }
}
module.exports = { createApp };
