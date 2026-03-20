---
name: frontend-architecture-review
description: Use when planning or reviewing Angular feature structure, smart-versus-dumb separation, naming, maintainability, or architectural drift in this repository.
---

# Frontend Architecture Review

## Purpose

Use this skill to evaluate whether a feature is easy to maintain, explicit in its behavior, and aligned with the repository's Angular architecture.

## Review Axes

- Smart vs. dumb separation
- Signal-based state and derived state
- Correct usage of `linkedSignal`, `resource`, and `effect`
- Routing and provider placement
- Guards, resolvers, and navigation explicitness
- Forms strategy consistency for Angular 21+
- Service responsibilities
- Naming clarity and explicitness
- Accessibility and user-facing states
- Testability, cleanup, and side-effect boundaries

## Workflow

1. Identify the route entry point, container components, presentational components, and services.
2. Trace where state is owned, transformed, and rendered.
3. Highlight mixed responsibilities such as routing inside presentational components or formatting logic in templates.
4. Check whether names are precise, long-lived, and understandable without extra context.
5. Verify `effect()` is used only for side effects and not state propagation.
6. Check whether loading, empty, error, and success states are explicit and accessible.
7. Verify that providers, global wiring, and framework setup stay in the correct layer.
8. Validate that tests cover critical user-visible and state-transition behavior.
9. Recommend the smallest refactor that improves clarity without unnecessary abstraction.

## Common Smells

- Components that both orchestrate data and render complex UI details.
- Services that mix fetching, mapping, caching, and view-state logic without clear boundaries.
- Templates with branching, mapping, or formatting logic that belongs in TypeScript.
- Effects that hide state propagation or trigger difficult-to-trace implicit behavior.
- Hidden side effects or cleanup that depends on implicit framework behavior.
- Variable names like `evt`, `res`, `obj`, or `data` when domain names are available.

## Output Expectations

When using this skill, produce feedback or code changes that:

- Preserve existing behavior while clarifying responsibilities.
- Prefer explicit, focused abstractions over speculative reuse.
- Keep future code review and long-term maintenance easy.
