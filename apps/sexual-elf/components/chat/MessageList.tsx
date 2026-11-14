'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/types';
import MessageBubble from './MessageBubble';
import StreamingMessage from './StreamingMessage';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export default function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg, i) => {
        // The last assistant message while streaming gets the streaming treatment
        const isLastAssistant =
          msg.role === 'assistant' && i === messages.length - 1 && isStreaming;
        if (isLastAssistant) {
          return <StreamingMessage key={i} content={msg.content} />;
        }
        return <MessageBubble key={i} message={msg} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}
