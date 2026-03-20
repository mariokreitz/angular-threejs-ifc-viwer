---
description: 'Angular routing rules for standalone APIs, lazy loading, guards, resolvers, and navigation clarity'
applyTo: 'src/app/**/*.ts, src/app/**/*.html'
---

# Angular Routing Instructions

## Scope

Apply these rules to route definitions, routed components, and navigation flows.

## Route structure

- Keep route entry points lazy-loaded through `loadComponent`.
- Keep route definitions explicit and readable.
- Use route `title` for user-facing pages when appropriate.

## Access and data loading

- Use route guards when access control decisions are route-level concerns.
- Use resolvers when pre-fetching improves route startup clarity.
- Keep resolver and guard logic focused; move infrastructure logic to services.

## Navigation

- Prefer declarative navigation with router links when possible.
- Use programmatic navigation only when it is conditional or side-effect driven.
- Keep navigation side effects explicit and testable.

## Architectural boundaries

- Keep routing orchestration in smart/container layers.
- Keep presentational components free of router orchestration unless strictly required.
