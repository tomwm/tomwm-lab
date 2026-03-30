import './style.css';
import { renderPulse } from './views/pulse.js';
import { renderSignal } from './views/signal.js';
import { renderTerrain } from './views/terrain.js';
import { renderMandala } from './views/mandala.js';
import { renderGraveyard } from './views/graveyard.js';

const views = {
  pulse:     renderPulse,
  signal:    renderSignal,
  terrain:   renderTerrain,
  mandala:   renderMandala,
  graveyard: renderGraveyard,
};

const container = document.getElementById('view-container');
const navBtns = document.querySelectorAll('.nav-btn');
const BASE = '/policy-lines';

// Clean up tooltips when switching views
function cleanupTooltips() {
  document.querySelectorAll('.tooltip').forEach(el => el.remove());
}

async function switchView(name, pushState = true) {
  if (!views[name]) name = 'pulse';
  cleanupTooltips();
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === name));
  container.innerHTML = '';
  if (pushState) history.pushState({ view: name }, '', `${BASE}/${name}`);
  await views[name](container);
}

// Read view name from URL path, e.g. /policy-lines/mandala → 'mandala'
function viewFromPath() {
  const segment = location.pathname.replace(BASE, '').replace(/^\//, '');
  return segment || 'pulse';
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// Handle browser back/forward
window.addEventListener('popstate', e => {
  switchView(e.state?.view ?? viewFromPath(), false);
});

// Load view from URL on initial page load
switchView(viewFromPath(), false);
