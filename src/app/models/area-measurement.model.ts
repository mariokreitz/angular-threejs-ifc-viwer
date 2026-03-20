import type { Line, Mesh, Sprite, Vector3 } from 'three';

import type { IfcLengthUnit } from './measurement.model';

export type StoredAreaMeasurement = {
  id: string;
  points: Vector3[];
  area: number;
  formatted: string;
  unit: IfcLengthUnit;
  markers: Mesh[];
  edges: Line[];
  closingEdge: Line | null;
  fill: Mesh | null;
  label: Sprite;
  deleteHitZone: Mesh;
};

export type AreaMeasurementResult = {
  id: string;
  points: Vector3[];
  area: number;
  formatted: string;
  unit: IfcLengthUnit;
};
