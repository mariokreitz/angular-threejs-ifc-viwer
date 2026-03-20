---
name: angular-feature-delivery
description: Use when adding or refactoring Angular features, routes, components, services, forms, or stateful UI in this repository.
---

# Angular Feature Delivery

## Purpose

Use this skill to build Angular features that match this repository's architecture, naming, accessibility, and validation standards.

## Repository Anchors

- Global providers belong in `src/app/app.config.ts`.
- Feature entry points stay lazy-loaded through `src/app/app.routes.ts`.
- Tailwind utilities are available globally through `src/styles.css`.
- Existing Angular and 3D integration patterns live in `src/app/demo/` and `src/app/feature/scene-graph/`.

## Angular Alignment

- Assume Angular 21+ capabilities for this repository unless the file context indicates otherwise.
- Keep scaffolding and naming CLI-consistent when adding components, services, routes, and tests.
- Prefer signal-first patterns, including `linkedSignal` and `resource` where they improve clarity.

## Workflow

1. Inspect the existing feature or nearest equivalent before creating new abstractions.
2. Decide which part is smart/container code and which part is dumb/presentational code.
3. Keep the route entry focused on orchestration, signals, routing, and side effects.
4. Push reusable rendering concerns into presentational components with `input()` and `output()`.
5. Keep services single-purpose and use `inject()` instead of constructor injection.
6. Use signals and `computed()` for local state. Avoid implicit Zone.js assumptions.
7. Use `linkedSignal` for writable state linked to source state, and `resource` for async signal-backed loading when appropriate.
8. Use `effect()` only for true side effects, not as a replacement for derivation.
9. For new forms in Angular 21+, prefer signal forms when practical; preserve existing strategy where migration is not requested.
10. Prefer external HTML and CSS files for anything beyond a tiny component.
11. Use Tailwind utilities first, preserving semantics and accessibility.
12. Validate with the relevant npm workflow before finishing.

## Guardrails

- Use clear names like `event`, `loadingProgress`, `customerSummary`, and `selectedTenantId`.
- Do not use `ngClass`, `ngStyle`, `@HostBinding`, or `@HostListener`.
- Do not add `standalone: true` to decorators.
- Keep templates simple; move heavy branching and data shaping into TypeScript.
- Prefer early returns and explicit failure states.
- Keep routing, guards, and resolver behavior explicit in container layers.

## Output Expectations

When using this skill, produce code that:

- Uses `ChangeDetectionStrategy.OnPush`.
- Preserves lazy loading and provider placement.
- Keeps accessibility, loading, error, and empty states explicit.
- Fits the repository's ESLint and formatting expectations.
- Aligns with `.github/skills/angular-developer/SKILL.md`.
