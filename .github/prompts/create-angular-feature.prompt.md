---
name: 'create-angular-feature'
description: 'Create or refactor an Angular feature that follows the repository architecture and quality gates.'
agent: 'Angular Feature Delivery Agent'
argument-hint: 'Describe the feature and business outcome'
---

# Create Angular Feature

Use the `angular-developer`, `angular-feature-delivery`, and `frontend-architecture-review` skills.

## Input

`${input:request:Create a tenant dashboard with summary cards, filters, and empty/error states}`

## Workflow

1. Inspect the closest existing feature, route, component, and service patterns before editing.
2. Keep feature entry points lazy-loaded through `loadComponent` and place global providers only in `src/app/app.config.ts`.
3. Split container responsibilities from presentational responsibilities.
4. Use signals, `computed()`, `inject()`, `ChangeDetectionStrategy.OnPush`, and clear names.
5. Use Tailwind utilities first and keep templates semantic and accessible.
6. Keep loading, empty, success, and error states explicit.
7. Run the smallest relevant validation workflow before finishing and summarize what was validated.

## Output Expectations

- Implement the feature directly in the workspace.
- Keep the change small, explicit, and easy to review.
- Call out any architectural decisions or tradeoffs.
