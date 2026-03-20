# Copilot Memory Playbook

This repository uses GitHub Copilot custom instructions, agents, skills, and prompts. In addition, Copilot Memory can retain repository-scoped patterns learned from coding and review activity.

This playbook keeps that memory accurate and useful for Angular development in this codebase.

## What Copilot Memory means for this repository

From GitHub documentation:

- Memories are repository-specific.
- Memories are citation-backed and only used if validated against current code.
- Memories can expire (currently documented as 28 days) if they are not re-validated by usage.

## Memory hygiene rules

1. Keep canonical conventions in stable files:
   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `.github/instructions/*.instructions.md`
   - `.github/skills/*/SKILL.md`
2. When conventions change, update the canonical files in the same PR as code changes.
3. Prefer explicit naming and architecture explanations over implicit assumptions.
4. Avoid duplicate guidance that drifts across multiple files.
5. Keep examples and references aligned with current Angular version and repository patterns.

## Angular-specific memory anchors

When updating architecture or coding conventions, keep these anchors consistent:

- Routing and lazy loading in `src/app/app.routes.ts`
- Global providers and zoneless setup in `src/app/app.config.ts`
- Signal and state conventions in `.github/instructions/angular-reactivity.instructions.md`
- Forms strategy in `.github/instructions/angular-forms.instructions.md`
- Testing expectations in `.github/instructions/angular-testing.instructions.md`
- Scene and IFC lifecycle conventions in `.github/instructions/angular-three-ifc.instructions.md`

## PR checklist for memory-safe changes

- [ ] Updated relevant `.github` guidance files for changed conventions
- [ ] Removed or corrected obsolete guidance in old files
- [ ] Kept terminology consistent across instructions, skills, and prompts
- [ ] Added or updated tests when behavior changed

## Operational note

Copilot Memory enablement is controlled by user/org settings in GitHub. This file does not enable memory by itself; it documents how to keep repository signals accurate when memory is enabled.
