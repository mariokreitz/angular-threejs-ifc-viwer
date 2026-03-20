import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { CameraHintComponent } from '../component/camera-hint/camera-hint.component';
import { ContextHudComponent } from '../component/context-hud/context-hud.component';
import { PropertiesPanel } from '../component/properties-panel/properties-panel';
import { SceneToolboxComponent } from '../component/scene-toolbox/scene-toolbox.component';
import { InteractionMode } from '../models/interaction-mode.enum';
import { IfcModelOption } from '../models/ifc-model-option.model';
import { AreaMeasureService } from '../feature/measurement/area-measure.service';
import { MeasureService } from '../feature/measurement/measure.service';
import { SceneService } from '../feature/scene-graph/scene.service';

const DEFAULT_MODEL_URL = '/assets/ifc/IfcOpenHouse.ifc';

@Component({
  selector: 'app-demo',
  imports: [CameraHintComponent, ContextHudComponent, PropertiesPanel, SceneToolboxComponent],
  templateUrl: './demo.html',
  styles: [],
  host: {
    class: 'block h-full w-full overflow-hidden bg-neutral-950 text-neutral-100',
    '(document:keydown)': 'onKeyDown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Demo implements AfterViewInit {
  private readonly rendererCanvas = viewChild<ElementRef<HTMLCanvasElement>>('rendererCanvas');
  private readonly viewportContainer = viewChild<ElementRef<HTMLElement>>('viewportContainer');
  private readonly injector = inject(Injector);
  readonly sceneService = inject(SceneService);
  private readonly areaMeasureService = inject(AreaMeasureService);
  private readonly measureService = inject(MeasureService);
  readonly selectedElement = toSignal(this.sceneService.selectedElement$, {
    initialValue: null,
    injector: this.injector,
  });
  readonly hoveredType = toSignal(this.sceneService.hoveredType$, { initialValue: null, injector: this.injector });
  readonly activeMode = toSignal(this.sceneService.interactionMode$, {
    initialValue: InteractionMode.Select,
    injector: this.injector,
  });
  readonly measurements = toSignal(this.measureService.measurements$, { initialValue: [], injector: this.injector });
  readonly selectedMeasurement = toSignal(this.measureService.selectedMeasurement$, {
    initialValue: null,
    injector: this.injector,
  });
  readonly activeMeasurement = toSignal(this.measureService.activeMeasurement$, {
    initialValue: false,
    injector: this.injector,
  });
  readonly areaMeasurements = toSignal(this.areaMeasureService.areaMeasurements$, {
    initialValue: [],
    injector: this.injector,
  });
  readonly selectedAreaMeasurement = toSignal(this.areaMeasureService.selectedMeasurement$, {
    initialValue: null,
    injector: this.injector,
  });
  readonly activeAreaPoints = toSignal(this.areaMeasureService.activePointCount$, {
    initialValue: 0,
    injector: this.injector,
  });
  readonly selectedMeasurementId = computed((): string | null => this.selectedMeasurement()?.id ?? null);
  readonly selectedAreaId = computed((): string | null => this.selectedAreaMeasurement()?.id ?? null);
  readonly availableModels: IfcModelOption[] = [
    { label: 'IfcOpenHouse', url: '/assets/ifc/IfcOpenHouse.ifc' },
    { label: 'AC20 Institute Var 2', url: '/assets/ifc/AC20-Institute-Var-2.ifc.ifc' },
  ];
  readonly selectedModelUrl = signal<string>(DEFAULT_MODEL_URL);
  readonly loadingProgress = this.sceneService.loadingProgress;
  readonly loadError = this.sceneService.loadError;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy((): void => {
      this.sceneService.destroy();
    });
  }

  ngAfterViewInit(): void {
    const rendererCanvas = this.rendererCanvas();
    const viewportContainer = this.viewportContainer();

    if (rendererCanvas === undefined || viewportContainer === undefined) {
      return;
    }

    this.sceneService.init(rendererCanvas.nativeElement, viewportContainer.nativeElement);
    void this.sceneService.loadIFC(this.selectedModelUrl());
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isTypingTarget(event.target)) {
      return;
    }

    const currentMode = this.activeMode();
    switch (event.key.toUpperCase()) {
      case 'S':
        event.preventDefault();
        this.sceneService.setMode(InteractionMode.Select);
        return;
      case 'R':
        event.preventDefault();
        this.sceneService.setMode(
          currentMode === InteractionMode.Measure ? InteractionMode.Select : InteractionMode.Measure,
        );
        return;
      case 'A':
        event.preventDefault();
        this.sceneService.setMode(
          currentMode === InteractionMode.MeasureArea ? InteractionMode.Select : InteractionMode.MeasureArea,
        );
        return;
      case 'ESCAPE':
        event.preventDefault();
        this.onEscape();
        return;
      default:
        return;
    }
  }

  private onEscape(): void {
    const currentMode = this.activeMode();

    if (currentMode === InteractionMode.MeasureArea) {
      if (this.areaMeasureService.hasActivePoints()) {
        this.areaMeasureService.removeLastPoint();
        return;
      }

      this.sceneService.setMode(InteractionMode.Select);
      return;
    }

    if (currentMode === InteractionMode.Measure) {
      this.measureService.cancelInteraction();
      this.sceneService.setMode(InteractionMode.Select);
      return;
    }

    this.sceneService.deselect();
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true;
    }

    return target.isContentEditable || target.closest('[contenteditable="true"]') !== null;
  }

  onColorChange(color: string): void {
    this.sceneService.applyColorToSelected(color);
  }

  onResetColor(): void {
    this.sceneService.resetSelectedToDefault();
  }

  onDeselect(): void {
    this.sceneService.deselect();
  }

  onSelectMeasurement(measurementId: string): void {
    this.measureService.selectMeasurementById(measurementId);
  }

  onDeleteMeasurement(measurementId: string): void {
    this.measureService.deleteMeasurement(measurementId);
  }

  onClearAllMeasurements(): void {
    this.measureService.clearAllMeasurements();
  }

  onSelectArea(areaMeasurementId: string): void {
    this.areaMeasureService.selectAreaMeasurementById(areaMeasurementId);
  }

  onDeleteArea(areaMeasurementId: string): void {
    this.areaMeasureService.deleteAreaMeasurement(areaMeasurementId);
  }

  onClearAllAreas(): void {
    this.areaMeasureService.clearAllAreaMeasurements();
  }

  onModelChange(modelUrl: string): void {
    if (this.selectedModelUrl() === modelUrl) {
      return;
    }

    this.selectedModelUrl.set(modelUrl);
    void this.sceneService.switchModel(modelUrl);
  }
}
