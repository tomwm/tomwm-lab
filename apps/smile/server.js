/**
 * server.js — WebSocket relay for multi-user harmony.
 *
 * Each client is assigned a slot 0–3 (root, 3rd, 5th, 7th).
 * When > 4 users connect, extra users share a slot and their scores average.
 * On every score update from any client, the full state is broadcast to all.
 */

const { WebSocketServer } = require('ws');

const PORT = 8081;
const wss  = new WebSocketServer({ port: PORT });

// Map of clientId → { ws, slot, score, mode }
const clients = new Map();
let nextId = 0;

wss.on('connection', ws => {
  const id   = nextId++;
  const slot = assignSlot();

  clients.set(id, { ws, slot, score: 0, mode: 'face' });
  console.log(`[+] client ${id} → slot ${slot}  (${clients.size} connected)`);

  ws.send(JSON.stringify({ type: 'welcome', id, slot }));
  broadcast();

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'score') {
        const c = clients.get(id);
        if (c) { c.score = msg.score; c.mode = msg.mode; }
        broadcast();
      }
    } catch (_) {}
  });

  ws.on('close', () => {
    clients.delete(id);
    console.log(`[-] client ${id} left  (${clients.size} connected)`);
    broadcast();
  });

  ws.on('error', () => clients.delete(id));
});

/** Prefer an empty slot 0-3; otherwise cycle. */
function assignSlot() {
  const used = new Set([...clients.values()].map(c => c.slot));
  for (let s = 0; s < 4; s++) if (!used.has(s)) return s;
  return nextId % 4;
}

/** Send aggregated state (one entry per slot, scores averaged) to every client. */
function broadcast() {
  // Aggregate multiple users sharing the same slot
  const slotMap = new Map(); // slot → { scoreSum, count, mode }
  for (const c of clients.values()) {
    if (!slotMap.has(c.slot)) slotMap.set(c.slot, { scoreSum: 0, count: 0, mode: c.mode });
    const s = slotMap.get(c.slot);
    s.scoreSum += c.score;
    s.count++;
  }

  const users = [...slotMap.entries()].map(([slot, s]) => ({
    slot,
    score: s.scoreSum / s.count,
    mode:  s.mode,
  }));

  const msg = JSON.stringify({ type: 'state', users, total: clients.size });

  for (const c of clients.values()) {
    if (c.ws.readyState === 1) c.ws.send(msg);
  }
}

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
