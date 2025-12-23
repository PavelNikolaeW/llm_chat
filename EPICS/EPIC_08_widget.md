# EPIC 08 — Embedded Widget

## Goal
Embeddable chat widget for third-party sites.

## Scope
- widget.js bundle
- Public JS API

## Stories
1. init() API
2. Floating panel UI
3. CSS isolation

## Definition of Done (DoD)
- Single-script embed works
- Multiple init() calls are idempotent
- Widget does not pollute global CSS

## Acceptance Criteria
- Widget runs on arbitrary host page
