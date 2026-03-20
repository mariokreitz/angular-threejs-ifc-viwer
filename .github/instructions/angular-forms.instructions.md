---
description: 'Angular forms strategy for Angular 21+ with signal forms preference and compatibility guidance'
applyTo: 'src/**/*.ts, src/**/*.html'
---

# Angular Forms Instructions

## Scope

Apply these rules when implementing or refactoring forms.

## Strategy by context

- For new forms in Angular 21+ features, prefer signal forms when feasible.
- For existing form areas, follow the current strategy in that area unless migration is explicitly requested.
- Avoid introducing mixed form paradigms inside a single feature without clear justification.

## Form architecture

- Keep form composition in smart/container components or dedicated form services.
- Keep presentational fields simple and input/output driven.
- Keep validation logic explicit and close to the form model.

## UX and accessibility

- Ensure every field has an accessible label and clear validation feedback.
- Keep keyboard flow logical across fields and actions.
- Represent submitting, success, and failure states explicitly.
