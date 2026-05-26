import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { migrationCards } from '@/data/cards';

// Deduplicate by id, keeping the last occurrence (later batches have richer link data)
const seen = new Set<string>();
export const uniqueCards = [...migrationCards].reverse().filter(c => {
  if (seen.has(c.id)) return false;
  seen.add(c.id);
  return true;
}).reverse();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ERA_ORDER = [
  'Early Medieval',
  'Medieval',
  'Early Modern',
  'Empire & Industrial',
  'World Wars & Interwar',
  'Post-War & Decolonisation',
  'Modern Britain & Migration',
];

export const ERA_LABELS: Record<string, string> = {
  'Early Medieval': 'Early Medieval',
  'Medieval': 'Medieval',
  'Early Modern': 'Early Modern',
  'Empire & Industrial': 'Empire & Industrial',
  'World Wars & Interwar': 'World Wars & Interwar',
  'Post-War & Decolonisation': 'Post-War & Decolonisation',
  'Modern Britain & Migration': 'Modern Britain & Migration',
  'Uncertain': 'Other',
};

export const ERA_DATES: Record<string, string> = {
  'Early Medieval': '790–1100',
  'Medieval': '1100–1500',
  'Early Modern': '1500–1700',
  'Empire & Industrial': '1700–1900',
  'World Wars & Interwar': '1900–1945',
  'Post-War & Decolonisation': '1945–1970',
  'Modern Britain & Migration': '1970–2020',
  'Uncertain': '',
};

export const ERA_COLOURS: Record<string, string> = {
  'Early Medieval': 'bg-violet-100 border-violet-300 text-violet-900',
  'Medieval': 'bg-blue-100 border-blue-300 text-blue-900',
  'Early Modern': 'bg-sky-100 border-sky-300 text-sky-900',
  'Empire & Industrial': 'bg-amber-100 border-amber-300 text-amber-900',
  'World Wars & Interwar': 'bg-red-100 border-red-300 text-red-900',
  'Post-War & Decolonisation': 'bg-green-100 border-green-300 text-green-900',
  'Modern Britain & Migration': 'bg-teal-100 border-teal-300 text-teal-900',
  'Uncertain': 'bg-stone-100 border-stone-300 text-stone-900',
};

export const ERA_HEADER_COLOURS: Record<string, string> = {
  'Early Medieval': 'bg-violet-200 text-violet-900',
  'Medieval': 'bg-blue-200 text-blue-900',
  'Early Modern': 'bg-sky-200 text-sky-900',
  'Empire & Industrial': 'bg-amber-200 text-amber-900',
  'World Wars & Interwar': 'bg-red-200 text-red-900',
  'Post-War & Decolonisation': 'bg-green-200 text-green-900',
  'Modern Britain & Migration': 'bg-teal-200 text-teal-900',
  'Uncertain': 'bg-stone-200 text-stone-900',
};

// Map from legacy cards.ts periodBucket values → canonical bucket labels
const PERIOD_BUCKET_MAP: Record<string, string> = {
  'Early medieval': 'Early Medieval',
  'Medieval': 'Medieval',
  'Early modern': 'Early Modern',
  'Empire and industrial Britain': 'Empire & Industrial',
  'World wars and interwar': 'World Wars & Interwar',
  'Post-war and decolonisation': 'Post-War & Decolonisation',
  'Late twentieth / contemporary': 'Modern Britain & Migration',
  'Uncertain': 'Uncertain',
};

// Cards that should be classified as themes regardless of cardType
const THEME_IDS = new Set([
  'hundred-years-war',
]);

// Authoritative person IDs — do not infer from colour or cardType
const PERSON_IDS = new Set([
  'alfred-the-great', 'emma-of-normandy', 'cnut-the-great', 'henry-ii',
  'king-john', 'sir-john-hawkins', 'walter-raleigh', 'robert-clive',
  'warren-hastings', 'cecil-john-rhodes', 'mahatma-gandhi', 'jomo-kenyatta',
  'enoch-powell', 'claudia-jones', 'kwame-nkrumah', 'idi-amin',
  'bernard-grant', 'margaret-thatcher',
]);

// Migration/displacement cards with incorrect periodBucket in source data
const MIGRATION_PLACEMENT_OVERRIDES: Record<string, { timelineYear: number; timelinePeriod: string }> = {
  'highland-clearances':       { timelineYear: 1800, timelinePeriod: 'Empire & Industrial' },
  'migration-to-new-zealand':  { timelineYear: 1850, timelinePeriod: 'Empire & Industrial' },
  'migration-to-and-from-canada': { timelineYear: 1850, timelinePeriod: 'Empire & Industrial' },
  'indian-indentured-servants':{ timelineYear: 1890, timelinePeriod: 'Empire & Industrial' },
};

