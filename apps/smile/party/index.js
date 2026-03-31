/**
 * party/index.js — PartyKit server
 *
 * This replaces server.js. PartyKit runs this at the edge, close to each user.
 * One "party" (room) = one shared harmony session.
 * Default room is "global" so everyone on the site shares the same session.
 * To support named rooms later, just change the room ID in the client.
 *
 * PartyKit docs: https://docs.partykit.io
 */

export default class HarmonyParty {
  constructor(party) {
    this.party   = party;
    this.clients = new Map(); // connId → { score, mode, slot }
  }

  onConnect(conn) {
    const slot = this._assignSlot();
    this.clients.set(conn.id, { score: 0, mode: 'face', slot });
    conn.send(JSON.stringify({ type: 'welcome', id: conn.id, slot }));
    this._broadcast();
  }

  onMessage(message, sender) {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'score') {
        const c = this.clients.get(sender.id);
        if (c) { c.score = msg.score; c.mode = msg.mode; }
        this._broadcast();
      }
    } catch (_) {}
  }

  onClose(conn) {
    this.clients.delete(conn.id);
    this._broadcast();
  }

  onError(conn) {
    this.clients.delete(conn.id);
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  _assignSlot() {
    const used = new Set([...this.clients.values()].map(c => c.slot));
    for (let s = 0; s < 4; s++) if (!used.has(s)) return s;
    return this.clients.size % 4;
  }

  _broadcast() {
    // Average scores for users sharing the same slot
    const slotMap = new Map();
    for (const c of this.clients.values()) {
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

    this.party.broadcast(
      JSON.stringify({ type: 'state', users, total: this.clients.size })
    );
  }
}
