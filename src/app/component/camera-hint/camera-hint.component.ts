import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-camera-hint',
  templateUrl: './camera-hint.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraHintComponent implements OnInit {
  readonly visible = signal(false);
  readonly fading = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  private readonly storageKey = 'ifc-cam-hint-seen';

  ngOnInit(): void {
    if (localStorage.getItem(this.storageKey) !== null) {
      return;
    }

    this.visible.set(true);

    const fadeTimer = setTimeout((): void => {
      this.fading.set(true);

      const hideTimer = setTimeout((): void => {
        this.visible.set(false);
        localStorage.setItem(this.storageKey, '1');
      }, 800);

      this.destroyRef.onDestroy((): void => clearTimeout(hideTimer));
    }, 5000);

    this.destroyRef.onDestroy((): void => clearTimeout(fadeTimer));
  }
}
