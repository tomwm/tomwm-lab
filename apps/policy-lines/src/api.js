const BASE = 'https://www.gov.uk/api/search.json';

// Slugs for departments that have been abolished, merged, or renamed.
// Names with a year range "(YYYY to YYYY)" are also detected automatically.
const DEFUNCT_SLUGS = new Set([
  'department-for-exiting-the-european-union',
  'department-for-international-development',
  'department-of-energy-climate-change',
  'department-for-business-energy-industrial-strategy',
  'department-for-business-innovation-skills',
  'department-for-digital-culture-media-sport',
  'department-for-constitutional-affairs',
  'department-for-children-schools-and-families',
  'department-for-education-and-skills',
  'department-of-trade-and-industry',
  'department-for-business-enterprise-regulatory-reform',
  'foreign-commonwealth-office',
  'lord-chancellors-department',
  'office-of-fair-trading',
  'uk-trade-investment',
  'scottish-office',
  'department-of-social-security',
  'department-for-innovation-universities-and-skills',
  'department-of-the-environment',
  'department-of-finance-and-personnel-for-northern-ireland',
]);

export function isDefunct(org) {
  if (/\(\d{4} to \d{4}\)/i.test(org.label)) return true;
  return DEFUNCT_SLUGS.has(org.value);
}
const DOC_TYPES = [
  'policy_paper',
  'consultation',
  'open_consultation',
  'closed_consultation',
  'consultation_outcome',
];

