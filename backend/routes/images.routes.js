"use strict";
const images = require("../services/imageService");
const ds = require("../services/dataStore");
const { sendJson } = require("../middleware/errorHandler");
const { str } = require("../middleware/validation");
function register(routes, cfg) {
  routes.push({
    method: "GET", path: "/api/images/search",
    fn: async (req, res, q) => {
      const query = str(q.query || q.q, "query", 80);
      if (!query) {
        const e = new Error("A search query is required.");
        e.code = "BAD_REQUEST"; e.status = 400; throw e;
      }
      const out = await images.searchImages(cfg, query);
      sendJson(res, 200, out);
    },
  });
  routes.push({
    method: "GET", path: "/api/images/fertilizer",
    fn: async (req, res, q) => {
      const name = str(q.name, "name", 60);
      if (!name) {
        const e = new Error("A fertilizer name is required.");
        e.code = "BAD_REQUEST"; e.status = 400; throw e;
      }
      try {
        const out = await images.searchFertilizer(cfg, name, {
          brand: str(q.brand, "brand", 60), type: str(q.type, "type", 60),
          grade: str(q.grade, "grade", 20), category: str(q.category, "category", 60),
          productCode: str(q.productCode || q.sku || q.gtin, "productCode", 40),
        });
        sendJson(res, 200, out);
      } catch (e) {
        if (e && e.code === "NO_IMAGE") {
          return sendJson(res, 404, { error: { code: "NO_IMAGE", message: "No verified image found for this fertilizer." } });
        }
        throw e;
      }
    },
  });
  routes.push({
    method: "GET", path: "/api/fertilizers/:fertilizerId/image",
    fn: async (req, res, q, p) => {
      const f = ds.fertilizer(decodeURIComponent(p.fertilizerId || p.id || ""));
      if (!f) return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Fertilizer not found." } });
      const cu = ds.fertCurated(f);
      if (cu) {
        return sendJson(res, 200, {
          fertilizerId: f.id, fertilizerName: f.name,
          result: {
            imageUrl: cu.imageUrl, thumbnailUrl: cu.imageUrl.replace("width=640", "width=320"),
            title: cu.title, sourceName: cu.sourceName, sourceUrl: cu.page,
            author: cu.author, license: cu.license, attribution: cu.attribution,
            imageType: cu.type === "exact" ? "exact-product" : "verified-representative",
            brand: null, manufacturer: null,
          },
          cached: false, fetchedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + cfg.imageCacheTtlMs).toISOString(),
        });
      }
      try {
        const out = await images.searchFertilizer(cfg, f.name + " fertilizer");
        sendJson(res, 200, { fertilizerId: f.id, fertilizerName: f.name, ...out });
      } catch (e) {
        if (e && e.code === "NO_IMAGE") {
          return sendJson(res, 404, { error: { code: "NO_IMAGE", message: "No verified image found for this fertilizer." } });
        }
        throw e;
      }
    },
  });
  routes.push({
    method: "GET", path: "/api/images/seed",
    fn: async (req, res, q) => {
      const name = str(q.name, "name", 60);
      if (!name) {
        const e = new Error("A seed name is required.");
        e.code = "BAD_REQUEST"; e.status = 400; throw e;
      }
      try {
        const out = await images.searchSeed(cfg, name, {
          variety: str(q.variety, "variety", 60), crop: str(q.crop, "crop", 60),
          brand: str(q.brand, "brand", 60), manufacturer: str(q.manufacturer, "manufacturer", 60),
          productCode: str(q.productCode, "productCode", 40), category: str(q.category, "category", 60),
        });
        sendJson(res, 200, out);
      } catch (e) {
        if (e && e.code === "NO_IMAGE") {
          return sendJson(res, 404, { error: { code: "NO_IMAGE", message: "No verified image found for this seed." } });
        }
        throw e;
      }
    },
  });
}
module.exports = { register };
