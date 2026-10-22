import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminAccess } from '../core/models/api.models';
import { ActivityPanelComponent } from './activity-panel.component';
import { ProjectHubModalComponent } from './project-hub-modal.component';
import { ActivityService } from '../core/services/activity.service';
import { ApiService } from '../core/services/api.service';
import { ShortsService } from '../core/services/shorts.service';
import { StatusService } from '../core/services/status.service';

/** How often the Shorts badge is re-read; alerts change on the scale of renders and days, not seconds. */
const SHORTS_ATTENTION_MS = 5 * 60 * 1000;

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
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ProjectHubModalComponent, ActivityPanelComponent],
  template: `
    <header class="topbar">
      <div class="wrap topbar-inner">
        <a routerLink="/projects" class="brand">AnimStudio<span>AI</span></a>

        <nav class="topbar-nav" aria-label="Main Studio Navigation">
          <a routerLink="/projects" routerLinkActive="active" class="topbar-navlink">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span>Projects</span>
          </a>
          <a routerLink="/shorts" routerLinkActive="active" class="topbar-navlink"
             [title]="shortsAttention() ? shortsAttention() + ' thing(s) on the Shorts page want attention' : 'Every short across your projects'">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <span>Shorts</span>
            @if (shortsAttention() > 0) {
              <span class="topbar-badge warn">{{ shortsAttention() }}</span>
            }
          </a>
          <a routerLink="/calendar" routerLinkActive="active" class="topbar-navlink" title="Plan posts ahead and check they're scheduled">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Calendar</span>
          </a>
          <a routerLink="/effects" routerLinkActive="active" class="topbar-navlink" title="Effects &amp; overlays - subscribe buttons, stingers, end screens and sounds to reuse in every video">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/><line x1="19" y1="17" x2="19" y2="22"/><line x1="16.5" y1="19.5" x2="21.5" y2="19.5"/></svg>
            <span>Effects</span>
          </a>
          <button type="button" (click)="openVideoModal()" class="topbar-navlink topbar-navbtn">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            <span>Video Editor</span>
          </button>
          <a routerLink="/tools" routerLinkActive="active" class="topbar-navlink">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
            <span>Media Studio</span>
          </a>
          <a routerLink="/release" routerLinkActive="active" class="topbar-navlink">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <span>Music Release</span>
          </a>

          <span class="topbar-divider" aria-hidden="true"></span>

          <a routerLink="/youtube" routerLinkActive="active" class="topbar-navlink">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="4"/><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none"/></svg>
            <span>YouTube</span>
          </a>
          <a routerLink="/youtube/details" routerLinkActive="active" class="topbar-navlink" title="Full details and fresh SEO for any list of video IDs">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>
            <span>Video Details</span>
          </a>
          <a routerLink="/live" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="topbar-navlink">
            <span class="topbar-live-dot" aria-hidden="true"></span>
            <span>Go Live</span>
          </a>
          <a routerLink="/live/camera" routerLinkActive="active" class="topbar-navlink">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span>Camera Studio</span>
          </a>
          <a routerLink="/collab" routerLinkActive="active" class="topbar-navlink">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Collab</span>
          </a>

          <span class="topbar-divider" aria-hidden="true"></span>

          <a routerLink="/logs" routerLinkActive="active" class="topbar-navlink">
            <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            <span>Logs</span>
            @if (status.logEntries().length > 0) {
              <span class="topbar-badge">{{ status.logEntries().length }}</span>
            }
          </a>
        </nav>

        <div class="topbar-end">
          @if (activity.items().length > 0) {
            <button type="button" class="topbar-activity" (click)="activityPanel()?.toggle()"
                    [class.is-running]="activity.running().length > 0"
                    title="Uploads, exports and downloads">
              @if (activity.running().length > 0) {
                <span class="topbar-busy-dot"></span>
                <span>{{ activity.running().length }} active</span>
              } @else {
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Activity</span>
              }
            </button>
          }
          @if (status.busy()) {
            <span class="topbar-busy" role="status" aria-live="polite">
              <span class="topbar-busy-dot"></span>
              <span>Working&hellip;</span>
            </span>
          }
          @if (access()?.canAdminister) {
            <a routerLink="/admin" routerLinkActive="active" class="topbar-navlink topbar-settings" title="Server & Studio Settings">
              <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings</span>
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
              <div class="notice-body">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ message }}</span>
              </div>
              <button class="secondary small" type="button" (click)="status.clearError()">Dismiss</button>
            </div>
          }

          @if (status.latestNotice(); as notice) {
            <div class="notice notice-info">
              <div class="notice-body">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>{{ notice }}</span>
              </div>
              <button class="secondary small" type="button" (click)="status.dismissNotice()">Dismiss</button>
            </div>
          }
        </div>
      }

      <app-project-hub-modal [(isOpen)]="showVideoModal"></app-project-hub-modal>
      <router-outlet></router-outlet>
    </main>

    <app-activity-panel></app-activity-panel>

    <footer class="app-footer">
      <div class="wrap app-footer-inner">
        <div class="app-footer-brand">
          <a routerLink="/projects" class="brand">AnimStudio<span>AI</span></a>
          <span class="app-footer-tagline">Script to screen: scenes, clips, live broadcast, and renders in one studio.</span>
        </div>

        <nav class="app-footer-links" aria-label="Footer">
          <a routerLink="/projects">Projects</a>
          <a routerLink="/shorts">Shorts</a>
          <a routerLink="/effects">Effects</a>
          <a routerLink="/tools">Media Studio</a>
          <a routerLink="/release">Music Release</a>
          <a routerLink="/youtube">YouTube</a>
          <a routerLink="/youtube/details">Video Details</a>
          <a routerLink="/live">Go Live</a>
          <a routerLink="/live/camera">Camera Studio</a>
          <a routerLink="/collab">Collab Studio</a>
          <a routerLink="/logs">Logs</a>
          @if (access()?.canAdminister) {
            <a routerLink="/admin">Settings</a>
          }
        </nav>

        <span class="app-footer-copy">&copy; {{ year }} AnimStudio AI</span>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    :host > main {
      flex: 1 0 auto;
      width: 100%;
    }

    .app-footer {
      border-top: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      backdrop-filter: blur(16px);
      color: var(--muted);
      font-size: .8rem;
    }

    .app-footer-inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: .85rem 1.5rem;
      padding-top: 1.1rem;
      padding-bottom: 1.1rem;
    }

    .app-footer-brand {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .75rem;
    }

    .app-footer-brand .brand {
      font-size: 0.98rem;
    }

    .app-footer-tagline {
      color: var(--muted);
      font-size: 0.8rem;
    }

    .app-footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.9rem;
    }

    .app-footer-links a {
      color: var(--muted);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s ease;
    }

    .app-footer-links a:hover {
      color: var(--text);
    }

    .topbar-nav {
      display: flex;
      align-items: center;
      gap: .22rem;
      flex: 1 1 auto;
      justify-content: center;
      overflow-x: auto;
      scrollbar-width: none;
      padding: 2px 4px;
    }

    .topbar-nav::-webkit-scrollbar {
      display: none;
    }

    .topbar-divider {
      width: 1px;
      height: 1.15rem;
      background: var(--border-bright);
      margin: 0 0.25rem;
      flex-shrink: 0;
      opacity: 0.65;
    }

    .topbar-navlink {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .38rem .72rem;
      border-radius: 8px;
      border: 1px solid transparent;
      text-decoration: none;
      color: var(--muted);
      font-size: .83rem;
      font-weight: 600;
      white-space: nowrap;
      transition: color .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
      position: relative;
    }

    .topbar-navbtn {
      background: transparent;
      box-shadow: none;
      cursor: pointer;
    }

    .topbar-navbtn:hover:not(:disabled) {
      transform: none;
      box-shadow: none;
    }

    .topbar-navlink:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.06);
    }

    .topbar-navlink.active {
      color: #ffffff;
      background: linear-gradient(180deg, rgba(108, 140, 255, 0.18) 0%, rgba(108, 140, 255, 0.08) 100%);
      border-color: rgba(108, 140, 255, 0.35);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 10px rgba(61, 98, 230, 0.16);
    }

    .topbar-navlink.active .topbar-svg {
      color: var(--brand-bright);
    }

    .topbar-svg {
      flex-shrink: 0;
      opacity: 0.88;
      transition: color 0.15s ease, opacity 0.15s ease;
    }

    .topbar-navlink:hover .topbar-svg {
      opacity: 1;
    }

    .topbar-live-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #f44350;
      box-shadow: 0 0 8px rgba(244, 67, 80, 0.7);
      flex-shrink: 0;
    }

    .topbar-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.15rem;
      height: 1.15rem;
      padding: 0 .32rem;
      border-radius: 99px;
      background: var(--brand-dim);
      color: #fff;
      font-size: .65rem;
      font-weight: 800;
      line-height: 1;
    }

    .topbar-badge.warn {
      background: rgba(245, 158, 11, 0.22);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: var(--warn);
    }

    .topbar-end {
      display: flex;
      align-items: center;
      gap: .55rem;
      flex-shrink: 0;
    }

    .topbar-busy {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: 0.28rem 0.65rem;
      border-radius: 99px;
      background: rgba(108, 140, 255, 0.1);
      border: 1px solid rgba(108, 140, 255, 0.25);
      color: var(--brand-bright);
      font-size: .78rem;
      font-weight: 600;
    }

    .topbar-busy-dot {
      width: .5rem;
      height: .5rem;
      border-radius: 50%;
      background: var(--brand);
      box-shadow: 0 0 8px var(--brand);
      animation: busyPulse 1.2s ease-in-out infinite;
    }

    @keyframes busyPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .4; transform: scale(.75); }
    }

    .topbar-activity {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .34rem .72rem;
      border: 1px solid var(--border);
      border-radius: 99px;
      background: var(--surface-2);
      color: var(--text-dim);
      font: inherit;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: none;
    }

    .topbar-activity:hover:not(:disabled),
    .topbar-activity.is-running {
      color: var(--text);
      background: var(--surface-3);
      border-color: color-mix(in srgb, var(--brand) 55%, var(--border));
      box-shadow: 0 0 12px rgba(108, 140, 255, 0.16);
      transform: none;
    }

    .topbar-settings {
      border-radius: 8px;
      padding: .36rem .68rem;
      font-size: .82rem;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.025);
    }

    .topbar-banners {
      margin-bottom: 1.1rem;
    }

    .notice {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .notice-body {
      display: flex;
      align-items: center;
      gap: 0.65rem;
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
  readonly activity = inject(ActivityService);
  readonly access = signal<AdminAccess | null>(null);
  readonly activityPanel = viewChild(ActivityPanelComponent);

  readonly showVideoModal = signal(false);
  /** Warnings and errors on the Shorts page - failed renders or copies, used-up stock, a missed weekly goal. */
  readonly shortsAttention = signal(0);
  private readonly shorts = inject(ShortsService);
  readonly year = new Date().getFullYear();
  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  private refreshShortsAttention(): void {
    // A badge is a nicety: if the overview can't be read, there is simply no badge.
    this.shorts.overview().subscribe({
      next: (o) => this.shortsAttention.set(o.alerts.filter((a) => a.severity !== 'info').length),
      error: () => undefined,
    });
  }

  openVideoModal() {
    this.showVideoModal.set(true);
  }

  constructor() {
    this.refreshShortsAttention();
    setInterval(() => this.refreshShortsAttention(), SHORTS_ATTENTION_MS);

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
