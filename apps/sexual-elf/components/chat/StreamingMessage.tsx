import ElfTyping from '@/components/elf/ElfTyping';

interface StreamingMessageProps {
  content: string;
}

export default function StreamingMessage({ content }: StreamingMessageProps) {
  if (!content) return <ElfTyping />;
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-white border border-gray-100 text-gray-800 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed italic font-serif">
        {content}
        <span className="inline-block w-1 h-4 bg-forest-400 ml-1 animate-pulse align-text-bottom" />
      </div>
    </div>
  );
}
