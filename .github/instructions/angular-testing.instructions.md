---
description: 'Angular testing rules for this repository using ng test and Vitest globals'
applyTo: 'src/**/*.spec.ts, src/**/*.test.ts'
---

# Angular Testing Instructions

## Scope

Apply these rules when adding or updating unit tests.

## Baseline

- Tests run via `ng test` with Vitest globals configured in `tsconfig.spec.json`.
- Keep tests deterministic and independent.

## Test design

- Focus tests on behavior and outcomes, not implementation details.
- Prefer clear arrange-act-assert structure.
- Cover loading, success, error, and empty states for user-facing flows.
- For signal-based logic, assert derived and transitional states explicitly.

## Component and routing tests

- Keep component tests focused on public behavior (inputs, outputs, rendered state).
- For routed behavior, use Angular routing test patterns and avoid brittle navigation assumptions.

## Quality gate

- After test changes, run `npm test` at minimum.
- For non-trivial changes, include the broader workflow (`npm build`, `npm run lint:fix`, `npm run format`) when relevant.
