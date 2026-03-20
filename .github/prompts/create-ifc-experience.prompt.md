---
name: 'create-ifc-experience'
description: 'Build or refine an Angular Three.js IFC experience with progress, camera framing, cleanup, and accessible UI.'
agent: 'Angular Feature Delivery Agent'
argument-hint: 'Describe the IFC viewer capability you want'
---

# Create IFC Experience

Use the `angular-developer`, `angular-three-ifc-scene`, `angular-feature-delivery`, and `frontend-architecture-review` skills.

## Input

`${input:request:Add an IFC viewer with progress feedback, failure messaging, and predictable camera framing}`

## Workflow

1. Inspect the existing scene graph and loader patterns before changing 3D behavior.
2. Keep rendering concerns inside scene-focused code and user-facing state in Angular signals.
3. Handle progress, success, failure, centering, material setup, camera fitting, and teardown explicitly.
4. Dispose geometries, materials, and loader-managed resources on destroy.
5. Keep controls and status messaging accessible around the canvas.
6. Run the smallest relevant validation workflow before finishing and mention what was checked.

## Output Expectations

- Implement the requested IFC viewer changes directly in the workspace.
- Prefer clear helpers over dense scene math.
- Summarize any cleanup or lifecycle assumptions.
