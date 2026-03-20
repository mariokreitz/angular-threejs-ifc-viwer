import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AreaMeasurementResult } from '../../../../models/area-measurement.model';

@Component({
  selector: 'app-panel-area-measurements',
  templateUrl: './panel-area-measurements.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelAreaMeasurementsComponent {
  readonly areaMeasurements = input<AreaMeasurementResult[]>([]);
  readonly activeAreaPoints = input(0);
  readonly selectedAreaId = input<string | null>(null);

  readonly selectArea = output<string>();
  readonly deleteArea = output<string>();
  readonly clearAllAreas = output<void>();

  onDeleteArea(event: MouseEvent, areaMeasurementId: string): void {
    event.stopPropagation();
    this.deleteArea.emit(areaMeasurementId);
  }
}
