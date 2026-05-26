import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Check, X } from 'lucide-react';
import { type MigrationCard } from '@/data/cards';
import { uniqueCards, cardColourClass, ERA_ORDER, getTimelineBucket } from '@/lib/utils';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashCards() {
  const [deck, setDeck] = useState<MigrationCard[]>(() => shuffle([...uniqueCards]));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());
  const [eraFilter, setEraFilter] = useState('All');
  const [showFront, setShowFront] = useState(true); // just to re-trigger flip animation

  const eras = ['All', ...ERA_ORDER.filter(e => uniqueCards.some(c => getTimelineBucket(c) === e))];

  const filteredDeck = eraFilter === 'All'
    ? deck
    : deck.filter(c => getTimelineBucket(c) === eraFilter);

  const card = filteredDeck[index % Math.max(filteredDeck.length, 1)];
  const safeIndex = Math.min(index, Math.max(filteredDeck.length - 1, 0));

  const goNext = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setIndex(i => Math.min(i + 1, filteredDeck.length - 1)), 150);
  }, [filteredDeck.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150);
  }, []);

  const reshuffleAll = () => {
    setDeck(shuffle([...uniqueCards]));
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReview(new Set());
  };

  const markKnown = () => {
    if (!card) return;
    setKnown(prev => new Set([...prev, card.id]));
    goNext();
  };

  const markReview = () => {
    if (!card) return;
    setReview(prev => new Set([...prev, card.id]));
    goNext();
  };

  if (!card) return <div className="flex items-center justify-center h-full text-stone-400">No cards for this filter.</div>;

  const progress = filteredDeck.length > 0 ? ((safeIndex) / filteredDeck.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-4 py-4 gap-4">
      {/* Era filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-shrink-0 -mx-4 px-4">
        {eras.map(era => (
          <button
            key={era}
            onClick={() => { setEraFilter(era); setIndex(0); setFlipped(false); }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 ${
              eraFilter === era ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-300 text-stone-600 hover:border-stone-500'
            }`}
          >
            {era === 'All' ? 'All eras' : era}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-stone-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-stone-500 flex-shrink-0">{safeIndex + 1} / {filteredDeck.length}</span>
        <span className="text-xs text-green-600 font-medium">{known.size} known</span>
        <span className="text-xs text-orange-600 font-medium">{review.size} to review</span>
      </div>

      {/* Card */}
      <div
        className="flex-1 card-flip cursor-pointer"
        onClick={() => setFlipped(f => !f)}
        style={{ minHeight: 280 }}
      >
        <div className={`card-flip-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className={`card-flip-front w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center p-8 ${cardColourClass(card)}`}>
            <p className="text-xs uppercase tracking-widest opacity-60 mb-3">{card.timePeriod}</p>
            <h2 className="text-2xl font-bold text-center mb-2">{card.title}</h2>
            <p className="text-sm opacity-70 text-center">{card.dateRange}</p>
            <p className="text-xs opacity-40 mt-8">tap to flip</p>
          </div>
          {/* Back */}
          <div className={`card-flip-back w-full h-full rounded-2xl border-2 flex flex-col p-6 overflow-y-auto ${cardColourClass(card)}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">Key Facts — {card.title}</h3>
            <ul className="space-y-2 flex-1">
              {card.extractedKeyFacts.map((fact, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="opacity-40 flex-shrink-0">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-current border-opacity-20 space-y-1">
              <p className="text-xs opacity-60"><span className="font-semibold">Causes:</span> {card.timeline.causes}</p>
              <p className="text-xs opacity-60"><span className="font-semibold">Consequences:</span> {card.timeline.consequences}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={goPrev} disabled={safeIndex === 0}
          className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-30 transition-colors">
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-2">
          <button onClick={markReview}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-colors">
            <RotateCcw size={14} /> Review
          </button>
          <button onClick={markKnown}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors">
            <Check size={14} /> Got it
          </button>
        </div>

        <div className="flex gap-1">
          <button onClick={reshuffleAll}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors" title="Reshuffle">
            <Shuffle size={18} />
          </button>
          <button onClick={goNext} disabled={safeIndex >= filteredDeck.length - 1}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-30 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
