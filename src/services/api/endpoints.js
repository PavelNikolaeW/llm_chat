import { getClient } from './client';

/**
 * Auth API endpoints
 */
export const authApi = {
  login: async (credentials) => {
    const response = await getClient().post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await getClient().post('/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await getClient().post('/auth/refresh');
    return response.data;
  },

  me: async () => {
    const response = await getClient().get('/auth/me');
    return response.data;
  },
};

/**
 * Conversations API endpoints
 */
export const conversationsApi = {
  list: async (params = {}) => {
    const response = await getClient().get('/conversations', { params });
    return response.data;
  },

  get: async (id) => {
    const response = await getClient().get(`/conversations/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await getClient().post('/conversations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await getClient().put(`/conversations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await getClient().delete(`/conversations/${id}`);
    return response.data;
  },
};

/**
 * Messages API endpoints
 */
export const messagesApi = {
  list: async (conversationId, params = {}) => {
    const response = await getClient().get(
      `/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data;
  },

  send: async (conversationId, data) => {
    const response = await getClient().post(
      `/conversations/${conversationId}/messages`,
      data
    );
    return response.data;
  },

  delete: async (conversationId, messageId) => {
    const response = await getClient().delete(
      `/conversations/${conversationId}/messages/${messageId}`
    );
    return response.data;
  },
};

/**
 * Chat completion API (non-streaming)
 */
export const chatApi = {
  complete: async (data) => {
    const response = await getClient().post('/chat/completions', data);
    return response.data;
  },
};

/**
 * Settings API endpoints
 */
export const settingsApi = {
  get: async () => {
    const response = await getClient().get('/settings');
    return response.data;
  },

  update: async (data) => {
    const response = await getClient().put('/settings', data);
    return response.data;
  },

  getProviders: async () => {
    const response = await getClient().get('/settings/providers');
    return response.data;
  },
};

/**
 * Health check API
 */
export const healthApi = {
  check: async () => {
    const response = await getClient().get('/health');
    return response.data;
  },
};

export default {
  auth: authApi,
  conversations: conversationsApi,
  messages: messagesApi,
  chat: chatApi,
  settings: settingsApi,
  health: healthApi,
};
