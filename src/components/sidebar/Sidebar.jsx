import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import ConversationList from './ConversationList';
import { Button, Modal } from '../common';

function Sidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onEditConversation,
  loading = false,
  isOpen = true,
  onToggle,
}) {
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const handleDeleteClick = (id) => {
    setConversationToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation?.(conversationToDelete);
    }
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Chats</h2>
          <Button
            variant="primary"
            size="small"
            onClick={onCreateConversation}
          >
            + New
          </Button>
        </div>

        <div className={styles.content}>
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={onSelectConversation}
            onDelete={handleDeleteClick}
            onEdit={onEditConversation}
            loading={loading}
          />
        </div>

        <div className={styles.footer}>
          <button
            className={styles.settingsBtn}
            onClick={() => navigate('/settings')}
          >
            Settings
          </button>
        </div>

        {onToggle && (
          <button
            className={styles.toggleBtn}
            onClick={onToggle}
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        )}
      </aside>

      <Modal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        title="Delete Conversation"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
      </Modal>
    </>
  );
}

export default Sidebar;
