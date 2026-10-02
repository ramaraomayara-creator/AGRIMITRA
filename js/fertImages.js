/* AgriMitra curated fertilizer images — VERIFIED Wikimedia Commons files only.
 * Every entry was checked against its Commons file page (title, author, license).
 * imageType "exact": photo shows that exact product. "representative": relevant
 * same-class photo, always labelled as such — never mislabelled.
 * URLs use Special:FilePath (stable, hotlinkable) with width=640 thumbnails. */
(function () {
  const F = "https://commons.wikimedia.org/wiki/Special:FilePath/";
  const W = "?width=640";
  function E(file, title, author, license, type) {
    return {
      imageUrl: F + file + W,
      title: title, author: author, license: license,
      page: "https://commons.wikimedia.org/wiki/File:" + file.split("?")[0],
      sourceName: "Wikimedia Commons", type: type,
      attribution: author + " / Wikimedia Commons" + (license && license !== "see file page" ? " / " + license : ""),
    };
  }
  const DAP = E("DAP%20(Diammonium%20Phosphate)%20Granules%20(3).jpg",
    "DAP (Diammonium Phosphate) Granules", "Suyash Dwivedi", "CC BY-SA 4.0", "exact");
  const YARA = E("Fertilising%20operations%20-%20geograph.org.uk%20-%20493879.jpg",
    "Fertiliser bags being loaded (Yara)", "Graham Horn / geograph.org.uk", "CC BY-SA", "representative");
  const NPKBAG = E("NPK%20Fertilizer.png",
    "NPK fertilizer bag", "DBlaine83", "see file page", "representative");
  const MICROBAG = E("Fertilizer.jpg",
    "Micronutrient garden fertilizer bag", "Sandbh", "see file page", "representative");
  const POLY = E("Polysulphate%20Granular.jpg",
    "Granular polysulphate (potash) fertilizer", "Labratcreative", "CC BY-SA 4.0", "representative");
  const VERMI = E("Harvesting%20vermicompost.JPG",
    "Harvesting vermicompost", "Wikimedia Commons contributor", "CC BY 3.0", "representative");
  const COMPOST = E("Compost.jpg",
    "Compost (USDA photo)", "USDA", "Public domain", "representative");
  const BULK = E("Nexen,%20big%20bags.jpg",
    "Bulk fertilizer bags", "Cjp24", "CC BY-SA 4.0", "representative");
  const NODULES = E("Nitrogen-fixing%20nodules%20in%20the%20roots%20of%20legumes..JPG",
    "Rhizobium nitrogen-fixing nodules", "Terraprima", "see file page", "representative");
  /* Per-fertilizer-id mapping (exact only where the photo shows that product). */
  const BY_ID = { dap: DAP, vermicompost: VERMI };
  /* Category defaults for everything else. */
  const BY_CAT = {
    "Nitrogen Fertilizers": YARA, "Phosphatic Fertilizers": YARA,
    "Potassic Fertilizers": POLY, "Complex / NPK Fertilizers": NPKBAG,
    "Secondary Nutrient Fertilizers": YARA, "Micronutrient Fertilizers": MICROBAG,
    "Water-Soluble Fertilizers": NPKBAG, "Biofertilizers": NODULES,
    "Organic Fertilizers": COMPOST, "Soil Conditioners / Amendments": BULK,
    "Specialty Fertilizers": YARA,
  };
  window.FERT_CURATED = {
    get(f) {
      if (!f) return null;
      if (f.id && BY_ID[f.id]) return BY_ID[f.id];
      return BY_CAT[f.category] || BULK;
    },
  };
})();
