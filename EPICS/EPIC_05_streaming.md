# EPIC 05 — SSE Streaming

## Goal
Real-time assistant responses via SSE.

## Scope
- Stream lifecycle
- Abort / retry UX

## Stories
1. Streaming message rendering
2. Error & retry handling

## Definition of Done (DoD)
- Assistant response rendered as single growing message
- Abort stops network + UI updates
- Stream errors surfaced to user

## Acceptance Criteria
- No duplicated assistant messages
