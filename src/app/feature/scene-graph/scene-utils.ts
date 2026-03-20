import { Box3, Material, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';
import type { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';
import * as WebIFC from 'web-ifc';

export function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

/**
 * Ensures the model and all its children are marked visible.
 * Called after load and after subset creation to counter any internal
 * web-ifc-three state that may leave visibility flags indeterminate.
 */
export function assertModelVisible(model: Object3D): void {
  model.visible = true;
  model.traverse((child: Object3D): void => {
    child.visible = true;
  });
}

export function centerModel(model: Object3D): void {
  const bounds = new Box3().setFromObject(model);
  if (bounds.isEmpty()) {
    return;
  }

  model.position.sub(bounds.getCenter(new Vector3()));
}

export function fitCameraToModel(camera: PerspectiveCamera, model: Object3D): void {
  const size = new Box3().setFromObject(model).getSize(new Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);

  if (maxSize <= 0) {
    return;
  }

  const cameraDistance = maxSize * 1.5;
  camera.position.set(cameraDistance, cameraDistance * 0.8, cameraDistance);
  camera.near = 0.1;
  camera.far = Math.max(2000, cameraDistance * 10);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

export function configureModelMaterial(model: Object3D): void {
  model.traverse((child: Object3D): void => {
    if (!isMesh(child)) {
      return;
    }

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        updateMaterial(material);
      }
      return;
    }

    updateMaterial(child.material);
  });
}

export function disposeIfcModel(model: IFCModel, scene: Scene | null): void {
  if (typeof model.close === 'function') {
    model.close(scene ?? undefined);
  }

  model.traverse((child: Object3D): void => {
    if (!isMesh(child)) {
      return;
    }

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        material.dispose();
      }
      return;
    }

    child.material.dispose();
  });
}

export function resolveIfcType(type: number | undefined): string {
  if (type === undefined) {
    return 'UNKNOWN';
  }

  return (WebIFC as Record<number, string>)[type] ?? `IFC-${type}`;
}

export function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return 'Failed to load IFC model.';
}

function updateMaterial(material: Material): void {
  if (!(material instanceof MeshStandardMaterial)) {
    return;
  }

  material.roughness = 0.75;
  material.metalness = 0;
}
