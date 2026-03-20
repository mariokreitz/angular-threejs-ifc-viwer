import type { Line, Mesh, Sprite, Vector3 } from 'three';

export type IfcLengthUnit = {
  name: string;
  symbol: string;
  /** Conversion factor where 1 unit equals this many metres. */
  toMetres: number;
};

export type MeasurementResult = {
  id: string;
  formatted: string;
  unit: IfcLengthUnit;
  /** Raw distance in IFC model units, as computed from model coordinates. */
  distance: number;
  pointA: Vector3;
  pointB: Vector3;
};

export type StoredMeasurement = {
  id: string;
  pointA: Vector3;
  pointB: Vector3;
  distance: number;
  unit: IfcLengthUnit;
  formatted: string;
  markerA: Mesh;
  markerB: Mesh;
  line: Line;
  label: Sprite;
  deleteHitZone: Mesh;
};
