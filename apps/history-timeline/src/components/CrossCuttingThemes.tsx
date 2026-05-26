import { X } from 'lucide-react';
import { themeDefinitions } from '@/data/migration_theme_definitions';
import { uniqueCards } from '@/lib/utils';

interface Props {
  activeTheme: string | null;
  onThemeToggle: (id: string) => void;
}

export default function CrossCuttingThemes({ activeTheme, onThemeToggle }: Props) {
  const active = themeDefinitions.find(t => t.id === activeTheme) ?? null;

  const resolvedCount = active
    ? active.relatedCardIds.filter(id => uniqueCards.some(c => c.id === id)).length
    : 0;

  return (
    <div className="border-b border-stone-200 bg-violet-50 flex-shrink-0 px-4 py-3 space-y-3">
      {/* Wrapping theme pills — no scroll, fit to width */}
      <div className="flex flex-wrap gap-1.5">
        {themeDefinitions.map(theme => (
          <button
            key={theme.id}
            onClick={() => onThemeToggle(theme.id)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              activeTheme === theme.id
                ? 'bg-violet-700 text-white border-violet-700'
                : 'border-violet-300 text-violet-700 bg-white hover:bg-violet-100'
            }`}
          >
            {theme.title}
          </button>
        ))}
      </div>

      {/* Inline detail panel for active theme */}
      {active && (
        <div className="bg-white rounded-xl border border-violet-200 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-violet-900">{active.title}</p>
            <button
              onClick={() => onThemeToggle(active.id)}
              aria-label="Clear theme"
              className="flex-shrink-0 text-violet-400 hover:text-violet-600 transition-colors mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">{active.summary}</p>
          <ul className="space-y-1">
            {active.keyIdeas.map((idea, i) => (
              <li key={i} className="flex gap-2 text-xs text-stone-600">
                <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
                <span className="leading-snug">{idea}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-violet-500">
            {resolvedCount} related card{resolvedCount !== 1 ? 's' : ''} highlighted on the timeline
          </p>
        </div>
      )}
    </div>
  );
}
