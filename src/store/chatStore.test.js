import { useChatStore } from './chatStore';
import { act } from '@testing-library/react';

describe('chatStore', () => {
  beforeEach(() => {
    act(() => {
      useChatStore.setState({
        conversations: [],
        activeConversationId: null,
        messages: {},
        streamingContent: '',
        streamingMessageId: null,
        isStreaming: false,
        error: null,
        isLoading: false,
        currentDialogId: null,
      });
    });
  });

  describe('initial state', () => {
    it('should have empty conversations', () => {
      expect(useChatStore.getState().conversations).toEqual([]);
    });

    it('should have null activeConversationId', () => {
      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

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

    it('should have null streamingMessageId', () => {
      expect(useChatStore.getState().streamingMessageId).toBeNull();
    });

    it('should have no error', () => {
      expect(useChatStore.getState().error).toBeNull();
    });

    it('should not be loading', () => {
      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });

  describe('conversation actions', () => {
    it('setActiveConversation should set both activeConversationId and currentDialogId', () => {
      act(() => {
        useChatStore.getState().setActiveConversation('conv-1');
      });
      expect(useChatStore.getState().activeConversationId).toBe('conv-1');
      expect(useChatStore.getState().currentDialogId).toBe('conv-1');
    });

    it('addConversation should add to beginning of list', () => {
      const conv1 = { id: 'conv-1', title: 'First' };
      const conv2 = { id: 'conv-2', title: 'Second' };

      act(() => {
        useChatStore.getState().addConversation(conv1);
        useChatStore.getState().addConversation(conv2);
      });

      const conversations = useChatStore.getState().conversations;
      expect(conversations).toHaveLength(2);
      expect(conversations[0].id).toBe('conv-2');
      expect(conversations[1].id).toBe('conv-1');
    });

    it('updateConversation should update existing conversation', () => {
      act(() => {
        useChatStore.getState().addConversation({ id: 'conv-1', title: 'Old' });
        useChatStore.getState().updateConversation('conv-1', { title: 'New' });
      });

      const conv = useChatStore.getState().conversations[0];
      expect(conv.title).toBe('New');
    });

    it('deleteConversation should remove conversation and messages', () => {
      act(() => {
        useChatStore.getState().addConversation({ id: 'conv-1', title: 'Test' });
        useChatStore.getState().setActiveConversation('conv-1');
        useChatStore.getState().addMessage({ id: 'msg-1', content: 'Hello' });
        useChatStore.getState().deleteConversation('conv-1');
      });

      expect(useChatStore.getState().conversations).toHaveLength(0);
      expect(useChatStore.getState().messages['conv-1']).toBeUndefined();
      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

    it('deleteConversation should not change activeConversationId if different', () => {
      act(() => {
        useChatStore.getState().addConversation({ id: 'conv-1', title: 'Test1' });
        useChatStore.getState().addConversation({ id: 'conv-2', title: 'Test2' });
        useChatStore.getState().setActiveConversation('conv-2');
        useChatStore.getState().deleteConversation('conv-1');
      });

      expect(useChatStore.getState().activeConversationId).toBe('conv-2');
    });
  });

  describe('setCurrentDialog (legacy)', () => {
    it('should set both currentDialogId and activeConversationId', () => {
      act(() => {
        useChatStore.getState().setCurrentDialog('dialog-123');
      });
      expect(useChatStore.getState().currentDialogId).toBe('dialog-123');
      expect(useChatStore.getState().activeConversationId).toBe('dialog-123');
    });
  });

  describe('addMessage', () => {
    it('should add message with new signature (message only)', () => {
      act(() => {
        useChatStore.getState().setActiveConversation('conv-1');
        useChatStore.getState().addMessage({ id: 'msg-1', content: 'Hello' });
      });

      const messages = useChatStore.getState().messages['conv-1'];
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Hello');
    });

    it('should add message with legacy signature (dialogId, message)', () => {
      const dialogId = 'dialog-123';
      const message = { id: 'msg-1', role: 'user', content: 'Hello' };

      act(() => {
        useChatStore.getState().addMessage(dialogId, message);
      });

      const messages = useChatStore.getState().messages[dialogId];
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('should not add message if no activeConversationId (new signature)', () => {
      act(() => {
        useChatStore.getState().addMessage({ id: 'msg-1', content: 'Hello' });
      });

      expect(useChatStore.getState().messages).toEqual({});
    });

    it('should append to existing messages', () => {
      const dialogId = 'dialog-123';

      act(() => {
        useChatStore.getState().addMessage(dialogId, { id: 'msg-1' });
        useChatStore.getState().addMessage(dialogId, { id: 'msg-2' });
      });

      expect(useChatStore.getState().messages[dialogId]).toHaveLength(2);
    });
  });

  describe('updateMessage', () => {
    it('should update existing message', () => {
      act(() => {
        useChatStore.getState().setActiveConversation('conv-1');
        useChatStore.getState().addMessage({ id: 'msg-1', content: 'Old' });
        useChatStore.getState().updateMessage('msg-1', { content: 'New' });
      });

      const messages = useChatStore.getState().messages['conv-1'];
      expect(messages[0].content).toBe('New');
    });

    it('should not update if no activeConversationId', () => {
      act(() => {
        useChatStore.getState().updateMessage('msg-1', { content: 'New' });
      });
      // Should not throw
    });
  });

  describe('deleteMessage', () => {
    it('should delete message', () => {
      act(() => {
        useChatStore.getState().setActiveConversation('conv-1');
        useChatStore.getState().addMessage({ id: 'msg-1', content: 'Hello' });
        useChatStore.getState().addMessage({ id: 'msg-2', content: 'World' });
        useChatStore.getState().deleteMessage('msg-1');
      });

      const messages = useChatStore.getState().messages['conv-1'];
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe('msg-2');
    });
  });

  describe('setMessages', () => {
    it('should set messages for dialog', () => {
      const dialogId = 'dialog-123';
      const messages = [{ id: 'msg-1' }, { id: 'msg-2' }];

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

      expect(useChatStore.getState().messages[dialogId]).toHaveLength(1);
      expect(useChatStore.getState().messages[dialogId][0].id).toBe('new');
    });
  });

  describe('streaming actions', () => {
    it('setStreamingMessageId should set the id', () => {
      act(() => {
        useChatStore.getState().setStreamingMessageId('msg-streaming');
      });
      expect(useChatStore.getState().streamingMessageId).toBe('msg-streaming');
    });

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

    it('stopStreaming should set isStreaming to false and clear streamingMessageId', () => {
      act(() => {
        useChatStore.getState().startStreaming();
        useChatStore.getState().setStreamingMessageId('msg-1');
        useChatStore.getState().stopStreaming();
      });

      expect(useChatStore.getState().isStreaming).toBe(false);
      expect(useChatStore.getState().streamingMessageId).toBeNull();
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
      expect(state.streamingMessageId).toBeNull();

      const messages = state.messages[dialogId];
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content).toBe('Response text');
    });
  });

  describe('loading state', () => {
    it('setLoading should set isLoading', () => {
      act(() => {
        useChatStore.getState().setLoading(true);
      });
      expect(useChatStore.getState().isLoading).toBe(true);

      act(() => {
        useChatStore.getState().setLoading(false);
      });
      expect(useChatStore.getState().isLoading).toBe(false);
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
