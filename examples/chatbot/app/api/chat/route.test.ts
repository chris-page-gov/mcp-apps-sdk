import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalApiKey = vi.hoisted(() => process.env.OPENAI_API_KEY);

const {
  openaiMock,
  streamResponse,
  toUIMessageStreamResponseMock,
  streamTextMock,
  convertToModelMessagesMock,
  createVercelAIToolsMock,
  getMCPClientMock,
} = vi.hoisted(() => {
  const response = new Response('mock stream');
  const toResponse = vi.fn(() => response);

  return {
    openaiMock: vi.fn(() => 'mock-model'),
    streamResponse: response,
    toUIMessageStreamResponseMock: toResponse,
    streamTextMock: vi.fn(() => ({
      toUIMessageStreamResponse: toResponse,
    })),
    convertToModelMessagesMock: vi.fn(() => 'converted-messages'),
    createVercelAIToolsMock: vi.fn(async () => 'mock-tools'),
    getMCPClientMock: vi.fn(async () => 'mock-client'),
  };
});

vi.mock('@ai-sdk/openai', () => ({
  openai: openaiMock,
}));

vi.mock('ai', () => ({
  streamText: streamTextMock,
  convertToModelMessages: convertToModelMessagesMock,
}));

vi.mock('@xalia/mcp-apps-sdk', () => ({
  createVercelAITools: createVercelAIToolsMock,
}));

vi.mock('@/lib/mcpSetup', () => ({
  getMCPClient: getMCPClientMock,
}));

import { POST } from './route';

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }
});

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    toUIMessageStreamResponseMock.mockReturnValue(streamResponse);
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse: toUIMessageStreamResponseMock,
    });
    convertToModelMessagesMock.mockReturnValue('converted-messages');
    createVercelAIToolsMock.mockResolvedValue('mock-tools');
    getMCPClientMock.mockResolvedValue('mock-client');
    openaiMock.mockReturnValue('mock-model');
  });

  it('normalizes messages and invokes the OpenAI stream', async () => {
    const requestPayload = {
      messages: [
        {
          id: 'user-1',
          role: 'user',
          content: 'Hello from test',
        },
      ],
    };

    const request = new Request('http://localtest.me/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const response = await POST(request);

    expect(getMCPClientMock).toHaveBeenCalledTimes(1);
    expect(createVercelAIToolsMock).toHaveBeenCalledWith('mock-client', {
      onWidgetFetch: expect.any(Function),
    });

    expect(openaiMock).toHaveBeenCalledWith('gpt-4o');
    expect(convertToModelMessagesMock).toHaveBeenCalledTimes(1);

    const convertCall = convertToModelMessagesMock.mock.calls[0] as any[] | undefined;
    const convertArgs = (convertCall?.[0] ?? []) as any[];
    expect(convertArgs).toHaveLength(1);

    const firstArg = convertArgs[0]!;
    expect(firstArg).toMatchObject({
      role: 'user',
      parts: [
        { type: 'text', text: 'Hello from test' },
      ],
    });
    expect(firstArg).not.toHaveProperty('id');

    expect(streamTextMock).toHaveBeenCalledWith({
      model: 'mock-model',
      messages: 'converted-messages',
      tools: 'mock-tools',
    });

    expect(toUIMessageStreamResponseMock).toHaveBeenCalledTimes(1);
    expect(response).toBe(streamResponse);
  });

  it('returns 500 when OPENAI_API_KEY is missing', async () => {
    const request = new Request('http://localtest.me/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ messages: [] }),
    });

    delete process.env.OPENAI_API_KEY;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: 'OPENAI_API_KEY is not configured. Set it before calling this endpoint.',
    });
    expect(openaiMock).not.toHaveBeenCalled();
  });
});
