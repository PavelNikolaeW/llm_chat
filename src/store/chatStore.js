import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  // Conversations
  conversations: [],
  activeConversationId: null,

  // Messages (keyed by conversationId)
  messages: {},

  // Streaming state
  streamingContent: '',
  streamingMessageId: null,
  isStreaming: false,

  // Error state
  error: null,
  isLoading: false,

  // Legacy alias
  currentDialogId: null,

  // Conversation actions
  setActiveConversation: (conversationId) =>
    set({
      activeConversationId: conversationId,
      currentDialogId: conversationId,
    }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    })),

  deleteConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([key]) => key !== conversationId)
      ),
      activeConversationId:
        state.activeConversationId === conversationId
          ? null
          : state.activeConversationId,
    })),

  // Legacy alias
  setCurrentDialog: (dialogId) =>
    set({
      currentDialogId: dialogId,
      activeConversationId: dialogId,
    }),

  // Message actions
  addMessage: (messageOrDialogId, messageArg) => {
    // Support both signatures: addMessage(message) and addMessage(dialogId, message)
    if (messageArg === undefined) {
      // New signature: addMessage(message)
      const message = messageOrDialogId;
      const { activeConversationId } = get();
      if (!activeConversationId) return;

      set((state) => ({
        messages: {
          ...state.messages,
          [activeConversationId]: [
            ...(state.messages[activeConversationId] || []),
            message,
          ],
        },
      }));
    } else {
      // Legacy signature: addMessage(dialogId, message)
      const dialogId = messageOrDialogId;
      const message = messageArg;

      set((state) => ({
        messages: {
          ...state.messages,
          [dialogId]: [...(state.messages[dialogId] || []), message],
        },
      }));
    }
  },

  updateMessage: (messageId, updates) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: (state.messages[activeConversationId] || []).map(
          (msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)
        ),
      },
    }));
  },

  deleteMessage: (messageId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: (state.messages[activeConversationId] || []).filter(
          (msg) => msg.id !== messageId
        ),
      },
    }));
  },

  setMessages: (dialogId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [dialogId]: messages,
      },
    })),

  // Streaming actions
  setStreamingMessageId: (messageId) =>
    set({ streamingMessageId: messageId }),

  startStreaming: () =>
    set({
      isStreaming: true,
      streamingContent: '',
      error: null,
    }),

  appendStreamingContent: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  stopStreaming: () =>
    set({
      isStreaming: false,
      streamingMessageId: null,
    }),

  finishStreaming: (result) => {
    const state = get();
    const { currentDialogId, streamingContent } = state;

    if (currentDialogId && streamingContent) {
      set((state) => ({
        isStreaming: false,
        streamingContent: '',
        streamingMessageId: null,
        messages: {
          ...state.messages,
          [currentDialogId]: [
            ...(state.messages[currentDialogId] || []),
            {
              id: result.messageId,
              role: 'assistant',
              content: streamingContent,
              prompt_tokens: result.promptTokens,
              completion_tokens: result.completionTokens,
              created_at: new Date().toISOString(),
            },
          ],
        },
      }));
    }
  },

  // Loading state
  setLoading: (isLoading) => set({ isLoading }),

  // Error handling
  setError: (error) => set({ error, isStreaming: false }),
  clearError: () => set({ error: null }),
}));
