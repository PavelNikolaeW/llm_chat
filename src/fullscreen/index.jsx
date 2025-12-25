import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FullscreenChat, { FULLSCREEN_EVENTS } from './FullscreenChat';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

let fullscreenInstance = null;

/**
 * LLM Fullscreen Chat - Public API
 */
const LLMFullscreenChat = {
  /**
   * Initialize the fullscreen chat
   * @param {Object} config - Configuration options
   * @param {string} config.apiUrl - API endpoint URL (required)
   * @param {string} config.token - Authentication token (required)
   * @param {Function} [config.onClose] - Callback when chat is closed
   */
  init(config) {
    const { apiUrl, token, onClose } = config || {};

    // Validate required params
    if (!apiUrl || !token) {
      console.error('LLMFullscreenChat: apiUrl and token are required');
      return this;
    }

    // Idempotent - return if already initialized
    if (fullscreenInstance) {
      console.warn('LLMFullscreenChat: Already initialized. Use destroy() first to reinitialize.');
      return this;
    }

    try {
      const mountPoint = document.getElementById('fullscreen-chat-root');
      if (!mountPoint) {
        console.error('LLMFullscreenChat: Mount point #fullscreen-chat-root not found');
        return this;
      }

      const root = createRoot(mountPoint);
      root.render(
        <QueryClientProvider client={queryClient}>
          <FullscreenChat
            apiUrl={apiUrl}
            token={token}
            onClose={onClose}
          />
        </QueryClientProvider>
      );

      fullscreenInstance = {
        mountPoint,
        root,
        config: { apiUrl, token },
      };

      return this;
    } catch (error) {
      console.error('LLMFullscreenChat: Failed to initialize', error);
      return this;
    }
  },

  /**
   * Destroy the chat and clean up
   */
  destroy() {
    if (fullscreenInstance) {
      try {
        fullscreenInstance.root.unmount();
      } catch (error) {
        console.error('LLMFullscreenChat: Error during destroy', error);
      }
      fullscreenInstance = null;
    }
    return this;
  },

  /**
   * Check if chat is initialized
   */
  isInitialized() {
    return fullscreenInstance !== null;
  },

  /**
   * Update authentication token
   * @param {string} token - New token
   */
  setToken(token) {
    if (token) {
      window.dispatchEvent(new CustomEvent(FULLSCREEN_EVENTS.TOKEN, { detail: token }));
    }
    return this;
  },

  /**
   * Open the chat
   */
  open() {
    window.dispatchEvent(new CustomEvent(FULLSCREEN_EVENTS.OPEN));
    return this;
  },

  /**
   * Close the chat
   */
  close() {
    window.dispatchEvent(new CustomEvent(FULLSCREEN_EVENTS.CLOSE));
    return this;
  },

  /**
   * Toggle the chat open/closed
   */
  toggle() {
    window.dispatchEvent(new CustomEvent(FULLSCREEN_EVENTS.TOGGLE));
    return this;
  },

  /**
   * Event names for subscription
   */
  events: FULLSCREEN_EVENTS,

  /**
   * Version
   */
  version: '1.0.0',
};

export default LLMFullscreenChat;
export { FULLSCREEN_EVENTS };

// Expose to window for script tag usage
if (typeof window !== 'undefined') {
  window.LLMFullscreenChat = LLMFullscreenChat;
}
