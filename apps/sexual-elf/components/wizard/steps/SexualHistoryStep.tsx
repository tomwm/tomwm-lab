'use client';

import WizardField from '@/components/wizard/WizardField';
import { WIZARD_STEPS } from '@/lib/wizardConfig';
import type { WizardAnswers } from '@/lib/types';

interface Props {
  answers: WizardAnswers;
  onChange: (key: string, value: string | string[] | undefined) => void;
}

export default function SexualHistoryStep({ answers, onChange }: Props) {
  const step = WIZARD_STEPS[0];
  return (
    <div className="space-y-5">
      {step.fields.map((field) => (
        <WizardField key={field.key} field={field} answers={answers} onChange={onChange} />
      ))}
    </div>
  );
}
