import {
  StreamingClient,
  configureStreaming,
  getStreamingClient,
  resetStreamingClient,
} from './streaming';
import { ApiError } from './errors';

describe('StreamingClient', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    resetStreamingClient();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('constructor', () => {
    it('should use default config', () => {
      const client = new StreamingClient();
      expect(client.baseURL).toBe('/api');
    });

    it('should use custom config', () => {
      const client = new StreamingClient({
        baseURL: 'https://api.example.com',
      });
      expect(client.baseURL).toBe('https://api.example.com');
    });
  });

  describe('chatCompletion', () => {
    it('should return controller with abort method', () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: createMockReadableStream([]),
      });

      const client = new StreamingClient();
      const controller = client.chatCompletion({}, {});

      expect(controller).toHaveProperty('abort');
      expect(controller).toHaveProperty('signal');
      expect(typeof controller.abort).toBe('function');
    });

    it('should call fetch with correct parameters', async () => {
      const mockStream = createMockReadableStream(['data: {"content":"Hi"}\n\n']);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const getToken = jest.fn().mockReturnValue('test-token');
      const client = new StreamingClient({ baseURL: '/api', getToken });

      const onComplete = jest.fn();

      client.chatCompletion(
        { model: 'gpt-4', messages: [] },
        { onComplete }
      );

      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': 'Bearer test-token',
          }),
          body: JSON.stringify({ model: 'gpt-4', messages: [], stream: true }),
        })
      );
    });

    it('should not include Authorization header when no token', async () => {
      const mockStream = createMockReadableStream([]);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const client = new StreamingClient();
      client.chatCompletion({}, {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      const callHeaders = global.fetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });

    it('should parse SSE messages and call onMessage', async () => {
      const mockData = [
        'data: {"id":"1","content":"Hello"}\n\n',
        'data: {"id":"2","content":" World"}\n\n',
      ];
      const mockStream = createMockReadableStream(mockData);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onMessage = jest.fn();
      const onComplete = jest.fn();

      const client = new StreamingClient();
      client.chatCompletion({}, { onMessage, onComplete });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onMessage).toHaveBeenCalledWith({ id: '1', content: 'Hello' });
      expect(onMessage).toHaveBeenCalledWith({ id: '2', content: ' World' });
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle [DONE] message', async () => {
      const mockData = [
        'data: {"content":"Hi"}\n\n',
        'data: [DONE]\n\n',
      ];
      const mockStream = createMockReadableStream(mockData);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onMessage = jest.fn();
      const onComplete = jest.fn();

      const client = new StreamingClient();
      client.chatCompletion({}, { onMessage, onComplete });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onMessage).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle HTTP error response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          message: 'Bad request',
          code: 'BAD_REQUEST',
        }),
      });

      const onError = jest.fn();
      const client = new StreamingClient();

      client.chatCompletion({}, { onError });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onError).toHaveBeenCalled();
      const error = onError.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Bad request');
      expect(error.status).toBe(400);
    });

    it('should handle HTTP error with no JSON body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('No JSON')),
      });

      const onError = jest.fn();
      const client = new StreamingClient();

      client.chatCompletion({}, { onError });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onError).toHaveBeenCalled();
      const error = onError.mock.calls[0][0];
      expect(error.message).toBe('HTTP error 500');
    });

    it('should handle abort without error', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      global.fetch = jest.fn().mockRejectedValue(abortError);

      const onError = jest.fn();
      const onComplete = jest.fn();

      const client = new StreamingClient();
      const controller = client.chatCompletion({}, { onError, onComplete });

      controller.abort();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not call onError for abort
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network failed'));

      const onError = jest.fn();
      const client = new StreamingClient();

      client.chatCompletion({}, { onError });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onError).toHaveBeenCalled();
      const error = onError.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('STREAM_ERROR');
    });

    it('should skip non-JSON data lines', async () => {
      const mockData = [
        'data: {"content":"Valid"}\n\n',
        'data: not-json\n\n',
        'data: {"content":"Also valid"}\n\n',
      ];
      const mockStream = createMockReadableStream(mockData);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onMessage = jest.fn();

      const client = new StreamingClient();
      client.chatCompletion({}, { onMessage });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onMessage).toHaveBeenCalledTimes(2);
      expect(onMessage).toHaveBeenCalledWith({ content: 'Valid' });
      expect(onMessage).toHaveBeenCalledWith({ content: 'Also valid' });
    });

    it('should handle multi-line data chunks', async () => {
      // Simulate data coming in chunks that split across SSE messages
      const mockData = [
        'data: {"content":"First"}\ndata: {"con',
        'tent":"Second"}\n\n',
      ];
      const mockStream = createMockReadableStream(mockData);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onMessage = jest.fn();

      const client = new StreamingClient();
      client.chatCompletion({}, { onMessage });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onMessage).toHaveBeenCalledWith({ content: 'First' });
      expect(onMessage).toHaveBeenCalledWith({ content: 'Second' });
    });
  });

  describe('singleton functions', () => {
    it('configureStreaming should create and return client', () => {
      const client = configureStreaming({ baseURL: 'https://test.com' });

      expect(client).toBeInstanceOf(StreamingClient);
      expect(client.baseURL).toBe('https://test.com');
    });

    it('getStreamingClient should create client on first call', () => {
      const client = getStreamingClient();
      expect(client).toBeInstanceOf(StreamingClient);
    });

    it('getStreamingClient should return same client on subsequent calls', () => {
      const client1 = getStreamingClient();
      const client2 = getStreamingClient();

      expect(client1).toBe(client2);
    });

    it('configureStreaming should merge configuration', () => {
      configureStreaming({ baseURL: 'https://test.com' });
      resetStreamingClient();

      const getToken = jest.fn().mockReturnValue('token');
      configureStreaming({ getToken });

      const client = getStreamingClient();

      // Call getToken to verify it was configured
      expect(client.getToken()).toBe('token');
    });

    it('resetStreamingClient should reset singleton', () => {
      const client1 = getStreamingClient();
      resetStreamingClient();
      const client2 = getStreamingClient();

      expect(client1).not.toBe(client2);
    });
  });
});

// Helper to create mock ReadableStream
function createMockReadableStream(chunks, delay = 0) {
  let index = 0;

  return {
    getReader: () => ({
      read: async () => {
        if (delay) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        if (index < chunks.length) {
          const chunk = chunks[index++];
          return {
            done: false,
            value: new TextEncoder().encode(chunk),
          };
        }

        return { done: true, value: undefined };
      },
    }),
  };
}
