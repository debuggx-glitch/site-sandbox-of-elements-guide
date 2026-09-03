#!/usr/bin/env node
import fs from "node:fs";

const failures = [];
const readJson = (relative) => {
  try {
    return JSON.parse(fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8"));
  } catch (error) {
    failures.push(`${relative} invalid or missing: ${error.message}`);
    return null;
  }
};

const game = readJson("config/game-entity.json");
const manifest = readJson("config/structured-data-manifest.json");
const siteTypes = new Set(["WebSite", "Organization", "VideoGame"]);
const pageTypes = new Set(["Article", "BreadcrumbList"]);
const conditionalRules = new Map([
  ["NewsArticle", "news_dates_and_sources_visible"],
  ["ItemList", "ordered_items_and_ranking_basis_visible"],
  ["HowTo", "executable_steps_visible"],
  ["FAQPage", "questions_and_answers_visible"],
  ["VideoGameSeries", "multiple_games_in_series_visible"],
]);
const forbiddenTokens = ["GameCharacter", "PlayGameAction", '"developer"'];

if (game?.schemaVersion !== "seo-geo.game-entity.v1") failures.push("game entity schemaVersion must be seo-geo.game-entity.v1");
if (manifest?.schemaVersion !== "seo-geo.structured-data.v1") failures.push("structured data manifest schemaVersion must be seo-geo.structured-data.v1");
if (game?.game?.schemaType !== "VideoGame") failures.push("game.schemaType must be VideoGame");
if (!game?.game?.entityId?.endsWith("/#video-game")) failures.push("game.entityId must be the stable canonical #video-game ID");
if (new Set(game?.requiredTypes || []).size !== 3 || [...siteTypes].some((value) => !game.requiredTypes.includes(value))) failures.push("requiredTypes must be WebSite, Organization, and VideoGame");
if (game?.organization?.fictionalExpertPersonasAllowed !== false) failures.push("fictional expert personas must be disabled");

for (const crawler of ["Googlebot", "OAI-SearchBot", "PerplexityBot"]) {
  if (game?.crawlerPolicy?.[crawler] !== "allow") failures.push(`${crawler} must be allowed by source-controlled crawler policy`);
}

if (!Array.isArray(manifest?.pages) || manifest.pages.length === 0) failures.push("structured data manifest requires at least one page");
for (const page of manifest?.pages || []) {
  const label = page.route || "unknown-route";
  if (new Set(page.baseTypes || []).size !== 2 || [...pageTypes].some((value) => !page.baseTypes.includes(value))) failures.push(`${label}: baseTypes must be Article and BreadcrumbList`);
  if (page.aboutEntityId !== game?.game?.entityId) failures.push(`${label}: aboutEntityId must use the shared VideoGame entity`);
  if (page.articleAuthorEntityId !== game?.organization?.entityId) failures.push(`${label}: articleAuthorEntityId must use the real site Organization`);
  if (!page.visibleDataSourceRef || page.visibleDataSourceRef !== page.jsonLdDataSourceRef) failures.push(`${label}: HTML and JSON-LD must use the same data source`);
  if (!Array.isArray(page.visibleContentRefs) || page.visibleContentRefs.length === 0) failures.push(`${label}: visibleContentRefs is required`);
  const seen = new Set();
  for (const item of page.conditionalTypes || []) {
    if (seen.has(item.schemaType)) failures.push(`${label}: duplicate conditional Schema ${item.schemaType}`);
    seen.add(item.schemaType);
    if (conditionalRules.get(item.schemaType) !== item.condition) failures.push(`${label}: ${item.schemaType} condition is invalid`);
    if (!Array.isArray(item.visibleContentRefs) || item.visibleContentRefs.length === 0) failures.push(`${label}: ${item.schemaType} lacks visible content`);
    if (["ItemList", "HowTo", "FAQPage"].includes(item.schemaType) && item.visibleContentRefs.length < 2) failures.push(`${label}: ${item.schemaType} needs at least two visible items`);
    if (item.schemaType === "VideoGameSeries" && (!Array.isArray(item.relatedGameEntityIds) || item.relatedGameEntityIds.length < 2)) failures.push(`${label}: VideoGameSeries needs at least two game entities`);
  }
}

const serialized = JSON.stringify({ game, manifest });
for (const token of forbiddenTokens) {
  if (serialized.includes(token)) failures.push(`forbidden Schema shortcut found: ${token}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`SEO+GEO RELEASE GATE FAIL: ${failure}`));
  process.exit(1);
}

console.log(`SEO+GEO release gate PASS: ${manifest.pages.length} page(s); shared entity=${game.game.entityId}; crawlers=3 allowed`);
