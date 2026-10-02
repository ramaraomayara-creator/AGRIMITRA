"use strict";
/* Query validators — reject bad input before any upstream call. */
const bad = (msg) => { const e = new Error(msg); e.code = "BAD_REQUEST"; e.status = 400; throw e; };
function str(v, name, max = 80) {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  if (s.length > max) bad(`Invalid ${name}`);
  if (/[<>]/.test(s)) bad(`Invalid ${name}`);
  return s;
}
function int(v, name, min, max, dflt) {
  if (v === undefined || v === null || v === "") return dflt;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < min || n > max) bad(`Invalid ${name}`);
  return n;
}
function float(v, name, min, max) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = parseFloat(v);
  if (!Number.isFinite(n) || n < min || n > max) bad(`Invalid ${name}`);
  return n;
}
module.exports = { bad, str, int, float };