// Historically significant placement for people — not birth/death year
const PERSON_TIMELINE_PLACEMENT: Record<string, { timelineYear: number; timelinePeriod: string }> = {
  'alfred-the-great':  { timelineYear: 878,  timelinePeriod: 'Early Medieval' },
  'emma-of-normandy':  { timelineYear: 1016, timelinePeriod: 'Early Medieval' },
  'cnut-the-great':    { timelineYear: 1016, timelinePeriod: 'Early Medieval' },
  'henry-ii':          { timelineYear: 1171, timelinePeriod: 'Medieval' },
  'king-john':         { timelineYear: 1215, timelinePeriod: 'Medieval' },
  'sir-john-hawkins':  { timelineYear: 1562, timelinePeriod: 'Early Modern' },
  'walter-raleigh':    { timelineYear: 1584, timelinePeriod: 'Early Modern' },
  'robert-clive':      { timelineYear: 1757, timelinePeriod: 'Empire & Industrial' },
  'warren-hastings':   { timelineYear: 1773, timelinePeriod: 'Empire & Industrial' },
  'cecil-john-rhodes': { timelineYear: 1888, timelinePeriod: 'Empire & Industrial' },
  'mahatma-gandhi':    { timelineYear: 1930, timelinePeriod: 'World Wars & Interwar' },
  'jomo-kenyatta':     { timelineYear: 1953, timelinePeriod: 'Post-War & Decolonisation' },
  'kwame-nkrumah':     { timelineYear: 1957, timelinePeriod: 'Post-War & Decolonisation' },
  'enoch-powell':      { timelineYear: 1968, timelinePeriod: 'Post-War & Decolonisation' },
  'claudia-jones':     { timelineYear: 1958, timelinePeriod: 'Post-War & Decolonisation' },
  'idi-amin':          { timelineYear: 1972, timelinePeriod: 'Modern Britain & Migration' },
  'bernard-grant':     { timelineYear: 1987, timelinePeriod: 'Modern Britain & Migration' },
  'margaret-thatcher': { timelineYear: 1982, timelinePeriod: 'Modern Britain & Migration' },
};

// Resolver map for IDs used in migration_theme_definitions.ts that differ from actual card IDs
const THEME_CARD_ID_MAP: Record<string, string> = {
  '1982-falklands-war':                            'falklands-war-1982',
  'expansion-of-the-european-union-2004-2007':     'european-union-expansion-2004-2007',
  'hindswaraj':                                    'hind-swaraj',
  'impact-of-wwi-on-the-british-empire':           'impact-of-wwi-on-british-empire',
  'jewish-migration':                              'jewish-migration-1881-1914',
  'members-of-parliament-from-ethnic-minorities':  'ethnic-minority-mps-1987',
  'migration-from-the-eu':                         'migration-from-eu-2004-2020',
  'pan-african-conference':                        'pan-african-conference-1945',
  'racist-violence-nf-bnp-and-anti-racist-groups': 'racist-violence-nf-bnp-anti-racist-groups',
  'windrush-caribbean-migration':                  'windrush-and-caribbean-migration',
  'wwii-in-the-east-and-the-fall-of-singapore':    'wwii-east-fall-of-singapore',
};

/** Resolve a theme relatedCardId to the actual card ID used in cards.ts */
export function resolveThemeCardId(id: string): string {
  return THEME_CARD_ID_MAP[id] ?? id;
}

export type CardKind = 'person' | 'event' | 'theme';

export function getCardKind(card: { id: string; cardType: string }): CardKind {
  if (PERSON_IDS.has(card.id)) return 'person';
  if (THEME_IDS.has(card.id)) return 'theme';
  if (card.cardType.startsWith('Macro theme')) return 'theme';
  return 'event';
}

export function getTimelineBucket(card: { id: string; cardType: string; periodBucket: string }): string {
  if (MIGRATION_PLACEMENT_OVERRIDES[card.id]) return MIGRATION_PLACEMENT_OVERRIDES[card.id].timelinePeriod;
  if (getCardKind(card) === 'person' && PERSON_TIMELINE_PLACEMENT[card.id]) {
    return PERSON_TIMELINE_PLACEMENT[card.id].timelinePeriod;
  }
  return PERIOD_BUCKET_MAP[card.periodBucket] ?? card.periodBucket;
}

export function getTimelineYear(card: { id: string; cardType: string; startYear: number }): number {
  if (MIGRATION_PLACEMENT_OVERRIDES[card.id]) return MIGRATION_PLACEMENT_OVERRIDES[card.id].timelineYear;
  if (getCardKind(card) === 'person' && PERSON_TIMELINE_PLACEMENT[card.id]) {
    return PERSON_TIMELINE_PLACEMENT[card.id].timelineYear;
  }
  return card.startYear;
}

export function cardColourClass(card: { id: string; cardType: string; cardColour: string }): string {
  const kind = getCardKind(card);
  if (kind === 'person') return 'bg-orange-50 border-orange-300 text-orange-900';
  if (kind === 'event')  return 'bg-teal-50 border-teal-300 text-teal-900';
  return 'bg-yellow-50 border-yellow-300 text-yellow-900';
}

export function cardTypeIcon(card: { id: string; cardType: string; cardColour: string }): string {
  const kind = getCardKind(card);
  if (kind === 'person') return '👤';
  if (kind === 'event')  return '📌';
  return '🌍';
}
