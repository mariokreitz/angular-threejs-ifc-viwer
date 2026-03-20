---
description: 'Angular 21+ reactivity rules for signals, computed, linkedSignal, resource, and effect usage'
applyTo: 'src/**/*.ts'
---

# Angular Reactivity Instructions

## Scope

Apply these rules to TypeScript files that manage Angular state, data loading, or side effects.

## Version-aware baseline

- This repository uses Angular 21+ and zoneless change detection.
- Prefer signal-native patterns first.

## Preferred primitives

- Use `signal()` for local writable state.
- Use `computed()` for derived values.
- Use `linkedSignal()` when writable state must stay linked to a source signal.
- Use `resource()` for async data state when it improves readability over manual loading state wiring.
- Use `effect()` only for real side effects (logging, local storage sync, external APIs, canvas integration).

## Effect guardrails

- Do not use `effect()` for state propagation that can be modeled with `computed()` or `linkedSignal()`.
- Keep effects small, explicit, and easy to clean up.
- Avoid hidden dependencies in effects; read only the signals that are required.

## Async state shape

- Keep loading, error, and success states explicit.
- Keep state transitions deterministic and testable.
- Avoid `mutate`; use `set()` and `update()`.

## Naming and readability

- Use explicit names such as `loadingProgress`, `loadError`, `selectedTenantId`, and `activeRouteSegment`.
- Avoid shortened names like `evt`, `res`, or `tmp` unless context is trivial.
