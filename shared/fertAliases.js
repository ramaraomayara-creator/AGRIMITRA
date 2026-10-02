/* AgriMitra fertilizer nicknames + number/formula codes — VERIFIED standard
 * industry abbreviations and textbook chemical formulas only. No brands invented.
 * UMD: usable from classic browser scripts (window.FERT_ALIASES) and Node require().
 * Keys are fertilizer record ids; variant ids share their base entry object. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.FERT_ALIASES = factory();
}(typeof self !== "undefined" ? self : this, function () {
  const UREA = { nick: ["Urea"], codes: ["CO(NH2)2"] };
  const AS = { nick: ["Ammonium Sulphate", "AS"], codes: ["(NH4)2SO4"] };
  const CAN = { nick: ["Calcium Ammonium Nitrate", "CAN"], codes: [] };
  const MOP = { nick: ["MOP", "Muriate of Potash"], codes: ["KCl"] };
  const SOP = { nick: ["SOP", "Sulphate of Potash"], codes: ["K2SO4"] };
  const KNO3 = { nick: ["Potassium Nitrate", "Nitrate of Potash", "NOP"], codes: ["KNO3"] };
  const MKP = { nick: ["Mono Potassium Phosphate", "MKP", "Potassium Phosphate"], codes: ["KH2PO4"] };
  const MAP = { nick: ["MAP", "Mono-Ammonium Phosphate", "Ammonium Phosphate"], codes: ["NH4H2PO4"] };
  const DAP = { nick: ["DAP", "Di-Ammonium Phosphate"], codes: ["(NH4)2HPO4"] };
  const ZS = { nick: ["Zinc Sulphate"], codes: ["ZnSO4"] };
  const FS = { nick: ["Ferrous Sulphate", "Iron Sulphate"], codes: ["FeSO4"] };
  const MGSO4 = { nick: ["Magnesium Sulphate", "Epsom Salt"], codes: ["MgSO4"] };
  const GYP = { nick: ["Gypsum", "Calcium Sulphate"], codes: ["CaSO4·2H2O"] };
  const SUL = { nick: ["Sulphur", "Brimstone", "Elemental Sulphur"], codes: ["S"] };
  const CANIT = { nick: ["Calcium Nitrate"], codes: ["Ca(NO3)2"] };
  const MGNI = { nick: ["Magnesium Nitrate"], codes: ["Mg(NO3)2"] };
  const ZEDTA = { nick: ["Zinc EDTA", "Chelated Zinc", "Zinc Chelate"], codes: [] };
  return {
    "urea": UREA,
    "ammonium-sulphate": AS,
    "calcium-ammonium-nitrate": CAN,
    "ammonium-chloride": { nick: ["Ammonium Chloride"], codes: ["NH4Cl"] },
    "ammonium-nitrate": { nick: ["Ammonium Nitrate"], codes: ["NH4NO3"] },
    "sodium-nitrate": { nick: ["Sodium Nitrate", "Chile Saltpetre"], codes: ["NaNO3"] },
    "ammonium-sulphate-nitrate": { nick: ["Ammonium Sulphate Nitrate", "ASN"], codes: [] },
    "anhydrous-ammonia": { nick: ["Anhydrous Ammonia"], codes: ["NH3"] },
    "calcium-nitrate": CANIT, "calcium-nitrate-n": CANIT, "calcium-nitrate-s": CANIT,
    "calcium-nitrate-ws": CANIT,
    "dap": DAP,
    "ssp": { nick: ["SSP", "Single Super Phosphate"], codes: [] },
    "tsp": { nick: ["TSP", "Triple Super Phosphate"], codes: [] },
    "map-granular": MAP,
    "mono-ammonium-phosphate": MAP,
    "ammonium-phosphate-generic": MAP,
    "rock-phosphate": { nick: ["Rock Phosphate", "RP"], codes: [] },
    "nitrophosphate": { nick: ["Nitrophosphate", "NP"], codes: [] },
    "basic-slag": { nick: ["Basic Slag", "Thomas Slag"], codes: [] },
    "bone-meal": { nick: ["Bone Meal"], codes: [] },
    "phosphorus-fertilizer-generic": { nick: ["Phosphorus Fertilizer"], codes: [] },
    "mop": MOP, "potassium-chloride": MOP,
    "sop": SOP, "potassium-sulphate": SOP, "potassium-sulphate-ws": SOP, "npk-00-00-50": SOP,
    "potassium-nitrate": KNO3, "potassium-nitrate-ws": KNO3, "npk-13-00-45": KNO3, "npk-13-00-45-ws": KNO3,
    "potassium-magnesium-sulphate": { nick: ["Potassium Magnesium Sulphate", "Schoenite"], codes: [] },
    "potassium-schoenite": { nick: ["Potassium Schoenite"], codes: [] },
    "potassium-carbonate": { nick: ["Potassium Carbonate"], codes: ["K2CO3"] },
    "potassium-phosphate": MKP, "mono-potassium-phosphate": MKP, "npk-00-52-34": MKP, "npk-00-52-34-ws": MKP, "00-52-34-ws": MKP,
    "potassium-magnesium-fertilizer": { nick: ["Potassium Magnesium Fertilizer"], codes: [] },
    "npk-10-26-26": { nick: ["NPK"], codes: ["10:26:26"] },
    "npk-12-32-16": { nick: ["NPK"], codes: ["12:32:16"] },
    "npk-14-35-14": { nick: ["NPK"], codes: ["14:35:14"] },
    "npk-15-15-15": { nick: ["NPK"], codes: ["15:15:15"] },
    "npk-17-17-17": { nick: ["NPK"], codes: ["17:17:17"] },
    "npk-19-19-19": { nick: ["NPK"], codes: ["19:19:19"] },
    "npk-19-19-19-ws": { nick: ["NPK"], codes: ["19:19:19"] },
    "19-19-19-ws": { nick: ["NPK"], codes: ["19:19:19"] },
    "npk-20-20-20": { nick: ["NPK"], codes: ["20:20:20"] },
    "npk-20-20-20-ws": { nick: ["NPK"], codes: ["20:20:20"] },
    "npk-13-40-13": { nick: ["NPK"], codes: ["13:40:13"] },
    "npk-13-40-13-ws": { nick: ["NPK"], codes: ["13:40:13"] },
    "13-40-13-ws": { nick: ["NPK"], codes: ["13:40:13"] },
    "npk-00-52-34-ws": MKP, "00-52-34-ws": MKP,
    "npk-18-18-18": { nick: ["NPK"], codes: ["18:18:18"] },
    "npk-24-24-0": { nick: ["NPK", "NP"], codes: ["24:24:0"] },
    "npk-16-16-16": { nick: ["NPK"], codes: ["16:16:16"] },
    "npk-12-12-17": { nick: ["NPK"], codes: ["12:12:17"] },
    "npk-15-30-15": { nick: ["NPK"], codes: ["15:30:15"] },
    "magnesium-sulphate": MGSO4, "magnesium-sulphate-heptahydrate": MGSO4,
    "gypsum": GYP, "calcium-sulphate": GYP,
    "sulphur": SUL, "sulphur-bentonite": SUL,
    "magnesium-nitrate": MGNI, "magnesium-nitrate-ws": MGNI,
    "magnesium-chloride": { nick: ["Magnesium Chloride"], codes: ["MgCl2"] },
    "calcium-chloride": { nick: ["Calcium Chloride"], codes: ["CaCl2"] },
    "zinc-sulphate": ZS,
    "zinc-oxide": { nick: ["Zinc Oxide"], codes: ["ZnO"] },
    "zinc-edta": ZEDTA, "zinc-chelate": ZEDTA,
    "ferrous-sulphate": FS, "iron-sulphate": FS,
    "iron-chelate": { nick: ["Iron Chelate", "Chelated Iron"], codes: [] },
    "borax": { nick: ["Borax", "Sodium Borate"], codes: ["Na2B4O7"] },
    "boric-acid": { nick: ["Boric Acid"], codes: ["H3BO3"] },
    "manganese-sulphate": { nick: ["Manganese Sulphate"], codes: ["MnSO4"] },
    "manganese-chelate": { nick: ["Manganese Chelate"], codes: [] },
    "copper-sulphate": { nick: ["Copper Sulphate"], codes: ["CuSO4"] },
    "copper-chelate": { nick: ["Copper Chelate"], codes: [] },
    "molybdenum-fertilizer": { nick: ["Molybdenum Fertilizer"], codes: ["Mo"] },
    "sodium-molybdate": { nick: ["Sodium Molybdate"], codes: ["Na2MoO4"] },
    "urea-phosphate": { nick: ["Urea Phosphate"], codes: ["17:44"] },
    "urea-phosphate-n": { nick: ["Urea Phosphate"], codes: ["17:44"] },
    "urea-phosphate-ws": { nick: ["Urea Phosphate"], codes: ["17:44"] },
  };
}));
