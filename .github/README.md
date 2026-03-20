# Copilot Configuration

This directory contains repository-specific GitHub Copilot customization for Angular 21+, Tailwind CSS v4, and IFC-aware 3D workflows.

## Structure

- `copilot-instructions.md`: Global guidance used across tasks.
- `agents/`: Named task-oriented agents.
- `instructions/`: Scoped rules automatically applied by file pattern.
- `skills/`: Reusable workflow capabilities.
- `prompts/`: Reusable slash-command prompts.
- `copilot-memory.md`: Repository memory hygiene playbook for keeping persistent Copilot signals accurate.

## Angular-focused artifacts

- `instructions/angular-application.instructions.md`
- `instructions/angular-reactivity.instructions.md`
- `instructions/angular-routing.instructions.md`
- `instructions/angular-forms.instructions.md`
- `instructions/angular-testing.instructions.md`
- `instructions/copilot-memory.instructions.md`
- `skills/angular-developer/SKILL.md`
- `skills/angular-feature-delivery/SKILL.md`
- `agents/angular-feature-delivery.agent.md`
- `agents/frontend-architecture-review.agent.md`

## Usage model

1. Global context comes from `copilot-instructions.md` and `AGENTS.md`.
2. File-scoped constraints come from `instructions/*.instructions.md`.
3. Reusable execution guidance comes from `skills/*/SKILL.md`.
4. Task entry points are provided by `prompts/*.prompt.md` and `agents/*.agent.md`.
