"use strict";
/* CORS + basic security headers. No secrets ever leave here. */
function security(cfg) {
  const allowed = new Set([cfg.frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"]);
  return (req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader("Access-Control-Allow-Origin", allowed.has(origin) ? origin : cfg.frontendUrl);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
    next();
  };
}
module.exports = { security };
