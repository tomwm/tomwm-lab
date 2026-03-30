import * as d3 from 'd3';
import { fetchPulseData, fetchOrganisations, isDefunct } from '../api.js';

const PALETTE = [
  '#2563eb','#dc2626','#16a34a','#9333ea','#ea580c',
  '#0891b2','#ca8a04','#be185d','#475569','#065f46',
  '#7c3aed','#b45309','#0369a1','#166534','#991b1b',
];

function shortName(name) {
  return name
    .replace('Department for ', 'Dept for ')
    .replace('Department of ', 'Dept of ')
    .replace(' and ', ' & ')
    .replace('His Majesty\'s ', '')
    .replace('Her Majesty\'s ', '')
    .trim();
}

export async function renderSignal(container) {
  container.innerHTML = `
    <p class="view-title">The Signal</p>
    <p class="view-desc">Publication activity as a continuous slope. Rising with output, falling in silence.</p>
    <div class="sidebar-layout">
      <div class="dept-sidebar" id="signal-sidebar"></div>
      <div class="sidebar-content">
        <div class="search-row" id="signal-controls" style="display:none;align-items:center;gap:20px;flex-wrap:wrap;">
          <span class="pulse-years-label">Years: <span id="signal-years-val">—</span></span>
          <input id="signal-years" type="range" min="1" max="20" value="1" class="pulse-years-range" />
          <span class="pulse-years-label" style="margin-left:8px;">Slow</span>
          <input id="signal-speed" type="range" min="1" max="10" value="5" step="1" class="pulse-years-range" style="width:100px;" />
          <span class="pulse-years-label">Fast</span>
          <button id="signal-replay" class="signal-replay-btn">↺ Replay</button>
        </div>
        <div class="status" id="signal-status">Loading…</div>
        <div id="signal-chart" style="display:none;position:relative;"></div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .pulse-years-range { accent-color: #64748b; cursor: pointer; width: 140px; }
    .pulse-years-label { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }
    .signal-replay-btn {
      font-size: 0.72rem; font-family: inherit; letter-spacing: 0.08em; text-transform: uppercase;
      background: none; border: 1px solid #bbb; color: var(--text-muted); padding: 4px 12px;
      cursor: pointer; transition: border-color 0.2s, color 0.2s;
    }
    .signal-replay-btn:hover { border-color: #555; color: var(--text); }
  `;
  container.appendChild(style);

  const statusEl    = document.getElementById('signal-status');
  const chartEl     = document.getElementById('signal-chart');
  const sidebarEl   = document.getElementById('signal-sidebar');
  const controlsEl  = document.getElementById('signal-controls');
  const yearsSlider = document.getElementById('signal-years');
  const yearsValEl  = document.getElementById('signal-years-val');
  const speedSlider = document.getElementById('signal-speed');
  const replayBtn   = document.getElementById('signal-replay');

  // ── Load valid departments ────────────────────────────────────────────────
  const deptList = await fetchOrganisations();
  const validDeptNames = new Set(deptList.map(d => d.label));
  const nameToOrg = new Map(deptList.map(d => [d.label, d]));

  // ── Shared state ──────────────────────────────────────────────────────────
  const monthCounts = new Map();
  const orgTotals   = new Map();
  let topOrgs = [];
  let activeOrgs = null;
  let rendered = false;
  let prevLen = 0;

  // ── Process docs ──────────────────────────────────────────────────────────
  function processDocs(docs) {
    for (const doc of docs) {
      if (!doc.public_timestamp) continue;
      const date = new Date(doc.public_timestamp);
      const key  = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      for (const org of (doc.organisations || [])) {
        const name = org.title || org.label || org.slug;
        if (!validDeptNames.has(name)) continue;
        if (!monthCounts.has(name)) monthCounts.set(name, new Map());
        monthCounts.get(name).set(key, (monthCounts.get(name).get(key) || 0) + 1);
        orgTotals.set(name, (orgTotals.get(name) || 0) + 1);
      }
    }
  }

  function rebuildTopOrgs() {
    const prev = new Set(topOrgs);
    topOrgs = [...orgTotals.entries()].sort((a, b) => b[1] - a[1]).map(([o]) => o);
    if (activeOrgs === null) {
      activeOrgs = new Set(topOrgs.slice(0, 12));
    } else {
      topOrgs.forEach((o, i) => { if (!prev.has(o) && i < 12) activeOrgs.add(o); });
    }
  }

  function updateSliderMax() {
    const allKeys = [];
    for (const [, m] of monthCounts) for (const k of m.keys()) allKeys.push(k);
    if (!allKeys.length) return;
    const oldest = new Date(allKeys.sort()[0] + '-01');
    const yearsBack = Math.ceil((new Date() - oldest) / (365.25 * 24 * 60 * 60 * 1000));
    yearsSlider.max = Math.min(20, yearsBack);
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  function buildSidebar() {
    const scrollTop = sidebarEl.scrollTop;
    sidebarEl.innerHTML = `
      <div class="sidebar-actions">
        <button class="sidebar-btn" id="signal-sa-all">All</button>
        <button class="sidebar-btn" id="signal-sa-none">None</button>
      </div>
    `;

    document.getElementById('signal-sa-all').addEventListener('click', () => {
      topOrgs.forEach(o => activeOrgs.add(o));
      refreshSidebarDots();
      draw(false);
    });
    document.getElementById('signal-sa-none').addEventListener('click', () => {
      activeOrgs.clear();
      refreshSidebarDots();
      draw(false);
    });

    const appendItem = (org, i) => {
      const color = PALETTE[i % PALETTE.length];
      const active = activeOrgs.has(org);
      const item = document.createElement('div');
      item.className = 'sidebar-dept';
      item.dataset.org = org;
      item.title = org;
      item.innerHTML = `
        <span class="sidebar-dot" style="background:${active ? color : '#ccc'}"></span>
        <span class="sidebar-dept-name" style="color:${active ? 'var(--text)' : '#999'}">${shortName(org)}</span>
      `;
      item.addEventListener('click', () => {
        if (activeOrgs.has(org)) activeOrgs.delete(org);
        else activeOrgs.add(org);
        refreshSidebarDots();
        draw(false);
      });
      sidebarEl.appendChild(item);
    };

    const currentOrgs = topOrgs.filter(o => !isDefunct(nameToOrg.get(o) || { value: o, label: o }));
    const defunctOrgs = topOrgs.filter(o =>  isDefunct(nameToOrg.get(o) || { value: o, label: o }));

    currentOrgs.forEach((org) => appendItem(org, topOrgs.indexOf(org)));

    if (defunctOrgs.length) {
      const sep = document.createElement('div');
      sep.className = 'sidebar-separator';
      sep.textContent = 'Historical';
      sidebarEl.appendChild(sep);
      defunctOrgs.forEach((org) => appendItem(org, topOrgs.indexOf(org)));
    }

    sidebarEl.scrollTop = scrollTop;
  }

  function refreshSidebarDots() {
    topOrgs.forEach((org, i) => {
      const item = sidebarEl.querySelector(`[data-org="${CSS.escape(org)}"]`);
      if (!item) return;
      const color = PALETTE[i % PALETTE.length];
      const active = activeOrgs.has(org);
      item.querySelector('.sidebar-dot').style.background = active ? color : '#ccc';
      item.querySelector('.sidebar-dept-name').style.color = active ? 'var(--text)' : '#999';
    });
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function draw(animate = true) {
    if (!topOrgs.length) return;

    const years = +yearsSlider.value;
    yearsValEl.textContent = years;

    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;

    const allKeys = new Set();
    for (const [, m] of monthCounts) for (const k of m.keys()) allKeys.add(k);
    const months = [...allKeys].filter(k => k >= cutoffKey).sort();
    if (!months.length) return;

    const W = chartEl.clientWidth || 800;
    const H = Math.max(400, window.innerHeight - 480);
    const PAD_L = 12, PAD_R = 12, PAD_V = 40;
    const innerW = W - PAD_L - PAD_R;
    const midY   = H / 2;

    chartEl.innerHTML = '';

    const svg = d3.select(chartEl)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMinYMid meet');

    const visibleOrgs = topOrgs.filter(o => activeOrgs.has(o));

    // Build all raw series first, then scale by global max for natural dispersion
    const allSeries = visibleOrgs.map(org => {
      const counts = months.map(m => monthCounts.get(org)?.get(m) || 0);
      const mean   = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);
      const raw = [0];
      for (let j = 1; j < counts.length; j++) raw.push(raw[j - 1] + (counts[j] - mean));
      return { org, raw };
    });

    const globalMaxAbs = Math.max(...allSeries.flatMap(s => s.raw.map(Math.abs)), 1);
    const scale = ((H / 2 - PAD_V) / globalMaxAbs) * 1.6;

    allSeries.forEach(({ org }) => {
      const orgIdx = topOrgs.indexOf(org);
      const { raw } = allSeries.find(s => s.org === org);
      const pts    = raw.map((v, j) => ({
        x: PAD_L + (j / (months.length - 1 || 1)) * innerW,
        y: midY - v * scale,
      }));

      const lineGen = d3.line().x(d => d.x).y(d => d.y).curve(d3.curveCatmullRom.alpha(0.5));
      const path = svg.append('path')
        .datum(pts)
        .attr('fill', 'none')
        .attr('stroke', PALETTE[orgIdx % PALETTE.length])
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.75)
        .attr('d', lineGen);

      if (animate) {
        const len = path.node().getTotalLength();
        const speedMult = 0.1 + (+speedSlider.value - 1) * (1.9 / 9);
        const dur = Math.max(2000, months.length * 22) / speedMult;
        path
          .attr('stroke-dasharray', len)
          .attr('stroke-dashoffset', len)
          .transition().duration(dur).ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0);
      }

      path
        .on('mouseenter', () => {
          svg.selectAll('path').attr('opacity', 0.08);
          path.attr('opacity', 1).attr('stroke-width', 2.5);
        })
        .on('mouseleave', () => {
          svg.selectAll('path').attr('opacity', 0.75).attr('stroke-width', 1.5);
        });
    });
  }

  yearsSlider.addEventListener('input', () => draw(true));
  speedSlider.addEventListener('change', () => draw(true));
  replayBtn.addEventListener('click', () => draw(true));

  // ── Stream data ───────────────────────────────────────────────────────────
  await fetchPulseData((allDocsSoFar, total) => {
    const newDocs = allDocsSoFar.slice(prevLen);
    prevLen = allDocsSoFar.length;

    processDocs(newDocs);
    rebuildTopOrgs();
    updateSliderMax();

    const loaded = allDocsSoFar.length;
    const pct = Math.round((loaded / total) * 100);

    if (!rendered) {
      statusEl.style.display = 'none';
      chartEl.style.display  = '';
      controlsEl.style.display = '';
      rendered = true;
      buildSidebar();
      draw(true);
    } else {
      buildSidebar();
      draw(false);
      if (loaded < total) {
        statusEl.style.display = 'block';
        statusEl.className = 'status';
        statusEl.textContent = `Loading history… ${pct}%`;
      } else {
        statusEl.style.display = 'none';
      }
    }
  });
}
