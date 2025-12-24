import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ChatPage.module.css';
import { Sidebar } from '../../components/sidebar';
import { ChatHeader, MessageList, MessageInput } from '../../components/chat';
import { useChatStore } from '../../store/chatStore';
import { useUiStore } from '../../store/uiStore';

function ChatPage() {
  const { dialogId } = useParams();
  const navigate = useNavigate();

  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isStreaming,
    streamingMessageId,
    setActiveConversation,
    addConversation,
    deleteConversation,
    addMessage,
  } = useChatStore();

  const {
    sidebarOpen,
    toggleSidebar,
  } = useUiStore();

  useEffect(() => {
    if (dialogId && dialogId !== activeConversationId) {
      setActiveConversation(dialogId);
    }
  }, [dialogId, activeConversationId, setActiveConversation]);

  const handleSelectConversation = useCallback((id) => {
    navigate(`/chat/${id}`);
  }, [navigate]);

  const handleCreateConversation = useCallback(() => {
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addConversation(newConversation);
    navigate(`/chat/${newConversation.id}`);
  }, [addConversation, navigate]);

  const handleDeleteConversation = useCallback((id) => {
    deleteConversation(id);
    if (id === activeConversationId) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        navigate(`/chat/${remaining[0].id}`);
      } else {
        navigate('/');
      }
    }
  }, [deleteConversation, activeConversationId, conversations, navigate]);

  const handleSendMessage = useCallback((content) => {
    if (!activeConversationId) {
      handleCreateConversation();
      return;
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
  }, [activeConversationId, addMessage, handleCreateConversation]);

  const handleStopStreaming = useCallback(() => {
    // Will be implemented with streaming service
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = messages[activeConversationId] || [];

  return (
    <div className={styles.container}>
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        loading={isLoading}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <main className={styles.main}>
        <ChatHeader
          title={activeConversation?.title || 'New Chat'}
          showMenuButton={!sidebarOpen}
          onMenuClick={toggleSidebar}
        />

        <MessageList
          messages={currentMessages}
          streamingMessageId={streamingMessageId}
          loading={isLoading}
        />

        <MessageInput
          onSend={handleSendMessage}
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
          disabled={isLoading}
        />
      </main>
    </div>
  );
}

export default ChatPage;
