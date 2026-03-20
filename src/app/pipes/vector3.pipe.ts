import { Pipe, PipeTransform } from '@angular/core';
import type { Vector3 } from 'three';

@Pipe({
  name: 'vector3',
})
export class Vector3Pipe implements PipeTransform {
  transform(vector: Vector3): string {
    return `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)})`;
  }
}
