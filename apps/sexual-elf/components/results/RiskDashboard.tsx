'use client';

import { useRouter } from 'next/navigation';
import type { RiskAssessment } from '@/lib/types';
import ResultsNarration from './ResultsNarration';
import RiskCard from './RiskCard';
import ActionChecklist from './ActionChecklist';
import RiskBadge from './RiskBadge';
import Disclaimer from '@/components/ui/Disclaimer';
import Button from '@/components/ui/Button';

interface RiskDashboardProps {
  assessment: RiskAssessment;
  onReset: () => void;
}

export default function RiskDashboard({ assessment, onReset }: RiskDashboardProps) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full space-y-8">
      {/* PEP urgent banner */}
      {assessment.pepRecommended && (
        <div className="rounded-xl bg-red-600 text-white px-5 py-4 flex items-start gap-3 shadow-md">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-base">PEP may still be an option</p>
            <p className="text-sm mt-1 opacity-90">
              Post-exposure prophylaxis (PEP) can prevent HIV if started within 72 hours. Go to
              A&amp;E or a GUM clinic now. Don&apos;t wait.
            </p>
          </div>
        </div>
      )}

      {/* Overall level header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest-700 mb-2">
          Your Risk Assessment
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-gray-500">Overall risk level:</span>
          <RiskBadge level={assessment.overallLevel} size="lg" />
        </div>
      </div>

      {/* Elf narration */}
      <ResultsNarration assessment={assessment} />

      {/* Risk cards */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-gray-800 mb-3">Risk by Category</h2>
        <div className="grid gap-3">
          {assessment.risks.map((risk, i) => (
            <RiskCard key={i} item={risk} />
          ))}
        </div>
      </section>

      {/* Action checklist */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-gray-800 mb-3">Recommended Actions</h2>
        <ActionChecklist actions={assessment.actions} />
      </section>

      {/* Disclaimer */}
      <Disclaimer />

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1"
          onClick={() => router.push('/chat')}
        >
          Chat with Sylvan →
        </Button>
        <Button
          variant="secondary"
          onClick={onReset}
          className="flex-1"
        >
          Start Over
        </Button>
      </div>
    </div>
  );
}
