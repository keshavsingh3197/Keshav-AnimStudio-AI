import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminAccess } from '../core/models/api.models';
import { ApiService } from '../core/services/api.service';
import { StatusService } from '../core/services/status.service';

/**
 * The frame every screen sits in: the brand bar, the one place errors and warnings are
 * shown, and the outlet. Keeping the banners here means no feature has to render them.
 *
 * The settings link appears only when this browser would actually be admitted. That is a
 * courtesy rather than a control - the server enforces the same rule on every admin
 * endpoint - and it comes from the server rather than being guessed here, so the link and
 * the refusal can never disagree.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="topbar">
      <div class="wrap topbar-inner">
        <a routerLink="/projects" class="brand">AnimStudio<span>AI</span></a>

        <span style="flex: 1 1 auto"></span>

        @if (status.busy()) {
          <span class="muted">working&hellip;</span>
        }

        @if (access()?.canAdminister) {
          <a routerLink="/admin" routerLinkActive="active" class="muted">Settings</a>
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
  private readonly api = inject(ApiService);

  readonly status = inject(StatusService);
  readonly access = signal<AdminAccess | null>(null);

  constructor() {
    // Asked once per visit. A failure here must not put a banner over the whole
    // application: not knowing whether to show a link is not an error worth reporting, so
    // this deliberately bypasses the shared error handling.
    this.api.adminAccess().subscribe({
      next: (access) => this.access.set(access),
      error: () => this.access.set(null),
    });
  }
}
