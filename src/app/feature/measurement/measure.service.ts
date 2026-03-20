/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as WebIFC from 'web-ifc';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Intersection } from 'three';
import { IfcLengthUnit, MeasurementResult, StoredMeasurement } from '../../models/measurement.model';
import { debugLog } from '../scene-graph/scene-debug';

type ActiveMeasurementDraft = {
  id: string;
  pointA: Vector3;
  markerA: Mesh;
};

type DragTarget = 'A' | 'B';

@Injectable({ providedIn: 'root' })
export class MeasureService {
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private renderer: WebGLRenderer | null = null;
  private readonly raycaster = new Raycaster();
  private readonly mouse = new Vector2();

  private previewLine: Line | null = null;
  private measurements: StoredMeasurement[] = [];
  private activeMeasurement: ActiveMeasurementDraft | null = null;
  private selectedMeasurement: StoredMeasurement | null = null;
  private dragTarget: DragTarget | null = null;
  private isDragging = false;

  onDragStart: (() => void) | null = null;
  onDragEnd: (() => void) | null = null;

  lengthUnit: IfcLengthUnit = { name: 'METRE', symbol: 'm', toMetres: 1 };

  readonly measurements$ = new BehaviorSubject<MeasurementResult[]>([]);
  readonly selectedMeasurement$ = new BehaviorSubject<StoredMeasurement | null>(null);
  readonly activeMeasurement$ = new BehaviorSubject<boolean>(false);

  private get markerRadius(): number {
    const targetSizeMetres = 0.05;
    return targetSizeMetres / this.lengthUnit.toMetres;
  }

  private get labelOffsetY(): number {
    return 0.15 / this.lengthUnit.toMetres;
  }

  private get labelScaleX(): number {
    return 1 / this.lengthUnit.toMetres;
  }

  private get labelScaleY(): number {
    return 0.25 / this.lengthUnit.toMetres;
  }

  init(scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer): void {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.scene === null) {
      return;
    }

    const deleteHit = this.castRayAgainst(
      event,
      this.measurements.map((measurement): Object3D => measurement.deleteHitZone),
    );
    if (deleteHit) {
      const measurementToDelete = this.measurements.find(
        (measurement): boolean => measurement.deleteHitZone === deleteHit.object,
      );
      if (measurementToDelete) {
        this.deleteMeasurement(measurementToDelete.id);
        return;
      }
    }

    const selectionTargets = this.measurements.flatMap((measurement): Object3D[] => [
      measurement.markerA,
      measurement.markerB,
      measurement.line,
    ]);
    const selectionHit = this.castRayAgainst(event, selectionTargets);
    if (selectionHit) {
      const measurementToSelect = this.measurements.find(
        (measurement): boolean =>
          measurement.markerA === selectionHit.object ||
          measurement.markerB === selectionHit.object ||
          measurement.line === selectionHit.object,
      );
      if (measurementToSelect) {
        this.selectMeasurement(measurementToSelect);
        return;
      }
    }

    if (this.selectedMeasurement !== null && this.activeMeasurement === null) {
      this.deselectMeasurement();
      return;
    }

    const hit = this.castMeasureRay(event);
    if (hit === null) {
      return;
    }

    if (this.activeMeasurement === null) {
      this.startMeasurement(hit.point);
      return;
    }

