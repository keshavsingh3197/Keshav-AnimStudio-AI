import { Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AdminAccess } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SignupService } from '../../core/services/signup.service';
import { StatusService } from '../../core/services/status.service';
import { SETTINGS_GROUPS, SETTINGS_PAGES, searchSettings } from './settings-registry';

/**
 * The frame around the console: a sidebar of every settings page, grouped and searchable,
 * and a plain statement of who is allowed to use it.
 *
 * The pages come from settings-registry, so the sidebar grows by an entry rather than a
 * tab. The access check is made here rather than in each screen so the answer is asked for
 * once and the reason is said once. It is not a security boundary - every endpoint
 * underneath enforces the same rule server-side - it is there so the screens are not a
 * row of refusals.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
})
export class AdminShellComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly status = inject(StatusService);
  readonly access = signal<AdminAccess | null>(null);

  /** Access requests waiting for a decision, for the badge on "Sign-ups & members". */
  readonly pendingSignups = signal(0);
  private readonly signups = inject(SignupService);

  readonly query = signal('');
  readonly results = computed(() => searchSettings(this.query()));
  readonly groups = SETTINGS_GROUPS.map((name) => ({
    name,
    pages: SETTINGS_PAGES.filter((p) => p.group === name),
  }));

  /** On a narrow screen the page list folds into one row showing where you are. */
  readonly navOpen = signal(false);
  private readonly url = signal(this.router.url);
  readonly current = computed(() =>
    SETTINGS_PAGES.find((p) => this.url().split(/[?#]/)[0].startsWith(`/admin/${p.route}`)) ?? SETTINGS_PAGES[0]);

  @ViewChild('search') searchRef?: ElementRef<HTMLInputElement>;

  constructor() {
    this.recheckAccess();
    effect(() => {
      const u = this.auth.user();
      if (u) {
        this.recheckAccess();
      }
    });

    const sub = this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.url.set(e.urlAfterRedirects);
      this.navOpen.set(false);
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  recheckAccess(): void {
    this.status.run(this.api.adminAccess(), (access) => {
      this.access.set(access);
      if (access.canAdminister) {
        // Best effort: a badge isn't worth an error banner if the identity service is slow.
        this.signups.summary().subscribe({ next: (s) => this.pendingSignups.set(s.pending), error: () => this.pendingSignups.set(0) });
      }
      if (!access.canAdminister && this.auth.isAdmin()) {
        // Attempt silent refresh in case the token just expired
        this.auth.refreshSession().subscribe({
          next: () => {
            this.status.run(this.api.adminAccess(), (refreshed) => this.access.set(refreshed));
          },
          error: () => {},
        });
      }
    });
  }

  openSignIn(): void {
    this.auth.openAuthModal();
  }

  openFirst(): void {
    const first = this.results()[0];
    if (!first) return;
    this.query.set('');
    void this.router.navigate([first.page.route], { relativeTo: this.route });
  }

  /** "/" jumps to search, as in most editors - unless the user is already typing somewhere. */
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
    e.preventDefault();
    this.searchRef?.nativeElement.focus();
  }
}
