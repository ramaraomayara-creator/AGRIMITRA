"use strict";
/* Tiny in-memory TTL cache. */
function createCache() {
  const m = new Map();
  return {
    get(k) {
      const e = m.get(k);
      if (!e) return null;
      if (Date.now() > e.exp) { m.delete(k); return null; }
      return e.val;
    },
    set(k, val, ttlMs) { m.set(k, { val, exp: Date.now() + ttlMs }); if (m.size > 500) m.delete(m.keys().next().value); },
    stats() { return { entries: m.size }; },
  };
}
module.exports = { createCache };
