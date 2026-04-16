import { cn } from "@/lib/utils";

interface NumberSelectorProps {
  selected: number[];
  onChange: (numbers: number[]) => void;
  max?: number;
}

export function NumberSelector({ selected, onChange, max = 6 }: NumberSelectorProps) {
  const toggle = (n: number) => {
    if (selected.includes(n)) {
      onChange(selected.filter((x) => x !== n));
    } else if (selected.length < max) {
      onChange([...selected, n].sort((a, b) => a - b));
    }
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 47 }, (_, i) => i + 1).map((n) => {
        const isSelected = selected.includes(n);
        const isDisabled = !isSelected && selected.length >= max;
        return (
          <button
            key={n}
            onClick={() => toggle(n)}
            disabled={isDisabled}
            className={cn(
              "h-8 w-8 rounded text-xs font-medium transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isDisabled
                ? "bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
