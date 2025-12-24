import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatWidget from './ChatWidget';
import './widget.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

let widgetRoot = null;
let widgetContainer = null;

const LLMGatewayWidget = {
  init(config) {
    const { apiUrl, token, position = 'bottom-right', theme = 'light' } = config;

    if (!apiUrl || !token) {
      console.error('LLMGatewayWidget: apiUrl and token are required');
      return;
    }

    if (widgetContainer) {
      console.warn('LLMGatewayWidget: Widget already initialized');
      return;
    }

    widgetContainer = document.createElement('div');
    widgetContainer.id = 'llm-gateway-widget-container';
    document.body.appendChild(widgetContainer);

    widgetRoot = createRoot(widgetContainer);
    widgetRoot.render(
      <QueryClientProvider client={queryClient}>
        <ChatWidget
          apiUrl={apiUrl}
          token={token}
          position={position}
          theme={theme}
        />
      </QueryClientProvider>
    );
  },

  destroy() {
    if (widgetRoot) {
      widgetRoot.unmount();
      widgetRoot = null;
    }
    if (widgetContainer) {
      widgetContainer.remove();
      widgetContainer = null;
    }
  },

  setToken(token) {
    window.dispatchEvent(
      new CustomEvent('llm-widget:token', { detail: token })
    );
  },

  open() {
    window.dispatchEvent(new CustomEvent('llm-widget:open'));
  },

  close() {
    window.dispatchEvent(new CustomEvent('llm-widget:close'));
  },
};

export default LLMGatewayWidget;

if (typeof window !== 'undefined') {
  window.LLMGatewayWidget = LLMGatewayWidget;
}
