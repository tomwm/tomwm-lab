import ElfAvatar from '@/components/elf/ElfAvatar';
import ElfSpeechBubble from '@/components/elf/ElfSpeechBubble';
import type { RiskAssessment } from '@/lib/types';

interface ResultsNarrationProps {
  assessment: RiskAssessment;
}

export default function ResultsNarration({ assessment }: ResultsNarrationProps) {
  const expression = assessment.urgentCareNeeded
    ? 'concerned'
    : assessment.overallLevel === 'low'
    ? 'happy'
    : 'neutral';

  return (
    <div className="flex items-start gap-4">
      <ElfAvatar expression={expression} size={80} className="shrink-0 mt-1" />
      <div className="flex-1">
        <ElfSpeechBubble>{assessment.elfNarration}</ElfSpeechBubble>
      </div>
    </div>
  );
}
