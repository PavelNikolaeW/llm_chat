# Claude Code Instructions for LLM Gateway Frontend

## Project Overview
LLM Gateway Frontend - React-based chat interface for LLM providers (OpenAI, Anthropic).
Two modes: Standalone App and Embedded Widget.

## Development Workflow Rules

### After completing each Epic:

1. **Write Tests**
   - Minimum **80% code coverage** required
   - Unit tests for services, stores, hooks
   - Component tests with React Testing Library
   - Run: `npm test -- --coverage`

2. **Run Tests**
   - Execute: `npm test`
   - All tests must pass before proceeding

3. **Commit (only if tests pass)**
   - Create commit with descriptive message
   - Format: `feat(epic-XX): description`
   - Include coverage report in commit message if significant

4. **Create Pull Request**
   - Create PR to main branch
   - Include summary of changes
   - Include test coverage info

### Test Coverage Requirements

| Layer | Min Coverage |
|-------|--------------|
| Services (API, Streaming, Cache) | 80% |
| Zustand Stores | 80% |
| Hooks | 80% |
| Components | 70% |
| Utils | 90% |

### Workflow
```
Code Complete → Write Tests → Run Tests → Pass? → Commit → Create PR
                                            ↓
                                          Fail? → Fix Code → Re-run Tests
```

### Commands
```bash
npm test              # Run all tests
npm test -- --coverage # Run with coverage report
npm run lint          # Lint code
npm run build         # Production build
```

## Project Files
- `EPICS/` - Development epics (EPIC_01 through EPIC_10)
  - EPIC_01: Infrastructure & Build
  - EPIC_02: API Client
  - EPIC_03: State Management
  - EPIC_04: UI Chat Components
  - EPIC_05: SSE Streaming
  - EPIC_06: Cache & Offline
  - EPIC_07: Standalone App
  - EPIC_08: Embedded Widget
  - EPIC_09: Observability
  - EPIC_10: Release

## OmniMap Architecture
Full architecture graph available in OmniMap: "LLM Gateway Frontend"
UUID: bfb057f4-e868-4c2e-92f8-e18ad4a1c6bb

## Tech Stack
- React 18 (JavaScript)
- Zustand (client state)
- React Query (server state)
- CSS Modules + CSS Variables
- Webpack (dual target: app + widget)
- Jest + React Testing Library
