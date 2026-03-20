/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShapeUtils,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Intersection } from 'three';
import { AreaMeasurementResult, StoredAreaMeasurement } from '../../models/area-measurement.model';
import type { IfcLengthUnit } from '../../models/measurement.model';

type PlaneProjection = {
  origin: Vector3;
  tangent: Vector3;
  bitangent: Vector3;
};

@Injectable({ providedIn: 'root' })
export class AreaMeasureService {
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private renderer: WebGLRenderer | null = null;
  private readonly raycaster = new Raycaster();
  private readonly mouse = new Vector2();

  private areaMeasurements: StoredAreaMeasurement[] = [];
  private activePoints: Vector3[] = [];
  private activeMarkers: Mesh[] = [];
  private activeEdges: Line[] = [];
  private previewEdge: Line | null = null;
  private closingPreviewEdge: Line | null = null;
  private activeFill: Mesh | null = null;
  private selectedMeasurement: StoredAreaMeasurement | null = null;
  private isDragging = false;
  private dragMarkerIndex: number | null = null;

  onDragStart: (() => void) | null = null;
  onDragEnd: (() => void) | null = null;

  lengthUnit: IfcLengthUnit = { name: 'METRE', symbol: 'm', toMetres: 1 };

  readonly areaMeasurements$ = new BehaviorSubject<AreaMeasurementResult[]>([]);
  readonly selectedMeasurement$ = new BehaviorSubject<StoredAreaMeasurement | null>(null);
  readonly activePointCount$ = new BehaviorSubject<number>(0);

  private get markerRadius(): number {
    const targetSizeMetres = 0.05;
    return targetSizeMetres / this.lengthUnit.toMetres;
  }

  private get labelOffsetY(): number {
    return 0.15 / this.lengthUnit.toMetres;
  }

  private get labelScaleX(): number {
    return 1.2 / this.lengthUnit.toMetres;
  }

  private get labelScaleY(): number {
    return 0.28 / this.lengthUnit.toMetres;
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
      this.areaMeasurements.map((measurement): Object3D => measurement.deleteHitZone),
    );
    if (deleteHit) {
      const measurementToDelete = this.areaMeasurements.find(
        (measurement): boolean => measurement.deleteHitZone === deleteHit.object,
      );
      if (measurementToDelete) {
        this.deleteAreaMeasurement(measurementToDelete.id);
        return;
      }
    }

    if (this.activeMarkers.length >= 3) {
      const closeHit = this.castRayAgainst(event, [this.activeMarkers[0]]);
      if (closeHit) {
        this.finaliseAreaMeasurement();
        return;
      }
    }

    const selectTargets = this.areaMeasurements.flatMap((measurement): Object3D[] => {
      const targets: Object3D[] = [...measurement.markers, ...measurement.edges];
      if (measurement.fill !== null) {
        targets.push(measurement.fill);
      }
      return targets;
    });
    const selectHit = this.castRayAgainst(event, selectTargets);
    if (selectHit) {
      const selected = this.areaMeasurements.find((measurement): boolean => {
        const isMarker = measurement.markers.includes(selectHit.object as Mesh);
        const isEdge = measurement.edges.includes(selectHit.object as Line);
        const isFill = measurement.fill === selectHit.object;
        return isMarker || isEdge || isFill;
      });
      if (selected) {
        this.selectAreaMeasurement(selected);
        return;
      }
    }

    if (this.selectedMeasurement !== null && this.activePoints.length === 0) {
      this.deselectAreaMeasurement();
      return;
    }

    const hit = this.castMeasureRay(event);
    if (hit === null) {
      return;
    }

