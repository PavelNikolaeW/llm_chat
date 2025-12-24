import styles from './ConversationList.module.css';
import ConversationItem from './ConversationItem';

function ConversationList({
  conversations = [],
  activeId,
  onSelect,
  onDelete,
  onEdit,
  loading = false,
}) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No conversations yet</p>
        <p className={styles.hint}>Start a new chat to begin</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeId}
          onClick={onSelect}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default ConversationList;
