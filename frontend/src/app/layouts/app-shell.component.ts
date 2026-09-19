import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminAccess, Project } from '../core/models/api.models';
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

      
      @if (showVideoModal()) {
        <div class="modal-backdrop" (click)="showVideoModal.set(false)" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
          <div class="fe-panel" style="width: 500px; padding: 1.5rem; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);" (click)="$event.stopPropagation()">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <h2 style="margin: 0; font-size: 1.25rem;">Video Editor</h2>
              <button class="icon" type="button" (click)="showVideoModal.set(false)" style="font-size: 1.5rem; cursor: pointer; background: transparent; border: none; color: var(--muted);">&times;</button>
            </div>
            
            <h3 style="font-size: .85rem; color: var(--brand); margin-bottom: .5rem; text-transform: uppercase; letter-spacing: 0.5px;">Open Existing Project</h3>
            <div style="max-height: 250px; overflow-y: auto; background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: .25rem; margin-bottom: 1.5rem;">
              @if (videoProjects().length === 0) {
                <p class="muted" style="text-align: center; font-size: .85rem; margin: 1rem 0;">No projects found.</p>
              }
              @for (p of videoProjects(); track p.id) {
                <div style="display: flex; justify-content: space-between; align-items: center; padding: .65rem .75rem; border-radius: 4px; cursor: pointer; transition: background 0.15s;" (click)="openProjectInEditor(p.id)" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background='transparent'">
                  <span style="font-weight: 500; font-size: .9rem;">{{ p.name }}</span>
                  <span class="muted" style="font-size: .75rem; background: var(--surface); padding: 2px 6px; border-radius: 4px;">{{ p.width }}&times;{{ p.height }}</span>
                </div>
              }
            </div>

            <h3 style="font-size: .85rem; color: var(--brand); margin-bottom: .5rem; text-transform: uppercase; letter-spacing: 0.5px;">Create New Project</h3>
            <div style="display: flex; gap: .5rem;">
              <input #pname type="text" placeholder="New Project Name..." (keyup.enter)="createAndOpenProject(pname.value)" style="flex: 1; padding: .5rem .75rem; background: var(--surface-2); border: 1px solid var(--border); color: #fff; border-radius: 4px;" />
              <button type="button" style="background: var(--brand); color: #fff; border: none; padding: 0 1rem; border-radius: 4px; cursor: pointer; font-weight: 600;" (click)="createAndOpenProject(pname.value)">Create & Open</button>
            </div>
          </div>
        </div>
      }

      <router-outlet />
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
  readonly videoProjects = signal<Project[]>([]);

  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  openVideoModal() {
    this.showVideoModal.set(true);
    this.api.listProjects().subscribe(projects => this.videoProjects.set(projects));
  }

  openProjectInEditor(id: string) {
    this.showVideoModal.set(false);
    this.router.navigate(['/projects', id, 'clips']);
  }

  createAndOpenProject(name: string) {
    if (!name.trim()) return;
    this.status.run(
      this.api.createProject({
        name: name.trim(),
        width: 1080,
        height: 1920,
        fps: 30,
        distributionIntent: 'Social Media',
      }),
      (project) => {
        this.showVideoModal.set(false);
        this.router.navigate(['/projects', project.id, 'clips']);
      }
    );
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
