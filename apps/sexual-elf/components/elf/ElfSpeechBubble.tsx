import { ReactNode } from 'react';

interface ElfSpeechBubbleProps {
  children: ReactNode;
  className?: string;
}

export default function ElfSpeechBubble({ children, className = '' }: ElfSpeechBubbleProps) {
  return (
    <div
      className={`relative bg-cream-100 border-l-4 border-forest-500 rounded-lg px-5 py-4 shadow-sm ${className}`}
    >
      <div className="absolute -left-3 top-5 w-3 h-3 bg-cream-100 border-l-4 border-b-4 border-forest-500 rotate-45" />
      <p className="italic font-serif text-forest-700 leading-relaxed text-sm md:text-base">
        {children}
      </p>
    </div>
  );
}