function buildUrl(params) {
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      v.forEach(val => url.searchParams.append(k, val));
    } else {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

// Fetch with retry
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Get top organisations with their publication counts, normalised to { value, label, count }
export async function fetchOrganisations() {
  const url = new URL(BASE);
  url.searchParams.set('count', '0');
  DOC_TYPES.forEach(t => url.searchParams.append('filter_content_store_document_type[]', t));
  url.searchParams.set('facet_organisations', '500');
  const data = await fetchJson(url.toString());
  const raw = data.facets?.organisations?.options || [];
  // Normalise: keep only main dept types, return { value: slug, label: title, count }
  const DEPT_TYPES = new Set(['ministerial_department', 'non_ministerial_department', 'devolved_administration']);
  return raw
    .filter(o => o.value?.slug && o.value?.title && (!o.value.organisation_type || DEPT_TYPES.has(o.value.organisation_type)))
    .map(o => ({ value: o.value.slug, label: o.value.title, count: o.documents }))
    .sort((a, b) => b.count - a.count);
}

// ── Module-level cache so views share the same fetched docs ──────────────────
let _pulseDocsCache = null;
let _pulseFetchInProgress = null; // ongoing Promise

export function getPulseCache() { return _pulseDocsCache; }

// Build a single-page pulse URL
function buildPulseUrl(start, perPage) {
  const url = new URL(BASE);
  DOC_TYPES.forEach(t => url.searchParams.append('filter_content_store_document_type[]', t));
  ['public_timestamp', 'organisations', 'content_store_document_type'].forEach(f => url.searchParams.append('fields[]', f));
  url.searchParams.set('count', perPage);
  url.searchParams.set('start', start);
  url.searchParams.set('order', '-public_timestamp');
  return url.toString();
}

// Fetch all pulse docs in parallel rounds of PARALLEL requests.
// onRound(allDocsSoFar, total) is called after each round so the caller
// can render progressively. Returns the complete doc array when done.
// Results are cached so subsequent calls (e.g. from The Signal) are instant.
export async function fetchPulseData(onRound) {
  // If cache is warm, fire onRound once with full data and return immediately
  if (_pulseDocsCache) {
    if (onRound) onRound([..._pulseDocsCache], _pulseDocsCache.length);
    return _pulseDocsCache;
  }

  // If a fetch is already in progress, piggyback on it
  if (_pulseFetchInProgress) {
    const docs = await _pulseFetchInProgress;
    if (onRound) onRound([...docs], docs.length);
    return docs;
  }

  const perPage = 1000;
  const PARALLEL = 4;

  const doFetch = async () => {
    // Round 0: fetch first page to get total, then fill out the first PARALLEL batch
    const first = await fetchJson(buildPulseUrl(0, perPage));
    const total = first.total;
    let allDocs = first.results || [];

    // Fetch the rest of the first parallel round (starts 1000..3000)
    const firstRoundStarts = [];
    for (let s = perPage; s < Math.min(PARALLEL * perPage, total); s += perPage) {
      firstRoundStarts.push(s);
    }
    const firstRoundResults = await Promise.all(
      firstRoundStarts.map(s => fetchJson(buildPulseUrl(s, perPage)).then(d => d.results || []))
    );
    firstRoundResults.forEach(r => { allDocs = allDocs.concat(r); });
    if (onRound) onRound([...allDocs], total);

    // Subsequent rounds
    let nextStart = PARALLEL * perPage;
    while (allDocs.length < total) {
      const starts = [];
      for (let i = 0; i < PARALLEL && nextStart + i * perPage < total; i++) {
        starts.push(nextStart + i * perPage);
      }
      const batches = await Promise.all(
        starts.map(s => fetchJson(buildPulseUrl(s, perPage)).then(d => d.results || []))
      );
      batches.forEach(b => { allDocs = allDocs.concat(b); });
      if (onRound) onRound([...allDocs], total);
      nextStart += PARALLEL * perPage;
      if (batches.every(b => b.length < perPage)) break;
    }

    _pulseDocsCache = allDocs;
    _pulseFetchInProgress = null;
    return allDocs;
  };

  _pulseFetchInProgress = doFetch();
  return _pulseFetchInProgress;
}

// Search for a keyword — fetch all matching docs, group by month client-side
export async function fetchKeywordOverTime(keyword) {
  const perPage = 1000;
  const maxDocs = 3000;
  let start = 0;
  let all = [];

  while (all.length < maxDocs) {
    const url = new URL(BASE);
    DOC_TYPES.forEach(t => url.searchParams.append('filter_content_store_document_type[]', t));
    url.searchParams.set('q', keyword);
    url.searchParams.set('count', perPage);
    url.searchParams.set('start', start);
    ['public_timestamp'].forEach(f => url.searchParams.append('fields[]', f));

    const data = await fetchJson(url.toString());
    const results = (data.results || []).filter(r => r.public_timestamp);
    all = all.concat(results);
    if (results.length < perPage || all.length >= Math.min(data.total, maxDocs)) break;
    start += perPage;
  }

  // Group by month
  const counts = new Map();
  for (const doc of all) {
    const d = new Date(doc.public_timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Build full month range from min to now
  if (counts.size === 0) return [];
  const keys = [...counts.keys()].sort();
  const start2 = new Date(keys[0] + '-01');
  const end = new Date();
  const months = [];
  let cur = new Date(start2);
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
    months.push({ date: new Date(cur), count: counts.get(key) || 0 });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return months;
}

// Fetch monthly publication counts for a single department, optionally filtered by keyword
export async function fetchDeptMonthly(orgSlug, years, keyword = '') {
  const now = new Date();
  const from = new Date(now);
  from.setFullYear(from.getFullYear() - years);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const perPage = 1000;
  const cap = 5000;
  let start = 0;
  let all = [];

  while (all.length < cap) {
    const url = new URL(BASE);
    DOC_TYPES.forEach(t => url.searchParams.append('filter_content_store_document_type[]', t));
    url.searchParams.append('filter_organisations[]', orgSlug);
    url.searchParams.append('fields[]', 'public_timestamp');
    url.searchParams.set('count', perPage);
    url.searchParams.set('start', start);
    url.searchParams.set('order', '-public_timestamp');
    if (keyword.trim()) url.searchParams.set('q', keyword.trim());

    const data = await fetchJson(url.toString());
    const results = (data.results || []).filter(r => r.public_timestamp);
    all = all.concat(results);
    if (results.length < perPage || all.length >= Math.min(data.total, cap)) break;
    start += perPage;
  }

  // Client-side date safety filter
  const filtered = all.filter(d => new Date(d.public_timestamp) >= from);

  // Group by YYYY-MM
  const byMonth = new Map();
  filtered.forEach(d => {
    const dt = new Date(d.public_timestamp);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, (byMonth.get(key) || 0) + 1);
  });

  // Build array covering every month in the window, with angular position
  const totalMonths = years * 12;
  const months = [];
  const cur = new Date(from);
  cur.setDate(1);
  let idx = 0;

  while (cur <= now && idx < totalMonths) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      count: byMonth.get(key) || 0,
      date: new Date(cur),
      idx,
      fraction: idx / totalMonths, // 0 → 1, maps to 0 → 2π
    });
    cur.setMonth(cur.getMonth() + 1);
    idx++;
  }

  return { months, total: filtered.length, totalMonths };
}

// Fetch consultations with outcome info for funnel/graveyard
export async function fetchConsultations() {
  const perPage = 1000;
  let start = 0;
  let all = [];
  let total = Infinity;

  const types = ['open_consultation', 'closed_consultation', 'consultation_outcome', 'consultation'];

  while (all.length < total) {
    const url = new URL(BASE);
    types.forEach(t => url.searchParams.append('filter_content_store_document_type[]', t));
    ['public_timestamp', 'organisations', 'content_store_document_type', 'title'].forEach(f => url.searchParams.append('fields[]', f));
    url.searchParams.set('count', perPage);
    url.searchParams.set('start', start);
    url.searchParams.set('order', '-public_timestamp');

    const data = await fetchJson(url.toString());
    total = data.total || 0;
    const results = data.results || [];
    all = all.concat(results);

    if (results.length < perPage) break;
    start += perPage;
  }

  return all;
}
