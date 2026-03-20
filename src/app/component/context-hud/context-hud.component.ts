import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { InteractionMode } from '../../models/interaction-mode.enum';

@Component({
  selector: 'app-context-hud',
  templateUrl: './context-hud.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextHudComponent {
  readonly hoveredType = input<string | null>(null);
  readonly activeMode = input.required<InteractionMode>();

  readonly isMeasureMode = computed((): boolean => this.activeMode() !== InteractionMode.Select);

  readonly modeLabel = computed((): string => {
    const modeToLabel = {
      [InteractionMode.Select]: 'Select',
      [InteractionMode.Measure]: 'Measure',
      [InteractionMode.MeasureArea]: 'Area',
    } as const;

    return modeToLabel[this.activeMode()] ?? 'Select';
  });

  readonly measureHint = computed((): string => {
    if (this.activeMode() === InteractionMode.Measure) {
      return 'Click two points to measure distance · Esc to cancel';
    }
    if (this.activeMode() === InteractionMode.MeasureArea) {
      return 'Click points to define polygon · Click first point to close · Esc to undo last point';
    }
    return '';
  });
}
