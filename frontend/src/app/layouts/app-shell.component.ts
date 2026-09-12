import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
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
      <!--
        Both banners share one wrapper so there is a single thing to scroll to, and it
        exists only while there is something to say - which is what lets the effect below
        notice it appearing.
      -->
      @if (status.error() !== null || status.notices().length > 0) {
        <div #banner>
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
              <button class="secondary" type="button"
                      (click)="status.dismissNotices()">Dismiss</button>
            </div>
          }
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

  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  constructor() {
    /**
     * Brings a new banner into view.
     *
     * The banners sit at the top of the page, and the screens are long - the clip editor
     * is several screens tall - so a refused upload reported up here, while the user is
     * looking at the watermark settings, is a refusal nobody sees: the click appears to do
     * nothing at all. Scrolling is done here rather than by each feature because this is
     * the only place that knows a banner just appeared.
     *
     * Both the message and the count are read so a SECOND failure, arriving while a
     * banner is already showing, scrolls again instead of being silently appended.
     */
    effect(() => {
      const message = this.status.error();
      const count = this.status.notices().length;

      // The query resolves a render after the wrapper appears, so this effect runs again
      // with the element in hand - no manual "wait for the DOM" needed.
      const element = this.banner()?.nativeElement;

      if (element && (message !== null || count > 0)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    // Asked once per visit. A failure here must not put a banner over the whole
    // application: not knowing whether to show a link is not an error worth reporting, so
    // this deliberately bypasses the shared error handling.
    this.api.adminAccess().subscribe({
      next: (access) => this.access.set(access),
      error: () => this.access.set(null),
    });
  }
}
