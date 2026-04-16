import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { AggregatedResults } from "@/types/simulation";

interface DroughtChartProps {
  results: AggregatedResults;
}

// Theoretical mean: 1 / (6/47) ≈ 7.83 draws between wins
const THEORETICAL_MEAN = 47 / 6;

export function DroughtChart({ results }: DroughtChartProps) {
  const data = results.medianRun.perNumberStats.map((ns) => ({
    name: String(ns.number),
    drought: ns.longestDrought,
  }));

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} label={{ value: "Number", position: "insideBottomRight", offset: -4, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: "Draws", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip
            formatter={(val: number) => [`${val} draws`, "Longest drought"]}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine
            y={THEORETICAL_MEAN}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            label={{ value: `Expected avg (${THEORETICAL_MEAN.toFixed(1)})`, fontSize: 10, fill: "hsl(var(--muted-foreground))", position: "insideTopRight" }}
          />
          <Bar dataKey="drought" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Longest drought" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
