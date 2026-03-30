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

// Clean up tooltips when switching views
function cleanupTooltips() {
  document.querySelectorAll('.tooltip').forEach(el => el.remove());
}

async function switchView(name) {
  cleanupTooltips();
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === name));
  container.innerHTML = '';
  await views[name]?.(container);
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// Start with Pulse
switchView('pulse');
