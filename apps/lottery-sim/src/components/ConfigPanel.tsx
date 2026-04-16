import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NumberSelector } from "@/components/NumberSelector";
import type { SimConfig } from "@/types/simulation";

interface ConfigPanelProps {
  config: SimConfig;
  onChange: (config: SimConfig) => void;
  onRun: () => void;
  running: boolean;
}

export function ConfigPanel({ config, onChange, onRun, running }: ConfigPanelProps) {
  const set = (patch: Partial<SimConfig>) => onChange({ ...config, ...patch });

  const targetProfit = config.startingStake * (config.odds - 1);

  return (
    <Card className="rounded-none border-0 border-r h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Configuration</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 flex-1 overflow-y-auto pb-6">

        <div className="space-y-2">
          <Label>Tap-out bankroll (€)</Label>
          <Input
            type="number"
            min={1}
            value={config.initialBankroll}
            onChange={(e) => set({ initialBankroll: Math.max(1, Number(e.target.value)) })}
          />
          <p className="text-xs text-muted-foreground">
            Simulation stops when you can't cover the next stake
          </p>
        </div>

        <div className="space-y-2">
          <Label>Starting stake (€)</Label>
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={config.startingStake}
            onChange={(e) => set({ startingStake: Math.max(0.01, Number(e.target.value)) })}
          />
          <p className="text-xs text-muted-foreground">
            Profit per win: €{targetProfit.toFixed(2)}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Odds</Label>
          <Select
            value={String(config.odds)}
            onValueChange={(v) => set({ odds: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5/1</SelectItem>
              <SelectItem value="6">6/1</SelectItem>
              <SelectItem value="7">7/1</SelectItem>
              <SelectItem value="8">8/1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Numbers to track (up to 6)</Label>
          <p className="text-xs text-muted-foreground">
            {config.trackedNumbers.length === 0
              ? "Pick at least one number"
              : `Tracking: ${config.trackedNumbers.join(", ")}`}
          </p>
          <NumberSelector
            selected={config.trackedNumbers}
            onChange={(numbers) => set({ trackedNumbers: numbers })}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Draws per run</Label>
            <span className="text-sm font-medium">{config.numDraws}</span>
          </div>
          <Slider
            min={50}
            max={1000}
            step={50}
            value={[config.numDraws]}
            onValueChange={([v]) => set({ numDraws: v })}
          />
          <p className="text-xs text-muted-foreground">≈ {(config.numDraws / 104).toFixed(1)} years of draws</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Simulation runs</Label>
            <span className="text-sm font-medium">{config.numRuns}</span>
          </div>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[config.numRuns]}
            onValueChange={([v]) => set({ numRuns: v })}
          />
          <p className="text-xs text-muted-foreground">
            {config.numRuns === 1 ? "Single run" : `${config.numRuns} Monte Carlo runs`}
          </p>
        </div>

        <Button
          className="w-full mt-2"
          onClick={onRun}
          disabled={running || config.trackedNumbers.length === 0}
        >
          {running ? "Running…" : "Run Simulation"}
        </Button>
      </CardContent>
    </Card>
  );
}
