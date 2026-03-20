import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { class: 'block h-dvh w-screen overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
