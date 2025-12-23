# EPIC 01 — Infrastructure & Build

## Goal
Bootstrap frontend repository, build system, and environment configuration.

## Scope
- Webpack
- React 18
- Standalone App + Embedded Widget bundles

## Stories
1. Webpack + React bootstrap
2. Config & env injection
3. Runtime/CDN hardening notes

## Definition of Done (DoD)
- `npm install && npm run build` succeeds on clean machine
- Produces **two bundles**: app + widget
- No secrets inside built artifacts
- README contains build & dev instructions

## Acceptance Criteria
- Dev server runs locally
- Build artifacts reproducible
