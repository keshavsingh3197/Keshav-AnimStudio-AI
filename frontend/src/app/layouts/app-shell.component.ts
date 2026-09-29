import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminAccess } from '../core/models/api.models';
import { ProjectHubModalComponent } from './project-hub-modal.component';
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
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ProjectHubModalComponent],
  template: `
    <header class="topbar">
      <div class="wrap topbar-inner">
        <a routerLink="/projects" class="brand">AnimStudio<span>AI</span></a>

        <span style="flex: 1 1 auto"></span>
        <nav class="topbar-nav">
          <a routerLink="/projects" routerLinkActive="active" class="topbar-navlink">
            <span class="topbar-navlink-icon">🎬</span> Projects
          </a>
          <a (click)="openVideoModal()" class="topbar-navlink" style="cursor: pointer;">
            <span class="topbar-navlink-icon">🎞️</span> Video Editor
          </a>
          <a routerLink="/tools" routerLinkActive="active" class="topbar-navlink">
            <span class="topbar-navlink-icon">🎞</span> Media Studio
          </a>
          <a routerLink="/logs" routerLinkActive="active" class="topbar-navlink">
            <span class="topbar-navlink-icon">📜</span> Logs
            @if (status.logEntries().length > 0) {
              <span class="topbar-badge">{{ status.logEntries().length }}</span>
            }
          </a>
        </nav>

        @if (status.busy()) {
          <span class="muted">working&hellip;</span>
        }


        <div class="topbar-end">
          @if (status.busy()) {
            <span class="topbar-busy">
              <span class="topbar-busy-dot"></span>
              Working…
            </span>
          }
          @if (access()?.canAdminister) {
            <a routerLink="/admin" routerLinkActive="active" class="topbar-navlink topbar-settings">
              ⚙ Settings
            </a>
          }
        </div>
      </div>
    </header>

    <main class="wrap">
      <!--
        Both banners share one wrapper so there is a single thing to scroll to, and it
        exists only while there is something to say - which is what lets the effect below
        exists only while there is something to say — which is what lets the effect below
        notice it appearing.
      -->
      @if (status.error() !== null || status.latestNotice() !== null) {
        <div #banner class="topbar-banners">
          @if (status.error(); as message) {
            <div class="notice error">
              <span>{{ message }}</span>
              <button class="link" type="button" (click)="status.clearError()">dismiss</button>
            </div>
          }

          @if (status.latestNotice(); as notice) {
            <div class="notice notice-info">
              <span>{{ notice }}</span>
              <button class="link" type="button" (click)="status.dismissNotice()">Dismiss</button>
            </div>
          }
        </div>
      }

      
      <app-project-hub-modal [(isOpen)]="showVideoModal"></app-project-hub-modal>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .topbar-nav {
      display: flex;
      align-items: center;
      gap: .2rem;
    }

    .topbar-navlink {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      padding: .35rem .75rem;
      border-radius: 99px;
      text-decoration: none;
      color: var(--muted);
      font-size: .875rem;
      font-weight: 600;
      transition: color .15s ease, background .15s ease;
      position: relative;
    }

    .topbar-navlink:hover {
      color: var(--text);
      background: color-mix(in srgb, var(--surface-2) 80%, transparent);
    }

    .topbar-navlink.active {
      color: var(--text);
      background: color-mix(in srgb, var(--brand) 14%, transparent);
    }

    .topbar-navlink-icon {
      font-size: .95rem;
      line-height: 1;
    }

    .topbar-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.15rem;
      height: 1.15rem;
      padding: 0 .3rem;
      border-radius: 99px;
      background: var(--brand-dim);
      color: #fff;
      font-size: .65rem;
      font-weight: 800;
      line-height: 1;
    }

    .topbar-end {
      display: flex;
      align-items: center;
      gap: .75rem;
    }

    .topbar-busy {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      color: var(--muted);
      font-size: .82rem;
    }

    .topbar-busy-dot {
      width: .55rem;
      height: .55rem;
      border-radius: 50%;
      background: var(--brand);
      animation: busyPulse 1.2s ease-in-out infinite;
    }

    @keyframes busyPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .4; transform: scale(.75); }
    }

    .topbar-settings {
      border-radius: var(--radius-sm);
      padding: .3rem .65rem;
      font-size: .82rem;
    }

    .topbar-banners {
      margin-bottom: 1rem;
    }

    .notice {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .notice-info {
      border-left-color: var(--brand);
    }
  `],
})

export class AppShellComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly status = inject(StatusService);
  readonly access = signal<AdminAccess | null>(null);

  readonly showVideoModal = signal(false);
  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  openVideoModal() {
    this.showVideoModal.set(true);
  }

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
      const notice = this.status.latestNotice();

      // The query resolves a render after the wrapper appears, so this effect runs again
      // with the element in hand - no manual "wait for the DOM" needed.
      const element = this.banner()?.nativeElement;

      if (element && (message !== null || notice !== null)) {
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
