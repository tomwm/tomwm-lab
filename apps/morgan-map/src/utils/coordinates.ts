// Default canvas dimensions
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;

// Node dimensions
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 70;

/**
 * Convert normalised 0–1 axis values to React Flow canvas coordinates.
 * React Flow's y axis goes downward, so we invert criticality.
 */
export function axisToCanvas(
  automation: number,
  criticality: number,
  w: number = CANVAS_WIDTH,
  h: number = CANVAS_HEIGHT
) {
  return {
    x: automation * w - NODE_WIDTH / 2,
    y: (1 - criticality) * h - NODE_HEIGHT / 2,
  };
}

/**
 * Convert React Flow canvas position back to normalised axis values.
 */
export function canvasToAxis(
  x: number,
  y: number,
  w: number = CANVAS_WIDTH,
  h: number = CANVAS_HEIGHT
) {
  return {
    automation: Math.max(0, Math.min(1, (x + NODE_WIDTH / 2) / w)),
    criticality: Math.max(0, Math.min(1, 1 - (y + NODE_HEIGHT / 2) / h)),
  };
}
