import * as d3 from 'd3';
import { fetchConsultations, fetchOrganisations, isDefunct } from '../api.js';

const STATUS_COLOR = { open: '#16a34a', closed: '#ca8a04', concluded: '#2563eb' };

function shortOrg(name) {
  return name
    .replace('Department for ', '')
    .replace('Department of ', '')
    .replace('His Majesty\'s ', '')
    .replace('Her Majesty\'s ', '')
    .replace(' and ', ' & ')
    .trim()
    .slice(0, 28);
}

export async function renderGraveyard(container) {
  container.innerHTML = `
    <p class="view-title">The Graveyard</p>
    <p class="view-desc">One row per department. Each tick is a consultation, coloured by outcome. Read across a row to see a department's consultation history.</p>
    <div style="display:flex;gap:1.2rem;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;">
      ${[['concluded','Concluded'],['closed','Closed'],['open','Open']].map(([s,l]) =>
        `<span style="display:flex;align-items:center;gap:6px;font-size:0.72rem;color:#888;">
          <span style="display:inline-block;width:18px;height:2.5px;border-radius:2px;background:${STATUS_COLOR[s]};"></span>${l}
        </span>`).join('')}
      <span style="font-size:0.72rem;color:#bbb;margin-left:0.5rem;font-style:italic;">italic = historical dept</span>
    </div>
    <div class="status" id="gy-status">Loading all consultations…</div>
    <div id="gy-chart" style="display:none;padding-bottom:2rem;"></div>
  `;

  const statusEl = document.getElementById('gy-status');
  const chartEl  = document.getElementById('gy-chart');

  let docs, deptList;
  try {
    [docs, deptList] = await Promise.all([fetchConsultations(), fetchOrganisations()]);
  } catch (e) {
    statusEl.className = 'status error';
    statusEl.textContent = `Failed to load: ${e.message}`;
    return;
  }

  const validDeptNames = new Set(deptList.map(d => d.label));
  const nameToOrg      = new Map(deptList.map(d => [d.label, d]));

  statusEl.style.display = 'none';
  chartEl.style.display  = '';

  const items = docs
    .filter(d => d.public_timestamp)
    .map(d => {
      const type = d.content_store_document_type || '';
      let status;
      if (type === 'open_consultation') status = 'open';
      else if (type === 'consultation_outcome') status = 'concluded';
      else status = 'closed';
      return {
        title: d.title || 'Untitled',
        date:  new Date(d.public_timestamp),
        status,
        org:   d.organisations?.[0]?.title || 'Unknown',
      };
    });

  const orgMap = new Map();
  for (const item of items) {
    if (!validDeptNames.has(item.org)) continue;
    if (!orgMap.has(item.org)) orgMap.set(item.org, []);
    orgMap.get(item.org).push(item);
  }

  const active  = [...orgMap.entries()].filter(([o]) => !isDefunct(nameToOrg.get(o) || { value: o, label: o })).sort((a, b) => b[1].length - a[1].length);
  const defunct = [...orgMap.entries()].filter(([o]) =>  isDefunct(nameToOrg.get(o) || { value: o, label: o })).sort((a, b) => b[1].length - a[1].length);

  drawGraveyard(chartEl, [...active, ...defunct], active.length);
}

