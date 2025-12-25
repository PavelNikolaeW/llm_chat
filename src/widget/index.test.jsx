/**
 * @jest-environment jsdom
 */
import LLMGatewayWidget, { WIDGET_EVENTS } from './index';

// Mock react-dom/client
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({})),
  QueryClientProvider: ({ children }) => children,
}));

describe('LLMGatewayWidget', () => {
  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    // Reset widget instance
    LLMGatewayWidget.destroy();
    jest.clearAllMocks();
  });

  describe('init()', () => {
    it('creates widget container in DOM', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      const container = document.getElementById('llm-gateway-widget-container');
      expect(container).toBeInTheDocument();
    });

    it('sets version attribute on container', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      const container = document.getElementById('llm-gateway-widget-container');
      expect(container.getAttribute('data-widget-version')).toBe('1.0.0');
    });

    it('returns widget instance for chaining', () => {
      const result = LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      expect(result).toBe(LLMGatewayWidget);
    });

    it('requires apiUrl parameter', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      LLMGatewayWidget.init({ token: 'test-token' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'LLMGatewayWidget: apiUrl and token are required'
      );
      expect(document.getElementById('llm-gateway-widget-container')).not.toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('requires token parameter', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      LLMGatewayWidget.init({ apiUrl: 'https://api.example.com' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'LLMGatewayWidget: apiUrl and token are required'
      );

      consoleSpy.mockRestore();
    });

    it('handles missing config gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      LLMGatewayWidget.init();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('is idempotent - returns early if already initialized', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      LLMGatewayWidget.init({
        apiUrl: 'https://api2.example.com',
        token: 'another-token',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'LLMGatewayWidget: Widget already initialized. Use destroy() first to reinitialize.'
      );

      // Only one container should exist
      const containers = document.querySelectorAll('#llm-gateway-widget-container');
      expect(containers).toHaveLength(1);

      consoleSpy.mockRestore();
    });

    it('applies default position and theme', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      expect(LLMGatewayWidget.isInitialized()).toBe(true);
    });

    it('accepts custom position', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
        position: 'top-left',
      });

      expect(LLMGatewayWidget.isInitialized()).toBe(true);
    });

    it('accepts custom theme', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
        theme: 'dark',
      });

      expect(LLMGatewayWidget.isInitialized()).toBe(true);
    });

    it('accepts onEvent callback', () => {
      const onEvent = jest.fn();

      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
        onEvent,
      });

      expect(LLMGatewayWidget.isInitialized()).toBe(true);
    });
  });

  describe('destroy()', () => {
    it('removes widget container from DOM', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      LLMGatewayWidget.destroy();

      expect(document.getElementById('llm-gateway-widget-container')).not.toBeInTheDocument();
    });

    it('returns widget instance for chaining', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      const result = LLMGatewayWidget.destroy();

      expect(result).toBe(LLMGatewayWidget);
    });

    it('handles destroy when not initialized', () => {
      // Should not throw
      expect(() => LLMGatewayWidget.destroy()).not.toThrow();
    });

    it('allows reinitializing after destroy', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      LLMGatewayWidget.destroy();

      LLMGatewayWidget.init({
        apiUrl: 'https://api2.example.com',
        token: 'new-token',
      });

      expect(document.getElementById('llm-gateway-widget-container')).toBeInTheDocument();
    });
  });

  describe('isInitialized()', () => {
    it('returns false when not initialized', () => {
      expect(LLMGatewayWidget.isInitialized()).toBe(false);
    });

    it('returns true when initialized', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      expect(LLMGatewayWidget.isInitialized()).toBe(true);
    });

    it('returns false after destroy', () => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });

      LLMGatewayWidget.destroy();

      expect(LLMGatewayWidget.isInitialized()).toBe(false);
    });
  });

  describe('API Methods', () => {
    beforeEach(() => {
      LLMGatewayWidget.init({
        apiUrl: 'https://api.example.com',
        token: 'test-token',
      });
    });

    describe('setToken()', () => {
      it('dispatches token event', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.TOKEN, handler);

        LLMGatewayWidget.setToken('new-token');

        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail).toBe('new-token');

        window.removeEventListener(WIDGET_EVENTS.TOKEN, handler);
      });

      it('does not dispatch if token is empty', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.TOKEN, handler);

        LLMGatewayWidget.setToken('');

        expect(handler).not.toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.TOKEN, handler);
      });

      it('returns widget for chaining', () => {
        expect(LLMGatewayWidget.setToken('new-token')).toBe(LLMGatewayWidget);
      });
    });

    describe('open()', () => {
      it('dispatches open event', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.OPEN, handler);

        LLMGatewayWidget.open();

        expect(handler).toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.OPEN, handler);
      });

      it('returns widget for chaining', () => {
        expect(LLMGatewayWidget.open()).toBe(LLMGatewayWidget);
      });
    });

    describe('close()', () => {
      it('dispatches close event', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.CLOSE, handler);

        LLMGatewayWidget.close();

        expect(handler).toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.CLOSE, handler);
      });

      it('returns widget for chaining', () => {
        expect(LLMGatewayWidget.close()).toBe(LLMGatewayWidget);
      });
    });

    describe('toggle()', () => {
      it('dispatches toggle event', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.TOGGLE, handler);

        LLMGatewayWidget.toggle();

        expect(handler).toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.TOGGLE, handler);
      });

      it('returns widget for chaining', () => {
        expect(LLMGatewayWidget.toggle()).toBe(LLMGatewayWidget);
      });
    });

    describe('minimize()', () => {
      it('dispatches minimize event', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.MINIMIZE, handler);

        LLMGatewayWidget.minimize();

        expect(handler).toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.MINIMIZE, handler);
      });

      it('returns widget for chaining', () => {
        expect(LLMGatewayWidget.minimize()).toBe(LLMGatewayWidget);
      });
    });

    describe('send()', () => {
      it('dispatches send event with message', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.SEND, handler);

        LLMGatewayWidget.send('Hello world');

        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail).toEqual({ message: 'Hello world' });

        window.removeEventListener(WIDGET_EVENTS.SEND, handler);
      });

      it('does not dispatch if message is empty', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.SEND, handler);

        LLMGatewayWidget.send('');

        expect(handler).not.toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.SEND, handler);
      });

      it('does not dispatch if message is not a string', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.SEND, handler);

        LLMGatewayWidget.send(123);
        LLMGatewayWidget.send(null);
        LLMGatewayWidget.send(undefined);

        expect(handler).not.toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.SEND, handler);
      });

      it('returns widget for chaining', () => {
        expect(LLMGatewayWidget.send('test')).toBe(LLMGatewayWidget);
      });
    });

    describe('clear()', () => {
      it('dispatches clear event', () => {
        const handler = jest.fn();
        window.addEventListener(WIDGET_EVENTS.CLEAR, handler);

        LLMGatewayWidget.clear();

        expect(handler).toHaveBeenCalled();

        window.removeEventListener(WIDGET_EVENTS.CLEAR, handler);
      });

      it('returns widget for chaining', () => {
        expect(LLMGatewayWidget.clear()).toBe(LLMGatewayWidget);
      });
    });

    describe('on()', () => {
      it('subscribes to events', () => {
        const callback = jest.fn();

        LLMGatewayWidget.on(WIDGET_EVENTS.OPEN, callback);
        window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.OPEN, { detail: { test: true } }));

        expect(callback).toHaveBeenCalledWith({ test: true });
      });

      it('returns unsubscribe function', () => {
        const callback = jest.fn();

        const unsubscribe = LLMGatewayWidget.on(WIDGET_EVENTS.OPEN, callback);
        unsubscribe();

        window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.OPEN));

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('Properties', () => {
    it('exposes events object', () => {
      expect(LLMGatewayWidget.events).toBe(WIDGET_EVENTS);
    });

    it('exposes version', () => {
      expect(LLMGatewayWidget.version).toBe('1.0.0');
    });
  });

  describe('Window Global', () => {
    it('exposes widget to window object', () => {
      expect(window.LLMGatewayWidget).toBe(LLMGatewayWidget);
    });
  });
});

describe('WIDGET_EVENTS export', () => {
  it('exports all event names', () => {
    expect(WIDGET_EVENTS).toEqual({
      TOKEN: 'llm-widget:token',
      OPEN: 'llm-widget:open',
      CLOSE: 'llm-widget:close',
      TOGGLE: 'llm-widget:toggle',
      MINIMIZE: 'llm-widget:minimize',
      SEND: 'llm-widget:send',
      CLEAR: 'llm-widget:clear',
      MESSAGE_SENT: 'llm-widget:message-sent',
      MESSAGE_RECEIVED: 'llm-widget:message-received',
      ERROR: 'llm-widget:error',
    });
  });
});
