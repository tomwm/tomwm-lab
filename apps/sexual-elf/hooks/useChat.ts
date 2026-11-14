'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';

export function useChat() {
  const {
    chatMessages,
    wizardAnswers,
    assessment,
    addChatMessage,
    updateLastAssistantMessage,
  } = useAppContext();

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return;
      setError(null);

      const userMessage = { role: 'user' as const, content: content.trim() };
      addChatMessage(userMessage);
      addChatMessage({ role: 'assistant', content: '' });
      setIsStreaming(true);

      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
        const res = await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...chatMessages, userMessage],
            wizardAnswers,
            assessment,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error('Chat request failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                updateLastAssistantMessage(accumulated);
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        updateLastAssistantMessage('Sorry, something went wrong. Please try again.');
      } finally {
        setIsStreaming(false);
      }
    },
    [chatMessages, wizardAnswers, assessment, addChatMessage, updateLastAssistantMessage, isStreaming]
  );

  return { chatMessages, isStreaming, error, sendMessage };
}
