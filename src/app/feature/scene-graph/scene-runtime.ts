import {
  AmbientLight,
  AxesHelper,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  GridHelper,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
} from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { IFCManager } from 'web-ifc-three/IFC/components/IFCManager';
import type { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';
import { IFCLoader } from 'web-ifc-three/IFCLoader';

import { debugLog } from './scene-debug';
import { isMesh, resolveIfcType } from './scene-utils';

export type PickResult = {
  mesh: Mesh;
  expressID: number;
};

type IfcManagerWithExpressId = IFCManager & {
  getExpressId?: (geometry: BufferGeometry, faceIndex: number) => number;
};

export function isValidExpressId(id: number | null | undefined): id is number {
  return typeof id === 'number' && Number.isFinite(id) && id > 0;
}

export function collectIfcPickTargetMeshes(ifcModel: IFCModel): Mesh[] {
  const pickTargetMeshes: Mesh[] = [];

  if (isMesh(ifcModel) && hasPickableGeometry(ifcModel)) {
    pickTargetMeshes.push(ifcModel);
  }

  ifcModel.traverse((child): void => {
    if (!isPickableIfcMesh(child, ifcModel)) {
      return;
    }

    pickTargetMeshes.push(child);
  });

  debugLog('ifc', 'pick targets collected:', pickTargetMeshes.length);

  return pickTargetMeshes;
}

export function addDefaultSceneHelpers(scene: Scene): void {
  scene.add(new AmbientLight('#ffffff', 0.55));

  const keyLight = new DirectionalLight('#ffffff', 1.15);
  keyLight.position.set(20, 28, 12);
  keyLight.castShadow = true;

  const fillLight = new DirectionalLight('#ffffff', 0.5);
  fillLight.position.set(-15, 10, -8);

  scene.add(keyLight, fillLight, new GridHelper(40, 40, '#94a3b8', '#cbd5e1'), new AxesHelper(2));
}

export function frameCameraToModelBounds(camera: PerspectiveCamera, controls: OrbitControls, modelBounds: Box3): void {
  const center = modelBounds.getCenter(new Vector3());
  const size = modelBounds.getSize(new Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 1);

  controls.target.copy(center);
  camera.position.set(center.x + maxDimension * 1.5, center.y + maxDimension, center.z + maxDimension * 1.5);
  camera.lookAt(center);
}

export function alignGridToModelFloor(scene: Scene, modelBounds: Box3): void {
  const floorY = modelBounds.min.y;
  scene.traverse((sceneObject): void => {
    if (sceneObject instanceof GridHelper) {
      sceneObject.position.y = floorY;
    }
  });
}

export function ensureDoubleSideMaterials(ifcModel: Object3D): void {
  // Ensure all faces on the loaded model are hittable from both sides
  // Some IFC exporters only set one-sided materials which prevent hovering from certain angles
  ifcModel.traverse((child): void => {
    if (isMesh(child)) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat): void => {
        if (mat instanceof MeshStandardMaterial) {
          mat.side = DoubleSide;
        }
      });
    }
  });
}

export async function loadIfcModel(
  ifcLoader: IFCLoader,
  url: string,
  onProgress: (progress: number) => void,
): Promise<IFCModel> {
  return await new Promise<IFCModel>((resolve, reject): void => {
    ifcLoader.load(
      url,
      (model: IFCModel): void => resolve(model),
      (progressEvent: ProgressEvent<EventTarget>): void => {
        if (progressEvent.total > 0) {
          const progress = Math.min(100, Math.round((progressEvent.loaded / progressEvent.total) * 100));
          onProgress(progress);
        }
      },
      (error: ErrorEvent): void => reject(error),
    );
  });
}

export function pickIfcElement(
  event: MouseEvent | PointerEvent,
  canvasElement: HTMLCanvasElement,
  camera: PerspectiveCamera,
  pickTargetMeshes: Mesh[],
  raycaster: Raycaster,
  pointer: Vector2,
  ifcManager: IFCManager,
): PickResult | null {
  if (pickTargetMeshes.length === 0) {
    return null;
  }

  const bounds = canvasElement.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(pickTargetMeshes, false);
  for (const intersection of intersections) {
    if (
      !isMesh(intersection.object) ||
      intersection.faceIndex === null ||
      intersection.faceIndex === undefined ||
      intersection.object.geometry.attributes['position'] === undefined
    ) {
      continue;
    }

    const mesh = intersection.object as Mesh;
    const expressID = getExpressIDFromFace(mesh.geometry, intersection.faceIndex, ifcManager);

    if (!isValidExpressId(expressID)) {
      continue;
    }

    return { mesh, expressID };
  }

  return null;
}

