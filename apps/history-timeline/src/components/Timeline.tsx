import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type MigrationCard } from '@/data/cards';
import {
  uniqueCards,
  ERA_ORDER, ERA_LABELS, ERA_DATES,
  ERA_HEADER_COLOURS,
  cardColourClass, cardTypeIcon, getCardKind,
  getTimelineBucket, getTimelineYear,
  resolveThemeCardId,
} from '@/lib/utils';
import { themeDefinitions } from '@/data/migration_theme_definitions';
import CardDetail from './CardDetail';
import CrossCuttingThemes from './CrossCuttingThemes';

const ALL_TYPES = ['All', 'People', 'Events', 'Themes'];

export default function Timeline() {
  const [selected, setSelected] = useState<MigrationCard | null>(null);
  const [filter, setFilter] = useState('All');
  const [eraIndex, setEraIndex] = useState(0);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const touchStartX = useRef(0);

  function toggleTheme(id: string) {
    setActiveTheme(prev => (prev === id ? null : id));
  }

  // Build the set of related card IDs for the active theme (resolved to actual card IDs)
  const relatedCardIds: Set<string> | null = activeTheme
    ? new Set(
        (themeDefinitions.find(t => t.id === activeTheme)?.relatedCardIds ?? [])
          .map(resolveThemeCardId)
      )
    : null;

  // Returns extra className for a card based on active theme state
  function themeClass(cardId: string, isSelected: boolean): string {
    if (!relatedCardIds) return '';
    if (isSelected) return ''; // selection ring takes priority
    if (relatedCardIds.has(cardId)) return 'ring-2 ring-violet-500 ring-offset-1';
    return 'opacity-30';
  }

  function matchesFilter(card: MigrationCard) {
    if (filter === 'All') return true;
    const kind = getCardKind(card);
    if (filter === 'People') return kind === 'person';
    if (filter === 'Events') return kind === 'event';
    if (filter === 'Themes') return kind === 'theme';
    return true;
  }

  function navigate(id: string) {
    const c = uniqueCards.find(c => c.id === id);
    if (c) setSelected(c);
  }

  const eras = ERA_ORDER;
  const safeEraIndex = Math.min(eraIndex, eras.length - 1);
  const currentEra = eras[safeEraIndex];

  const mobileCards = uniqueCards
    .filter(c => getTimelineBucket(c) === currentEra && matchesFilter(c))
    .sort((a, b) => getTimelineYear(a) - getTimelineYear(b));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) setEraIndex(i => Math.min(i + 1, eras.length - 1));
    if (dx > 50) setEraIndex(i => Math.max(i - 1, 0));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-200 bg-white flex-shrink-0">
        <span className="text-xs text-stone-500 mr-1 hidden sm:inline">Show:</span>
        {ALL_TYPES.map(t => (
          <button
            key={t}
            onClick={() => { setFilter(t); setEraIndex(0); }}
            className={`text-xs px-3 py-1 rounded-full border transition-colors flex-shrink-0 ${
              filter === t
                ? 'bg-stone-800 text-white border-stone-800'
                : 'border-stone-300 text-stone-600 hover:border-stone-500'
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-xs text-stone-400 flex-shrink-0 hidden sm:block">
          {uniqueCards.filter(matchesFilter).length} cards · scroll →
        </span>
      </div>

      {/* Cross-cutting themes bar */}
      <CrossCuttingThemes activeTheme={activeTheme} onThemeToggle={toggleTheme} />

      {/* MOBILE: single-column swipe view (portrait only) */}
      <div className="md:hidden landscape:hidden flex-1 flex flex-col overflow-hidden">
        {/* Era header with prev/next */}
        <div className={`flex items-center justify-between px-3 py-2 border-b border-stone-200 flex-shrink-0 ${ERA_HEADER_COLOURS[currentEra]}`}>
          <button
            onClick={() => setEraIndex(i => Math.max(i - 1, 0))}
            disabled={safeEraIndex === 0}
            className="p-1.5 rounded-lg disabled:opacity-20 hover:bg-black/10 active:bg-black/20 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="font-bold text-sm">{ERA_LABELS[currentEra]}</div>
            <div className="text-xs opacity-70">{ERA_DATES[currentEra]}</div>
          </div>
          <button
            onClick={() => setEraIndex(i => Math.min(i + 1, eras.length - 1))}
            disabled={safeEraIndex === eras.length - 1}
            className="p-1.5 rounded-lg disabled:opacity-20 hover:bg-black/10 active:bg-black/20 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Era progress dots */}
        <div className="flex justify-center items-center gap-1.5 py-2 bg-white border-b border-stone-100 flex-shrink-0">
          {eras.map((era, i) => (
            <button
              key={era}
              onClick={() => setEraIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === safeEraIndex ? 'w-4 bg-stone-700' : 'w-1.5 bg-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Cards — swipeable */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-2"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mobileCards.length === 0 && (
            <p className="text-center text-stone-400 text-sm mt-12">No cards for this filter in this era.</p>
          )}
          {mobileCards.map(card => (
            <button
              key={card.id}
              onClick={() => setSelected(card)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all active:scale-[0.99] ${cardColourClass(card)} ${
                selected?.id === card.id
                  ? 'ring-2 ring-stone-700 ring-offset-1'
                  : themeClass(card.id, false)
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-xs mt-0.5">{cardTypeIcon(card)}</span>
                <div>
                  <div className="font-semibold leading-tight">{card.title}</div>
                  <div className="opacity-60 text-xs mt-0.5">{card.dateRange}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP: horizontal scroll view (also shown in landscape) */}
      <div className="hidden md:block landscape:block flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max">
          {eras.map(era => {
            const cards = uniqueCards
              .filter(c => getTimelineBucket(c) === era && matchesFilter(c))
              .sort((a, b) => getTimelineYear(a) - getTimelineYear(b));
            return (
              <div key={era} className="flex flex-col border-r border-stone-200 min-w-[200px] max-w-[220px]">
                <div className={`px-3 py-2 border-b border-stone-200 flex-shrink-0 ${ERA_HEADER_COLOURS[era]}`}>
                  <div className="font-bold text-sm">{ERA_LABELS[era]}</div>
                  <div className="text-xs opacity-70">{ERA_DATES[era]}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {cards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setSelected(card)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-all hover:shadow-md hover:scale-[1.02] active:scale-100 ${cardColourClass(card)} ${
                        selected?.id === card.id
                          ? 'ring-2 ring-stone-700 ring-offset-1'
                          : themeClass(card.id, false)
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="flex-shrink-0 text-[10px] mt-0.5">{cardTypeIcon(card)}</span>
                        <div>
                          <div className="font-semibold leading-tight">{card.title}</div>
                          <div className="opacity-60 mt-0.5">{card.dateRange}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <CardDetail
          card={selected}
          onClose={() => setSelected(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
