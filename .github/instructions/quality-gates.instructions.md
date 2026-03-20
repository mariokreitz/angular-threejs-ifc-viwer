---
description: 'Quality, validation, and maintainability guardrails for code changes in this repository'
applyTo: 'src/**/*.ts, src/**/*.html, src/**/*.css, README.md, AGENTS.md, .github/**/*.md'
---

# Quality Gates Instructions

## Delivery Standard

Every meaningful change should leave the codebase clearer, safer, and easier to maintain than before.

## Required Mindset

- Favor maintainability over speed.
- Prefer explicit behavior over clever shortcuts.
- Optimize for long-term ownership by senior engineers.
- Keep public APIs, directory structure, and naming consistent unless the task requires change.

## Review Checklist

- Is the code easy to read without jumping through multiple abstractions?
- Are names explicit and domain-specific instead of shortened?
- Is smart-vs-dumb separation preserved?
- Are side effects isolated and cleanup paths explicit?
- Are accessibility and error states covered?
- Has duplicated logic been reduced without introducing accidental complexity?
- Are Angular signals, computed values, and side effects modeled with the correct primitive?
- Is forms strategy consistent with feature context (signal forms for new Angular 21+ forms unless constrained otherwise)?
- Are routes, guards, and resolvers explicit and easy to reason about?
- Do tests cover the user-visible states and critical state transitions?

## Validation Workflow

For non-trivial work, run the relevant npm workflow before finishing:

1. `npm build`
2. `npm test`
3. `npm run lint:fix`
4. `npm run format`

If a task does not require the full workflow, still run the smallest relevant validation and explain why the reduced scope was appropriate.

## Documentation Expectations

- Update `.github/` guidance when repository conventions evolve.
- Update `README.md` when contributor-facing workflows change.
- Keep guidance files consistent with current Angular, Tailwind, and IFC patterns in the repository.
