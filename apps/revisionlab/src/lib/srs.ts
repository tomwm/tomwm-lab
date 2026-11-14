// Lightweight SM-2 style scheduler. Ease factor stored as integer x100.
// Deliberately simple: this is a revision aid for one student over two years,
// not a general-purpose spaced-repetition engine.

export type ReviewResult = "again" | "hard" | "good" | "easy";

export interface SrsState {
  easeFactor: number; // x100, e.g. 250 = 2.50
  intervalDays: number;
  reviewCount: number;
}

export function schedule(
  state: SrsState,
  result: ReviewResult
): { easeFactor: number; intervalDays: number; reviewCount: number; dueAt: number } {
  let { easeFactor, intervalDays, reviewCount } = state;
  reviewCount += 1;

  if (result === "again") {
    intervalDays = 0; // due again today
    easeFactor = Math.max(130, easeFactor - 20);
  } else {
    const delta = { hard: -15, good: 0, easy: 15 }[result];
    easeFactor = Math.max(130, easeFactor + delta);

    if (intervalDays === 0) {
      intervalDays = result === "hard" ? 1 : result === "easy" ? 3 : 1;
    } else if (intervalDays === 1) {
      intervalDays = result === "hard" ? 2 : result === "easy" ? 6 : 3;
    } else {
      const factor = easeFactor / 100;
      intervalDays = Math.round(intervalDays * factor * (result === "hard" ? 0.7 : result === "easy" ? 1.3 : 1));
      intervalDays = Math.max(intervalDays, 1);
    }
  }

  const dueAt =
    intervalDays === 0
      ? Date.now() + 1000 * 60 * 10 // ten minutes — come back to it in this session
      : Date.now() + intervalDays * 24 * 60 * 60 * 1000;

  return { easeFactor, intervalDays, reviewCount, dueAt };
}
