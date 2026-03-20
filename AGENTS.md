You are an expert in TypeScript, Angular, Tailwind CSS, Three.js, IFC workflows, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

Use the existing npm workflow from `package.json`: `npm start`, `npm build`, `npm run watch`, `npm test`, `npm run lint:fix`, and `npm run format`. Unit tests run through Angular's test builder with Vitest globals configured in `tsconfig.spec.json`.

## Engineering Mindset

- Maintainability over speed
- Architecture over convenience
- Explicitness over implicit behavior
- Long-term ownership: write code you would maintain for 5 years
- Assume the codebase is large, long-lived, and reviewed by senior engineers
- Favor DRY, KISS, and SOLID when they improve clarity and long-term changeability
- Use clear, descriptive names; do not shorten identifiers unnecessarily (for example, prefer `event` over `evt`)

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Keep function return types explicit; `@typescript-eslint/explicit-function-return-type` is enforced in `eslint.config.js`

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Use `linkedSignal()` when writable state depends on another signal
- Use `resource()` for async signal-based data state when it improves clarity
- Use `effect()` only for side effects, not for state propagation
- Bootstrap the app with `bootstrapApplication(App, appConfig)` in `src/main.ts` and register app-wide providers in `src/app/app.config.ts`
- Keep the app zoneless; `src/app/app.config.ts` enables `provideZonelessChangeDetection()`, so prefer signals and explicit reactive APIs over Zone.js-dependent patterns
- Implement lazy loading for feature routes
- Keep feature entry points lazy-loaded with `loadComponent`, following `src/app/app.routes.ts`
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
- For 3D rendering, `provideNgtRenderer()` is registered in `src/app/app.config.ts`. The active rendering path in `src/app/demo/demo.ts` uses a native `<canvas>` element managed directly by `SceneService` (raw Three.js `WebGLRenderer`); `NgtCanvasImpl` / `NgtCanvasContent` are not used.

## Architecture Guidance

- Keep smart/container concerns separate from dumb/presentational concerns
- Smart components orchestrate data fetching, routing, signals, services, and side effects
- Dumb components focus on inputs, outputs, markup, and simple display logic
- Prefer feature folders with clear boundaries and single-purpose services
- Reuse logic through focused helpers and services instead of duplication or oversized base classes
- Prefer explicit data flow and dependencies over hidden behavior
- `src/app/demo/demo.ts` is the smart container for viewer orchestration: it wires `SceneService`, measurement services, keyboard shortcuts, and presentational panels/components in `src/app/component/`

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
- Loading, error, and empty states must be screen-reader friendly.
- Preserve visible focus states and logical heading structure.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- For new Angular 21+ forms, prefer signal forms when practical
- For existing form areas, preserve the current form strategy unless migration is requested
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
- Use the `app-` selector prefix for components and directives; this is enforced by `eslint.config.js`
- Put layout and display classes on the component `host` object, following `src/app/app.ts` and `src/app/demo/demo.ts`

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Tailwind CSS v4 is available globally via `@import 'tailwindcss';` in `src/styles.css`; prefer utility classes for layout before adding component-specific CSS

## Three.js and IFC Guidance

- Keep scene-related logic explicit and isolated from general UI orchestration when possible
- Always handle IFC loading progress, failure states, centering, camera framing, and cleanup
- Dispose geometries, materials, and model resources on teardown to avoid leaks
- Keep math-heavy scene helpers small, named clearly, and easy to review
- Keep interaction-mode routing explicit in `SceneService`: selection, linear measurement, and area measurement delegate to `MeasureService`/`AreaMeasureService` (`src/app/feature/measurement/`)
- IFC demo files are served from `/assets/ifc/*`; `web-ifc` WASM binaries are copied to `/assets/wasm/*` via `angular.json` assets configuration
- Keep `postinstall` (`patch-package`) intact so dependency patching continues to apply automatically

### Scene module layout (`src/app/feature/scene-graph/`)

| File                      | Responsibility                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scene.service.ts`        | Singleton service — initializes `WebGLRenderer`, camera, `OrbitControls`, manages IFC loading, raycasting, selection/hover state signals, and RxJS subjects                                                                                            |
| `scene-runtime.ts`        | Pure scene functions: `addDefaultSceneHelpers`, `frameCameraToModelBounds`, `alignGridToModelFloor`, `collectIfcPickTargetMeshes`, `pickIfcElement`, `loadIfcModel`, `ensureDoubleSideMaterials`, `createPersistentColorSubset`, `resolveIfcTypeLabel` |
| `scene-utils.ts`          | Pure helpers: `isMesh` type guard, `assertModelVisible`, `centerModel`, `fitCameraToModel`, `configureModelMaterial`, `disposeIfcModel`, `resolveErrorMessage`                                                                                         |
| `scene-subsets.ts`        | `SceneSubsets` class — creates and clears hover, selection, and window-glass IFC subsets via `ifcManager.createSubset` / `removeSubset`                                                                                                                |
| `scene-material-state.ts` | Material factories: `createHoverMaterial`, `createSelectionMaterial`, `createCustomMaterial`                                                                                                                                                           |
| `scene-debug.ts`          | `debugLog(tag, ...args)` — gated by `window.__ifcDebug`; enable in DevTools with `window.__ifcDebug = true`, no rebuild needed                                                                                                                         |
| `scene-runtime.spec.ts`   | Vitest unit tests for pure `scene-runtime` functions                                                                                                                                                                                                   |

- Domain types `SelectedElement` and `HoveredElement` are defined in `src/app/models/ifc-element.model.ts`
- `src/app/demo/demo.ts` (smart) uses `viewChild` refs and `AfterViewInit` to hand the native `<canvas>` to `SceneService.init()`; state signals and observables are exposed to the template via `toSignal()`
- Shared presentational components live in `src/app/component/` (e.g. `PropertiesPanel`)

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Quality Gates

- Validate non-trivial changes with the existing npm workflow when relevant
- Prefer small, safe changes that solve the whole problem
- Update related Copilot guidance in `.github/` when repository conventions evolve

## Copilot Memory Hygiene

- Keep global and scoped guidance files synchronized whenever conventions change
- Keep canonical guidance synchronized: `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and `.github/skills/*/SKILL.md`
- Remove outdated or conflicting guidance instead of layering duplicate rules
- Remove stale or conflicting conventions from old files
- Keep Angular terminology and architecture anchors consistent across instructions, skills, prompts, and agents
- See `.github/copilot-memory.md` and `.github/instructions/copilot-memory.instructions.md`

## Agent Roles

- Use `Angular Feature Delivery Agent` for building and refactoring Angular features, routes, UI, and IFC-aware viewer flows.
- Use `Frontend Architecture Review Agent` for review, planning, architecture feedback, naming quality, accessibility, and quality-gate readiness.
- Keep agent behavior aligned with the instruction files in `.github/instructions/` and the reusable workflows in `.github/skills/`.
- Use `.github/skills/angular-developer/SKILL.md` as the baseline Angular capability reference for reactivity, forms, routing, testing, and CLI-consistent scaffolding.
