import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { createVercelAITools } from '@xalia/mcp-apps-sdk';
import { getMCPClient } from '@/lib/mcpSetup';

type Message = {
  role: string;
  content?: unknown;
  parts?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

function ensureParts(message: Message): Message {
  if (Array.isArray(message.parts)) {
    return message;
  }

  if (typeof message.content === 'string') {
    return {
      ...message,
      parts: [{ type: 'text', text: message.content }],
    };
  }

  if (Array.isArray(message.content)) {
    const parts = message.content.map((part: any) => {
      if (typeof part === 'string') {
        return { type: 'text', text: part };
      }

      if (part && typeof part === 'object') {
        if (typeof part.type === 'string') {
          return part;
        }

        if ('text' in part && typeof part.text === 'string') {
          return { type: 'text', text: part.text };
        }
      }

      return { type: 'text', text: '' };
    });

    return {
      ...message,
      parts,
    };
  }

  return {
    ...message,
    parts: [],
  };
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const mcpClient = await getMCPClient();

  const tools = await createVercelAITools(mcpClient, {
    onWidgetFetch: async (uri, _html) => {
      console.log(`[Chat] Widget fetched from ${uri}`);
    },
  });

  const sanitizedMessages = messages.map(({ id: _unused, ...rest }: Message) => {
    void _unused;
    return ensureParts(rest);
  });

  const coreMessages = convertToModelMessages(sanitizedMessages as any, { tools } as any);

  const result = streamText({
    model: openai('gpt-4o'),
    messages: coreMessages,
    tools: tools as any,
  });

  return result.toUIMessageStreamResponse();
}
