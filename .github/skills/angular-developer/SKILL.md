---
name: angular-developer
description: Use when implementing Angular application code or making architecture decisions about reactivity, forms, routing, testing, accessibility, or CLI-driven scaffolding in this repository.
---

# Angular Developer

## Purpose

Repository-tailored Angular developer workflow aligned with Angular 21+ best practices and this project's architecture.

## Version and context checks

1. Confirm Angular major version from `package.json` before suggesting APIs.
2. Assume Angular 21+ capabilities are available in this repository unless the files indicate otherwise.
3. Preserve existing conventions in `AGENTS.md`, `.github/copilot-instructions.md`, and `.github/instructions/*.instructions.md`.

## Core workflow

1. Inspect existing code paths before generating new abstractions.
2. Prefer CLI-consistent structure and naming for components, services, and routes.
3. Keep features lazy-loaded via `loadComponent` and global providers in `src/app/app.config.ts`.
4. Use signals-first state (`signal`, `computed`, `linkedSignal`, `resource`) and explicit side effects.
5. Keep forms strategy consistent with Angular 21+ guidance and local feature constraints.
6. Keep routing, guards, resolvers, and navigation behavior explicit and testable.
7. Implement accessible loading/error/empty/success states.
8. Validate with the smallest relevant npm workflow before finishing.

## Reactivity rules

- Prefer `computed` for derived state.
- Use `linkedSignal` when writable state must track a source signal.
- Use `resource` for async data state when it simplifies loading and error handling.
- Use `effect` only for true side effects, not state propagation.

## Forms rules

- For new Angular 21+ forms, prefer signal forms when practical.
- For existing areas, follow the established form paradigm unless migration is requested.
- Keep validation explicit and accessible.

## Testing rules

- Keep tests behavior-focused and deterministic.
- For signal-based logic, assert key state transitions.
- Use `ng test` for test validation, and extend to full quality gates for non-trivial changes.

## Required companion guidance

- `.github/instructions/angular-application.instructions.md`
- `.github/instructions/angular-reactivity.instructions.md`
- `.github/instructions/angular-routing.instructions.md`
- `.github/instructions/angular-forms.instructions.md`
- `.github/instructions/angular-testing.instructions.md`
- `.github/instructions/quality-gates.instructions.md`
