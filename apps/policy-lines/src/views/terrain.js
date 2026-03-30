import * as d3 from 'd3';
import { fetchKeywordOverTime } from '../api.js';

const PALETTE = [
  '#2563eb','#dc2626','#16a34a','#9333ea','#ea580c',
  '#0891b2','#ca8a04','#be185d','#475569','#065f46',
];

const PRESETS = ['housing', 'AI', 'Brexit', 'net zero', 'NHS', 'immigration'];

export function renderTerrain(container) {
  container.innerHTML = `
    <p class="view-title">The Terrain</p>
    <p class="view-desc">Track any keyword across government publications over time. Each line is a search term.</p>
    <div class="search-row" id="terrain-controls" style="margin-bottom:0.5rem;">
      <input class="term-input" id="term-input" type="text" placeholder="Add a keyword…" />
      <button class="add-btn" id="term-add">Add</button>
      <span id="terrain-presets" style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;"></span>
    </div>
    <div id="term-chips" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.5rem;min-height:0;"></div>
    <div class="status" id="terrain-status" style="display:none">Loading…</div>
    <div class="chart-wrap" id="terrain-chart"></div>
  `;

  const input = document.getElementById('term-input');
  const addBtn = document.getElementById('term-add');
  const chipsEl = document.getElementById('term-chips'); // row 2, below search bar
  const statusEl = document.getElementById('terrain-status');
  const chartEl = document.getElementById('terrain-chart');

  const terms = new Map(); // term -> { color, data }
  let colorIdx = 0;

  function getColor() {
    return PALETTE[colorIdx++ % PALETTE.length];
  }

  async function addTerm(term) {
    term = term.trim();
    if (!term || terms.has(term)) return;

    const color = getColor();
    terms.set(term, { color, data: null });
    renderChip(term, color);
    redrawChart();

    statusEl.style.display = '';
    statusEl.textContent = `Loading "${term}"…`;

    try {
      const data = await fetchKeywordOverTime(term);
      terms.get(term).data = data;
      statusEl.style.display = 'none';
      redrawChart();
    } catch (e) {
      statusEl.className = 'status error';
      statusEl.textContent = `Error loading "${term}": ${e.message}`;
    }
  }

  function removeTerm(term) {
    terms.delete(term);
    document.getElementById(`chip-${term}`)?.remove();
    redrawChart();
  }

  function renderChip(term, color) {
    const chip = document.createElement('span');
    chip.className = 'term-chip';
    chip.id = `chip-${term}`;
    chip.style.background = color;
    chip.innerHTML = `${term} <span class="remove">×</span>`;
    chip.querySelector('.remove').addEventListener('click', () => removeTerm(term));
    chipsEl.appendChild(chip);
  }

  function redrawChart() {
    chartEl.innerHTML = '';
    const ready = [...terms.values()].filter(t => t.data);
    if (ready.length === 0) return;

    const allSeries = [...terms.entries()]
      .filter(([, v]) => v.data)
      .map(([term, v]) => ({ term, color: v.color, values: v.data }));

    drawChart(chartEl, allSeries);
  }

  // Wire inputs
  addBtn.addEventListener('click', () => {
    addTerm(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { addTerm(input.value); input.value = ''; }
  });

  // Preset hints inline with search bar
  const presetsEl = document.getElementById('terrain-presets');
  const egLabel = document.createElement('span');
  egLabel.textContent = 'e.g.';
  egLabel.style.cssText = 'font-size:0.72rem;color:#bbb;white-space:nowrap;margin-left:0.25rem;';
  presetsEl.appendChild(egLabel);
  PRESETS.forEach(p => {
    const btn = document.createElement('button');
    btn.textContent = p;
    btn.style.cssText = 'background:none;border:1px solid #e8e6e1;border-radius:2rem;padding:0.2rem 0.6rem;font-size:0.72rem;color:#aaa;cursor:pointer;transition:border-color 0.15s,color 0.15s;';
    btn.addEventListener('mouseenter', () => { btn.style.color = '#555'; btn.style.borderColor = '#bbb'; });
    btn.addEventListener('mouseleave', () => { btn.style.color = '#aaa'; btn.style.borderColor = '#e8e6e1'; });
    btn.addEventListener('click', () => addTerm(p));
    presetsEl.appendChild(btn);
  });
}

function drawChart(chartEl, series) {
  const margin = { top: 20, right: 60, bottom: 40, left: 40 };
  const height = 380;
  const innerH = height - margin.top - margin.bottom;

  const allDates = series[0]?.values.map(d => d.date) || [];
  const [minDate, maxDate] = d3.extent(allDates);

  // Size the SVG so 10 years fills the visible container; older history scrolls left
  const containerW = chartEl.clientWidth || 900;
  const visibleInnerW = containerW - margin.left - margin.right;
  const pxPerMonth = visibleInnerW / (10 * 12);
  const totalMonths = d3.timeMonth.count(minDate, maxDate);
  const innerW = Math.max(visibleInnerW, totalMonths * pxPerMonth);
  const totalW = innerW + margin.left + margin.right;

  // Scrollable wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'overflow-x: auto; width: 100%;';
  chartEl.appendChild(wrapper);

  const svg = d3.select(wrapper)
    .append('svg')
    .attr('width', totalW)
    .attr('height', height)
    .style('width', totalW + 'px')   // override global svg { width: 100% }
    .style('min-width', totalW + 'px');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, innerW]);

  const yMax = d3.max(series.flatMap(s => s.values.map(v => v.count))) || 1;
  const y = d3.scaleLinear()
    .domain([0, yMax * 1.15])
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
    .x(d => x(d.date))
    .y(d => y(d.count))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const lineGroups = g.selectAll('.terrain-line-group')
    .data(series)
    .join('g')
    .attr('class', 'terrain-line-group');

  lineGroups.append('path')
    .attr('d', d => line(d.values))
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 2)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('opacity', 0.85);

  // End labels
  lineGroups.each(function(d) {
    const last = d.values[d.values.length - 1];
    if (!last) return;
    d3.select(this).append('text')
      .attr('x', x(last.date) + 6)
      .attr('y', y(last.count))
      .attr('dy', '0.35em')
      .attr('font-size', '0.68rem')
      .attr('fill', d.color)
      .text(d.term);
  });

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  const bisect = d3.bisector(d => d.date).left;

  const overlay = g.append('rect')
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .attr('width', innerW)
    .attr('height', innerH);

  const hoverLine = g.append('line')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1)
    .attr('y1', 0).attr('y2', innerH)
    .style('display', 'none');

  overlay.on('mousemove', function(event) {
    const [mx] = d3.pointer(event);
    const date = x.invert(mx);
    hoverLine.attr('x1', mx).attr('x2', mx).style('display', null);

    const rows = series.map(s => {
      const i = bisect(s.values, date, 1);
      const val = s.values[Math.max(0, i - 1)];
      return { term: s.term, color: s.color, count: val?.count || 0 };
    });

    tooltip.innerHTML = `<strong>${date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</strong>` +
      rows.map(r => `<span style="color:${r.color}">— </span>${r.term}: <b>${r.count}</b>`).join('<br>');
    tooltip.classList.add('visible');
    tooltip.style.left = (event.clientX + 14) + 'px';
    tooltip.style.top = (event.clientY - 28) + 'px';
  });

  overlay.on('mouseleave', () => {
    hoverLine.style('display', 'none');
    tooltip.classList.remove('visible');
  });

  // Defer scroll so the browser has laid out the SVG first
  requestAnimationFrame(() => { wrapper.scrollLeft = wrapper.scrollWidth; });
}
