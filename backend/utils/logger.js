"use strict";
function ts() { return new Date().toISOString(); }
function out(level, msg, meta) {
  const extra = meta ? " " + JSON.stringify(meta) : "";
  console.log(`[${ts()}] ${level.toUpperCase()} ${msg}${extra}`);
}
module.exports = {
  info: (m, x) => out("info", m, x),
  warn: (m, x) => out("warn", m, x),
  error: (m, x) => out("error", m, x),
};
