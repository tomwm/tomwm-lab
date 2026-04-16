export interface SimConfig {
  initialBankroll: number;  // tap-out threshold
  startingStake: number;    // stake placed after a win / on first draw
  odds: number;             // net multiplier, e.g. 6 means "6/1"
  trackedNumbers: number[];
  numDraws: number;
  numRuns: number;
}

export interface NumberState {
  number: number;
  totalLost: number;
  currentStake: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalReturned: number;
  currentDrought: number;
  longestDrought: number;
  ruined: boolean;
  ruinedAtDraw: number | null;
}

export interface DrawRecord {
  drawIndex: number;
  bankroll: number;
  drawnNumbers: number[];
  numberStates: NumberState[];
  drawStaked: number;   // total staked this draw across all numbers
  drawProfit: number;   // net profit/loss this draw
}

export interface PerNumberStats {
  number: number;
  wins: number;
  totalStaked: number;
  totalReturned: number;
  netPnl: number;
  longestDrought: number;
  ruined: boolean;
  ruinedAtDraw: number | null;
}

export interface SimRunResult {
  runIndex: number;
  records: DrawRecord[];
  finalBankroll: number;
  totalStaked: number;
  totalReturned: number;
  ruinedAt: number | null;
  perNumberStats: PerNumberStats[];
}

export interface AggregatedResults {
  runs: SimRunResult[];
  medianRun: SimRunResult;
  bestRun: SimRunResult;
  worstRun: SimRunResult;
  avgFinalBankroll: number;
  ruinRate: number;
}
