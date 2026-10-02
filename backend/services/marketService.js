"use strict";
/* data.gov.in mandi prices → normalized records. Never invents prices. */
const { fetchJson } = require("../utils/http");
const { createCache } = require("../utils/cache");
const logger = require("../utils/logger");
const cache = createCache();
const DATASET_PAGE = "https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi";
const num = (v) => { if (v === null || v === undefined || v === "") return null; const n = parseFloat(String(v).replace(/,/g, "")); return Number.isFinite(n) ? n : null; };
function normalize(r) {
  return {
    commodity: r.commodity || r.Commodity || "",
    variety: r.variety || r.Variety || "",
    grade: r.grade || r.Grade || "",
    state: r.state || r.State || "",
    district: r.district || r.District || "",
    market: r.market || r.Market || "",
    arrivalDate: r.arrival_date || r.Arrival_Date || "",
    minPrice: num(r.min_price), maxPrice: num(r.max_price), modalPrice: num(r.modal_price),
    unit: r.unit || r.Unit || "Quintal",
    unitNote: (r.unit || r.Unit) ? "Unit as published in the dataset record." : "Unit is not published in this dataset; mandi prices are conventionally per quintal — verify with the APMC.",
    source: "Government of India Open Government Data Platform",
    sourceUrl: DATASET_PAGE,
    isLive: true,
    fetchedAt: new Date().toISOString(),
  };
}
const flattenMarketObjects = (value, out=[]) => {
  if (Array.isArray(value)) { value.forEach(x=>flattenMarketObjects(x,out)); return out; }
  if (!value || typeof value !== "object") return out;
  const keys=Object.keys(value);
  if (keys.some(k=>/modal|model|min_price|max_price|minPrice|maxPrice/i.test(k)) && keys.some(k=>/commodity|market|crop/i.test(k))) out.push(value);
  Object.values(value).forEach(x=>{ if(x && typeof x==="object") flattenMarketObjects(x,out); });
  return out;
};
async function getAgmarknetPrices(cfg, f) {
  const base = (cfg.agmarknetApiUrl || "https://api.agmarknet.gov.in/v1").replace(/\\/$/,"");
  const headers = {
    Accept: "application/json, text/plain, */*",
    Origin: "https://agmarknet.gov.in",
    Referer: "https://agmarknet.gov.in/",
    "User-Agent": "Mozilla/5.0"
  };
  const get = (path, params) => fetchJson(base + path + (params ? "?" + new URLSearchParams(params).toString() : ""), {headers});
  const pick = (o, keys) => { for (const k of keys) if (o && o[k] != null && o[k] !== "") return o[k]; return ""; };
  const num2 = v => { const n=parseFloat(String(v ?? "").replace(/,/g,"").replace(/₹/g,"")); return Number.isFinite(n)?n:null; };
  const statesBody = await get("/location/state",{page:"1"});
  let states = Array.isArray(statesBody?.states) ? statesBody.states : flattenMarketObjects(statesBody);
  const sid = x => pick(x,["id","stateId","state_id","stateCode","state_code"]);
  const sn = x => String(pick(x,["name","state","stateName","state_name","State"]));
  let ids=states.map(sid).filter(Boolean);
  if(f.state){const q=String(f.state).toLowerCase();ids=states.filter(x=>sn(x).toLowerCase().includes(q)).map(sid).filter(Boolean);}
  if(!ids.length) throw Object.assign(new Error("AGMARKNET state lookup failed"),{code:"AGMARKNET_UNAVAILABLE"});
  const dates=f.arrival_date?[f.arrival_date]:[new Date().toISOString().slice(0,10)];
  let rows=[];
  for(const dt of dates){
    try{
      const body=await get("/prices-and-arrivals/commodity-wise/daily-report-state",{date:dt,stateIds:ids.join(","),includeExcel:"false"});
      rows=flattenMarketObjects(body).map(x=>({
        commodity:String(pick(x,["commodity","Commodity","commodity_name","crop","Crop"])),
        variety:String(pick(x,["variety","Variety","variety_name"])),
        grade:String(pick(x,["grade","Grade"])),
        state:String(pick(x,["state","State","state_name","stateName"])),
        district:String(pick(x,["district","District","district_name","districtName"])),
        market:String(pick(x,["market","Market","market_name","marketName"])),
        arrivalDate:String(pick(x,["arrival_date","Arrival_Date","arrivalDate","date","Date"])) || dt,
        minPrice:num2(pick(x,["min_price","Min_Price","minPrice","minimum_price","min"])),
        maxPrice:num2(pick(x,["max_price","Max_Price","maxPrice","maximum_price","max"])),
        modalPrice:num2(pick(x,["modal_price","Modal_Price","modalPrice","model_price","Model_Price","modal","Modal"])),
        unit:String(pick(x,["unit","Unit"])) || "Quintal",
        unitNote:"Unit as published by AGMARKNET; verify the record before selling.",
        source:"AGMARKNET 2.0",sourceUrl:"https://agmarknet.gov.in/home",isLive:true,fetchedAt:new Date().toISOString()
      })).filter(x=>x.commodity&&(x.modalPrice!==null||x.minPrice!==null||x.maxPrice!==null));
      if(rows.length) break;
    }catch(e){ logger.warn("AGMARKNET request failed",{code:e&&e.code}); }
  }
  if(f.district) rows=rows.filter(x=>x.district.toLowerCase().includes(String(f.district).toLowerCase()));
  if(f.market) rows=rows.filter(x=>x.market.toLowerCase().includes(String(f.market).toLowerCase()));
  if(f.commodity) rows=rows.filter(x=>x.commodity.toLowerCase().includes(String(f.commodity).toLowerCase()));
  if(f.variety) rows=rows.filter(x=>x.variety.toLowerCase().includes(String(f.variety).toLowerCase()));
  if(!rows.length) throw Object.assign(new Error("AGMARKNET returned no records"),{code:"NO_RECORDS"});
  return {records:rows,total:rows.length,dataDate:rows.reduce((m,x)=>x.arrivalDate>m?x.arrivalDate:m,""),fetchedAt:new Date().toISOString(),source:"AGMARKNET 2.0",sourceUrl:"https://agmarknet.gov.in/home",isLive:true,cached:false};
}
async function getPrices(cfg, f) {
  const key = "prices:" + JSON.stringify(f);
  const hit = cache.get(key);
  if (hit) { hit.cached = true; return hit; }
  const sources = [];
  if (cfg.agmarknetApiUrl !== false) sources.push(() => getAgmarknetPrices(cfg,f));
  sources.push(async () => {
    if (!cfg.marketApiKey) throw Object.assign(new Error("OGD key not configured"),{code:"NOT_CONFIGURED"});
    const p = new URLSearchParams({ "api-key": cfg.marketApiKey, format:"json", limit:String(f.limit||500), offset:String(f.offset||0) });
    ["state","district","market","commodity","variety","arrival_date"].forEach(k=>{ if(f[k]) p.set(`filters[${k}]`,f[k]); });
    const body=await fetchJson(`${cfg.marketApiUrl}?${p.toString()}`);
    const records=(Array.isArray(body.records)?body.records:[]).map(normalize);
    if(!records.length) throw Object.assign(new Error("OGD returned no records"),{code:"NO_RECORDS"});
    let dataDate=""; records.forEach(r=>{if(r.arrivalDate>dataDate)dataDate=r.arrivalDate;});
    return {records,total:parseInt(body.total||records.length,10)||records.length,dataDate,fetchedAt:new Date().toISOString(),source:"Government OGD / data.gov.in",sourceUrl:DATASET_PAGE,isLive:true,cached:false};
  });
  if (cfg.cedaApiKey) sources.push(async()=> {
    const body=await fetchJson((cfg.cedaApiUrl||"https://api.ceda.ashoka.edu.in").replace(/\\/$/,"")+"/agmarknet/prices",{
      method:"POST",headers:{Authorization:"Bearer "+cfg.cedaApiKey,"Content-Type":"application/json",Accept:"application/json"},
      body:{commodity:f.commodity,state:f.state,district:f.district,start_date:f.arrival_date,end_date:f.arrival_date,calculation_type:"d",chart_type:"datadownload"}
    });
    const records=flattenMarketObjects(body).map(normalize).filter(r=>r.commodity&&(r.modalPrice!==null||r.minPrice!==null||r.maxPrice!==null));
    if(!records.length) throw Object.assign(new Error("CEDA returned no records"),{code:"NO_RECORDS"});
    return {records,total:records.length,dataDate:f.arrival_date||"",fetchedAt:new Date().toISOString(),source:"CEDA Agri Market Data",sourceUrl:"https://agmarknet.ceda.ashoka.edu.in/",isLive:false,cached:false};
  });
  let last;
  for(const source of sources){try{const out=await source();cache.set(key,out,cfg.cacheTtlMs);return out;}catch(e){last=e;logger.warn("market source failed",{code:e&&e.code,message:e&&e.message});}}
  const e=new Error("All market sources are unavailable");e.code=last?.code||"UPSTREAM_UNAVAILABLE";throw e;
}\n\nasync function getMarkets(cfg, f) {
  /* Distinct markets derived from real records only — contacts never invented. */
  const res = await getPrices(cfg, { limit: 500, offset: 0, state: f.state, district: f.district });
  const map = new Map();
  res.records.forEach((r) => {
    const k = `${r.state}||${r.district}||${r.market}`;
    if (!map.has(k)) {
      map.set(k, {
        id: k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        marketName: r.market, state: r.state, district: r.district, location: "",
        commodities: [], contact: null,
        contactNote: "Contact details are not published in this dataset. Confirm with the district APMC.",
        source: res.source, sourceUrl: res.sourceUrl, lastUpdated: res.dataDate,
      });
    }
    const m = map.get(k);
    if (r.commodity && !m.commodities.includes(r.commodity)) m.commodities.push(r.commodity);
  });
  return { markets: [...map.values()], isLive: true, cached: !!res.cached, fetchedAt: res.fetchedAt, source: res.source, sourceUrl: res.sourceUrl };
}
module.exports = { getPrices, getMarkets };
