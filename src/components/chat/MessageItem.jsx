import { memo } from 'react';
import styles from './MessageItem.module.css';
import { Avatar } from '../common';

function MessageItem({ message, isStreaming = false }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}
      data-message-id={message.id}
    >
      <div className={styles.avatar}>
        <Avatar
          name={isUser ? 'You' : 'AI'}
          size="small"
          className={isAssistant ? styles.aiAvatar : ''}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.role}>{isUser ? 'You' : 'Assistant'}</span>
          {message.timestamp && (
            <span className={styles.time}>{formatTime(message.timestamp)}</span>
          )}
        </div>

        <div className={styles.body}>
          <MessageContent content={message.content} />
          {isStreaming && <span className={styles.cursor}>▊</span>}
        </div>

        {message.error && (
          <div className={styles.error}>
            Error: {message.error}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeContent = [];
  const elements = [];

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeContent = [];
      } else {
        elements.push(
          <pre key={`code-${index}`} className={styles.codeBlock}>
            <code className={codeLanguage ? styles[`lang-${codeLanguage}`] : ''}>
              {codeContent.join('\n')}
            </code>
          </pre>
        );
        inCodeBlock = false;
        codeLanguage = '';
        codeContent = [];
      }
    } else if (inCodeBlock) {
      codeContent.push(line);
    } else {
      elements.push(
        <p key={`line-${index}`} className={styles.paragraph}>
          {formatInlineContent(line)}
        </p>
      );
    }
  });

  if (inCodeBlock && codeContent.length > 0) {
    elements.push(
      <pre key="code-final" className={styles.codeBlock}>
        <code>{codeContent.join('\n')}</code>
      </pre>
    );
  }

  return <>{elements}</>;
}

function formatInlineContent(text) {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    { regex: /`([^`]+)`/g, render: (match) => <code key={key++} className={styles.inlineCode}>{match}</code> },
    { regex: /\*\*([^*]+)\*\*/g, render: (match) => <strong key={key++}>{match}</strong> },
    { regex: /\*([^*]+)\*/g, render: (match) => <em key={key++}>{match}</em> },
  ];

  const combinedRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const matches = text.split(combinedRegex);

  matches.forEach((part, index) => {
    if (!part) return;

    if (part.startsWith('`') && part.endsWith('`')) {
      parts.push(<code key={index} className={styles.inlineCode}>{part.slice(1, -1)}</code>);
    } else if (part.startsWith('**') && part.endsWith('**')) {
      parts.push(<strong key={index}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      parts.push(<em key={index}>{part.slice(1, -1)}</em>);
    } else {
      parts.push(part);
    }
  });

  return parts.length > 0 ? parts : text;
}

export default memo(MessageItem);
