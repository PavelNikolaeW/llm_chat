import { useRef, useEffect } from 'react';
import styles from './WidgetMessageList.module.css';

function WidgetMessageList({ messages = [], isStreaming = false }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💬</div>
          <p>How can I help you today?</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.role]}`}
          >
            <div className={styles.bubble}>
              {message.content || (
                isStreaming && message.role === 'assistant' ? (
                  <span className={styles.typing}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

export default WidgetMessageList;
