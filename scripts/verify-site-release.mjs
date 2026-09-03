#!/usr/bin/env node
import fs from "node:fs";

const failures = [];
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

let release;
try {
  release = JSON.parse(read("config/release.json"));
} catch (error) {
  failures.push(`release config invalid: ${error.message}`);
}

if (release?.schemaVersion !== "site.release.v1") failures.push("release schemaVersion must be site.release.v1");
if (typeof release?.allowIndexing !== "boolean") failures.push("allowIndexing must be boolean");

for (const [file, canonical] of [
  ["app/page.tsx", "/"],
  ["app/about/page.tsx", "/about/"],
  ["app/privacy/page.tsx", "/privacy/"],
  ["app/contact/page.tsx", "/contact/"],
]) {
  if (!read(file).includes(`alternates:{canonical:"${canonical}"}`)) failures.push(`${file} missing canonical ${canonical}`);
}

const layout = read("app/layout.tsx");
const robots = read("app/robots.ts");
const telemetry = read("components/telemetry.tsx");
const pkg = JSON.parse(read("package.json"));

if (!layout.includes('import release from "@/config/release.json"') || !layout.includes("index:release.allowIndexing") || !layout.includes("follow:release.allowIndexing")) failures.push("layout must use source-controlled indexing flag");
if (!robots.includes('import release from "@/config/release.json"') || !robots.includes("const live=release.allowIndexing") || !robots.includes("`${site.url}/sitemap.xml`")) failures.push("robots route must use source-controlled indexing flag and canonical sitemap");
if (layout.includes("NEXT_PUBLIC_ALLOW_INDEXING") || robots.includes("NEXT_PUBLIC_ALLOW_INDEXING")) failures.push("indexing must not depend on a Vercel environment variable");
if (!telemetry.includes('@vercel/analytics/next') || !telemetry.includes('<Analytics/>')) failures.push("Vercel Web Analytics must be source-controlled in telemetry");
if (!telemetry.includes('@vercel/speed-insights/next') || !telemetry.includes('<SpeedInsights/>')) failures.push("Vercel Speed Insights must be source-controlled in telemetry");
if (!pkg.dependencies?.["@vercel/analytics"] || !pkg.dependencies?.["@vercel/speed-insights"]) failures.push("Vercel analytics dependencies must be declared");

if (failures.length) {
  failures.forEach((failure) => console.error(`RELEASE GATE FAIL: ${failure}`));
  process.exit(1);
}

console.log(`Release config gate PASS: indexing=${release.allowIndexing ? "open" : "closed"}; static canonicals=4; Vercel telemetry=enabled`);
