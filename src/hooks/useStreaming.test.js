import { renderHook, act } from '@testing-library/react';
import { useStreaming } from './useStreaming';
import { useChatStore } from '../store/chatStore';
import * as streamingModule from '../services/api/streaming';

jest.mock('../services/api/streaming');

describe('useStreaming', () => {
  let mockController;

  beforeEach(() => {
    jest.clearAllMocks();

    mockController = {
      abort: jest.fn(),
    };

    streamingModule.getStreamingClient.mockReturnValue({
      chatCompletion: jest.fn().mockReturnValue(mockController),
    });

    act(() => {
      useChatStore.setState({
        conversations: [],
        activeConversationId: 'conv-1',
        messages: {},
        streamingContent: '',
        streamingMessageId: null,
        isStreaming: false,
        error: null,
        isLoading: false,
        currentDialogId: 'conv-1',
      });
    });
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useStreaming());

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.startStreaming).toBe('function');
    expect(typeof result.current.stopStreaming).toBe('function');
    expect(typeof result.current.retry).toBe('function');
  });

  it('should start streaming and add messages', async () => {
    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    expect(result.current.isStreaming).toBe(true);

    const state = useChatStore.getState();
    const messages = state.messages['conv-1'];
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Hello');
    expect(messages[1].role).toBe('assistant');
  });

  it('should set error when no active conversation', async () => {
    act(() => {
      useChatStore.setState({ activeConversationId: null });
    });

    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    expect(result.current.error).toBe('No active conversation');
  });

  it('should stop streaming', async () => {
    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    await act(async () => {
      result.current.stopStreaming();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(mockController.abort).toHaveBeenCalled();
  });

  it('should handle onMessage callback', async () => {
    let onMessageCallback;

    streamingModule.getStreamingClient.mockReturnValue({
      chatCompletion: jest.fn((data, callbacks) => {
        onMessageCallback = callbacks.onMessage;
        return mockController;
      }),
    });

    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    await act(async () => {
      onMessageCallback({ choices: [{ delta: { content: 'Hi' } }] });
    });

    const state = useChatStore.getState();
    const messages = state.messages['conv-1'];
    const assistantMessage = messages.find((m) => m.role === 'assistant');
    expect(assistantMessage.content).toBe('Hi');
  });

  it('should handle onError callback', async () => {
    let onErrorCallback;

    streamingModule.getStreamingClient.mockReturnValue({
      chatCompletion: jest.fn((data, callbacks) => {
        onErrorCallback = callbacks.onError;
        return mockController;
      }),
    });

    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    await act(async () => {
      onErrorCallback({ message: 'API Error' });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('should handle onComplete callback', async () => {
    let onCompleteCallback;

    streamingModule.getStreamingClient.mockReturnValue({
      chatCompletion: jest.fn((data, callbacks) => {
        onCompleteCallback = callbacks.onComplete;
        return mockController;
      }),
    });

    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    await act(async () => {
      onCompleteCallback();
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it('should retry with last message', async () => {
    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('First message');
    });

    await act(async () => {
      result.current.stopStreaming();
    });

    await act(async () => {
      result.current.retry('Retry message');
    });

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should extract content from OpenAI format', async () => {
    let onMessageCallback;

    streamingModule.getStreamingClient.mockReturnValue({
      chatCompletion: jest.fn((data, callbacks) => {
        onMessageCallback = callbacks.onMessage;
        return mockController;
      }),
    });

    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    await act(async () => {
      onMessageCallback({ choices: [{ delta: { content: 'OpenAI' } }] });
    });

    const state = useChatStore.getState();
    const assistantMsg = state.messages['conv-1'].find((m) => m.role === 'assistant');
    expect(assistantMsg.content).toBe('OpenAI');
  });

  it('should extract content from Anthropic format', async () => {
    let onMessageCallback;

    streamingModule.getStreamingClient.mockReturnValue({
      chatCompletion: jest.fn((data, callbacks) => {
        onMessageCallback = callbacks.onMessage;
        return mockController;
      }),
    });

    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    await act(async () => {
      onMessageCallback({ delta: { text: 'Anthropic' } });
    });

    const state = useChatStore.getState();
    const assistantMsg = state.messages['conv-1'].find((m) => m.role === 'assistant');
    expect(assistantMsg.content).toBe('Anthropic');
  });

  it('should extract direct content format', async () => {
    let onMessageCallback;

    streamingModule.getStreamingClient.mockReturnValue({
      chatCompletion: jest.fn((data, callbacks) => {
        onMessageCallback = callbacks.onMessage;
        return mockController;
      }),
    });

    const { result } = renderHook(() => useStreaming());

    await act(async () => {
      result.current.startStreaming('Hello');
    });

    await act(async () => {
      onMessageCallback({ content: 'Direct' });
    });

    const state = useChatStore.getState();
    const assistantMsg = state.messages['conv-1'].find((m) => m.role === 'assistant');
    expect(assistantMsg.content).toBe('Direct');
  });
});
