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

export async function renderPulse(container) {
  container.innerHTML = `
    <p class="view-title">The Pulse</p>
    <p class="view-desc">Monthly publication volume by department. Hover a line to focus it.</p>
    <div class="sidebar-layout">
      <div class="dept-sidebar" id="pulse-sidebar"></div>
      <div class="sidebar-content">
        <div class="search-row" id="pulse-controls" style="display:none;align-items:center;">
          <span class="pulse-years-label">Years: <span id="pulse-years-val">—</span></span>
          <input id="pulse-years" type="range" min="1" max="20" value="3" class="pulse-years-range" />
        </div>
        <div class="status" id="pulse-status">Loading…</div>
        <div class="chart-wrap" id="pulse-chart" style="display:none"></div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .pulse-years-range { accent-color: #64748b; cursor: pointer; width: 140px; }
    .pulse-years-label { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }
  `;
  container.appendChild(style);

  const statusEl    = document.getElementById('pulse-status');
  const chartEl     = document.getElementById('pulse-chart');
  const sidebarEl   = document.getElementById('pulse-sidebar');
  const controlsEl  = document.getElementById('pulse-controls');
  const yearsSlider = document.getElementById('pulse-years');
  const yearsValEl  = document.getElementById('pulse-years-val');

  // ── Load valid department names ───────────────────────────────────────────
  const deptList = await fetchOrganisations();
  const validDeptNames = new Set(deptList.map(d => d.label));
  // Map from display name → full org object (for defunct detection)
  const nameToOrg = new Map(deptList.map(d => [d.label, d]));

  // ── Shared state ──────────────────────────────────────────────────────────
  const monthCounts = new Map();
  const orgTotals   = new Map();
  let allSortedMonths = [];
  let topOrgs = [];
  let fullSeries = [];
  let activeOrgs = null;    // null until first data; Set of active org names
  let lineGroupsRef = null; // D3 selection, updated after each draw
  let rendered = false;

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

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

  function rebuildSeries() {
    const prev = new Set(topOrgs);
    topOrgs = [...orgTotals.entries()].sort((a, b) => b[1] - a[1]).map(([o]) => o);

    if (activeOrgs === null) {
      // First build: top 12 active, rest inactive
      activeOrgs = new Set(topOrgs.slice(0, 12));
    } else {
      // New orgs that just appeared: activate only if they'd be in top 12
      topOrgs.forEach((o, i) => {
        if (!prev.has(o) && i < 12) activeOrgs.add(o);
      });
    }

    const allKeys = new Set();
    for (const [, m] of monthCounts) for (const k of m.keys()) allKeys.add(k);
    allSortedMonths = [...allKeys].sort();

    fullSeries = topOrgs.map((org, i) => ({
      org,
      color: PALETTE[i % PALETTE.length],
      values: allSortedMonths.map(m => ({
        month: new Date(m + '-01'),
        key: m,
        count: monthCounts.get(org)?.get(m) || 0,
      })),
    }));
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  function buildSidebar() {
    const scrollTop = sidebarEl.scrollTop;
    sidebarEl.innerHTML = `
      <div class="sidebar-actions">
        <button class="sidebar-btn" id="pulse-sa-all">All</button>
        <button class="sidebar-btn" id="pulse-sa-none">None</button>
      </div>
    `;

    document.getElementById('pulse-sa-all').addEventListener('click', () => {
      topOrgs.forEach(o => activeOrgs.add(o));
      refreshSidebarDots();
      applyActiveState();
    });
    document.getElementById('pulse-sa-none').addEventListener('click', () => {
      activeOrgs.clear();
      refreshSidebarDots();
      applyActiveState();
    });

    const current = fullSeries.filter(s => !isDefunct(nameToOrg.get(s.org) || { value: s.org, label: s.org }));
    const defunct = fullSeries.filter(s =>  isDefunct(nameToOrg.get(s.org) || { value: s.org, label: s.org }));

    const appendItem = s => {
      const active = activeOrgs.has(s.org);
      const item = document.createElement('div');
      item.className = 'sidebar-dept';
      item.dataset.org = s.org;
      item.title = s.org;
      item.innerHTML = `
        <span class="sidebar-dot" style="background:${active ? s.color : '#ccc'}"></span>
        <span class="sidebar-dept-name" style="color:${active ? 'var(--text)' : '#999'}">${shortName(s.org)}</span>
      `;
      item.addEventListener('click', () => {
        if (activeOrgs.has(s.org)) activeOrgs.delete(s.org);
        else activeOrgs.add(s.org);
        refreshSidebarDots();
        applyActiveState();
      });
      sidebarEl.appendChild(item);
    };

    current.forEach(appendItem);

    if (defunct.length) {
      const sep = document.createElement('div');
      sep.className = 'sidebar-separator';
      sep.textContent = 'Historical';
      sidebarEl.appendChild(sep);
      defunct.forEach(appendItem);
    }

    sidebarEl.scrollTop = scrollTop;
  }

  function refreshSidebarDots() {
    fullSeries.forEach(s => {
      const item = sidebarEl.querySelector(`[data-org="${CSS.escape(s.org)}"]`);
      if (!item) return;
      const active = activeOrgs.has(s.org);
      item.querySelector('.sidebar-dot').style.background = active ? s.color : '#ccc';
      item.querySelector('.sidebar-dept-name').style.color = active ? 'var(--text)' : '#999';
    });
  }

  function applyActiveState() {
    if (!lineGroupsRef) return;
    lineGroupsRef.each(function(d) {
      d3.select(this).select('.pulse-line')
        .attr('opacity', activeOrgs.has(d.org) ? 0.7 : 0.05)
        .attr('stroke-width', activeOrgs.has(d.org) ? 1.5 : 1);
    });
  }

  // ── Redraw ────────────────────────────────────────────────────────────────
  function redraw() {
    if (!fullSeries.length) return;

    const years = +yearsSlider.value;
    yearsValEl.textContent = years;

    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;

    const filtered = fullSeries.map(s => ({
      ...s,
      values: s.values.filter(v => v.key >= cutoffKey),
    }));

    chartEl.innerHTML = '';
    lineGroupsRef = drawChart(chartEl, filtered, activeOrgs, tooltip);
    buildSidebar();
  }

  function updateSliderMax() {
    if (!allSortedMonths.length) return;
    const oldest = new Date(allSortedMonths[0] + '-01');
    const yearsBack = Math.ceil((new Date() - oldest) / (365.25 * 24 * 60 * 60 * 1000));
    yearsSlider.max = Math.min(20, yearsBack);
  }

  yearsSlider.addEventListener('input', redraw);

  // ── Stream data ───────────────────────────────────────────────────────────
  let prevLen = 0;

  await fetchPulseData((allDocsSoFar, total) => {
    const newDocs = allDocsSoFar.slice(prevLen);
    prevLen = allDocsSoFar.length;

    processDocs(newDocs);
    rebuildSeries();
    updateSliderMax();

    const loaded = allDocsSoFar.length;
    const pct = Math.round((loaded / total) * 100);

    if (!rendered) {
      statusEl.style.display = 'none';
      chartEl.style.display  = '';
      controlsEl.style.display = '';
      yearsValEl.textContent = yearsSlider.value;
      rendered = true;
      redraw();
    } else {
      redraw();
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

function drawChart(chartEl, series, activeOrgs, tooltip) {
  if (!series.length || !series[0].values.length) return null;

  const margin  = { top: 20, right: 20, bottom: 40, left: 40 };
  const width   = chartEl.clientWidth || 800;
  const height  = 420;
  const innerW  = width - margin.left - margin.right;
  const innerH  = height - margin.top - margin.bottom;

  const svg = d3.select(chartEl)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMid meet');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(series[0].values, d => d.month))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(series.flatMap(s => s.values.map(v => v.count))) * 1.1])
    .range([innerH, 0]);

  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickSize(0).tickPadding(10));

  g.append('g')
    .attr('class', 'axis axis--y')
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickPadding(8))
    .call(ax => ax.select('.domain').remove())
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#e8e6e1').attr('stroke-dasharray', '2,4'));

  const line = d3.line()
    .x(d => x(d.month))
    .y(d => y(d.count))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const lineGroups = g.selectAll('.line-group')
    .data(series)
    .join('g')
    .attr('class', 'line-group');

  lineGroups.append('path')
    .attr('class', 'pulse-line')
    .attr('d', d => line(d.values))
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 1.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('pointer-events', 'none')
    .attr('opacity', d => activeOrgs.has(d.org) ? 0.7 : 0.05);

  const bisect = d3.bisector(d => d.month).left;

  const hoverLine = g.append('line')
    .attr('stroke', '#ccc').attr('stroke-width', 1)
    .attr('y1', 0).attr('y2', innerH).style('display', 'none');

  // Overlay on top — captures all mouse events across the full chart area
  const overlay = g.append('rect')
    .attr('fill', 'none').attr('pointer-events', 'all')
    .attr('width', innerW).attr('height', innerH);

  overlay.on('mousemove', function(event) {
    const [mx, my] = d3.pointer(event);
    const date = x.invert(mx);
    hoverLine.attr('x1', mx).attr('x2', mx).style('display', null);

    const active = series.filter(s => activeOrgs.has(s.org));

    // Highlight the nearest line only if cursor is within 20px of it
    const SNAP = 20;
    let closestOrg = null;
    let closestDist = Infinity;
    active.forEach(s => {
      const i = Math.max(0, bisect(s.values, date, 1) - 1);
      const val = s.values[i];
      if (!val) return;
      const dist = Math.abs(my - y(val.count));
      if (dist < closestDist) { closestDist = dist; closestOrg = s.org; }
    });
    if (closestDist > SNAP) closestOrg = null;

    lineGroups.selectAll('.pulse-line')
      .attr('opacity', d => {
        if (!activeOrgs.has(d.org)) return 0.05;
        if (!closestOrg) return 0.7;          // no line nearby — all normal
        return closestOrg === d.org ? 1 : 0.12; // on a line — highlight it
      })
      .attr('stroke-width', d => closestOrg === d.org ? 2.5 : 1.5);

    // Tooltip — show top 5 active orgs with publications at this month
    const rows = active
      .map(s => {
        const i = Math.max(0, bisect(s.values, date, 1) - 1);
        return { org: s.org, color: s.color, count: s.values[i]?.count || 0 };
      })
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (!rows.length) { tooltip.classList.remove('visible'); return; }

    tooltip.innerHTML =
      `<strong>${date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</strong>` +
      rows.map(r =>
        `<span style="color:${r.color}">— </span>${r.org.replace(/Department (for|of) /, '')}: <b>${r.count}</b>`
      ).join('<br>');
    tooltip.classList.add('visible');

    // Flip to left if near right edge
    const ttW = tooltip.offsetWidth || 220;
    const flipLeft = event.clientX + 16 + ttW > window.innerWidth - 16;
    tooltip.style.left = flipLeft
      ? (event.clientX - 16 - ttW) + 'px'
      : (event.clientX + 16) + 'px';
    tooltip.style.top = (event.clientY - 28) + 'px';
  });

  overlay.on('mouseleave', () => {
    hoverLine.style('display', 'none');
    tooltip.classList.remove('visible');
    lineGroups.selectAll('.pulse-line')
      .attr('opacity', d => activeOrgs.has(d.org) ? 0.7 : 0.05)
      .attr('stroke-width', 1.5);
  });

  return lineGroups;
}
