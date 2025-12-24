import { useState, useEffect } from 'react';
import styles from './ChatWidget.module.css';

function ChatWidget({ apiUrl, token, position, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState(token);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleTokenUpdate = (e) => setCurrentToken(e.detail);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('llm-widget:token', handleTokenUpdate);
    window.addEventListener('llm-widget:open', handleOpen);
    window.addEventListener('llm-widget:close', handleClose);

    return () => {
      window.removeEventListener('llm-widget:token', handleTokenUpdate);
      window.removeEventListener('llm-widget:open', handleOpen);
      window.removeEventListener('llm-widget:close', handleClose);
    };
  }, []);

  const positionClass = styles[position.replace('-', '')] || styles.bottomright;

  return (
    <div className={`${styles.widget} ${positionClass}`}>
      {isOpen ? (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span>LLM Gateway</span>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>
          <div className={styles.body}>
            <p>Chat widget content</p>
            <p>API: {apiUrl}</p>
          </div>
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
