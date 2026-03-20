import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { AreaMeasurementResult } from '../../models/area-measurement.model';
import { IfcModelOption } from '../../models/ifc-model-option.model';
import { InteractionMode } from '../../models/interaction-mode.enum';
import { MeasurementResult } from '../../models/measurement.model';
import { SelectedElement } from '../../models/ifc-element.model';
import { PanelAreaMeasurementsComponent } from './subcomponents/panel-area-measurements/panel-area-measurements.component';
import { PanelIdleComponent } from './subcomponents/panel-idle/panel-idle.component';
import { PanelMeasurementsComponent } from './subcomponents/panel-measurements/panel-measurements.component';
import { PanelSelectionComponent } from './subcomponents/panel-selection/panel-selection.component';

@Component({
  selector: 'app-properties-panel',
  imports: [PanelAreaMeasurementsComponent, PanelIdleComponent, PanelMeasurementsComponent, PanelSelectionComponent],
  templateUrl: './properties-panel.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPanel {
  readonly availableModels = input<IfcModelOption[]>([]);
  readonly selectedModelUrl = input<string | null>(null);
  readonly selectedElement = input<SelectedElement | null>(null);
  readonly measurements = input<MeasurementResult[]>([]);
  readonly areaMeasurements = input<AreaMeasurementResult[]>([]);
  readonly activeMeasurement = input<boolean>(false);
  readonly activeAreaPoints = input<number>(0);
  readonly selectedId = input<string | null>(null);
  readonly selectedAreaId = input<string | null>(null);
  readonly activeMode = input<InteractionMode>(InteractionMode.Select);

  readonly colorChange = output<string>();
  readonly resetColor = output<void>();
  readonly deselect = output<void>();
  readonly selectMeasurement = output<string>();
  readonly deleteMeasurement = output<string>();
  readonly clearAll = output<void>();
  readonly selectArea = output<string>();
  readonly deleteArea = output<string>();
  readonly clearAllAreas = output<void>();
  readonly modelChange = output<string>();

  /** Expose enum to the template. */
  readonly InteractionMode = InteractionMode;
  readonly collapsed = signal(false);

  toggleCollapse(): void {
    this.collapsed.update((value): boolean => !value);
  }
}
