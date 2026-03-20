import { BufferAttribute, BufferGeometry, Mesh, PerspectiveCamera, Raycaster, Vector2 } from 'three';
import type { IFCManager } from 'web-ifc-three/IFC/components/IFCManager';
import type { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';

import { collectIfcPickTargetMeshes, isValidExpressId, pickIfcElement } from './scene-runtime';

describe('scene-runtime', () => {
  it('collects the root IFC mesh and child meshes with position geometry as pick targets', () => {
    const rootModel = createIndexedMesh() as IFCModel;
    const childMesh = createIndexedMesh();
    const nonIndexedChildMesh = createNonIndexedMesh();

    rootModel.add(childMesh, nonIndexedChildMesh);

    const pickTargetMeshes = collectIfcPickTargetMeshes(rootModel);

    expect(pickTargetMeshes).toEqual([rootModel, childMesh, nonIndexedChildMesh]);
  });

  it('resolves express id from the first valid intersection', () => {
    const rootModel = createIndexedMesh() as IFCModel;
    const childMesh = createIndexedMesh();
    const event = new MouseEvent('click', { clientX: 50, clientY: 50 });
    const canvasElement = createCanvasElementMock();
    const camera = new PerspectiveCamera();
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const getExpressId = vi.fn<(geometry: BufferGeometry, faceIndex: number) => number>();

    getExpressId.mockImplementation((geometry: BufferGeometry): number => {
      return geometry === childMesh.geometry ? 42 : 0;
    });

    vi.spyOn(raycaster, 'setFromCamera').mockImplementation((): Raycaster => raycaster);
    vi.spyOn(raycaster, 'intersectObjects').mockReturnValue([
      { object: rootModel, faceIndex: 0 },
      { object: childMesh, faceIndex: 1 },
    ] as unknown as ReturnType<Raycaster['intersectObjects']>);

    const result = pickIfcElement(event, canvasElement, camera, [rootModel, childMesh], raycaster, pointer, {
      getExpressId,
    } as unknown as IFCManager);

    expect(result).toEqual({ mesh: childMesh, expressID: 42 });
    // Diagnostic strategy tests both raw and *3 for each hit
    // For rootModel (invalid): 2 calls (raw + *3)
    // For childMesh (valid): 2 calls (raw + *3, both return 42 so prefers raw)
    // Total: 4 calls
    expect(getExpressId).toHaveBeenCalledTimes(4);
    expect(getExpressId).toHaveBeenCalledWith(childMesh.geometry, 1);
  });

  it('accepts valid high express ids during picking', () => {
    const rootModel = createIndexedMesh() as IFCModel;
    const event = new MouseEvent('click', { clientX: 50, clientY: 50 });
    const canvasElement = createCanvasElementMock();
    const camera = new PerspectiveCamera();
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const getExpressId = vi.fn<(geometry: BufferGeometry, faceIndex: number) => number>();

    getExpressId.mockReturnValue(550_321);

    vi.spyOn(raycaster, 'setFromCamera').mockImplementation((): Raycaster => raycaster);
    vi.spyOn(raycaster, 'intersectObjects').mockReturnValue([
      { object: rootModel, faceIndex: 0 },
    ] as unknown as ReturnType<Raycaster['intersectObjects']>);

    const result = pickIfcElement(event, canvasElement, camera, [rootModel], raycaster, pointer, {
      getExpressId,
    } as unknown as IFCManager);

    expect(result).toEqual({ mesh: rootModel, expressID: 550_321 });
  });

  it('prefers expressID attributes over conflicting manager values', () => {
    const rootModel = createIndexedMeshWithExpressId([17, 31, 77], [2, 1, 0]) as IFCModel;
    const event = new MouseEvent('click', { clientX: 50, clientY: 50 });
    const canvasElement = createCanvasElementMock();
    const camera = new PerspectiveCamera();
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const getExpressId = vi.fn<(geometry: BufferGeometry, faceIndex: number) => number>();

    getExpressId.mockReturnValue(987_654_321);

    vi.spyOn(raycaster, 'setFromCamera').mockImplementation((): Raycaster => raycaster);
    vi.spyOn(raycaster, 'intersectObjects').mockReturnValue([
      { object: rootModel, faceIndex: 0 },
    ] as unknown as ReturnType<Raycaster['intersectObjects']>);

    const result = pickIfcElement(event, canvasElement, camera, [rootModel], raycaster, pointer, {
      getExpressId,
    } as unknown as IFCManager);

    expect(result).toEqual({ mesh: rootModel, expressID: 77 });
  });

  it('validates express ids using finite positive-number rules', () => {
    expect(isValidExpressId(1)).toBe(true);
    expect(isValidExpressId(999_999_999)).toBe(true);
    expect(isValidExpressId(0)).toBe(false);
    expect(isValidExpressId(-1)).toBe(false);
    expect(isValidExpressId(Number.NaN)).toBe(false);
    expect(isValidExpressId(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidExpressId(undefined)).toBe(false);
  });
});

function createIndexedMesh(): Mesh {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3));
  geometry.setIndex([0, 1, 2]);

  return new Mesh(geometry);
}

function createIndexedMeshWithExpressId(expressIds: number[], indexOrder: [number, number, number] = [0, 1, 2]): Mesh {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3));
  geometry.setAttribute('expressID', new BufferAttribute(new Float32Array(expressIds), 1));
  geometry.setIndex(indexOrder);

  return new Mesh(geometry);
}

function createNonIndexedMesh(): Mesh {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3));

  return new Mesh(geometry);
}

function createCanvasElementMock(): HTMLCanvasElement {
  return {
    getBoundingClientRect(): DOMRect {
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON(): Record<string, never> {
          return {};
        },
      } as DOMRect;
    },
  } as HTMLCanvasElement;
}
