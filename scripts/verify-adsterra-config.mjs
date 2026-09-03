import {readFileSync} from "node:fs";

const config = JSON.parse(readFileSync(new URL("../config/adsterra.json", import.meta.url), "utf8"));
const fail = (message) => { console.error(`ADSTERRA CONFIG GATE: BLOCKED - ${message}`); process.exit(1); };
const required = ["socialBar", "homeBannerDesktop", "homeBannerMobile", "guideNative"];
if (config.schemaVersion !== "adsterra.public-config.v1") fail("unsupported schemaVersion");
if (!config.siteId || !config.domain) fail("siteId and domain are required");
for (const name of required) {
  const placement = config.placements?.[name];
  if (!placement) fail(`missing required placement: ${name}`);
  if (!placement.placementId || !placement.src) fail(`${name} requires placementId and src`);
  if (!placement.src.startsWith("https://")) fail(`${name}.src must use HTTPS`);
}
for (const name of ["homeBannerDesktop", "homeBannerMobile"]) {
  const placement = config.placements[name];
  if (!placement.key || !placement.width || !placement.height) fail(`${name} requires key, width, and height`);
}
if (!config.placements.guideNative.containerId) fail("guideNative.containerId is required");
const sources = [
  readFileSync(new URL("../components/ad-funnel.ts", import.meta.url), "utf8"),
  readFileSync(new URL("../components/ad-placements.tsx", import.meta.url), "utf8"),
].join("\n");
for (const event of ["ad_slot_eligible", "ad_script_loaded", "ad_slot_viewable", "ad_script_error"]) if (!sources.includes(event)) fail(`missing GA4 event ${event}`);
const created = (sources.match(/document\.createElement\("script"\)/g) ?? []).length;
const cfasync = (sources.match(/\.dataset\.cfasync\s*=\s*"false"/g) ?? []).length;
if (!created || created !== cfasync) fail("every runtime Adsterra script must set data-cfasync=false");
if (!sources.includes('data-cfasync="false"')) fail("next/script Adsterra code must set data-cfasync=false");
if (sources.includes("NEXT_PUBLIC_ADSTERRA_")) fail("public Adsterra code must not use Vercel environment variables");
const siteSource = readFileSync(new URL("../lib/site.ts", import.meta.url), "utf8");
const ga4 = siteSource.match(/ga4MeasurementId:\s*"(G-[A-Z0-9]+)"/)?.[1];
if (!ga4 || ga4 === "G-REQUIRED") fail("lib/site.ts requires a site-specific source-controlled GA4 Measurement ID");
if (siteSource.includes("NEXT_PUBLIC_GA_ID")) fail("GA4 Measurement ID must be written into the project, not supplied by Vercel");
console.log(`ADSTERRA CONFIG GATE: PASS site=${config.siteId} placements=${required.length} ga4=${ga4}`);
