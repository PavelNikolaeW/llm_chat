import { renderHook, act } from '@testing-library/react';
import { useOffline } from './useOffline';

describe('useOffline', () => {
  let originalNavigator;
  let onlineListeners = [];
  let offlineListeners = [];

  beforeEach(() => {
    originalNavigator = Object.getOwnPropertyDescriptor(window, 'navigator');

    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });

    onlineListeners = [];
    offlineListeners = [];

    jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online') onlineListeners.push(handler);
      if (event === 'offline') offlineListeners.push(handler);
    });

    jest.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineListeners = onlineListeners.filter((h) => h !== handler);
      }
      if (event === 'offline') {
        offlineListeners = offlineListeners.filter((h) => h !== handler);
      }
    });
  });

  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(window, 'navigator', originalNavigator);
    }
    jest.restoreAllMocks();
  });

  it('should return isOffline as false when online', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOffline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
  });

  it('should return isOffline as true when offline', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOffline());

    expect(result.current.isOffline).toBe(true);
  });

  it('should update isOffline when going offline', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOffline).toBe(false);

    act(() => {
      offlineListeners.forEach((handler) => handler());
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });

  it('should update isOffline when coming back online', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOffline());

    expect(result.current.isOffline).toBe(true);

    act(() => {
      onlineListeners.forEach((handler) => handler());
    });

    expect(result.current.isOffline).toBe(false);
  });

  it('should provide checkConnection function', () => {
    const { result } = renderHook(() => useOffline());

    expect(typeof result.current.checkConnection).toBe('function');
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOffline());

    expect(onlineListeners.length).toBe(1);
    expect(offlineListeners.length).toBe(1);

    unmount();

    expect(onlineListeners.length).toBe(0);
    expect(offlineListeners.length).toBe(0);
  });

  describe('checkConnection', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      delete global.fetch;
    });

    it('should return true when fetch succeeds', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useOffline());

      let connected;
      await act(async () => {
        connected = await result.current.checkConnection();
      });

      expect(connected).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });

    it('should return false when fetch fails', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useOffline());

      let connected;
      await act(async () => {
        connected = await result.current.checkConnection();
      });

      expect(connected).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });

    it('should return false when fetch returns not ok', async () => {
      global.fetch.mockResolvedValue({ ok: false });

      const { result } = renderHook(() => useOffline());

      let connected;
      await act(async () => {
        connected = await result.current.checkConnection();
      });

      expect(connected).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });
});
