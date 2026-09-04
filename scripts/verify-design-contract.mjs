import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const design=JSON.parse(fs.readFileSync(path.join(root,"config/design-contract.json"),"utf8"));
const ads=JSON.parse(fs.readFileSync(path.join(root,"config/adsterra.json"),"utf8"));
const requiredDimensions=["navigationModel","homepageComposition","articleComposition","cardSilhouette","contentDensity","mobileTransformation","adPlacementPattern"];
const requiredSlots=["social_global","home_banner_desktop","home_banner_mobile","home_side_desktop","guide_native_mid"];
const allowedSizes=new Set(["468x60","300x250","160x300","160x600","320x50","728x90","responsive","provider_responsive"]);
const fail=(message)=>{console.error(`DESIGN CONTRACT GATE: FAIL ${message}`);process.exit(1)};
if(design.schemaVersion!=="1.0.0"||!/^T\d{2}-/.test(design.templateFamilyId||""))fail("invalid schemaVersion or templateFamilyId");
for(const field of requiredDimensions)if(!design.fingerprint?.[field])fail(`missing fingerprint.${field}`);
if(!design.sourceAsset?.startsWith("/images/")||!fs.existsSync(path.join(root,"public",design.sourceAsset)))fail("sourceAsset is missing");
for(const field of ["primary","secondary","accent","surface","text"])if(!/^#[0-9a-f]{6}$/i.test(design.palette?.[field]||""))fail(`invalid palette.${field}`);
if(!Array.isArray(design.adInventory)||design.adInventory.length<4)fail("adInventory must contain the required floor");
const names=new Set();
const activeRefsByPage=new Map();
for(const slot of design.adInventory){
  if(!slot.slotName||names.has(slot.slotName))fail(`duplicate or missing slotName ${slot.slotName||""}`);
  names.add(slot.slotName);
  if(!["active","planned_inactive"].includes(slot.status))fail(`invalid status for ${slot.slotName}`);
  if(!allowedSizes.has(slot.size))fail(`unsupported size ${slot.size} for ${slot.slotName}`);
  if(!Array.isArray(slot.pageTypes)||!slot.pageTypes.length||!slot.position||!slot.ga4Placement||!Number.isInteger(slot.maxPerPage)||slot.maxPerPage<1)fail(`incomplete layout data for ${slot.slotName}`);
  if(slot.status==="planned_inactive"){if(slot.zoneRef!==null)fail(`planned_inactive slot ${slot.slotName} must have null zoneRef`);continue}
  if(!slot.zoneRef||!ads.placements?.[slot.zoneRef])fail(`active slot ${slot.slotName} has no real Adsterra zone`);
  for(const pageType of slot.pageTypes){
    const key=`${pageType}:${slot.zoneRef}`;
    if(activeRefsByPage.has(key))fail(`Adsterra zone ${slot.zoneRef} repeats on page type ${pageType}`);
    activeRefsByPage.set(key,slot.slotName);
  }
}
for(const slot of requiredSlots)if(!names.has(slot)||design.adInventory.find(item=>item.slotName===slot)?.status!=="active")fail(`required active slot missing: ${slot}`);
const home=fs.readFileSync(path.join(root,"app/page.tsx"),"utf8");
const guide=fs.readFileSync(path.join(root,"app/guides/[slug]/page.tsx"),"utf8");
const layout=fs.readFileSync(path.join(root,"app/layout.tsx"),"utf8");
if(!home.includes("<HomeAd/"))fail("home active ad is not rendered");
if(!home.includes("<HomeSideAd/"))fail("home desktop side ad is not rendered");
if(!guide.includes("<GuideAd/"))fail("guide active ad is not rendered");
if(!layout.includes("<SocialBar/"))fail("global social active ad is not rendered");
if(home.indexOf("<HomeAd/")>home.indexOf("<section"))fail("home primary ad must render before the hero");
const guideAdIndex=guide.indexOf("<GuideAd/");
const leadVisualIndex=guide.indexOf('className="lead-visual"');
const longFormIndex=guide.indexOf("guide.sections.map",guideAdIndex);
if(guideAdIndex<0||leadVisualIndex<guideAdIndex||longFormIndex<leadVisualIndex)fail("guide order must be answer-first, primary ad, lead visual, then long-form sections");
console.log(`DESIGN CONTRACT GATE: PASS family=${design.templateFamilyId} ads=${design.adInventory.filter(slot=>slot.status==="active").length} active+${design.adInventory.filter(slot=>slot.status==="planned_inactive").length} planned`);
