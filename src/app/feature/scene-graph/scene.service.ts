/* eslint-disable max-lines */
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Box3, Mesh, MeshLambertMaterial, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as WebIFC from 'web-ifc';
import type { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { HoveredElement, SelectedElement } from '../../models/ifc-element.model';
import { InteractionMode } from '../../models/interaction-mode.enum';
import { AreaMeasureService } from '../measurement/area-measure.service';
import { MeasureService } from '../measurement/measure.service';
import {
  addDefaultSceneHelpers,
  alignGridToModelFloor,
  collectIfcPickTargetMeshes,
  createPersistentColorSubset,
  ensureDoubleSideMaterials,
  frameCameraToModelBounds,
  loadIfcModel,
  pickIfcElement,
  PickResult,
  resolveIfcTypeLabel,
} from './scene-runtime';
import { debugLog } from './scene-debug';
import { SceneSubsets } from './scene-subsets';
import { assertModelVisible, configureModelMaterial, disposeIfcModel, resolveErrorMessage } from './scene-utils';

@Injectable({ providedIn: 'root' })
export class SceneService {
  private readonly areaMeasureService = inject(AreaMeasureService);
  private readonly measureService = inject(MeasureService);

  readonly loadingProgress = signal<number>(0);
  readonly loadError = signal<string | null>(null);
  readonly interactionMode$ = new BehaviorSubject<InteractionMode>(InteractionMode.Select);
  private readonly selectedElementSubject = new BehaviorSubject<SelectedElement | null>(null);
  readonly selectedElement$ = this.selectedElementSubject.asObservable();
  private readonly hoveredElementSubject = new BehaviorSubject<HoveredElement | null>(null);
  readonly hoveredElement$ = this.hoveredElementSubject.asObservable();
  private readonly hoveredTypeSubject = new BehaviorSubject<string | null>(null);
  readonly hoveredType$ = this.hoveredTypeSubject.asObservable();
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly ifcLoader = new IFCLoader();
  private readonly subsets = new SceneSubsets(this.ifcLoader);
  private initialized = false;
  private modelLoaded = false;
  private loadingPromise: Promise<void> | null = null;
  private loadedUrl: string | null = null;
  private lastPointerMoveTime = 0;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private renderer: WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private viewportContainer: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId: number | null = null;
  private ifcModel: IFCModel | null = null;
  private modelID: number | null = null;
  private hoveredExpressID: number | null = null;
  private pickTargetMeshes: Mesh[] = [];
  private selectedMesh: Mesh | null = null;
  private selectedExpressID: number | null = null;
  private customColors = new Map<number, { color: string; material: MeshLambertMaterial | null }>();
  private hoverRequestToken = 0;
  private selectionRequestToken = 0;

  init(canvas: HTMLCanvasElement, viewportContainer: HTMLElement): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.canvasElement = canvas;
    this.viewportContainer = viewportContainer;
    try {
      this.renderer = new WebGLRenderer({ antialias: true, canvas });
    } catch {
      this.loadError.set('WebGL renderer could not be initialized in this environment.');
      this.initialized = false;
      return;
    }
    this.scene = new Scene();
    const width = Math.max(1, viewportContainer.clientWidth);
    const height = Math.max(1, viewportContainer.clientHeight);
    this.camera = new PerspectiveCamera(60, width / height, 0.1, 4000);
    this.camera.position.set(12, 10, 12);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);
    this.measureService.onDragStart = (): void => {
      if (this.controls !== null) {
        this.controls.enabled = false;
      }
    };
    this.measureService.onDragEnd = (): void => {
      if (this.controls !== null) {
        this.controls.enabled = true;
      }
    };
    this.areaMeasureService.onDragStart = (): void => {
      if (this.controls !== null) {
        this.controls.enabled = false;
      }
    };
    this.areaMeasureService.onDragEnd = (): void => {
      if (this.controls !== null) {
        this.controls.enabled = true;
      }
    };
    addDefaultSceneHelpers(this.scene);
    this.measureService.init(this.scene, this.camera, this.renderer);
    this.areaMeasureService.init(this.scene, this.camera, this.renderer);
    canvas.addEventListener('click', this.clickHandler);
    canvas.addEventListener('pointermove', this.pointerMoveHandler);
    canvas.addEventListener('pointerleave', this.pointerLeaveHandler);
    canvas.addEventListener('contextmenu', this.contextMenuHandler);
    this.resizeObserver = new ResizeObserver((): void => this.handleViewportResize());
    this.resizeObserver.observe(viewportContainer);
    this.startAnimationLoop();
  }

  setMode(mode: InteractionMode): void {
    this.interactionMode$.next(mode);

    // Leave stored measurements visible, only cancel active edit/in-progress interaction.
    if (mode !== InteractionMode.Measure) {
      this.measureService.cancelInteraction();
    }
    if (mode !== InteractionMode.MeasureArea) {
      this.areaMeasureService.cancelActive();
    }

    // Clear hover highlight whenever the mode changes
    this.clearHoverState();

    if (this.renderer !== null) {
      this.renderer.domElement.style.cursor = mode === InteractionMode.Select ? 'default' : 'crosshair';
    }
  }

  loadIFC(url: string): Promise<void> {
    if (!this.initialized) {
      return Promise.resolve();
    }
    if (this.loadedUrl === url && this.ifcModel !== null) {
      return Promise.resolve();
    }
    if (this.loadingPromise !== null) {
      return this.loadingPromise;
    }
    this.modelLoaded = true;
    this.loadingPromise = this.loadIFCInternal(url).finally((): void => {
      this.loadingPromise = null;
    });
    return this.loadingPromise;
  }

  async switchModel(url: string): Promise<void> {
    this.setMode(InteractionMode.Select);
    this.measureService.clearAllMeasurements();
    this.areaMeasureService.clearAllAreaMeasurements();

    await this.loadIFC(url);
  }

  deselect(): void {
    this.selectionRequestToken += 1;
    const prevID = this.selectedExpressID;
    const prevEntry = prevID !== null ? this.customColors.get(prevID) : undefined;
    this.subsets.clearSelection(this.modelID);
    this.selectedExpressID = null;
    this.selectedMesh = null;
    this.selectedElementSubject.next(null);
    if (prevID !== null && prevEntry !== undefined && this.scene !== null && this.modelID !== null) {
      const persistMaterial = createPersistentColorSubset(
        this.ifcLoader.ifcManager,
        this.modelID,
        this.scene,
        prevID,
        prevEntry.color,
      );
      // Store the exact material instance so removeSubset can match it later
      this.customColors.set(prevID, { color: prevEntry.color, material: persistMaterial });
    }
  }

  applyColorToSelected(hexColor: string): void {
    if (this.scene === null || this.modelID === null || this.selectedExpressID === null) {
      return;
    }
    // If there is a persistent subset from a previous deselect, remove it before
    // creating the new selection subset to avoid both subsets being visible at once.
    const existingEntry = this.customColors.get(this.selectedExpressID);
    if (existingEntry?.material !== null && existingEntry?.material !== undefined) {
      this.ifcLoader.ifcManager.removeSubset(this.modelID, existingEntry.material, `color-${this.selectedExpressID}`);
      existingEntry.material.dispose();
    }
    // material is null while the element is selected — the persistent subset does not exist yet
    this.customColors.set(this.selectedExpressID, { color: hexColor, material: null });
    this.subsets.clearSelection(this.modelID);
    this.subsets.setSelectionCustomColor(hexColor);
    this.subsets.createSelection(this.modelID, this.scene, this.selectedExpressID);
    const selectedElement = this.selectedElementSubject.getValue();
    if (selectedElement !== null) {
      this.selectedElementSubject.next({ ...selectedElement, colorHex: hexColor, currentColor: hexColor });
    }
  }

  resetSelectedToDefault(): void {
    if (this.scene === null || this.modelID === null || this.selectedExpressID === null) {
      return;
    }
    const entry = this.customColors.get(this.selectedExpressID);
    // Remove the persistent color subset only when it exists (element was previously deselected)
    if (entry?.material !== null && entry?.material !== undefined) {
      this.ifcLoader.ifcManager.removeSubset(this.modelID, entry.material, `color-${this.selectedExpressID}`);
      entry.material.dispose();
    }
    this.customColors.delete(this.selectedExpressID);
    this.subsets.clearSelection(this.modelID);
    this.subsets.resetSelectionMaterial();
    this.subsets.createSelection(this.modelID, this.scene, this.selectedExpressID);
    const selectedElement = this.selectedElementSubject.getValue();
    if (selectedElement !== null) {
      this.selectedElementSubject.next({ ...selectedElement, colorHex: null, currentColor: undefined });
    }
  }

  async pickElement(event: MouseEvent): Promise<void> {
    const hit = this.castRay(event);
    if (hit === null) {
      this.clearHoverState();
      this.deselect();
      return;
    }
    if (hit.expressID === this.selectedExpressID) {
      this.deselect();
      return;
    }
    this.subsets.clearSelection(this.modelID);
    this.subsets.clearHover(this.modelID);
    this.hoveredExpressID = null;
    this.selectedMesh = hit.mesh;
    this.selectedExpressID = hit.expressID;
    const selectionToken = ++this.selectionRequestToken;

    // Check if this element already has a custom color
    const existingEntry = this.customColors.get(hit.expressID);

    if (this.modelID !== null && this.scene !== null) {
      if (existingEntry) {
        this.subsets.clearSelection(this.modelID);
        this.subsets.setSelectionCustomColor(existingEntry.color);
      }
      this.subsets.createSelection(this.modelID, this.scene, hit.expressID);
    }
    await this.emitSelectedElement(hit.expressID, hit.mesh, existingEntry?.color ?? null, selectionToken);
  }

  destroy(): void {
    this.canvasElement?.removeEventListener('click', this.clickHandler);
    this.canvasElement?.removeEventListener('pointermove', this.pointerMoveHandler);
    this.canvasElement?.removeEventListener('pointerleave', this.pointerLeaveHandler);
    this.canvasElement?.removeEventListener('contextmenu', this.contextMenuHandler);
    // Clear measurement objects before the scene and renderer are disposed.
    this.measureService.clearAllMeasurements();
    this.areaMeasureService.clearAllAreaMeasurements();
    this.measureService.onDragStart = null;
    this.measureService.onDragEnd = null;
    this.areaMeasureService.onDragStart = null;
    this.areaMeasureService.onDragEnd = null;
    this.interactionMode$.next(InteractionMode.Select);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clearHoverState();
    this.deselect();
    this.subsets.clearWindowGlass(this.modelID);
    if (this.scene !== null && this.ifcModel !== null) {
      disposeIfcModel(this.ifcModel, this.scene);
      this.scene.remove(this.ifcModel);
    }
    this.controls?.dispose();
    this.renderer?.dispose();
    this.subsets.dispose();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.canvasElement = null;
    this.viewportContainer = null;
    this.ifcModel = null;
    this.modelID = null;
    this.loadingPromise = null;
    this.loadedUrl = null;
    this.modelLoaded = false;
    this.lastPointerMoveTime = 0;
    this.hoveredExpressID = null;
    this.pickTargetMeshes = [];
    this.selectedMesh = null;
    this.selectedExpressID = null;
    this.customColors.clear();
    this.loadingProgress.set(0);
    this.loadError.set(null);
    this.selectedElementSubject.next(null);
    this.hoveredElementSubject.next(null);
    this.hoveredTypeSubject.next(null);
    this.initialized = false;
  }

  private readonly clickHandler = (event: MouseEvent): void => {
    switch (this.interactionMode$.value) {
      case InteractionMode.Measure:
        this.measureService.onCanvasClick(event);
        return;
      case InteractionMode.MeasureArea:
        this.areaMeasureService.onCanvasClick(event);
        return;
      default:
        void this.pickElement(event);
    }
  };

  private readonly pointerMoveHandler = (event: PointerEvent): void => {
    switch (this.interactionMode$.value) {
      case InteractionMode.Measure:
        this.measureService.onMouseMove(event);
        return;
      case InteractionMode.MeasureArea:
        this.areaMeasureService.onMouseMove(event);
        return;
      default:
        void this.updateHoveredElement(event);
    }
  };

  onMouseDown(event: MouseEvent): void {
    switch (this.interactionMode$.value) {
      case InteractionMode.Measure:
        this.measureService.onMouseDown(event);
        return;
      case InteractionMode.MeasureArea:
        this.areaMeasureService.onMouseDown(event);
        return;
      default:
        return;
    }
  }

  onMouseUp(): void {
    switch (this.interactionMode$.value) {
      case InteractionMode.Measure:
        this.measureService.onMouseUp();
        return;
      case InteractionMode.MeasureArea:
        this.areaMeasureService.onMouseUp();
        return;
      default:
        return;
    }
  }

  private readonly pointerLeaveHandler = (): void => {
    this.clearHoverState();
  };

  private readonly contextMenuHandler = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private async loadIFCInternal(url: string): Promise<void> {
    if (this.scene === null || this.camera === null || this.controls === null) {
      return;
    }
    this.loadingProgress.set(1);
    this.loadError.set(null);
    await this.ifcLoader.ifcManager.setWasmPath('assets/wasm/');
    try {
      this.resetLoadedModel();

      const model = await loadIfcModel(this.ifcLoader, url, (progress: number): void => {
        this.loadingProgress.set(progress);
      });
      if (!this.initialized || this.scene === null || this.camera === null || this.controls === null) {
        return;
      }
      this.ifcModel = model;
      this.modelID = model.modelID;
      this.measureService.lengthUnit = await this.measureService.detectLengthUnit(this.ifcLoader, model.modelID);
      this.areaMeasureService.lengthUnit = this.measureService.lengthUnit;
      debugLog('measure', 'detected length unit:', this.measureService.lengthUnit);
      assertModelVisible(model);
      configureModelMaterial(model);
      ensureDoubleSideMaterials(model);
      this.pickTargetMeshes = collectIfcPickTargetMeshes(model);
      this.scene.add(model);
      await this.applyWindowTransparency(model.modelID);
      assertModelVisible(model);
      const modelBounds = new Box3().setFromObject(model);
      frameCameraToModelBounds(this.camera, this.controls, modelBounds);
      alignGridToModelFloor(this.scene, modelBounds);
      this.controls.update();
      this.loadedUrl = url;
      this.loadingProgress.set(100);
    } catch (error: unknown) {
      this.modelLoaded = false;
      this.loadingProgress.set(0);
      this.loadError.set(resolveErrorMessage(error));
    }
  }

  private resetLoadedModel(): void {
    this.clearHoverState();
    this.deselect();
    this.subsets.clearWindowGlass(this.modelID);
    if (this.scene !== null && this.ifcModel !== null) {
      disposeIfcModel(this.ifcModel, this.scene);
      this.scene.remove(this.ifcModel);
    }
    this.ifcModel = null;
    this.modelID = null;
    this.pickTargetMeshes = [];
    this.customColors.clear();
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== null || this.renderer === null || this.scene === null || this.camera === null) {
      return;
    }
    const renderer = this.renderer;
    const scene = this.scene;
    const camera = this.camera;
    const animate = (): void => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.controls?.update();
      renderer.render(scene, camera);
    };
    animate();
  }

  private handleViewportResize(): void {
    if (this.renderer === null || this.camera === null || this.viewportContainer === null) {
      return;
    }
    const width = Math.max(1, this.viewportContainer.clientWidth);
    const height = Math.max(1, this.viewportContainer.clientHeight);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private async updateHoveredElement(event: PointerEvent): Promise<void> {
    const now = performance.now();
    if (now - this.lastPointerMoveTime < 16) {
      return;
    }
    this.lastPointerMoveTime = now;
    const hit = this.castRay(event);
    if (hit === null) {
      this.clearHoverState();
      return;
    }
    if (hit.expressID === this.selectedExpressID) {
      this.hoverRequestToken += 1;
      this.subsets.clearHover(this.modelID);
      this.hoveredExpressID = null;
      await this.emitHoveredElement(hit.expressID, this.hoverRequestToken);
      return;
    }
    if (this.hoveredExpressID === hit.expressID) {
      return;
    }
    this.subsets.clearHover(this.modelID);
    this.hoveredExpressID = hit.expressID;
    const hoverToken = ++this.hoverRequestToken;
    if (this.modelID !== null && this.scene !== null) {
      this.subsets.createHover(this.modelID, this.scene, hit.expressID);
    }
    await this.emitHoveredElement(hit.expressID, hoverToken);
  }

  private castRay(event: MouseEvent | PointerEvent): PickResult | null {
    if (this.camera === null || this.canvasElement === null || this.pickTargetMeshes.length === 0) {
      return null;
    }

    return pickIfcElement(
      event,
      this.canvasElement,
      this.camera,
      this.pickTargetMeshes,
      this.raycaster,
      this.pointer,
      this.ifcLoader.ifcManager,
    );
  }

  private clearHoverState(): void {
    this.hoverRequestToken += 1;
    this.subsets.clearHover(this.modelID);
    this.hoveredExpressID = null;
    this.hoveredElementSubject.next(null);
    this.hoveredTypeSubject.next(null);
  }

  private async emitSelectedElement(
    expressID: number | null,
    mesh: Mesh,
    colorHex: string | null,
    selectionToken: number,
  ): Promise<void> {
    if (expressID === null || this.modelID === null) {
      return;
    }
    const ifcType = await this.resolveIfcTypeForExpressID(expressID);
    if (
      this.modelID === null ||
      this.selectionRequestToken !== selectionToken ||
      this.selectedExpressID !== expressID ||
      this.selectedMesh !== mesh
    ) {
      return;
    }
    const currentColor = colorHex ?? this.customColors.get(expressID)?.color;
    this.selectedElementSubject.next({ expressID, modelID: this.modelID, ifcType, colorHex, currentColor });
    if (this.selectedMesh === mesh) {
      this.selectedExpressID = expressID;
    }
  }

  private async emitHoveredElement(expressID: number, hoverToken: number): Promise<void> {
    if (this.modelID === null) {
      return;
    }
    const ifcType = await this.resolveIfcTypeForExpressID(expressID);
    if (this.modelID === null || this.hoverRequestToken !== hoverToken || this.hoveredExpressID !== expressID) {
      return;
    }
    this.hoveredElementSubject.next({ expressID, modelID: this.modelID, ifcType });
    this.hoveredTypeSubject.next(ifcType);
  }

  private async resolveIfcTypeForExpressID(expressID: number): Promise<string> {
    if (this.modelID === null) {
      return 'UNKNOWN';
    }
    try {
      return await resolveIfcTypeLabel(this.ifcLoader.ifcManager, this.modelID, expressID);
    } catch (error: unknown) {
      debugLog('ifc', 'failed to resolve IFC type label', { expressID, error });
      return 'UNKNOWN';
    }
  }

  private async applyWindowTransparency(modelID: number): Promise<void> {
    if (this.scene === null) {
      return;
    }

    const windowIDs = await this.ifcLoader.ifcManager.getAllItemsOfType(modelID, WebIFC.IFCWINDOW, false);
    const windowStandardCaseIDs = await this.ifcLoader.ifcManager.getAllItemsOfType(
      modelID,
      WebIFC.IFCWINDOWSTANDARDCASE,
      false,
    );

    const transparentWindowIDs = [...new Set([...windowIDs, ...windowStandardCaseIDs])];
    this.subsets.createWindowGlass(modelID, this.scene, transparentWindowIDs);
  }
}
