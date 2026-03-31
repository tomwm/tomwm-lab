/**
 * hand-engine.js
 *
 * Uses MediaPipe Hands to detect a "dog puppet" gesture.
 * Measures how open the hand "mouth" is (thumb tip vs finger tips)
 * and reports a normalised openness value 0–1.
 */

export class HandEngine {
  constructor() {
    this._hands    = null;
    this._video    = null;
    this._cb       = null;
    this._running  = false;
    this._raf      = null;
    this.landmarks = null; // latest landmarks, exposed for drawing
  }

  async init(video) {
    this._video = video;
    this._hands = new Hands({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
    });
    this._hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });
    this._hands.onResults(r => this._onResults(r));
    await this._hands.initialize();
  }

  start(onOpenness) {
    this._cb = onOpenness;
    this._running = true;
    this._loop();
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    this.landmarks = null;
  }

  async _loop() {
    if (!this._running) return;
    await this._hands.send({ image: this._video });
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _onResults(results) {
    if (!results.multiHandLandmarks?.length) {
      this.landmarks = null;
      if (this._cb) this._cb(null); // no hand detected
      return;
    }
    const lm = results.multiHandLandmarks[0];
    this.landmarks = lm;
    if (this._cb) this._cb(this._calcOpenness(lm));
  }

  /**
   * "Dog mouth" openness:
   *   - Thumb tip (4) is the lower jaw
   *   - Average of index (8) + middle (12) tips is the upper jaw
   *   - Normalised by wrist→middle-MCP distance so hand distance doesn't matter
   */
  _calcOpenness(lm) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.3);

    const upperJaw = {
      x: (lm[8].x + lm[12].x) / 2,
      y: (lm[8].y + lm[12].y) / 2,
      z: (lm[8].z + lm[12].z) / 2,
    };

    const mouthGap = dist(lm[4], upperJaw);
    const handSize = dist(lm[0], lm[9]); // wrist → middle MCP
    const raw = (mouthGap / handSize - 0.25) / 0.9;
    return Math.max(0, Math.min(1, raw));
  }
}
