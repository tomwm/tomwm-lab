/**
 * build-policy-overlap.mjs
 *
 * Builds a policy overlap dataset by:
 * 1. Fetching publication counts per org per policy topic from the GOV.UK Search API
 * 2. Computing pairwise overlap scores (geometric mean) between orgs that share a topic
 * 3. Writing src/data/uk_gov_policy_overlap.json
 *
 * Usage: node scripts/build-policy-overlap.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const TAXON_PATHS = [
  { path: "/business-and-industry",          label: "Business and industry" },
  { path: "/crime-justice-and-law",          label: "Crime, justice and law" },
  { path: "/defence-and-armed-forces",       label: "Defence and armed forces" },
  { path: "/education",                      label: "Education" },
  { path: "/environment",                    label: "Environment" },
  { path: "/health-and-social-care",         label: "Health and social care" },
  { path: "/housing-local-and-community",    label: "Housing and communities" },
  { path: "/international-affairs",          label: "International affairs" },
  { path: "/money",                          label: "Money and tax" },
  { path: "/society-and-culture",            label: "Society and culture" },
  { path: "/transport",                      label: "Transport" },
  { path: "/welfare",                        label: "Welfare" },
  { path: "/work",                           label: "Work" },
  { path: "/entering-and-staying-in-the-uk", label: "Immigration" },
  { path: "/regional-and-local-government",  label: "Regional government" },
  { path: "/science-and-technology",         label: "Science and technology" },
  { path: "/going-and-being-abroad",         label: "Going abroad" },
  { path: "/life-circumstances",             label: "Life circumstances" },
  { path: "/government",                     label: "Government" },
];

const DOC_TYPES = [
  "policy_paper",
  "consultation",
  "research_and_analysis",
  "impact_assessment",
  "statutory_guidance",
  "official_statistics",
];

const MIN_PUBLICATIONS = 5;
const MIN_OVERLAP_SCORE = 10;

async function fetchTaxonContentId(path) {
  const url = `https://www.gov.uk/api/content${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch taxon ${path}: ${res.status}`);
  const data = await res.json();
  return data.content_id;
}

async function fetchOrgPublicationCounts(contentId) {
  const counts = {};
  for (const docType of DOC_TYPES) {
    const url = `https://www.gov.uk/api/search.json?count=0&filter_content_store_document_type[]=${docType}&filter_part_of_taxonomy_tree=${contentId}&aggregate_organisations=500`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  Warning: failed for doc_type=${docType}: ${res.status}`);
      continue;
    }
    const data = await res.json();
    const orgs = data.aggregates?.organisations?.options || [];
    for (const org of orgs) {
      const slug = org.value?.slug;
      if (slug) {
        counts[slug] = (counts[slug] || 0) + (org.documents || 0);
      }
    }
  }
  return counts;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Building policy overlap dataset...\n");

  // Load org slugs from existing data to filter
  const orgsJson = JSON.parse(
    readFileSync(join(ROOT, "src/data/uk_gov_organisations_and_services.json"), "utf8")
  );
  const knownSlugs = new Set(orgsJson.organisations.map((o) => o.slug));
  console.log(`Loaded ${knownSlugs.size} known org slugs\n`);

  const taxons = [];
  // orgTopics: slug -> { topicLabel: count }
  const orgTopics = {};

  for (const taxon of TAXON_PATHS) {
    process.stdout.write(`Fetching: ${taxon.label}...`);

    let contentId;
    try {
      contentId = await fetchTaxonContentId(taxon.path);
    } catch (err) {
      console.log(` SKIP (${err.message})`);
      continue;
    }

    taxons.push({ label: taxon.label, content_id: contentId });

    let counts;
    try {
      counts = await fetchOrgPublicationCounts(contentId);
    } catch (err) {
      console.log(` SKIP (${err.message})`);
      await sleep(500);
      continue;
    }

    let added = 0;
    for (const [slug, count] of Object.entries(counts)) {
      if (!knownSlugs.has(slug)) continue;
      if (count < MIN_PUBLICATIONS) continue;
      if (!orgTopics[slug]) orgTopics[slug] = {};
      orgTopics[slug][taxon.label] = (orgTopics[slug][taxon.label] || 0) + count;
      added++;
    }
    console.log(` ${added} orgs (content_id: ${contentId})`);
    await sleep(200); // be polite to the API
  }

  console.log(`\nComputing pairwise overlaps...`);

  // Build topic index: topic -> [{ slug, count }] sorted by count desc
  const topicIndex = {};
  for (const [slug, topics] of Object.entries(orgTopics)) {
    for (const [topic, count] of Object.entries(topics)) {
      if (!topicIndex[topic]) topicIndex[topic] = [];
      topicIndex[topic].push({ slug, count });
    }
  }
  for (const topic of Object.keys(topicIndex)) {
    topicIndex[topic].sort((a, b) => b.count - a.count);
  }

  // Compute pairwise overlap edges
  const pairMap = {};

  for (const [topic, orgs] of Object.entries(topicIndex)) {
    for (let i = 0; i < orgs.length; i++) {
      for (let j = i + 1; j < orgs.length; j++) {
        const a = orgs[i];
        const b = orgs[j];
        const score = Math.round(Math.sqrt(a.count * b.count));
        const key = [a.slug, b.slug].sort().join("||");
        if (!pairMap[key]) {
          pairMap[key] = { source: a.slug, target: b.slug, topics: [] };
        }
        pairMap[key].topics.push({
          topic,
          count_a: a.slug < b.slug ? a.count : b.count,
          count_b: a.slug < b.slug ? b.count : a.count,
          score,
        });
      }
    }
  }

  const overlapEdges = Object.values(pairMap)
    .map((edge) => {
      // Sort topics by score desc
      edge.topics.sort((a, b) => b.score - a.score);
      const total_score = edge.topics.reduce((sum, t) => sum + t.score, 0);
      return { ...edge, total_score, topic_count: edge.topics.length };
    })
    .filter((edge) => edge.total_score >= MIN_OVERLAP_SCORE)
    .sort((a, b) => b.total_score - a.total_score);

  const orgsWithActivity = Object.keys(orgTopics).length;

  console.log(`  Orgs with policy activity: ${orgsWithActivity}`);
  console.log(`  Overlap edges: ${overlapEdges.length}`);
  console.log(`  Topics: ${taxons.length}`);

  const output = {
    generated: new Date().toISOString().split("T")[0],
    doc_types: DOC_TYPES,
    min_publications_threshold: MIN_PUBLICATIONS,
    min_overlap_score: MIN_OVERLAP_SCORE,
    taxons,
    summary: {
      orgs_with_policy_activity: orgsWithActivity,
      overlap_edges: overlapEdges.length,
      topics: taxons.length,
    },
    org_topics: orgTopics,
    overlap_edges: overlapEdges,
    topic_index: topicIndex,
  };

  const outPath = join(ROOT, "src/data/uk_gov_policy_overlap.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
