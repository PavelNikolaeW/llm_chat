# LLM Gateway Frontend

React-based chat interface for LLM providers (OpenAI, Anthropic).

## Features

- Chat with multiple LLM models (GPT-4, Claude, etc.)
- SSE streaming responses
- Dialog management
- Token balance tracking
- Light/Dark themes (Darcula)
- Standalone App and Embedded Widget modes

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

**Standalone App:**
```bash
npm run dev
# Opens http://localhost:3000
```

**Embedded Widget:**
```bash
npm run dev:widget
# Opens http://localhost:3001
```

### Build

```bash
# Build both app and widget
npm run build

# Build only standalone app
npm run build:app

# Build only widget
npm run build:widget
```

Output directories:
- `dist/app/` - Standalone application
- `dist/widget/` - Embeddable widget (widget.js + widget.css)

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Project Structure

```
src/
├── app/                  # Standalone application
│   ├── App.jsx
│   └── pages/
├── widget/               # Embedded widget
│   ├── index.jsx         # Widget entry point
│   └── ChatWidget.jsx
├── components/           # Shared React components
├── hooks/                # Custom React hooks
├── services/             # API and business logic
├── store/                # Zustand state management
├── styles/               # Global CSS and themes
└── utils/                # Utility functions
```

## Widget Integration

### Basic Usage

```html
<script src="https://your-cdn.com/widget.js"></script>
<script>
  LLMGatewayWidget.init({
    apiUrl: 'https://api.example.com/api/v1',
    token: 'your-jwt-token',
    position: 'bottom-right', // or 'bottom-left', 'top-right', 'top-left'
    theme: 'light'            // or 'dark'
  });
</script>
```

### Widget API

```javascript
// Initialize widget (idempotent - safe to call multiple times)
LLMGatewayWidget.init(config);

// Control widget visibility
LLMGatewayWidget.open();      // Open chat panel
LLMGatewayWidget.close();     // Close chat panel
LLMGatewayWidget.toggle();    // Toggle open/closed
LLMGatewayWidget.minimize();  // Minimize/expand panel

// Send messages programmatically
LLMGatewayWidget.send('Hello, how can you help?');

// Clear conversation
LLMGatewayWidget.clear();

// Update authentication token
LLMGatewayWidget.setToken('new-jwt-token');

// Check if initialized
LLMGatewayWidget.isInitialized(); // returns boolean

// Destroy widget
LLMGatewayWidget.destroy();

// Subscribe to events
const unsubscribe = LLMGatewayWidget.on('llm-widget:message-received', (data) => {
  console.log('Message received:', data.message);
});
unsubscribe(); // Stop listening

// Available events
LLMGatewayWidget.events.MESSAGE_SENT
LLMGatewayWidget.events.MESSAGE_RECEIVED
LLMGatewayWidget.events.ERROR
LLMGatewayWidget.events.OPEN
LLMGatewayWidget.events.CLOSE
```

### Widget Version

```javascript
console.log(LLMGatewayWidget.version); // "1.0.0"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API base URL | `/api/v1` |

## Tech Stack

- React 18
- Zustand (state management)
- React Query (server state)
- React Router (routing)
- CSS Modules (styling)
- Webpack 5 (bundling)
- Jest + Testing Library (testing)

## License

MIT
