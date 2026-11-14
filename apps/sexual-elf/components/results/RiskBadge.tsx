import type { RiskLevel } from '@/lib/types';

const configs: Record<RiskLevel, { label: string; classes: string }> = {
  low: {
    label: 'Low',
    classes: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  high: {
    label: 'High',
    classes: 'bg-red-50 text-red-700 border-red-200',
  },
  unknown: {
    label: 'Unknown',
    classes: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const { label, classes } = configs[level];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }[size];

  return (
    <span className={`inline-flex items-center font-semibold border rounded-full uppercase tracking-wide ${classes} ${sizeClasses}`}>
      {label}
    </span>
  );
}