function drawGraveyard(chartEl, orgs, activeCount) {
  const rowH      = 28;
  const tickH     = 20;
  const labelW    = 190;
  const topMargin = 32;
  const botMargin = 80;
  const maxH      = window.innerHeight - 380;

  const allItems           = orgs.flatMap(([, items]) => items);
  const [minDate, maxDate] = d3.extent(allItems, d => d.date);
  const scrollAreaW        = Math.max(400, (chartEl.clientWidth || 900) - labelW);
  const pxPerMonth         = scrollAreaW / (5 * 12);
  const totalMonths        = d3.timeMonth.count(minDate, maxDate);
  const innerW             = Math.max(scrollAreaW, totalMonths * pxPerMonth);
  const totalH             = topMargin + orgs.length * rowH + botMargin;
  const x                  = d3.scaleTime().domain([minDate, maxDate]).range([0, innerW]);

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  // ── Flex wrapper ─────────────────────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:flex;align-items:flex-start;height:${maxH}px;`;
  chartEl.appendChild(wrapper);

  // ── Left: label column — overflow hidden, synced by JS ───────────────────
  const labelCol = document.createElement('div');
  labelCol.style.cssText = `flex-shrink:0;width:${labelW}px;overflow:hidden;height:${maxH}px;` +
    `mask-image:linear-gradient(to bottom, black calc(100% - 40px), transparent 100%);` +
    `-webkit-mask-image:linear-gradient(to bottom, black calc(100% - 40px), transparent 100%);`;
  wrapper.appendChild(labelCol);

  const labelSvg = d3.select(labelCol).append('svg')
    .attr('width', labelW).attr('height', totalH)
    .style('width', labelW + 'px').style('display', 'block');

  // ── Right: scrollable chart column ───────────────────────────────────────
  const scrollCol = document.createElement('div');
  scrollCol.style.cssText = `flex:1;overflow:auto;height:${maxH}px;`;
  wrapper.appendChild(scrollCol);

  const chartSvg = d3.select(scrollCol).append('svg')
    .attr('width', innerW).attr('height', totalH)
    .style('width', innerW + 'px').style('min-width', innerW + 'px').style('display', 'block');

  // Sync vertical scroll: mirror scrollTop into the hidden-overflow label column
  scrollCol.addEventListener('scroll', () => {
    labelCol.scrollTop = scrollCol.scrollTop;
  });

  // X axis — top
  chartSvg.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${topMargin - 8})`)
    .call(d3.axisTop(x).ticks(d3.timeYear.every(1)).tickSize(0).tickPadding(6));

  // ── Rows ─────────────────────────────────────────────────────────────────
  orgs.forEach(([org, items], ri) => {
    const defunct = ri >= activeCount;
    const rowY    = topMargin + ri * rowH;
    const midY    = rowY + rowH / 2;

    if (ri === activeCount) {
      const sepY = rowY - 5;
      labelSvg.append('line')
        .attr('x1', 0).attr('x2', labelW)
        .attr('y1', sepY).attr('y2', sepY)
        .attr('stroke', '#d8d5d0').attr('stroke-width', 1).attr('stroke-dasharray', '4,3');
      labelSvg.append('text')
        .attr('x', labelW - 12).attr('y', sepY - 5)
        .attr('text-anchor', 'end').attr('font-size', '0.58rem')
        .attr('fill', '#c0bdb8').attr('letter-spacing', '0.06em')
        .text('HISTORICAL ↓');
      chartSvg.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', sepY).attr('y2', sepY)
        .attr('stroke', '#d8d5d0').attr('stroke-width', 1).attr('stroke-dasharray', '4,3');
    }

    labelSvg.append('text')
      .attr('x', labelW - 12).attr('y', midY)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
      .attr('font-size', '0.7rem')
      .attr('fill', defunct ? '#bbb' : '#555')
      .attr('font-style', defunct ? 'italic' : 'normal')
      .text(shortOrg(org));

    chartSvg.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', midY).attr('y2', midY)
      .attr('stroke', defunct ? '#f0eeea' : '#e8e6e1').attr('stroke-width', 1);

    items.forEach(item => {
      const cx = x(item.date);
      chartSvg.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', midY - tickH / 2).attr('y2', midY + tickH / 2)
        .attr('stroke', STATUS_COLOR[item.status])
        .attr('stroke-width', defunct ? 2 : 2.5)
        .attr('stroke-linecap', 'round')
        .attr('opacity', defunct ? 0.3 : 0.6)
        .on('mouseenter', function(event) {
          d3.select(this).attr('opacity', 1).attr('stroke-width', 3.5);
          tooltip.innerHTML = `<strong>${item.title}</strong><br>${item.status} · ${item.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
          tooltip.classList.add('visible');
          tooltip.style.left = (event.clientX + 14) + 'px';
          tooltip.style.top  = (event.clientY - 28) + 'px';
        })
        .on('mousemove', event => {
          tooltip.style.left = (event.clientX + 14) + 'px';
          tooltip.style.top  = (event.clientY - 28) + 'px';
        })
        .on('mouseleave', function() {
          d3.select(this).attr('opacity', defunct ? 0.3 : 0.6).attr('stroke-width', defunct ? 2 : 2.5);
          tooltip.classList.remove('visible');
        });
    });
  });

  // Closing line
  const endY = topMargin + orgs.length * rowH;
  chartSvg.append('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', endY).attr('y2', endY)
    .attr('stroke', '#e8e6e1').attr('stroke-width', 1);

  // Scroll to most recent (right end)
  requestAnimationFrame(() => { scrollCol.scrollLeft = scrollCol.scrollWidth; });
}
