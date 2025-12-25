import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ChatPage.module.css';
import { Sidebar } from '../../components/sidebar';
import { ChatHeader, MessageList, MessageInput } from '../../components/chat';
import { OfflineBanner } from '../../components/common';
import { useChatStore } from '../../store/chatStore';
import { useUiStore } from '../../store/uiStore';
import { useStreaming, useOffline, useChatCache } from '../../hooks';

function ChatPage() {
  const { dialogId } = useParams();
  const navigate = useNavigate();

  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    streamingMessageId,
    setActiveConversation,
    addConversation,
    deleteConversation,
  } = useChatStore();

  const { sidebarOpen, toggleSidebar } = useUiStore();

  const {
    isStreaming,
    error: streamingError,
    startStreaming,
    stopStreaming,
    retry,
  } = useStreaming();

  const { isOffline, checkConnection } = useOffline();
  const { isHydrated } = useChatCache();

  useEffect(() => {
    if (dialogId && dialogId !== activeConversationId) {
      setActiveConversation(dialogId);
    }
  }, [dialogId, activeConversationId, setActiveConversation]);

  const handleSelectConversation = useCallback(
    (id) => {
      navigate(`/chat/${id}`);
    },
    [navigate]
  );

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

  const handleDeleteConversation = useCallback(
    (id) => {
      deleteConversation(id);
      if (id === activeConversationId) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0].id}`);
        } else {
          navigate('/');
        }
      }
    },
    [deleteConversation, activeConversationId, conversations, navigate]
  );

  const handleSendMessage = useCallback(
    (content) => {
      if (!activeConversationId) {
        // Create new conversation first
        const newConversation = {
          id: `conv-${Date.now()}`,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addConversation(newConversation);
        setActiveConversation(newConversation.id);
        navigate(`/chat/${newConversation.id}`);

        // Start streaming after state updates
        setTimeout(() => {
          startStreaming(content);
        }, 0);
      } else {
        startStreaming(content);
      }
    },
    [activeConversationId, addConversation, setActiveConversation, navigate, startStreaming]
  );

  const handleStopStreaming = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const handleRetry = useCallback(() => {
    const currentMessages = messages[activeConversationId] || [];
    const lastUserMessage = [...currentMessages]
      .reverse()
      .find((m) => m.role === 'user');

    if (lastUserMessage) {
      retry(lastUserMessage.content);
    }
  }, [messages, activeConversationId, retry]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const currentMessages = messages[activeConversationId] || [];

  if (!isHydrated) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <OfflineBanner isOffline={isOffline} onRetry={checkConnection} />
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
          error={streamingError}
          onRetry={handleRetry}
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
