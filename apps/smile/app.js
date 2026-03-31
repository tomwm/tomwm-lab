/**
 * app.js
 * Face/hand detection → WebSocket → HarmonyEngine
 */

import { HarmonyEngine } from './harmony-engine.js';
import { HandEngine }    from './hand-engine.js';

// ── DOM ───────────────────────────────────────────────────────────────────────
const video        = document.getElementById('video');
const overlay      = document.getElementById('overlay');
const startBtn     = document.getElementById('start-btn');
const logEl        = document.getElementById('log');
const moodLabel    = document.getElementById('mood-label');
const moodText     = document.getElementById('mood-text');
const modeTag      = document.getElementById('mode-tag');
const faceToggle   = document.getElementById('toggle-face');
const handToggle   = document.getElementById('toggle-hand');
const faceMeters   = document.getElementById('face-meters');
const handMeter    = document.getElementById('hand-meter');
const volumeSlider = document.getElementById('volume-slider');
const volumeValue  = document.getElementById('volume-value');
const openBar      = document.getElementById('bar-openness');
const usersEl      = document.getElementById('users-connected');

const bars = {
  happy:   document.getElementById('bar-happy'),
  sad:     document.getElementById('bar-sad'),
  angry:   document.getElementById('bar-angry'),
  neutral: document.getElementById('bar-neutral'),
};

// ── State ─────────────────────────────────────────────────────────────────────
let mode       = 'face';
let running    = false;
let mySlot     = null;
let smoothScore = 0;

const harmony   = new HarmonyEngine();
let handEngine  = null; // lazy

// ── WebSocket ─────────────────────────────────────────────────────────────────
let ws         = null;
let sendTimer  = null;

// PartyKit URL — update PARTYKIT_HOST after running `npx partykit deploy`
const PARTYKIT_HOST = window.location.hostname === 'localhost'
  ? 'localhost:1999'
  : 'smile.tomwm.partykit.dev';

