import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "lib/guides.ts");
const source = fs.readFileSync(file, "utf8");
const match = source.match(/export const guides:Guide\[\]=(.*);\nexport function getGuide/s);
if (!match) throw new Error("CONTENT ASSET GATE: guides payload not found");
const guides = JSON.parse(match[1]);
let checkedPages = 0;
for (const guide of guides) {
  checkedPages += 1;
  const visuals = guide.sections.flatMap((section) => section.visual ? [section.visual] : []);
  if (visuals.length !== 2) throw new Error(`CONTENT ASSET GATE: ${guide.slug} requires exactly two visuals`);
  const authenticVisuals = visuals.filter((visual) => visual.src?.startsWith("/images/official/") || visual.src?.startsWith("/images/third-party/"));
  if (authenticVisuals.length < 1) throw new Error(`CONTENT ASSET GATE: ${guide.slug} requires at least one authentic official or third-party visual`);
  for (const visual of visuals) {
    const allowedPath = visual.src?.startsWith("/images/official/") || visual.src?.startsWith("/images/third-party/") || visual.src?.startsWith("/images/editorial/");
    if (!visual.assetId || !visual.alt || !visual.caption || !allowedPath) {
      throw new Error(`CONTENT ASSET GATE: ${guide.slug} has incomplete visual metadata`);
    }
    if (visual.src.startsWith("/images/editorial/") && !visual.caption.toLowerCase().includes("not a gameplay screenshot")) {
      throw new Error(`CONTENT ASSET GATE: ${guide.slug} must label editorial visuals as non-gameplay`);
    }
    if (!fs.existsSync(path.join(root, "public", visual.src.slice(1)))) {
      throw new Error(`CONTENT ASSET GATE: ${guide.slug} is missing ${visual.src}`);
    }
  }
}
if (!checkedPages) throw new Error("CONTENT ASSET GATE: no guide pages found");
console.log(`CONTENT ASSET GATE: PASS pages=${checkedPages} visuals=${checkedPages * 2} authentic>=${checkedPages}`);
