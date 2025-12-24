import { ApiError } from './errors';

const DEFAULT_BASE_URL = '/api';

/**
 * SSE Streaming client for POST requests
 * Supports abort() via AbortController
 */
export class StreamingClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || DEFAULT_BASE_URL;
    this.getToken = config.getToken || (() => null);
  }

  /**
   * Create a streaming chat completion request
   * @param {Object} data - Request payload
   * @param {Object} callbacks - Event callbacks
   * @returns {Object} - Controller with abort() method
   */
  chatCompletion(data, callbacks = {}) {
    const { onMessage, onError, onComplete } = callbacks;
    const abortController = new AbortController();

    const execute = async () => {
      try {
        const token = this.getToken();
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...data, stream: true }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || `HTTP error ${response.status}`,
            errorData.code || 'STREAM_ERROR',
            response.status,
            errorData.details
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              processSSEBuffer(buffer, onMessage);
            }
            onComplete?.();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                onComplete?.();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                onMessage?.(parsed);
              } catch {
                // Skip non-JSON data lines
              }
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // Request was aborted - not an error
          return;
        }

        const apiError = error instanceof ApiError
          ? error
          : new ApiError(
              error.message || 'Streaming error',
              'STREAM_ERROR',
              null,
              { originalError: error.name }
            );

        onError?.(apiError);
      }
    };

    // Start execution
    execute();

    // Return controller
    return {
      abort: () => abortController.abort(),
      signal: abortController.signal,
    };
  }
}

/**
 * Process SSE buffer for remaining data
 */
function processSSEBuffer(buffer, onMessage) {
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          onMessage?.(parsed);
        } catch {
          // Skip non-JSON data
        }
      }
    }
  }
}

// Singleton instance
let streamingClient = null;
let clientConfig = {};

/**
 * Configure the singleton streaming client
 */
export function configureStreaming(config) {
  clientConfig = { ...clientConfig, ...config };
  streamingClient = new StreamingClient(clientConfig);
  return streamingClient;
}

/**
 * Get the configured streaming client
 */
export function getStreamingClient() {
  if (!streamingClient) {
    streamingClient = new StreamingClient(clientConfig);
  }
  return streamingClient;
}

/**
 * Reset client (useful for testing)
 */
export function resetStreamingClient() {
  streamingClient = null;
  clientConfig = {};
}

export default {
  StreamingClient,
  configureStreaming,
  getStreamingClient,
  resetStreamingClient,
};
