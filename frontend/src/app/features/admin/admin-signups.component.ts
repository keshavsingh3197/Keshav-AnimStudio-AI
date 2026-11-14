import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AdminMember, AdminSignupItem, SignupStatus } from '../../core/models/signup.models';
import { SignupService } from '../../core/services/signup.service';
import { LoadingStateComponent } from '../../shared/loading-state.component';

type Tab = 'requests' | 'members';
type Filter = 'pending' | 'approved' | 'rejected' | 'all';

interface Deciding {
  ids: string[];
  kind: 'approve' | 'reject';
}

/**
 * Who may use AnimStudio: the access requests people made from the sign-in dialog, and the
 * accounts approving them created.
 *
 * Approving grants the AnimStudio-only role and nothing else, so a person approved here can
 * sign in to AnimStudio and to no other site that shares the single sign-on. The server
 * enforces that - this page cannot ask for more, and it only ever lists AnimStudio requests
 * and AnimStudio-only accounts.
 */
@Component({
  selector: 'app-admin-signups',
  imports: [DatePipe, FormsModule, LoadingStateComponent],
  templateUrl: './admin-signups.component.html',
  styleUrl: './admin-signups.component.css',
})
export class AdminSignupsComponent implements OnInit {
  private readonly api = inject(SignupService);

  readonly tab = signal<Tab>('requests');
  readonly filter = signal<Filter>('pending');
  readonly query = signal('');

