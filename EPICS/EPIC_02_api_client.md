# EPIC 02 — API Client & Contracts

## Goal
Stable, predictable communication with backend REST + SSE.

## Scope
- Axios client
- REST SDK
- SSE POST streaming

## Stories
1. Axios client with interceptors
2. REST endpoints wrapper
3. SSE streaming client

## Definition of Done (DoD)
- Unified ApiError type used everywhere
- JWT never logged
- Streaming supports abort()

## Acceptance Criteria
- All backend endpoints reachable via SDK
- Network errors mapped to UI-safe errors
