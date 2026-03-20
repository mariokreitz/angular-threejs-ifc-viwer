---
name: 'review-angular-architecture'
description: 'Review an Angular feature for architecture, naming, accessibility, and maintainability issues.'
agent: 'Frontend Architecture Review Agent'
argument-hint: 'Provide a feature folder, file path, or review scope'
---

# Review Angular Architecture

Use the `angular-developer` and `frontend-architecture-review` skills.

## Input

`${input:scope:src/app/feature}`

## Workflow

1. Identify the route entry points, containers, presentational components, and services inside the requested scope.
2. Review smart-vs-dumb separation, signal usage, provider placement, naming quality, and template complexity.
3. Flag accessibility gaps in headings, control names, focus states, and loading or error states.
4. Highlight cleanup risks, hidden side effects, or places where responsibilities are mixed.
5. Recommend the smallest set of changes that would materially improve maintainability.

## Output Expectations

- Produce a prioritized review with concrete file and symbol references.
- Distinguish must-fix issues from optional improvements.
- Keep recommendations aligned with Angular, Tailwind, and repository conventions.
