import { useState, useRef, useEffect } from 'react';
import styles from './MessageInput.module.css';
import { Button } from '../common';

function MessageInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder = 'Type a message...',
}) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isStreaming) {
      onSend?.(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStop = () => {
    onStop?.();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
      </div>

      <div className={styles.actions}>
        {isStreaming ? (
          <Button
            type="button"
            variant="danger"
            onClick={handleStop}
          >
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || !message.trim()}
          >
            Send
          </Button>
        )}
      </div>
    </form>
  );
}

export default MessageInput;
