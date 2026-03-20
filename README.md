# MultiTenantCrm

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## IFC demo asset

The 3D demo loads `public/assets/ifc/IfcOpenHouse.ifc` with `web-ifc-three`.

- IFC files are served from `/assets/ifc/*`.
- `web-ifc` WASM binaries are copied to `/assets/wasm/*` through `angular.json` build assets.
- Dependency patching is handled automatically via `npm install` (`postinstall` runs `patch-package`).

## GitHub Copilot customization

This repository includes repo-specific GitHub Copilot guidance under `.github/`:

- `.github/copilot-instructions.md` defines the global Angular, Tailwind, architecture, accessibility, and IFC rules.
- `.github/copilot-memory.md` defines repository memory hygiene for persistent Copilot signals.
- `.github/agents/` contains named agents for implementation and architecture review workflows.
- `.github/instructions/` contains scoped instruction files for:
  - Angular application structure (`angular-application.instructions.md`)
  - Angular reactivity (`angular-reactivity.instructions.md`)
  - Angular routing (`angular-routing.instructions.md`)
  - Angular forms strategy (`angular-forms.instructions.md`)
  - Angular testing (`angular-testing.instructions.md`)
  - Copilot memory synchronization (`copilot-memory.instructions.md`)
  - Three.js / IFC work (`angular-three-ifc.instructions.md`)
  - Quality gates (`quality-gates.instructions.md`)
- `.github/skills/` contains reusable workflows for:
  - Angular baseline development (`angular-developer`)
  - Angular feature delivery (`angular-feature-delivery`)
  - Three.js / IFC scene implementation (`angular-three-ifc-scene`)
  - Front-end architecture review (`frontend-architecture-review`)
- `.github/prompts/` contains reusable slash-command style prompts for creating Angular features, building IFC experiences, and reviewing architecture.

### Available custom agents

- `Angular Feature Delivery Agent` for building or refactoring Angular features, including IFC-aware work when needed.
- `Frontend Architecture Review Agent` for planning and reviewing maintainability, accessibility, naming, and quality-gate readiness.

Use these artifacts together when working with AI assistance so generated code follows the same engineering standards as the rest of the project.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
