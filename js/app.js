/* AgriMitra SPA — no login, localStorage prefs, demo-data labelled, API-ready service layer */
const $ = s => document.querySelector(s);
const app = document.getElementById("app");
const store = {
  get(k,d){ try{ const v=localStorage.getItem("agrimitra_"+k); return v?JSON.parse(v):d }catch(e){ return d } },
  set(k,v){ try{ localStorage.setItem("agrimitra_"+k, JSON.stringify(v)) }catch(e){} }
};
const ApiService = {
  async getMarket(){ return {source:"demo", data: DB.markets}; },
  async getWeather(place){ return {source:"demo", data: DB.weatherDemo}; }
};
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function setActiveNav(route){
  document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active", a.dataset.nav===route));
}
function barChart(labels, values, suffix){
  suffix = suffix||"";
  const mx = Math.max.apply(null, values.concat([1]));
  let bars = values.map(v=>'<div style="height:'+(Math.round(v/mx*130)+8)+'px"><span>'+v+suffix+'</span></div>').join("");
  let labs = labels.map(l=>'<div style="flex:1;text-align:center;font-size:11px">'+esc(l)+'</div>').join("");
  return '<div class="chart"><div class="bars">'+bars+'</div><div style="display:flex;gap:8px">'+labs+'</div></div>';
}

/* ---------- HOME ---------- */
function pageHome(){
  const quick = [
    ["crops","\u{1F331}","Crop Information","110+ crops, full package of practices"],
    ["farming-types","\u{1F69C}","Farming Types","40 types from organic to hydroponic"],
    ["weather","\u{1F326}","Weather","Forecast + farm advisories"],
    ["market","\u{1F9FA}","Market","Mandi prices, APMC contacts"],
    ["seeds","\u{1F330}","Seeds","Varieties, yield, treatment"],
    ["fertilizers","\u{1F9EA}","Fertilizers","Organic, chemical & bio"],
    ["diseases","\u{1F41B}","Pest & Disease","Symptoms + IPM"],
    ["irrigation","\u{1F4A7}","Irrigation","Drip to rainwater harvest"],
    ["schemes","\u{1F3DB}","Govt Schemes","PM-KISAN, PMFBY & more"]
  ];
  let cards = quick.map(q=>'<a class="card" href="#/'+q[0]+'"><div class="icon">'+q[1]+'</div><h3>'+q[2]+'</h3><p class="muted">'+q[3]+'</p><span class="small">Open &rarr;</span></a>').join("");
  let types = DB.farmingTypes.slice(2,8).map(f=>'<div class="card"><div class="icon">'+f.icon+'</div><h3>'+esc(f.name)+'</h3><p class="muted">'+esc(f.def.slice(0,90))+'...</p><a class="btn btn-sm" href="#/farming-types?q='+encodeURIComponent(f.name)+'">View Details</a></div>').join("");
  let seasons = DB.calendar.map(c=>'<div class="card"><div class="icon">'+c.icon+'</div><h3>'+esc(c.season)+'</h3><p><b>Sowing:</b> '+esc(c.sow)+'<br><b>Harvest:</b> '+esc(c.harv)+'</p><p class="muted">'+esc(c.crops)+'</p></div>').join("");
  return '<section class="hero"><span class="badge">No login needed &bull; Free for every farmer</span>'
  +'<h1>AgriMitra &mdash; Smart Farming Assistant for Every Farmer</h1>'
  +'<p>Crops, weather, markets, seeds, soil, schemes &amp; calculators in simple language. Made for small &amp; marginal farmers of India.</p>'
  +'<div class="hero-cta"><a class="btn btn-primary" href="#/crops">Explore Crops</a><a class="btn btn-light" href="#/dashboard">My Farm Dashboard</a><a class="btn btn-light" href="#/market">Today\'s Market</a></div>'
  +'<div class="hero-stats"><div class="stat">110+ crops</div><div class="stat">40+ farming types</div><div class="stat">110 paddy varieties</div><div class="stat">8 schemes</div></div></section>'
  +'<div class="section-title"><h2>Quick Access</h2><a href="#/dashboard">Personalise &rarr;</a></div><div class="grid g4">'+cards+'</div>'
  +'<div class="section-title"><h2>Explore Farming</h2><a href="#/farming-types">All 40 types &rarr;</a></div><div class="grid g3">'+types+'</div>'
  +'<div class="section-title"><h2>How AgriMitra Helps Farmers</h2></div><div class="grid g4">'
  +'<div class="card"><div class="icon">📋</div><h3>Right guidance</h3><p class="muted">Step-by-step guide: soil test to selling.</p></div>'
  +'<div class="card"><div class="icon">🌦️</div><h3>Weather-smart</h3><p class="muted">5-day forecast + what to do / avoid.</p></div>'
  +'<div class="card"><div class="icon">🧺</div><h3>Fair price</h3><p class="muted">Compare mandis, modal price, APMC contacts.</p></div>'
  +'<div class="card"><div class="icon">💰</div><h3>Less cost</h3><p class="muted">Seed, fertilizer, water &amp; profit calculators.</p></div></div>'
  +'<div class="section-title"><h2>Season at a glance</h2><a href="#/calendar">Full calendar &rarr;</a></div><div class="grid g3">'+seasons+'</div>'
  +'<div class="alert green" style="margin-top:16px">Need help? Kisan Call Centre: <b>1800-180-1551</b> (free) &bull; Contact your Mandal Agriculture Officer for field advice.</div>';
}

/* ---------- FARMING TYPES (image cards + dynamic detail route) ---------- */
function slugFt2(name){ return String(name||"farming").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"farming"; }
var FT_PROC = {
field:["Land Preparation","Crop & Variety Selection","Sowing / Planting","Water & Nutrient Management","Pest & Disease Care","Harvest & Storage"],
hitech:["System Setup","Nutrient Solution Preparation","Planting / Transplanting","Climate, EC and pH Control","Pest Control & Hygiene","Harvest & Marketing"],
livestock:["Housing Setup","Breed Selection","Feeding & Watering","Health & Vaccination","Breeding Management","Harvest / Sale & Records"],
orchard:["Site & Pit Preparation","Planting Grafts","Training & Pruning","Irrigation & Nutrition","Plant Protection","Harvest & Grading"],
protected:["Structure Setup","Bed / Media Preparation","Planting","Climate & Fertigation Control","IPM under Cover","Harvest & Packing"],
fishery:["Pond Preparation","Fingerling Stocking","Feeding & Water Quality","Health Monitoring","Growth Sampling","Harvest & Sale"],
forestry:["Site Layout","Species Selection","Planting","Protection & Thinning","Interculture","Harvest & Marketing"],
integrated:["Component Planning","Crop + Allied Setup","Waste Recycling Loop","Water & Feed Management","Health Monitoring","Staggered Harvests & Sale"],
urban:["Site Setup","Containers & Media","Sowing / Planting","Daily Water & Feed","Pest Care","Daily Harvest"],
eco:["Observe & Plan","Build Soil Cover","Diversify Plantings","Integrate Trees / Animals","Recycle Nutrients","Harvest & Regenerate"]};
function ftAll(){
  const base=(window.DB && Array.isArray(DB.farmingTypes))?DB.farmingTypes:[];
  const ext=window.FT_EXT||{}, out=[], seen={};
  const push=(b,e)=>{
    const name=b.name||e.name; let id=slugFt2(e.id||name);
    if(seen[id]) id=id+"-2"; seen[id]=true;
    out.push({id:id,name:name,icon:b.icon||"🌾",def:String(b.def||e.def||""),works:String(b.works||""),
      crops:String(b.crops||""),climate:String(b.climate||""),soil:String(b.soil||""),water:String(b.water||""),
      adv:String(b.adv||""),lim:String(b.lim||""),invest:String(b.invest||""),regions:String(b.regions||""),farmer:String(b.farmer||""),
      img:e.img||"farm,field",short:String(e.short||b.def||""),purpose:String(e.purpose||b.adv||""),
      method:e.method||"Traditional",tech:e.tech||"Manual",waterLvl:e.water||"Medium",system:e.system||"Crops",
      land:String(e.land||""),equip:e.equip||[],best:e.best||[],procKey:e.procKey||"field",proc:e.proc||null,
      sources:e.sources||"AgriMitra compilation; verify with KVK / state agriculture department."});
  };
  base.forEach(b=>{ if(b&&(b.name||b.def)) push(b, ext[b.name]||{name:b.name}); });
  ((window.FT_NEW)||[]).forEach(n=>push(n,n));
  ((window.FT_MORE)||[]).forEach(n=>push(n,n));
  return out;
}
function ftFindType(id){ const L=ftAll(); return L.find(f=>f.id===id)||L.find(f=>f.name===id)||null; }
function ftyState(){ return store.get("ftTypeFilters", {q:"",method:"All",tech:"All",water:"All",system:"All"}); }
function ftCard(f){
  const img='<img src="https://loremflickr.com/600/400/'+esc(f.img)+'?lock='+f.id.length+'-'+f.id.charCodeAt(0)+'" alt="'+esc(f.name)+'" loading="lazy" onerror="ftImgErr(this)">';
  return '<article class="crop-card"><div class="crop-img">'+img+'<span class="crop-cat">'+esc(f.system||"Farming")+'</span><span class="var-unavail">Representative Image</span></div>'
  +'<div class="crop-body"><h3>'+esc(f.name)+'</h3>'
  +'<p class="crop-desc">'+esc(f.short)+'</p>'
  +'<a class="crop-guide-btn" href="#/farming-types/'+esc(f.id)+'">View Details →</a></div></article>';
}
function pageFarmingTypes(q){
  const s = ftyState(); if(q){ s.q=q; }
  const L = ftAll().filter(f=>{
    const w=(s.q||"").toLowerCase();
    const okQ = !w || ((f.name+" "+f.short+" "+f.crops+" "+f.method+" "+f.tech+" "+f.purpose).toLowerCase().indexOf(w)>-1);
    return okQ && (s.method==="All"||f.method===s.method) && (s.tech==="All"||f.tech===s.tech)
      && (s.water==="All"||f.waterLvl===s.water) && (s.system==="All"||f.system===s.system);
  });
  const opts=(arr,cur)=>arr.map(o=>'<option'+(o===cur?" selected":"")+'>'+esc(o)+'</option>').join("");
  return '<div class="section-title"><h2>Farming Types</h2><span class="badge">'+L.length+' of '+ftAll().length+'</span></div>'
  +'<p class="muted">Explore '+ftAll().length+' farming systems and methods. Every type shows below — search only narrows the list.</p>'
  +'<div class="crop-toolbar"><div class="row"><input id="ftyQ" placeholder="Search farming types..." value="'+esc(s.q||"")+'">'
  +'<select id="ftMethod" aria-label="Farming method"><option>All</option>'+opts(["Traditional","Modern","Hi-tech","Integrated"],s.method)+'</select>'
  +'<select id="ftTech" aria-label="Technology"><option>All</option>'+opts(["Manual","Mechanized","Digital","Sensor-IoT","Controlled-Climate","Soilless"],s.tech)+'</select>'
  +'<select id="ftWater" aria-label="Water"><option>All</option>'+opts(["Low","Medium","High"],s.water)+'</select>'
  +'<select id="ftSys" aria-label="Production system"><option>All</option>'+opts(["Crops","Livestock","Fishery","Forestry","Horticulture","Mixed"],s.system)+'</select></div>'
  +'<div class="row" style="margin-top:10px"><button class="btn btn-sm" id="ftyClear">Clear Filters</button><span class="crop-count">Showing '+L.length+' of '+ftAll().length+' farming types</span></div></div>'
  +(L.length?'<div class="crop-grid ft4" id="ftyGrid">'+L.map(ftCard).join("")+'</div>':'<div class="empty"><h3>No farming types match these filters.</h3><button class="btn btn-sm" onclick="ftTypeReset()">Clear Filters</button></div>');
}
function ftTypeReset(){ store.set("ftTypeFilters",{q:"",method:"All",tech:"All",water:"All",system:"All"}); render(); }
function ftTypeBind(){
  const upd=(k,v)=>{ const n=ftyState(); n[k]=v; store.set("ftTypeFilters",n); renderFtGrid(); };
  const q=document.getElementById("ftyQ"); if(q) q.oninput=()=>upd("q",q.value);
  const m={ftMethod:"method",ftTech:"tech",ftWater:"water",ftSys:"system"};
  Object.keys(m).forEach(id=>{ const e=document.getElementById(id); if(e) e.onchange=()=>upd(m[id],e.value); });
  const cl=document.getElementById("ftyClear"); if(cl) cl.onclick=ftTypeReset;
}
function renderFtGrid(){
  const s=ftyState();
  const L = ftAll().filter(f=>{
    const w=(s.q||"").toLowerCase();
    const okQ = !w || ((f.name+" "+f.short+" "+f.crops+" "+f.method+" "+f.tech+" "+f.purpose).toLowerCase().indexOf(w)>-1);
    return okQ && (s.method==="All"||f.method===s.method) && (s.tech==="All"||f.tech===s.tech)
      && (s.water==="All"||f.waterLvl===s.water) && (s.system==="All"||f.system===s.system);
  });
  const grid=document.getElementById("ftyGrid"); if(!grid) return;
  grid.outerHTML = L.length? '<div class="crop-grid ft4" id="ftyGrid">'+L.map(ftCard).join("")+'</div>'
    : '<div class="empty" id="ftyGrid"><h3>No farming types match these filters.</h3><button class="btn btn-sm" onclick="ftTypeReset()">Clear Filters</button></div>';
  const cnt=document.querySelector(".crop-toolbar .crop-count"); if(cnt) cnt.textContent="Showing "+L.length+" of "+ftAll().length+" farming types";
  const badge=document.querySelector(".section-title .badge"); if(badge) badge.textContent=L.length+" of "+ftAll().length;
}
function ftCropCardsFor(crops){
  let L=[]; try{ L=nxCrops(); }catch(e){ L=[]; }
  if(!L.length) return '<p class="muted">Crop guides are unavailable in this view.</p>';
  const hits=[]; String(crops||"").split(/[+,]/).forEach(cn=>{
    cn=cn.trim(); if(!cn) return;
    const h=L.find(x=>x&&(x.name===cn||x.name.toLowerCase().indexOf(cn.toLowerCase())>-1||cn.toLowerCase().indexOf(x.name.toLowerCase())>-1));
    if(h && hits.indexOf(h)<0) hits.push(h);
  });
  if(!hits.length) return '<p class="muted">'+esc(crops||"Location-specific crops")+'</p>';
  return '<div class="crop-grid">'+hits.slice(0,6).map(CropCard).join("")+'</div>';
}
function ftDetailPage(id){
  try{
    const f = ftFindType(id);
    if(!f){ app.innerHTML='<div class="empty"><h3>Farming Type Not Found</h3><p class="muted">No farming type exists for "'+esc(id||"")+'".</p><a class="btn btn-primary btn-sm" href="#/farming-types">Back to Farming Types</a></div>'; window.scrollTo(0,0); return; }
    const steps = f.proc || FT_PROC[f.procKey] || FT_PROC.field;
    const advs = String(f.adv||"").split(",").map(s=>s.trim()).filter(Boolean);
    const lims = String(f.lim||"").split(",").map(s=>s.trim()).filter(Boolean);
    const img='<img src="https://loremflickr.com/900/450/'+esc(f.img)+'?lock='+f.id.length+'-'+f.id.charCodeAt(0)+'" alt="'+esc(f.name)+'" loading="lazy" data-liveq="'+esc(f.name)+'" onerror="ftImgErr(this)">';
    const rel0=ftAll().filter(x=>x.id!==f.id), same=rel0.filter(x=>x.system===f.system).slice(0,3);
    const rel=(same.length>=2?same:same.concat(rel0.filter(x=>x.system!==f.system)).slice(0,3));
    app.innerHTML = '<div class="crumb"><a href="#/home">Home</a> → <a href="#/farming-types">Farming Types</a> → <b>'+esc(f.name)+'</b></div>'
    +'<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-sm" href="#/farming-types">← Back to Farming Types</a><button class="btn btn-sm" onclick="window.print()">Print Guide</button></div>'
    +'<section class="guide-hero">'+img+'<div class="inner"><span class="badge">'+esc(f.system||"")+'</span> <span class="badge">'+esc(f.method||"")+'</span>'
    +'<h1>'+esc(f.name)+'</h1><p>'+esc(f.short)+'</p><p class="small">Representative image — actual fields vary by region.</p></div></section>'
    +'<div class="guide-sec"><h3>1. Overview</h3><p>'+esc(f.short)+'</p><dl class="kv"><dt>System</dt><dd>'+esc(f.system)+'</dd><dt>Method</dt><dd>'+esc(f.method)+'</dd><dt>Technology</dt><dd>'+esc(f.tech)+'</dd><dt>Best for</dt><dd>'+esc(f.farmer)+'</dd></dl></div>'
    +'<div class="guide-sec"><h3>2. Definition</h3><p>'+esc(f.def)+'</p></div>'
    +'<div class="guide-sec"><h3>3. How It Works</h3><p>'+esc(f.works)+'</p></div>'
    +'<div class="guide-sec"><h3>4. Main Purpose</h3><p>'+esc(f.purpose)+'</p></div>'
    +'<div class="guide-sec"><h3>5. Important Features</h3><ul><li>Purpose-built for '+esc(f.farmer)+'.</li><li>Investment level: '+esc(f.invest)+'.</li><li>Water need: '+esc(f.water)+'.</li></ul></div>'
    +'<div class="guide-sec"><h3>6. Suitable Crops</h3>'+ftCropCardsFor(f.crops)+'</div>'
    +'<div class="guide-sec"><h3>7. Suitable Soil</h3><p>'+esc(f.soil||"Information not available.")+'</p><p class="muted small">Keep soil covered, drained and rich in organic matter.</p></div>'
    +'<div class="guide-sec"><h3>8. Climate Requirements</h3><p>'+esc(f.climate||"Information not available.")+'</p></div>'
    +'<div class="guide-sec"><h3>9. Water Requirements</h3><p>'+esc(f.water||"Information not available.")+'</p><p class="muted small">Level: '+esc(f.waterLvl)+'. Mulch and schedule irrigation by growth stage.</p></div>'
    +'<div class="guide-sec"><h3>10. Land Requirement</h3><p>'+esc(f.land||"Information not available.")+'</p></div>'
    +'<div class="guide-sec"><h3>11. Farming Process</h3><div class="stages">'+steps.map((s,i)=>'<div class="stage"><b>'+(i+1)+'</b>'+esc(s)+'</div>').join("")+'</div></div>'
    +'<div class="guide-sec"><h3>12. Advantages</h3><div class="chips">'+(advs.length?advs.map(a=>'<span class="chip">✓ '+esc(a)+'</span>').join(""):'<span class="chip">✓ Suited to its recommended regions</span>')+'</div></div>'
    +'<div class="guide-sec"><h3>13. Limitations</h3><div class="chips">'+(lims.length?lims.map(l=>'<span class="chip">⚠ '+esc(l)+'</span>').join(""):'<span class="chip">⚠ Needs local adaptation</span>')+'</div></div>'
    +'<div class="guide-sec"><h3>14. Required Equipment</h3><ul>'+((f.equip||[]).map(e=>'<li>'+esc(e)+'</li>').join("")||'<li>Basic farm tools per the method above.</li>')+'</ul></div>'
    +'<div class="guide-sec"><h3>15. Fertilizer / Nutrient Management</h3><p>Feed per soil test in splits; compost and bio-inputs first. <b>Apply nutrients according to soil-test results and locally recommended guidelines — no universal dose is given here.</b></p></div>'
    +'<div class="guide-sec"><h3>16. Pest and Disease Management</h3><p>Scout weekly; use traps, neem and bio-agents first; spray only on local advisory. Resistant types and rotation break most cycles.</p></div>'
    +'<div class="guide-sec"><h3>17. Irrigation Method</h3><p>'+esc(f.water||"Information not available.")+' Prefer drip or furrow over flooding; mulch to save water.</p></div>'
    +'<div class="guide-sec"><h3>18. Labour Requirement</h3><p>Best suited to '+esc(f.farmer)+'. Labour needs follow the scale of operation — confirm locally.</p></div>'
    +'<div class="guide-sec"><h3>19. Technology Used</h3><p>'+esc(f.tech)+'. Tools are listed under equipment above.</p></div>'
    +'<div class="guide-sec"><h3>20. Approximate Cost Information</h3><p>Investment level: <b>'+esc(f.invest)+'</b>. Exact cost varies by region, scale and year — confirm with the local agri office or KVK. No fixed figure is stated here.</p></div>'
    +'<div class="guide-sec"><h3>21. Suitable Regions</h3><p>'+esc(f.regions||"Information not available.")+'</p></div>'
    +'<div class="guide-sec"><h3>22. Best Practices</h3><ul>'+((f.best||[]).map(b=>'<li>'+esc(b)+'</li>').join("")||'<li>Follow the process steps in order.</li>')+'</ul></div>'
    +'<div class="guide-sec"><h3>23. Sources</h3><div class="src-note">'+esc(f.sources||"AgriMitra compilation; verify with KVK / state agriculture department.")+'</div></div>'
    +'<div class="section-title"><h2>Related Farming Types</h2><a href="#/farming-types">All types →</a></div><div class="crop-grid ft4">'+rel.map(ftCard).join("")+'</div>';
  }catch(e){
    console.error(e);
    app.innerHTML='<div class="empty"><h3>Unable to load this farming guide.</h3><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><a class="btn btn-sm" href="#/farming-types">Back to Farming Types</a><button class="btn btn-primary btn-sm" onclick="render()">Try Again</button></div></div>';
  }
  window.scrollTo(0,0);
}
function ftDetail(name){
  try{ const L=ftAll(); const hit=L.find(x=>x&&(x.id===name||x.name===name)); if(hit){ location.hash="#/farming-types/"+hit.id; return; } }catch(e){}
  const f = DB.farmingTypes.find(x=>x.name===name); if(!f) return;
  const rows = [["Definition",f.def],["How it works",f.works],["Suitable crops",f.crops],["Climate",f.climate],["Soil",f.soil],["Water",f.water],["Advantages",f.adv],["Limitations",f.lim],["Investment",f.invest],["Regions",f.regions],["Farmer",f.farmer]];
  app.innerHTML = '<a href="#/farming-types">&larr; All types</a><div class="card" style="margin-top:10px"><h2 style="margin:0">'+esc(f.name)+'</h2><dl class="kv">'+rows.map(r=>'<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>').join("")+'</dl><a class="btn btn-primary btn-sm" href="#/farming-types">Open full guide →</a></div>';
  window.scrollTo(0,0);
}

