'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/hooks/useWizard';
import { useAppContext } from '@/context/AppContext';
import WizardProgress from './WizardProgress';
import SexualHistoryStep from './steps/SexualHistoryStep';
import CurrentPracticesStep from './steps/CurrentPracticesStep';
import LifestyleFactorsStep from './steps/LifestyleFactorsStep';
import RecentIncidentStep from './steps/RecentIncidentStep';
import ElfAvatar from '@/components/elf/ElfAvatar';
import ElfSpeechBubble from '@/components/elf/ElfSpeechBubble';
import Button from '@/components/ui/Button';
import { WIZARD_STEPS } from '@/lib/wizardConfig';

const STEP_NARRATIONS = [
  "Let's start with a little background about you. All of this stays in your browser session — I never store a thing.",
  "Now, tell me about your practices. There's no judgement here — the more honest you are, the more useful I can be.",
  "Almost there! A few lifestyle questions that can affect your risk picture.",
  "Finally — did anything specific happen recently that's on your mind? This section is completely optional.",
];

export default function WizardShell() {
  const router = useRouter();
  const { wizardStep, wizardAnswers, isFirstStep, isLastStep, setWizardAnswer, goNext, goPrev } =
    useWizard();
  const { setAssessment, completeWizard } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepConfig = WIZARD_STEPS[wizardStep];

  async function handleNext() {
    if (isLastStep) {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
        const res = await fetch(`${base}/api/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wizardAnswers),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Assessment failed. Please try again.');
        }
        const assessment = await res.json();
        setAssessment(assessment);
        completeWizard();
        router.push('/results');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    } else {
      goNext();
    }
  }

  const stepComponents = [
    <SexualHistoryStep key={0} answers={wizardAnswers} onChange={setWizardAnswer} />,
    <CurrentPracticesStep key={1} answers={wizardAnswers} onChange={setWizardAnswer} />,
    <LifestyleFactorsStep key={2} answers={wizardAnswers} onChange={setWizardAnswer} />,
    <RecentIncidentStep key={3} answers={wizardAnswers} onChange={setWizardAnswer} />,
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      {/* Progress */}
      <div className="mb-8">
        <WizardProgress currentStep={wizardStep} />
      </div>

      {/* Elf narration */}
      <div className="flex items-start gap-4 mb-8">
        <ElfAvatar expression="neutral" size={64} className="shrink-0 mt-1" />
        <div className="flex-1">
          <ElfSpeechBubble>{STEP_NARRATIONS[wizardStep]}</ElfSpeechBubble>
        </div>
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-serif font-bold text-forest-700 mb-1">
          {stepConfig.title}
        </h2>
        <p className="text-sm text-gray-500 mb-6">{stepConfig.subtitle}</p>

        {stepComponents[wizardStep]}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="secondary"
          onClick={goPrev}
          disabled={isFirstStep || loading}
        >
          ← Back
        </Button>
        <Button onClick={handleNext} loading={loading} size="lg">
          {isLastStep ? (loading ? 'Analysing…' : 'Get My Assessment →') : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
