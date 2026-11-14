import { STEP_TITLES } from '@/lib/wizardConfig';

interface WizardProgressProps {
  currentStep: number;
}

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        {STEP_TITLES.map((title, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                ${i < currentStep
                  ? 'bg-forest-500 border-forest-500 text-white'
                  : i === currentStep
                  ? 'bg-white border-forest-500 text-forest-600'
                  : 'bg-white border-gray-200 text-gray-400'}
              `}
            >
              {i < currentStep ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`mt-1 text-xs font-medium hidden md:block ${i === currentStep ? 'text-forest-600' : 'text-gray-400'}`}>
              {title}
            </span>
            {i < STEP_TITLES.length - 1 && (
              <div className={`absolute h-0.5 w-full transition-colors ${i < currentStep ? 'bg-forest-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      {/* Mobile: simple progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden md:hidden">
        <div
          className="h-full bg-forest-500 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 text-center md:hidden mt-1">
        Step {currentStep + 1} of {STEP_TITLES.length} — {STEP_TITLES[currentStep]}
      </p>
    </div>
  );
}