const PARTYKIT_ROOM = 'global';

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${PARTYKIT_HOST}/parties/main/${PARTYKIT_ROOM}`;
}

function connectWS() {
  ws = new WebSocket(wsUrl());

  ws.onopen = () => log('Connected — waiting for others…');

  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.type === 'welcome') {
      mySlot = msg.slot;
      harmony.mySlot = mySlot;
      log(`You are voice ${['Root ♩', 'Third ♩', 'Fifth ♩', 'Seventh ♩'][mySlot] ?? mySlot}`);
    }
    if (msg.type === 'state') {
      harmony.updateUsers(msg.users);
      updateUsersUI(msg.total, msg.users);
    }
  };

  ws.onclose = () => {
    log('Disconnected from server.');
    usersEl.textContent = '';
    // Try to reconnect after 3s if still running
    if (running) setTimeout(connectWS, 3000);
  };

  ws.onerror = () => ws.close();
}

function sendScore(score) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'score', score, mode }));
  }
}

// ── Volume ────────────────────────────────────────────────────────────────────
volumeSlider.addEventListener('input', () => {
  const v = parseFloat(volumeSlider.value);
  volumeValue.textContent = Math.round(v * 100) + '%';
  harmony.setVolume(v);
});

// ── Mode toggle ───────────────────────────────────────────────────────────────
faceToggle.addEventListener('click', () => switchMode('face'));
handToggle.addEventListener('click', () => switchMode('hand'));

function switchMode(m) {
  if (m === mode) return;
  mode = m;
  faceToggle.classList.toggle('active', m === 'face');
  handToggle.classList.toggle('active', m === 'hand');
  faceMeters.style.display = m === 'face' ? 'block' : 'none';
  handMeter.style.display  = m === 'hand' ? 'block' : 'none';

  if (running) {
    handEngine?.stop();
    if (m === 'hand') startHandDetection();
  }
}

// ── Camera ────────────────────────────────────────────────────────────────────
async function startCamera() {
  if (video.srcObject) return;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(r => (video.onloadedmetadata = r));
}

function stopCamera() {
  video.srcObject?.getTracks().forEach(t => t.stop());
  video.srcObject = null;
}

// ── Face detection ────────────────────────────────────────────────────────────
const MODEL_URL = 'weights';

async function loadFaceModels() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
}

function expressionsToScore(expr) {
  // Returns -1 (very sad/angry) … +1 (very happy)
  const pos = expr.happy;
  const neg = expr.sad * 0.8 + expr.angry * 0.6 + expr.disgusted * 0.4 + expr.fearful * 0.3;
  return Math.max(-1, Math.min(1, pos - neg));
}

async function faceLoop() {
  if (!running || mode !== 'face') return;

  const result = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (result) {
    drawFaceBox(result);
    const raw = expressionsToScore(result.expressions);
    smoothScore = smoothScore * 0.75 + raw * 0.25;
    sendScore(smoothScore);
    updateFaceUI(result.expressions, smoothScore);
  }

  requestAnimationFrame(faceLoop);
}

function drawFaceBox(result) {
  const dims = faceapi.matchDimensions(overlay, video, true);
  const ctx  = overlay.getContext('2d');
  const box  = faceapi.resizeResults(result, dims).detection.box;
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  const hue = Math.round(((smoothScore + 1) / 2) * 140);
  ctx.strokeStyle = `hsl(${hue}, 80%, 55%)`;
  ctx.lineWidth   = 2;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
}

// ── Hand detection ────────────────────────────────────────────────────────────
async function startHandDetection() {
  if (!handEngine) {
    log('Loading hand model…');
    handEngine = new HandEngine();
    await handEngine.init(video);
  }
  handEngine.start(onOpenness);
}

function onOpenness(openness) {
  if (!running || mode !== 'hand') return;
  const val = openness === null ? 0 : openness;
  smoothScore = smoothScore * 0.7 + val * 0.3;
  // Send as 0–1 for hand mode
  sendScore(smoothScore);
  updateHandUI(smoothScore);
  drawHandLandmarks(handEngine?.landmarks);
}

function drawHandLandmarks(landmarks) {
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  if (!landmarks) return;
  const w = overlay.width, h = overlay.height;
  ctx.fillStyle = `hsl(${Math.round(smoothScore * 140)}, 80%, 55%)`;
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── UI ────────────────────────────────────────────────────────────────────────
const SCALE_NAMES = ['Minor', 'Dorian', 'Major'];

function updateFaceUI(expr, score) {
  moodLabel.textContent = score > 0.5 ? '😄' : score > 0.2 ? '🙂' : score > -0.2 ? '😐' : score > -0.5 ? '😕' : '😟';
  moodText.textContent  = `score ${score >= 0 ? '+' : ''}${score.toFixed(2)}`;
  modeTag.textContent   = score < -0.25 ? 'Minor' : score > 0.25 ? 'Major' : 'Dorian';
  bars.happy.style.width   = `${(expr.happy   * 100).toFixed(1)}%`;
  bars.sad.style.width     = `${(expr.sad     * 100).toFixed(1)}%`;
  bars.angry.style.width   = `${(expr.angry   * 100).toFixed(1)}%`;
  bars.neutral.style.width = `${(expr.neutral * 100).toFixed(1)}%`;
}

function updateHandUI(open) {
  moodLabel.textContent = open > 0.7 ? '🐶' : open > 0.3 ? '🐕' : '🤐';
  moodText.textContent  = `openness ${(open * 100).toFixed(0)}%`;
  modeTag.textContent   = open > 0.5 ? 'Ahhh' : 'Mmm';
  openBar.style.width   = `${(open * 100).toFixed(1)}%`;
}

function updateUsersUI(total, users) {
  const slotName = ['Root', 'Third', 'Fifth', 'Seventh'];
  usersEl.textContent = total === 1
    ? '1 person connected'
    : `${total} people · ${users.map(u => slotName[u.slot]).join(' + ')}`;
}

function log(msg) { logEl.textContent = msg; }

// ── Start / stop ──────────────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  if (running) {
    running = false;
    clearInterval(sendTimer);
    handEngine?.stop();
    harmony.stop();
    stopCamera();
    ws?.close(); ws = null;
    overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
    startBtn.textContent  = 'Start';
    moodLabel.textContent = '😐';
    moodText.textContent  = 'Stopped';
    modeTag.textContent   = '–';
    usersEl.textContent   = '';
    log('Stopped.');
    return;
  }

  try {
    startBtn.disabled = true;
    log('Starting…');
    await startCamera();

    harmony.setVolume(parseFloat(volumeSlider.value));
    harmony.start();

    connectWS();

    if (mode === 'hand') await startHandDetection();
    else faceLoop();

    running = true;
    startBtn.textContent = 'Stop';
    startBtn.disabled    = false;
  } catch (e) {
    startBtn.disabled = false;
    log('Error: ' + e.message);
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
startBtn.disabled = true;
log('Loading face models…');
loadFaceModels()
  .then(() => { startBtn.disabled = false; log('Ready — choose a mode and click Start.'); })
  .catch(e  => log('Model error: ' + e.message));
