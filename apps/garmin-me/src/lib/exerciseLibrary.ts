/**
 * Commonly recommended exercises for each muscle group, best first.
 * General gym guidance written for this app, not Garmin data and not
 * personalised advice. Bodyweight moves sit with free weights.
 */
import type { Muscle } from './muscles'

export type Suggestion = { name: string; note?: string }
export type Library = { free: Suggestion[]; machine: Suggestion[] }

export const BEST: Record<Muscle, Library> = {
  chest: {
    free: [
      { name: 'Barbell bench press', note: 'the main heavy chest builder' },
      { name: 'Incline dumbbell press', note: 'upper chest' },
      { name: 'Dumbbell fly', note: 'stretch under load' },
      { name: 'Chest dips', note: 'lean forward to shift work to the chest' },
      { name: 'Push-up' },
    ],
    machine: [
      { name: 'Machine chest press' },
      { name: 'Cable crossover', note: 'constant tension through the whole move' },
      { name: 'Pec deck' },
      { name: 'Smith machine incline press' },
    ],
  },
  shoulders: {
    free: [
      { name: 'Standing overhead press', note: 'barbell; front and side delts' },
      { name: 'Seated dumbbell press' },
      { name: 'Dumbbell lateral raise', note: 'side delts, for width' },
      { name: 'Bent-over rear-delt fly', note: 'rear delts' },
      { name: 'Arnold press' },
    ],
    machine: [
      { name: 'Machine shoulder press' },
      { name: 'Cable lateral raise' },
      { name: 'Face pull', note: 'rope on a cable; rear delts and upper back' },
      { name: 'Reverse pec deck', note: 'rear delts' },
    ],
  },
  biceps: {
    free: [
      { name: 'Barbell curl' },
      { name: 'Incline dumbbell curl', note: 'long head, in a stretched position' },
      { name: 'Hammer curl', note: 'also forearms' },
      { name: 'Chin-up', note: 'palms facing you' },
    ],
    machine: [
      { name: 'Cable curl' },
      { name: 'Preacher curl machine' },
      { name: 'Behind-the-body cable curl', note: 'stretched position' },
    ],
  },
  triceps: {
    free: [
      { name: 'Close-grip bench press', note: 'heaviest triceps move' },
      { name: 'Overhead dumbbell extension', note: 'long head' },
      { name: 'Skull crusher', note: 'EZ bar, lying on a bench' },
      { name: 'Dips', note: 'upright torso' },
    ],
    machine: [
      { name: 'Cable rope pressdown' },
      { name: 'Overhead cable extension' },
      { name: 'Assisted dip machine' },
    ],
  },
  forearms: {
    free: [
      { name: "Farmer's carry", note: 'grip strength' },
      { name: 'Wrist curl' },
      { name: 'Reverse curl', note: 'palms down' },
      { name: 'Dead hang', note: 'from a pull-up bar' },
    ],
    machine: [
      { name: 'Cable reverse curl' },
      { name: 'Wrist roller' },
    ],
  },
  abs: {
    free: [
      { name: 'Hanging leg raise' },
      { name: 'Ab wheel rollout' },
      { name: 'Plank', note: 'and side plank for the obliques' },
      { name: 'Weighted crunch' },
    ],
    machine: [
      { name: 'Cable crunch', note: 'kneeling, rope attachment' },
      { name: 'Cable woodchop', note: 'obliques and rotation' },
      { name: "Captain's chair leg raise" },
      { name: 'Ab crunch machine' },
    ],
  },
  upperBack: {
    free: [
      { name: 'Pull-up', note: 'lats' },
      { name: 'Barbell row' },
      { name: 'One-arm dumbbell row' },
      { name: 'Chest-supported dumbbell row', note: 'spares the lower back' },
    ],
    machine: [
      { name: 'Lat pulldown' },
      { name: 'Seated cable row' },
      { name: 'Machine row' },
      { name: 'Straight-arm pulldown', note: 'lats in isolation' },
    ],
  },
  traps: {
    free: [
      { name: 'Barbell shrug' },
      { name: 'Dumbbell shrug' },
      { name: "Farmer's carry" },
      { name: 'Rack pull' },
    ],
    machine: [
      { name: 'Smith machine shrug' },
      { name: 'Cable shrug' },
      { name: 'Face pull', note: 'middle and lower traps' },
    ],
  },
  lowerBack: {
    free: [
      { name: 'Deadlift' },
      { name: 'Romanian deadlift' },
      { name: 'Good morning' },
      { name: 'Bird dog', note: 'bodyweight; spine stability' },
    ],
    machine: [
      { name: 'Back extension', note: '45° or 90° bench' },
      { name: 'Reverse hyper' },
    ],
  },
  glutes: {
    free: [
      { name: 'Barbell hip thrust', note: 'the most direct glute exercise' },
      { name: 'Romanian deadlift' },
      { name: 'Bulgarian split squat' },
      { name: 'Back squat', note: 'go deep for more glute work' },
    ],
    machine: [
      { name: 'Hip thrust machine' },
      { name: 'Cable kickback' },
      { name: 'Leg press', note: 'feet high on the platform' },
      { name: 'Hip abduction machine', note: 'side glutes' },
    ],
  },
  quads: {
    free: [
      { name: 'Back squat' },
      { name: 'Front squat', note: 'more upright, more quads' },
      { name: 'Bulgarian split squat' },
      { name: 'Walking lunge' },
      { name: 'Goblet squat' },
    ],
    machine: [
      { name: 'Leg press' },
      { name: 'Hack squat' },
      { name: 'Leg extension', note: 'quads in isolation' },
    ],
  },
  hamstrings: {
    free: [
      { name: 'Romanian deadlift', note: 'the main hamstring builder' },
      { name: 'Nordic curl', note: 'bodyweight; hard, protects against strains' },
      { name: 'Good morning' },
      { name: 'Single-leg Romanian deadlift' },
    ],
    machine: [
      { name: 'Seated leg curl' },
      { name: 'Lying leg curl' },
      { name: 'Glute-ham raise' },
    ],
  },
  calves: {
    free: [
      { name: 'Standing calf raise', note: 'holding dumbbells, off a step' },
      { name: 'Single-leg calf raise' },
      { name: "Farmer's walk on tiptoes" },
    ],
    machine: [
      { name: 'Standing calf raise machine' },
      { name: 'Seated calf raise', note: 'the deeper soleus muscle' },
      { name: 'Calf press on the leg press' },
    ],
  },
}
