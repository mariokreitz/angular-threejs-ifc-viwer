---
description: 'Three.js, angular-three, and IFC guidance for 3D features in this repository'
applyTo: 'src/**/*scene*.ts, src/**/*scene*.html, src/**/*demo*.ts, src/**/*demo*.html, src/**/*ifc*.ts'
---

# Angular Three.js and IFC Instructions

## Purpose

Use these instructions when working on `angular-three`, Three.js, IFC loading, or 3D scene orchestration.

## Repository Anchors

- Renderer setup lives in `src/app/app.config.ts` through `provideNgtRenderer()`.
- Canvas integration patterns live in `src/app/demo/demo.ts` and `src/app/demo/demo.html`.
- IFC loading and teardown patterns live in `src/app/feature/scene-graph/scene-graph.ts` and `src/app/feature/scene-graph/ifc-loader.service.ts`.

## Scene Architecture

- Keep scene orchestration explicit and separate from general UI orchestration.
- Prefer focused helpers for bounds, centering, material configuration, and camera framing.
- Do not bury scene math inside long lifecycle methods or constructors.
- Keep infrastructure concerns in services and rendering concerns in scene-focused code.

## IFC Loading Rules

- Always handle progress, success, failure, and cleanup paths.
- Surface progress and error states to the surrounding Angular UI.
- Use descriptive names for scene values such as `modelBounds`, `cameraDistance`, and `loadingProgress`.
- Keep error handling explicit and user-facing where appropriate.

## Resource Management

- Dispose geometries, materials, and loader-managed resources on teardown.
- Remove loaded objects from the scene before disposal.
- Avoid hidden global state or long-lived object references that can leak memory.
- If you add helpers that allocate Three.js resources, add matching cleanup logic.

## Camera and Model Handling

- Keep model centering, bounds calculations, and camera framing understandable and testable.
- Prefer pure helpers for Box3 and Vector3 calculations when possible.
- Use stable, explicit calculations over magic numbers with no explanation.

## Accessibility and UI Integration

- Keep surrounding controls accessible even when a canvas is present.
- Ensure loading and error states are readable for screen readers.
- Preserve keyboard accessibility and visible focus for controls around the viewer.

## Validation

- After non-trivial scene work, run the relevant npm workflow before finishing.
- Verify that cleanup paths still run when loading fails or the component is destroyed early.
