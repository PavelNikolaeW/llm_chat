import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  currentDialogId: null,
  messages: {},
  streamingContent: '',
  isStreaming: false,
  error: null,

  setCurrentDialog: (dialogId) => set({ currentDialogId: dialogId }),

  addMessage: (dialogId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [dialogId]: [...(state.messages[dialogId] || []), message],
      },
    })),

  setMessages: (dialogId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [dialogId]: messages,
      },
    })),

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
    }),

  finishStreaming: (result) => {
    const state = get();
    const { currentDialogId, streamingContent } = state;

    if (currentDialogId && streamingContent) {
      set((state) => ({
        isStreaming: false,
        streamingContent: '',
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

  setError: (error) => set({ error, isStreaming: false }),

  clearError: () => set({ error: null }),
}));
