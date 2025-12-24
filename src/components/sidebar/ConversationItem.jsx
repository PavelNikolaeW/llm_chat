import styles from './ConversationItem.module.css';

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onEdit,
}) {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(conversation.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(conversation);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const dayMs = 24 * 60 * 60 * 1000;

    if (diff < dayMs) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * dayMs) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`${styles.item} ${isActive ? styles.active : ''}`}
      onClick={() => onClick?.(conversation.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(conversation.id)}
    >
      <div className={styles.content}>
        <div className={styles.title}>{conversation.title || 'New Chat'}</div>
        {conversation.lastMessage && (
          <div className={styles.preview}>{conversation.lastMessage}</div>
        )}
      </div>
      <div className={styles.meta}>
        {conversation.updatedAt && (
          <span className={styles.date}>{formatDate(conversation.updatedAt)}</span>
        )}
        <div className={styles.actions}>
          {onEdit && (
            <button
              className={styles.actionBtn}
              onClick={handleEdit}
              aria-label="Edit conversation"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className={styles.actionBtn}
              onClick={handleDelete}
              aria-label="Delete conversation"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationItem;
