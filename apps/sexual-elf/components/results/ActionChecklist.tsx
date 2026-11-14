import type { ActionItem } from '@/lib/types';

const priorityConfig = {
  urgent: {
    label: 'Urgent',
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
  },
  recommended: {
    dot: 'bg-gold-500',
    label: 'Recommended',
    text: 'text-gold-700',
    bg: 'bg-gold-50 border-gold-200',
  },
  optional: {
    dot: 'bg-gray-400',
    label: 'Optional',
    text: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200',
  },
};

interface ActionChecklistProps {
  actions: ActionItem[];
}

export default function ActionChecklist({ actions }: ActionChecklistProps) {
  // Sorted: urgent → recommended → optional (API should do this, but enforce client-side too)
  const sorted = [...actions].sort((a, b) => {
    const order = { urgent: 0, recommended: 1, optional: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => {
        const cfg = priorityConfig[item.priority];
        return (
          <div key={i} className={`flex gap-3 rounded-xl border p-4 ${cfg.bg}`}>
            <div className="shrink-0 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full block ${cfg.dot}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>
                  {cfg.label}
                </span>
                {item.timeframe && (
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {item.timeframe}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-800">{item.action}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
