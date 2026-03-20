import { Color, FrontSide, MeshLambertMaterial, Scene } from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';

import { createCustomMaterial, createHoverMaterial, createSelectionMaterial } from './scene-material-state';

export class SceneSubsets {
  private readonly hoverSubsetId = 'hover-highlight';
  private readonly selectionSubsetId = 'selection-highlight';
  private readonly windowSubsetId = 'window-glass';
  private hoverMaterial = createHoverMaterial();
  private selectionMaterial = createSelectionMaterial();
  private readonly windowMaterial = new MeshLambertMaterial({
    color: new Color('#9ec9ff'),
    transparent: true,
    opacity: 0.28,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
    side: FrontSide,
  });

  constructor(private readonly ifcLoader: IFCLoader) {}

  createHover(modelID: number, scene: Scene, expressID: number): void {
    this.ifcLoader.ifcManager.createSubset({
      modelID,
      ids: [expressID],
      material: this.hoverMaterial,
      scene,
      removePrevious: true,
      customID: this.hoverSubsetId,
    });
  }

  clearHover(modelID: number | null): void {
    if (modelID === null) {
      return;
    }

    this.ifcLoader.ifcManager.removeSubset(modelID, this.hoverMaterial, this.hoverSubsetId);
  }

  createSelection(modelID: number, scene: Scene, expressID: number): void {
    this.ifcLoader.ifcManager.createSubset({
      modelID,
      ids: [expressID],
      material: this.selectionMaterial,
      scene,
      removePrevious: true,
      customID: this.selectionSubsetId,
    });
  }

  clearSelection(modelID: number | null): void {
    if (modelID === null) {
      return;
    }

    this.ifcLoader.ifcManager.removeSubset(modelID, this.selectionMaterial, this.selectionSubsetId);
  }

  setSelectionCustomColor(hexColor: string): void {
    this.selectionMaterial.dispose();
    this.selectionMaterial = createCustomMaterial(hexColor);
  }

  resetSelectionMaterial(): void {
    this.selectionMaterial.dispose();
    this.selectionMaterial = createSelectionMaterial();
  }

  createWindowGlass(modelID: number, scene: Scene, windowExpressIDs: number[]): void {
    if (windowExpressIDs.length === 0) {
      this.clearWindowGlass(modelID);
      return;
    }

    this.ifcLoader.ifcManager.createSubset({
      modelID,
      ids: windowExpressIDs,
      material: this.windowMaterial,
      scene,
      removePrevious: true,
      customID: this.windowSubsetId,
    });
  }

  clearWindowGlass(modelID: number | null): void {
    if (modelID === null) {
      return;
    }

    this.ifcLoader.ifcManager.removeSubset(modelID, this.windowMaterial, this.windowSubsetId);
  }

  dispose(): void {
    this.hoverMaterial.dispose();
    this.selectionMaterial.dispose();
    this.windowMaterial.dispose();
  }
}
