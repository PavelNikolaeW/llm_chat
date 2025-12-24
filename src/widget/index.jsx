import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatWidget, { WIDGET_EVENTS } from './ChatWidget';
import './widget.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

let widgetInstance = null;

/**
 * Create widget container with CSS isolation
 */
function createWidgetContainer() {
  const container = document.createElement('div');
  container.id = 'llm-gateway-widget-container';
  container.setAttribute('data-widget-version', '1.0.0');
  document.body.appendChild(container);

  // Create mount point
  const mountPoint = document.createElement('div');
  mountPoint.id = 'llm-widget-mount';
  container.appendChild(mountPoint);

  return { container, mountPoint };
}

/**
 * LLM Gateway Widget - Public API
 */
const LLMGatewayWidget = {
  /**
   * Initialize the widget
   * @param {Object} config - Configuration options
   * @param {string} config.apiUrl - API endpoint URL (required)
   * @param {string} config.token - Authentication token (required)
   * @param {string} [config.position='bottom-right'] - Widget position
   * @param {string} [config.theme='light'] - Theme ('light' or 'dark')
   * @param {Function} [config.onEvent] - Event callback
   */
  init(config) {
    const {
      apiUrl,
      token,
      position = 'bottom-right',
      theme = 'light',
      onEvent,
    } = config || {};

    // Validate required params
    if (!apiUrl || !token) {
      console.error('LLMGatewayWidget: apiUrl and token are required');
      return this;
    }

    // Idempotent - return if already initialized
    if (widgetInstance) {
      console.warn('LLMGatewayWidget: Widget already initialized. Use destroy() first to reinitialize.');
      return this;
    }

    try {
      const { container, mountPoint } = createWidgetContainer();

      const root = createRoot(mountPoint);
      root.render(
        <QueryClientProvider client={queryClient}>
          <ChatWidget
            apiUrl={apiUrl}
            token={token}
            position={position}
            theme={theme}
            onEvent={onEvent}
          />
        </QueryClientProvider>
      );

      widgetInstance = {
        container,
        mountPoint,
        root,
        config: { apiUrl, token, position, theme },
      };

      return this;
    } catch (error) {
      console.error('LLMGatewayWidget: Failed to initialize', error);
      return this;
    }
  },

  /**
   * Destroy the widget and clean up
   */
  destroy() {
    if (widgetInstance) {
      try {
        widgetInstance.root.unmount();
        widgetInstance.container.remove();
      } catch (error) {
        console.error('LLMGatewayWidget: Error during destroy', error);
      }
      widgetInstance = null;
    }
    return this;
  },

  /**
   * Check if widget is initialized
   */
  isInitialized() {
    return widgetInstance !== null;
  },

  /**
   * Update authentication token
   * @param {string} token - New token
   */
  setToken(token) {
    if (token) {
      window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.TOKEN, { detail: token }));
    }
    return this;
  },

  /**
   * Open the chat panel
   */
  open() {
    window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.OPEN));
    return this;
  },

  /**
   * Close the chat panel
   */
  close() {
    window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.CLOSE));
    return this;
  },

  /**
   * Toggle the chat panel open/closed
   */
  toggle() {
    window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.TOGGLE));
    return this;
  },

  /**
   * Minimize/expand the chat panel
   */
  minimize() {
    window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.MINIMIZE));
    return this;
  },

  /**
   * Send a message programmatically
   * @param {string} message - Message content
   */
  send(message) {
    if (message && typeof message === 'string') {
      window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.SEND, { detail: { message } }));
    }
    return this;
  },

  /**
   * Clear all messages
   */
  clear() {
    window.dispatchEvent(new CustomEvent(WIDGET_EVENTS.CLEAR));
    return this;
  },

  /**
   * Subscribe to widget events
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  },

  /**
   * Event names for subscription
   */
  events: WIDGET_EVENTS,

  /**
   * Widget version
   */
  version: '1.0.0',
};

export default LLMGatewayWidget;
export { WIDGET_EVENTS };

// Expose to window for script tag usage
if (typeof window !== 'undefined') {
  window.LLMGatewayWidget = LLMGatewayWidget;
}