export async function resolveIfcTypeLabel(ifcManager: IFCManager, modelID: number, expressID: number): Promise<string> {
  const properties = (await ifcManager.getItemProperties(modelID, expressID)) as {
    type?: number | string;
  };

  const ifcType = await ifcManager.getIfcType(modelID, expressID);
  if (typeof ifcType === 'string' && ifcType.length > 0) {
    return ifcType;
  }

  if (typeof properties?.type === 'number') {
    return resolveIfcType(properties.type);
  }

  if (typeof properties?.type === 'string' && properties.type.length > 0) {
    return properties.type;
  }

  return 'UNKNOWN';
}

export function createPersistentColorSubset(
  ifcManager: IFCManager,
  modelID: number,
  scene: Scene,
  expressID: number,
  hexColor: string,
): MeshLambertMaterial {
  const persistMaterial = new MeshLambertMaterial({
    color: new Color(hexColor),
    transparent: false,
    opacity: 1,
    side: 2, // THREE.DoubleSide
  });

  ifcManager.createSubset({
    modelID,
    ids: [expressID],
    material: persistMaterial,
    scene,
    removePrevious: true,
    customID: `color-${expressID}`,
  });

  return persistMaterial;
}

function isPickableIfcMesh(object: Object3D, ifcModel: IFCModel): object is Mesh {
  return isMesh(object) && object !== ifcModel && hasPickableGeometry(object);
}

function hasPickableGeometry(mesh: Mesh): boolean {
  return mesh.geometry.attributes['position'] !== undefined;
}

function getExpressIDFromFace(geometry: BufferGeometry, faceIndex: number, ifcManager: IFCManager): number | null {
  // Prefer geometry expressID attributes when available because they are tied to face mapping
  // and are more stable across loader/indexing differences than raw manager lookups.
  const getAttrStrategy = (): number | undefined => {
    const attr = geometry.attributes['expressID'] as BufferAttribute | undefined;
    if (!attr) {
      return undefined;
    }
    const triangleVertexOffset = faceIndex * 3;

    if (geometry.index !== null) {
      if (triangleVertexOffset + 2 >= geometry.index.count) {
        return undefined;
      }

      const vertexA = geometry.index.getX(triangleVertexOffset);
      const vertexB = geometry.index.getX(triangleVertexOffset + 1);
      const vertexC = geometry.index.getX(triangleVertexOffset + 2);
      const candidateIds = [attr.getX(vertexA), attr.getX(vertexB), attr.getX(vertexC)].filter((id): id is number =>
        isValidExpressId(id),
      );

      if (candidateIds.length === 0) {
        return undefined;
      }

      const firstId = candidateIds[0];
      if (candidateIds.every((candidateId): boolean => candidateId === firstId)) {
        return firstId;
      }

      return candidateIds[0];
    }

    return triangleVertexOffset < attr.count ? attr.getX(triangleVertexOffset) : undefined;
  };

  const getRawStrategy = (): number | undefined => {
    const getExpressId = (ifcManager as IfcManagerWithExpressId).getExpressId;
    if (typeof getExpressId !== 'function') {
      return undefined;
    }
    try {
      return getExpressId(geometry, faceIndex);
    } catch {
      return undefined;
    }
  };

  const getX3Strategy = (): number | undefined => {
    const getExpressId = (ifcManager as IfcManagerWithExpressId).getExpressId;
    if (typeof getExpressId !== 'function') {
      return undefined;
    }
    try {
      return getExpressId(geometry, faceIndex * 3);
    } catch {
      return undefined;
    }
  };

  const fromAttr = getAttrStrategy();
  const fromRaw = getRawStrategy();
  const fromX3 = getX3Strategy();

  debugLog('strategy', 'faceIndex:', faceIndex);
  debugLog('strategy', 'from expressID attr:', fromAttr);
  debugLog('strategy', 'from raw faceIndex:', fromRaw);
  debugLog('strategy', 'from faceIndex * 3:', fromX3);

  if (isValidExpressId(fromAttr)) {
    return fromAttr;
  }

  // Fallback to manager strategies when attributes are not available.
  if (isValidExpressId(fromRaw)) {
    return fromRaw;
  }
  if (isValidExpressId(fromX3)) {
    return fromX3;
  }

  return null;
}
