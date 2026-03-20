import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { SelectedElement } from '../../../../models/ifc-element.model';

@Component({
  selector: 'app-panel-selection',
  templateUrl: './panel-selection.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelSelectionComponent {
  readonly selectedElement = input.required<SelectedElement>();

  readonly colorChange = output<string>();
  readonly resetColor = output<void>();
  readonly deselect = output<void>();

  readonly currentColor = computed((): string => this.selectedElement().colorHex ?? '#f5f5f0');
  readonly presetColors = [
    '#f5f5f0',
    '#e8d5b7',
    '#c8e6c9',
    '#b3d9f7',
    '#ffd180',
    '#ffab91',
    '#ce93d8',
    '#80cbc4',
    '#ef9a9a',
  ] as const;

  onColorInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    this.colorChange.emit(event.target.value);
  }

  onSwatchClick(color: string): void {
    this.colorChange.emit(color);
  }
}
