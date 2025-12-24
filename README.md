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
