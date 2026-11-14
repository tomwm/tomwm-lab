import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildChatSystemPrompt } from '@/lib/prompts';
import type { ChatMessage, WizardAnswers, RiskAssessment } from '@/lib/types';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  let body: { messages: ChatMessage[]; wizardAnswers: WizardAnswers; assessment: RiskAssessment | null };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const { messages, wizardAnswers, assessment } = body;
  const systemPrompt = buildChatSystemPrompt(wizardAnswers, assessment);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      try {
        const anthropicMessages = messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const anthropicStream = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: anthropicMessages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            send(JSON.stringify({ text: event.delta.text }));
          }
        }

        send('[DONE]');
      } catch (err) {
        console.error('Chat stream error:', err);
        send(JSON.stringify({ error: 'Stream error' }));
        send('[DONE]');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
