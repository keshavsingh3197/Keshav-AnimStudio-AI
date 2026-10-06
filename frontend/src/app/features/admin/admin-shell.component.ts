import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminAccess } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly status = inject(StatusService);
  readonly access = signal<AdminAccess | null>(null);

  readonly query = signal('');
  readonly results = computed(() => searchSettings(this.query()));
  readonly groups = SETTINGS_GROUPS.map((name) => ({
    name,
    pages: SETTINGS_PAGES.filter((p) => p.group === name),
  }));

  @ViewChild('search') searchRef?: ElementRef<HTMLInputElement>;

  constructor() {
    this.status.run(this.api.adminAccess(), (access) => this.access.set(access));
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
