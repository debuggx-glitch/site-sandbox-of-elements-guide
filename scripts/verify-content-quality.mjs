import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "lib/guides.ts"), "utf8");
const match = source.match(/export const guides:Guide\[\]=(.*);\nexport function getGuide/s);
if (!match) throw new Error("CONTENT QUALITY GATE: guides payload not found");
const guides = JSON.parse(match[1]);
const words = (guide) => guide.sections.flatMap((section) => section.paragraphs).join(" ").toLowerCase().match(/[a-z0-9]+/g) || [];
const shingles = (tokens, size = 8) => new Set(Array.from({ length: Math.max(0, tokens.length - size + 1) }, (_, index) => tokens.slice(index, index + size).join(" ")));
const records = guides.map((guide) => ({ slug: guide.slug, words: words(guide) })).map((record) => ({ ...record, shingles: shingles(record.words) }));
const short = records.filter((record) => record.words.length < 1000);
let worst = { similarity: 0, left: null, right: null };
for (let left = 0; left < records.length; left += 1) {
  for (let right = left + 1; right < records.length; right += 1) {
    const a = records[left].shingles;
    const b = records[right].shingles;
    let intersection = 0;
    for (const value of a) if (b.has(value)) intersection += 1;
    const similarity = intersection / (a.size + b.size - intersection || 1);
    if (similarity > worst.similarity) worst = { similarity, left: records[left].slug, right: records[right].slug };
  }
}
const paragraphOwners = new Map();
for (const guide of guides) {
  for (const paragraph of guide.sections.flatMap((section) => section.paragraphs)) {
    const normalized = paragraph.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized.split(" ").length < 20) continue;
    paragraphOwners.set(normalized, new Set([...(paragraphOwners.get(normalized) || []), guide.slug]));
  }
}
const repeated = [...paragraphOwners.entries()].filter(([, owners]) => owners.size > 3);
const errors = [
  ...(short.length ? [`${short.length} page(s) are below 1000 words: ${short.map((item) => `${item.slug}=${item.words.length}`).join(", ")}`] : []),
  ...(worst.similarity > 0.4 ? [`8-word shingle similarity ${worst.similarity.toFixed(3)} between ${worst.left} and ${worst.right}`] : []),
  ...(repeated.length ? [`${repeated.length} long paragraph(s) repeat across more than three pages: ${repeated.slice(0, 3).map(([paragraph, owners]) => `${[...owners].join("/")}::${paragraph.slice(0, 70)}`).join(" | ")}`] : []),
];
if (errors.length) {
  console.error(`CONTENT QUALITY GATE: FAIL ${errors.join("; ")}`);
  process.exit(1);
}
console.log(`CONTENT QUALITY GATE: PASS pages=${guides.length} maxSimilarity=${worst.similarity.toFixed(3)}`);
