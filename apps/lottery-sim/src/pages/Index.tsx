import { useState, useCallback } from "react";
import { ConfigPanel } from "@/components/ConfigPanel";
import { BankrollChart } from "@/components/BankrollChart";
import { StatsPanel } from "@/components/StatsPanel";
import { NumberPerformanceGrid } from "@/components/NumberPerformanceGrid";
import { DroughtChart } from "@/components/DroughtChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { runAllSimulations } from "@/lib/simulator";
import type { SimConfig, AggregatedResults } from "@/types/simulation";

const DEFAULT_CONFIG: SimConfig = {
  initialBankroll: 200,
  startingStake: 1,
  odds: 6,
  trackedNumbers: [7],
  numDraws: 200,
  numRuns: 1,
};

export default function Index() {
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<AggregatedResults | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      setResults(runAllSimulations(config));
      setRunning(false);
    }, 0);
  }, [config]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center gap-3 shrink-0">
        <h1 className="text-lg font-semibold">Irish Lottery Betting Simulator</h1>
        <span className="text-sm text-muted-foreground">Variable staking strategy</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto">
          <ConfigPanel
            config={config}
            onChange={setConfig}
            onRun={handleRun}
            running={running}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <p className="text-lg font-medium">Configure and run a simulation</p>
              <p className="text-sm">Pick numbers, set your bankroll and target profit, then hit Run.</p>
            </div>
          ) : (
            <>
              <StatsPanel results={results} config={config} />

              <div>
                <h2 className="text-sm font-semibold mb-3">
                  Bankroll over time
                  {results.runs.length > 1 && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      — median, best &amp; worst of {results.runs.length} runs
                    </span>
                  )}
                </h2>
                <BankrollChart results={results} initialBankroll={config.initialBankroll} />
              </div>

              <Tabs defaultValue="numbers">
                <TabsList>
                  <TabsTrigger value="numbers">Per number</TabsTrigger>
                  <TabsTrigger value="drought">Drought analysis</TabsTrigger>
                </TabsList>
                <TabsContent value="numbers">
                  <NumberPerformanceGrid results={results} />
                </TabsContent>
                <TabsContent value="drought">
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Longest consecutive losing streak per number. The dashed line is the theoretical average ({(47 / 6).toFixed(1)} draws).
                    </p>
                    <DroughtChart results={results} />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
