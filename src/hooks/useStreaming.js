import { useState, useCallback, useRef } from 'react';
import { getStreamingClient } from '../services/api/streaming';
import { useChatStore } from '../store/chatStore';

export function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const {
    addMessage,
    updateMessage,
    setStreamingMessageId,
    activeConversationId,
  } = useChatStore();

  const startStreaming = useCallback(async (userMessage, options = {}) => {
    const { model = 'gpt-4', onComplete } = options;

    if (!activeConversationId) {
      setError('No active conversation');
      return;
    }

    // Add user message
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    // Create assistant message placeholder
    const assistantMsgId = `msg-${Date.now() + 1}`;
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    addMessage(assistantMsg);

    setIsStreaming(true);
    setError(null);
    setStreamingMessageId(assistantMsgId);

    let accumulatedContent = '';

    const client = getStreamingClient();
    controllerRef.current = client.chatCompletion(
      {
        model,
        messages: buildMessagesPayload(userMessage),
      },
      {
        onMessage: (data) => {
          const content = extractContent(data);
          if (content) {
            accumulatedContent += content;
            updateMessage(assistantMsgId, { content: accumulatedContent });
          }
        },
        onError: (err) => {
          setError(err.message || 'Streaming error');
          updateMessage(assistantMsgId, {
            content: accumulatedContent || 'Error occurred',
            error: err.message,
          });
          setIsStreaming(false);
          setStreamingMessageId(null);
          controllerRef.current = null;
        },
        onComplete: () => {
          setIsStreaming(false);
          setStreamingMessageId(null);
          controllerRef.current = null;
          onComplete?.();
        },
      }
    );
  }, [activeConversationId, addMessage, updateMessage, setStreamingMessageId]);

  const stopStreaming = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
  }, [setStreamingMessageId]);

  const retry = useCallback((lastUserMessage, options = {}) => {
    setError(null);
    startStreaming(lastUserMessage, options);
  }, [startStreaming]);

  return {
    isStreaming,
    error,
    startStreaming,
    stopStreaming,
    retry,
  };
}

function buildMessagesPayload(userMessage) {
  return [
    { role: 'user', content: userMessage },
  ];
}

function extractContent(data) {
  // OpenAI format
  if (data.choices?.[0]?.delta?.content) {
    return data.choices[0].delta.content;
  }
  // Anthropic format
  if (data.delta?.text) {
    return data.delta.text;
  }
  // Direct content
  if (typeof data.content === 'string') {
    return data.content;
  }
  return null;
}

export default useStreaming;
