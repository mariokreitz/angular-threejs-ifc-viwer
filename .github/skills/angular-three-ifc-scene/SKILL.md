---
name: angular-three-ifc-scene
description: Use when implementing or refactoring Three.js scenes, angular-three canvas integration, IFC loading, camera framing, or scene cleanup in this repository.
---

# Angular Three IFC Scene

## Purpose

Use this skill to build or change 3D viewer functionality while keeping rendering explicit, accessible, and safe to maintain.

## Repository Anchors

- Renderer configuration lives in `src/app/app.config.ts` through `provideNgtRenderer()`.
- Canvas integration patterns live in `src/app/demo/demo.ts`.
- IFC loading, centering, material configuration, camera fitting, and teardown live in `src/app/feature/scene-graph/scene-graph.ts` and `src/app/feature/scene-graph/ifc-loader.service.ts`.

## Workflow

1. Inspect the existing viewer flow before changing scene orchestration.
2. Keep UI state such as progress and errors in Angular signals.
3. Keep scene math explicit with small helpers for bounds, centers, sizes, and camera distances.
4. Surface progress, success, and failure states to the surrounding Angular UI.
5. Remove loaded models from the scene before disposal.
6. Dispose geometries, materials, and loader-managed resources during teardown.
7. Use descriptive names such as `modelBounds`, `cameraDistance`, `loadingProgress`, and `loadError`.
8. Preserve accessible controls, headings, and status text around the canvas.
9. Use effects only for external side effects and cleanup, not for state derivation.
10. Validate cleanup paths, including early destruction and failed loads.
11. Validate at least `npm build` and `npm test` for non-trivial scene lifecycle changes.

## Guardrails

- Do not bury scene calculations inside constructors or large lifecycle methods.
- Do not keep long-lived hidden references to Three.js resources.
- Do not hide errors; convert them into user-facing messages.
- Avoid magic numbers without explaining why they exist.

## Output Expectations

When using this skill, produce code that:

- Follows the repository's `angular-three` integration style.
- Keeps Angular orchestration separate from scene-specific rendering concerns.
- Preserves deterministic cleanup and memory safety.
- Leaves the 3D feature understandable for engineers who are not Three.js specialists.
