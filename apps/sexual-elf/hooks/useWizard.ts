'use client';

import { useAppContext } from '@/context/AppContext';
import { TOTAL_STEPS } from '@/lib/wizardConfig';

export function useWizard() {
  const {
    wizardStep,
    wizardAnswers,
    wizardComplete,
    setWizardAnswer,
    nextStep,
    prevStep,
    completeWizard,
  } = useAppContext();

  const isFirstStep = wizardStep === 0;
  const isLastStep = wizardStep === TOTAL_STEPS - 1;
  const progress = ((wizardStep + 1) / TOTAL_STEPS) * 100;

  function goNext() {
    if (isLastStep) {
      completeWizard();
    } else {
      nextStep();
    }
  }

  function goPrev() {
    if (!isFirstStep) {
      prevStep();
    }
  }

  return {
    wizardStep,
    wizardAnswers,
    wizardComplete,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps: TOTAL_STEPS,
    setWizardAnswer,
    goNext,
    goPrev,
    completeWizard,
  };
}
