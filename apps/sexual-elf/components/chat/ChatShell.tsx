'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/context/AppContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ElfAvatar from '@/components/elf/ElfAvatar';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface ChatShellProps {
  hasAssessment: boolean;
}

export default function ChatShell({ hasAssessment }: ChatShellProps) {
  const { chatMessages, isStreaming, sendMessage } = useChat();
  const { assessment, resetAll, addChatMessage } = useAppContext();
  const router = useRouter();

  const greetedRef = useRef(false);

  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;

    const greeting = assessment?.urgentCareNeeded
      ? `I've looked over your assessment and I want to be upfront with you — there are a couple of things that need prompt attention. Let's talk through them. What questions do you have?`
      : assessment
      ? `Welcome back! I've had a good look at your results. Your overall risk level is ${assessment.overallLevel}. What would you like to explore or ask about?`
      : `Hi, I'm Sylvan — your sexual elf guide. I'm here to answer questions about STIs, testing, protection, and anything else on your mind. You can also take the full risk assessment if you'd like a personalised picture. What's on your mind?`;

    addChatMessage({ role: 'assistant', content: greeting });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleReset() {
    resetAll();
    router.push('/');
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <ElfAvatar
          expression={assessment?.urgentCareNeeded ? 'concerned' : 'neutral'}
          size={40}
        />
        <div className="flex-1">
          <h1 className="font-serif font-bold text-forest-700 text-sm leading-tight">
            Chat with Sylvan
          </h1>
          <p className="text-xs text-gray-400">Sexual health elf guide</p>
        </div>
        <div className="flex gap-2">
          {hasAssessment && (
            <Button variant="ghost" size="sm" onClick={() => router.push('/results')}>
              ← Results
            </Button>
          )}
          {!hasAssessment && (
            <Button variant="ghost" size="sm" onClick={() => router.push('/wizard')}>
              Take Assessment
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Start Over
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={chatMessages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
