import fs from "node:fs";

const fail = (message) => {
  console.error(`SEO METADATA GATE: ${message}`);
  process.exitCode = 1;
};
const read = (path) => fs.readFileSync(path, "utf8");
const extractString = (source, field) => {
  const match = source.match(new RegExp(`${field}\\s*:\\s*((?:"(?:[^"\\\\]|\\\\.)*")|(?:'(?:[^'\\\\]|\\\\.)*'))`));
  if (!match) return "";
  const raw = match[1];
  return raw.startsWith('"') ? JSON.parse(raw) : raw.slice(1, -1);
};
const normalize = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();
const placeholder = /\b(todo|tbd|placeholder|lorem ipsum|coming soon)\b/i;

const siteSource = read("lib/site.ts");
const guidesSource = read("lib/guides.ts");
const siteName = extractString(siteSource, "name");
const homeTitle = extractString(siteSource, "homeTitle");
const siteDescription = extractString(siteSource, "description");

if (!homeTitle) fail("lib/site.ts requires homeTitle");
if (!siteDescription) fail("lib/site.ts requires description");
if (homeTitle && normalize(homeTitle) === normalize(siteName)) {
  fail("homepage title must describe the site task, not only repeat the brand name");
}
if (placeholder.test(homeTitle) || placeholder.test(siteDescription)) fail("homepage metadata contains placeholder copy");

const guidesMatch = guidesSource.match(/export const guides[^=]*=([\s\S]*?);\s*export function/);
if (!guidesMatch) {
  fail("cannot read the generated guide metadata array");
} else {
  let guides;
  try {
    guides = JSON.parse(guidesMatch[1]);
  } catch {
    fail("generated guide metadata must remain machine-readable JSON");
    guides = [];
  }
  const titles = new Map();
  const descriptions = new Map();
  for (const guide of guides) {
    if (!guide.title?.trim()) fail(`${guide.slug || "unknown guide"} has no title`);
    if (!guide.description?.trim()) fail(`${guide.slug || "unknown guide"} has no description`);
    if (placeholder.test(guide.title || "") || placeholder.test(guide.description || "")) fail(`${guide.slug} contains placeholder metadata`);
    const titleKey = normalize(guide.title || "");
    const descriptionKey = normalize(guide.description || "");
    if (titles.has(titleKey)) fail(`duplicate title: ${guide.slug} and ${titles.get(titleKey)}`);
    if (descriptions.has(descriptionKey)) fail(`duplicate description: ${guide.slug} and ${descriptions.get(descriptionKey)}`);
    titles.set(titleKey, guide.slug);
    descriptions.set(descriptionKey, guide.slug);
    if ((guide.title || "").length > 65) console.warn(`SEO METADATA WARNING: ${guide.slug} title may truncate on some devices`);
    if ((guide.description || "").length > 165) console.warn(`SEO METADATA WARNING: ${guide.slug} description may truncate on some devices`);
  }
}

if (!process.exitCode) console.log("SEO METADATA GATE: pass");
