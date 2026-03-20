import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';

import { InteractionMode } from '../../models/interaction-mode.enum';

@Component({
  selector: 'app-scene-toolbox',
  templateUrl: './scene-toolbox.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class SceneToolboxComponent implements OnInit {
  readonly activeMode = input.required<InteractionMode>();
  readonly modeChange = output<InteractionMode>();

  readonly InteractionMode = InteractionMode;

  readonly position = signal({ x: 20, y: 80 });
  readonly isDragging = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly storageKey = 'ifc-toolbox-pos';
  private dragOffset = { x: 0, y: 0 };

  private dragMoveListener: ((event: MouseEvent) => void) | null = null;
  private dragUpListener: (() => void) | null = null;

  ngOnInit(): void {
    this.restorePosition();
    this.destroyRef.onDestroy((): void => {
      this.cleanupDrag();
    });
  }

  onToolClick(mode: InteractionMode): void {
    const nextMode = this.activeMode() === mode ? InteractionMode.Select : mode;
    this.modeChange.emit(nextMode);
  }

  onDragStart(event: MouseEvent): void {
    const currentPosition = this.position();
    this.dragOffset = {
      x: event.clientX - currentPosition.x,
      y: event.clientY - currentPosition.y,
    };
    this.isDragging.set(true);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    this.dragMoveListener = (moveEvent: MouseEvent): void => {
      this.position.set({
        x: Math.min(Math.max(0, moveEvent.clientX - this.dragOffset.x), window.innerWidth - 60),
        y: Math.min(Math.max(0, moveEvent.clientY - this.dragOffset.y), window.innerHeight - 60),
      });
    };

    this.dragUpListener = (): void => {
      this.isDragging.set(false);
      localStorage.setItem(this.storageKey, JSON.stringify(this.position()));
      this.cleanupDrag();
    };

    document.addEventListener('mousemove', this.dragMoveListener);
    document.addEventListener('mouseup', this.dragUpListener);
    event.preventDefault();
  }

  private removeDragListeners(): void {
    if (this.dragMoveListener !== null) {
      document.removeEventListener('mousemove', this.dragMoveListener);
      this.dragMoveListener = null;
    }

    if (this.dragUpListener !== null) {
      document.removeEventListener('mouseup', this.dragUpListener);
      this.dragUpListener = null;
    }
  }

  private cleanupDrag(): void {
    this.removeDragListeners();
    this.isDragging.set(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private restorePosition(): void {
    const savedValue = localStorage.getItem(this.storageKey);
    if (savedValue === null) {
      return;
    }

    try {
      const parsed = JSON.parse(savedValue) as { x?: unknown; y?: unknown };
      if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
        return;
      }
      this.position.set({ x: parsed.x, y: parsed.y });
    } catch {
      // Ignore malformed storage values and keep defaults.
    }
  }
}
