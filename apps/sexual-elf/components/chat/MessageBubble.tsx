import type { ChatMessage } from '@/lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-forest-500 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm italic font-serif'
        }`}
      >
        {message.content || (
          <span className="opacity-50 not-italic font-sans text-xs">…</span>
        )}
      </div>
    </div>
  );
}