    this.addPoint(hit.point);
  }

  onMouseDown(event: MouseEvent): void {
    if (this.selectedMeasurement === null) {
      return;
    }

    for (let index = 0; index < this.selectedMeasurement.markers.length; index += 1) {
      const marker = this.selectedMeasurement.markers[index];
      const hit = this.castRayAgainst(event, [marker]);
      if (hit) {
        this.isDragging = true;
        this.dragMarkerIndex = index;
        this.onDragStart?.();
        event.preventDefault();
        return;
      }
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.selectedMeasurement !== null && this.dragMarkerIndex !== null) {
      const hit = this.castMeasureRay(event);
      if (hit !== null) {
        this.updateDraggedPoint(this.selectedMeasurement, this.dragMarkerIndex, hit.point);
      }
      return;
    }

    if (this.activePoints.length === 0) {
      return;
    }

    const hit = this.castMeasureRay(event);
    if (hit === null) {
      return;
    }

    this.updatePreviewEdges(hit.point);

    if (this.activePoints.length >= 2) {
      this.updateActiveFill([...this.activePoints, hit.point]);
    }
  }

  onMouseUp(): void {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.dragMarkerIndex = null;
    this.onDragEnd?.();
  }

  selectAreaMeasurementById(measurementId: string): void {
    const measurement = this.areaMeasurements.find((entry): boolean => entry.id === measurementId);
    if (measurement !== undefined) {
      this.selectAreaMeasurement(measurement);
    }
  }

  deleteAreaMeasurement(measurementId: string): void {
    const measurementIndex = this.areaMeasurements.findIndex((entry): boolean => entry.id === measurementId);
    if (measurementIndex === -1) {
      return;
    }

    const measurement = this.areaMeasurements[measurementIndex];
    if (this.selectedMeasurement?.id === measurementId) {
      this.deselectAreaMeasurement();
    }

    this.disposeAreaMeasurement(measurement);
    this.areaMeasurements.splice(measurementIndex, 1);
    this.emitAreaMeasurements();
  }

  clearAllAreaMeasurements(): void {
    this.cancelActive();
    for (const measurement of this.areaMeasurements) {
      this.disposeAreaMeasurement(measurement);
    }
    this.areaMeasurements = [];
    this.selectedMeasurement = null;
    this.areaMeasurements$.next([]);
    this.selectedMeasurement$.next(null);
  }

  cancelActive(): void {
    this.disposeObjects(this.activeMarkers);
    this.disposeObjects(this.activeEdges);
    this.activeMarkers = [];
    this.activeEdges = [];
    this.activePoints = [];
    this.activePointCount$.next(0);

    this.removePreviewArtifacts();

    if (this.activeFill !== null) {
      this.disposeMesh(this.activeFill);
      this.activeFill = null;
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.dragMarkerIndex = null;
      this.onDragEnd?.();
    }
  }

  hasActivePoints(): boolean {
    return this.activePoints.length > 0;
  }

  removeLastPoint(): void {
    if (this.activePoints.length === 0) {
      return;
    }

    this.removePreviewArtifacts();

    const lastMarker = this.activeMarkers.pop();
    if (lastMarker !== undefined) {
      this.disposeMesh(lastMarker);
    }

    const lastEdge = this.activeEdges.pop();
    if (lastEdge !== undefined) {
      this.disposeLine(lastEdge);
    }

    this.activePoints.pop();

    if (this.activePoints.length < 3 && this.activeMarkers[0] !== undefined) {
      const firstMarkerMaterial = this.activeMarkers[0].material as MeshBasicMaterial;
      firstMarkerMaterial.color.set(0x00d4ff);
    }

    this.updateActiveFill();
    this.activePointCount$.next(this.activePoints.length);
  }

  private addPoint(point: Vector3): void {
    this.activePoints.push(point.clone());
    this.activeMarkers.push(this.createMarker(point));

    if (this.activePoints.length > 1) {
      const previous = this.activePoints[this.activePoints.length - 2];
      const edge = this.createEdgeLine(previous, point);
      this.activeEdges.push(edge);
    }

    if (this.activePoints.length >= 3) {
      this.updateActiveFill();
      const firstMaterial = this.activeMarkers[0].material as MeshBasicMaterial;
      firstMaterial.color.set(0xffffff);
    }

    this.activePointCount$.next(this.activePoints.length);
  }

  private finaliseAreaMeasurement(): void {
    if (this.activePoints.length < 3) {
      return;
    }

    this.removePreviewArtifacts();

    if (this.activeFill !== null) {
      this.disposeMesh(this.activeFill);
      this.activeFill = null;
    }

    const points = this.activePoints.map((point): Vector3 => point.clone());
    const closingEdge = this.createEdgeLine(points[points.length - 1], points[0]);
    const area = this.computePolygonArea(points);
    const formatted = this.formatArea(area);
    const fill = this.createPolygonFill(points, 0.15);
    const centroid = this.computeCentroid(points);
    const label = this.createAreaLabel(centroid, area);
    const deleteHitZone = this.createDeleteHitZone(centroid);

    const measurement: StoredAreaMeasurement = {
      id: this.createAreaId(),
      points,
      area,
      formatted,
      unit: this.lengthUnit,
      markers: [...this.activeMarkers],
      edges: [...this.activeEdges, closingEdge],
      closingEdge,
      fill,
      label,
      deleteHitZone,
    };

    this.activePoints = [];
    this.activeMarkers = [];
    this.activeEdges = [];
    this.activePointCount$.next(0);

    this.areaMeasurements.push(measurement);
    this.emitAreaMeasurements();
    this.selectAreaMeasurement(measurement);
  }

  private updatePreviewEdges(currentPoint: Vector3): void {
    this.removePreviewArtifacts();

    const lastPoint = this.activePoints[this.activePoints.length - 1];
    this.previewEdge = this.createEdgeLine(lastPoint, currentPoint, 998);

    if (this.activePoints.length >= 3) {
      this.closingPreviewEdge = this.createEdgeLine(currentPoint, this.activePoints[0], 998);
    }
  }

  private updateActiveFill(previewPoints?: Vector3[]): void {
    if (this.activeFill !== null) {
      this.disposeMesh(this.activeFill);
      this.activeFill = null;
    }

    const points = previewPoints ?? this.activePoints;
    if (points.length < 3) {
      return;
    }

    this.activeFill = this.createPolygonFill(points, 0.25);
  }

  private selectAreaMeasurement(measurement: StoredAreaMeasurement): void {
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

  private deselectAreaMeasurement(): void {
    if (this.selectedMeasurement === null) {
      return;
    }

    this.applyDefaultStyle(this.selectedMeasurement);
    this.selectedMeasurement = null;
    this.selectedMeasurement$.next(null);
  }

  private applySelectedStyle(measurement: StoredAreaMeasurement): void {
    for (const marker of measurement.markers) {
      (marker.material as MeshBasicMaterial).color.set(0xffffff);
    }
    for (const edge of measurement.edges) {
      (edge.material as LineBasicMaterial).color.set(0xffffff);
    }
    if (measurement.fill !== null) {
      (measurement.fill.material as MeshBasicMaterial).opacity = 0.25;
    }
  }

  private applyDefaultStyle(measurement: StoredAreaMeasurement): void {
    for (let index = 0; index < measurement.markers.length; index += 1) {
      const marker = measurement.markers[index];
      const color = index === 0 && measurement.points.length >= 3 ? 0xffffff : 0x00d4ff;
      (marker.material as MeshBasicMaterial).color.set(color);
    }
    for (const edge of measurement.edges) {
      (edge.material as LineBasicMaterial).color.set(0x00d4ff);
    }
    if (measurement.fill !== null) {
      (measurement.fill.material as MeshBasicMaterial).opacity = 0.15;
    }
  }

  private updateDraggedPoint(measurement: StoredAreaMeasurement, pointIndex: number, point: Vector3): void {
    measurement.points[pointIndex] = point.clone();
    measurement.markers[pointIndex].position.copy(point);

    this.rebuildEdges(measurement);

    measurement.area = this.computePolygonArea(measurement.points);
    measurement.formatted = this.formatArea(measurement.area);

    this.rebuildFill(measurement);
    this.updateAreaLabelTexture(measurement.label, measurement.area);

    const centroid = this.computeCentroid(measurement.points);
    this.positionLabel(centroid, measurement.label);
    this.positionDeleteHitZone(centroid, measurement.deleteHitZone, measurement.label);

    this.emitAreaMeasurements();
  }

  private rebuildEdges(measurement: StoredAreaMeasurement): void {
    this.disposeObjects(measurement.edges);

    const edges: Line[] = [];
    const pointCount = measurement.points.length;
    for (let index = 0; index < pointCount; index += 1) {
      edges.push(this.createEdgeLine(measurement.points[index], measurement.points[(index + 1) % pointCount]));
    }
    measurement.edges = edges;
    measurement.closingEdge = edges[edges.length - 1] ?? null;

    if (this.selectedMeasurement?.id === measurement.id) {
      this.applySelectedStyle(measurement);
    } else {
      this.applyDefaultStyle(measurement);
    }
  }

  private rebuildFill(measurement: StoredAreaMeasurement): void {
    if (measurement.fill !== null) {
      this.disposeMesh(measurement.fill);
    }
    measurement.fill = this.createPolygonFill(
      measurement.points,
      this.selectedMeasurement?.id === measurement.id ? 0.25 : 0.15,
    );
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

  private createEdgeLine(pointA: Vector3, pointB: Vector3, renderOrder = 999): Line {
    const geometry = new BufferGeometry().setFromPoints([pointA, pointB]);
    const material = new LineBasicMaterial({ color: 0x00d4ff, depthTest: false });
    const line = new Line(geometry, material);
    line.renderOrder = renderOrder;
    this.scene?.add(line);
    return line;
  }

  private createPolygonFill(points: Vector3[], opacity: number): Mesh {
    const projection = this.createPlaneProjection(points);
    const localPoints2d = points.map((point): Vector2 => this.projectPointTo2d(point, projection));

    const triangleIndices = ShapeUtils.triangulateShape(localPoints2d, []);
    const indexBuffer = triangleIndices.flat();

    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        points.flatMap((point): number[] => [point.x, point.y, point.z]),
        3,
      ),
    );
    geometry.setIndex(indexBuffer);
    geometry.computeVertexNormals();

    const material = new MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity,
      side: DoubleSide,
      depthTest: true,
    });

    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = 997;
    this.scene?.add(mesh);
    return mesh;
  }

  private computePolygonArea(points: Vector3[]): number {
    if (points.length < 3) {
      return 0;
    }

    const normal = new Vector3(0, 0, 0);
    const pointCount = points.length;

    for (let index = 0; index < pointCount; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % pointCount];
      normal.x += (current.y - next.y) * (current.z + next.z);
      normal.y += (current.z - next.z) * (current.x + next.x);
      normal.z += (current.x - next.x) * (current.y + next.y);
    }

    return normal.length() / 2;
  }

  private computePolygonNormal(points: Vector3[]): Vector3 {
    const normal = new Vector3(0, 0, 0);
    const pointCount = points.length;
    for (let index = 0; index < pointCount; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % pointCount];
      normal.x += (current.y - next.y) * (current.z + next.z);
      normal.y += (current.z - next.z) * (current.x + next.x);
      normal.z += (current.x - next.x) * (current.y + next.y);
    }

    if (normal.lengthSq() === 0) {
      return new Vector3(0, 1, 0);
    }

    return normal.normalize();
  }

  private createPlaneProjection(points: Vector3[]): PlaneProjection {
    const origin = points[0].clone();
    const normal = this.computePolygonNormal(points);

    let tangent = new Vector3().subVectors(points[1] ?? points[0], points[0]);
    if (tangent.lengthSq() === 0) {
      tangent = new Vector3(1, 0, 0);
    }
    tangent.normalize();

    // Ensure tangent is not parallel to normal.
    if (Math.abs(tangent.dot(normal)) > 0.95) {
      tangent = new Vector3(0, 0, 1).cross(normal).normalize();
      if (tangent.lengthSq() === 0) {
        tangent = new Vector3(1, 0, 0);
      }
    }

    const bitangent = new Vector3().crossVectors(normal, tangent).normalize();

    return { origin, tangent, bitangent };
  }

  private projectPointTo2d(point: Vector3, projection: PlaneProjection): Vector2 {
    const offset = new Vector3().subVectors(point, projection.origin);
    return new Vector2(offset.dot(projection.tangent), offset.dot(projection.bitangent));
  }

  private computeCentroid(points: Vector3[]): Vector3 {
    const centroid = new Vector3();
    for (const point of points) {
      centroid.add(point);
    }
    centroid.divideScalar(points.length);
    return centroid;
  }

  private formatArea(area: number): string {
    const unit = this.lengthUnit;

    if (unit.name === 'MILLIMETRE') {
      return area >= 1_000_000 ? `${(area / 1_000_000).toFixed(2)} m2` : `${area.toFixed(0)} mm2`;
    }

    if (unit.name === 'METRE') {
      return area >= 1 ? `${area.toFixed(2)} m2` : `${(area * 10_000).toFixed(0)} cm2`;
    }

    if (unit.name === 'FOOT') {
      return `${area.toFixed(2)} ft2`;
    }

    return `${area.toFixed(3)} ${unit.symbol}2`;
  }

  private createAreaLabel(centroid: Vector3, area: number): Sprite {
    const texture = new CanvasTexture(this.renderAreaLabelCanvas(area));
    const material = new SpriteMaterial({ map: texture, depthTest: false, sizeAttenuation: true });
    const sprite = new Sprite(material);
    this.positionLabel(centroid, sprite);
    sprite.scale.set(this.labelScaleX, this.labelScaleY, 1);
    sprite.renderOrder = 1000;
    this.scene?.add(sprite);
    return sprite;
  }

  private renderAreaLabelCanvas(area: number): HTMLCanvasElement {
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
    context.font = 'bold 24px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.formatArea(area), 132, 32);

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

  private updateAreaLabelTexture(label: Sprite, area: number): void {
    const material = label.material as SpriteMaterial;
    material.map?.dispose();
    material.map = new CanvasTexture(this.renderAreaLabelCanvas(area));
    material.needsUpdate = true;
  }

  private createDeleteHitZone(position: Vector3): Mesh {
    const geometry = new PlaneGeometry(this.labelScaleX * 0.16, this.labelScaleY * 0.95);
    const material = new MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0,
      transparent: true,
      side: DoubleSide,
      depthTest: false,
    });

    const mesh = new Mesh(geometry, material);
    this.positionDeleteHitZone(position, mesh);
    mesh.onBeforeRender = (_renderer, _scene, camera): void => {
      mesh.quaternion.copy(camera.quaternion);
    };
    mesh.renderOrder = 1001;
    this.scene?.add(mesh);
    return mesh;
  }

  private positionLabel(position: Vector3, label: Sprite): void {
    label.position.copy(position);
    label.position.y += this.labelOffsetY;
  }

  private positionDeleteHitZone(position: Vector3, deleteHitZone: Mesh, label?: Sprite): void {
    const sourceLabelScaleX = label?.scale.x ?? this.labelScaleX;
    const rightOffset = sourceLabelScaleX * 0.35;
    deleteHitZone.position.set(position.x + rightOffset, position.y + this.labelOffsetY, position.z);
  }

  private emitAreaMeasurements(): void {
    this.areaMeasurements$.next(
      this.areaMeasurements.map(
        (measurement): AreaMeasurementResult => ({
          id: measurement.id,
          points: measurement.points.map((point): Vector3 => point.clone()),
          area: measurement.area,
          formatted: measurement.formatted,
          unit: measurement.unit,
        }),
      ),
    );
  }

  private castMeasureRay(event: MouseEvent): Intersection | null {
    if (this.scene === null) {
      return null;
    }

    const excluded = new Set<Object3D>();
    for (const measurement of this.areaMeasurements) {
      for (const marker of measurement.markers) {
        excluded.add(marker);
      }
      for (const edge of measurement.edges) {
        excluded.add(edge);
      }
      if (measurement.fill !== null) {
        excluded.add(measurement.fill);
      }
      excluded.add(measurement.label);
      excluded.add(measurement.deleteHitZone);
    }

    for (const marker of this.activeMarkers) {
      excluded.add(marker);
    }
    for (const edge of this.activeEdges) {
      excluded.add(edge);
    }
    if (this.previewEdge !== null) {
      excluded.add(this.previewEdge);
    }
    if (this.closingPreviewEdge !== null) {
      excluded.add(this.closingPreviewEdge);
    }
    if (this.activeFill !== null) {
      excluded.add(this.activeFill);
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

    const intersections = this.raycaster.intersectObjects(objects, false);
    return intersections.length > 0 ? intersections[0] : null;
  }

  private removePreviewArtifacts(): void {
    if (this.previewEdge !== null) {
      this.disposeLine(this.previewEdge);
      this.previewEdge = null;
    }
    if (this.closingPreviewEdge !== null) {
      this.disposeLine(this.closingPreviewEdge);
      this.closingPreviewEdge = null;
    }
  }

  private disposeAreaMeasurement(measurement: StoredAreaMeasurement): void {
    this.disposeObjects(measurement.markers);
    this.disposeObjects(measurement.edges);

    if (measurement.fill !== null) {
      this.disposeMesh(measurement.fill);
    }

    if (this.scene !== null) {
      this.scene.remove(measurement.label);
    }
    const labelMaterial = measurement.label.material as SpriteMaterial;
    labelMaterial.map?.dispose();
    labelMaterial.dispose();

    this.disposeMesh(measurement.deleteHitZone);
  }

  private disposeObjects(objects: (Mesh | Line)[]): void {
    for (const object of objects) {
      if (object instanceof Mesh) {
        this.disposeMesh(object);
      } else {
        this.disposeLine(object);
      }
    }
  }

  private disposeLine(line: Line): void {
    if (this.scene !== null) {
      this.scene.remove(line);
    }
    line.geometry.dispose();
    this.disposeMaterial(line.material);
  }

  private disposeMesh(mesh: Mesh): void {
    if (this.scene !== null) {
      this.scene.remove(mesh);
    }
    mesh.geometry.dispose();
    this.disposeMaterial(mesh.material);
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

  private createAreaId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `area-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }
}

function isMeshObject(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}
