---
description: 'Guidance to keep Copilot memory signals accurate by synchronizing code changes with repository conventions docs'
applyTo: 'AGENTS.md, README.md, .github/**/*.md, src/app/**/*.ts'
---

# Copilot Memory Instructions

## Purpose

Ensure repository-level Copilot context stays accurate over time when conventions evolve.

## Rules

- When introducing or changing a coding convention, update the corresponding `.github` guidance file in the same change.
- Keep architectural and naming terminology consistent across instructions, skills, agents, and prompts.
- Remove stale or contradictory guidance instead of layering new rules on top.
- If route, provider, reactivity, forms, testing, or IFC conventions change, update the relevant Angular instruction files.

## Scope priorities

1. `AGENTS.md` and `.github/copilot-instructions.md` for global policy.
2. `.github/instructions/*.instructions.md` for scoped implementation rules.
3. `.github/skills/*/SKILL.md` for reusable workflows.
4. `.github/prompts/*.prompt.md` and `.github/agents/*.agent.md` for task entry points.

## Validation

- For non-trivial convention changes, include a brief note in PR description about which `.github` files were synchronized.
- Keep examples and references aligned with current repository code paths.
