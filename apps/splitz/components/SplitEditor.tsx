"use client";

type Props = {
  members: string[];
  splits: Record<string, number>;
  onChange: (splits: Record<string, number>) => void;
  totalAmount?: number;
};

export default function SplitEditor({ members, splits, onChange, totalAmount }: Props) {
  const total = Object.values(splits).reduce((a, b) => a + b, 0);
  const isValid = Math.abs(total - 100) <= 0.5;

  function handleChange(changed: string, newVal: number) {
    const clamped = Math.max(0, Math.min(100, isNaN(newVal) ? 0 : newVal));
    const others = members.filter((m) => m !== changed);
    const remaining = Math.max(0, 100 - clamped);

    // Distribute remainder proportionally among others, or equally if all zero
    const otherCurrentTotal = others.reduce((s, m) => s + (splits[m] ?? 0), 0);
    const next: Record<string, number> = { ...splits, [changed]: clamped };

    if (otherCurrentTotal === 0 || others.length === 0) {
      const each = remaining / others.length;
      others.forEach((m) => (next[m] = Math.round(each * 10) / 10));
    } else {
      others.forEach((m) => {
        next[m] = Math.round(((splits[m] ?? 0) / otherCurrentTotal) * remaining * 10) / 10;
      });
    }

    // Fix rounding so it always sums to exactly 100
    const newTotal = Object.values(next).reduce((a, b) => a + b, 0);
    const diff = Math.round((100 - newTotal) * 10) / 10;
    if (diff !== 0 && others.length > 0) {
      next[others[others.length - 1]] = Math.round((next[others[others.length - 1]] + diff) * 10) / 10;
    }

    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => {
        const pct = splits[m] ?? 0;
        return (
          <div key={m} className="flex items-center gap-2">
            <span className="w-24 text-sm font-medium truncate">{m}</span>
            <div className="flex-1 relative">
              <input
                type="number"
                value={pct}
                min="0"
                max="100"
                step="1"
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleChange(m, parseFloat(e.target.value))}
                className="w-full border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm pr-7 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">%</span>
            </div>
            {totalAmount !== undefined && (
              <span className="text-xs text-[var(--muted)] w-14 text-right shrink-0">
                £{((totalAmount * pct) / 100).toFixed(2)}
              </span>
            )}
          </div>
        );
      })}
      <p className={`text-xs text-right mt-0.5 ${isValid ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
        Total: {total.toFixed(1)}%{isValid ? " ✓" : " (must equal 100%)"}
      </p>
    </div>
  );
}
