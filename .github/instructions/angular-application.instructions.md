---
description: 'Angular application rules for feature work in this repository'
applyTo: 'src/**/*.ts, src/**/*.html, src/**/*.css'
---

# Angular Application Instructions

## Purpose

Use these instructions when implementing or refactoring Angular application code in this repository.

## Core Delivery Rules

- Inspect existing patterns before creating new abstractions.
- Confirm Angular version capabilities from `package.json` when proposing framework-specific APIs.
- Keep feature entry points lazy-loaded with `loadComponent`, following `src/app/app.routes.ts`.
- Register app-wide providers in `src/app/app.config.ts`; do not hide global wiring inside features.
- Keep the application zoneless and prefer signals, `computed()`, and explicit reactive flows.
- Use standalone components and do not add `standalone: true` to decorators.

## CLI and Scaffolding Precision

- Prefer Angular CLI-consistent structure and naming when generating new components, services, and routes.
- Keep generated artifacts aligned with existing feature folder boundaries instead of creating parallel structures.
- After meaningful Angular code generation or refactors, validate with at least `npm build` before finalizing.

## Architecture

- Split smart/container responsibilities from dumb/presentational responsibilities.
- Smart components own routing, orchestration, data loading, signals, and side effects.
- Dumb components receive inputs, emit outputs, and focus on rendering.
- Prefer feature folders with a focused route entry point, UI, and services.
- Keep services single-purpose and use `inject()` instead of constructor injection.

## Components and Templates

- Set `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- Use `input()` and `output()` functions instead of decorators.
- Put host bindings in the `host` object, not `@HostBinding` or `@HostListener`.
- Put layout and display classes on the component host when practical.
- Prefer external templates and style files for anything beyond a small component.
- Use native Angular control flow (`@if`, `@for`, `@switch`) instead of structural directive equivalents.
- Do not use `ngClass`; use `class` bindings instead.
- Do not use `ngStyle`; use `style` bindings instead.
- Keep templates simple and move heavy mapping or branching into TypeScript helpers or computed signals.

## Naming and Readability

- Use clear, explicit names that describe business meaning.
- Do not shorten names unnecessarily. Prefer `event`, `customerSummary`, and `loadingProgress` over abbreviations.
- Keep function return types explicit.
- Prefer early returns over nested branching.

## Tailwind and Styling

- Prefer Tailwind utility classes before adding component-specific CSS.
- Keep utility usage readable and semantic.
- Preserve keyboard focus styles, responsive layouts, and WCAG AA contrast.

## Accessibility

- Use semantic HTML first.
- Ensure controls have accessible names.
- Make loading, empty, and error states screen-reader friendly.
- Keep heading structure and keyboard flow logical.

## Validation

- For non-trivial changes, run the relevant npm workflow before finishing: `npm build`, `npm test`, `npm run lint:fix`, and `npm run format`.
- Prefer the smallest safe change that solves the task completely.

## Related Angular Instruction Files

- `.github/instructions/angular-reactivity.instructions.md`
- `.github/instructions/angular-routing.instructions.md`
- `.github/instructions/angular-forms.instructions.md`
- `.github/instructions/angular-testing.instructions.md`
