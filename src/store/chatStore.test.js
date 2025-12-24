import { useChatStore } from './chatStore';
import { act } from '@testing-library/react';

describe('chatStore', () => {
  beforeEach(() => {
    act(() => {
      useChatStore.setState({
        currentDialogId: null,
        messages: {},
        streamingContent: '',
        isStreaming: false,
        error: null,
      });
    });
  });

  describe('initial state', () => {
    it('should have null currentDialogId', () => {
      expect(useChatStore.getState().currentDialogId).toBeNull();
    });

    it('should have empty messages', () => {
      expect(useChatStore.getState().messages).toEqual({});
    });

    it('should not be streaming', () => {
      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    it('should have empty streamingContent', () => {
      expect(useChatStore.getState().streamingContent).toBe('');
    });

    it('should have no error', () => {
      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('setCurrentDialog', () => {
    it('should set current dialog id', () => {
      act(() => {
        useChatStore.getState().setCurrentDialog('dialog-123');
      });
      expect(useChatStore.getState().currentDialogId).toBe('dialog-123');
    });
  });

  describe('addMessage', () => {
    it('should add message to dialog', () => {
      const dialogId = 'dialog-123';
      const message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      };

      act(() => {
        useChatStore.getState().addMessage(dialogId, message);
      });

      const messages = useChatStore.getState().messages[dialogId];
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('should append to existing messages', () => {
      const dialogId = 'dialog-123';
      const message1 = { id: 'msg-1', content: 'First' };
      const message2 = { id: 'msg-2', content: 'Second' };

      act(() => {
        useChatStore.getState().addMessage(dialogId, message1);
        useChatStore.getState().addMessage(dialogId, message2);
      });

      const messages = useChatStore.getState().messages[dialogId];
      expect(messages).toHaveLength(2);
    });
  });

  describe('setMessages', () => {
    it('should set messages for dialog', () => {
      const dialogId = 'dialog-123';
      const messages = [
        { id: 'msg-1', content: 'First' },
        { id: 'msg-2', content: 'Second' },
      ];

      act(() => {
        useChatStore.getState().setMessages(dialogId, messages);
      });

      expect(useChatStore.getState().messages[dialogId]).toEqual(messages);
    });

    it('should replace existing messages', () => {
      const dialogId = 'dialog-123';

      act(() => {
        useChatStore.getState().addMessage(dialogId, { id: 'old' });
        useChatStore.getState().setMessages(dialogId, [{ id: 'new' }]);
      });

      const messages = useChatStore.getState().messages[dialogId];
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe('new');
    });
  });

  describe('streaming', () => {
    it('startStreaming should set isStreaming and clear content', () => {
      act(() => {
        useChatStore.getState().startStreaming();
      });

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(true);
      expect(state.streamingContent).toBe('');
      expect(state.error).toBeNull();
    });

    it('appendStreamingContent should append chunks', () => {
      act(() => {
        useChatStore.getState().startStreaming();
        useChatStore.getState().appendStreamingContent('Hello');
        useChatStore.getState().appendStreamingContent(' World');
      });

      expect(useChatStore.getState().streamingContent).toBe('Hello World');
    });

    it('stopStreaming should set isStreaming to false', () => {
      act(() => {
        useChatStore.getState().startStreaming();
        useChatStore.getState().stopStreaming();
      });

      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    it('finishStreaming should add message and clear streaming state', () => {
      const dialogId = 'dialog-123';
      const result = {
        messageId: 'msg-assistant',
        promptTokens: 10,
        completionTokens: 50,
      };

      act(() => {
        useChatStore.getState().setCurrentDialog(dialogId);
        useChatStore.getState().startStreaming();
        useChatStore.getState().appendStreamingContent('Response text');
        useChatStore.getState().finishStreaming(result);
      });

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingContent).toBe('');

      const messages = state.messages[dialogId];
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content).toBe('Response text');
    });
  });

  describe('error handling', () => {
    it('setError should set error and stop streaming', () => {
      const error = { message: 'API Error' };

      act(() => {
        useChatStore.getState().startStreaming();
        useChatStore.getState().setError(error);
      });

      const state = useChatStore.getState();
      expect(state.error).toEqual(error);
      expect(state.isStreaming).toBe(false);
    });

    it('clearError should clear error', () => {
      act(() => {
        useChatStore.getState().setError({ message: 'Error' });
        useChatStore.getState().clearError();
      });

      expect(useChatStore.getState().error).toBeNull();
    });
  });
});
