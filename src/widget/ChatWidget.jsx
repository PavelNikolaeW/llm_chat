import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ChatWidget.module.css';
import WidgetMessageList from './WidgetMessageList';
import WidgetMessageInput from './WidgetMessageInput';

const WIDGET_EVENTS = {
  TOKEN: 'llm-widget:token',
  OPEN: 'llm-widget:open',
  CLOSE: 'llm-widget:close',
  TOGGLE: 'llm-widget:toggle',
  MINIMIZE: 'llm-widget:minimize',
  SEND: 'llm-widget:send',
  CLEAR: 'llm-widget:clear',
  MESSAGE_SENT: 'llm-widget:message-sent',
  MESSAGE_RECEIVED: 'llm-widget:message-received',
  ERROR: 'llm-widget:error',
};

function ChatWidget({ apiUrl, token: initialToken, position, theme, onEvent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentToken, setCurrentToken] = useState(initialToken);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-widget-theme', theme);
  }, [theme]);

  // Event handlers for external API
  useEffect(() => {
    const handleTokenUpdate = (e) => setCurrentToken(e.detail);
    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    const handleClose = () => setIsOpen(false);
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleMinimize = () => setIsMinimized((prev) => !prev);
    const handleClear = () => setMessages([]);
    const handleSend = (e) => {
      if (e.detail?.message) {
        sendMessage(e.detail.message);
      }
    };

    window.addEventListener(WIDGET_EVENTS.TOKEN, handleTokenUpdate);
    window.addEventListener(WIDGET_EVENTS.OPEN, handleOpen);
    window.addEventListener(WIDGET_EVENTS.CLOSE, handleClose);
    window.addEventListener(WIDGET_EVENTS.TOGGLE, handleToggle);
    window.addEventListener(WIDGET_EVENTS.MINIMIZE, handleMinimize);
    window.addEventListener(WIDGET_EVENTS.CLEAR, handleClear);
    window.addEventListener(WIDGET_EVENTS.SEND, handleSend);

    return () => {
      window.removeEventListener(WIDGET_EVENTS.TOKEN, handleTokenUpdate);
      window.removeEventListener(WIDGET_EVENTS.OPEN, handleOpen);
      window.removeEventListener(WIDGET_EVENTS.CLOSE, handleClose);
      window.removeEventListener(WIDGET_EVENTS.TOGGLE, handleToggle);
      window.removeEventListener(WIDGET_EVENTS.MINIMIZE, handleMinimize);
      window.removeEventListener(WIDGET_EVENTS.CLEAR, handleClear);
      window.removeEventListener(WIDGET_EVENTS.SEND, handleSend);
    };
  }, []);

  const emitEvent = useCallback((eventName, detail = {}) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    onEvent?.(eventName, detail);
  }, [onEvent]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isStreaming) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    const assistantMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setError(null);

    emitEvent(WIDGET_EVENTS.MESSAGE_SENT, { message: userMessage });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages.concat(userMessage).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || parsed.delta?.text || '';
              if (content) {
                accumulatedContent += content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }

      emitEvent(WIDGET_EVENTS.MESSAGE_RECEIVED, {
        message: { ...assistantMessage, content: accumulatedContent },
      });
    } catch (err) {
      if (err.name === 'AbortError') return;

      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      emitEvent(WIDGET_EVENTS.ERROR, { error: errorMessage });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: 'Sorry, an error occurred. Please try again.', error: true }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [apiUrl, currentToken, messages, isStreaming, emitEvent]);

  const handleClose = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsOpen(false);
  }, []);

  const positionClass = styles[position.replace('-', '')] || styles.bottomright;

  return (
    <div className={`${styles.widget} ${positionClass}`} data-widget-theme={theme}>
      {isOpen ? (
        <div className={`${styles.panel} ${isMinimized ? styles.minimized : ''}`}>
          <div className={styles.header}>
            <span className={styles.title}>LLM Gateway</span>
            <div className={styles.headerActions}>
              <button
                className={styles.headerBtn}
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
              >
                {isMinimized ? '□' : '−'}
              </button>
              <button
                className={styles.headerBtn}
                onClick={handleClose}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <WidgetMessageList messages={messages} isStreaming={isStreaming} />

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              <WidgetMessageInput
                onSend={sendMessage}
                disabled={isStreaming}
                placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
              />
            </>
          )}
        </div>
      ) : (
        <button
          className={styles.launcher}
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default ChatWidget;
export { WIDGET_EVENTS };
