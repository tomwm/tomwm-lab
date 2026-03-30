import * as d3 from 'd3';
import { fetchOrganisations, fetchDeptMonthly, isDefunct } from '../api.js';

// Same palette as The Pulse
const PALETTE = [
  '#2563eb','#dc2626','#16a34a','#9333ea','#ea580c',
  '#0891b2','#ca8a04','#be185d','#475569','#065f46',
  '#1d4ed8','#b91c1c','#15803d','#7e22ce','#c2410c',
];

function shortName(name) {
  return name
    .replace(/^(The |Her Majesty's |His Majesty's )/i, '')
    .replace('Department for ', 'Dept for ')
    .replace('Department of ', 'Dept of ')
    .replace(' and ', ' & ')
    .replace('Secretary of State for', 'SoS')
    .trim();
}

export async function renderMandala(container) {
  container.innerHTML = `
    <p class="view-title">The Mandala</p>
    <p class="view-desc">Each ring is a department, sized by total publications. Monthly spikes radiate outward. Filter by keyword to see how topics pulse across government.</p>
    <div class="sidebar-layout">
      <div class="dept-sidebar" id="m-sidebar"></div>
      <div class="sidebar-content">
        <div class="search-row" id="m-controls" style="margin-bottom:0.5rem;">
          <input class="term-input" id="m-keyword" type="text" placeholder="Add a keyword…" />
          <button class="add-btn" id="m-add-kw">Add</button>
          <span class="m-years-label">Years: <span id="m-years-val">1</span></span>
          <input id="m-years" type="range" min="1" max="20" value="1" class="m-years-range" />
        </div>
        <div id="m-chips" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem;min-height:0;"></div>
        <div class="chart-wrap" id="m-chart" style="position:relative;display:flex;justify-content:center;padding-top:2.5rem;">
          <div class="status" id="m-status" style="position:absolute;top:0.5rem;left:0;white-space:nowrap;z-index:1;padding:0;"></div>
          <svg id="m-svg" style="display:block;" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet"></svg>
        </div>
      </div>
    </div>
  `;

  // ── Scoped styles ─────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #m-controls { align-items: center; }
    #m-chart { padding-left: 24px; }
    .m-years-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      white-space: nowrap;
      margin-left: 0.5rem;
    }
    .m-years-range {
      width: 120px;
      accent-color: #64748b;
      cursor: pointer;
    }
  `;
  container.appendChild(style);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'fixed')
    .style('pointer-events', 'none')
    .style('background', 'rgba(2,6,23,0.96)')
    .style('border', '1px solid #1e293b')
    .style('color', '#cbd5e1')
    .style('padding', '0.45rem 0.65rem')
    .style('font-size', '0.72rem')
    .style('line-height', '1.5')
    .style('border-radius', '3px')
    .style('opacity', 0)
    .style('z-index', 9999);

  // ── Load organisations ────────────────────────────────────────────────────
  // All departments — no slice cap
  const orgs = await fetchOrganisations();

  // Track state — default 3 selected so chart isn't overwhelming on load
  const selectedDepts = new Set(orgs.slice(0, 3).map(o => o.value));
  const keywords = new Set();

  // ── Keyword chips ─────────────────────────────────────────────────────────
  const keywordInput = document.getElementById('m-keyword');
  const addKwBtn = document.getElementById('m-add-kw');
  const chipsEl = document.getElementById('m-chips');

  function addKeyword() {
    const kw = keywordInput.value.trim();
    if (!kw || keywords.has(kw)) { keywordInput.value = ''; return; }
    keywords.add(kw);
    keywordInput.value = '';

    const chip = document.createElement('span');
    chip.className = 'term-chip';
    chip.id = `kw-chip-${CSS.escape(kw)}`;
    chip.style.background = '#475569';
    chip.innerHTML = `${kw} <span class="remove">×</span>`;
    chip.querySelector('.remove').addEventListener('click', () => {
      keywords.delete(kw);
      chip.remove();
      draw();
    });
    chipsEl.appendChild(chip);
    draw();
  }

  addKwBtn.addEventListener('click', addKeyword);
  keywordInput.addEventListener('keydown', e => { if (e.key === 'Enter') addKeyword(); });

  // ── Years slider ──────────────────────────────────────────────────────────
  const yearsSlider = document.getElementById('m-years');
  const yearsVal = document.getElementById('m-years-val');
  yearsSlider.addEventListener('input', () => { yearsVal.textContent = yearsSlider.value; });
  yearsSlider.addEventListener('change', () => draw()); // re-render on release

  // ── Department sidebar ────────────────────────────────────────────────────
  const sidebarEl = document.getElementById('m-sidebar');

  function buildDeptSidebar() {
    sidebarEl.innerHTML = `
      <div class="sidebar-actions">
        <button class="sidebar-btn" id="m-sa-all">All</button>
        <button class="sidebar-btn" id="m-sa-none">None</button>
      </div>
    `;

    document.getElementById('m-sa-all').addEventListener('click', () => {
      orgs.forEach(o => selectedDepts.add(o.value));
      refreshSidebarDots();
      draw();
    });
    document.getElementById('m-sa-none').addEventListener('click', () => {
      selectedDepts.clear();
      refreshSidebarDots();
      draw();
    });

    const appendOrgItem = (org, i) => {
      const color = PALETTE[i % PALETTE.length];
      const active = selectedDepts.has(org.value);
      const item = document.createElement('div');
      item.className = 'sidebar-dept';
      item.dataset.slug = org.value;
      item.title = org.label;
      item.innerHTML = `
        <span class="sidebar-dot" style="background:${active ? color : '#ccc'}"></span>
        <span class="sidebar-dept-name" style="color:${active ? 'var(--text)' : '#999'}">${shortName(org.label)}</span>
      `;
      item.addEventListener('click', () => {
        if (selectedDepts.has(org.value)) selectedDepts.delete(org.value);
        else selectedDepts.add(org.value);
        refreshSidebarDots();
        draw();
      });
      sidebarEl.appendChild(item);
    };

    const currentOrgs = orgs.filter(o => !isDefunct(o));
    const defunctOrgs = orgs.filter(o =>  isDefunct(o));

    currentOrgs.forEach(org => appendOrgItem(org, orgs.indexOf(org)));

    if (defunctOrgs.length) {
      const sep = document.createElement('div');
      sep.className = 'sidebar-separator';
      sep.textContent = 'Historical';
      sidebarEl.appendChild(sep);
      defunctOrgs.forEach(org => appendOrgItem(org, orgs.indexOf(org)));
    }
  }

  function refreshSidebarDots() {
    orgs.forEach((org, i) => {
      const item = sidebarEl.querySelector(`[data-slug="${CSS.escape(org.value)}"]`);
      if (!item) return;
      const color = PALETTE[i % PALETTE.length];
      const active = selectedDepts.has(org.value);
      item.querySelector('.sidebar-dot').style.background = active ? color : '#ccc';
      item.querySelector('.sidebar-dept-name').style.color = active ? 'var(--text)' : '#999';
    });
  }

  buildDeptSidebar();

  // ── Create / draw ─────────────────────────────────────────────────────────
  async function draw() {
    const years = +yearsSlider.value;
    const kwQuery = [...keywords].join(' ').trim();
    const selected = [...selectedDepts];

    if (!selected.length) return;

    const statusEl = document.getElementById('m-status');
    statusEl.textContent = `Fetching ${selected.length} department${selected.length > 1 ? 's' : ''}…`;
    statusEl.style.display = 'block';

    let loaded = 0;
    const deptData = await Promise.all(
      selected.map(async slug => {
        const idx = orgs.findIndex(o => o.value === slug);
        const meta = orgs[idx];
        const color = PALETTE[idx % PALETTE.length];
        const data = await fetchDeptMonthly(slug, years, kwQuery);
        statusEl.textContent = `Fetching… ${++loaded}/${selected.length}`;
        return { slug, name: meta ? shortName(meta.label) : slug, color, ...data };
      })
    );

    statusEl.style.display = 'none';
    paint(deptData, years);
  }

  draw();

  // ── Paint ─────────────────────────────────────────────────────────────────
  function paint(depts, years) {
    const svgEl = document.getElementById('m-svg');
    // Size the square to fit within both available height and width
    const HEADER_OVERHEAD = 450; // header + title + desc + controls + footer + breathing room
    const availH = window.innerHeight - HEADER_OVERHEAD;
    const availW = svgEl.parentElement?.clientWidth || 600;
    const displaySize = Math.max(200, Math.min(availH, availW));
    svgEl.style.width  = displaySize + 'px';
    svgEl.style.height = displaySize + 'px';
    const SIZE = 600; // internal coordinate space stays fixed
    const CX = SIZE / 2;
    const CY = SIZE / 2;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${SIZE} ${SIZE}`);

    // Smallest innermost
    depts.sort((a, b) => a.total - b.total);

    const n = depts.length;
    const MIN_R = 80;
    const MAX_R = SIZE * 0.40;
    const ringGap = n > 1 ? (MAX_R - MIN_R) / (n - 1) : 0;
    const spikeRoom = n > 1 ? ringGap * 0.80 : SIZE * 0.20;

    const totalMonths = years * 12;
    const sliceAngle = (Math.PI * 2) / totalMonths;
    const GAP_FRAC = years === 1 ? 0.06 : years <= 3 ? 0.04 : 0.02;

    const g = svg.append('g');

    function segmentPath(innerR, outerR, startAngle, endAngle) {
      const gap = (endAngle - startAngle) * GAP_FRAC;
      const sa = startAngle + gap;
      const ea = endAngle - gap;
      const largeArc = (ea - sa) > Math.PI ? 1 : 0;
      const x1 = CX + innerR * Math.cos(sa), y1 = CY + innerR * Math.sin(sa);
      const x2 = CX + innerR * Math.cos(ea), y2 = CY + innerR * Math.sin(ea);
      const x3 = CX + outerR * Math.cos(ea), y3 = CY + outerR * Math.sin(ea);
      const x4 = CX + outerR * Math.cos(sa), y4 = CY + outerR * Math.sin(sa);
      return `M${x1},${y1} A${innerR},${innerR} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${outerR},${outerR} 0 ${largeArc} 0 ${x4},${y4} Z`;
    }

    depts.forEach((dept, di) => {
      const R = MIN_R + di * (n > 1 ? ringGap : 0);
      const maxCount = d3.max(dept.months, d => d.count) || 1;
      const dg = g.append('g');

      // Base ring
      dg.append('circle')
        .attr('cx', CX).attr('cy', CY).attr('r', R)
        .attr('fill', 'none')
        .attr('stroke', dept.color)
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.18);

      // Year boundary ticks
      for (let y = 0; y < years; y++) {
        const angle = (y / years) * Math.PI * 2 - Math.PI / 2;
        const tickLen = 7;
        dg.append('line')
          .attr('x1', CX + (R - tickLen) * Math.cos(angle))
          .attr('y1', CY + (R - tickLen) * Math.sin(angle))
          .attr('x2', CX + (R + tickLen) * Math.cos(angle))
          .attr('y2', CY + (R + tickLen) * Math.sin(angle))
          .attr('stroke', dept.color)
          .attr('stroke-width', 1)
          .attr('opacity', 0.35);
      }

      // Year labels on outermost ring
      if (di === n - 1) {
        const nowYear = new Date().getFullYear();
        for (let y = 0; y < years; y++) {
          const angle = (y / years) * Math.PI * 2 - Math.PI / 2;
          const labelR = R + spikeRoom + 16;
          g.append('text')
            .attr('x', CX + labelR * Math.cos(angle))
            .attr('y', CY + labelR * Math.sin(angle))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', 9)
            .attr('fill', '#475569')
            .attr('font-family', 'system-ui, sans-serif')
            .text(nowYear - years + y);
        }
      }

      // Month arc segments
      dept.months.forEach(m => {
        if (m.count === 0) return;
        const startAngle = m.fraction * Math.PI * 2 - Math.PI / 2;
        const endAngle = startAngle + sliceAngle;
        const spike = (m.count / maxCount) * spikeRoom;
        const opacity = 0.4 + (m.count / maxCount) * 0.55;

        dg.append('path')
          .attr('d', segmentPath(R, R + spike, startAngle, endAngle))
          .attr('fill', dept.color)
          .attr('stroke', 'none')
          .attr('opacity', opacity)
          .style('cursor', 'crosshair')
          .on('mouseover', (event) => {
            d3.select(event.currentTarget).attr('opacity', 1);
            const monthStr = m.date.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
            tooltip.style('opacity', 1).html(
              `<b style="color:${dept.color}">${dept.name}</b><br>${monthStr}<br>${m.count} publication${m.count !== 1 ? 's' : ''}`
            );
          })
          .on('mousemove', (event) => {
            tooltip.style('left', (event.clientX + 16) + 'px').style('top', (event.clientY - 32) + 'px');
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget).attr('opacity', opacity);
            tooltip.style('opacity', 0);
          });
      });
    });
  }
}
