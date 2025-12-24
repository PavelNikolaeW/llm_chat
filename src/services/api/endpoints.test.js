import {
  authApi,
  conversationsApi,
  messagesApi,
  chatApi,
  settingsApi,
  healthApi,
} from './endpoints';
import { getClient } from './client';

// Mock the client module
jest.mock('./client', () => ({
  getClient: jest.fn(),
}));

describe('API Endpoints', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    getClient.mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authApi', () => {
    it('login should POST to /auth/login', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const responseData = { token: 'jwt-token', user: { id: 1 } };
      mockClient.post.mockResolvedValue({ data: responseData });

      const result = await authApi.login(credentials);

      expect(mockClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(responseData);
    });

    it('logout should POST to /auth/logout', async () => {
      mockClient.post.mockResolvedValue({ data: { success: true } });

      const result = await authApi.logout();

      expect(mockClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual({ success: true });
    });

    it('refresh should POST to /auth/refresh', async () => {
      const responseData = { token: 'new-token' };
      mockClient.post.mockResolvedValue({ data: responseData });

      const result = await authApi.refresh();

      expect(mockClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toEqual(responseData);
    });

    it('me should GET /auth/me', async () => {
      const userData = { id: 1, email: 'test@example.com' };
      mockClient.get.mockResolvedValue({ data: userData });

      const result = await authApi.me();

      expect(mockClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(userData);
    });
  });

  describe('conversationsApi', () => {
    it('list should GET /conversations', async () => {
      const conversations = [{ id: 1, title: 'Chat 1' }];
      mockClient.get.mockResolvedValue({ data: conversations });

      const result = await conversationsApi.list();

      expect(mockClient.get).toHaveBeenCalledWith('/conversations', { params: {} });
      expect(result).toEqual(conversations);
    });

    it('list should pass params', async () => {
      const params = { page: 1, limit: 10 };
      mockClient.get.mockResolvedValue({ data: [] });

      await conversationsApi.list(params);

      expect(mockClient.get).toHaveBeenCalledWith('/conversations', { params });
    });

    it('get should GET /conversations/:id', async () => {
      const conversation = { id: 1, title: 'Chat 1' };
      mockClient.get.mockResolvedValue({ data: conversation });

      const result = await conversationsApi.get(1);

      expect(mockClient.get).toHaveBeenCalledWith('/conversations/1');
      expect(result).toEqual(conversation);
    });

    it('create should POST to /conversations', async () => {
      const data = { title: 'New Chat' };
      const created = { id: 1, ...data };
      mockClient.post.mockResolvedValue({ data: created });

      const result = await conversationsApi.create(data);

      expect(mockClient.post).toHaveBeenCalledWith('/conversations', data);
      expect(result).toEqual(created);
    });

    it('update should PUT /conversations/:id', async () => {
      const data = { title: 'Updated Chat' };
      const updated = { id: 1, ...data };
      mockClient.put.mockResolvedValue({ data: updated });

      const result = await conversationsApi.update(1, data);

      expect(mockClient.put).toHaveBeenCalledWith('/conversations/1', data);
      expect(result).toEqual(updated);
    });

    it('delete should DELETE /conversations/:id', async () => {
      mockClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await conversationsApi.delete(1);

      expect(mockClient.delete).toHaveBeenCalledWith('/conversations/1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('messagesApi', () => {
    it('list should GET /conversations/:id/messages', async () => {
      const messages = [{ id: 1, content: 'Hello' }];
      mockClient.get.mockResolvedValue({ data: messages });

      const result = await messagesApi.list('conv-1');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/conversations/conv-1/messages',
        { params: {} }
      );
      expect(result).toEqual(messages);
    });

    it('list should pass params', async () => {
      const params = { before: 'msg-10', limit: 50 };
      mockClient.get.mockResolvedValue({ data: [] });

      await messagesApi.list('conv-1', params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/conversations/conv-1/messages',
        { params }
      );
    });

    it('send should POST to /conversations/:id/messages', async () => {
      const data = { content: 'Hello', role: 'user' };
      const message = { id: 1, ...data };
      mockClient.post.mockResolvedValue({ data: message });

      const result = await messagesApi.send('conv-1', data);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/conversations/conv-1/messages',
        data
      );
      expect(result).toEqual(message);
    });

    it('delete should DELETE /conversations/:convId/messages/:msgId', async () => {
      mockClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await messagesApi.delete('conv-1', 'msg-1');

      expect(mockClient.delete).toHaveBeenCalledWith(
        '/conversations/conv-1/messages/msg-1'
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('chatApi', () => {
    it('complete should POST to /chat/completions', async () => {
      const data = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
      };
      const response = {
        id: 'chatcmpl-123',
        choices: [{ message: { content: 'Hi!' } }],
      };
      mockClient.post.mockResolvedValue({ data: response });

      const result = await chatApi.complete(data);

      expect(mockClient.post).toHaveBeenCalledWith('/chat/completions', data);
      expect(result).toEqual(response);
    });
  });

  describe('settingsApi', () => {
    it('get should GET /settings', async () => {
      const settings = { theme: 'dark', language: 'en' };
      mockClient.get.mockResolvedValue({ data: settings });

      const result = await settingsApi.get();

      expect(mockClient.get).toHaveBeenCalledWith('/settings');
      expect(result).toEqual(settings);
    });

    it('update should PUT /settings', async () => {
      const data = { theme: 'light' };
      const updated = { theme: 'light', language: 'en' };
      mockClient.put.mockResolvedValue({ data: updated });

      const result = await settingsApi.update(data);

      expect(mockClient.put).toHaveBeenCalledWith('/settings', data);
      expect(result).toEqual(updated);
    });

    it('getProviders should GET /settings/providers', async () => {
      const providers = [{ id: 'openai', name: 'OpenAI' }];
      mockClient.get.mockResolvedValue({ data: providers });

      const result = await settingsApi.getProviders();

      expect(mockClient.get).toHaveBeenCalledWith('/settings/providers');
      expect(result).toEqual(providers);
    });
  });

  describe('healthApi', () => {
    it('check should GET /health', async () => {
      const health = { status: 'ok', timestamp: '2024-01-01T00:00:00Z' };
      mockClient.get.mockResolvedValue({ data: health });

      const result = await healthApi.check();

      expect(mockClient.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(health);
    });
  });
});
