import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import type { AggregatedResults } from "@/types/simulation";

interface BankrollChartProps {
  results: AggregatedResults;
  initialBankroll: number;
}

const fmt = (v: number) => `€${v.toFixed(2)}`;

export function BankrollChart({ results }: BankrollChartProps) {
  const { medianRun } = results;

  const data = medianRun.records.map((r) => ({
    draw: r.drawIndex + 1,
    profit: parseFloat(r.drawProfit.toFixed(2)),
    stake: parseFloat(r.drawStaked.toFixed(2)),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="draw"
            tick={{ fontSize: 11 }}
            label={{ value: "Draw", position: "insideBottomRight", offset: -4, fontSize: 11 }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={fmt}
            tick={{ fontSize: 11 }}
            width={72}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={fmt}
            tick={{ fontSize: 11 }}
            width={72}
          />
          <Tooltip
            formatter={(val: number, name: string) => [
              `€${val.toFixed(2)}`,
              name === "profit" ? "Profit / Loss" : "Stake",
            ]}
            labelFormatter={(l) => `Draw ${l}`}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine yAxisId="left" y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => v === "profit" ? "Profit / Loss" : "Stake"} />
          <Bar yAxisId="left" dataKey="profit" name="profit" maxBarSize={8}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.profit >= 0 ? "hsl(142 72% 40%)" : "hsl(0 72% 55%)"}
              />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            dataKey="stake"
            name="stake"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
