import * as api from './index';

describe('API Index', () => {
  it('should export ApiError', () => {
    expect(api.ApiError).toBeDefined();
  });

  it('should export client functions', () => {
    expect(api.createApiClient).toBeDefined();
    expect(api.configureClient).toBeDefined();
    expect(api.getClient).toBeDefined();
    expect(api.resetClient).toBeDefined();
  });

  it('should export endpoint APIs', () => {
    expect(api.authApi).toBeDefined();
    expect(api.conversationsApi).toBeDefined();
    expect(api.messagesApi).toBeDefined();
    expect(api.chatApi).toBeDefined();
    expect(api.settingsApi).toBeDefined();
    expect(api.healthApi).toBeDefined();
  });

  it('should export streaming functions', () => {
    expect(api.StreamingClient).toBeDefined();
    expect(api.configureStreaming).toBeDefined();
    expect(api.getStreamingClient).toBeDefined();
    expect(api.resetStreamingClient).toBeDefined();
  });
});