    this.finaliseMeasurement(hit.point);
  }

  onMouseDown(event: MouseEvent): void {
    if (this.selectedMeasurement === null) {
      return;
    }

    const markerAHit = this.castRayAgainst(event, [this.selectedMeasurement.markerA]);
    const markerBHit = this.castRayAgainst(event, [this.selectedMeasurement.markerB]);

    if (markerAHit) {
      this.dragTarget = 'A';
      this.isDragging = true;
      this.onDragStart?.();
      event.preventDefault();
      return;
    }

    if (markerBHit) {
      this.dragTarget = 'B';
      this.isDragging = true;
      this.onDragStart?.();
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.selectedMeasurement !== null && this.dragTarget !== null) {
      const hit = this.castMeasureRay(event);
      if (hit === null) {
        return;
      }
      this.updateMeasurementPoint(this.selectedMeasurement, this.dragTarget, hit.point);
      return;
    }

    this.updatePreviewLine(event);
  }

  onMouseUp(): void {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.dragTarget = null;
    this.onDragEnd?.();
  }

  selectMeasurementById(measurementId: string): void {
    const measurement = this.measurements.find((entry): boolean => entry.id === measurementId);
    if (measurement !== undefined) {
      this.selectMeasurement(measurement);
    }
  }

  deleteMeasurement(measurementId: string): void {
    const measurementIndex = this.measurements.findIndex((entry): boolean => entry.id === measurementId);
    if (measurementIndex === -1) {
      return;
    }

    const measurement = this.measurements[measurementIndex];
    if (this.selectedMeasurement?.id === measurementId) {
      this.deselectMeasurement();
    }

    this.disposeStoredMeasurement(measurement);
    this.measurements.splice(measurementIndex, 1);
    this.emitMeasurements();
  }

  clearAllMeasurements(): void {
    if (this.scene !== null) {
      for (const measurement of this.measurements) {
        this.disposeStoredMeasurement(measurement);
      }
    }

    this.measurements = [];
    this.cancelActiveMeasurement();
    this.deselectMeasurement();
    this.clearPreviewLine();
    this.measurements$.next([]);
  }

  cancelInteraction(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragTarget = null;
      this.onDragEnd?.();
    }

    this.cancelActiveMeasurement();
    this.clearPreviewLine();
    this.deselectMeasurement();
  }

  async detectLengthUnit(ifcLoader: IFCLoader, modelID: number): Promise<IfcLengthUnit> {
    try {
      const unitAssignmentIDs = await ifcLoader.ifcManager.getAllItemsOfType(modelID, WebIFC.IFCUNITASSIGNMENT, false);

      if (unitAssignmentIDs.length === 0) {
        return this.fallbackUnit();
      }

      const unitAssignment = await ifcLoader.ifcManager.getItemProperties(modelID, unitAssignmentIDs[0], true);
      const unitRefs = this.extractUnitReferenceIds(unitAssignment);

      for (const unitRef of unitRefs) {
        const unit = await ifcLoader.ifcManager.getItemProperties(modelID, unitRef);
        const unitType = this.readWrappedValue(unit, 'UnitType');
        if (unitType !== 'LENGTHUNIT') {
          continue;
        }

        const prefix = this.readWrappedValue(unit, 'Prefix') ?? '';
        const name = this.readWrappedValue(unit, 'Name') ?? 'METRE';
        return this.resolveUnit(prefix, name);
      }
    } catch (error: unknown) {
      debugLog('measure', 'unit detection failed, using fallback:', error);
    }

    return this.fallbackUnit();
  }

  private startMeasurement(point: Vector3): void {
    this.cancelActiveMeasurement();
    this.deselectMeasurement();

    this.activeMeasurement = {
      id: this.createMeasurementId(),
      pointA: point.clone(),
      markerA: this.createMarker(point),
    };
    this.activeMeasurement$.next(true);
  }

  private finaliseMeasurement(point: Vector3): void {
    if (this.activeMeasurement === null) {
      return;
    }

    const pointA = this.activeMeasurement.pointA.clone();
    const pointB = point.clone();
    const distance = this.computeDistance(pointA, pointB);
    const formatted = this.formatDistance(distance);
    const markerA = this.activeMeasurement.markerA;
    const markerB = this.createMarker(pointB);
    const line = this.createMeasureLine(pointA, pointB);
    const midpoint = new Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
    const label = this.createDistanceLabel(midpoint, distance);
    const deleteHitZone = this.createDeleteHitZone(midpoint);

    const storedMeasurement: StoredMeasurement = {
      id: this.activeMeasurement.id,
      pointA,
      pointB,
      distance,
      unit: this.lengthUnit,
      formatted,
      markerA,
      markerB,
      line,
      label,
      deleteHitZone,
    };

    this.measurements.push(storedMeasurement);
    this.activeMeasurement = null;
    this.activeMeasurement$.next(false);
    this.clearPreviewLine();
    this.emitMeasurements();
    this.selectMeasurement(storedMeasurement);
  }

  private cancelActiveMeasurement(): void {
    if (this.activeMeasurement === null) {
      this.activeMeasurement$.next(false);
      return;
    }

    if (this.scene !== null) {
      this.scene.remove(this.activeMeasurement.markerA);
    }
    this.activeMeasurement.markerA.geometry.dispose();
    this.disposeMaterial(this.activeMeasurement.markerA.material);
    this.activeMeasurement = null;
    this.activeMeasurement$.next(false);
  }

  private updatePreviewLine(event: MouseEvent): void {
    if (this.activeMeasurement === null || this.scene === null) {
      return;
    }

    const hit = this.castMeasureRay(event);
    if (hit === null) {
      return;
    }

    if (this.previewLine) {
      this.scene.remove(this.previewLine);
      this.previewLine.geometry.dispose();
      this.disposeMaterial(this.previewLine.material);
    }

    const geometry = new BufferGeometry().setFromPoints([this.activeMeasurement.pointA, hit.point]);
    const material = new LineDashedMaterial({
      color: 0x00d4ff,
      dashSize: 0.1 / this.lengthUnit.toMetres,
      gapSize: 0.05 / this.lengthUnit.toMetres,
      depthTest: false,
    });
    this.previewLine = new Line(geometry, material);
    this.previewLine.computeLineDistances();
    this.previewLine.renderOrder = 998;
    this.scene.add(this.previewLine);
  }

  private updateMeasurementPoint(measurement: StoredMeasurement, target: DragTarget, point: Vector3): void {
    if (target === 'A') {
      measurement.pointA = point.clone();
      measurement.markerA.position.copy(point);
    } else {
      measurement.pointB = point.clone();
      measurement.markerB.position.copy(point);
    }

    measurement.distance = this.computeDistance(measurement.pointA, measurement.pointB);
    measurement.formatted = this.formatDistance(measurement.distance);

    const positions = measurement.line.geometry.getAttribute('position') as BufferAttribute;
    positions.setXYZ(0, measurement.pointA.x, measurement.pointA.y, measurement.pointA.z);
    positions.setXYZ(1, measurement.pointB.x, measurement.pointB.y, measurement.pointB.z);
    positions.needsUpdate = true;
    measurement.line.geometry.computeBoundingSphere();

    const midpoint = new Vector3().addVectors(measurement.pointA, measurement.pointB).multiplyScalar(0.5);
    this.positionLabel(midpoint, measurement.label);
    this.positionDeleteHitZone(midpoint, measurement.deleteHitZone, measurement.label);
    this.updateLabelTexture(measurement.label, measurement.distance);

    this.emitMeasurements();
  }

  private selectMeasurement(measurement: StoredMeasurement): void {
    if (this.selectedMeasurement?.id === measurement.id) {
      return;
    }

    if (this.selectedMeasurement !== null) {
      this.applyDefaultStyle(this.selectedMeasurement);
    }

    this.selectedMeasurement = measurement;
    this.applySelectedStyle(measurement);
    this.selectedMeasurement$.next(measurement);
  }

  private deselectMeasurement(): void {
    if (this.selectedMeasurement === null) {
      return;
    }

    this.applyDefaultStyle(this.selectedMeasurement);
    this.selectedMeasurement = null;
    this.selectedMeasurement$.next(null);
  }

  private applySelectedStyle(measurement: StoredMeasurement): void {
    (measurement.markerA.material as MeshBasicMaterial).color.set(0xffffff);
    (measurement.markerB.material as MeshBasicMaterial).color.set(0xffffff);
    (measurement.line.material as LineBasicMaterial).color.set(0xffffff);
  }

  private applyDefaultStyle(measurement: StoredMeasurement): void {
    const color = 0x00d4ff;
    (measurement.markerA.material as MeshBasicMaterial).color.set(color);
    (measurement.markerB.material as MeshBasicMaterial).color.set(color);
    (measurement.line.material as LineBasicMaterial).color.set(color);
  }

  private emitMeasurements(): void {
    this.measurements$.next(
      this.measurements.map((measurement): MeasurementResult => this.toMeasurementResult(measurement)),
    );
  }

  private toMeasurementResult(measurement: StoredMeasurement): MeasurementResult {
    return {
      id: measurement.id,
      formatted: measurement.formatted,
      unit: measurement.unit,
      distance: measurement.distance,
      pointA: measurement.pointA.clone(),
      pointB: measurement.pointB.clone(),
    };
  }

  private castMeasureRay(event: MouseEvent): Intersection | null {
    if (this.scene === null) {
      return null;
    }

    const excluded = new Set<Object3D>();
    for (const measurement of this.measurements) {
      excluded.add(measurement.markerA);
      excluded.add(measurement.markerB);
      excluded.add(measurement.line);
      excluded.add(measurement.deleteHitZone);
      excluded.add(measurement.label);
    }
    if (this.activeMeasurement !== null) {
      excluded.add(this.activeMeasurement.markerA);
    }

    const targets: Object3D[] = [];
    this.scene.traverse((child: Object3D): void => {
      if (isMeshObject(child) && !excluded.has(child)) {
        targets.push(child);
      }
    });

    return this.castRayAgainst(event, targets);
  }

  private castRayAgainst(event: MouseEvent, objects: Object3D[]): Intersection | null {
    if (objects.length === 0 || this.renderer === null || this.camera === null) {
      return null;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(objects, false);
    return hits.length > 0 ? hits[0] : null;
  }

  private createMarker(position: Vector3): Mesh {
    const geometry = new SphereGeometry(this.markerRadius, 16, 16);
    const material = new MeshBasicMaterial({ color: 0x00d4ff, depthTest: false });
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.renderOrder = 999;
    this.scene?.add(mesh);
    return mesh;
  }

  private createMeasureLine(pointA: Vector3, pointB: Vector3): Line {
    const geometry = new BufferGeometry().setFromPoints([pointA, pointB]);
    const material = new LineBasicMaterial({ color: 0x00d4ff, depthTest: false });
    const line = new Line(geometry, material);
    line.renderOrder = 999;
    this.scene?.add(line);
    return line;
  }

  private createDistanceLabel(midpoint: Vector3, distance: number): Sprite {
    const texture = new CanvasTexture(this.renderLabelCanvas(distance));
    const material = new SpriteMaterial({ map: texture, depthTest: false, sizeAttenuation: true });
    const sprite = new Sprite(material);
    this.positionLabel(midpoint, sprite);
    sprite.scale.set(this.labelScaleX, this.labelScaleY, 1);
    sprite.renderOrder = 1000;
    this.scene?.add(sprite);
    return sprite;
  }

  private renderLabelCanvas(distance: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context === null) {
      return canvas;
    }

    context.fillStyle = 'rgba(0, 212, 255, 0.92)';
    context.beginPath();
    context.roundRect(4, 4, 256, 56, 12);
    context.fill();

    context.fillStyle = '#0a1628';
    context.font = 'bold 26px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.formatDistance(distance), 132, 32);

    context.fillStyle = 'rgba(255, 80, 80, 0.9)';
    context.beginPath();
    context.roundRect(268, 4, 48, 56, [0, 12, 12, 0]);
    context.fill();

    context.fillStyle = '#ffffff';
    context.font = 'bold 28px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('x', 292, 32);

    return canvas;
  }

  private createDeleteHitZone(midpoint: Vector3): Mesh {
    const geometry = new PlaneGeometry(this.labelScaleX * 0.16, this.labelScaleY * 0.95);
    const material = new MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0,
      transparent: true,
      side: DoubleSide,
      depthTest: false,
    });
    const mesh = new Mesh(geometry, material);
    this.positionDeleteHitZone(midpoint, mesh);
    mesh.onBeforeRender = (_renderer, _scene, camera): void => {
      mesh.quaternion.copy(camera.quaternion);
    };
    mesh.renderOrder = 1001;
    this.scene?.add(mesh);
    return mesh;
  }

  private positionLabel(midpoint: Vector3, label: Sprite): void {
    label.position.copy(midpoint);
    label.position.y += this.labelOffsetY;
  }

  private positionDeleteHitZone(midpoint: Vector3, deleteHitZone: Mesh, label?: Sprite): void {
    const sourceLabelScaleX = label?.scale.x ?? this.labelScaleX;
    const rightOffset = sourceLabelScaleX * 0.35;
    deleteHitZone.position.set(midpoint.x + rightOffset, midpoint.y + this.labelOffsetY, midpoint.z);
  }

  private updateLabelTexture(sprite: Sprite, distance: number): void {
    const material = sprite.material as SpriteMaterial;
    material.map?.dispose();
    material.map = new CanvasTexture(this.renderLabelCanvas(distance));
    material.needsUpdate = true;
  }

  private disposeStoredMeasurement(measurement: StoredMeasurement): void {
    this.disposeObject3D(measurement.markerA);
    this.disposeObject3D(measurement.markerB);
    this.disposeObject3D(measurement.line);
    this.disposeObject3D(measurement.deleteHitZone);

    if (this.scene !== null) {
      this.scene.remove(measurement.label);
    }
    const spriteMaterial = measurement.label.material as SpriteMaterial;
    spriteMaterial.map?.dispose();
    spriteMaterial.dispose();
  }

  private disposeObject3D(object: Mesh | Line): void {
    if (this.scene !== null) {
      this.scene.remove(object);
    }
    object.geometry.dispose();
    this.disposeMaterial(object.material);
  }

  private clearPreviewLine(): void {
    if (this.previewLine === null) {
      return;
    }

    if (this.scene !== null) {
      this.scene.remove(this.previewLine);
    }
    this.previewLine.geometry.dispose();
    this.disposeMaterial(this.previewLine.material);
    this.previewLine = null;
  }

  private createMeasurementId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `measurement-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  private computeDistance(pointA: Vector3, pointB: Vector3): number {
    return parseFloat(pointA.distanceTo(pointB).toFixed(3));
  }

  private formatDistance(rawDistance: number): string {
    const unit = this.lengthUnit;

    if (unit.name === 'MILLIMETRE') {
      return rawDistance >= 1000 ? `${(rawDistance / 1000).toFixed(2)} m` : `${rawDistance.toFixed(0)} mm`;
    }

    if (unit.name === 'METRE') {
      return rawDistance >= 1 ? `${rawDistance.toFixed(2)} m` : `${(rawDistance * 100).toFixed(1)} cm`;
    }

    if (unit.name === 'FOOT') {
      const totalInches = rawDistance * 12;
      const feet = Math.floor(rawDistance);
      const inches = Math.round(totalInches % 12);
      return inches > 0 ? `${feet} ft ${inches} in` : `${feet} ft`;
    }

    return `${rawDistance.toFixed(3)} ${unit.symbol}`;
  }

  private resolveUnit(prefix: string, name: string): IfcLengthUnit {
    const key = `${prefix}${name}`.toUpperCase();
    const map: Record<string, IfcLengthUnit> = {
      METRE: { name: 'METRE', symbol: 'm', toMetres: 1 },
      MILLIMETRE: { name: 'MILLIMETRE', symbol: 'mm', toMetres: 0.001 },
      CENTIMETRE: { name: 'CENTIMETRE', symbol: 'cm', toMetres: 0.01 },
      DECIMETRE: { name: 'DECIMETRE', symbol: 'dm', toMetres: 0.1 },
      KILOMETRE: { name: 'KILOMETRE', symbol: 'km', toMetres: 1000 },
      FOOT: { name: 'FOOT', symbol: 'ft', toMetres: 0.3048 },
      INCH: { name: 'INCH', symbol: 'in', toMetres: 0.0254 },
    };

    return map[key] ?? this.fallbackUnit();
  }

  private fallbackUnit(): IfcLengthUnit {
    return { name: 'METRE', symbol: 'm', toMetres: 1 };
  }

  private extractUnitReferenceIds(unitAssignment: unknown): number[] {
    if (!unitAssignment || typeof unitAssignment !== 'object') {
      return [];
    }

    const units = (unitAssignment as { Units?: { value?: unknown } }).Units?.value;
    if (!Array.isArray(units)) {
      return [];
    }

    return units
      .map((unitRef: unknown): number | null => {
        if (!unitRef || typeof unitRef !== 'object') {
          return null;
        }

        const id = (unitRef as { value?: unknown }).value;
        return typeof id === 'number' ? id : null;
      })
      .filter((id: number | null): id is number => id !== null);
  }

  private readWrappedValue(input: unknown, property: string): string | null {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const wrapped = (input as Record<string, unknown>)[property];
    if (!wrapped || typeof wrapped !== 'object') {
      return null;
    }

    const value = (wrapped as { value?: unknown }).value;
    return typeof value === 'string' ? value : null;
  }

  private disposeMaterial(material: Material | Material[]): void {
    if (Array.isArray(material)) {
      for (const entry of material) {
        entry.dispose();
      }
      return;
    }

    material.dispose();
  }
}

function isMeshObject(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}