/* ---------- CROPS (100+ module: reusable Card/Grid/Detail + dynamic route) ---------- */
const CROP_IMG_FALLBACK = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#d3f9d8'/><stop offset='1' stop-color='#2d6a4f'/></linearGradient></defs><rect width='600' height='400' fill='url(#g)'/><text x='300' y='185' font-size='72' text-anchor='middle'>🌾</text><text x='300' y='250' font-size='26' text-anchor='middle' fill='#fff' font-family='sans-serif'>AgriMitra Crop</text></svg>");
function nxCrops(){ return (window.CROPS_DATA && window.CROPS_DATA.length) ? window.CROPS_DATA : []; }
function nxFind(id){ const L=nxCrops(); return L.find(c=>c && c.id===id) || null; }
function nxState(){ return store.get("nxCropFilters", {q:"",cat:"All",season:"All",water:"All",dur:"All",sort:"az",shown:24}); }
function nxMatchSeason(c,s){ if(!s||s==="All") return true; const v=(c.season||""); if(s==="Zaid") return v.indexOf("Zaid")>-1 || v.indexOf("Summer")>-1 || v.indexOf("Year-round")>-1; return v.indexOf(s)>-1; }
function nxMatchWater(c,w){ if(!w||w==="All") return true; const v=(c.waterRequirement||"").replace(/[–—]/g,"-").toLowerCase(); return v.indexOf(w.toLowerCase())>-1; }
function nxMatchDur(c,d){ if(!d||d==="All") return true; const n=c.days||0; if(d==="Short") return n>0&&n<90; if(d==="Medium") return n>=90&&n<=140; if(d==="Long") return n>140; return true; }
function nxFiltered(f){
  let L = nxCrops().filter(c=>c && c.id && c.name).filter(c=>{
    const q=(f.q||"").toLowerCase();
    const okQ = !q || ((c.name||"")+" "+(c.scientificName||"")+" "+(c.category||"")).toLowerCase().indexOf(q)>-1;
    const okC = !f.cat || f.cat==="All" || c.category===f.cat;
    return okQ && okC && nxMatchSeason(c,f.season||"All") && nxMatchWater(c,f.water||"All") && nxMatchDur(c,f.dur||"All");
  });
  if(f.sort==="za") L.sort((a,b)=>String(b.name).localeCompare(String(a.name)));
  else if(f.sort==="short") L.sort((a,b)=>(a.days||9999)-(b.days||9999));
  else if(f.sort==="long") L.sort((a,b)=>(b.days||0)-(a.days||0));
  else L.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  return L;
}
function CropCard(c){
  const img = c.image ? '<img src="'+esc(c.image)+'" alt="'+esc(c.name)+'" loading="lazy" onerror="this.onerror=null;this.src=CROP_IMG_FALLBACK;">' : '<img src="'+CROP_IMG_FALLBACK+'" alt="crop placeholder" loading="lazy">';
  return '<article class="crop-card"><div class="crop-img">'+img+'<span class="crop-cat">'+esc(c.category||"Crop")+'</span></div>'
  +'<div class="crop-body"><h3>'+esc(c.name)+'</h3><p class="crop-sci">'+esc(c.category||"")+' • '+esc(c.season||"")+'</p>'
  +'<p class="crop-desc">'+esc(c.shortDescription||"")+'</p>'
  +'<div class="crop-meta"><div><b>Temperature</b>🌡 '+esc(c.temperature||"—")+'</div><div><b>Duration</b>📅 '+esc(c.duration||"—")+'</div><div><b>Water</b>💧 '+esc(c.waterRequirement||"—")+'</div></div>'
  +'<a class="crop-guide-btn" href="#/crops/'+esc(c.id)+'">View Guide →</a></div></article>';
}
function pageCrops(q){
  const f = nxState(); 
  if(q){ f.q=q; f.shown=24; }
  else { f.q=""; f.cat="All"; f.season="All"; f.water="All"; f.dur="All"; f.sort="az"; f.shown=24; store.set("nxCropFilters",f); }
  const cats = window.CROP_CATEGORIES || ["Cereals","Pulses","Oilseeds","Commercial Crops","Vegetables","Fruits","Spices","Plantation","Flowers","Horticulture"];
  return '<div class="section-title"><h2>Crop Information</h2><span class="badge">'+nxCrops().length+' crops</span></div>'
  +'<p class="muted">Explore detailed farming guides for 100+ crops • <a href="#/paddy-varieties"><b>Paddy Varieties Center (110) →</b></a> • <a href="#/data-sources">Data sources →</a></p>'
  +'<div class="crop-toolbar"><div class="row"><input id="nxQ" placeholder="Search crop name..." value="'+esc(f.q||"")+'">'
  +'<select id="nxCat" aria-label="Category"><option>All</option>'+cats.map(c=>'<option'+(c===f.cat?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select>'
  +'<select id="nxSeason" aria-label="Season"><option>All</option><option'+(f.season==="Kharif"?" selected":"")+'>Kharif</option><option'+(f.season==="Rabi"?" selected":"")+'>Rabi</option><option'+(f.season==="Zaid"?" selected":"")+'>Zaid</option><option'+(f.season==="Perennial"?" selected":"")+'>Perennial</option></select>'
  +'<select id="nxWater" aria-label="Water"><option>All</option><option'+(f.water==="Low"?" selected":"")+'>Low</option><option'+(f.water==="Medium"?" selected":"")+'>Medium</option><option'+(f.water==="High"?" selected":"")+'>High</option></select>'
  +'<select id="nxDur" aria-label="Crop duration"><option value="All">All durations</option><option value="Short"'+(f.dur==="Short"?" selected":"")+'>Short (&lt;90 days)</option><option value="Medium"'+(f.dur==="Medium"?" selected":"")+'>Medium (90–140 days)</option><option value="Long"'+(f.dur==="Long"?" selected":"")+'>Long (&gt;140 days)</option></select>'
  +'<select id="nxSort" aria-label="Sort"><option value="az"'+(f.sort==="az"?" selected":"")+'>A-Z</option><option value="za"'+(f.sort==="za"?" selected":"")+'>Z-A</option><option value="short"'+(f.sort==="short"?" selected":"")+'>Shortest Duration</option><option value="long"'+(f.sort==="long"?" selected":"")+'>Longest Duration</option></select></div>'
  +'<div class="row" style="margin-top:10px"><button class="btn btn-sm" id="nxClear">Clear Filters</button><span class="crop-count" id="nxCount"></span></div></div>'
  +'<div class="crop-grid" id="nxGrid"></div><div style="text-align:center"><button class="btn btn-primary loadmore" id="nxMore">Load More</button></div>';
}
function nxRenderGrid(){
  const grid=document.getElementById("nxGrid"); if(!grid) return;
  const f=nxState(); const L=nxFiltered(f); const vis=L.slice(0,f.shown||24);
  const total=nxCrops().length;
  if(vis.length){
    grid.innerHTML = vis.map(CropCard).join("");
  }else if(total===0){
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>Crop information could not be loaded.</h3><p class="muted">The crop dataset is empty or failed to load.</p><button class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button></div>';
  }else{
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>No crops match these filters.</h3><p class="muted small">Try clearing filters or broadening your search.</p><button class="btn btn-primary btn-sm" id="nxClear2">Clear Filters</button></div>';
  }
  const upto=Math.min(f.shown||24,L.length);
  document.getElementById("nxCount").textContent = L.length? ("Showing 1–"+upto+" of "+L.length+" crops") : (total===0?"No crops found":"No crops match these filters");
  const more=document.getElementById("nxMore"); if(more) more.style.display=(upto<L.length)?"":"none";
  const c2=document.getElementById("nxClear2"); if(c2) c2.onclick=nxReset;
}
function nxReset(){ store.set("nxCropFilters",{q:"",cat:"All",season:"All",water:"All",dur:"All",sort:"az",shown:24}); render(); }
function nxBindToolbar(){
  const upd=(k,v)=>{ const n=nxState(); n[k]=v; if(k!=="shown") n.shown=24; store.set("nxCropFilters",n); nxRenderGrid(); };
  const q=document.getElementById("nxQ"); if(q) q.oninput=()=>upd("q",q.value);
  const m={nxCat:"cat",nxSeason:"season",nxWater:"water",nxDur:"dur",nxSort:"sort"};
  Object.keys(m).forEach(id=>{ const e=document.getElementById(id); if(e) e.onchange=()=>upd(m[id],e.value); });
  const cl=document.getElementById("nxClear"); if(cl) cl.onclick=nxReset;
  const mo=document.getElementById("nxMore"); if(mo) mo.onclick=()=>{ const n=nxState(); n.shown=(n.shown||24)+24; store.set("nxCropFilters",n); nxRenderGrid(); };
  nxRenderGrid();
}
function CropTimeline(stages){
  stages = stages || [];
  if(!stages.length) return '<p class="muted">Stage information will be added for this crop.</p>';
  return '<div class="stages">'+stages.map(s=>'<div class="stage"><b>●</b>'+esc((s&&s.stage)||"Stage")+'<br><span class="muted">'+esc((s&&s.detail)||"")+'</span></div>').join("")+'</div>';
}
function RelatedCrops(c){
  const L=nxCrops().filter(x=>x && x.id!==c.id);
  const same=L.filter(x=>x.category===c.category).slice(0,3);
  const rel=(same.length>=2?same:same.concat(L.filter(x=>x.category!==c.category)).slice(0,3));
  return '<div class="section-title"><h2>Related Crops</h2><a href="#/crops">All crops →</a></div><div class="crop-grid">'+rel.map(CropCard).join("")+'</div>';
}
function CropDetailPage(id){
  try{
    const c = nxFind(id);
    if(!c){ app.innerHTML='<div class="empty"><h3>Crop not found</h3><p class="muted">No guide exists for "'+esc(id||"")+'".</p><a class="btn btn-primary btn-sm" href="#/crops">Back to Crops</a></div>'; window.scrollTo(0,0); return; }
    const pests=(c.pests||[]), diseases=(c.diseases||[]), stages=(c.growthStages||[]);
    const img = c.image? '<img src="'+esc(c.image)+'" alt="'+esc(c.name)+'" loading="lazy" data-liveq="'+esc(c.name)+' farming" onerror="this.onerror=null;this.src=CROP_IMG_FALLBACK;">' : "";
    const cal=[["Land Preparation","Before sowing"],["Sowing",c.season+" window"],["Growth","Vegetative phase"],["Flowering","Mid-cycle"],["Maturity",c.duration],["Harvest","End of "+c.duration]];
    app.innerHTML = '<div class="crumb"><a href="#/home">Home</a> → <a href="#/crops">Crops</a> → <b>'+esc(c.name)+'</b></div>'
    +'<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-sm" href="#/crops">← Back to Crops</a><button class="btn btn-sm" onclick="window.print()">Print Guide</button></div>'
    +'<section class="guide-hero">'+img+'<div class="inner"><span class="badge">'+esc(c.category||"")+'</span> <span class="badge">'+esc(c.season||"")+'</span> <span class="badge">'+esc(c.duration||"")+'</span>'
    +'<h1>'+esc(c.name)+'</h1><p><i>'+esc(c.scientificName||"")+'</i></p><p>🌡 '+esc(c.temperature||"—")+' &nbsp;•&nbsp; 💧 '+esc(c.waterRequirement||"—")+'</p></div></section>'
    +'<div class="guide-sec"><h3>Crop Overview</h3><p>'+esc(c.shortDescription||"")+'</p><dl class="kv"><dt>Major regions</dt><dd>'+esc((c.majorRegions||[]).join(", ")||"Across India — confirm district suitability")+'</dd><dt>Importance</dt><dd>'+esc(c.category||"")+' crop contributing to farm income and cropping-system diversity.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Climate Requirements</h3><dl class="kv"><dt>Temperature</dt><dd>'+esc(c.temperature||"—")+'</dd><dt>Rainfall</dt><dd>'+esc(c.rainfall||"—")+'</dd><dt>Humidity</dt><dd>Moderate; prolonged humidity raises fungal pressure — ensure airflow.</dd><dt>Climate</dt><dd>'+esc(c.climate||"")+'</dd><dt>Suitable season</dt><dd>'+esc(c.season||"")+'</dd></dl></div>'
    +'<div class="guide-sec"><h3>Soil Requirements</h3><dl class="kv"><dt>Suitable soil</dt><dd>'+esc(c.soil||"")+'</dd><dt>Drainage</dt><dd>Good drainage is essential; avoid waterlogging.</dd><dt>Soil preparation</dt><dd>Plough, level, add well-rotted organic matter; test soil via Soil Health Card.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Seed Information</h3><dl class="kv"><dt>Seed rate</dt><dd>'+esc(c.seedRate||"")+'</dd><dt>Sowing</dt><dd>'+esc(c.sowing||"")+'</dd><dt>Spacing</dt><dd>'+esc(c.spacing||"")+'</dd><dt>Varieties</dt><dd>'+esc((c.varieties||[]).join(" "))+'</dd><dt>Seed quality &amp; treatment</dt><dd>Use clean certified seed with &gt;85% germination; treat with recommended fungicide/bio-agent and Rhizobium for legumes.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Land Preparation</h3><ol>'+((c.landPreparation||[]).map(s=>'<li>'+esc(s)+'</li>').join("")||'<li>Prepare a fine level seedbed.</li>')+'</ol></div>'
    +'<div class="guide-sec"><h3>Sowing / Planting</h3><dl class="kv"><dt>Season</dt><dd>'+esc(c.season||"")+'</dd><dt>Method</dt><dd>'+esc(c.sowing||"")+'</dd><dt>Spacing</dt><dd>'+esc(c.spacing||"")+'</dd><dt>Seed requirement</dt><dd>'+esc(c.seedRate||"")+'</dd></dl></div>'
    +'<div class="guide-sec"><h3>Nutrient Management</h3><ul>'+((c.nutrientManagement||[]).map(s=>'<li>'+esc(s)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>Irrigation</h3><ul>'+((c.irrigation||[]).map(s=>'<li>'+esc(s)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>Weed Management</h3><ul>'+((c.weedManagement||[]).map(s=>'<li>'+esc(s)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>Pest Management</h3>'+(pests.length?pests.map(p=>'<div class="card" style="margin:8px 0"><b>'+esc(p.name)+'</b><dl class="kv"><dt>Symptoms</dt><dd>'+esc(p.symptoms)+'</dd><dt>Prevention</dt><dd>'+esc(p.prevention)+'</dd><dt>Monitoring</dt><dd>'+esc(p.monitoring)+'</dd><dt>Integrated management</dt><dd>'+esc(p.management)+'</dd></dl></div>').join(""):'<p class="muted">Scout weekly; use traps and neem as first response.</p>')+'</div>'
    +'<div class="guide-sec"><h3>Disease Management</h3>'+(diseases.length?diseases.map(d=>'<div class="card" style="margin:8px 0"><b>'+esc(d.name)+'</b><dl class="kv"><dt>Symptoms</dt><dd>'+esc(d.symptoms)+'</dd><dt>Cause</dt><dd>'+esc(d.cause)+'</dd><dt>Prevention</dt><dd>'+esc(d.prevention)+'</dd><dt>Management</dt><dd>'+esc(d.management)+'</dd></dl></div>').join(""):'<p class="muted">Use clean seed, rotation and drainage as first defence.</p>')+'<div class="alert green">Prefer resistant types, sanitation, traps and bio-agents. No unsafe chemical instructions are given here — follow local advisory labels.</div></div>'
    +'<div class="guide-sec"><h3>Crop Growth Stages</h3>'+CropTimeline(stages)+'</div>'
    +'<div class="guide-sec"><h3>Harvesting</h3><ul>'+((c.harvesting||[]).map(s=>'<li>'+esc(s)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>Post-Harvest</h3><ul>'+((c.postHarvest||[]).map(s=>'<li>'+esc(s)+'</li>').join(""))+'</ul><h3 style="margin-top:12px">Storage</h3><ul>'+((c.storage||[]).map(s=>'<li>'+esc(s)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>Market / Selling</h3><p>'+esc(c.marketInformation||"")+'</p><a class="btn btn-primary btn-sm" href="#/market?q='+encodeURIComponent(String(c.name).split(" ")[0])+'">Check Market Prices →</a></div>'
    +'<div class="guide-sec"><h3>Crop Calendar</h3><div class="table-wrap"><table style="min-width:0"><thead><tr><th>Stage</th><th>Timing</th></tr></thead><tbody>'+cal.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>').join("")+'</tbody></table></div></div>'
    +'<div class="guide-sec"><h3>Estimated Farming Cost</h3><p class="muted">Enter your own per-acre costs — nothing here is pre-filled, so no fabricated prices are shown. Costs vary by region, season and method; verify with your local agri office.</p><div class="table-wrap"><table style="min-width:0"><thead><tr><th>Cost head</th><th>Your cost (₹/acre)</th></tr></thead><tbody>'
    +["Seeds","Land preparation","Labour","Fertilizer","Irrigation","Plant protection","Harvesting","Transportation"].map((h,i)=>'<tr><td>'+h+'</td><td><input id="cc'+i+'" type="number" min="0" value="" placeholder="0" style="width:130px;padding:8px 10px;border:1px solid var(--line);border-radius:8px"></td></tr>').join("")
    +'</tbody></table></div><div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn btn-primary btn-sm" id="ccGo">Calculate Total</button><b id="ccOut"></b></div><p class="muted small">Illustrative estimator only — enter real local figures. No live prices are shown here.</p></div>'
    +'<div class="guide-sec"><h3>Common Problems</h3><ul>'
    +(pests.length?pests.map(p=>'<li><b>'+esc(p.name)+':</b> '+esc(p.symptoms)+' — '+esc(p.prevention)+'</li>').join(""):'<li>Scout weekly from early growth so problems are caught early.</li>')
    +(diseases.length?diseases.map(d=>'<li><b>'+esc(d.name)+':</b> '+esc(d.symptoms)+' — '+esc(d.prevention)+'</li>').join(""):'')
    +'<li><b>Water stress:</b> wilting at midday that persists overnight — irrigate at the critical stages above; mulch to hold moisture.</li>'
    +'<li><b>Yellowing / poor growth:</b> often nutrient deficiency — confirm with a soil test before adding fertilizer.</li>'
    +'<li><b>Weed pressure:</b> weeds seeding in the first 30–45 days — hoe/mulch on time; never let weeds set seed.</li>'
    +'<li><b>Low market price:</b> compare 2 mandis + eNAM, grade the produce, and consider FPO pooling before selling.</li></ul></div>'
    +'<div class="guide-sec"><h3>Quick Summary</h3><dl class="kv"><dt>Crop</dt><dd>'+esc(c.name)+'</dd><dt>Category</dt><dd>'+esc(c.category)+'</dd><dt>Season</dt><dd>'+esc(c.season)+'</dd><dt>Duration</dt><dd>'+esc(c.duration)+'</dd><dt>Temperature</dt><dd>'+esc(c.temperature)+'</dd><dt>Soil</dt><dd>'+esc(c.soil)+'</dd><dt>Water</dt><dd>'+esc(c.waterRequirement)+'</dd><dt>Harvest</dt><dd>'+esc(((c.harvesting||[])[0]||"At maturity signs above"))+'</dd><dt>Major pests</dt><dd>'+esc(pests.map(p=>p.name).join(", ")||"—")+'</dd><dt>Major diseases</dt><dd>'+esc(diseases.map(d=>d.name).join(", ")||"—")+'</dd></dl></div>'
    +RelatedCrops(c);
    try{ const g=document.getElementById("ccGo"); if(g) g.onclick=()=>{ let t=0; for(let i=0;i<8;i++){ t+=+((document.getElementById("cc"+i)||{}).value||0); } const o=document.getElementById("ccOut"); if(o) o.textContent="Estimated total: \u20B9"+t.toLocaleString("en-IN")+" /acre (your figures)"; }; }catch(e2){}
  }catch(e){
    console.error(e);
    app.innerHTML='<div class="empty"><h3>Unable to load this crop guide.</h3><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><a class="btn btn-sm" href="#/crops">Back to Crops</a><button class="btn btn-primary btn-sm" onclick="render()">Try Again</button></div></div>';
  }
  window.scrollTo(0,0);
}
/* Legacy 19-crop detail (dashboard/search) resolves into the new module when possible. */
function cropDetail(name){
  try{
    const L=nxCrops(); const hit=L.find(c=>c&&(c.id===name||c.name===name));
    if(hit){ location.hash="#/crops/"+hit.id; return; }
  }catch(e){}
  const c = DB.crops.find(x=>x.name===name); if(!c) return;
  const rows = [["Category",c.cat],["Suitable soil",c.soil],["Suitable climate",c.climate],["Seed selection",c.seedSel],["Seed quantity",c.seedQty],["Sowing method",c.sowing],["Spacing",c.spacing],["Fertilizer requirements",c.fert+" (apply only per soil-test & state chart)"],["Irrigation schedule",c.irrig],["Weed management",c.weed],["Pest management",c.pest],["Disease management",c.disease],["Growth stages",c.stages],["Duration",c.duration],["Harvesting",c.harvest],["Storage",c.storage],["Selling",c.sell]];
  app.innerHTML = '<a href="#/crops">&larr; All crops</a><div class="detail-hero" style="margin-top:10px"><div class="big">'+c.icon+'</div><div><h2 style="margin:0">'+esc(c.name)+'</h2><span class="badge">'+esc(c.cat)+'</span> <span class="badge blue">'+esc(c.duration)+'</span><p class="muted">'+esc(c.climate)+'</p></div></div>'
  +'<div class="card" style="margin-top:12px"><dl class="kv">'+rows.map(r=>'<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>').join("")+'</dl>'
  +'<div class="alert">Fertilizer/chemical advice is general. Follow your Soil Health Card &amp; local agriculture officer for exact dosage.</div>'
  +'<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" id="saveCropBtn">+ Save to My Farm</button><a class="btn btn-sm" href="#/diseases?q='+encodeURIComponent(c.name.split("/")[0].trim())+'">Pests of this crop &rarr;</a><a class="btn btn-sm" href="#/market?q='+encodeURIComponent(c.name.split("/")[0].trim())+'">Market price &rarr;</a></div></div>';
  const b = document.getElementById("saveCropBtn");
  if(b) b.onclick = ()=>{ store.set("crop", c.name); alert(c.name+" saved to My Farm!"); location.hash="#/dashboard"; };
  window.scrollTo(0,0);
}

/* ---------- PADDY VARIETIES (110, reusable Card/Grid/Detail + dynamic route) ---------- */
function pvList(){ return (window.PADDY_VARIETIES && window.PADDY_VARIETIES.length) ? window.PADDY_VARIETIES : []; }
function pvFind(id){ const L=pvList(); return L.find(v=>v && v.id===id) || null; }
function pvGroupOf(v){ const n=v.name||""; if(n.indexOf("DRR Dhan")===0) return "DRR Dhan"; if(n.indexOf("Pusa Basmati")===0) return "Pusa Basmati"; if(n.indexOf("CR ")===0) return "CR Dhan"; const pre=n.split(" ")[0]; return (["MTU","BPT","NLR","RGL","JGL","WGL","IR","PR"].indexOf(pre)>-1)?pre:"Other"; }
function pvState(){ return store.get("pvFilters", {q:"",group:"All",season:"All",dur:"All",grain:"All",region:"",shown:24}); }
function pvDurMatch(v,d){ if(!d||d==="All") return true; const n=v.days||0; if(!n) return false; if(d==="Short") return n<120; if(d==="Medium") return n>=120&&n<=140; if(d==="Long") return n>140; return true; }
function pvFiltered(f){
  let L = pvList().filter(v=>v && v.id && v.name).filter(v=>{
    const q=(f.q||"").toLowerCase();
    const okQ = !q || ((v.name||"")).toLowerCase().indexOf(q)>-1;
    const okG = !f.group || f.group==="All" || pvGroupOf(v)===f.group;
    const okS = !f.season || f.season==="All" || (v.season||"").indexOf(f.season)>-1;
    const okR = !f.region || ((v.suitableRegions||"")).toLowerCase().indexOf(f.region.toLowerCase())>-1;
    const okGr = !f.grain || f.grain==="All" || (v.grainType||"")===f.grain;
    return okQ && okG && okS && okR && okGr && pvDurMatch(v,f.dur||"All");
  });
  if(f.sort==="za") L.sort((a,b)=>String(b.name).localeCompare(String(a.name)));
  else if(f.sort==="short") L.sort((a,b)=>((a.days||99999)-(b.days||99999)));
  else if(f.sort==="long") L.sort((a,b)=>((b.days||-1)-(a.days||-1)));
  else L.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  return L;
}
function pvCard(v){
  const img = v.image ? '<img src="'+esc(v.image)+'" alt="Paddy field" loading="lazy" onerror="this.onerror=null;this.src=CROP_IMG_FALLBACK;">' : '<img src="'+CROP_IMG_FALLBACK+'" alt="Paddy variety image unavailable" loading="lazy">';
  return '<article class="crop-card"><div class="crop-img">'+img+'<span class="crop-cat">Paddy</span><span class="var-unavail">Variety image unavailable</span></div>'
  +'<div class="crop-body"><h3>'+esc(v.name)+'</h3><p class="crop-sci">Oryza sativa • '+esc(pvGroupOf(v))+'</p>'
  +'<p class="crop-desc">'+esc(v.description||"")+'</p>'
  +'<div class="crop-meta"><div><b>Season</b>'+esc(v.season||"—")+'</div><div><b>Duration</b>'+esc(v.duration||"—")+'</div><div><b>Region</b>'+esc(String(v.suitableRegions||"—").split(",")[0])+'</div></div>'
  +'<a class="crop-guide-btn" href="#/paddy-varieties/'+esc(v.id)+'">View Details →</a></div></article>';
}
function pagePaddyVarieties(){
  const f = pvState();
  const groups = window.PADDY_GROUPS || ["MTU","BPT","NLR","RGL","JGL","WGL","IR","DRR Dhan","Pusa Basmati","PR","CR Dhan","Other"];
  const grains = [...new Set(pvList().map(v=>v.grainType).filter(g=>g && g!=="Information not available."))].sort();
  return '<div class="section-title"><h2>Paddy Varieties</h2><span class="badge">'+pvList().length+' varieties</span></div>'
  +'<p class="muted">AgriMitra — Paddy Variety Knowledge Center • <a href="#/data-sources">Data sources →</a></p>'
  +'<div class="crop-toolbar"><div class="row"><input id="pvQ" placeholder="Search variety name..." value="'+esc(f.q||"")+'">'
  +'<select id="pvGroup" aria-label="Variety group"><option>All</option>'+groups.map(g=>'<option'+(g===f.group?" selected":"")+'>'+esc(g)+'</option>').join("")+'</select>'
  +'<select id="pvSeason" aria-label="Season"><option>All</option><option'+(f.season==="Kharif"?" selected":"")+'>Kharif</option><option'+(f.season==="Rabi"?" selected":"")+'>Rabi</option><option'+(f.season==="Kharif (irrigated)"?" selected":"")+'>Kharif (irrigated)</option></select>'
  +'<select id="pvDur" aria-label="Duration"><option value="All">All durations</option><option value="Short"'+(f.dur==="Short"?" selected":"")+'>Short (&lt;120 days)</option><option value="Medium"'+(f.dur==="Medium"?" selected":"")+'>Medium (120–140 days)</option><option value="Long"'+(f.dur==="Long"?" selected":"")+'>Long (&gt;140 days)</option></select>'
  +'<select id="pvGrain" aria-label="Grain type"><option>All</option>'+grains.map(g=>'<option'+(g===f.grain?" selected":"")+'>'+esc(g)+'</option>').join("")+'</select>'
  +'<input id="pvRegion" placeholder="State / Region..." value="'+esc(f.region||"")+'" aria-label="Region">'
  +'<select id="pvSort" aria-label="Sort"><option value="az"'+(f.sort==="az"?" selected":"")+'>A-Z</option><option value="za"'+(f.sort==="za"?" selected":"")+'>Z-A</option><option value="short"'+(f.sort==="short"?" selected":"")+'>Shortest Duration</option><option value="long"'+(f.sort==="long"?" selected":"")+'>Longest Duration</option></select></div>'
  +'<div class="row" style="margin-top:10px"><button class="btn btn-sm" id="pvClear">Clear Filters</button><span class="crop-count" id="pvCount"></span></div></div>'
  +'<div class="crop-grid" id="pvGrid"></div><div style="text-align:center"><button class="btn btn-primary loadmore" id="pvMore">Load More</button></div>';
}
function pvRenderGrid(){
  const grid=document.getElementById("pvGrid"); if(!grid) return;
  const f=pvState(); const L=pvFiltered(f); const vis=L.slice(0,f.shown||24);
  grid.innerHTML = vis.length? vis.map(pvCard).join("") : '<div class="empty" style="grid-column:1/-1"><h3>No varieties match these filters.</h3><button class="btn btn-sm" id="pvClear2">Clear Filters</button></div>';
  const upto=Math.min(f.shown||24,L.length);
  document.getElementById("pvCount").textContent = L.length? ("Showing 1–"+upto+" of "+L.length+" varieties") : "No varieties found";
  const more=document.getElementById("pvMore"); if(more) more.style.display=(upto<L.length)?"":"none";
  const c2=document.getElementById("pvClear2"); if(c2) c2.onclick=pvReset;
}
function pvReset(){ store.set("pvFilters",{q:"",group:"All",season:"All",dur:"All",grain:"All",region:"",sort:"az",shown:24}); render(); }
function pvBind(){
  const upd=(k,v)=>{ const n=pvState(); n[k]=v; if(k!=="shown") n.shown=24; store.set("pvFilters",n); pvRenderGrid(); };
  const q=document.getElementById("pvQ"); if(q) q.oninput=()=>upd("q",q.value);
  const r=document.getElementById("pvRegion"); if(r) r.oninput=()=>upd("region",r.value);
  const m={pvGroup:"group",pvSeason:"season",pvDur:"dur",pvGrain:"grain",pvSort:"sort"};
  Object.keys(m).forEach(id=>{ const e=document.getElementById(id); if(e) e.onchange=()=>upd(m[id],e.value); });
  const cl=document.getElementById("pvClear"); if(cl) cl.onclick=pvReset;
  const mo=document.getElementById("pvMore"); if(mo) mo.onclick=()=>{ const n=pvState(); n.shown=(n.shown||24)+24; store.set("pvFilters",n); pvRenderGrid(); };
  pvRenderGrid();
}
function PaddyDetailPage(id){
  try{
    const v = pvFind(id);
    if(!v){ app.innerHTML='<div class="empty"><h3>Paddy variety not found</h3><p class="muted">No variety exists for "'+esc(id||"")+'".</p><a class="btn btn-primary btn-sm" href="#/paddy-varieties">Back to Paddy Varieties</a></div>'; window.scrollTo(0,0); return; }
    const feats=(v.features||[]), img = v.image? '<img src="'+esc(v.image)+'" alt="Paddy field" loading="lazy" onerror="this.onerror=null;this.src=CROP_IMG_FALLBACK;">' : "";
    const rel0=pvList().filter(x=>x&&x.id!==v.id), same=rel0.filter(x=>pvGroupOf(x)===pvGroupOf(v)).slice(0,3);
    const rel=(same.length>=2?same:same.concat(rel0.filter(x=>pvGroupOf(x)!==pvGroupOf(v))).slice(0,3));
    app.innerHTML = '<div class="crumb"><a href="#/home">Home</a> → <a href="#/paddy-varieties">Paddy Varieties</a> → <b>'+esc(v.name)+'</b></div>'
    +'<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-sm" href="#/paddy-varieties">← Back to Paddy Varieties</a><button class="btn btn-sm" onclick="window.print()">Print Guide</button></div>'
    +'<section class="guide-hero">'+img+'<div class="inner"><span class="badge">Paddy</span> <span class="badge">'+esc(pvGroupOf(v))+'</span> <span class="badge">'+esc(v.season||"—")+'</span>'
    +'<h1>'+esc(v.name)+'</h1><p><i>Oryza sativa</i> • ⏳ '+esc(v.duration||"Information not available.")+'</p><p class="small">Variety-specific photo unavailable — generic paddy image shown.</p></div></section>'
    +'<div class="guide-sec"><h3>Variety Overview</h3><dl class="kv"><dt>Variety name</dt><dd>'+esc(v.name)+'</dd><dt>Variety group</dt><dd>'+esc(pvGroupOf(v))+'</dd><dt>Suitable regions</dt><dd>'+esc(v.suitableRegions||"Information not available.")+'</dd><dt>Characteristics</dt><dd>'+esc(feats.join("; ")||"Information not available.")+'</dd></dl><p>'+esc(v.description||"")+'</p></div>'
    +'<div class="guide-sec"><h3>Climate</h3><dl class="kv"><dt>Temperature</dt><dd>Warm kharif conditions suit paddy; exact range for this variety: Information not available.</dd><dt>Rainfall</dt><dd>Information not available.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Soil</h3><dl class="kv"><dt>Suitable soil</dt><dd>'+esc(v.suitableSoil||"Information not available.")+'</dd><dt>Drainage</dt><dd>Levelled puddled fields with controlled standing water; avoid stagnation at maturity.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Seed Information</h3><dl class="kv"><dt>Seed selection</dt><dd>Use certified seed of this variety from an authorised source.</dd><dt>Seed quality</dt><dd>Clean graded seed with high germination.</dd><dt>Seed treatment</dt><dd>Treat with recommended fungicide plus Trichoderma as per label.</dd><dt>Seed requirement</dt><dd>Information not available. Verify rate with the local advisory for this variety.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Sowing / Transplanting</h3><dl class="kv"><dt>Season</dt><dd>'+esc(v.season||"Information not available.")+'</dd><dt>Method</dt><dd>Nursery raising followed by transplanting at 21–25 days, or direct seeding where locally practised.</dd><dt>Spacing</dt><dd>Information not available. Follow the spacing advised locally for this variety.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Water Management</h3><dl class="kv"><dt>Water requirement</dt><dd>'+esc(v.waterRequirement||"Information not available.")+'</dd><dt>Irrigation</dt><dd>Maintain shallow standing water through tillering; drain before harvest.</dd><dt>Critical stages</dt><dd>Tillering, panicle initiation and flowering must not face stress.</dd><dt>Drainage</dt><dd>Drain the field fully a week before harvest.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Nutrient Management</h3><p>Apply balanced farmyard manure plus NPK in splits through the season.</p><p><b>Follow soil-test-based recommendations and local agricultural advisories.</b> No variety-specific dosage is prescribed here.</p></div>'
    +'<div class="guide-sec"><h3>Pests</h3><p class="muted">Common paddy pests (crop-level guidance, not variety resistance claims): stem borer (dead-hearts, white ears) and brown planthopper (hopperburn) — use light traps, bird perches, neem and need-based control per advisory.</p></div>'
    +'<div class="guide-sec"><h3>Diseases</h3><p class="muted">Common paddy diseases: blast (eye-shaped leaf spots, neck rot) and bacterial leaf blight (water-soaked stripes) — use resistant seed lots where available, clean seed, field sanitation and Trichoderma.</p></div>'
    +'<div class="guide-sec"><h3>Harvest</h3><dl class="kv"><dt>Duration</dt><dd>'+esc(v.duration||"Information not available.")+'</dd><dt>Indicators</dt><dd>About 80% of panicles golden; grain hard at ~20% moisture.</dd><dt>Method</dt><dd>Cut, dry thresh and winnow promptly.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Grain / Quality</h3><dl class="kv"><dt>Grain type</dt><dd>'+esc(v.grainType||"Information not available.")+'</dd><dt>Appearance / cooking / milling</dt><dd>Information not available.</dd></dl></div>'
    +'<div class="guide-sec"><h3>Market</h3><p>Commodity-level paddy prices only — the market service does not provide variety-level prices, and none are claimed here.</p><a class="btn btn-primary btn-sm" href="#/market?q=Paddy">Check Current Paddy Market Prices →</a></div>'
    +'<div class="guide-sec"><h3>Source</h3><div class="src-note"><b>Information source:</b> '+esc(v.source||"AgriMitra compilation; verify locally.")+'<br><b>Image source:</b> generic paddy-field image (variety-specific photo unavailable); no image is claimed to show this exact variety.</div></div>'
    +'<div class="section-title"><h2>Related Varieties</h2><a href="#/paddy-varieties">All varieties →</a></div><div class="crop-grid">'+rel.map(pvCard).join("")+'</div>';
  }catch(e){
    console.error(e);
    app.innerHTML='<div class="empty"><h3>Unable to load this variety guide.</h3><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><a class="btn btn-sm" href="#/paddy-varieties">Back to Paddy Varieties</a><button class="btn btn-primary btn-sm" onclick="render()">Try Again</button></div></div>';
  }
  window.scrollTo(0,0);
}


/* ---------- GUIDE ---------- */
function pageGuide(){
  return '<div class="section-title"><h2>A-to-Z Farming Guide</h2></div><p class="muted">Land Preparation to Selling &mdash; follow in order.</p>'
  +'<div class="timeline">'+DB.guideSteps.map((s,i)=>'<div class="step" data-n="'+(i+1)+'"><b>'+s.icon+' '+esc(s.t)+'</b><p class="muted" style="margin:6px 0 0">'+esc(s.d)+'</p></div>').join("")+'</div>';
}

/* ---------- MARKET (backend-first; honest LIVE / CACHED / SAMPLE states) ---------- */
const MARKET_DATASET_URL = "https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi";
function mkS(){ if(!window._mk) window._mk={records:[],status:"loading",err:"",meta:{},detail:-1,timer:null}; return window._mk; }
function mkRs(v){ return (v===null||v===undefined||v==="")?"—":"₹"+Number(v).toLocaleString("en-IN"); }
function mkWhen(iso){ try{ return new Date(iso).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); }catch(e){ return iso||"—"; } }
function pageMarket(q, comm){
  q=q||""; comm=comm||q;
  const mandals = DB.locations.mandals;
  return '<div class="section-title"><h2>Current Government Mandi Prices (Daily)</h2><button class="btn btn-primary btn-sm" id="mkRefresh">↻ Refresh Prices</button></div>'
  +'<p class="muted">Latest available daily records from the Government of India mandi dataset. This is daily administrative market data, not a real-time trading quote.</p>'
  +'<div class="card" id="mkStatus" style="margin-bottom:12px"><p class="muted">Loading…</p></div>'
  +'<div class="filters"><select id="mState" aria-label="State"><option value="">State: All</option></select>'
  +'<select id="mDist" aria-label="District"><option value="">District: All</option></select>'
  +'<select id="mMandal" aria-label="Mandal"><option value="">Mandal: All</option>'+mandals.map(m=>'<option>'+esc(m)+'</option>').join("")+'</select>'
  +'<select id="mMarket" aria-label="Market"><option value="">Market: All</option></select>'
  +'<select id="mComm" aria-label="Commodity"><option value="">Crop: All</option></select>'
  +'<select id="mVar" aria-label="Variety"><option value="">Variety: All</option></select>'
  +'<input id="mDate" placeholder="Date (e.g. 26/09/2026)" aria-label="Date">'
  +'<input id="mSearch" placeholder="Search crop or market..." value="'+esc(comm)+'" aria-label="Search" style="flex:1;min-width:200px"></div>'
  +'<p class="muted small" id="mkCount"></p>'
  +'<div class="table-wrap market-table-wrap"><table class="market-table"><thead><tr><th>Crop / Commodity</th><th>Variety</th><th>Market / APMC</th><th>District</th><th>State</th><th>Min Price</th><th>Max Price</th><th>Modal Price</th><th>Unit</th><th>Arrival Date</th><th>API Status</th><th>Market Full Details</th></tr></thead><tbody id="mkBody"><tr><td colspan="12" style="text-align:center">Loading…</td></tr></tbody></table></div>'
  +'<p class="muted small">* The Government dataset publishes minimum, maximum and modal prices by market/commodity/variety/date. Check the record date and unit before using a price for a sale decision.</p>'
  +'<div id="mkDetail" style="margin-top:12px"></div>'
  +'<div class="section-title"><h2>Modal price comparison</h2></div><div id="mkChart"><p class="muted">Chart appears with live records.</p></div>'
  +'<p class="muted small">Historical trend (7/30/90 days): this current-daily resource does not provide the selected history directly, so no invented trend is shown.</p>'
  +'<div class="alert" style="margin-top:12px">Source: Government of India Open Government Data Platform — <a href="'+MARKET_DATASET_URL+'" target="_blank" rel="noopener">Current Daily Price … (Mandi) dataset</a>.<br>Prices are indicative market data. Verify the latest price with the respective market/APMC before selling.</div>';
}
function mkStatusHTML(){
  const s=mkS();
  if(s.status==="loading") return '<p><span class="badge blue">… Loading</span></p><p class="muted">Contacting the market data service…</p>';
  if(s.status==="live") return '<p><b>🟢 Government API Data</b></p><p class="small">Fetched: <b>'+esc(mkWhen(s.meta.fetchedAt))+'</b> • Latest record date: <b>'+esc(s.meta.dataDate||"—")+'</b><br>Source: Government of India Open Government Data Platform</p>';
  if(s.status==="cached") return '<p><b>🟡 Cached Verified Data</b></p><p class="small">Live market data temporarily unavailable. Showing last verified market data.<br>Last Updated: <b>'+esc(mkWhen(s.meta.fetchedAt))+'</b></p>';
  if(s.status==="demo") return '<p><b>🔵 Verified Reference Data (sample)</b></p><p class="small">Backend unreachable — showing built-in sample records for layout only. These are <b>not</b> live prices.<br><button class="btn btn-sm" id="mkRetry">Try live again</button></p>';
  return '<p><b>🔴 Data Unavailable</b></p><p>'+esc(s.err||"Market data could not be loaded right now. Please try again later.")+'</p><button class="btn btn-sm" id="mkRetry">Try again</button>';
}
function mkPaintStatus(){
  const el=document.getElementById("mkStatus"); if(!el) return;
  el.innerHTML=mkStatusHTML();
  const r=document.getElementById("mkRetry"); if(r) r.onclick=()=>mkLoad(true);
}
function mkDemoRows(){
  return (DB.markets||[]).map(r=>({commodity:r.crop,variety:"—",grade:"",market:r.market,district:String(r.loc||"").split(",")[0],state:String(r.loc||"").split(",").slice(-1)[0]||"",minPrice:r.min,maxPrice:r.max,modalPrice:r.modal,unit:r.unit,date:r.upd}));
}
function mkUniq(a){ return [...new Set(a.filter(Boolean))].sort(); }
function mkFillFacets(){
  const s=mkS(), R=s.records;
  const get=id=>((document.getElementById(id)||{}).value||"");
  const kSt=get("mState"), kDi=get("mDist"), kMa=get("mMarket"), kCo=get("mComm"), kVa=get("mVar");
  const set=(id,allLabel,vals,keep)=>{ const e=document.getElementById(id); if(e) e.innerHTML='<option value="">'+allLabel+': All</option>'+vals.map(x=>'<option'+(x===keep?" selected":"")+'>'+esc(x)+'</option>').join(""); };
  set("mState","State",mkUniq(R.map(r=>r.state)),kSt);
  set("mDist","District",mkUniq(R.filter(r=>!kSt||r.state===kSt).map(r=>r.district)),kDi);
  set("mMarket","Market",mkUniq(R.filter(r=>(!kSt||r.state===kSt)&&(!kDi||r.district===kDi)).map(r=>r.market)),kMa);
  set("mComm","Crop",mkUniq(R.map(r=>r.commodity)),kCo);
  set("mVar","Variety",mkUniq(R.filter(r=>!kCo||r.commodity===kCo).map(r=>r.variety)),kVa);
}
function mkFiltered(){
  const gv=id=>((document.getElementById(id)||{}).value||"").trim();
  const st=gv("mState"), di=gv("mDist"), md=gv("mMandal").toLowerCase(), ma=gv("mMarket"), co=gv("mComm"), va=gv("mVar"), dt=gv("mDate"), q=gv("mSearch").toLowerCase();
  return mkS().records.filter(r=>(!st||r.state===st)&&(!di||r.district===di)&&(!ma||r.market===ma)&&(!co||r.commodity===co)&&(!va||r.variety===va)
    &&(!dt||(r.date||"").indexOf(dt)>-1)&&(!md||(r.market+" "+r.district).toLowerCase().indexOf(md)>-1)
    &&(!q||(r.commodity+" "+r.variety+" "+r.market+" "+r.district+" "+r.state).toLowerCase().indexOf(q)>-1));
}
function mkPaintTable(){
  const body=document.getElementById("mkBody"); if(!body) return;
  const s=mkS();
  if(s.status==="loading"){ body.innerHTML='<tr><td colspan="12" style="text-align:center">Loading…</td></tr>'; return; }
  if(s.status==="error"){ body.innerHTML='<tr><td colspan="12" style="text-align:center;color:var(--muted)">No data — see status above.</td></tr>'; document.getElementById("mkCount").textContent=""; return; }
  const rows=mkFiltered(), vis=rows.slice(0,100);
  const tag = s.status==="live"
    ? '<span class="badge live-api-badge">LIVE API</span>'
    : (s.status==="cached"
      ? '<span class="badge amber">CACHED</span>'
      : '<span class="badge demo">UNAVAILABLE</span>');
  document.getElementById("mkCount").textContent = rows.length
    ? ("Showing "+vis.length+" of "+rows.length+" records • Latest available API records")
    : "";
  body.innerHTML = rows.length ? vis.map(r=>{ const i=s.records.indexOf(r);
    const src=String(r.source||s.meta.source||"Market API");
    const live=r.isLive!==false && s.status==="live";
    const statusTag=live ? tag : '<span class="badge blue">'+esc(src.length>22?src.slice(0,22)+"…":src)+'</span>';
    return '<tr>'
      +'<td><b>'+esc(r.commodity||"—")+'</b></td>'
      +'<td>'+esc(r.variety||"—")+'</td>'
      +'<td><b>'+esc(r.market||"—")+'</b></td>'
      +'<td>'+esc(r.district||"—")+'</td>'
      +'<td>'+esc(r.state||"—")+'</td>'
      +'<td>'+mkRs(r.minPrice)+'</td>'
      +'<td>'+mkRs(r.maxPrice)+'</td>'
      +'<td><b class="modal-price">'+mkRs(r.modalPrice)+'</b></td>'
      +'<td>'+esc(r.unit||"Quintal")+'</td>'
      +'<td>'+esc(r.date||"—")+'</td>'
      +'<td>'+statusTag+'</td>'
      +'<td><button class="btn btn-sm market-detail-btn" data-mk="'+i+'">Market Full Details</button></td>'
      +'</tr>';
  }).join("") : '<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:24px">No market data available for this selection.</td></tr>';
  const ch=document.getElementById("mkChart");
  if(ch){ const top=rows.filter(r=>r.modalPrice!=null).slice(0,8);
    ch.innerHTML = top.length? barChart(top.map(r=>String(r.commodity).split(" ")[0]+"@"+String(r.market).split(" ")[0]), top.map(r=>r.modalPrice)) : '<p class="muted">Chart appears with live records.</p>'; }
}
function mkShowDetail(i){
  const s=mkS(), r=s.records[i]; if(!r) return;
  const same=s.records.filter(x=>x.market===r.market).slice(0,12);
  const comms=mkUniq(s.records.filter(x=>x.market===r.market).map(x=>x.commodity));
  document.getElementById("mkDetail").innerHTML='<div class="grid g2"><div class="card"><h3>'+esc(r.market)+'</h3>'
  +'<dl class="kv"><dt>District</dt><dd>'+esc(r.district)+'</dd><dt>State</dt><dd>'+esc(r.state)+'</dd><dt>Commodity</dt><dd>'+esc(r.commodity)+' ('+esc(r.variety||"—")+')</dd><dt>Latest modal price</dt><dd><b>'+mkRs(r.modalPrice)+'</b></dd><dt>Price range</dt><dd>'+mkRs(r.minPrice)+' – '+mkRs(r.maxPrice)+'</dd><dt>Last Updated</dt><dd>'+esc(r.date||s.meta.dataDate||"—")+'</dd></dl>'
  +'<p class="muted small">Market contact/address is not published in this dataset — confirm timings with the district APMC or <a href="https://agmarknet.gov.in" target="_blank" rel="noopener">agmarknet.gov.in</a>.</p></div>'
  +'<div class="card"><h3>Available commodities here ('+comms.length+')</h3><p class="small">'+comms.map(esc).join(", ")+'</p>'
  +'<div class="table-wrap"><table style="min-width:0"><thead><tr><th>Commodity</th><th>Modal</th><th>Date</th></tr></thead><tbody>'
  +same.map(x=>'<tr><td>'+esc(x.commodity)+'</td><td><b>'+mkRs(x.modalPrice)+'</b></td><td>'+esc(x.date)+'</td></tr>').join("")
  +'</tbody></table></div></div></div>';
  document.getElementById("mkDetail").scrollIntoView({behavior:"smooth"});
}
function mkLoad(force){
  const s=mkS();
  if(!window.Api){ s.status="demo"; s.records=mkDemoRows(); mkPaintAll(); return; }
  s.status="loading"; s.err=""; mkPaintStatus(); mkPaintTable();
  const rb=document.getElementById("mkRefresh"); if(rb){ rb.disabled=true; rb.textContent="↻ Loading…"; }
  if(force && window.Api.clearCache) Api.clearCache();
  const gv=id=>((document.getElementById(id)||{}).value||"").trim();
  const params={limit:500, state:gv("mState")||undefined, district:gv("mDist")||undefined, market:gv("mMarket")||undefined, commodity:gv("mComm")||undefined, variety:gv("mVar")||undefined, arrival_date:gv("mDate")||undefined};
  Object.keys(params).forEach(k=>params[k]===undefined&&delete params[k]);
  Api.marketPrices(params).then(r=>{
    if(r.ok && r.data && Array.isArray(r.data.records) && r.data.records.length){
      s.records=r.data.records.map(x=>({commodity:x.commodity,variety:x.variety,grade:x.grade,market:x.market,district:x.district,state:x.state,minPrice:x.minPrice,maxPrice:x.maxPrice,modalPrice:x.modalPrice,unit:x.unit||"Quintal*",date:x.arrivalDate}));
      s.meta={fetchedAt:r.data.fetchedAt,dataDate:r.data.dataDate}; s.status="live";
    } else if(r.ok && r.data && Array.isArray(r.data.records)) {
      s.records=[]; s.meta={fetchedAt:r.data.fetchedAt,dataDate:""}; s.status="error"; s.err="No verified data found for this request.";
    } else {
      const code=(r&&r.code)||"NETWORK_ERROR";
      if(code==="NOT_CONFIGURED"){ s.status="demo"; s.records=mkDemoRows(); s.meta={}; }
      else { s.status="error"; s.err="Market data could not be loaded right now. Please try again later."; }
    }
    mkPaintAll();
    const rb2=document.getElementById("mkRefresh"); if(rb2){ rb2.disabled=false; rb.textContent="↻ Refresh Prices"; }
  });
}
function mkPaintAll(){ mkPaintStatus(); mkFillFacets(); mkPaintTable(); }
function mkInit(prefill){
  if(window._mkT){ clearInterval(window._mkT); window._mkT=null; }
  ["mState","mDist","mMandal","mMarket","mComm","mVar","mDate"].forEach(id=>{
    const e=document.getElementById(id); if(e) e.onchange=()=>{ if(id==="mState"){ mkFillFacets(); mkPaintTable(); } else { mkFillFacets(); mkPaintTable(); } };
  });
  const ms=document.getElementById("mSearch"); if(ms) ms.oninput=mkPaintTable;
  const rb=document.getElementById("mkRefresh"); if(rb) rb.onclick=()=>mkLoad(true);
  if(prefill){ const se=document.getElementById("mSearch"); if(se) se.value=prefill; }
  mkLoad(false);
  window._mkT=setInterval(()=>{ if(!document.hidden && (location.hash||"").indexOf("#/market")===0) mkLoad(true); }, 20*60*1000);
}

/* ---------- WEATHER ---------- */
function pageWeather(){
  const w=DB.weatherDemo;
  return '<div class="section-title"><h2>Weather Dashboard <span class="badge demo">Demo Data</span></h2><select id="wPlace"><option>Guntur, AP</option><option>Nizamabad, Telangana</option><option>Nashik, Maharashtra</option><option>Erode, TN</option><option>Indore, MP</option></select></div>'
  +'<div class="grid g4"><div class="card"><div class="icon">'+w.current.icon+'</div><h3>'+w.current.temp+' C</h3><p class="muted">'+esc(w.current.place)+' &bull; '+esc(w.current.cond)+'</p></div>'
  +'<div class="card"><h3>Humidity</h3><p><b>'+w.current.hum+'%</b></p><p class="muted">Rain: '+w.current.rain+'mm &bull; Soil '+esc(w.current.soil)+'</p></div>'
  +'<div class="card"><h3>Wind</h3><p><b>'+w.current.wind+' km/h</b></p><p class="muted">Spray only if below 15 km/h</p></div>'
  +'<div class="card"><h3>Sun</h3><p>Rise '+w.current.sunrise+'<br>Set '+w.current.sunset+'</p></div></div>'
  +'<div class="section-title"><h2>5-7 day forecast</h2></div><div class="grid g4">'+w.days.map(d=>'<div class="card" style="text-align:center"><b>'+d.d+'</b><div style="font-size:30px">'+d.i+'</div><p>'+d.mx+' / '+d.mn+'<br><small>Rain '+d.r+'%</small></p></div>').join("")+'</div>'
  +'<div class="section-title"><h2>Farming recommendations</h2></div><div class="card"><ul>'+w.adv.map(a=>'<li>'+esc(a)+'</li>').join("")+'</ul><div class="alert blue">Connect live via backend using <code>WEATHER_API_KEY</code> in <code>.env</code> (OpenWeather/IMD). Never expose keys in frontend. Now showing demo.</div></div>';
}

/* ---------- SEEDS ---------- */
function pageSeeds(q){
  q=q||"";
  const list=DB.seeds.filter(s=>!q||(s.name+" "+s.crop+" "+s.variety+" "+s.season).toLowerCase().includes(q.toLowerCase()));
  return '<div class="section-title"><h2>Seeds ('+list.length+')</h2></div>'
  +'<div class="filters"><input id="seedSearch" placeholder="Search seed / crop / season..." value="'+esc(q)+'"><select id="seedSeason"><option value="">All seasons</option><option>Kharif</option><option>Rabi</option><option>Year-round</option><option>Perennial</option><option>Kharif/Rabi</option></select></div>'
  +'<div class="grid g3" id="seedGrid">'+list.map(s=>'<div class="card" data-season="'+esc(s.season)+'"><h3>'+esc(s.name)+'</h3><span class="badge">'+esc(s.crop)+'</span> <span class="badge blue">'+esc(s.season)+'</span><dl class="kv"><dt>Variety</dt><dd>'+esc(s.variety)+'</dd><dt>Type</dt><dd>'+esc(s.type)+'</dd><dt>Duration</dt><dd>'+esc(s.duration)+'</dd><dt>Soil</dt><dd>'+esc(s.soil)+'</dd><dt>Water</dt><dd>'+esc(s.water)+'</dd><dt>Yield</dt><dd><b>'+esc(s.yield)+'</b></dd><dt>Treatment</dt><dd>'+esc(s.treat)+'</dd><dt>Storage</dt><dd>'+esc(s.store)+'</dd></dl></div>').join("")+'</div>';
}

/* ---------- FERTILIZERS (Knowledge Center: list/detail/compare/finder/calendar/soil/performance/4R) ---------- */
function ftList(){
  if(window.FERTILIZERS_REMOTE && window.FERTILIZERS_REMOTE.length) return window.FERTILIZERS_REMOTE;
  if(window.FERTILIZERS && window.FERTILIZERS.length) return window.FERTILIZERS;
  try{
    const L=((window.DB&&DB.fertilizers)||[]);
    const cmap={Chemical:"Chemical",Organic:"Organic",Bio:"Biological"};
    return L.map((f,i)=>({id:"legacy-"+i,name:f.name,category:f.cat==="Bio"?"Biofertilizers":(f.cat||""),type:cmap[f.cat]||f.cat||"",chemicalName:"",nutrientComposition:{},tags:[],purpose:f.purpose||"",benefits:[],suitableCrops:[f.crops||""],suitableSoils:"",applicationMethods:[f.method||""],applicationTiming:[],cropStages:[],frequency:"",compatibility:"",precautions:[f.prec||""],deficiencySymptoms:[],performanceIndicators:[],storage:[],image:"",imageSource:null,representativeImage:true,description:String(f.purpose||"")+" "+String(f.crops||""),limitations:[],uses:[],rate:null,sameAs:null,informationSource:"AgriMitra legacy reference"}));
  }catch(e){ return []; }
}
function ftDataKind(){
  if(window.FERTILIZERS_REMOTE && window.FERTILIZERS_REMOTE.length) return "live";
  if(window.FERTILIZERS && window.FERTILIZERS.length) return "reference";
  if(ftList().length) return "legacy";
  return "none";
}
function ftFind(id){ const L=ftList(); return L.find(f=>f && f.id===id) || null; }
function normalizeFertilizer(raw){
  const r=(raw&&typeof raw==="object")?raw:{};
  const s=v=>(v===undefined||v===null)?"":String(v);
  const a=v=>Array.isArray(v)?v:[];
  return {
    id:s(r.id)||"unknown", name:s(r.name)||"Unnamed fertilizer",
    brand:r.brand||null, manufacturer:r.manufacturer||null,
    productName:s(r.productName||r.name)||"Unnamed fertilizer",
    category:s(r.category)||"", type:s(r.type)||"",
    grade:s(r.grade)||"Information not available",
    formulation:s(r.formulation)||"Information not available",
    nutrients:Array.isArray(r.nutrients)?r.nutrients:[],
    purpose:s(r.purpose)||"Information not available",
    uses:a(r.uses), benefits:a(r.benefits),
    suitableCrops:a(r.suitableCrops), suitableSoils:s(r.suitableSoils),
    cropStage:s(r.cropStage), whenToUse:s(r.whenToUse),
    applicationMethod:a(r.applicationMethod&&r.applicationMethod.length?r.applicationMethod:r.applicationMethods),
    applicationRate:r.applicationRate||null,
    imageUrl:s(r.imageUrl||r.image||""), thumbnailUrl:s(r.thumbnailUrl||""),
    imageType:s(r.imageType)||"unavailable", imageSource:s(r.imageSource||""),
    imageSourceUrl:s(r.imageSourceUrl||""), imageLicense:s(r.imageLicense||""),
    imageAuthor:s(r.imageAuthor||""), imageAttribution:s(r.imageAttribution||""),
    compatibility:s(r.compatibility), precautions:a(r.precautions), storage:a(r.storage),
    deficiencySymptoms:a(r.deficiencySymptoms), performanceIndicators:a(r.performanceIndicators),
    limitations:a(r.limitations), chemicalName:s(r.chemicalName),
    nutrientComposition:(r.nutrientComposition&&typeof r.nutrientComposition==="object")?r.nutrientComposition:{},
    tags:a(r.tags), suitableRegions:s(r.suitableRegions),
    applicationTiming:a(r.applicationTiming), cropStages:a(r.cropStages), frequency:s(r.frequency),
    description:s(r.description), informationSource:s(r.informationSource),
    source:s(r.source), sourceUrl:s(r.sourceUrl), lastUpdated:s(r.lastUpdated),
    _raw:r,
  };
}
function ftState(){ return store.get("ftFilters", {q:"",mode:"name",cat:"All",nut:"All",crop:"All",method:"All",type:"All",brand:"All",form:"All",grade:"All",sort:"az",shown:100}); }
function ftMatchCat(f,c){
  if(!c||c==="All") return true;
  const cat=f.category||"";
  if(c==="Nitrogen") return cat==="Nitrogen Fertilizers";
  if(c==="Phosphatic") return cat==="Phosphatic Fertilizers";
  if(c==="Potassic") return cat==="Potassic Fertilizers";
  if(c==="NPK") return /NPK/i.test(f.name) || /:/.test(f.name) || /Mono Ammonium|Mono Potassium|Potassium Nitrate|Urea Phosphate/i.test(f.name) || cat.indexOf("NPK")>-1;
  if(c==="Secondary Nutrient") return cat==="Secondary Nutrient Fertilizers";
  if(c==="Micronutrient") return cat==="Micronutrient Fertilizers";
  if(c==="Water Soluble") return cat==="Water-Soluble Fertilizers";
  if(c==="Biofertilizer") return cat==="Biofertilizers";
  if(c==="Organic") return cat==="Organic Fertilizers";
  return cat===c;
}
function ftMatchNut(f,n){
  if(!n||n==="All") return true;
  if(n==="Organic matter") return f.type==="Organic";
  if(n==="Biological") return f.type==="Biological";
  return (f.nutrientComposition && f.nutrientComposition[n] && f.nutrientComposition[n]!=="-") ? true : ((f.tags||[]).indexOf(n)>-1);
}
function ftFiltered(s){
  let L = ftList().filter(f=>f && f.id && f.name).filter(f=>{
    const q=(s.q||"").toLowerCase();
    const okQ = !q || ((f.name||"")+" "+(f.chemicalName||"")+" "+(f.category||"")+" "+(f.type||"")+" "+(f.purpose||"")+" "+((f.uses||[]).join(" "))+" "+((f.suitableCrops||[]).join(" "))+" "+ftAliasText(f)).toLowerCase().indexOf(q)>-1;
    const okCrop = !s.crop || s.crop==="All" || (s.crop==="Paddy" ? /(paddy|rice)/i.test((f.suitableCrops||[]).join(" ")) : (f.suitableCrops||[]).join(" ").toLowerCase().indexOf(s.crop.toLowerCase())>-1);
    const okM = !s.method || s.method==="All" || (f.applicationMethods||[]).join(" ").toLowerCase().indexOf(s.method.toLowerCase())>-1;
    const okT = !s.type || s.type==="All" || f.type===s.type;
    const okB = !s.brand || s.brand==="All";
    const okF = !s.form || s.form==="All" || ftFormulation(f)===s.form;
    const okG = !s.grade || s.grade==="All" || ftGrade(f)===s.grade;
    return okQ && ftMatchCat(f,s.cat||"All") && ftMatchNut(f,s.nut||"All") && okCrop && okM && okT && okB && okF && okG;
  });
  if(s.sort==="za") L.sort((a,b)=>String(b.name).localeCompare(String(a.name)));
  else L.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  return L;
}
function ftNutLabel(f){
  const c=f.nutrientComposition||{};
  const parts=["N","P","K"].filter(k=>c[k]&&c[k]!=="-").map(k=>k+" "+c[k]);
  if(parts.length) return parts.join(" • ");
  const t=(f.tags||[]).filter(t=>t!=="Biological"&&t!=="Organic matter");
  return t.length? t.join(", ") : (f.type||"");
}
function ftImgKw(f){
  const stop=["the","a","an","water","soluble","grade","fertilizer","fertilizers"];
  const words=String(f.name||"fertilizer").toLowerCase().replace(/[^a-z0-9 ]/g," ").split(" ").filter(x=>x && isNaN(+x) && stop.indexOf(x)<0);
  return (words[0]||"fertilizer")+",fertilizer";
}
function ftCurated(f){
  try{ if(window.FERT_CURATED){ const c=FERT_CURATED.get(f); if(c&&c.imageUrl) return c; } }catch(e){}
  return null;
}
function ftGrade(f){ const m=/(\d{1,2}:\d{1,2}:\d{1,2})/.exec(f.name||""); return m?m[1]:"Information not available"; }
function ftFormulation(f){
  const c=f.category||"";
  if(c==="Water-Soluble Fertilizers"||c==="Specialty Fertilizers") return "Water-soluble";
  if(c==="Biofertilizers") return "Live culture";
  if(c==="Organic Fertilizers") return "Bulk organic";
  if(c==="Soil Conditioners / Amendments") return "Bulk mineral";
  return "Granular/solid";
}
function ftAliases(f){
  const A=(window.FERT_ALIASES||{})[(f&&f.id)||""]||{nick:[],codes:[]};
  const g=ftGrade(f), gcodes=g!=="Information not available"?[g]:[];
  const seen={}, nick=[], codes=[];
  [f.name].concat(A.nick||[]).forEach(n=>{ n=String(n||""); const k=n.toLowerCase(); if(n&&!seen[k]){ seen[k]=1; nick.push(n); } });
  gcodes.concat(A.codes||[]).forEach(c=>{ c=String(c||""); const k=c.toLowerCase(); if(c&&!seen[k]){ seen[k]=1; codes.push(c); } });
  return {nicknames:nick, codes:codes};
}
function ftAliasText(f){ const a=ftAliases(f); return a.nicknames.concat(a.codes).join(" "); }
function ftAlsoKnownLine(f){
  const a=ftAliases(f), nm=String(f.name||"").toLowerCase();
  const parts=a.nicknames.filter(n=>n.toLowerCase()!==nm).concat(a.codes);
  return parts.length?parts.join(" • "):"—";
}
function ftImageFor(f){
  const cu=ftCurated(f);
  if(cu) return {url:cu.imageUrl, type:cu.type==="exact"?"exact-product":"verified-representative", attribution:cu.attribution||"", source:cu.sourceName||"", page:cu.page||"", license:cu.license||""};
  return {url:null, type:"unavailable", attribution:"", source:"", page:"", license:""};
}
function ftImgTag(f, alt, liveq, thumb){
  const id=String(f.id||"x"); let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))%997;
  const lorem="https://loremflickr.com/"+(thumb?"400/300":"600/400")+"/"+ftImgKw(f)+"?lock="+h;
  const cu=ftCurated(f);
  let primary=cu?cu.imageUrl:lorem;
  if(cu&&thumb) primary=cu.imageUrl.replace("width=640","width=320");
  const fb=cu?(' data-fb1="'+esc(lorem)+'"'):((f.image&&f.image!==lorem)?(' data-fb1="'+esc(f.image)+'"'):"");
  const lq=liveq?(' data-liveq="'+esc(liveq)+'"'):"";
  const iq=' data-imgq="'+esc(f.name)+'" data-fid="'+esc(f.id||"")+'" data-ftype="'+esc(f.type||"")+'" data-fgrade="'+esc(ftGrade(f)==="Information not available"?"":ftGrade(f))+'" data-fcat="'+esc(f.category||"")+'"';
  return '<img src="'+primary+'" alt="'+esc(alt||f.name||"Fertilizer")+'" loading="lazy"'+fb+lq+iq+' onerror="ftImgErr(this)">';
}
function ftImgErr(el){
  try{
    if(!el.dataset.f1 && el.dataset.fb1){ el.dataset.f1="1"; el.src=el.dataset.fb1; return; }
    el.onerror=null; el.src=CROP_IMG_FALLBACK;
    const b=el.closest?el.closest(".crop-img"):null, nb=b?b.querySelector(".var-unavail"):null;
    if(nb) nb.textContent="Image unavailable";
  }catch(e){ try{ el.src=CROP_IMG_FALLBACK; }catch(e2){} }
}
function FertCard(f){
  const img = ftImgTag(f, f.category||"Fertilizer", null, true);
  const cu = ftCurated(f);
  return '<article class="crop-card"><div class="crop-img fbag">'+img+'<span class="crop-cat">'+esc(f.category||"Fertilizer")+'</span><span class="var-unavail">'+(cu&&cu.type==="exact"?"Verified image":"Representative image")+'</span></div>'
  +'<div class="crop-body"><h3>'+esc(f.name)+'</h3><p class="crop-sci">'+esc(f.type||"")+'</p>'
  +'<p class="small muted">Also known as: '+esc(ftAlsoKnownLine(f))+'</p>'
  +'<p class="small muted">Brand: Information not available • Manufacturer: Information not available</p>'
  +'<dl class="kv" style="margin:4px 0"><dt>Nutrient</dt><dd>'+esc(ftNutLabel(f))+'</dd><dt>Grade</dt><dd>'+esc(ftGrade(f))+'</dd><dt>Purpose</dt><dd>'+esc(f.purpose||"")+'</dd><dt>Best suited crops</dt><dd>'+esc((f.suitableCrops||[]).slice(0,4).join(", "))+'</dd><dt>Application</dt><dd>'+esc((f.applicationMethods||[])[0]||"—")+'</dd></dl>'
  +'<p class="crop-desc">Main uses:<br>• '+esc((((f.uses&&f.uses.length)?f.uses:f.benefits)||[]).slice(0,2).join("<br>• ")||"General nutrient supply")+'</p>'
  +'<a class="crop-guide-btn" href="#/fertilizers/'+esc(f.id)+'">View Details →</a></div></article>';
}
function pageFertilizers(){
  const s = ftState();
  const cats = ["Nitrogen","Phosphatic","Potassic","NPK","Secondary Nutrient","Micronutrient","Water Soluble","Biofertilizer","Organic"];
  const nuts = ["N","P","K","S","Ca","Mg","Zn","Fe","B","Mn","Cu","Mo","Organic matter","Biological"];
  const crops = ["Paddy","Rice","Wheat","Maize","Cotton","Chilli","Groundnut","Vegetables","Fruits","Sugarcane","Pulses","Oilseeds"];
  const meths = ["Soil","Foliar","Fertigation","Seed Treatment","Basal","Top Dressing"];
  return '<div class="section-title"><h2>AgriMitra — Smart Fertilizer Guide</h2><span class="badge">'+ftList().length+' Fertilizers</span></div>'
  +'<p class="muted">Understand the right fertilizer, right source, right rate, right time and right place.</p>'
  +'<div class="card" id="ftStatus" style="margin-bottom:12px"><p class="muted">Loading fertilizer data…</p></div>'
  +'<div class="ft-pills" id="ftPills"><button class="btn btn-sm btn-primary" data-tool="list">Fertilizers</button><button class="btn btn-sm" data-tool="finder">Crop Finder</button><button class="btn btn-sm" data-tool="calendar">Calendar</button><button class="btn btn-sm" data-tool="compare">Compare</button><button class="btn btn-sm" data-tool="soil">Soil Test</button><button class="btn btn-sm" data-tool="perf">Performance</button><button class="btn btn-sm" data-tool="acre">1 Acre Calculator</button><button class="btn btn-sm" data-tool="fourr">4R Guide</button></div>'
  +'<div id="ftTool"></div>'
  +'<div class="crop-toolbar"><div class="row" style="margin-bottom:8px"><span class="small muted">Search by:</span><button class="btn btn-sm'+(s.mode!=="code"?" btn-primary":"")+'" id="ftModeName">Fertilizer / Brand</button><button class="btn btn-sm'+(s.mode==="code"?" btn-primary":"")+'" id="ftModeCode">Bag / Product Code</button></div><div class="row"><input id="ftQ" placeholder="'+(s.mode==="code"?"Enter bag / product code…":"Search fertilizers...")+'" value="'+esc(s.q||"")+'">'
  +'<select id="ftCat" aria-label="Category"><option>All</option>'+cats.map(c=>'<option'+(c===s.cat?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select>'
  +'<select id="ftNut" aria-label="Nutrient"><option>All</option>'+nuts.map(n=>'<option'+(n===s.nut?" selected":"")+'>'+esc(n)+'</option>').join("")+'</select>'
  +'<select id="ftCrop" aria-label="Crop"><option>All</option>'+crops.map(c=>'<option'+(c===s.crop?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select>'
  +'<select id="ftMeth" aria-label="Method"><option>All</option>'+meths.map(m=>'<option'+(m===s.method?" selected":"")+'>'+esc(m)+'</option>').join("")+'</select>'
  +'<select id="ftType" aria-label="Type"><option>All</option><option'+(s.type==="Chemical"?" selected":"")+'>Chemical</option><option'+(s.type==="Organic"?" selected":"")+'>Organic</option><option'+(s.type==="Biological"?" selected":"")+'>Biological</option></select>'
  +'<select id="ftBrand" aria-label="Brand"><option>All</option></select>'
  +'<select id="ftForm" aria-label="Formulation"><option>All</option>'+["Granular/solid","Water-soluble","Bulk organic","Live culture","Bulk mineral"].map(o=>'<option'+(o===s.form?" selected":"")+'>'+esc(o)+'</option>').join("")+'</select>'
  +'<select id="ftGrade" aria-label="NPK Grade"><option>All</option>'+[...new Set(ftList().map(ftGrade).filter(g=>g!=="Information not available"))].sort().map(g=>'<option'+(g===s.grade?" selected":"")+'>'+esc(g)+'</option>').join("")+'</select>'
  +'<select id="ftSort" aria-label="Sort"><option value="az"'+(s.sort==="az"?" selected":"")+'>A-Z</option><option value="za"'+(s.sort==="za"?" selected":"")+'>Z-A</option></select></div>'
  +'<div class="row" style="margin-top:10px"><button class="btn btn-sm" id="ftClear">Clear Filters</button><span class="crop-count" id="ftCount"></span></div></div>'
  +'<div class="crop-grid" id="ftGrid"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div><div style="text-align:center"><button class="btn btn-primary loadmore" id="ftMore">Load More</button></div>'
  +'<div class="section-title"><h2>Warnings</h2></div><ul class="warn-list"><li>Do not apply fertilizer only because the crop looks weak.</li><li>Confirm nutrient deficiency where possible — visual symptoms alone are not sufficient.</li><li>Follow soil-test-based recommendations.</li><li>Do not exceed recommended rates.</li><li>Check the product label before application.</li><li>Do not mix fertilizers unless compatibility is confirmed.</li></ul>';
}
function ftRenderGrid(){
  const grid=document.getElementById("ftGrid"); if(!grid) return;
  if(!ftList().length){
    grid.innerHTML='<div class="empty" style="grid-column:1/-1"><h3>Fertilizer information is temporarily unavailable.</h3><p class="muted">No verified records could be loaded. Check that <code>src/data/fertilizers.js</code> is present.</p><button class="btn btn-sm" onclick="location.reload()">Try Again</button></div>';
    const cc=document.getElementById("ftCount"); if(cc) cc.textContent="";
    const mm=document.getElementById("ftMore"); if(mm) mm.style.display="none";
    paintFtStatus(); return;
  }
  const s=ftState(); const L=ftFiltered(s); const vis=L.slice(0,s.shown||100);
  grid.innerHTML = vis.length? vis.map(FertCard).join("") : '<div class="empty" style="grid-column:1/-1"><h3>No fertilizers match these filters.</h3><button class="btn btn-sm" id="ftClear2">Clear Filters</button></div>';
  const upto=Math.min(s.shown||100,L.length);
  document.getElementById("ftCount").textContent = L.length? ("Showing 1–"+upto+" of "+L.length+" fertilizers") : "No fertilizers found";
  const more=document.getElementById("ftMore"); if(more) more.style.display=(upto<L.length)?"":"none";
  const c2=document.getElementById("ftClear2"); if(c2) c2.onclick=ftReset;
  paintFtStatus();
  hydrateFertImages(grid);
}
function ftCodeSearch(){
  const inp=document.getElementById("ftQ"), grid=document.getElementById("ftGrid"), cnt=document.getElementById("ftCount");
  const code=((inp||{}).value||"").trim();
  const empty=msg=>{ if(grid) grid.innerHTML='<div class="empty" style="grid-column:1/-1"><h3>'+msg+'</h3></div>'; const mo=document.getElementById("ftMore"); if(mo) mo.style.display="none"; };
  if(!code){ empty("Enter a bag / product code above."); if(cnt) cnt.textContent=""; return; }
  if(grid) grid.innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  if(cnt) cnt.textContent="Searching verified catalog…";
  const done=item=>{
    if(!grid) return;
    if(item){ grid.innerHTML=FertCard(item); if(cnt) cnt.textContent="1 exact match"; paintFtStatus(); hydrateFertImages(grid); }
    else { grid.innerHTML='<div class="empty" style="grid-column:1/-1"><h3>Product code not found in the verified catalog.</h3><p class="muted">No verified product carries this code. Codes are never invented.</p></div>'; if(cnt) cnt.textContent=""; }
    const mo=document.getElementById("ftMore"); if(mo) mo.style.display="none";
  };
  if(window.Api){ Api.fertByCode(code).then(r=>{ const it=r.ok&&r.data&&(r.data.item||r.data); done(it||null); }, ()=>done(null)); }
  else done(null);
}
function ftReset(){ store.set("ftFilters",{q:"",mode:"name",cat:"All",nut:"All",crop:"All",method:"All",type:"All",brand:"All",form:"All",grade:"All",sort:"az",shown:100}); render(); }
function ftBind(){
  const upd=(k,v)=>{ const n=ftState(); n[k]=v; if(k!=="shown") n.shown=100; store.set("ftFilters",n); ftRenderGrid(); };
  const q=document.getElementById("ftQ"); if(q) q.oninput=()=>upd("q",q.value);
  const m={ftCat:"cat",ftNut:"nut",ftCrop:"crop",ftMeth:"method",ftType:"type",ftBrand:"brand",ftForm:"form",ftGrade:"grade",ftSort:"sort"};
  Object.keys(m).forEach(id=>{ const e=document.getElementById(id); if(e) e.onchange=()=>upd(m[id],e.value); });
  const cl=document.getElementById("ftClear"); if(cl) cl.onclick=ftReset;
  const mo=document.getElementById("ftMore"); if(mo) mo.onclick=()=>{ const n=ftState(); n.shown=(n.shown||24)+24; store.set("ftFilters",n); ftRenderGrid(); };
  document.querySelectorAll("#ftPills button").forEach(b=>b.onclick=()=>{
    document.querySelectorAll("#ftPills button").forEach(x=>x.classList.remove("btn-primary")); b.classList.add("btn-primary");
    ftShowTool(b.dataset.tool);
  });
  ftRenderGrid();
  ftUpgradeRemote();
}
function paintFtStatus(){
  const el=document.getElementById("ftStatus"); if(!el) return;
  const k=ftDataKind(), n=ftList().length;
  if(k==="live") el.innerHTML='<p><b>🟢 Live API Data</b></p><p class="small">Last Updated: <b>'+esc((window._ftLive&&window._ftLive.at)||"")+'</b> • Source: AgriMitra backend catalog ('+n+' records)</p>';
  else if(k==="reference") el.innerHTML='<p><b>🔵 Verified Reference Data</b></p><p class="muted small">Showing verified local fertilizer data ('+n+' records). Backend live catalog not connected.</p>';
  else if(k==="legacy") el.innerHTML='<p><b>🔵 Verified Reference Data</b></p><p class="muted small">Showing built-in legacy reference data. Check that <code>src/data/fertilizers.js</code> loads for the full database.</p>';
  else el.innerHTML='<p><b>🔴 Data Unavailable</b></p><p>Fertilizer information is temporarily unavailable.</p><button class="btn btn-sm" onclick="location.reload()">Try Again</button>';
}
function ftUpgradeRemote(){
  paintFtStatus();
  if(!window.Api) return;
  Api.fertilizers({limit:500}).then(r=>{
    if(r.ok && r.data && Array.isArray(r.data.items) && r.data.items.length){
      try{ window.FERTILIZERS_REMOTE=r.data.items; window._ftLive={at:r.data.fetchedAt||new Date().toISOString()}; }catch(e){}
      paintFtStatus(); ftRenderGrid();
    } else paintFtStatus();
  }, ()=>paintFtStatus());
}
function hydrateFertImages(root){
  try{
    const imgs=(root||document).querySelectorAll("img[data-imgq]:not([data-hydrated])");
    if(!imgs.length || !window.Api) return;
    const seen={};
    const fetchOne=img=>{
      img.dataset.hydrated="1";
      const q=img.getAttribute("data-imgq"), fid=img.getAttribute("data-fid");
      const key=(fid||"")+"|"+(q||"");
      if(!q || seen[key]) return; seen[key]=1;
      const apply=(u,cached)=>{
        if(!(u&&u.imageUrl)) return;
        img.src=u.imageUrl;
        const card=img.closest(".crop-card"), b=card?card.querySelector(".var-unavail"):null;
        const t=u.imageType;
        if(b) b.textContent=(t==="exact-product"||t==="verified")?"Verified image":(cached?"Cached Verified Image":"Live Image Result");
        img.dataset.attr=u.attribution||u.sourceName||"";
      };
      const byId=(fid&&Api.fertilizerImageById)?Api.fertilizerImageById(fid):Promise.resolve({ok:false});
      byId.then(r=>{
        if(r.ok&&r.data&&(r.data.result||r.data.imageUrl)){ const u=r.data.result||r.data; apply(u,r.data.cached); }
        else return Api.fertilizerImage(q,{type:img.getAttribute("data-ftype")||"",grade:img.getAttribute("data-fgrade")||"",category:img.getAttribute("data-fcat")||""}).then(r2=>{
          const u2=r2.ok&&r2.data&&r2.data.result;
          apply(u2,r2.data&&r2.data.cached);
        });
      });
    };
    if("IntersectionObserver" in window){
      const io=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ io.unobserve(e.target); fetchOne(e.target); } });},{rootMargin:"200px"});
      imgs.forEach(im=>io.observe(im));
    } else imgs.forEach(fetchOne);
  }catch(e){}
}
function ftCompRows(f){
  const c=f.nutrientComposition||{};
  return ["N","P","K","S","Ca","Mg","Zn","Fe","B","Mn","Cu"].filter(k=>c[k]&&c[k]!=="-").map(k=>k+": "+c[k]).join(" • ") || "See label";
}
function ftRole(k){ return {N:"Vegetative growth",P:"Root development",K:"Crop quality and stress support",S:"Protein and oil formation",Ca:"Cell walls and firmness",Mg:"Chlorophyll core",Zn:"Enzymes and tillering",Fe:"Chlorophyll synthesis",B:"Flowering and fruit set",Mn:"Photosynthesis",Cu:"Enzyme activation",Mo:"Nitrogen metabolism"}[k]||"—"; }
function ftMethodHow(m){
  m=String(m||"").toLowerCase();
  if(m.indexOf("basal")>-1) return "Spread evenly before sowing and mix into the root zone with harrowing.";
  if(m.indexOf("top dress")>-1) return "Broadcast beside crop rows into moist soil, then irrigate lightly.";
  if(m.indexOf("foliar")>-1) return "Dissolve exactly per label and spray foliage in cool morning or evening hours.";
  if(m.indexOf("fertigation")>-1) return "Inject the dissolved fertilizer through drip as per a measured schedule with EC checks.";
  if(m.indexOf("seed treatment")>-1) return "Coat seed uniformly just before sowing; sow the same day.";
  if(m.indexOf("soil application")>-1) return "Place in the root zone and cover with soil; irrigate after application.";
  if(m.indexOf("nursery")>-1) return "Mix into nursery media or beds before sowing or transplanting.";
  if(m.indexOf("drip-line")>-1) return "Deliver with irrigation water through a clean drip system.";
  if(m.indexOf("seedling dip")>-1) return "Dip seedling roots in the suspension just before transplanting.";
  if(m.indexOf("broadcast")>-1) return "Spread uniformly and incorporate into soil.";
  return "Follow the product label for this method.";
}
/* Verified seed data (general crop guidance from AgriMitra crop database; confirm variety/season/method locally). Per-acre derived from stated per-hectare rates. */
var SEED_RATES = {
"Rice":{methods:[{m:"Transplanting",a:10,b:12,u:"kg"},{m:"Direct seeding",a:24,b:30,u:"kg"}],spacing:"20×15 cm, 2–3 seedlings per hill",treat:"Fungicide plus Trichoderma seed treatment as per label"},
"Paddy":{methods:[{m:"Transplanting",a:10,b:12,u:"kg"},{m:"Direct seeding",a:24,b:30,u:"kg"}],spacing:"20×15 cm, 2–3 seedlings per hill",treat:"Fungicide plus Trichoderma seed treatment as per label"},
"Wheat":{methods:[{m:"Line sowing",a:40,b:40,u:"kg"}],spacing:"20–22 cm rows",treat:"Fungicide seed treatment as per label"},
"Maize":{methods:[{m:"Ridge sowing",a:8,b:8,u:"kg"}],spacing:"60×20 cm",treat:"Fungicide plus insecticide seed treatment as per label"},
"Cotton":{methods:[{m:"Bt dibbling",a:0.4,b:0.6,u:"kg"}],spacing:"90×60 cm",treat:"Use acid-delinted coated seed; no extra treatment needed"},
"Sugarcane":{methods:[{m:"Sett planting",a:30000,b:30000,u:"setts"}],spacing:"90 cm rows",treat:"Sett dip (fungicide plus Trichoderma) as per label"},
"Groundnut":{methods:[{m:"Line sowing",a:40,b:48,u:"kg"}],spacing:"30×10 cm",treat:"Fungicide plus Rhizobium treatment as per label"},
"Chilli":{methods:[{m:"Nursery + transplant",a:0.4,b:0.5,u:"kg"}],spacing:"60×45 cm",treat:"Trichoderma plus Azospirillum as per label"},
"Tomato":{methods:[{m:"Nursery + transplant",a:40,b:60,u:"g"}],spacing:"60×45 cm with staking",treat:"Seedling tray plus Pseudomonas as per label"},
"Potato":{methods:[{m:"Ridge planting",a:1000,b:1000,u:"kg"}],spacing:"60×20 cm",treat:"Fungicide dip; cut-and-cure as per label"},
"Onion":{methods:[{m:"Transplanting",a:3.2,b:4,u:"kg"}],spacing:"15×10 cm",treat:"Fungicide treatment as per label"},
"Turmeric":{methods:[{m:"Ridge planting",a:800,b:1000,u:"kg"}],spacing:"30×15 cm",treat:"Fungicide plus Trichoderma dip as per label"},
"Banana":{methods:[{m:"Pit planting",a:600,b:1000,u:"suckers"}],spacing:"1.8×1.8 m",treat:"Treated tissue-culture plants"},
"Mango":{methods:[{m:"Pit planting",a:40,b:40,u:"grafts"}],spacing:"10×10 m",treat:"Information not available"},
"Coconut":{methods:[{m:"Pit planting",a:70,b:70,u:"palms"}],spacing:"7.5×7.5 m",treat:"Information not available"},
"Pulses":{methods:[{m:"Tur line sowing",a:5,b:6,u:"kg"},{m:"Gram line sowing",a:24,b:30,u:"kg"}],spacing:"90×20 cm (tur) / 30×10 cm (gram)",treat:"Rhizobium plus PSB as per label"},
"Millets":{methods:[{m:"Line sowing",a:3.2,b:4.8,u:"kg"}],spacing:"30×10 cm",treat:"Fungicide seed treatment as per label"},
"Oilseeds":{methods:[{m:"Mustard line sowing",a:1.6,b:2,u:"kg"},{m:"Soybean sowing",a:30,b:30,u:"kg"}],spacing:"45×10 cm",treat:"Rhizobium plus PSB as applicable"}};
function seedVarietyOptions(crop){
  try{
    if(/paddy|rice/i.test(crop) && window.PADDY_VARIETIES) return PADDY_VARIETIES.map(v=>v.name);
    if(window.SEED_VARIETIES){ const m={Cotton:"Cotton",Chilli:"Chilli",Maize:"Maize",Wheat:"Wheat",Groundnut:"Groundnut"}; const k=Object.keys(m).find(k=>crop.toLowerCase().indexOf(k.toLowerCase())>-1); if(k) return SEED_VARIETIES.filter(s=>s.crop===m[k]).map(s=>s.name); }
  }catch(e){}
  return ["General"];
}
function seedWidgetHTML(pfx,cropDef){
  const crops=Object.keys(SEED_RATES);
  return '<div class="grid g3"><label>Crop <select id="'+pfx+'Crop">'+crops.map(c=>'<option'+(c===cropDef?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select></label>'
  +'<label>Variety <input id="'+pfx+'Var" list="'+pfx+'VarList" placeholder="Select or type variety"><datalist id="'+pfx+'VarList"></datalist></label>'
  +'<label>Sowing method <select id="'+pfx+'Meth"></select></label>'
  +'<label>Area <input id="'+pfx+'Area" type="number" value="1" min="0.1" step="0.1"></label>'
  +'<label>Area unit <select id="'+pfx+'Unit"><option value="acre">Acre</option><option value="hectare">Hectare</option></select></label></div>'
  +'<button class="btn btn-primary btn-sm" id="'+pfx+'Go" style="margin-top:10px">Calculate Seed Requirement</button><div id="'+pfx+'Out" style="margin-top:10px"></div>';
}
function seedWidgetBind(pfx,cropDef){
  const fill=()=>{
    const crop=(document.getElementById(pfx+"Crop")||{}).value||cropDef||"Rice";
    const R=SEED_RATES[crop];
    const ms=document.getElementById(pfx+"Meth");
    if(ms) ms.innerHTML=R?R.methods.map(m=>'<option>'+esc(m.m)+'</option>').join(""):'<option>Information not available</option>';
    const dl=document.getElementById(pfx+"VarList");
    if(dl) dl.innerHTML=seedVarietyOptions(crop).map(v=>'<option value="'+esc(v)+'">').join("");
  };
  const cc=document.getElementById(pfx+"Crop"); if(cc) cc.onchange=fill;
  fill();
  const go=document.getElementById(pfx+"Go");
  if(go) go.onclick=()=>{
    const crop=(document.getElementById(pfx+"Crop")||{}).value||"Rice";
    const R=SEED_RATES[crop], out=document.getElementById(pfx+"Out");
    if(!R){ out.innerHTML='<div class="empty">Seed rate: Information not available for this crop. Confirm with the local advisory.</div>'; return; }
    const m=(document.getElementById(pfx+"Meth")||{}).value||R.methods[0].m;
    const mo=R.methods.find(x=>x.m===m)||R.methods[0];
    let area=+((document.getElementById(pfx+"Area")||{}).value||1);
    const unit=(document.getElementById(pfx+"Unit")||{}).value||"acre";
    const acres = unit==="hectare"? area*2.471 : area;
    const lo=(mo.a*acres), hi=(mo.b*acres);
    const fmt=v=> (Math.round(v*10)/10).toLocaleString("en-IN");
    out.innerHTML='<div class="table-wrap"><table style="min-width:0"><tbody>'
    +'<tr><td><b>Crop</b></td><td>'+esc(crop)+'</td></tr>'
    +'<tr><td><b>Variety</b></td><td>'+esc((document.getElementById(pfx+"Var")||{}).value||"General")+' (rate is crop-and-method level; confirm variety-specific rate locally)</td></tr>'
    +'<tr><td><b>Area</b></td><td>'+esc(String(area))+' '+esc(unit)+'</td></tr>'
    +'<tr><td><b>Seed rate</b></td><td>'+esc(mo.m)+': '+fmt(mo.a)+'–'+fmt(mo.b)+' '+esc(mo.u)+' per acre</td></tr>'
    +'<tr><td><b>Total seed required</b></td><td><b>'+fmt(lo)+'–'+fmt(hi)+' '+esc(mo.u)+'</b></td></tr>'
    +'<tr><td><b>Sowing method</b></td><td>'+esc(mo.m)+'</td></tr>'
    +'<tr><td><b>Spacing</b></td><td>'+esc(R.spacing)+'</td></tr>'
    +'<tr><td><b>Seed treatment</b></td><td>'+esc(R.treat)+'</td></tr>'
    +'</tbody></table></div><p class="muted small">General rates from the AgriMitra crop database; rates differ by variety, season and method — confirm locally. Source: AgriMitra crop guides; verify with KVK.</p>';
  };
}
function ftCropCards(crops){
  let L=[]; try{ L=nxCrops(); }catch(e){ L=[]; }
  if(!L.length) return '<p class="muted">Crop guides are unavailable in this view.</p>';
  const hits=[];
  (crops||[]).forEach(cn=>{
    const h=L.find(x=>x&&(x.name===cn||x.name.toLowerCase().indexOf(String(cn).toLowerCase())>-1||String(cn).toLowerCase().indexOf(x.name.toLowerCase())>-1));
    if(h && hits.indexOf(h)<0) hits.push(h);
  });
  if(!hits.length) return '<p class="muted">Crop-specific guides for these crops are not in the crop database yet.</p>';
  return '<div class="crop-grid">'+hits.slice(0,8).map(CropCard).join("")+'</div>';
}
function ftAttrText(f, live){
  const cu=ftCurated(f);
  if(live) return "Image: "+live;
  if(cu&&cu.type==="exact") return "Verified image: "+cu.attribution+" — photo shows this product.";
  if(cu) return "Representative image ("+cu.attribution+"): relevant "+(f.category||"fertilizer")+" photo — not this exact product pack.";
  return "Representative image — not the exact product pack.";
}
function FertDetailPage(id){
  try{
    const f0 = ftFind(id);
    if(!f0){ app.innerHTML='<div class="empty"><h3>Fertilizer not found</h3><p class="muted">No fertilizer exists for "'+esc(id||"")+'".</p><a class="btn btn-primary btn-sm" href="#/fertilizers">Back to Fertilizers</a></div>'; window.scrollTo(0,0); return; }
    const f = normalizeFertilizer(f0);
    const img = ftImgTag(f, f.category||"Fertilizer", f.name+" fertilizer");
    const rel0=ftList().filter(x=>x&&x.id!==f.id), same=rel0.filter(x=>x.category===f.category).slice(0,3);
    const rel=(same.length>=2?same:same.concat(rel0.filter(x=>x.category!==f.category)).slice(0,3));
    app.innerHTML = '<div class="crumb"><a href="#/home">Home</a> → <a href="#/fertilizers">Fertilizers</a> → <b>'+esc(f.name)+'</b></div>'
    +'<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-sm" href="#/fertilizers">← Back to Fertilizers</a><button class="btn btn-sm" onclick="window.print()">Print Guide</button></div>'
    +'<section class="guide-hero">'+img+'<div class="inner"><span class="badge">'+esc(f.category||"")+'</span> <span class="badge">'+esc(f.type||"")+'</span>'
    +'<h1>'+esc(f.name)+'</h1><p>'+esc(ftCompRows(f))+'</p><p>'+esc(f.description||"")+'</p><dl class="kv" style="margin:6px 0"><dt>Brand</dt><dd>'+esc(f.brand||"Information not available")+'</dd><dt>Manufacturer</dt><dd>'+esc(f.manufacturer||"Information not available")+'</dd><dt>Grade</dt><dd>'+esc(ftGrade(f))+'</dd><dt>Formulation</dt><dd>'+esc(ftFormulation(f))+' (typical form; confirm on label)</dd><dt>Also known as</dt><dd>'+esc(ftAlsoKnownLine(f))+'</dd><dt>Product Code / SKU / GTIN</dt><dd>'+esc(f.productCode||f.sku||f.gtin||f.barcode||"Information not available")+'</dd></dl><p class="small" id="fertAttr">'+esc(ftAttrText(f))+'</p></div></section>'
    +'<div class="guide-sec"><h3>A. What Is This Fertilizer?</h3><p>'+esc(f.description||"")+' It belongs to <b>'+esc(f.category||"")+'</b> ('+esc(f.type||"")+'). Chemical name: '+esc(f.chemicalName||"Information not available.")+'</p></div>'
    +'<div class="guide-sec"><h3>B. Nutrient Composition</h3><div class="table-wrap"><table style="min-width:0"><thead><tr><th>Nutrient</th><th>Available information</th><th>Role</th></tr></thead><tbody>'+["N","P","K","S","Ca","Mg","Zn","Fe","B","Mn","Cu","Mo"].filter(k=>{const v=(f.nutrientComposition||{})[k];return v&&v!=="-";}).map(k=>'<tr><td>'+k+'</td><td>'+esc((f.nutrientComposition||{})[k])+'</td><td>'+esc(ftRole(k))+'</td></tr>').join("")+'</tbody></table></div><p class="muted small">Only nutrients actually present are shown with verified values. Never invented.</p></div>'
    +'<div class="guide-sec"><h3>C. Main Purpose</h3><p>'+esc(f.purpose||"")+'</p></div>'
    +'<div class="guide-sec"><h3>D. Benefits</h3><ul>'+((f.benefits||[]).map(b=>'<li>'+esc(b)+'</li>').join("")||'<li>Information not available.</li>')+'</ul><p class="muted small">Supports nutrition; no guaranteed yield increase is claimed.</p></div>'
    +'<div class="guide-sec"><h3>E. Suitable Crops</h3><p>'+esc((f.suitableCrops||[]).join(", ")||"Information not available.")+'</p><div style="margin-top:10px">'+ftCropCards(f.suitableCrops)+'</div></div>'
    +'<div class="guide-sec"><h3>Uses</h3><ul>'+((f.uses||[]).map(u=>'<li>'+esc(u)+'</li>').join("")||'<li>General nutrient supply per the purpose above.</li>')+'</ul></div>'
    +'<div class="guide-sec"><h3>Suitable Soil</h3><dl class="kv"><dt>Soil type</dt><dd>'+esc(f.suitableSoils||"Information not available.")+'</dd><dt>pH considerations</dt><dd>Match fertilizer choice to soil pH per soil test; amend only on lab prescription.</dd><dt>Nutrient condition</dt><dd>Apply where soil tests show the need; do not claim suitability for every soil.</dd></dl></div>'
    +'<div class="guide-sec"><h3>F. When Should I Use It?</h3><div class="table-wrap"><table style="min-width:0"><thead><tr><th>Crop</th><th>Growth Stage</th><th>Recommended Timing</th><th>Application Method</th><th>Frequency</th></tr></thead><tbody>'+((f.cropStages||[]).length?(f.cropStages||[]).map(st=>'<tr><td>'+esc((f.suitableCrops||[])[0]||"Crop")+'</td><td>'+esc(st)+'</td><td>'+esc((f.applicationTiming||[])[0]||"—")+'</td><td>'+esc((f.applicationMethods||[])[0]||"—")+'</td><td>'+esc(f.frequency||"—")+'</td></tr>').join(""):'<tr><td colspan="5">Timing varies — see note below.</td></tr>')+'</tbody></table></div><p><b>Timing depends on crop and soil-test-based recommendation.</b> Only crop-specific verified timings are shown; otherwise follow the local advisory.</p></div>'
    +'<div class="guide-sec"><h3>G. How To Apply</h3><ul>'+((f.applicationMethods||[]).map(m=>'<li><b>'+esc(m)+'</b> — '+esc(ftMethodHow(m))+'</li>').join(""))+'</ul><p class="muted small">Only methods appropriate to this fertilizer are listed. Do not use unsafe chemical mixing.</p></div>'
    +'<div class="guide-sec"><h3>H. Application Rate</h3>'+(f.rate&&f.rate.note?'<p>'+esc(f.rate.note)+'</p>':'')+'<p><b>Recommended rate depends on crop, variety where relevant, crop stage, soil test, nutrient deficiency, application method, fertilizer grade and official/local recommendation.</b></p><p>Application rate: Information not available. Follow the product label and local agriculture department / KVK recommendation.</p><p class="muted small">No universal dose is prescribed here, and a recommendation for one crop is never generalized to others.</p></div>'
    +'<div class="guide-sec"><h3>Seed Requirement (per-area seed need)</h3><p class="muted">Answers “how much seed for my area” from verified crop seed rates. Rates differ by crop, variety, method and season — confirm locally.</p>'+seedWidgetHTML("dtSd"+String(f.id).replace(/[^a-z0-9]/gi,""),"Rice")+'</div>'
    +'<div class="guide-sec"><h3>I. Fertilizer Performance</h3><ul>'+((f.performanceIndicators||[]).map(p=>'<li>'+esc(p)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>J. Deficiency Symptoms</h3><ul>'+((f.deficiencySymptoms||[]).map(d=>'<li>'+esc(d)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>K. Compatibility</h3><p>'+esc(f.compatibility||"Compatibility information not available — check the product label or local agricultural recommendation.")+'</p></div>'
    +'<div class="guide-sec"><h3>L. Precautions</h3><ul>'+((f.precautions||[]).map(p=>'<li>'+esc(p)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>M. Storage</h3><ul>'+((f.storage||[]).map(s=>'<li>'+esc(s)+'</li>').join(""))+'</ul></div>'
    +'<div class="guide-sec"><h3>N. Cost / Market</h3><p>Price information currently unavailable. No live fertilizer price source is connected, and no price is estimated here.</p></div>'
    +'<div class="guide-sec"><h3>O. Source</h3><div class="src-note"><b>Information source:</b> '+esc(f.informationSource||"AgriMitra compilation; verify label locally.")+'<br><b>References:</b> ICAR nutrient-management guidance (4R framework), Soil Health Card recommendations, KVK / state agriculture department advisories, official fertilizer product label.<br><b>Application source:</b> same as above.<br><b>Image source:</b> generic '+esc(f.category||"fertilizer")+' image (representative; not the exact product).</div></div>'
    +'<div class="section-title"><h2>Related Fertilizers</h2><a href="#/fertilizers">All fertilizers →</a></div><div class="crop-grid">'+rel.map(FertCard).join("")+'</div>';
    try{ seedWidgetBind("dtSd"+String(f.id).replace(/[^a-z0-9]/gi,""),"Rice"); }catch(e2){}
    try{
      const him=document.querySelector(".guide-hero img[data-imgq]");
      if(him && window.Api){
        const showLive=u=>{
          if(!(u&&u.imageUrl)) return;
          him.src=u.imageUrl; const an=document.getElementById("fertAttr");
          if(an) an.innerHTML=esc("Image: "+(u.attribution||u.sourceName||"Verified image")+(u.license?" • License: "+u.license:""))+(u.sourceUrl?' (<a href="'+esc(u.sourceUrl)+'" target="_blank" rel="noopener">source</a>)':"");
        };
        const byId=Api.fertilizerImageById?Api.fertilizerImageById(f.id):Promise.resolve({ok:false});
        byId.then(r=>{
          const u=r.ok&&r.data&&(r.data.result||r.data);
          if(u&&u.imageUrl){ showLive(u); const bb=document.querySelector(".guide-hero .badge"); if(bb) bb.textContent=(u.imageType==="exact-product")?"Verified image":((r.data&&r.data.cached)?"Cached Verified Image":"Live Image Result"); }
          else return Api.fertilizerImage(f.name,{type:f.type||"",grade:ftGrade(f)==="Information not available"?"":ftGrade(f),category:f.category||""}).then(r2=>{
            const u2=r2.ok&&r2.data&&r2.data.result;
            if(u2) showLive(u2);
          });
        });
      }
    }catch(e3){}
  }catch(e){
    console.error(e);
    app.innerHTML='<div class="empty"><h3>Unable to load this fertilizer guide.</h3><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><a class="btn btn-sm" href="#/fertilizers">Back to Fertilizers</a><button class="btn btn-primary btn-sm" onclick="render()">Try Again</button></div></div>';
  }
  window.scrollTo(0,0);
}
function ftCompareOptions(sel){
  return ftList().map(f=>'<option value="'+esc(f.id)+'"'+(f.id===sel?" selected":"")+'>'+esc(f.name)+'</option>').join("");
}
function ComparePage(){
  return '<div class="crumb"><a href="#/home">Home</a> → <a href="#/fertilizers">Fertilizers</a> → <b>Compare</b></div>'
  +'<div class="section-title"><h2>Compare Fertilizers (up to 3)</h2><a class="btn btn-sm" href="#/fertilizers">← Back to Fertilizers</a></div>'
  +'<p class="muted">Differences are explained — there is no “best fertilizer” ranking; suitability depends on crop, soil test and stage.</p>'
  +'<div class="crop-toolbar"><div class="row"><select id="cp1" aria-label="First fertilizer">'+ftCompareOptions("urea")+'</select><select id="cp2" aria-label="Second fertilizer">'+ftCompareOptions("dap")+'</select><select id="cp3" aria-label="Third fertilizer"><option value="">— none —</option>'+ftCompareOptions("npk-19-19-19")+'</select><button class="btn btn-primary btn-sm" id="cpGo">Compare</button></div></div>'
  +'<div id="cpOut"></div>';
}
function cpRender(){
  const ids=["cp1","cp2","cp3"].map(i=>((document.getElementById(i)||{}).value||"")).filter(Boolean).slice(0,3);
  const rows=ids.map(ftFind).filter(Boolean);
  const box=document.getElementById("cpOut"); if(!box) return;
  if(!rows.length){ box.innerHTML='<div class="empty">Select at least one fertilizer.</div>'; return; }
  const R=(label,fn)=>'<tr><td><b>'+label+'</b></td>'+rows.map(f=>'<td>'+fn(f)+'</td>').join("")+'</tr>';
  box.innerHTML='<div class="table-wrap"><table><thead><tr><th>Feature</th>'+rows.map(f=>'<th>'+esc(f.name)+'</th>').join("")+'</tr></thead><tbody>'
  +R("Category",f=>esc(f.category||"—"))+R("Nutrient composition",f=>esc(ftCompRows(f)))+R("Primary purpose",f=>esc(f.purpose||"—"))
  +R("Application method",f=>esc((f.applicationMethods||[]).join("; ")||"—"))+R("Suitable crops",f=>esc((f.suitableCrops||[]).slice(0,5).join(", ")||"—"))
  +R("Timing",f=>esc((f.applicationTiming||[]).join("; ")||"—"))+R("Advantages",f=>esc((f.benefits||[]).slice(0,3).join("; ")||"—"))
  +R("Limitations",f=>esc((f.limitations||[]).join("; ")||"—"))+R("Source",f=>esc("FCO grades; verify label"))
  +'</tbody></table></div>';
}
function ftSoilGet(){ return store.get("fertSoilTest", null); }
function SoilTestPage(){
  const v = ftSoilGet() || {};
  const F=(k,label)=>'<label>'+label+' <input id="st_'+k+'" value="'+esc(v[k]||"")+'" placeholder="Not available"></label>';
  return '<div class="section-title"><h2>My Soil Test</h2></div>'
  +'<p class="muted">Enter values from your Soil Health Card. Stored only in this browser. Never guessed — blank means “Not available”.</p>'
  +'<div class="card form"><div class="grid g3">'+F("ph","Soil pH")+F("ec","EC")+F("oc","Organic Carbon")+F("n","Nitrogen")+F("p","Phosphorus")+F("k","Potassium")+F("s","Sulphur")+F("zn","Zinc")+F("fe","Iron")+F("b","Boron")+'</div>'
  +'<div style="margin-top:10px;display:flex;gap:8px"><button class="btn btn-primary btn-sm" id="stSave">Save Soil Test</button><button class="btn btn-sm" id="stClear">Clear</button></div></div>'
  +'<div class="card" style="margin-top:12px"><h3>Saved values</h3><div id="stOut"><p class="muted">No soil test saved yet.</p></div></div>';
}
function stRenderOut(){
  const v=ftSoilGet(), el=document.getElementById("stOut"); if(!el) return;
  if(!v){ el.innerHTML='<p class="muted">No soil test saved yet.</p>'; return; }
  const rows=[["pH","ph"],["EC","ec"],["Organic Carbon","oc"],["Nitrogen","n"],["Phosphorus","p"],["Potassium","k"],["Sulphur","s"],["Zinc","zn"],["Iron","fe"],["Boron","b"]];
  el.innerHTML='<dl class="kv">'+rows.map(r=>'<dt>'+r[0]+'</dt><dd>'+esc(v[r[1]]||"Not available")+'</dd>').join("")+'</dl><p class="muted small">Saved '+esc(v._on||"")+'</p>';
}
function FinderPage(){
  const crops=["Rice","Wheat","Maize","Cotton","Chilli","Groundnut","Vegetables","Fruits","Sugarcane","Pulses","Oilseeds"];
  const nuts=["N","P","K","S","Zn","Fe","B"];
  return '<div class="section-title"><h2>Find Fertilizer for My Crop</h2></div>'
  +'<p class="muted">Relevant fertilizer <b>information</b> — never a prescription from the crop name alone.</p>'
  +'<div class="card form"><label>Step 1 — Select Crop <select id="fdCrop">'+crops.map(c=>'<option>'+c+'</option>').join("")+'</select></label>'
  +'<label>Crop variety (optional) <input id="fdVar" list="fdVarList" placeholder="e.g. BPT 5204, HD 2967"><datalist id="fdVarList"></datalist></label>'
  +'<label>Step 2 — Growth Stage <select id="fdStage"><option>Before planting</option><option>Seedling</option><option>Vegetative</option><option>Flowering</option><option>Fruiting</option><option>Grain filling</option><option>Other</option></select></label>'
  +'<div class="grid g2"><label>Soil type <select id="fdSoilT"><option>Not sure</option><option>Sandy</option><option>Loam</option><option>Clay</option><option>Acidic</option><option>Alkaline / Saline</option></select></label>'
  +'<label>Nutrient deficiency (if observed) <select id="fdDef"><option>None / not sure</option><option>Nitrogen (N)</option><option>Phosphorus (P)</option><option>Potassium (K)</option><option>Sulphur (S)</option><option>Zinc (Zn)</option><option>Iron (Fe)</option><option>Boron (B)</option></select></label></div>'
  +'<label>Step 3 — Nutrients of interest (optional)</label><div class="chips">'+nuts.map(n=>'<label class="chip"><input type="checkbox" data-nut="'+n+'"> '+n+'</label>').join("")+'<label class="chip"><input type="checkbox" data-nut="pH"> pH concern</label></div>'
  +'<button class="btn btn-primary btn-sm" id="fdGo" style="margin-top:10px">Show Relevant Information</button></div>'
  +'<div id="fdOut" style="margin-top:12px"></div>';
}
function fdRender(){
  const crop=(document.getElementById("fdCrop")||{}).value||"Rice";
  const stage=(document.getElementById("fdStage")||{}).value||"Vegetative";
  const variety=((document.getElementById("fdVar")||{}).value||"").trim();
  const soilT=(document.getElementById("fdSoilT")||{}).value||"Not sure";
  const def=(document.getElementById("fdDef")||{}).value||"None / not sure";
  const nuts=[...document.querySelectorAll("[data-nut]:checked")].map(e=>e.dataset.nut);
  const dmap={"Nitrogen (N)":"N","Phosphorus (P)":"P","Potassium (K)":"K","Sulphur (S)":"S","Zinc (Zn)":"Zn","Iron (Fe)":"Fe","Boron (B)":"B"};
  if(dmap[def] && nuts.indexOf(dmap[def])<0) nuts.push(dmap[def]);
  const st=ftSoilGet();
  let L=ftList().filter(f=>(f.suitableCrops||[]).join(" ").toLowerCase().indexOf(crop.toLowerCase())>-1 || (crop==="Paddy" && /(paddy|rice)/i.test((f.suitableCrops||[]).join(" "))));
  if(nuts.length && nuts.indexOf("pH")<0){ L=L.filter(f=>nuts.some(n=>ftMatchNut(f,n))); }
  if(nuts.indexOf("pH")>-1 || soilT==="Acidic" || soilT==="Alkaline / Saline"){ L=L.concat(ftList().filter(f=>/Lime|Dolomite|Gypsum|Sulphur/.test(f.name))); L=[...new Map(L.map(f=>[f.id,f])).values()]; }
  L=L.slice(0,12);
  document.getElementById("fdOut").innerHTML='<div class="card"><h3>Step 4 — Relevant fertilizer options for '+esc(crop)+(variety?' ('+esc(variety)+')':'')+' ('+esc(stage)+')</h3>'
  +'<p class="muted small">Soil: '+esc(soilT)+' • Deficiency: '+esc(def)+(variety?' • Variety noted for reference only — rates stay crop-and-method level.':'')+'</p>'
  +(!st?'<div class="alert">For a reliable fertilizer recommendation, use your soil test results and local crop recommendation. <button class="btn btn-sm" id="fdSoil">Enter Soil Test →</button></div>':'<p class="muted small">Using your saved soil test dated '+esc(st._on||"")+' as context only.</p>')
  +(L.length?'<div class="crop-grid" style="margin-top:12px">'+L.map(FertCard).join("")+'</div>':'<div class="empty">No matching entries — broaden the selection.</div>')+'</div>';
  const b=document.getElementById("fdSoil"); if(b) b.onclick=()=>ftShowTool("soil");
}
function CalendarPage(){
  let names=[]; try{ names=nxCrops().map(c=>c.name); }catch(e){}
  if(!names.length) names=["Rice","Wheat","Maize","Cotton","Sugarcane","Vegetables"];
  return '<div class="section-title"><h2>Crop Fertilizer Calendar</h2></div>'
  +'<p class="muted">Stage timing from crop duration; nutrient tasks are general guidance — no doses prescribed.</p>'
  +'<div class="card form"><div class="grid g3"><label>Crop <select id="calCrop">'+names.map(n=>'<option>'+esc(n)+'</option>').join("")+'</select></label>'
  +'<label>Season <select id="calSeason"><option>Kharif</option><option>Rabi</option><option>Zaid</option><option>Year-round</option></select></label>'
  +'<label>Sowing / transplanting date <input id="calDate" type="date"></label></div>'
  +'<button class="btn btn-primary btn-sm" id="calGo" style="margin-top:10px">Show Calendar</button></div>'
  +'<div id="calOut" style="margin-top:12px"></div>';
}
function calRender(){
  const crop=(document.getElementById("calCrop")||{}).value||"Rice";
  const season=(document.getElementById("calSeason")||{}).value||"Kharif";
  const dstr=(document.getElementById("calDate")||{}).value||"";
  let days=120; try{ const c=nxCrops().find(x=>x&&x.name===crop); if(c&&c.days) days=c.days; }catch(e){}
  const base=dstr?new Date(dstr+"T00:00:00"):new Date();
  const fmt=d=>d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"});
  const at=(a,b)=>fmt(new Date(base.getTime()+a*864e5))+" – "+fmt(new Date(base.getTime()+b*864e5));
  const D=Math.max(days,30);
  const rows=[
    ["Land preparation",at(-14,0),"FYM/compost incorporation; basal P and K per soil test","Test soil; do not guess."],
    ["Sowing ("+season+")",at(0,2),"Seed treatment with biofertilizers where suited","Sow behind moisture."],
    ["Early vegetative",at(Math.round(D*0.15),Math.round(D*0.3)),"First nitrogen split; weed control","Watch N-deficiency yellowing."],
    ["Vegetative / flowering",at(Math.round(D*0.4),Math.round(D*0.6)),"Balanced nutrition; micronutrients only on test advice","Protect flowers; avoid excess N."],
    ["Grain / fruit filling",at(Math.round(D*0.7),Math.round(D*0.9)),"Potassium support; maintain water","No late heavy nitrogen."],
    ["Pre-harvest / harvest",at(D,D+3),"Stop applications; harvest at maturity signs","Keep records of what was applied."]];
  document.getElementById("calOut").innerHTML='<div class="table-wrap"><table><thead><tr><th>Crop Stage</th><th>Approximate Timing</th><th>Nutrient Management</th><th>Notes</th></tr></thead><tbody>'
  +rows.map(r=>'<tr><td><b>'+esc(r[0])+'</b></td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td><td>'+esc(r[3])+'</td></tr>').join("")
  +'</tbody></table></div><p class="muted small">Source: crop duration from AgriMitra crop data; tasks are general guidance. Verify timing and inputs locally.</p>';
}
function PerfPage(){
  return '<div class="section-title"><h2>My Fertilizer Performance</h2></div>'
  +'<p class="muted">Your private field log (this browser only). No yield improvement is calculated.</p>'
  +'<div class="card form"><div class="grid g3"><label>Date <input id="pfDate" type="date"></label><label>Crop <input id="pfCrop" placeholder="e.g. Rice"></label>'
  +'<label>Fertilizer <select id="pfFert">'+ftList().map(f=>'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>').join("")+'</select></label>'
  +'<label>Growth stage <input id="pfStage" placeholder="e.g. Tillering"></label><label>Method <input id="pfMethod" placeholder="e.g. Top dressing"></label>'
  +'<label>Amount used <input id="pfAmt" placeholder="e.g. 25 kg"></label><label>Field / plot <input id="pfPlot" placeholder="e.g. East acre"></label>'
  +'<label>Symptoms before <input id="pfBefore" placeholder="e.g. pale lower leaves"></label><label>Changes after <input id="pfAfter" placeholder="e.g. greener in 10 days"></label></div>'
  +'<label>Farmer notes <input id="pfNotes" placeholder="Anything notable"></label>'
  +'<div style="margin-top:10px;display:flex;gap:8px"><button class="btn btn-primary btn-sm" id="pfAdd">Save Record</button><button class="btn btn-sm" id="pfClr">Clear All</button></div></div>'
  +'<div class="card" style="margin-top:12px"><h3>Application history</h3><div id="pfChart"></div><div id="pfList" style="margin-top:10px"></div></div>';
}
function pfGet(){ return store.get("fertPerf", []); }
function pfRender(){
  const L=pfGet(), box=document.getElementById("pfList"), ch=document.getElementById("pfChart");
  if(!box) return;
  box.innerHTML = L.length? '<div class="table-wrap"><table style="min-width:0"><thead><tr><th>Date</th><th>Crop</th><th>Fertilizer</th><th>Stage</th><th>Amount</th><th>After</th></tr></thead><tbody>'+L.map(e=>'<tr><td>'+esc(e.date||"—")+'</td><td>'+esc(e.crop||"—")+'</td><td>'+esc((ftFind(e.fert)||{name:e.fert}).name)+'</td><td>'+esc(e.stage||"—")+'</td><td>'+esc(e.amt||"—")+'</td><td>'+esc(e.after||"—")+'</td></tr>').join("")+'</tbody></table></div>' : '<p class="muted">No records yet.</p>';
  if(ch){ const agg={}; L.forEach(e=>{ const n=(ftFind(e.fert)||{name:"Other"}).name; agg[n]=(agg[n]||0)+1; }); const ks=Object.keys(agg).slice(0,8); ch.innerHTML = ks.length? barChart(ks, ks.map(k=>agg[k])) : '<p class="muted">Chart appears after first record.</p>'; }
}
function FourRPage(){
  const R=[["1. Right Source","Match the fertilizer to the deficient nutrient and crop stage — e.g. DAP for basal phosphorus, urea splits for nitrogen, chelates for quick foliar correction."],["2. Right Rate","Apply the soil-test and label rate — never a guessed bag-per-acre. Recalibrate every season with a fresh soil test."],["3. Right Time","Feed the crop when it can use it: basal at sowing, splits at tillering and flowering, foliar in cool hours."],["4. Right Place","Basal near the root zone, top-dress into moist soil, foliar onto foliage, fertigation through drippers — never broadcast volatile fertilizer onto dry crust."]];
  return '<div class="section-title"><h2>Smart Fertilizer Use — 4R</h2></div><div class="four-grid">'+R.map(r=>'<div class="card"><h3>'+esc(r[0])+'</h3><p class="muted">'+esc(r[1])+'</p></div>').join("")+'</div><div class="alert green" style="margin-top:12px">4R together cut waste, cost and runoff while keeping yields steady. When in doubt, test the soil first.</div>';
}
function AcreCalcPage(){
  return '<div class="section-title"><h2>1 Acre Fertilizer &amp; Seed Calculator</h2></div>'
  +'<p class="muted">Seed math uses verified crop seed rates. Fertilizer quantities are <b>not</b> auto-calculated — they need a soil test plus a crop-specific formula.</p>'
  +'<div class="card form"><div class="grid g3">'
  +'<label>Crop <select id="acCrop">'+Object.keys(SEED_RATES).map(c=>'<option>'+esc(c)+'</option>').join("")+'</select></label>'
  +'<label>Variety <input id="acVar" list="acVarList" placeholder="Optional"><datalist id="acVarList"></datalist></label>'
  +'<label>Sowing method <select id="acMeth"></select></label>'
  +'<label>Area <input id="acArea" type="number" value="1" min="0.1" step="0.1"></label>'
  +'<label>Area unit <select id="acUnit"><option value="preset">Preset (acres)</option><option value="acre">Acre</option><option value="hectare">Hectare</option></select></label>'
  +'<label>Quick area <select id="acPreset"><option value="1">1 acre</option><option value="2">2 acres</option><option value="5">5 acres</option><option value="10">10 acres</option><option value="">Custom…</option></select></label>'
  +'<label>Crop stage <select id="acStage"><option>Before planting</option><option>Seedling</option><option>Vegetative</option><option>Flowering</option><option>Fruiting</option><option>Grain filling</option></select></label>'
  +'<label>Soil test available? <select id="acSoilT"><option value="no">No</option><option value="yes">Yes</option></select></label>'
  +'<label>Soil N <input id="acN" placeholder="Not available"></label><label>Soil P <input id="acP" placeholder="Not available"></label>'
  +'<label>Soil K <input id="acK" placeholder="Not available"></label><label>Soil pH <input id="acPH" placeholder="Not available"></label>'
  +'</div><button class="btn btn-primary btn-sm" id="acGo" style="margin-top:10px">Calculate</button></div>'
  +'<div id="acOut" style="margin-top:12px"></div>';
}
function acreBind(){
  const fill=()=>{
    const crop=(document.getElementById("acCrop")||{}).value||"Rice";
    const R=SEED_RATES[crop];
    const ms=document.getElementById("acMeth");
    if(ms) ms.innerHTML=R?R.methods.map(m=>'<option>'+esc(m.m)+'</option>').join(""):'<option>Information not available</option>';
    const dl=document.getElementById("acVarList");
    if(dl) dl.innerHTML=seedVarietyOptions(crop).map(v=>'<option value="'+esc(v)+'">').join("");
  };
  const cc=document.getElementById("acCrop"); if(cc) cc.onchange=fill;
  const pr=document.getElementById("acPreset");
  if(pr) pr.onchange=()=>{ if(pr.value){ const a=document.getElementById("acArea"); const u=document.getElementById("acUnit"); if(a) a.value=pr.value; if(u) u.value="acre"; } };
  fill();
  const go=document.getElementById("acGo");
  if(go) go.onclick=()=>{
    const crop=(document.getElementById("acCrop")||{}).value||"Rice";
    const R=SEED_RATES[crop], out=document.getElementById("acOut");
    const m=(document.getElementById("acMeth")||{}).value||"";
    let area=+((document.getElementById("acArea")||{}).value||1);
    const unit=(document.getElementById("acUnit")||{}).value||"acre";
    const acres=(unit==="hectare")?area*2.471:area;
    const stage=(document.getElementById("acStage")||{}).value||"Vegetative";
    const hasSoil=(document.getElementById("acSoilT")||{}).value==="yes";
    let seedRows="";
    if(R){ const mo=R.methods.find(x=>x.m===m)||R.methods[0]; const f=v=>(Math.round(v*10)/10).toLocaleString("en-IN");
      seedRows='<tr><td><b>Seed requirement</b></td><td>'+f(mo.a*acres)+'–'+f(mo.b*acres)+' '+esc(mo.u)+' ('+esc(mo.m)+', '+esc(R.spacing)+')</td></tr>'; }
    else seedRows='<tr><td><b>Seed requirement</b></td><td>Information not available for this crop. Confirm with the local advisory.</td></tr>';
    const fopts=ftList().filter(f=>(f.suitableCrops||[]).join(" ").toLowerCase().indexOf(crop.toLowerCase())>-1 || (crop==="Paddy" && /(paddy|rice)/i.test((f.suitableCrops||[]).join(" ")))).slice(0,8);
    out.innerHTML='<div class="table-wrap"><table><thead><tr><th>Item</th><th>Result for '+esc(String(area))+' '+esc(unit==='preset'?'acre(s)':unit)+'</th></tr></thead><tbody>'
    +seedRows
    +'<tr><td><b>Nutrient requirement</b></td><td>'+(hasSoil?'Soil values noted — still needs a crop-specific formula from the local advisory.':'Soil test not provided.')+' <b>Scientific recommendation requires crop-specific and soil-test information.</b></td></tr>'
    +'<tr><td><b>Fertilizer options</b></td><td>'+(fopts.length?fopts.map(f=>'<a href="#/fertilizers/'+esc(f.id)+'">'+esc(f.name)+'</a>').join(" • "):"See the fertilizer list.")+' (options only — quantities need soil-test-based advice)</td></tr>'
    +'<tr><td><b>Application timing</b></td><td>'+esc(stage)+': follow the stage timing on the chosen fertilizer guide.</td></tr>'
    +'<tr><td><b>Application method</b></td><td>Method shown on each fertilizer guide; use only listed methods.</td></tr>'
    +'<tr><td><b>Number of applications</b></td><td>Information not available generically — follow the crop chart and local advisory.</td></tr>'
    +'</tbody></table></div>';
  };
}
function ftShowTool(t){
  const box=document.getElementById("ftTool"); if(!box) return;
  if(t==="finder"){ box.innerHTML=FinderPage(); const g=document.getElementById("fdGo"); if(g) g.onclick=fdRender; const fc=document.getElementById("fdCrop"); const ff=()=>{ const dl=document.getElementById("fdVarList"); if(dl) dl.innerHTML=seedVarietyOptions((fc||{}).value||"Rice").map(v=>'<option value="'+esc(v)+'">').join(""); }; if(fc) fc.onchange=ff; ff(); }
  else if(t==="calendar"){ box.innerHTML=CalendarPage(); const g=document.getElementById("calGo"); if(g) g.onclick=calRender; }
  else if(t==="compare"){ box.innerHTML=ComparePage(); const g=document.getElementById("cpGo"); if(g) g.onclick=cpRender; cpRender(); }
  else if(t==="soil"){ box.innerHTML=SoilTestPage(); stRenderOut(); const s=document.getElementById("stSave"); if(s) s.onclick=()=>{ const o={_on:new Date().toLocaleDateString("en-IN")}; ["ph","ec","oc","n","p","k","s","zn","fe","b"].forEach(k=>{ o[k]=((document.getElementById("st_"+k)||{}).value||"").trim(); }); store.set("fertSoilTest",o); stRenderOut(); alert("Soil test saved in this browser."); }; const c=document.getElementById("stClear"); if(c) c.onclick=()=>{ try{localStorage.removeItem("agrimitra_fertSoilTest");}catch(e){} stRenderOut(); }; }
  else if(t==="perf"){ box.innerHTML=PerfPage(); pfRender(); const a=document.getElementById("pfAdd"); if(a) a.onclick=()=>{ const L=pfGet(); L.unshift({date:(document.getElementById("pfDate")||{}).value||"",crop:(document.getElementById("pfCrop")||{}).value||"",fert:(document.getElementById("pfFert")||{}).value||"",stage:(document.getElementById("pfStage")||{}).value||"",method:(document.getElementById("pfMethod")||{}).value||"",amt:(document.getElementById("pfAmt")||{}).value||"",plot:(document.getElementById("pfPlot")||{}).value||"",before:(document.getElementById("pfBefore")||{}).value||"",after:(document.getElementById("pfAfter")||{}).value||"",notes:(document.getElementById("pfNotes")||{}).value||""}); store.set("fertPerf",L.slice(0,200)); pfRender(); }; const c2=document.getElementById("pfClr"); if(c2) c2.onclick=()=>{ store.set("fertPerf",[]); pfRender(); }; }
  else if(t==="fourr"){ box.innerHTML=FourRPage(); }
  else if(t==="acre"){ box.innerHTML=AcreCalcPage(); acreBind(); }
  else { box.innerHTML=""; }
  box.scrollIntoView({behavior:"smooth",block:"nearest"});
}

function DataSourcesPage(){
  const R=(m,real,sample,src)=>'<tr><td><b>'+m+'</b></td><td>'+real+'</td><td>'+sample+'</td><td>'+src+'</td></tr>';
  return '<div class="crumb"><a href="#/home">Home</a> → <b>Data & Sources</b></div>'
  +'<div class="section-title"><h2>Data & Sources</h2></div>'
  +'<p class="muted">What is real, what is sample, and how to verify. AgriMitra never invents doses, prices, yields or variety traits — unverified fields show “Information not available.”</p>'
  +'<div class="table-wrap"><table><thead><tr><th>Module</th><th>Real / verified data</th><th>Sample or marked NA</th><th>Verify via</th></tr></thead><tbody>'
  +R("Crops (112 guides)","Standard agronomy: seasons, temperature ranges, durations, soils; category IPM knowledge","Variety names and exact doses — always “verify locally”","State agriculture department, KVK")
  +R("Paddy Varieties (110)","Exact variety names, groups, research-station notes; documented traits of famous varieties (Samba Mahsuri, Swarna, IR64, Pusa Basmati 1121…)","Unverified durations, grains, regions for other lines","ANGRAU/PJTSAU releases, ICAR-IIRR, KVK")
  +R("Seed Varieties (100)","Exact variety names; documented traits of famous lines (HD 2967, TAG 24, Teja…)","Other technical fields","SAU releases, seed corporations, KVK")
  +R("Fertilizers (106)","Standard FCO/documented grade compositions; label-based methods and cautions","Doses, prices, yield claims — never stated","FCO grades, product label, Soil Health Card")
  +R("Market prices","Only live government API data when connected","Demo table removed — shows “not configured/unavailable” otherwise","AGMARKNET / eNAM / APMC")
  +R("Weather","Forecast engine when API key is configured","Current display is labelled Demo Data","IMD / mausam.imd.gov.in")
  +R("Schemes","Scheme names, benefits, official links","Eligibility edge cases — confirm on portals","pmkisan.gov.in, pmfby.gov.in")
  +R("Calculators","Arithmetic from stated rates only (e.g. per-hectare seed rates ÷ 2.471)","Fertilizer quantities — always gated, never auto-calculated","Rates shown with source on screen")
  +R("Soil / logs","Your own entries, stored only in this browser","Blank means “Not available” — never guessed","Your Soil Health Card")
  +'</tbody></table></div>'
  +'<div class="alert green" style="margin-top:12px">Rule across AgriMitra: if a fact is not verified, the screen says <b>“Information not available.”</b> rather than guessing.</div>';
}

/* ---------- DISEASES ---------- */
function pageDiseases(q){
  q=q||"";
  const list=DB.diseases.filter(d=>!q||(d.crop+" "+d.name+" "+d.sym).toLowerCase().includes(q.toLowerCase()));
  return '<div class="section-title"><h2>Pest &amp; Disease Management</h2></div>'
  +'<div class="filters"><input id="disSearch" placeholder="Search your crop or disease..." value="'+esc(q)+'" style="flex:1"></div>'
  +(list.length? '<div class="grid g2">'+list.map(d=>'<div class="card"><div class="icon">'+d.icon+'</div><h3>'+esc(d.name)+'</h3><span class="badge">'+esc(d.crop)+'</span><dl class="kv"><dt>Symptoms</dt><dd>'+esc(d.sym)+'</dd><dt>Causes</dt><dd>'+esc(d.cause)+'</dd><dt>Prevention</dt><dd>'+esc(d.prev)+'</dd><dt>IPM</dt><dd>'+esc(d.ipm)+'</dd><dt>Safe options</dt><dd>'+esc(d.safe)+'</dd></dl></div>').join("")+'</div>'
  : '<div class="empty">No match. Try paddy, blight, borer, tomato...<br><br><a class="btn btn-primary" href="#/diseases">Clear search</a></div>')
  +'<div class="alert green" style="margin-top:12px">Tip: send a clear photo of affected leaf to your Agri officer / Kisan Call Centre 1800-180-1551 for confirmation. Avoid blind spraying.</div>';
}

/* ---------- SOIL ---------- */
function pageSoil(){
  return '<div class="section-title"><h2>Soil Management</h2></div>'
  +'<div class="grid g3">'+DB.soilTypes.map(s=>'<div class="card"><div class="icon">'+s.icon+'</div><h3>'+esc(s.name)+'</h3><p class="muted">'+esc(s.where)+' &bull; pH '+esc(s.ph)+'</p><p><b>Best for:</b> '+esc(s.crop)+'</p><p class="small">Tip: '+esc(s.tip)+'</p></div>').join("")+'</div>'
  +'<div class="section-title"><h2>Soil-health dashboard</h2></div><div class="grid g2"><div class="card form"><h3>Enter your soil test values</h3>'
  +'<label>pH <input id="sPh" type="number" step="0.1" value="6.5"></label><label>Nitrogen (kg/ha) <input id="sN" type="number" value="260"></label><label>Phosphorus (kg/ha) <input id="sP" type="number" value="18"></label><label>Potassium (kg/ha) <input id="sK" type="number" value="220"></label><label>Organic matter (%) <input id="sOm" type="number" step="0.1" value="0.6"></label><button class="btn btn-primary" id="soilBtn">Check Health</button></div>'
  +'<div class="card"><h3>Result</h3><div id="soilOut"><p class="muted">Enter values and press Check Health.</p></div><h3>Improvement methods</h3><ul class="small"><li>Low OM: add 5-10 t/ha FYM/compost + green manure.</li><li>Acidic (pH&lt;5.5): lime per lab; Alkaline (pH&gt;8): gypsum + drainage.</li><li>Low N: legume rotation + Azospirillum; Low P: PSB + compost; Low K: mulch + ash/bio-K.</li><li>Water-holding: mulch, tank silt, farm pond, broad beds.</li></ul></div></div>';
}
function checkSoil(){
  const ph=+document.getElementById("sPh").value, n=+document.getElementById("sN").value, p=+document.getElementById("sP").value, k=+document.getElementById("sK").value, om=+document.getElementById("sOm").value;
  const tag=(ok)=> ok?'<span class="badge">Good</span>':'<span class="badge amber">Needs care</span>';
  const phOk = ph>=6&&ph<=7.5, nOk=n>=250, pOk=p>=15, kOk=k>=200, omOk=om>=0.75;
  const score=[phOk,nOk,pOk,kOk,omOk].filter(Boolean).length;
  document.getElementById("soilOut").innerHTML='<p><b>Health score: '+score+'/5</b></p><ul><li>pH '+ph+' '+tag(phOk)+'</li><li>N '+n+' '+tag(nOk)+'</li><li>P '+p+' '+tag(pOk)+'</li><li>K '+k+' '+tag(kOk)+'</li><li>OM '+om+'% '+tag(omOk)+'</li></ul>'+(score>=4?'<div class="alert green">Healthy soil — maintain with compost &amp; rotation.</div>':'<div class="alert">Improve with FYM, green manure &amp; balanced fertilizer per Soil Health Card.</div>');
}

/* ---------- IRRIGATION ---------- */
function pageIrrigation(){
  return '<div class="section-title"><h2>Irrigation</h2></div><div class="grid g3">'+DB.irrigations.map(w=>'<div class="card"><div class="icon">'+w.icon+'</div><h3>'+esc(w.name)+'</h3><dl class="kv"><dt>Suitable crops</dt><dd>'+esc(w.crops)+'</dd><dt>Water saving</dt><dd><b>'+esc(w.save)+'</b></dd><dt>How it works</dt><dd>'+esc(w.how)+'</dd><dt>Advantages</dt><dd>'+esc(w.adv)+'</dd><dt>Limitations</dt><dd>'+esc(w.lim)+'</dd></dl></div>').join("")+'</div><div class="alert blue" style="margin-top:12px">Subsidy: drip/sprinkler 45-55% under PMKSY-Micro Irrigation. Apply via state horticulture portal.</div>';
}

/* ---------- SCHEMES ---------- */
function pageSchemes(){
  const cats=["All",...new Set(DB.schemes.map(s=>s.cat))];
  return '<div class="section-title"><h2>Government Schemes</h2></div><p class="muted">Always verify on official sites / village secretariat. Beware of fake forms &amp; fees.</p>'
  +'<div class="pills">'+cats.map((c,i)=>'<button class="btn btn-sm'+(i===0?" btn-primary":"")+'" data-s="'+esc(c)+'">'+esc(c)+'</button>').join("")+'</div>'
  +'<div class="grid g2" id="schGrid" style="margin-top:12px">'+DB.schemes.map(s=>'<div class="card" data-cat="'+esc(s.cat)+'"><h3>'+esc(s.name)+'</h3><span class="badge">'+esc(s.cat)+'</span><dl class="kv"><dt>Eligibility</dt><dd>'+esc(s.elig)+'</dd><dt>Benefits</dt><dd>'+esc(s.ben)+'</dd><dt>Documents</dt><dd>'+esc(s.docs)+'</dd><dt>How to apply</dt><dd>'+esc(s.proc)+'</dd></dl><a class="btn btn-sm" href="'+s.link+'" target="_blank" rel="noopener">Official site</a></div>').join("")+'</div>';
}

/* ---------- CALCULATORS ---------- */
const AREAS={Acre:4046.86,Cent:40.4686,Hectare:10000,"Sq meter":1};
const WEIGHTS={Kilogram:1,Quintal:100,Ton:1000};
function pageCalculators(){
  return '<div class="section-title"><h2>Farm Calculators</h2></div><div class="pills" id="calcTabs">'
  +["Seed","Fertilizer","Irrigation","Yield","Area","Cost","Profit"].map((t,i)=>'<button class="btn btn-sm'+(i===0?" btn-primary":"")+'" data-c="'+t+'">'+t+'</button>').join("")+'</div><div class="card" style="margin-top:12px"><div id="calcBody"></div></div>'
  +'<div class="alert" style="margin-top:12px">Units supported: Acre, Cent, Hectare, Sq meter, Ton, Quintal, Kilogram.</div>';
}
function renderCalc(tab){
  const el=document.getElementById("calcBody"); if(!el) return;
  const areaOpts=Object.keys(AREAS).map(k=>'<option>'+k+'</option>').join("");
  if(tab==="Seed") el.innerHTML='<h3>Seed requirement</h3><div class="form"><label>Area <input id="cArea" type="number" value="1"></label><label>Unit <select id="cUnit">'+areaOpts+'</select></label><label>Seed rate (kg per acre) <input id="cRate" type="number" value="30"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div><p class="muted small">Example: paddy 25-30 kg/ha ~ 10-12 kg/acre transplanted.</p>';
  if(tab==="Fertilizer") el.innerHTML='<h3>Fertilizer (general estimate)</h3><div class="form"><label>Area (acre) <input id="cArea" type="number" value="1"></label><label>Crop <select id="cCrop"><option>Paddy</option><option>Wheat</option><option>Maize</option><option>Cotton</option><option>Vegetables</option></select></label><button class="btn btn-primary" id="cGo">Estimate</button></div><div id="cOut" style="margin-top:10px"></div><p class="muted small">Indicative bags only — confirm with soil test.</p>';
  if(tab==="Irrigation") el.innerHTML='<h3>Irrigation water</h3><div class="form"><label>Area <input id="cArea" type="number" value="1"></label><label>Unit <select id="cUnit">'+areaOpts+'</select></label><label>Depth (mm, e.g. 50) <input id="cDepth" type="number" value="50"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div>';
  if(tab==="Yield") el.innerHTML='<h3>Crop yield</h3><div class="form"><label>Total harvest <input id="cHarv" type="number" value="2000"></label><label>Unit <select id="cW">'+Object.keys(WEIGHTS).map(k=>'<option>'+k+'</option>').join("")+'</select></label><label>Area (acre) <input id="cArea" type="number" value="1"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div>';
  if(tab==="Area") el.innerHTML='<h3>Area converter</h3><div class="form"><label>Value <input id="cVal" type="number" value="1"></label><label>From <select id="cFrom">'+areaOpts+'</select></label><label>To <select id="cTo">'+areaOpts+'</select></label><button class="btn btn-primary" id="cGo">Convert</button></div><div id="cOut" style="margin-top:10px"></div><p class="muted small">1 Acre = 100 Cent = 0.4047 Ha = 4046.86 sqm</p>';
  if(tab==="Cost") el.innerHTML='<h3>Production cost</h3><div class="form"><label>Seed (Rs) <input id="c1" type="number" value="2000"></label><label>Fertilizer (Rs) <input id="c2" type="number" value="4000"></label><label>Labour (Rs) <input id="c3" type="number" value="6000"></label><label>Other (Rs) <input id="c4" type="number" value="3000"></label><button class="btn btn-primary" id="cGo">Total</button></div><div id="cOut" style="margin-top:10px"></div>';
  if(tab==="Profit") el.innerHTML='<h3>Profit / loss</h3><div class="form"><label>Yield (quintals) <input id="cY" type="number" value="20"></label><label>Price per quintal (Rs) <input id="cP" type="number" value="2200"></label><label>Total cost (Rs) <input id="cC" type="number" value="30000"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div>';
  const go=document.getElementById("cGo"), out=document.getElementById("cOut");
  if(!go) return;
  go.onclick=()=>{
    const v=id=>+((document.getElementById(id)||{}).value||0);
    if(tab==="Seed"){ const sqm=v("cArea")*AREAS[document.getElementById("cUnit").value]; const kg=sqm/4046.86*v("cRate"); out.innerHTML='<b>Seed needed: '+kg.toFixed(1)+' kg</b> ('+(kg/100).toFixed(2)+' quintal)'; }
    if(tab==="Fertilizer"){ const a=v("cArea"); out.innerHTML='<b>For '+a+' acre (indicative):</b> Urea ~ '+(45*a).toFixed(0)+' kg, DAP ~ '+(25*a).toFixed(0)+' kg, MOP ~ '+(15*a).toFixed(0)+' kg in splits. <br><span class="muted">Confirm with soil test.</span>'; }
    if(tab==="Irrigation"){ const sqm=v("cArea")*AREAS[document.getElementById("cUnit").value]; const litres=sqm*v("cDepth"); out.innerHTML='<b>Water: '+litres.toLocaleString("en-IN")+' litres</b> ('+(litres/1000).toFixed(1)+' kilolitres). Drip saves 40-60% vs flood.'; }
    if(tab==="Yield"){ const kg=v("cHarv")*WEIGHTS[document.getElementById("cW").value]; const perAcre=kg/v("cArea"); out.innerHTML='<b>Yield: '+perAcre.toFixed(0)+' kg/acre</b> ('+(perAcre/100).toFixed(2)+' q/acre, '+(perAcre*2.471/1000).toFixed(2)+' t/ha)'; }
    if(tab==="Area"){ const r=v("cVal")*AREAS[document.getElementById("cFrom").value]/AREAS[document.getElementById("cTo").value]; out.innerHTML='<b>'+v("cVal")+' '+document.getElementById("cFrom").value+' = '+r.toFixed(4)+' '+document.getElementById("cTo").value+'</b>'; }
    if(tab==="Cost"){ out.innerHTML='<b>Total cost: Rs '+(v("c1")+v("c2")+v("c3")+v("c4")).toLocaleString("en-IN")+'</b>'; }
    if(tab==="Profit"){ const rev=v("cY")*v("cP"), prof=rev-v("cC"); out.innerHTML='<b>Revenue Rs '+rev.toLocaleString("en-IN")+' | Profit '+(prof>=0?"+":"")+'Rs '+prof.toLocaleString("en-IN")+'</b>'+(prof<0?'<br>Loss — check cost &amp; price options.':'<br>Per quintal cost Rs '+(v("cC")/Math.max(v("cY"),0.01)).toFixed(0)); }
  };
}

/* ---------- CALENDAR ---------- */
function pageCalendar(){
  return '<div class="section-title"><h2>Seasonal Farming Calendar (India)</h2></div><div class="grid g3">'+DB.calendar.map(c=>'<div class="card"><div class="icon">'+c.icon+'</div><h3>'+esc(c.season)+'</h3><dl class="kv"><dt>Sowing</dt><dd>'+esc(c.sow)+'</dd><dt>Growing</dt><dd>'+esc(c.grow)+'</dd><dt>Harvest</dt><dd>'+esc(c.harv)+'</dd><dt>Crops</dt><dd>'+esc(c.crops)+'</dd></dl></div>').join("")+'</div><div class="alert green" style="margin-top:12px">Tip: dates shift 2-3 weeks by state. Confirm with your Mandal agri calendar &amp; IMD monsoon onset.</div>';
}

/* ---------- DASHBOARD ---------- */
function pageDashboard(){
  const loc=store.get("location","Guntur, AP"), crop=store.get("crop","Paddy / Rice");
  const mk=DB.markets.filter(m=>m.crop.toLowerCase().includes(crop.split("/")[0].trim().toLowerCase().split(" ")[0])).slice(0,3);
  return '<div class="section-title"><h2>My Farm (no login)</h2><span class="badge">Saved in this browser</span></div>'
  +'<div class="grid g2"><div class="card form"><h3>Your preferences</h3><label>Location <select id="dLoc"><option'+(loc==="Guntur, AP"?" selected":"")+'>Guntur, AP</option><option'+(loc==="Nizamabad, Telangana"?" selected":"")+'>Nizamabad, Telangana</option><option'+(loc==="Nashik, Maharashtra"?" selected":"")+'>Nashik, Maharashtra</option><option'+(loc==="Erode, TN"?" selected":"")+'>Erode, TN</option><option'+(loc==="Indore, MP"?" selected":"")+'>Indore, MP</option></select></label><label>Crop <select id="dCrop">'+DB.crops.map(c=>'<option'+(c.name===crop?" selected":"")+'>'+esc(c.name)+'</option>').join("")+'</select></label><button class="btn btn-primary" id="dSave">Save</button> <button class="btn" id="dClear">Clear</button></div>'
  +'<div class="card"><h3>Today for you</h3><p><b>'+esc(crop)+'</b> @ '+esc(loc)+'</p><p class="muted">Weather: '+DB.weatherDemo.current.temp+'C, '+esc(DB.weatherDemo.current.cond)+' — '+esc(DB.weatherDemo.adv[0])+'</p><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-sm" href="#/weather">Weather</a><a class="btn btn-sm" href="#/market?q='+encodeURIComponent(crop.split("/")[0].trim())+'">Market</a><a class="btn btn-sm" href="#/calendar">Calendar</a><a class="btn btn-sm" href="#/calculators">Calculators</a><a class="btn btn-sm" href="#/guide">Guide</a></div></div></div>'
  +'<div class="section-title"><h2>Your crop guide</h2></div><div class="card"><p>'+esc((DB.crops.find(c=>c.name===crop)||{}).sowing||"Select a crop")+'</p><button class="btn btn-sm" id="dOpenCrop">Open full crop page</button></div>'
  +'<div class="section-title"><h2>Market for your crop <span class="badge demo">Demo Data</span></h2></div>'+(mk.length?'<div class="table-wrap"><table><thead><tr><th>Crop</th><th>Market</th><th>Modal</th><th>Updated</th></tr></thead><tbody>'+mk.map(m=>'<tr><td>'+esc(m.crop)+'</td><td>'+esc(m.market)+'</td><td><b>Rs '+m.modal+'</b></td><td>'+esc(m.upd)+'</td></tr>').join("")+'</tbody></table></div>':'<div class="empty">No demo market for this crop — try Paddy, Wheat, Cotton, Onion.</div>');
}

/* ---------- SEARCH ---------- */
function doSearch(q){
  q=(q||"").trim().toLowerCase(); if(!q){ location.hash="#/home"; return; }
  const has=s=>(s||"").toLowerCase().includes(q);
  const crops=DB.crops.filter(c=>has(c.name+c.cat)), fts=DB.farmingTypes.filter(f=>has(f.name+f.def)),
    dis=DB.diseases.filter(d=>has(d.crop+d.name)), seeds=DB.seeds.filter(s=>has(s.name+s.crop)),
    fert=DB.fertilizers.filter(f=>has(f.name+f.cat)), mk=DB.markets.filter(m=>has(m.crop+m.market)), sch=DB.schemes.filter(s=>has(s.name+s.cat));
  app.innerHTML='<div class="section-title"><h2>Search: "'+esc(q)+'"</h2></div>';
  var nxHits=[]; try{ nxHits=nxCrops().filter(c=>c&&c.id&&has(c.name+" "+(c.scientificName||"")+" "+(c.category||""))).slice(0,12); }catch(e){}
  var ftHits=[]; try{ ftHits=ftList().filter(f=>f&&f.id&&has(f.name+" "+(f.chemicalName||"")+" "+(f.category||""))).slice(0,12); }catch(e){}
  var pvHits=[]; try{ pvHits=pvList().filter(p=>p&&p.id&&has(p.name)).slice(0,12); }catch(e){}
  +'<div class="card"><h3>Crops ('+crops.length+')</h3>'+(crops.map(c=>'<button class="btn btn-sm" data-crop="'+esc(c.name)+'">'+c.icon+' '+esc(c.name)+'</button>').join(" ")||'<span class="muted">None</span>')+(nxHits.length?'<p class="small" style="margin-top:8px">Guides: '+nxHits.map(c=>'<a href="#/crops/'+esc(c.id)+'">'+esc(c.name)+'</a>').join(" • ")+'</p>':"")+'</div><br>'
  +'<div class="card"><h3>Farming types ('+fts.length+')</h3>'+(fts.map(f=>'<button class="btn btn-sm" data-ft="'+esc(f.name)+'">'+esc(f.name)+'</button>').join(" ")||'<span class="muted">None</span>')+'</div><br>'
  +'<div class="card"><h3>Diseases ('+dis.length+')</h3>'+(dis.map(d=>'<span class="chip">'+esc(d.crop)+' — '+esc(d.name)+'</span>').join(" ")||'<span class="muted">None</span>')+' <a href="#/diseases?q='+encodeURIComponent(q)+'">Open →</a></div><br>'
  +'<div class="card"><h3>Seeds ('+seeds.length+') • Fertilizers ('+fert.length+')</h3><p class="small">'+seeds.map(s=>esc(s.name)).join(", ")+' '+fert.map(f=>esc(f.name)).join(", ")+'</p></div><br>'
  +'<div class="card"><h3>Markets ('+mk.length+') • Schemes ('+sch.length+')</h3><p class="small">'+mk.map(m=>esc(m.crop+" @ "+m.market)).join("; ")+' '+sch.map(s=>esc(s.name)).join("; ")+'</p><a class="btn btn-sm" href="#/market?q='+encodeURIComponent(q)+'">Open market →</a></div><br>'
  +'<div class="card"><h3>Fertilizers ('+ftHits.length+')</h3>'+(ftHits.map(f=>'<a class="btn btn-sm" href="#/fertilizers/'+esc(f.id)+'">'+esc(f.name)+'</a>').join(" ")||'<span class="muted">None — try Urea, DAP, MOP, Zinc</span>')+'</div><br>'
  +'<div class="card"><h3>Paddy Varieties ('+pvHits.length+')</h3>'+(pvHits.map(p=>'<a class="btn btn-sm" href="#/paddy-varieties/'+esc(p.id)+'">'+esc(p.name)+'</a>').join(" ")||'<span class="muted">None</span>')+'</div>';
  bindCards();
  window.scrollTo(0,0);
}
function bindCards(){
  document.querySelectorAll("[data-crop]").forEach(b=>b.onclick=()=>cropDetail(b.dataset.crop));
  document.querySelectorAll("[data-ft]").forEach(b=>b.onclick=()=>ftDetail(b.dataset.ft));
}

/* ---------- ROUTER ---------- */
function parseHash(){
  const h=(location.hash||"#/home").replace(/^#\/?/,"");
  const [path,qs]=h.split("?");
  return {route:path||"home", params:new URLSearchParams(qs||"")};
}
function renderInner(){
  if(!window.DB){
    app.innerHTML='<div class="empty"><h3>Fertilizer section could not be loaded.</h3><p class="muted">Core data file <code>js/data.js</code> did not load. Check that project files sit together and scripts are not blocked.</p><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button><a class="btn btn-sm" href="#/home">Back to AgriMitra</a></div></div>';
    return;
  }
  const {route,params}=parseHash();
  setActiveNav(route);
  document.getElementById("mainNav").classList.remove("open");
  const q=params.get("q")||"";
  if(route!=="market" && window._mkT){ clearInterval(window._mkT); window._mkT=null; }
  if(route==="home") app.innerHTML=pageHome();
  else if(route==="data-sources"){ app.innerHTML=DataSourcesPage(); bindCards(); window.scrollTo(0,0); return; }
  else if(route.indexOf("farming-types/")===0){ const fid=decodeURIComponent(route.slice(14).split("?")[0]); setActiveNav("farming-types"); ftDetailPage(fid); bindCards(); window.scrollTo(0,0); return; }
  else if(route==="farming-types") { app.innerHTML=pageFarmingTypes(q); ftTypeBind(); }
  else if(route.indexOf("crops/")===0){ const cid=decodeURIComponent(route.slice(6).split("?")[0]); setActiveNav("crops"); CropDetailPage(cid); bindCards(); window.scrollTo(0,0); return; }
  else if(route==="crops") { app.innerHTML=pageCrops(q); nxBindToolbar(); }
  else if(route==="guide") app.innerHTML=pageGuide();
  else if(route==="market") { const comm=params.get("commodity")||q; app.innerHTML=pageMarket(q,comm); mkInit(comm); }
  else if(route==="weather") app.innerHTML=pageWeather();
  else if(route==="paddy-varieties") { app.innerHTML=pagePaddyVarieties(); pvBind(); }
  else if(route.indexOf("paddy-varieties/")===0){ const pid=decodeURIComponent(route.slice(16).split("?")[0]); PaddyDetailPage(pid); bindCards(); window.scrollTo(0,0); return; }
  else if(route==="seeds") app.innerHTML=pageSeeds(q);
  else if(route==="fertilizers/compare"){ setActiveNav("fertilizers"); app.innerHTML=ComparePage(); const g=document.getElementById("cpGo"); if(g) g.onclick=cpRender; cpRender(); bindCards(); window.scrollTo(0,0); return; }
  else if(route.indexOf("fertilizers/")===0){ const fid=decodeURIComponent(route.slice(12).split("?")[0]); setActiveNav("fertilizers"); FertDetailPage(fid); bindCards(); window.scrollTo(0,0); return; }
  else if(route==="fertilizers") { app.innerHTML=pageFertilizers(); ftBind(); }
  else if(route==="diseases") app.innerHTML=pageDiseases(q);
  else if(route==="soil") app.innerHTML=pageSoil();
  else if(route==="irrigation") app.innerHTML=pageIrrigation();
  else if(route==="schemes") app.innerHTML=pageSchemes();
  else if(route==="calculators") { app.innerHTML=pageCalculators(); renderCalc("Seed"); document.querySelectorAll("#calcTabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#calcTabs button").forEach(x=>x.classList.remove("btn-primary")); b.classList.add("btn-primary"); renderCalc(b.dataset.c);}); }
  else if(route==="calendar") app.innerHTML=pageCalendar();
  else if(route==="dashboard") app.innerHTML=pageDashboard();
  else if(route==="search") doSearch(params.get("q")||"");
  else app.innerHTML='<div class="empty"><h3>Page not found</h3><a class="btn btn-primary" href="#/home">Go Home</a></div>';

  bindCards();
  // per-page bindings
  if(document.getElementById("ftyQ")) ftTypeBind();
  if(document.getElementById("nxQ")) nxBindToolbar();
  if(document.getElementById("ftQ")) ftBind();
  if(document.getElementById("pvQ")) pvBind();
  const ss=document.getElementById("seedSearch"); if(ss){ const f=()=>{ const v=ss.value.toLowerCase(), se=(document.getElementById("seedSeason")||{}).value||""; document.querySelectorAll("#seedGrid .card").forEach(c=>c.style.display=(c.textContent.toLowerCase().includes(v)&&(!se||c.dataset.season.includes(se)))?"":"none"); }; ss.oninput=f; const sx=document.getElementById("seedSeason"); if(sx) sx.onchange=f; }
  const ds=document.getElementById("disSearch"); if(ds){ ds.oninput=()=>{ if(ds.value.length>1){} }; ds.onkeydown=e=>{ if(e.key==="Enter") location.hash="#/diseases?q="+encodeURIComponent(ds.value); }; }
  document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{ document.querySelectorAll("[data-f]").forEach(x=>x.classList.remove("btn-primary")); b.classList.add("btn-primary"); document.querySelectorAll("#fertGrid .card").forEach(c=>c.style.display=(b.dataset.f==="All"||c.dataset.cat===b.dataset.f)?"":"none"); });
  document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ document.querySelectorAll("[data-s]").forEach(x=>x.classList.remove("btn-primary")); b.classList.add("btn-primary"); document.querySelectorAll("#schGrid .card").forEach(c=>c.style.display=(b.dataset.s==="All"||c.dataset.cat===b.dataset.s)?"":"none"); });
  const sb=document.getElementById("soilBtn"); if(sb) sb.onclick=checkSoil;
  const dSave=document.getElementById("dSave"); if(dSave) dSave.onclick=()=>{ store.set("location",document.getElementById("dLoc").value); store.set("crop",document.getElementById("dCrop").value); alert("Saved!"); render(); };
  const dClear=document.getElementById("dClear"); if(dClear) dClear.onclick=()=>{ localStorage.clear(); render(); };
  const dOpen=document.getElementById("dOpenCrop"); if(dOpen) dOpen.onclick=()=>cropDetail(store.get("crop","Paddy / Rice"));
  const wP=document.getElementById("wPlace"); if(wP){ wP.value=store.get("location","Guntur, AP"); wP.onchange=()=>{ store.set("location",wP.value); }; }
  try{ if(window.hydrateLiveImages) hydrateLiveImages(); }catch(e){}
  window.scrollTo(0,0);
}
/* Error Boundary: no route may ever leave a blank middle section. */
function render(){
  try{ renderInner(); }
  catch(e){
    if(window.console&&console.error) console.error(e);
    app.innerHTML='<div class="empty"><h3>Fertilizer section could not be loaded.</h3><p class="muted">Something went wrong while rendering this page. Your data is safe.</p><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="render()">Retry</button><a class="btn btn-sm" href="#/home">Back to AgriMitra</a></div></div>';
    window.scrollTo(0,0);
  }
}
window.addEventListener("error", function(){
  const el=document.getElementById("app");
  if(el && !el.innerHTML.trim()){ el.innerHTML='<div class="empty"><h3>Fertilizer section could not be loaded.</h3><p class="muted">A script failed to load. Check your connection and file paths.</p><div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button></div></div>'; }
});

/* global search */
function initSearch(){
  const inp=document.getElementById("globalSearch"), sug=document.getElementById("searchSuggest");
  const go=q=>{ location.hash="#/search?q="+encodeURIComponent(q); sug.classList.add("hidden"); };
  inp.addEventListener("input",()=>{
    const v=inp.value.trim().toLowerCase(); if(v.length<2){ sug.classList.add("hidden"); return; }
    const pick=[];
    DB.crops.forEach(c=>{ if((c.name+" "+c.cat).toLowerCase().includes(v)) pick.push({t:c.icon+" "+c.name+" (Crop)",q:c.name}); });
    DB.farmingTypes.forEach(f=>{ if(f.name.toLowerCase().includes(v)) pick.push({t:f.icon+" "+f.name+" (Farming)",q:f.name}); });
    try{ ((window.FT_NEW)||[]).forEach(f=>{ if((f.name||"").toLowerCase().includes(v)) pick.push({t:(f.icon||"🌾")+" "+f.name+" (Farming)",q:f.name}); }); }catch(e){}
    try{ ((window.FT_MORE)||[]).forEach(f=>{ if((f.name||"").toLowerCase().includes(v)) pick.push({t:(f.icon||"🌾")+" "+f.name+" (Farming)",q:f.name}); }); }catch(e){}
    DB.diseases.forEach(d=>{ if((d.name+" "+d.crop).toLowerCase().includes(v)) pick.push({t:d.crop+": "+d.name,q:d.name}); });
    DB.schemes.forEach(s=>{ if(s.name.toLowerCase().includes(v)) pick.push({t:s.name+" (Scheme)",q:s.name}); });
    try{ (window.PADDY_VARIETIES||[]).forEach(p=>{ if(p&&(p.name||"").toLowerCase().includes(v)) pick.push({t:p.name+" (Paddy variety)",q:p.name}); }); }catch(e){}
    try{ (window.FERTILIZERS||[]).forEach(f=>{ if(f&&((f.name||"")+" "+(f.chemicalName||"")).toLowerCase().includes(v)) pick.push({t:f.name+" (Fertilizer)",q:f.name}); }); }catch(e){}
    try{ nxCrops().forEach(c=>{ if(c&&((c.name||"")+" "+(c.scientificName||"")).toLowerCase().includes(v)) pick.push({t:c.name+" (Crop guide)",q:c.name}); }); }catch(e){}
    sug.innerHTML=pick.slice(0,7).map(p=>'<button data-q="'+esc(p.q)+'">'+esc(p.t)+'</button>').join("")||'<button>No matches — press Enter</button>';
    sug.classList.remove("hidden");
    sug.querySelectorAll("button").forEach(b=>b.onclick=()=>{ inp.value=b.dataset.q||v; go(inp.value); });
  });
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter") go(inp.value); });
  document.addEventListener("click",e=>{ if(!e.target.closest(".search-wrap")) sug.classList.add("hidden"); });
}

document.getElementById("menuBtn").onclick=()=>document.getElementById("mainNav").classList.toggle("open");
window.addEventListener("hashchange",render);
initSearch();
render();
