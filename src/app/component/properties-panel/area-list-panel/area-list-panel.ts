import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AreaMeasurementResult } from '../../../models/area-measurement.model';

@Component({
  selector: 'app-area-list-panel',
  templateUrl: './area-list-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaListPanelComponent {
  readonly areaMeasurements = input<AreaMeasurementResult[]>([]);
  readonly activeAreaPoints = input<number>(0);
  readonly selectedAreaId = input<string | null>(null);

  readonly selectArea = output<string>();
  readonly deleteArea = output<string>();
  readonly clearAllAreas = output<void>();

  onSelectArea(areaMeasurement: AreaMeasurementResult): void {
    this.selectArea.emit(areaMeasurement.id);
  }

  onDeleteArea(event: MouseEvent, areaMeasurementId: string): void {
    event.stopPropagation();
    this.deleteArea.emit(areaMeasurementId);
  }

  onClearAllAreas(): void {
    this.clearAllAreas.emit();
  }
}
