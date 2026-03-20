You are an expert in TypeScript, Angular, Tailwind CSS, Three.js, IFC workflows, and scalable front-end architecture. Optimize for maintainability, clarity, accessibility, and long-term ownership over short-term convenience.

## Project Context

- This repository uses Angular 21+, standalone APIs, signals, and zoneless change detection.
- Bootstrap through `src/main.ts` and register global providers in `src/app/app.config.ts`.
- Keep feature entry points lazy-loaded through `loadComponent`, following `src/app/app.routes.ts`.
- Tailwind CSS v4 is available globally through `src/styles.css`.
- 3D rendering uses `angular-three` and IFC loading uses `web-ifc` / `web-ifc-three`.
- The current 3D integration patterns live in `src/app/demo/demo.ts`, `src/app/feature/scene-graph/scene-graph.ts`, and `src/app/feature/scene-graph/ifc-loader.service.ts`.

## Engineering Mindset

- Maintainability over speed.
- Architecture over convenience.
- Explicit behavior over implicit behavior.
- Prefer boring, understandable code over clever code.
- Write code that a senior engineer can review quickly and a future engineer can maintain for 5 years.
- Favor small, composable units with clear responsibilities.
- Apply DRY, KISS, and SOLID pragmatically; avoid abstraction that does not pay for itself.

## Naming and Readability

- Use clear, domain-specific names.
- Do not abbreviate parameter or variable names without strong reason. Use names like `event`, `response`, `customerSummary`, and `loadingProgress` instead of `evt`, `res`, `cust`, or similarly unclear shortcuts.
- Keep function return types explicit.
- Prefer straightforward control flow with early returns over nested branching.
- Keep comments for intent, invariants, and non-obvious tradeoffs; do not narrate obvious code.

## TypeScript Best Practices

- Use strict type checking.
- Prefer type inference when the type is obvious.
- Avoid `any`; use `unknown` when the type is uncertain.
- Model business concepts with precise types and narrow unions where helpful.
- Keep helper functions pure when possible.
- Do not hide unsafe casts inside unrelated logic.

## Angular Best Practices

- Always use standalone components over NgModules.
- Must NOT set `standalone: true` inside Angular decorators. It is the default in Angular v20+.
- Use signals for local state management.
- Use `computed()` for derived state.
- Use `linkedSignal()` when writable state depends on another signal.
- Use `resource()` for async signal-based data state when it improves clarity.
- Use `effect()` only for side effects, not for state propagation.
- Use `inject()` instead of constructor injection.
- Keep the app zoneless; prefer signals and explicit reactive APIs over Zone.js-dependent patterns.
- Implement lazy loading for feature routes.
- Use `ChangeDetectionStrategy.OnPush` in every component.
- Do NOT use `@HostBinding` or `@HostListener`; put host bindings in the `host` object.
- Use `input()` and `output()` functions instead of decorators.
- For new Angular 21+ forms, prefer signal forms when practical.
- For existing form areas, preserve the current form strategy unless migration is requested.
- Keep CLI-consistent naming and structure when generating new Angular artifacts.
- Keep library-wide providers in `src/app/app.config.ts`.

## Architecture Guidance

- Separate smart/container responsibilities from dumb/presentational responsibilities.
- Smart components coordinate data loading, orchestration, routing, state, and side effects.
- Dumb components receive inputs, emit outputs, and render UI with minimal business logic.
- Services should have a single responsibility and keep infrastructure concerns out of components.
- Prefer feature folders that group the route entry point, UI, and feature-specific services together.
- Reuse shared logic through focused helpers or services, not copy-paste or giant base classes.
- Avoid hidden dependencies and implicit global state.

## Components

- Keep components small and focused on one responsibility.
- Prefer inline templates only for genuinely small components; otherwise use external template and style files with paths relative to the component TypeScript file.
- Use the `app-` selector prefix for components and directives.
- Put layout and display classes on the component `host` object where practical.
- Prefer composition over inheritance.
- Keep heavy calculations, mapping, and normalization outside templates.

## Templates

- Keep templates simple and avoid complex logic.
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, and `*ngSwitch`.
- Use the async pipe for observables that stay observable-driven.
- Do NOT use `ngClass`; use `class` bindings instead.
- Do NOT use `ngStyle`; use `style` bindings instead.
- Do not assume globals like `new Date()` are available in templates.
- Prefer semantic HTML first, then enhance with ARIA only when necessary.

## Tailwind CSS Guidance

- Prefer Tailwind utility classes for layout, spacing, and visual styling before adding component-specific CSS.
- Keep utility usage readable and intentional; extract repeated patterns only when they are genuinely reused.
- Preserve accessible contrast, focus styles, and responsive behavior.
- Do not let utility classes replace semantic structure.

## Three.js and IFC Guidance

- Follow the existing `angular-three` integration patterns already in the repository.
- Keep scene orchestration explicit and isolate rendering concerns from general UI concerns.
- When loading IFC files, always handle progress, success, failure, and cleanup paths.
- Dispose geometries, materials, and loader-managed resources during teardown.
- Keep camera framing, bounds calculations, centering, and material adjustments understandable and testable.
- Prefer focused helper methods for scene math instead of burying calculations in long lifecycle methods.
- Keep surrounding UI accessible even when the feature contains a canvas or 3D scene.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow WCAG AA minimums, including focus management, color contrast, accessible names, keyboard support, and appropriate ARIA usage.
- Loading, error, and empty states must be screen-reader friendly.
- Preserve visible focus states and logical heading structure.

## Quality Gates

- Before finishing non-trivial work, validate the affected area with the existing npm workflow when relevant: `npm build`, `npm test`, `npm run lint:fix`, and `npm run format`.
- Prefer the smallest safe change that solves the problem completely.
- Update related documentation or guidance files when repository conventions change.
- Never guess about project structure or APIs when you can inspect the repository.

## Copilot Memory Hygiene

- Keep canonical repository guidance synchronized when conventions change (`AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `.github/skills/*/SKILL.md`).
- Remove outdated or conflicting guidance instead of layering duplicate rules.
- Keep terminology and architecture anchors consistent so repository memory signals remain accurate.
- See `.github/copilot-memory.md` for repository memory maintenance guidance.
