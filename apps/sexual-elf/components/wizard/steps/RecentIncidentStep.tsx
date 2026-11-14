'use client';

import WizardField from '@/components/wizard/WizardField';
import { WIZARD_STEPS } from '@/lib/wizardConfig';
import type { WizardAnswers } from '@/lib/types';

interface Props {
  answers: WizardAnswers;
  onChange: (key: string, value: string | string[] | undefined) => void;
}

export default function RecentIncidentStep({ answers, onChange }: Props) {
  const step = WIZARD_STEPS[3];
  const hasIncident = answers.hasRecentIncident === 'yes';

  // Always show the first field (hasRecentIncident); show the rest only if yes
  const [firstField, ...conditionalFields] = step.fields;

  return (
    <div className="space-y-5">
      <WizardField field={firstField} answers={answers} onChange={onChange} />
      {hasIncident && (
        <>
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-5">
            {conditionalFields.map((field) => (
              <WizardField key={field.key} field={field} answers={answers} onChange={onChange} />
            ))}
          </div>
          {/* PEP urgency alert */}
          {answers.pepConsidered === 'no_within_72h' && (
            <div className="rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700">
              <strong>Time-sensitive:</strong> If you had receptive anal or vaginal sex with
              someone of unknown HIV status, PEP can prevent HIV — but only if started within
              72 hours. Attend A&amp;E or a GUM clinic now.
            </div>
          )}
        </>
      )}
    </div>
  );
}
