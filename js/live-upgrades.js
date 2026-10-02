/* AgriMitra Live Data + Precision Calculator upgrades
 * Weather: Open-Meteo (keyless). Market remains server-side through the existing API.
 * Fertilizer math: quantity is calculated only from a user-entered nutrient target and
 * the selected product grade; no guessed crop dose is inserted.
 */
(function(){
  "use strict";

  const AM_LIVE = {
    geocode: "https://geocoding-api.open-meteo.com/v1/search",
    forecast: "https://api.open-meteo.com/v1/forecast"
  };

  function amEsc(v){ return typeof esc==="function" ? esc(v) : String(v==null?"":v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  function amPlaceToQuery(place){
    return String(place||"").replace(/,\s*(AP|Andhra Pradesh|TS|Telangana|TN|Tamil Nadu|MP|Madhya Pradesh|MH|Maharashtra)$/i,"").trim();
  }
  async function amJSON(url){
    const res=await fetch(url,{headers:{Accept:"application/json"}});
    if(!res.ok) throw new Error("HTTP_"+res.status);
    return res.json();
  }
  function amWeatherIcon(code){
    if(code===0) return "☀️";
    if([1,2].includes(code)) return "⛅";
    if(code===3) return "☁️";
    if([45,48].includes(code)) return "🌫️";
    if([51,53,55,56,57].includes(code)) return "🌦️";
    if([61,63,65,66,67,80,81,82].includes(code)) return "🌧️";
    if([71,73,75,77,85,86].includes(code)) return "🌨️";
    if([95,96,99].includes(code)) return "⛈️";
    return "🌤️";
  }
  function amWeatherText(code){
    const m={0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",
      51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Heavy freezing drizzle",
      61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Heavy freezing rain",
      71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Rain showers",81:"Rain showers",82:"Heavy rain showers",
      85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with hail"};
    return m[code]||"Current conditions";
  }
  function amFmtDate(s){
    try{return new Date(s+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"});}catch(e){return s;}
  }

  window.pageWeather = function(){
    const saved=store.get("location","Guntur, AP");
    return '<div class="section-title"><h2>Weather Dashboard <span class="badge blue">Live • Open-Meteo</span></h2>'
      +'<label style="display:flex;gap:6px;align-items:center"><span class="small">Place</span><input id="wPlaceLive" value="'+amEsc(saved)+'" placeholder="Enter city / district" style="max-width:240px"><button class="btn btn-sm" id="wGo">Update</button></label></div>'
      +'<div id="wLiveOut"><div class="card"><p>Loading live weather…</p></div></div>'
      +'<p class="muted small">Weather source: Open-Meteo. Forecast values can change; use local agriculture advisories for field decisions.</p>';
  };

  async function amLoadWeather(place){
    const out=document.getElementById("wLiveOut"); if(!out) return;
    out.innerHTML='<div class="card"><p>Loading live weather for <b>'+amEsc(place)+'</b>…</p></div>';
    try{
      const q=amPlaceToQuery(place);
      const g=await amJSON(AM_LIVE.geocode+"?name="+encodeURIComponent(q)+"&count=1&language=en&format=json");
      if(!g.results||!g.results.length) throw new Error("PLACE_NOT_FOUND");
      const p=g.results[0];
      const u=AM_LIVE.forecast+"?latitude="+encodeURIComponent(p.latitude)+"&longitude="+encodeURIComponent(p.longitude)
        +"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
        +"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset"
        +"&forecast_days=7&timezone=auto&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm";
      const d=await amJSON(u);
      const c=d.current||{}, dl=d.daily||{};
      const days=(dl.time||[]).map((date,i)=>'<div class="card" style="text-align:center"><b>'+amEsc(amFmtDate(date))+'</b><div style="font-size:30px">'+amWeatherIcon(dl.weather_code[i])+'</div><p><b>'+dl.temperature_2m_max[i]+'° / '+dl.temperature_2m_min[i]+'°C</b><br><small>Rain chance '+(dl.precipitation_probability_max[i]??"—")+'% • '+(dl.precipitation_sum[i]??0)+' mm</small></p></div>').join("");
      const advice=[];
      if((dl.precipitation_probability_max||[])[0]>=60) advice.push("Rain probability is high today; check field drainage and avoid unnecessary irrigation.");
      else advice.push("Rain probability is not high today; irrigate only according to soil moisture and crop stage.");
      if((c.wind_speed_10m||0)>=20) advice.push("Wind is elevated; avoid making spray decisions without checking the product label and local advisory.");
      else advice.push("Wind is currently moderate; follow the product label and local advisory for any spraying.");
      if((c.relative_humidity_2m||0)>=80) advice.push("High humidity can increase disease pressure; scout susceptible crops.");
      out.innerHTML='<div class="grid g4">'
        +'<div class="card"><div class="icon">'+amWeatherIcon(c.weather_code)+'</div><h3>'+c.temperature_2m+'°C</h3><p class="muted">'+amEsc(p.name)+', '+amEsc(p.country||"")+' • '+amEsc(amWeatherText(c.weather_code))+'</p></div>'
        +'<div class="card"><h3>Humidity</h3><p><b>'+c.relative_humidity_2m+'%</b></p><p class="muted">Precipitation: '+c.precipitation+' mm</p></div>'
        +'<div class="card"><h3>Wind</h3><p><b>'+c.wind_speed_10m+' km/h</b></p><p class="muted">Apparent temperature '+c.apparent_temperature+'°C</p></div>'
        +'<div class="card"><h3>Sun</h3><p>Rise '+new Date(dl.sunrise[0]).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})+'<br>Set '+new Date(dl.sunset[0]).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})+'</p></div>'
        +'</div><div class="section-title"><h2>7-day forecast</h2></div><div class="grid g4">'+days+'</div>'
        +'<div class="section-title"><h2>Farm weather checks</h2></div><div class="card"><ul>'+advice.map(amEsc).map(x=>'<li>'+x+'</li>').join("")+'</ul></div>';
      store.set("location",place);
    }catch(e){
      out.innerHTML='<div class="alert"><b>Live weather unavailable.</b> '+amEsc(e.message==="PLACE_NOT_FOUND"?"Place not found. Try a city or district name.":"Please check your connection and try again.")+'<br><button class="btn btn-sm" id="wRetry">Try again</button></div>';
      const r=document.getElementById("wRetry"); if(r) r.onclick=()=>amLoadWeather(place);
    }
  }

  function amWeatherBind(){
    if(window._amWxT){ clearInterval(window._amWxT); window._amWxT=null; }
    const input=document.getElementById("wPlaceLive"), btn=document.getElementById("wGo");
    const go=()=>amLoadWeather((input&&input.value||"Guntur, AP").trim());
    if(btn) btn.onclick=go;
    if(input) input.onkeydown=e=>{if(e.key==="Enter") go();};
    go();
    window._amWxT=setInterval(()=>{
      if(!document.hidden && (location.hash||"").indexOf("#/weather")===0){
        const p=((document.getElementById("wPlaceLive")||{}).value||"Guntur, AP").trim();
        amLoadWeather(p);
      }
    },15*60*1000);
  }

  const oldRender=window.render;
  window.render=function(){
    oldRender();
    if((location.hash||"").replace(/^#\/?/,"").split("?")[0]==="weather") setTimeout(amWeatherBind,0);
  };

  window.renderCalc = function(tab){
    const el=document.getElementById("calcBody"); if(!el) return;
    const areaOpts=Object.keys(AREAS).map(k=>'<option>'+k+'</option>').join("");
    if(tab==="Seed"){
      el.innerHTML='<h3>Seed requirement</h3><div class="form"><label>Area <input id="cArea" type="number" value="1" min="0.01" step="0.01"></label><label>Unit <select id="cUnit">'+areaOpts+'</select></label><label>Seed rate (kg per acre) <input id="cRate" type="number" min="0" step="0.1" placeholder="Enter recommended rate"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div><p class="muted small">Enter the seed rate from the selected crop/variety recommendation or certified seed label.</p>';
    } else if(tab==="Fertilizer"){
      el.innerHTML='<h3>Exact fertilizer quantity calculator</h3><p class="muted">This calculator does not guess a crop dose. Enter the nutrient recommendation and the product grade printed on the fertilizer bag.</p><div class="form"><div class="grid g3"><label>Area (acre) <input id="cArea" type="number" value="1" min="0.01" step="0.01"></label><label>Required N (kg/acre) <input id="cNTarget" type="number" min="0" step="0.1" placeholder="From soil/crop recommendation"></label><label>Required P₂O₅ (kg/acre) <input id="cPTarget" type="number" min="0" step="0.1" placeholder="From soil/crop recommendation"></label><label>Required K₂O (kg/acre) <input id="cKTarget" type="number" min="0" step="0.1" placeholder="From soil/crop recommendation"></label><label>Product N (%) <input id="cNGrade" type="number" min="0" max="100" step="0.1" placeholder="e.g. 46"></label><label>Product P₂O₅ (%) <input id="cPGrade" type="number" min="0" max="100" step="0.1" placeholder="e.g. 46"></label><label>Product K₂O (%) <input id="cKGrade" type="number" min="0" max="100" step="0.1" placeholder="e.g. 60"></label><label>Bag size (kg) <input id="cBag" type="number" value="50" min="0.1" step="0.1"></label></div><button class="btn btn-primary" id="cGo">Calculate exact product amount</button></div><div id="cOut" style="margin-top:10px"></div><p class="muted small">Formula: product kg = nutrient required ÷ nutrient fraction. If several nutrients are required, the calculator reports the amount needed for each nutrient separately; it does not pretend one product can satisfy all nutrients unless its grade supports that.</p>';
    } else if(tab==="Irrigation"){
      el.innerHTML='<h3>Irrigation water</h3><div class="form"><label>Area <input id="cArea" type="number" value="1" min="0.01"></label><label>Unit <select id="cUnit">'+areaOpts+'</select></label><label>Depth (mm) <input id="cDepth" type="number" min="0" step="0.1" placeholder="Enter recommended net depth"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div><p class="muted small">1 mm over 1 m² = 1 litre. Enter the irrigation depth recommended for your crop/soil/stage.</p>';
    } else if(tab==="Yield"){
      el.innerHTML='<h3>Crop yield</h3><div class="form"><label>Total harvest <input id="cHarv" type="number" min="0" step="0.1" placeholder="Enter harvest"></label><label>Unit <select id="cW">'+Object.keys(WEIGHTS).map(k=>'<option>'+k+'</option>').join("")+'</select></label><label>Area (acre) <input id="cArea" type="number" min="0.01" step="0.01" value="1"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div>';
    } else if(tab==="Area"){
      el.innerHTML='<h3>Area converter</h3><div class="form"><label>Value <input id="cVal" type="number" value="1"></label><label>From <select id="cFrom">'+areaOpts+'</select></label><label>To <select id="cTo">'+areaOpts+'</select></label><button class="btn btn-primary" id="cGo">Convert</button></div><div id="cOut" style="margin-top:10px"></div>';
    } else if(tab==="Cost"){
      el.innerHTML='<h3>Production cost</h3><p class="muted">Enter your actual local purchase/labour prices; AgriMitra will only add the numbers you provide.</p><div class="form"><div class="grid g3">'+["Seed","Fertilizer","Labour","Irrigation","Plant protection","Machinery","Harvesting","Transport","Other"].map((n,i)=>'<label>'+n+' (₹)<input id="c'+i+'" type="number" min="0" step="0.01" value="0"></label>').join("")+'</div><button class="btn btn-primary" id="cGo">Total cost</button></div><div id="cOut" style="margin-top:10px"></div>';
    } else if(tab==="Profit"){
      el.innerHTML='<h3>Profit / loss</h3><div class="form"><label>Yield (quintals) <input id="cY" type="number" min="0" step="0.01"></label><label>Sale price / quintal (₹) <input id="cP" type="number" min="0" step="0.01"></label><label>Total cost (₹) <input id="cC" type="number" min="0" step="0.01"></label><button class="btn btn-primary" id="cGo">Calculate</button></div><div id="cOut" style="margin-top:10px"></div>';
    }
    const go=document.getElementById("cGo"), out=document.getElementById("cOut");
    if(!go) return;
    const num=id=>+((document.getElementById(id)||{}).value||0);
    const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
    go.onclick=()=>{
      if(tab==="Seed"){
        const area=num("cArea"), unit=document.getElementById("cUnit").value, rate=num("cRate");
        if(area<=0||rate<=0){out.innerHTML='<div class="alert">Enter both area and a positive recommended seed rate.</div>';return;}
        const acres=area*AREAS[unit]/AREAS.Acre, kg=acres*rate;
        out.innerHTML='<div class="card"><b>Seed required: '+kg.toFixed(2)+' kg</b><br>'+ (kg/100).toFixed(3)+' quintal for '+acres.toFixed(4)+' acres.</div>';
      } else if(tab==="Fertilizer"){
        const area=num("cArea"), rows=[];
        [["N","cNTarget","cNGrade"],["P₂O₅","cPTarget","cPGrade"],["K₂O","cKTarget","cKGrade"]].forEach(x=>{
          const target=num(x[1]), grade=num(x[2]); if(target>0 && grade>0) rows.push([x[0],target*area,target*area/(grade/100)]);
        });
        if(area<=0||!rows.length){out.innerHTML='<div class="alert">Enter the area and at least one nutrient target plus its product grade.</div>';return;}
        const bag=num("cBag")||50;
        out.innerHTML='<div class="table-wrap"><table><thead><tr><th>Nutrient</th><th>Total nutrient needed</th><th>Product needed</th><th>50 kg-bag equivalent</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><b>'+r[0]+'</b></td><td>'+r[1].toFixed(2)+' kg</td><td><b>'+r[2].toFixed(2)+' kg</b></td><td>'+ (r[2]/bag).toFixed(3)+' bags</td></tr>').join("")+'</tbody></table></div><div class="alert" style="margin-top:10px">These are mathematical quantities from the inputs you supplied. They are not a crop prescription. Use the soil-test/crop recommendation and the product label before applying fertilizer.</div>';
      } else if(tab==="Irrigation"){
        const area=num("cArea"), unit=document.getElementById("cUnit").value, depth=num("cDepth");
        const sqm=area*AREAS[unit]; if(sqm<=0||depth<0){out.innerHTML='<div class="alert">Enter valid area and irrigation depth.</div>';return;}
        const litres=sqm*depth; out.innerHTML='<b>Water volume: '+litres.toLocaleString("en-IN",{maximumFractionDigits:0})+' litres</b> ('+(litres/1000).toFixed(3)+' kL).';
      } else if(tab==="Yield"){
        const kg=num("cHarv")*WEIGHTS[document.getElementById("cW").value], area=num("cArea");
        if(area<=0){out.innerHTML='<div class="alert">Enter a positive area.</div>';return;}
        const pa=kg/area; out.innerHTML='<b>'+pa.toFixed(2)+' kg/acre</b> • '+(pa/100).toFixed(3)+' q/acre • '+(pa*2.471/1000).toFixed(3)+' t/ha';
      } else if(tab==="Area"){
        const r=num("cVal")*AREAS[document.getElementById("cFrom").value]/AREAS[document.getElementById("cTo").value]; out.innerHTML='<b>'+num("cVal")+' '+document.getElementById("cFrom").value+' = '+r.toFixed(4)+' '+document.getElementById("cTo").value+'</b>';
      } else if(tab==="Cost"){
        let total=0; for(let i=0;i<9;i++) total+=num("c"+i); out.innerHTML='<b>Total cost: '+money(total)+'</b>';
      } else if(tab==="Profit"){
        const rev=num("cY")*num("cP"), cost=num("cC"), diff=rev-cost; out.innerHTML='<b>Revenue: '+money(rev)+' • '+(diff>=0?"Net balance: ":"Net loss: ")+money(Math.abs(diff))+'</b>';
      }
    };
  };
})();
