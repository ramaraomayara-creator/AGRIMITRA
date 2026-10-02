"use strict";
/* Sliding-window rate limiter (per IP, in-memory). */
function rateLimiter({ windowMs = 60000, max = 120 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const ip = (req.socket && req.socket.remoteAddress) || "unknown";
    const now = Date.now();
    let e = hits.get(ip);
    if (!e || now > e.reset) e = { count: 0, reset: now + windowMs };
    e.count += 1;
    hits.set(ip, e);
    if (hits.size > 2000) hits.delete(hits.keys().next().value);
    if (e.count > max) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { code: "RATE_LIMITED", message: "Too many requests. Please wait and retry." } }));
      return;
    }
    next();
  };
}
module.exports = { rateLimiter };
