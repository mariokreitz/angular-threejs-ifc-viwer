import { Color, FrontSide, MeshLambertMaterial } from 'three';

export function createHoverMaterial(): MeshLambertMaterial {
  return new MeshLambertMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.35,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    side: FrontSide,
  });
}

export function createSelectionMaterial(): MeshLambertMaterial {
  return new MeshLambertMaterial({
    color: 0xff6b35,
    transparent: true,
    opacity: 0.6,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: FrontSide,
  });
}

export function createCustomMaterial(hexColor: string): MeshLambertMaterial {
  return new MeshLambertMaterial({
    color: new Color(hexColor),
    transparent: true,
    opacity: 0.8,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: FrontSide,
  });
}
