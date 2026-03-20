import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { MeasurementResult } from '../../../../models/measurement.model';
import { Vector3Pipe } from '../../../../pipes/vector3.pipe';

@Component({
  selector: 'app-panel-measurements',
  imports: [Vector3Pipe],
  templateUrl: './panel-measurements.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelMeasurementsComponent {
  readonly measurements = input<MeasurementResult[]>([]);
  readonly activeMeasurement = input(false);
  readonly selectedId = input<string | null>(null);

  readonly selectMeasurement = output<string>();
  readonly deleteMeasurement = output<string>();
  readonly clearAll = output<void>();

  onDeleteMeasurement(event: MouseEvent, measurementId: string): void {
    event.stopPropagation();
    this.deleteMeasurement.emit(measurementId);
  }
}
