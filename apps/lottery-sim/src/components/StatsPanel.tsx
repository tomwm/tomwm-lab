import type { AggregatedResults, SimConfig } from "@/types/simulation";

interface StatsPanelProps {
  results: AggregatedResults;
  config: SimConfig;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function StatsPanel({ results, config }: StatsPanelProps) {
  const { medianRun, avgFinalBankroll, ruinRate, runs } = results;
  const multiRun = runs.length > 1;

  const pnl = medianRun.totalReturned - medianRun.totalStaked;
  const pnlSign = pnl >= 0 ? "+" : "";
  const winRate = medianRun.perNumberStats.reduce((s, n) => s + n.wins, 0) / config.numDraws;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4 rounded-lg border bg-card">
      <Stat
        label="Final bankroll"
        value={`€${medianRun.finalBankroll.toFixed(2)}`}
        sub={multiRun ? `avg €${avgFinalBankroll.toFixed(2)}` : undefined}
      />
      <Stat
        label="Net P&L"
        value={`${pnlSign}€${pnl.toFixed(2)}`}
      />
      <Stat
        label="Total staked"
        value={`€${medianRun.totalStaked.toFixed(2)}`}
      />
      <Stat
        label="Total returned"
        value={`€${medianRun.totalReturned.toFixed(2)}`}
      />
      <Stat
        label="Wins / draw"
        value={(winRate * 100).toFixed(1) + "%"}
        sub={`${medianRun.perNumberStats.reduce((s, n) => s + n.wins, 0)} total wins`}
      />
      <Stat
        label="Ruin rate"
        value={`${(ruinRate * 100).toFixed(0)}%`}
        sub={multiRun ? `across ${runs.length} runs` : (medianRun.ruinedAt !== null ? `at draw ${medianRun.ruinedAt}` : "no ruin")}
      />
    </div>
  );
}
