import type {
  SimConfig,
  SimRunResult,
  AggregatedResults,
  NumberState,
  DrawRecord,
  PerNumberStats,
} from "@/types/simulation";

// Mulberry32 seeded RNG - fast, good quality for simulation
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSixNumbers(rng: () => number): number[] {
  const pool = Array.from({ length: 47 }, (_, i) => i + 1);
  // Fisher-Yates partial shuffle for first 6
  for (let i = 0; i < 6; i++) {
    const j = i + Math.floor(rng() * (47 - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6);
}

function computeStake(totalLost: number, targetProfit: number, odds: number): number {
  // At n/1 odds: net profit = odds * stake
  // To recover totalLost and earn targetProfit: odds * stake = totalLost + stake + targetProfit
  // => (odds - 1) * stake = totalLost + targetProfit
  // => stake = (totalLost + targetProfit) / (odds - 1)
  const raw = (totalLost + targetProfit) / (odds - 1);
  // Round up to nearest penny
  return Math.ceil(raw * 100) / 100;
}

function cloneStates(states: NumberState[]): NumberState[] {
  return states.map((s) => ({ ...s }));
}

export function runSimulation(config: SimConfig, seed: number): SimRunResult {
  const rng = mulberry32(seed);
  let bankroll = config.initialBankroll;
  // Target profit is derived from starting stake: what you win on first draw
  const targetProfit = config.startingStake * (config.odds - 1);

  const numberStates: NumberState[] = config.trackedNumbers.map((n) => ({
    number: n,
    totalLost: 0,
    currentStake: config.startingStake,
    wins: 0,
    losses: 0,
    totalStaked: 0,
    totalReturned: 0,
    currentDrought: 0,
    longestDrought: 0,
    ruined: false,
    ruinedAtDraw: null,
  }));

  const records: DrawRecord[] = [];
  let totalStaked = 0;
  let totalReturned = 0;
  let ruinedAt: number | null = null;

  for (let drawIndex = 0; drawIndex < config.numDraws; drawIndex++) {
    const drawn = drawSixNumbers(rng);
    const drawnSet = new Set(drawn);

    let drawStaked = 0;
    let drawProfit = 0;

    for (const ns of numberStates) {
      if (ns.ruined) continue;

      const stake = ns.currentStake;

      if (bankroll < stake) {
        ns.ruined = true;
        ns.ruinedAtDraw = drawIndex;
        if (ruinedAt === null) ruinedAt = drawIndex;
        continue;
      }

      bankroll -= stake;
      ns.totalStaked += stake;
      totalStaked += stake;
      drawStaked += stake;
      drawProfit -= stake;

      if (drawnSet.has(ns.number)) {
        const payout = stake * config.odds;
        bankroll += payout;
        ns.totalReturned += payout;
        totalReturned += payout;
        drawProfit += payout;
        ns.wins++;
        ns.longestDrought = Math.max(ns.longestDrought, ns.currentDrought);
        ns.currentDrought = 0;
        ns.totalLost = 0;
        ns.currentStake = config.startingStake;
      } else {
        ns.losses++;
        ns.currentDrought++;
        ns.totalLost += stake;
        ns.currentStake = computeStake(ns.totalLost, targetProfit, config.odds);
      }
    }

    records.push({
      drawIndex,
      bankroll,
      drawnNumbers: drawn,
      numberStates: cloneStates(numberStates),
      drawStaked,
      drawProfit,
    });
  }

  // Final drought update for any ongoing streaks
  for (const ns of numberStates) {
    ns.longestDrought = Math.max(ns.longestDrought, ns.currentDrought);
  }

  const perNumberStats: PerNumberStats[] = numberStates.map((ns) => ({
    number: ns.number,
    wins: ns.wins,
    totalStaked: ns.totalStaked,
    totalReturned: ns.totalReturned,
    netPnl: ns.totalReturned - ns.totalStaked,
    longestDrought: ns.longestDrought,
    ruined: ns.ruined,
    ruinedAtDraw: ns.ruinedAtDraw,
  }));

  return {
    runIndex: seed,
    records,
    finalBankroll: bankroll,
    totalStaked,
    totalReturned,
    ruinedAt,
    perNumberStats,
  };
}

export function runAllSimulations(config: SimConfig): AggregatedResults {
  const runs: SimRunResult[] = [];
  for (let i = 0; i < config.numRuns; i++) {
    runs.push(runSimulation(config, i + 1));
  }

  const sorted = [...runs].sort((a, b) => a.finalBankroll - b.finalBankroll);
  const medianIdx = Math.floor(sorted.length / 2);

  const avgFinalBankroll = runs.reduce((s, r) => s + r.finalBankroll, 0) / runs.length;
  const ruinRate = runs.filter((r) => r.ruinedAt !== null).length / runs.length;

  return {
    runs,
    bestRun: sorted[sorted.length - 1],
    worstRun: sorted[0],
    medianRun: sorted[medianIdx],
    avgFinalBankroll,
    ruinRate,
  };
}
