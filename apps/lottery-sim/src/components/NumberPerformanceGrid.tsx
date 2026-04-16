import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AggregatedResults } from "@/types/simulation";

interface NumberPerformanceGridProps {
  results: AggregatedResults;
}

export function NumberPerformanceGrid({ results }: NumberPerformanceGridProps) {
  const { medianRun } = results;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {medianRun.perNumberStats.map((ns) => {
        const pnl = ns.totalReturned - ns.totalStaked;
        const pnlSign = pnl >= 0 ? "+" : "";
        return (
          <Card key={ns.number} className={ns.ruined ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardHeader className="pb-1 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{ns.number}</CardTitle>
                <Badge variant={ns.ruined ? "destructive" : "default"} className="text-xs">
                  {ns.ruined ? `Ruined` : "Active"}
                </Badge>
              </div>
              {ns.ruined && (
                <p className="text-xs text-muted-foreground">Draw {ns.ruinedAtDraw}</p>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              <Row label="Wins" value={String(ns.wins)} />
              <Row label="Staked" value={`€${ns.totalStaked.toFixed(2)}`} />
              <Row label="Returned" value={`€${ns.totalReturned.toFixed(2)}`} />
              <Row
                label="Net P&L"
                value={`${pnlSign}€${pnl.toFixed(2)}`}
                valueClass={pnl >= 0 ? "text-green-600" : "text-destructive"}
              />
              <Row label="Longest drought" value={`${ns.longestDrought} draws`} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}
