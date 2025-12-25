import { useRef, useEffect, useCallback, useState } from 'react';
import styles from './MessageList.module.css';
import MessageItem from './MessageItem';

const VIRTUALIZATION_THRESHOLD = 100;
const VISIBLE_BUFFER = 10;

function MessageList({
  messages = [],
  streamingMessageId = null,
  onLoadMore,
  hasMore = false,
  loading = false,
  error = null,
  onRetry,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [autoScroll, setAutoScroll] = useState(true);

  const shouldVirtualize = messages.length > VIRTUALIZATION_THRESHOLD;

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom('auto');
    }
  }, [messages.length, autoScroll, scrollToBottom]);

  useEffect(() => {
    if (streamingMessageId && autoScroll) {
      scrollToBottom('auto');
    }
  }, [streamingMessageId, autoScroll, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);

    if (scrollTop < 100 && hasMore && !loading) {
      onLoadMore?.();
    }

    if (shouldVirtualize) {
      const itemHeight = 100;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - VISIBLE_BUFFER);
      const visibleCount = Math.ceil(clientHeight / itemHeight) + VISIBLE_BUFFER * 2;
      const end = Math.min(messages.length, start + visibleCount);

      setVisibleRange({ start, end });
    }
  }, [hasMore, loading, onLoadMore, shouldVirtualize, messages.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const renderMessages = () => {
    if (!shouldVirtualize) {
      return messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isStreaming={message.id === streamingMessageId}
        />
      ));
    }

    const { start, end } = visibleRange;
    const visibleMessages = messages.slice(start, end);
    const topPadding = start * 100;
    const bottomPadding = (messages.length - end) * 100;

    return (
      <>
        {topPadding > 0 && <div style={{ height: topPadding }} />}
        {visibleMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
          />
        ))}
        {bottomPadding > 0 && <div style={{ height: bottomPadding }} />}
      </>
    );
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {loading && (
        <div className={styles.loadingTop}>
          <div className={styles.spinner} />
          Loading more...
        </div>
      )}

      {messages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💬</div>
          <h3>No messages yet</h3>
          <p>Start a conversation by typing a message below</p>
        </div>
      ) : (
        <div className={styles.messages}>
          {renderMessages()}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          {onRetry && (
            <button onClick={onRetry} className={styles.retryButton}>
              Retry
            </button>
          )}
        </div>
      )}

      <div ref={bottomRef} />

      {!autoScroll && messages.length > 0 && (
        <button
          className={styles.scrollButton}
          onClick={() => {
            setAutoScroll(true);
            scrollToBottom();
          }}
          aria-label="Scroll to bottom"
        >
          ↓
        </button>
      )}
    </div>
  );
}

export default MessageList;
