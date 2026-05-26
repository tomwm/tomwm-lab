import { X, Link2 } from 'lucide-react';
import { type MigrationCard } from '@/data/cards';
import { uniqueCards, cardColourClass, cardTypeIcon } from '@/lib/utils';

interface Props {
  card: MigrationCard;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export default function CardDetail({ card, onClose, onNavigate }: Props) {
  const linked = card.timeline.links
    .map(id => uniqueCards.find(c => c.id === id))
    .filter(Boolean) as MigrationCard[];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-start justify-between gap-3 ${cardColourClass(card)}`}>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-70 mb-1">
              <span>{cardTypeIcon(card)}</span>
              <span>{card.cardType}</span>
            </div>
            <h2 className="text-xl font-bold">{card.title}</h2>
            <p className="text-sm mt-1 opacity-75">{card.dateRange} · {card.timePeriod}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0 mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Content */}
          <section>
            <p className="text-sm leading-relaxed text-stone-700">{card.cardContent}</p>
          </section>

          {/* Key Facts */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Key Facts</h3>
            <ul className="space-y-1.5">
              {card.extractedKeyFacts.map((fact, i) => (
                <li key={i} className="flex gap-2 text-sm text-stone-700">
                  <span className="text-stone-400 flex-shrink-0 mt-0.5">→</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Causes & Consequences */}
          <section className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1.5">Causes</h3>
              <p className="text-xs text-red-900 leading-relaxed">{card.timeline.causes}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1.5">Consequences</h3>
              <p className="text-xs text-green-900 leading-relaxed">{card.timeline.consequences}</p>
            </div>
          </section>

          {/* Tags */}
          {card.timeline.tags.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {card.timeline.tags.map(tag => (
                  <span key={tag} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Linked Cards */}
          {linked.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <Link2 size={12} /> Linked Topics
              </h3>
              <div className="space-y-1.5">
                {linked.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onNavigate(c.id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all hover:shadow-sm hover:scale-[1.01] ${cardColourClass(c)}`}
                  >
                    <span className="font-medium">{c.title}</span>
                    <span className="opacity-60 ml-2 text-xs">{c.dateRange}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
