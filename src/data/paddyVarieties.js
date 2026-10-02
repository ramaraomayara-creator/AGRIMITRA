/* AgriMitra Paddy Varieties — 110 entries, local-first (no API needed for guides).
 * Classic script exposing window.PADDY_VARIETIES (matches existing data pattern).
 * HONESTY RULE: only widely documented facts are stated; everything unverified is
 * "Information not available." Never invent yield/dosage/resistance/price data. */
(function(){
"use strict";
var NA = "Information not available.";
var GROUP_NOTE = {
"MTU": "MTU cultures are associated with the Maruteru research station in Andhra Pradesh.",
"BPT": "BPT cultures are associated with Bapatla in Andhra Pradesh.",
"NLR": "NLR cultures are associated with Nellore in Andhra Pradesh.",
"RGL": "RGL cultures are associated with Ragolu in Andhra Pradesh.",
"JGL": "JGL cultures are associated with Jagtial in Telangana.",
"WGL": "WGL cultures are associated with Warangal in Telangana.",
"IR": "IR lines originate from the International Rice Research Institute (IRRI) breeding program.",
"DRR Dhan": "DRR Dhan lines are associated with the ICAR-Indian Institute of Rice Research, Hyderabad.",
"Pusa Basmati": "Pusa lines are associated with the Indian Agricultural Research Institute (IARI), New Delhi.",
"PR": "PR lines are associated with Punjab Agricultural University, Ludhiana.",
"CR Dhan": "CR lines are associated with the ICAR-National Rice Research Institute, Cuttack.",
"Other": "" };
function pvGroup(name){
  if(name.indexOf("DRR Dhan")===0) return "DRR Dhan";
  if(name.indexOf("Pusa Basmati")===0) return "Pusa Basmati";
  if(name.indexOf("CR Dhan")===0||name.indexOf("CR 1009")===0||name.indexOf("CR ")===0) return "CR Dhan";
  var pre = name.split(" ")[0];
  if(pre==="MTU"||pre==="BPT"||pre==="NLR"||pre==="RGL"||pre==="JGL"||pre==="WGL"||pre==="IR"||pre==="PR") return pre;
  return "Other";
}
function PV(id,name,o){
  o=o||{};
  var g = pvGroup(name);
  var gn = GROUP_NOTE[g]||"";
  var desc = o.desc || (name+" is a paddy (Oryza sativa) variety of the "+g+" group."+(gn?" "+gn:"")+" Verify local suitability with the agricultural department or university advisory.");
  var feat = (o.feat&&o.feat.length)?o.feat.slice():[];
  if(gn && feat.indexOf(gn)<0) feat.push(gn);
  return { id:id, name:name, crop:"Paddy", category:"Paddy",
    image:"https://loremflickr.com/600/400/paddy,ricefield?lock="+id.length+"-"+id.charCodeAt(0),
    imageSource:null, varietyImageUnavailable:true,
    description:desc, season:o.s||NA, duration:o.d||NA, days:o.days||0,
    suitableSoil:o.soil||NA, waterRequirement:o.water||NA,
    suitableRegions:o.regions||NA, grainType:o.grain||NA, features:feat.length?feat:[NA],
    source:"AgriMitra variety compilation from public breeding-program records. Verify with local agricultural university / ICAR advisory." };
}
window.PADDY_VARIETIES = [
PV("bpt-5204","BPT 5204 (Samba Mahsuri)",{s:"Kharif, Rabi",d:"140–145 days",days:142,soil:"Clay loam with good water retention",water:"High",regions:"Andhra Pradesh, Telangana, Tamil Nadu, Karnataka",grain:"Medium slender, non-aromatic",feat:["Samba Mahsuri fine-grain type","Non-lodging; excellent cooking quality"],desc:"BPT 5204 (Samba Mahsuri) is a famous fine-grain paddy variety widely grown in South India."}),
PV("mtu-1010","MTU 1010",{s:"Kharif",d:"120–125 days",days:122,regions:"Andhra Pradesh, Telangana",grain:"Medium slender",feat:["Early medium-duration popular variety"]}),
PV("mtu-1001","MTU 1001",{}),
PV("mtu-7029-swarna","MTU 7029 (Swarna)",{s:"Kharif",d:"145–150 days",days:148,regions:"Andhra Pradesh, Telangana, Odisha, West Bengal",grain:"Short bold (Swarna)",feat:["Short-bold Swarna grain; BLB tolerant","Stable yielder in shallow lowlands"]}),
PV("mtu-1061","MTU 1061",{}),
PV("mtu-1064","MTU 1064",{}),
PV("mtu-1075","MTU 1075",{}),
PV("mtu-1081","MTU 1081",{}),
PV("mtu-1121","MTU 1121",{}),
PV("mtu-1156","MTU 1156",{}),
PV("nlr-34449","NLR 34449",{}),
PV("nlr-33892","NLR 33892",{}),
PV("nlr-4001","NLR 4001",{}),
PV("nlr-3354","NLR 3354",{}),
PV("rgl-2537","RGL 2537",{}),
PV("rgl-2624","RGL 2624",{}),
PV("bpt-2231","BPT 2231",{}),
PV("bpt-3291","BPT 3291",{}),
PV("jgl-11118","JGL 11118",{}),
PV("jgl-18047","JGL 18047",{}),
PV("jgl-24423","JGL 24423",{}),
PV("jgl-384","JGL 384",{}),
PV("wgl-44","WGL 44",{}),
PV("wgl-32100","WGL 32100",{}),
PV("ir-8","IR 8",{feat:["Historic first dwarf high-yielding IRRI variety"],regions:"Irrigated areas (historic)"}),
PV("ir-20","IR 20",{}),
PV("ir-24","IR 24",{}),
PV("ir-36","IR 36",{s:"Kharif (irrigated)",d:"110–120 days",days:115,regions:"Irrigated areas",feat:["Early-maturing widely adapted variety"]}),
PV("ir-50","IR 50",{}),
PV("ir-64","IR 64",{s:"Kharif (irrigated)",d:"115–120 days",days:118,regions:"Irrigated belts across India",grain:"Long slender",feat:["Widely adapted irrigated variety"]}),
PV("ir-72","IR 72",{}),
PV("jaya","Jaya",{feat:["Historic dwarf high-yielding variety of the Green Revolution era"],regions:"Irrigated areas (historic)"}),
PV("hmt","HMT",{}),
PV("hmt-sona","HMT Sona",{}),
PV("telangana-sona","Telangana Sona",{regions:"Telangana",feat:["Reported low glycaemic-index selection — verify with local advisory"]}),
PV("jyothi","Jyothi",{}),
PV("prabhat","Prabhat",{}),
PV("prasanna","Prasanna",{}),
PV("vijaya","Vijaya",{}),
PV("sabari","Sabari",{}),
PV("chaitanya","Chaitanya",{}),
PV("srikakulam-sannalu","Srikakulam Sannalu",{}),
PV("krishna-hamsa","Krishna Hamsa",{}),
PV("drr-dhan-42","DRR Dhan 42",{}),
PV("drr-dhan-43","DRR Dhan 43",{}),
PV("drr-dhan-44","DRR Dhan 44",{}),
PV("drr-dhan-45","DRR Dhan 45",{}),
PV("drr-dhan-46","DRR Dhan 46",{}),
PV("drr-dhan-47","DRR Dhan 47",{}),
PV("drr-dhan-48","DRR Dhan 48",{}),
PV("drr-dhan-49","DRR Dhan 49",{}),
PV("drr-dhan-50","DRR Dhan 50",{}),
PV("drr-dhan-51","DRR Dhan 51",{}),
PV("drr-dhan-52","DRR Dhan 52",{}),
PV("drr-dhan-53","DRR Dhan 53",{}),
PV("drr-dhan-54","DRR Dhan 54",{}),
PV("drr-dhan-55","DRR Dhan 55",{}),
PV("drr-dhan-56","DRR Dhan 56",{}),
PV("drr-dhan-57","DRR Dhan 57",{}),
PV("drr-dhan-58","DRR Dhan 58",{}),
PV("drr-dhan-59","DRR Dhan 59",{}),
PV("drr-dhan-60","DRR Dhan 60",{}),
PV("pusa-basmati-1","Pusa Basmati 1",{s:"Kharif",regions:"Punjab, Haryana, western Uttar Pradesh",grain:"Long slender aromatic Basmati",feat:["Early Basmati variety from IARI"]}),
PV("pusa-basmati-1121","Pusa Basmati 1121",{s:"Kharif",d:"140–145 days",days:142,regions:"Punjab, Haryana, western Uttar Pradesh",grain:"Extra-long slender aromatic Basmati",feat:["Premium export-quality Basmati"]}),
PV("pusa-basmati-1509","Pusa Basmati 1509",{s:"Kharif",d:"115–120 days",days:118,regions:"Punjab, Haryana, western Uttar Pradesh",grain:"Long slender aromatic, early maturing",feat:["Early Basmati for timely harvest"]}),
PV("pusa-basmati-1718","Pusa Basmati 1718",{s:"Kharif",regions:"Punjab, Haryana, western Uttar Pradesh",grain:"Aromatic Basmati type"}),
PV("pusa-basmati-1637","Pusa Basmati 1637",{s:"Kharif",regions:"Punjab, Haryana, western Uttar Pradesh",grain:"Aromatic Basmati type"}),
PV("pusa-basmati-1847","Pusa Basmati 1847",{s:"Kharif",regions:"Punjab, Haryana, western Uttar Pradesh",grain:"Aromatic Basmati type"}),
PV("pusa-basmati-1692","Pusa Basmati 1692",{s:"Kharif",regions:"Punjab, Haryana, western Uttar Pradesh",grain:"Aromatic Basmati type"}),
PV("basmati-370","Basmati 370",{regions:"Punjab",grain:"Traditional tall aromatic Basmati",feat:["Traditional aromatic Basmati"]}),
PV("pr-106","PR 106",{s:"Kharif",d:"145–150 days",days:147,regions:"Punjab",grain:"Long-duration parmal (non-basmati)",feat:["Classic long-duration Punjab parmal"]}),
PV("pr-114","PR 114",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-121","PR 121",{d:"135–140 days",days:138,regions:"Punjab",grain:"Parmal type"}),
PV("pr-123","PR 123",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-124","PR 124",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-126","PR 126",{d:"123–128 days",days:125,regions:"Punjab",grain:"Short-duration parmal type",feat:["Short-duration Punjab variety"]}),
PV("pr-127","PR 127",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-128","PR 128",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-129","PR 129",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-130","PR 130",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-131","PR 131",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("pr-132","PR 132",{regions:"Punjab",grain:"Parmal (non-basmati) type"}),
PV("cr-1009","CR 1009",{regions:"Coastal Odisha, West Bengal",feat:["Popular in eastern coastal belts"]}),
PV("cr-1009-sub-1","CR 1009 Sub-1",{regions:"Flood-prone eastern belts",feat:["Submergence-tolerant version of CR 1009"]}),
PV("cr-dhan-310","CR Dhan 310",{}),
PV("cr-dhan-315","CR Dhan 315",{}),
PV("cr-dhan-601","CR Dhan 601",{}),
PV("padma","Padma",{}),
PV("bala","Bala",{}),
PV("kiron","Kiron",{}),
PV("krishna","Krishna",{}),
PV("ratna","Ratna",{grain:"Fine grain",feat:["Long-standing popular fine variety"]}),
PV("saket-4","Saket-4",{}),
PV("jayanti","Jayanti",{}),
PV("kalinga-i","Kalinga-I",{}),
PV("kalinga-ii","Kalinga-II",{}),
PV("shakti","Shakti",{}),
PV("supriya","Supriya",{}),
PV("vani","Vani",{}),
PV("naikichili","Naikichili",{}),
PV("anamika","Anamika",{}),
PV("indira","Indira",{}),
PV("pallavi","Pallavi",{}),
PV("ramakrishna","Ramakrishna",{}),
PV("sarala","Sarala",{}),
PV("durga","Durga",{}),
PV("shatabdi","Shatabdi",{}),
PV("anjali","Anjali",{}),
PV("hazaridhan","Hazaridhan",{}),
PV("naveen","Naveen",{})
];
window.PADDY_GROUPS = ["MTU","BPT","NLR","RGL","JGL","WGL","IR","DRR Dhan","Pusa Basmati","PR","CR Dhan","Other"];
})();
