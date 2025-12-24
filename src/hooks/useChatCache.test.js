import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatCache } from './useChatCache';
import { useChatStore } from '../store/chatStore';
import { cacheService } from '../services/cache';

jest.mock('../services/cache', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn(),
    cleanExpired: jest.fn(),
  },
}));

describe('useChatCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(true);
    cacheService.clear.mockResolvedValue(true);
    cacheService.getStats.mockResolvedValue({
      itemCount: 0,
      totalSize: 0,
      maxSize: 50 * 1024 * 1024,
      usagePercent: 0,
    });
    cacheService.cleanExpired.mockResolvedValue(undefined);

    act(() => {
      useChatStore.setState({
        conversations: [],
        messages: {},
        activeConversationId: null,
      });
    });
  });

  it('should hydrate from cache on mount', async () => {
    const cachedConversations = [
      { id: 'conv-1', title: 'Cached Chat' },
    ];
    const cachedMessages = {
      'conv-1': [{ id: 'msg-1', content: 'Hello' }],
    };

    cacheService.get.mockImplementation((key) => {
      if (key === 'chat:conversations') return Promise.resolve(cachedConversations);
      if (key === 'chat:messages') return Promise.resolve(cachedMessages);
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useChatCache());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    const state = useChatStore.getState();
    expect(state.conversations).toEqual(cachedConversations);
    expect(state.messages).toEqual(cachedMessages);
  });

  it('should start with isHydrated false', () => {
    const { result } = renderHook(() => useChatCache());

    // Initially not hydrated (before async completes)
    expect(result.current.isHydrated).toBe(false);
  });

  it('should save conversations to cache when they change', async () => {
    const { result } = renderHook(() => useChatCache());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    const newConversations = [{ id: 'new-conv', title: 'New Chat' }];

    act(() => {
      useChatStore.setState({ conversations: newConversations });
    });

    await waitFor(() => {
      expect(cacheService.set).toHaveBeenCalledWith(
        'chat:conversations',
        newConversations
      );
    });
  });

  it('should save messages to cache when they change', async () => {
    const { result } = renderHook(() => useChatCache());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    const newMessages = { 'conv-1': [{ id: 'msg-1', content: 'Test' }] };

    act(() => {
      useChatStore.setState({ messages: newMessages });
    });

    await waitFor(() => {
      expect(cacheService.set).toHaveBeenCalledWith('chat:messages', newMessages);
    });
  });

  it('should clear cache and reset store', async () => {
    act(() => {
      useChatStore.setState({
        conversations: [{ id: 'conv-1', title: 'Test' }],
        messages: { 'conv-1': [{ id: 'msg-1' }] },
        activeConversationId: 'conv-1',
      });
    });

    const { result } = renderHook(() => useChatCache());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    await act(async () => {
      await result.current.clearCache();
    });

    expect(cacheService.clear).toHaveBeenCalled();

    const state = useChatStore.getState();
    expect(state.conversations).toEqual([]);
    expect(state.messages).toEqual({});
    expect(state.activeConversationId).toBeNull();
  });

  it('should refresh cache stats', async () => {
    const mockStats = {
      itemCount: 5,
      totalSize: 1000,
      maxSize: 50 * 1024 * 1024,
      usagePercent: 1,
    };

    cacheService.getStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useChatCache());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    let stats;
    await act(async () => {
      stats = await result.current.refreshStats();
    });

    expect(stats).toEqual(mockStats);
    expect(result.current.cacheStats).toEqual(mockStats);
  });

  it('should clean expired cache entries', async () => {
    const { result } = renderHook(() => useChatCache());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    await act(async () => {
      await result.current.cleanExpired();
    });

    expect(cacheService.cleanExpired).toHaveBeenCalled();
    expect(cacheService.getStats).toHaveBeenCalled();
  });

  it('should not save empty data to cache', async () => {
    const { result } = renderHook(() => useChatCache());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    // Clear the mock calls from hydration
    cacheService.set.mockClear();

    // Empty conversations should not trigger save
    act(() => {
      useChatStore.setState({ conversations: [] });
    });

    // Wait a bit to ensure no save was triggered
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(cacheService.set).not.toHaveBeenCalledWith('chat:conversations', []);
  });
});