  readonly items = signal<AdminSignupItem[]>([]);
  readonly members = signal<AdminMember[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly membersLoaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  /** Whether the sign-in dialog offers "Request access"; null until known. */
  readonly open = signal<boolean | null>(null);
  readonly openBusy = signal(false);

  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly deciding = signal<Deciding | null>(null);
  readonly note = signal('');
  readonly working = signal<string | null>(null);

  readonly memberBusy = signal<string | null>(null);
  readonly memberConfirm = signal<string | null>(null);

  readonly counts = computed(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: this.items().length };
    for (const i of this.items()) {
      if (i.status === 'Pending') c.pending++;
      else if (i.status === 'Approved') c.approved++;
      else if (i.status === 'Rejected') c.rejected++;
    }
    return c;
  });

  readonly rows = computed(() => {
    const f = this.filter();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.items()
      .filter((i) => f === 'all' || i.status.toLowerCase() === f)
      .filter((i) => {
        if (words.length === 0) return true;
        const text = `${i.displayName} ${i.email} ${i.reason ?? ''}`.toLowerCase();
        return words.every((w) => text.includes(w));
      })
      // Waiting requests oldest first - the one waiting longest is the next to answer - and decided ones newest first.
      .sort((a, b) => (this.filter() === 'pending'
        ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
        : Date.parse(b.decidedAt ?? b.createdAt) - Date.parse(a.decidedAt ?? a.createdAt)));
  });

  readonly memberRows = computed(() => {
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.members().filter((m) => {
      if (words.length === 0) return true;
      return words.every((w) => `${m.displayName} ${m.email}`.toLowerCase().includes(w));
    });
  });

  readonly pendingShown = computed(() => this.rows().filter((r) => r.status === 'Pending'));
  readonly allPendingSelected = computed(() => {
    const shown = this.pendingShown();
    return shown.length > 0 && shown.every((r) => this.selected().has(r.id));
  });
  readonly selectedCount = computed(() => this.pendingShown().filter((r) => this.selected().has(r.id)).length);

  /** The waiting requests that are ticked and still on screen. */
  selectedIds(): string[] {
    return this.pendingShown().filter((r) => this.selected().has(r.id)).map((r) => r.id);
  }

  ngOnInit(): void {
    this.reload();
    this.api.isOpen().subscribe({ next: (o) => this.open.set(o), error: () => this.open.set(null) });
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    this.deciding.set(null);
    this.memberConfirm.set(null);
    if (tab === 'members' && !this.membersLoaded()) this.loadMembers();
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
    this.deciding.set(null);
  }

  reload(): void {
    if (this.tab() === 'members') {
      this.loadMembers();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.list('all').subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
        this.loaded.set(true);
        this.selected.update((s) => new Set([...s].filter((id) => list.some((i) => i.id === id && i.status === 'Pending'))));
      },
      error: (e: unknown) => { this.loading.set(false); this.loaded.set(true); this.error.set(message(e)); },
    });
  }

  loadMembers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.members().subscribe({
      next: (list) => { this.members.set(list); this.loading.set(false); this.membersLoaded.set(true); },
      error: (e: unknown) => { this.loading.set(false); this.membersLoaded.set(true); this.error.set(message(e)); },
    });
  }

  // --- opening and closing the door

  toggleOpen(): void {
    const next = !this.open();
    this.openBusy.set(true);
    this.api.setOpen(next).subscribe({
      next: (o) => { this.open.set(o); this.openBusy.set(false); this.notice.set(o ? 'Access requests are open.' : 'Access requests are closed. Waiting requests stay in the queue.'); },
      error: (e: unknown) => { this.openBusy.set(false); this.error.set(message(e)); },
    });
  }

  // --- selecting

  toggle(id: string): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  toggleAll(): void {
    const all = this.allPendingSelected();
    this.selected.update((s) => {
      const next = new Set(s);
      for (const r of this.pendingShown()) { if (all) next.delete(r.id); else next.add(r.id); }
      return next;
    });
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  // --- deciding

  ask(kind: 'approve' | 'reject', ids: string[]): void {
    this.note.set('');
    this.error.set(null);
    this.deciding.set({ ids, kind });
  }

  cancel(): void {
    this.deciding.set(null);
    this.note.set('');
  }

  isDeciding(id: string): boolean {
    return !!this.deciding()?.ids.includes(id);
  }

  confirm(): void {
    const d = this.deciding();
    if (!d || this.working()) return;
    const note = this.note().trim();
    const run = (id: string) => (d.kind === 'approve' ? this.api.approve(id, note) : this.api.reject(id, note));
    let done = 0;
    const failures: string[] = [];
    this.working.set(d.ids[0] ?? null);
    const next = (index: number): void => {
      if (index >= d.ids.length) {
        this.working.set(null);
        this.deciding.set(null);
        this.note.set('');
        this.selected.set(new Set());
        const verb = d.kind === 'approve' ? 'Approved' : 'Rejected';
        this.notice.set(done > 0 ? `${verb} ${done} request${done === 1 ? '' : 's'}.${d.kind === 'approve' ? ' They can sign in to AnimStudio now.' : ''}` : null);
        if (failures.length > 0) this.error.set(failures[0] + (failures.length > 1 ? ` (and ${failures.length - 1} more failed)` : ''));
        this.reload();
        return;
      }
      this.working.set(d.ids[index]);
      run(d.ids[index]).subscribe({
        next: () => { done++; next(index + 1); },
        error: (e: unknown) => { failures.push(message(e)); next(index + 1); },
      });
    };
    next(0);
  }

  // --- approved people

  askMember(id: string): void {
    this.memberConfirm.set(id);
  }

  setMemberActive(m: AdminMember, active: boolean): void {
    this.memberBusy.set(m.id);
    this.memberConfirm.set(null);
    this.api.setMemberActive(m.id, active).subscribe({
      next: (updated) => {
        this.members.update((list) => list.map((x) => (x.id === m.id ? { ...x, isActive: updated.isActive } : x)));
        this.memberBusy.set(null);
        this.notice.set(active ? `${m.displayName || m.email} can sign in again.` : `${m.displayName || m.email} is switched off and signed out everywhere.`);
      },
      error: (e: unknown) => { this.memberBusy.set(null); this.error.set(message(e)); },
    });
  }

  // --- display

  initials(name: string, email: string): string {
    const source = (name || email).trim();
    const parts = source.split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
    return letters.toUpperCase();
  }

  ago(iso: string | null): string {
    if (!iso) return '';
    const ms = Date.now() - Date.parse(iso);
    if (!Number.isFinite(ms) || ms < 0) return '';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  tone(status: SignupStatus): string {
    return status === 'Approved' ? 'ok' : status === 'Rejected' ? 'err' : 'warn';
  }

  dismiss(): void {
    this.notice.set(null);
    this.error.set(null);
  }
}

function message(e: unknown): string {
  return e instanceof ApiFailure || e instanceof Error ? e.message : 'Something went wrong.';
}
