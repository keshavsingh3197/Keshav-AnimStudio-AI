import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { StatusService } from '../core/services/status.service';

/**
 * The frame every screen sits in: the brand bar, the one place errors and warnings are
 * shown, and the outlet. Keeping the banners here means no feature has to render them.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="topbar">
      <div class="wrap topbar-inner">
        <a routerLink="/projects" class="brand">AnimStudio<span>AI</span></a>
        @if (status.busy()) {
          <span class="muted">working&hellip;</span>
        }
      </div>
    </header>

    <main class="wrap">
      @if (status.error(); as message) {
        <div class="notice error">
          {{ message }}
          <button class="link" type="button" (click)="status.clearError()">dismiss</button>
        </div>
      }

      @if (status.notices().length > 0) {
        <div class="card">
          @for (notice of status.notices(); track $index) {
            <div class="notice">{{ notice }}</div>
          }
          <button class="secondary" type="button" (click)="status.dismissNotices()">Dismiss</button>
        </div>
      }

      <router-outlet />
    </main>
  `,
})
export class AppShellComponent {
  readonly status = inject(StatusService);
}
