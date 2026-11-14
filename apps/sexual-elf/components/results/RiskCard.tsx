import type { RiskItem } from '@/lib/types';
import RiskBadge from './RiskBadge';

const borderColors = {
  low: 'border-l-forest-400',
  medium: 'border-l-gold-400',
  high: 'border-l-red-500',
  unknown: 'border-l-gray-300',
};

interface RiskCardProps {
  item: RiskItem;
}

export default function RiskCard({ item }: RiskCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${borderColors[item.level]} shadow-sm p-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-serif font-semibold text-gray-800 text-base">{item.category}</h3>
        <RiskBadge level={item.level} />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">{item.headline}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{item.explanation}</p>
    </div>
  );
}
