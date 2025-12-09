'use client';

import { useChat } from '@ai-sdk/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AssistantAppEmbed } from '@xalia/mcp-apps-sdk';

export default function Chat() {
  const [input, setInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chat = useChat({
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(input, init);

      if (!response.ok) {
        const clone = response.clone();
        let message = 'Unable to reach the AI backend.';

        try {
          const data = await clone.json();
          if (data && typeof data.error === 'string') {
            message = data.error;
          }
        } catch {
          try {
            const text = await clone.text();
            if (text.trim().length > 0) {
              message = text.trim();
            }
          } catch {
            // ignore: fall back to default message
          }
        }

        setErrorMessage(message);
        throw new Error(message);
      }

      setErrorMessage(null);
      return response;
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Chat request failed.');
      }
    },
  } as any);

  const { messages, sendMessage } = chat;
  const isLoading = Boolean((chat as any).isLoading);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (input.trim().length === 0) {
      return;
    }

    try {
      await sendMessage({ text: input });
    } catch (error) {
      if (error instanceof Error && error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Chat request failed.');
      }
    } finally {
      setInput('');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          <div className="font-semibold mb-1">{message.role === 'user' ? 'User:' : 'AI:'}</div>
          {message.parts.map((part, index) => {
            if (part.type === 'text') {
              return <div key={`${message.id}-${index}`}>{part.text}</div>;
            }

            if (part.type.startsWith('tool-')) {
              const toolPart = part as any;

              if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                return (
                  <div
                    key={`${message.id}-${index}`}
                    className="text-sm text-zinc-500 dark:text-zinc-400 italic"
                  >
                    Calling tool...
                  </div>
                );
              }

              if (toolPart.state === 'output-error') {
                return (
                  <div
                    key={`${message.id}-${index}`}
                    className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                  >
                    {toolPart.errorText || 'Tool call failed.'}
                  </div>
                );
              }

              if (toolPart.state === 'output-available' && toolPart.output) {
                const result = toolPart.output;
                const hasWidget = result?.widgetHtml && result?.metadata?.['openai/widgetAccessible'];

                return (
                  <div key={`${message.id}-${index}`}>
                    {hasWidget ? (
                      <AssistantAppEmbed
                        html={result.widgetHtml}
                        toolOutput={result.structuredContent}
                        toolResponseMetadata={result.metadata}
                      />
                    ) : (
                      <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg">
                        {result?.text || JSON.stringify(result)}
                      </div>
                    )}
                  </div>
                );
              }
            }

            return null;
          })}
        </div>
      ))}

      {errorMessage && (
        <div
          className="mb-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-2xl p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={event => setInput(event.currentTarget.value)}
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
