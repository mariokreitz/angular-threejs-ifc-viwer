---
name: 'build-accessible-ui'
description: 'Create or refine Angular UI with Tailwind, semantic HTML, and WCAG-aware accessibility defaults.'
agent: 'Angular Feature Delivery Agent'
argument-hint: 'Describe the screen, component, or interaction'
---

# Build Accessible UI

Use the `angular-developer`, `angular-feature-delivery`, and `frontend-architecture-review` skills.

## Input

`${input:request:Build a responsive customer details panel with loading, empty, and error states}`

## Workflow

1. Inspect the surrounding feature and existing styling patterns before editing.
2. Use semantic HTML and Tailwind utility classes before introducing component-specific CSS.
3. Keep the component focused, with clear inputs and outputs when the UI is reusable.
4. Provide accessible names, visible focus states, keyboard support, and screen-reader friendly status messaging.
5. Keep template logic simple and move heavy branching or formatting into TypeScript.
6. Run the smallest relevant validation workflow before finishing and mention what was validated.

## Output Expectations

- Implement the UI directly in the workspace.
- Keep the markup readable and responsive.
- Preserve smart-vs-dumb separation when introducing reusable UI pieces.
