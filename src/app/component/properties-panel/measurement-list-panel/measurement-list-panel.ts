import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { MeasurementResult } from '../../../models/measurement.model';
import { Vector3Pipe } from '../../../pipes/vector3.pipe';

@Component({
  selector: 'app-measurement-list-panel',
  imports: [Vector3Pipe],
  templateUrl: './measurement-list-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasurementListPanelComponent {
  readonly measurements = input<MeasurementResult[]>([]);
  readonly activeMeasurement = input<boolean>(false);
  readonly selectedId = input<string | null>(null);

  readonly selectMeasurement = output<string>();
  readonly deleteMeasurement = output<string>();
  readonly clearAll = output<void>();

  formatRawDistance(distance: number): string {
    return distance.toFixed(3);
  }

  onSelectMeasurement(measurement: MeasurementResult): void {
    this.selectMeasurement.emit(measurement.id);
  }

  onDeleteMeasurement(event: MouseEvent, measurementId: string): void {
    event.stopPropagation();
    this.deleteMeasurement.emit(measurementId);
  }

  onClearAll(): void {
    this.clearAll.emit();
  }
}
