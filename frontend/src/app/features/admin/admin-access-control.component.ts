import { DatePipe } from '@angular/common';
import {
  Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { ActivatedRoute, CanDeactivateFn, RouterLink } from '@angular/router';
import { Observable, catchError, concat, defer, tap, throwError } from 'rxjs';

import {
  AdminAccessControl,
  AnonymousAccessPolicy,
  UiNavigationItemConfig,
  UiNavigationSettings,
  UserScopesOverview,
} from '../../core/models/auth.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DEFAULT_TIMEOUT_MINUTES, SessionTimeoutService } from '../../core/services/session-timeout.service';
import { StatusService } from '../../core/services/status.service';
import { DEFAULT_UI_NAVIGATION_TABS, UiNavigationService } from '../../core/services/ui-navigation.service';
import {
  AccessPrefs, COLLAPSED_BY_DEFAULT, ChangeItem, ChangeSection, ChannelFilter, ChannelSortKey, DEFAULT_POLICY_FORM,
  NAV_FILTERS, NavFilter, NavFlag, PAGE_SIZES, POLICY_LIMITS, Persona, PolicyBoolKey, PolicyForm,
  PolicyKey, PolicyNumberKey, SCOPE_ACTIVITIES, SECTION_IDS, SECTION_LABEL, ScopeActivity, ScopeFilter, ScopeSortKey,
  SectionId, SessionForm, SortDir, TIMEOUT_OPTIONS, WARNING_OPTIONS, ago, buildPersonaViews, diffPolicy, diffSession,
  diffTabs, formatPolicyValue, guestCapabilities, isAdminOnlyTab, loadPrefs, matchesActivity, matchesNavFilter,
  matchesNavQuery, matchesScopeFilter, mergePolicy, parseNumberInput, policyErrors, purgePreview, savePrefs,
  sortChannels, sortScopes, tabIcon, toChannelRows, toPolicyForm, toScopeRows, withCurrent,
} from './admin-access-control.helpers';

type SaveScope = 'all' | ChangeSection;
type DialogKind = 'purge' | 'save-confirm' | 'leave';
type BarPrompt = 'discard' | 'reload';
type ToastTone = 'ok' | 'info' | 'warn' | 'err';

interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
  action?: { label: string; run: () => void };
}

interface PendingPurge {
  days: number;
  projects: number;
  sessions: number;
  secondsLeft: number;
  total: number;
}

/** One row of the tab matrix, with everything the template needs already worked out. */
interface MatrixRow {
  tab: UiNavigationItemConfig;
  /** Administrator-only tabs ignore the guest and member switches, so those are not offered. */
  locked: boolean;
  changed: ReadonlySet<NavFlag>;
  guestNote: MatrixNote | null;
  memberNote: MatrixNote | null;
  enabledNote: MatrixNote | null;
}

/** A switch that is on but does not do what it says: a short label in the cell, the reason as its tooltip. */
interface MatrixNote {
  text: string;
  hint: string;
}

const NO_FLAGS: ReadonlySet<NavFlag> = new Set<NavFlag>();
const UNDO_SECONDS = 8;
const CHANNEL_PREVIEW_ROWS = 10;

const SCOPE_SORT_OPTIONS: readonly { key: ScopeSortKey; dir: SortDir; label: string }[] = [
  { key: 'lastActive', dir: 'desc', label: 'Last active: newest first' },
  { key: 'lastActive', dir: 'asc', label: 'Last active: oldest first' },
  { key: 'projects', dir: 'desc', label: 'Projects: most first' },
  { key: 'projects', dir: 'asc', label: 'Projects: fewest first' },
  { key: 'storage', dir: 'desc', label: 'Storage: most first' },
  { key: 'storage', dir: 'asc', label: 'Storage: least first' },
  { key: 'name', dir: 'asc', label: 'Name: A to Z' },
  { key: 'name', dir: 'desc', label: 'Name: Z to A' },
  { key: 'type', dir: 'asc', label: 'Type: members first' },
  { key: 'type', dir: 'desc', label: 'Type: guests first' },
];

const CHANNEL_SORT_OPTIONS: readonly { key: ChannelSortKey; dir: SortDir; label: string }[] = [
  { key: 'connected', dir: 'desc', label: 'Newest connection first' },
  { key: 'connected', dir: 'asc', label: 'Oldest connection first' },
  { key: 'lastActive', dir: 'desc', label: 'Recently used first' },
  { key: 'title', dir: 'asc', label: 'Name: A to Z' },
  { key: 'title', dir: 'desc', label: 'Name: Z to A' },
];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Access & UI navigation: which tabs each audience sees, how much a signed-out guest may do,
 * who has projects on this server, and which YouTube channels are connected.
 *
 * Everything editable here is a draft held beside the saved copy, so the page always knows
 * what is unsaved: it counts it, shows it row by row, previews what it would do to each
 * audience, and offers to save, review or discard it. Saving sends the same requests as
 * before (one PUT for the guest policy, one for the navigation tabs). The session timeout is
 * a per-browser setting that never touched the server and still does not.
 */
@Component({
  selector: 'app-admin-access-control',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-access-control.component.html',
  styleUrl: './admin-access-control.component.css',
})
export class AdminAccessControlComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly status = inject(StatusService);
  private readonly uiNav = inject(UiNavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly sessionTimeout = inject(SessionTimeoutService);

  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  // --- static text for the template ----------------------------------------------------------

  readonly sectionNav: readonly { id: SectionId; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'nav', label: 'Navigation' },
    { id: 'policy', label: 'Guest policy' },
    { id: 'session', label: 'Session timeout' },
    { id: 'scopes', label: 'Users & guests' },
    { id: 'identity', label: 'Identity & channels' },
  ];

  readonly personaMeta: Readonly<Record<Persona, { label: string; short: string; icon: string; blurb: string }>> = {
    guest: { label: 'Anonymous visitor', short: 'Guest', icon: '👤', blurb: 'Not signed in' },
    member: { label: 'Signed-in member', short: 'Member', icon: '🧑', blurb: 'AnimStudio account' },
    admin: { label: 'Administrator', short: 'Admin', icon: '🛡️', blurb: 'Admin role' },
  };

  readonly navFilterOptions: readonly { id: NavFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'changed', label: 'Changed' },
    { id: 'guest-visible', label: 'Shown to guests' },
    { id: 'guest-hidden', label: 'Hidden from guests' },
    { id: 'sensitive', label: 'Sensitive' },
    { id: 'disabled', label: 'Disabled' },
  ];

  readonly channelFilterOptions: readonly { id: ChannelFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'connected', label: 'Connected' },
    { id: 'reconnect', label: 'Needs reconnect' },
  ];

  readonly activityOptions: readonly { id: ScopeActivity; label: string }[] = [
    { id: 'any', label: 'Any time' },
    { id: 'day', label: 'Last 24 hours' },
    { id: 'week', label: 'Last 7 days' },
    { id: 'month', label: 'Last 30 days' },
    { id: 'older', label: 'Over 30 days ago' },
  ];

  readonly scopeSortOptions = SCOPE_SORT_OPTIONS;
  readonly channelSortOptions = CHANNEL_SORT_OPTIONS;
  readonly pageSizes = PAGE_SIZES;
  readonly purgeQuickDays: readonly number[] = [1, 3, 7, 14, 30, 90];
  readonly undoSeconds = UNDO_SECONDS;
  readonly limits = POLICY_LIMITS;
  readonly tabIcon = tabIcon;
  readonly sectionLabel = SECTION_LABEL;

  // --- remembered UI choices -----------------------------------------------------------------

  readonly prefs = signal<AccessPrefs>(loadPrefs());
  readonly persona = computed(() => this.prefs().persona);
  readonly navFilter = computed(() => this.prefs().navFilter);
  readonly scopeFilter = computed(() => this.prefs().scopeFilter);
  readonly scopeActivity = computed(() => this.prefs().scopeActivity);
  readonly scopeSort = computed(() => this.prefs().scopeSort);
  readonly scopeSortValue = computed(() => `${this.scopeSort().key}:${this.scopeSort().dir}`);
  readonly scopePageSize = computed(() => this.prefs().scopePageSize);
  readonly channelFilter = computed(() => this.prefs().channelFilter);
  readonly channelSort = computed(() => this.prefs().channelSort);
  readonly channelSortValue = computed(() => `${this.channelSort().key}:${this.channelSort().dir}`);

  // --- what the server has, and what is being edited -----------------------------------------

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly accessInfo = signal<AdminAccessControl | null>(null);

  readonly savedTabs = signal<UiNavigationItemConfig[]>([]);
  readonly draftTabs = signal<UiNavigationItemConfig[]>([]);
  readonly savedPolicy = signal<PolicyForm>({ ...DEFAULT_POLICY_FORM });
  readonly draftPolicy = signal<PolicyForm>({ ...DEFAULT_POLICY_FORM });
  readonly savedSession = signal<SessionForm>(this.currentSession());
  readonly draftSession = signal<SessionForm>(this.currentSession());

  /** The policy as the server last sent it, so fields this page does not edit are sent back unchanged. */
  private rawPolicy: AnonymousAccessPolicy | null = null;

  // --- derived: changes ----------------------------------------------------------------------

  readonly tabChanges = computed(() => diffTabs(this.savedTabs(), this.draftTabs()));
  readonly policyChanges = computed(() => diffPolicy(this.savedPolicy(), this.draftPolicy()));
  readonly sessionChanges = computed(() => diffSession(this.savedSession(), this.draftSession()));
  readonly changes = computed<ChangeItem[]>(() => [...this.tabChanges(), ...this.policyChanges(), ...this.sessionChanges()]);
  readonly changeCount = computed(() => this.changes().length);
  readonly dirty = computed(() => this.changeCount() > 0);
  readonly sectionCounts = computed<Record<SectionId, number>>(() => ({
    preview: this.tabChanges().length + this.policyChanges().length,
    nav: this.tabChanges().length,
    policy: this.policyChanges().length,
    session: this.sessionChanges().length,
    scopes: 0,
    identity: 0,
  }));
  readonly changedTabIds = computed<ReadonlySet<string>>(() => new Set(this.tabChanges().map((c) => c.target)));
  readonly changedPolicyKeys = computed<ReadonlySet<string>>(() => new Set(this.policyChanges().map((c) => c.target)));
  readonly changeBreakdown = computed(() => {
    const parts: string[] = [];
    if (this.tabChanges().length) parts.push(`Navigation ${this.tabChanges().length}`);
    if (this.policyChanges().length) parts.push(`Guest policy ${this.policyChanges().length}`);
    if (this.sessionChanges().length) parts.push(`Session ${this.sessionChanges().length}`);
    return parts.join(' · ');
  });

  readonly errors = computed(() => policyErrors(this.draftPolicy()));
  readonly hasPolicyErrors = computed(() => Object.keys(this.errors()).length > 0);
  /** Edited guest limits the server would refuse part-way through a save. */
  readonly saveBlocked = computed(() => this.policyChanges().length > 0 && this.hasPolicyErrors());

  // --- derived: preview ----------------------------------------------------------------------

  readonly personaViews = computed(() => buildPersonaViews(
    this.savedTabs(), this.draftTabs(), this.savedPolicy().allowYouTubePublish, this.draftPolicy().allowYouTubePublish));
  readonly guestCaps = computed(() => guestCapabilities(this.savedPolicy(), this.draftPolicy()));
  readonly visibleCounts = computed(() => {
    const counts: Record<Persona, number> = { guest: 0, member: 0, admin: 0 };
    for (const view of this.personaViews()) counts[view.persona] = view.visible;
    return counts;
  });

  // --- derived: navigation matrix ------------------------------------------------------------

  readonly navQuery = signal('');

  readonly shownTabs = computed(() => {
    const filter = this.navFilter();
    const changed = this.changedTabIds();
    const allowSensitive = this.draftPolicy().allowYouTubePublish;
    const query = this.navQuery();
    return this.draftTabs().filter((tab) => matchesNavFilter(tab, filter, changed, allowSensitive) && matchesNavQuery(tab, query));
  });

  readonly navFilterCounts = computed(() => {
    const tabs = this.draftTabs();
    const changed = this.changedTabIds();
    const allowSensitive = this.draftPolicy().allowYouTubePublish;
    const counts = {} as Record<NavFilter, number>;
    for (const filter of NAV_FILTERS) {
      counts[filter] = tabs.filter((tab) => matchesNavFilter(tab, filter, changed, allowSensitive)).length;
    }
    return counts;
  });

  readonly matrixRows = computed<MatrixRow[]>(() => {
    const allowSensitive = this.draftPolicy().allowYouTubePublish;
    const flagsByTab = new Map<string, Set<NavFlag>>();
    for (const change of this.tabChanges()) {
      const flags = flagsByTab.get(change.target) ?? new Set<NavFlag>();
      flags.add(change.field as NavFlag);
      flagsByTab.set(change.target, flags);
    }
    return this.shownTabs().map((tab) => {
      const locked = isAdminOnlyTab(tab);
      return {
        tab,
        locked,
        changed: flagsByTab.get(tab.id) ?? NO_FLAGS,
        guestNote: locked ? null
          : !tab.visibleToAnonymous ? null
          : !tab.enabled ? { text: 'Tab is off', hint: 'Switched on for guests, but the tab is switched off for everyone.' }
          : tab.isSensitive && !allowSensitive
            ? { text: 'Hidden anyway', hint: 'Sensitive tabs stay hidden from guests while guest YouTube publishing is off.' }
            : null,
        memberNote: locked || !tab.visibleToMembers || tab.enabled ? null
          : { text: 'Tab is off', hint: 'Switched on for members, but the tab is switched off for everyone.' },
        enabledNote: tab.id === 'admin' && !tab.enabled
          ? { text: 'Settings link hidden', hint: 'Nobody sees the Settings link in the navigation while this is off. /admin still opens directly.' }
          : null,
      };
    });
  });

  // --- derived: policy and session -----------------------------------------------------------

  readonly timeoutOptions = computed(() => withCurrent(TIMEOUT_OPTIONS, this.draftSession().timeoutMinutes));
  readonly warningOptions = computed(() => withCurrent(WARNING_OPTIONS, this.draftSession().warningMinutes));

  readonly posture = computed(() => {
    const live = this.savedPolicy();
    return {
      browsing: live.enabled,
      publishing: live.allowYouTubePublish || live.allowGoogleDrivePublish,
      render: live.allowRender ? `Guest renders up to ${live.maxRenderDurationSeconds ?? '?'} s` : 'Guest renders off',
    };
  });

  // --- scopes --------------------------------------------------------------------------------

  readonly userScopes = signal<UserScopesOverview | null>(null);
  readonly loadingScopes = signal(false);
  readonly scopesError = signal<string | null>(null);
  readonly now = signal(Date.now());

  /** The idle threshold the table highlights and the purge uses; one number, so they always agree. */
  readonly purgeInput = signal('7');
  readonly purgeDays = computed(() => {
    const value = parseNumberInput(this.purgeInput());
    return value !== null && Number.isInteger(value) && value >= 1 && value <= 90 ? value : null;
  });
  readonly staleDays = computed(() => this.purgeDays() ?? 7);

  readonly scopeQuery = signal('');
  readonly scopePage = signal(0);
  readonly scopeRows = computed(() => toScopeRows(this.userScopes()?.scopes ?? [], this.now(), this.staleDays()));
  readonly scopeCounts = computed(() => {
    const rows = this.scopeRows();
    return {
      all: rows.length,
      registered: rows.filter((r) => !r.item.isGuest).length,
      guest: rows.filter((r) => r.item.isGuest).length,
      stale: rows.filter((r) => r.stale).length,
    };
  });
  readonly filteredScopes = computed(() => {
    const words = this.scopeQuery().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filter = this.scopeFilter();
    const activity = this.scopeActivity();
    const now = this.now();
    const rows = this.scopeRows().filter((row) =>
      matchesScopeFilter(row, filter) && matchesActivity(row, activity, now) && words.every((w) => row.search.includes(w)));
    return sortScopes(rows, this.scopeSort());
  });
  readonly scopePageCount = computed(() => Math.max(1, Math.ceil(this.filteredScopes().length / this.scopePageSize())));
  readonly currentPage = computed(() => Math.min(this.scopePage(), this.scopePageCount() - 1));
  readonly pagedScopes = computed(() => {
    const start = this.currentPage() * this.scopePageSize();
    return this.filteredScopes().slice(start, start + this.scopePageSize());
  });
  readonly pageRange = computed(() => {
    const total = this.filteredScopes().length;
    const start = this.currentPage() * this.scopePageSize();
    return { from: total === 0 ? 0 : start + 1, to: Math.min(start + this.scopePageSize(), total) };
  });

  readonly purgeEstimate = computed(() => purgePreview(this.scopeRows(), this.purgeDays() ?? this.staleDays(), this.now()));
  readonly purging = signal(false);
  readonly purgeError = signal<string | null>(null);
  readonly pendingPurge = signal<PendingPurge | null>(null);
  readonly canStartPurge = computed(() => {
    if (this.purgeDays() === null || this.purging() || this.pendingPurge()) return false;
    if (this.userScopes() === null) return true;
    const estimate = this.purgeEstimate();
    return estimate.certainProjects > 0 || estimate.possibleProjects > 0;
  });

  // --- channels ------------------------------------------------------------------------------

  readonly channelsRaw = signal<readonly unknown[]>([]);
  readonly channelsLoaded = signal(false);
  readonly loadingChannels = signal(false);
  readonly channelsError = signal<string | null>(null);
  readonly channelQuery = signal('');
  readonly channelsExpanded = signal(false);
  /** Thumbnails that failed to load (blocked, expired): those channels fall back to the placeholder. */
  readonly brokenThumbs = signal<ReadonlySet<string>>(new Set());
  readonly channelRows = computed(() => toChannelRows(this.channelsRaw()));
  readonly channelsHaveOwner = computed(() => this.channelRows().some((row) => row.owner !== null));
  readonly channelCounts = computed(() => {
    const rows = this.channelRows();
    return {
      all: rows.length,
      connected: rows.filter((r) => !r.needsReconnect).length,
      reconnect: rows.filter((r) => r.needsReconnect).length,
    };
  });
  readonly filteredChannels = computed(() => {
    const words = this.channelQuery().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filter = this.channelFilter();
    const rows = this.channelRows().filter((row) =>
      (filter === 'all' || (filter === 'reconnect') === row.needsReconnect) && words.every((w) => row.search.includes(w)));
    return sortChannels(rows, this.channelSort());
  });
  readonly shownChannels = computed(() =>
    this.channelsExpanded() ? this.filteredChannels() : this.filteredChannels().slice(0, CHANNEL_PREVIEW_ROWS));

  // --- summaries shown when a section is folded ----------------------------------------------

  readonly summaries = computed<Record<SectionId, string>>(() => {
    const counts = this.visibleCounts();
    const total = this.draftTabs().length;
    const policy = this.draftPolicy();
    const session = this.draftSession();
    const scopes = this.scopeCounts();
    return {
      preview: `Guests ${counts.guest} · members ${counts.member} · admins ${counts.admin} of ${total} tabs`,
      nav: `${counts.guest} of ${total} tabs shown to guests, ${counts.member} to members`,
      policy: policy.enabled
        ? `Browsing on · ${policy.allowRender ? `${policy.maxRenderDurationSeconds ?? '?'} s renders` : 'no renders'} · ${policy.maxAiCallsPerDay ?? '?'} AI calls/day · publishing ${policy.allowYouTubePublish || policy.allowGoogleDrivePublish ? 'allowed' : 'blocked'}`
        : 'Anonymous browsing is off',
      session: `Signs out after ${session.timeoutMinutes} min idle, warns ${session.warningMinutes} min before`,
      scopes: this.userScopes()
        ? `${scopes.guest} guest sessions · ${scopes.registered} members · ${scopes.stale} idle ${this.staleDays()}+ days`
        : this.loadingScopes() ? 'Loading…' : 'Not loaded',
      identity: `${this.accessInfo()?.mode ?? '…'} · ${this.accessInfo()?.availableRoles?.length ?? 0} roles · ${this.channelCounts().all} channels`,
    };
  });

  // --- saving, prompts, dialogs and toasts ---------------------------------------------------

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly lastSavedAt = signal<number | null>(null);
  readonly barPrompt = signal<BarPrompt | null>(null);
  readonly reviewOpen = signal(false);
  readonly dialog = signal<DialogKind | null>(null);
  readonly confirmScope = signal<SaveScope>('all');
  readonly cautionChanges = computed(() => this.changesFor(this.confirmScope()).filter((c) => c.caution));
  readonly allCautions = computed(() => this.changes().filter((c) => c.caution));
  readonly toast = signal<Toast | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastSeq = 0;
  private purgeTimer: ReturnType<typeof setInterval> | null = null;
  private leaveResolve: ((leave: boolean) => void) | null = null;
  private programmaticClose = false;

  constructor() {
    this.loadConfig();
    this.loadUserScopes();
    this.loadChannels();

    effect(() => savePrefs(this.prefs()));
    effect(() => this.syncDialog());

    const clock = setInterval(() => this.now.set(Date.now()), 60_000);
    this.destroyRef.onDestroy(() => {
      clearInterval(clock);
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.stopPurgeTimer();
      this.settleLeave(true);
    });

    this.guardRoute();
    this.trackTopbar();
  }

  /**
   * The save bar and the preview stick just under the app's top bar, which is one row tall on a
   * wide window and two on a narrow one. Measuring it keeps them from sliding underneath it.
   */
  private trackTopbar(): void {
    const topbar = document.querySelector<HTMLElement>('.topbar');
    if (!topbar || typeof ResizeObserver === 'undefined') return;
    const apply = () => this.host.nativeElement.style.setProperty('--ac-top', `${Math.round(topbar.getBoundingClientRect().height) + 10}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(topbar);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  // --- loading -------------------------------------------------------------------------------

  loadConfig(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.adminAccessControl().subscribe({
      next: (data) => {
        this.applyServerConfig(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        // The editors stay hidden: saving the placeholder values over the real settings would be worse than an error.
        const message = errorMessage(err, 'Failed to load access control settings.');
        this.loadError.set(message);
        this.status.showError(message);
        this.loading.set(false);
      },
    });
  }

  loadUserScopes(): void {
    this.loadingScopes.set(true);
    this.scopesError.set(null);
    this.api.adminUserScopes().subscribe({
      next: (overview) => {
        this.userScopes.set(overview);
        this.now.set(Date.now());
        this.loadingScopes.set(false);
      },
      error: (err: unknown) => {
        this.scopesError.set(errorMessage(err, 'Could not load users and guest sessions.'));
        this.loadingScopes.set(false);
      },
    });
  }

  loadChannels(): void {
    this.loadingChannels.set(true);
    this.channelsError.set(null);
    this.api.adminAllYouTubeChannels().subscribe({
      next: (channels) => {
        this.channelsRaw.set(channels ?? []);
        this.channelsLoaded.set(true);
        this.loadingChannels.set(false);
      },
      error: (err: unknown) => {
        this.channelsError.set(errorMessage(err, 'Could not load connected channels.'));
        this.loadingChannels.set(false);
      },
    });
  }

  refreshing(): boolean {
    return this.loading() || this.loadingScopes() || this.loadingChannels();
  }

  /** Reloading would overwrite the drafts, so with unsaved changes it asks first. */
  refreshAll(): void {
    if (this.dirty()) {
      this.barPrompt.set('reload');
      return;
    }
    this.reloadAll();
  }

  private reloadAll(): void {
    this.reviewOpen.set(false);
    this.loadConfig();
    this.loadUserScopes();
    this.loadChannels();
  }

  private applyServerConfig(data: AdminAccessControl): void {
    this.accessInfo.set(data);
    if (data.anonymousPolicy) {
      this.rawPolicy = { ...data.anonymousPolicy };
      const form = toPolicyForm(data.anonymousPolicy);
      this.savedPolicy.set(form);
      this.draftPolicy.set({ ...form });
    }
    const tabs = data.uiNavigation?.tabs?.length ? data.uiNavigation.tabs : DEFAULT_UI_NAVIGATION_TABS;
    this.savedTabs.set(tabs.map((t) => ({ ...t })));
    this.draftTabs.set(tabs.map((t) => ({ ...t })));
    const session = this.currentSession();
    this.savedSession.set(session);
    this.draftSession.set({ ...session });
    this.invalidateUndo();
  }

  private currentSession(): SessionForm {
    return {
      timeoutMinutes: this.sessionTimeout.timeoutMinutes(),
      warningMinutes: this.sessionTimeout.warningMinutes(),
    };
  }

  // --- sections ------------------------------------------------------------------------------

  isCollapsed(id: SectionId): boolean {
    return this.prefs().collapsed[id] ?? COLLAPSED_BY_DEFAULT[id];
  }

  toggleSection(id: SectionId): void {
    this.setCollapsed(id, !this.isCollapsed(id));
  }

  setAllCollapsed(value: boolean): void {
    const collapsed: Partial<Record<SectionId, boolean>> = {};
    for (const id of SECTION_IDS) collapsed[id] = value;
    this.prefs.update((p) => ({ ...p, collapsed }));
  }

  private setCollapsed(id: SectionId, value: boolean): void {
    this.prefs.update((p) => ({ ...p, collapsed: { ...p.collapsed, [id]: value } }));
  }

  goTo(id: SectionId): void {
    if (this.isCollapsed(id)) this.setCollapsed(id, false);
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => document.getElementById(`ac-sec-${id}`)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }), 60);
  }

  setPersona(persona: Persona): void {
    this.prefs.update((p) => ({ ...p, persona }));
  }

  // --- navigation matrix ---------------------------------------------------------------------

  setNavFilter(filter: NavFilter): void {
    this.prefs.update((p) => ({ ...p, navFilter: filter }));
  }

  setFlag(id: string, flag: NavFlag, value: boolean): void {
    if (this.saving()) return;
    this.invalidateUndo();
    this.draftTabs.update((tabs) => tabs.map((tab) => {
      if (tab.id !== id || tab[flag] === value) return tab;
      const next: UiNavigationItemConfig = { ...tab };
      next[flag] = value;
      return next;
    }));
  }

  /** Puts one tab back to what is saved. */
  revertTab(id: string): void {
    const saved = this.savedTabs().find((tab) => tab.id === id);
    if (!saved || this.saving()) return;
    this.invalidateUndo();
    this.draftTabs.update((tabs) => tabs.map((tab) => (tab.id === id ? { ...saved } : tab)));
  }

  /**
   * Sets one switch on every tab currently shown. Two kinds of tab are left alone and reported
   * rather than changed in bulk: showing a sensitive or sign-in-only tab to guests, and switching
   * the Settings tab off. Each of those has to be a deliberate, individual choice.
   */
  bulkFlag(flag: NavFlag, value: boolean): void {
    if (this.saving()) return;
    const shown = new Set(this.shownTabs().map((tab) => tab.id));
    const restore = this.snapshotAll();
    let changed = 0;
    let skipped = 0;

    const next = this.draftTabs().map((tab) => {
      if (!shown.has(tab.id) || tab[flag] === value) return tab;
      if (flag !== 'enabled' && isAdminOnlyTab(tab)) return tab;
      if (flag === 'visibleToAnonymous' && value && (tab.isSensitive || tab.requiresAuth)) { skipped++; return tab; }
      if (flag === 'enabled' && !value && tab.id === 'admin') { skipped++; return tab; }
      changed++;
      const updated: UiNavigationItemConfig = { ...tab };
      updated[flag] = value;
      return updated;
    });

    if (changed === 0) {
      this.showToast(skipped > 0 ? `Nothing changed: ${skipped} tab${skipped === 1 ? ' needs' : 's need'} an individual choice.` : 'Nothing to change.', 'info');
      return;
    }

    this.draftTabs.set(next);
    const who = flag === 'visibleToAnonymous' ? 'guests' : 'members';
    const tabs = `${changed} tab${changed === 1 ? '' : 's'}`;
    const text = flag === 'enabled'
      ? `${value ? 'Enabled' : 'Disabled'} ${tabs}.`
      : `${value ? 'Showed' : 'Hid'} ${tabs} ${value ? 'to' : 'from'} ${who}.`;
    const note = skipped > 0 ? ` Left ${skipped} that need${skipped === 1 ? 's' : ''} an individual choice.` : '';
    this.showToast(text + note, 'ok', { label: 'Undo', run: () => restore() });
  }

  /** The old "Strict Privacy" preset: nothing sensitive or sign-in-only is offered to guests. */
  strictPrivacy(): void {
    if (this.saving()) return;
    const restore = this.snapshotAll();
    let changed = 0;
    const next = this.draftTabs().map((tab) => {
      if (!(tab.isSensitive || tab.requiresAuth) || !tab.visibleToAnonymous) return tab;
      changed++;
      return { ...tab, visibleToAnonymous: false };
    });
    if (changed === 0) {
      this.showToast('Already strict: no sensitive or sign-in-only tab is shown to guests.', 'info');
      return;
    }
    this.draftTabs.set(next);
    this.showToast(`Strict privacy: hid ${changed} sensitive or sign-in tab${changed === 1 ? '' : 's'} from guests.`, 'ok', { label: 'Undo', run: () => restore() });
  }

  /**
   * Puts the three visibility switches of every known tab back to their defaults. Names, paths
   * and the sensitivity flags stay as the server has them, and tabs the defaults do not know are untouched.
   */
  resetNavDefaults(): void {
    if (this.saving()) return;
    const restore = this.snapshotAll();
    const defaults = new Map(DEFAULT_UI_NAVIGATION_TABS.map((tab) => [tab.id, tab]));
    let changed = 0;
    const next = this.draftTabs().map((tab) => {
      const base = defaults.get(tab.id);
      if (!base) return tab;
      if (tab.visibleToAnonymous === base.visibleToAnonymous && tab.visibleToMembers === base.visibleToMembers && tab.enabled === base.enabled) return tab;
      changed++;
      return { ...tab, visibleToAnonymous: base.visibleToAnonymous, visibleToMembers: base.visibleToMembers, enabled: base.enabled };
    });
    if (changed === 0) {
      this.showToast('Already at the defaults.', 'info');
      return;
    }
    this.draftTabs.set(next);
    this.showToast(`Reset ${changed} tab${changed === 1 ? '' : 's'} to default visibility.`, 'ok', { label: 'Undo', run: () => restore() });
  }

  // --- guest policy --------------------------------------------------------------------------

  boolValue(key: PolicyBoolKey): boolean {
    return this.draftPolicy()[key];
  }

  numValue(key: PolicyNumberKey): number | null {
    return this.draftPolicy()[key];
  }

  setPolicyBool(key: PolicyBoolKey, value: boolean): void {
    if (this.saving()) return;
    this.invalidateUndo();
    this.draftPolicy.update((p) => ({ ...p, [key]: value }));
  }

  setPolicyNumber(key: PolicyNumberKey, raw: string): void {
    if (this.saving()) return;
    this.invalidateUndo();
    this.draftPolicy.update((p) => ({ ...p, [key]: parseNumberInput(raw) }));
  }

  revertPolicy(key: PolicyKey): void {
    if (this.saving()) return;
    this.invalidateUndo();
    const saved = this.savedPolicy()[key];
    this.draftPolicy.update((p) => ({ ...p, [key]: saved }));
  }

  /** What the saved value was, for the "was …" note beside an edited field. */
  wasValue(key: PolicyKey): string {
    return formatPolicyValue(key, this.savedPolicy()[key]);
  }

  /** Turns every guest-facing publishing and persistence switch off; limits stay as they are. */
  lockDownPublishing(): void {
    if (this.saving()) return;
    const policy = this.draftPolicy();
    if (!policy.allowYouTubePublish && !policy.allowGoogleDrivePublish && !policy.allowCloudSave) {
      this.showToast('Publishing and cloud save are already off for guests.', 'info');
      return;
    }
    const restore = this.snapshotAll();
    this.draftPolicy.set({ ...policy, allowYouTubePublish: false, allowGoogleDrivePublish: false, allowCloudSave: false });
    this.showToast('Guest publishing and cloud save switched off.', 'ok', { label: 'Undo', run: () => restore() });
  }

  resetPolicyDefaults(): void {
    if (this.saving()) return;
    const restore = this.snapshotAll();
    this.draftPolicy.set({ ...DEFAULT_POLICY_FORM });
    this.showToast('Guest policy set to the built-in defaults.', 'ok', { label: 'Undo', run: () => restore() });
  }

  // --- session timeout (this browser) --------------------------------------------------------

  setSessionValue(key: keyof SessionForm, raw: string): void {
    const value = Number(raw);
    if (this.saving() || !Number.isFinite(value)) return;
    this.invalidateUndo();
    this.draftSession.update((s) => ({ ...s, [key]: value }));
  }

  revertSession(key: keyof SessionForm): void {
    this.invalidateUndo();
    const saved = this.savedSession()[key];
    this.draftSession.update((s) => ({ ...s, [key]: saved }));
  }

  // --- saving --------------------------------------------------------------------------------

  private changesFor(scope: SaveScope): ChangeItem[] {
    return scope === 'all' ? this.changes() : this.changes().filter((c) => c.section === scope);
  }

  /** Whether the Save button for a scope may be pressed. */
  canSave(scope: SaveScope = 'all'): boolean {
    if (this.saving() || this.loading() || this.loadError() !== null) return false;
    const pending = this.changesFor(scope);
    if (pending.length === 0) return false;
    return !(this.saveBlocked() && pending.some((c) => c.section === 'policy'));
  }

  requestSave(scope: SaveScope = 'all'): void {
    if (!this.canSave(scope)) return;
    if (this.changesFor(scope).some((c) => c.caution)) {
      this.confirmScope.set(scope);
      this.dialog.set('save-confirm');
      return;
    }
    this.runSave(scope);
  }

  confirmSave(): void {
    const scope = this.confirmScope();
    this.dialog.set(null);
    this.runSave(scope);
  }

  /** Session first (local, cannot fail), then the guest policy, then the navigation - one request each, as before. */
  private runSave(scope: SaveScope, done?: (ok: boolean) => void): void {
    const doSession = (scope === 'all' || scope === 'session') && this.sessionChanges().length > 0;
    const doPolicy = (scope === 'all' || scope === 'policy') && this.policyChanges().length > 0;
    const doNav = (scope === 'all' || scope === 'nav') && this.tabChanges().length > 0;
    if (!doSession && !doPolicy && !doNav) {
      done?.(true);
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.barPrompt.set(null);
    this.invalidateUndo();

    const saved: string[] = [];
    if (doSession) {
      this.applySession();
      saved.push(`session timeout (${this.savedSession().timeoutMinutes} min)`);
    }

    const steps: Observable<unknown>[] = [];
    if (doPolicy) steps.push(defer(() => this.savePolicy()).pipe(tap(() => saved.push('guest policy'))));
    if (doNav) steps.push(defer(() => this.saveNavigation()).pipe(tap(() => saved.push('navigation'))));

    concat(...steps).subscribe({
      error: (err: unknown) => {
        const message = errorMessage(err, 'Failed to update access control settings.');
        this.saving.set(false);
        this.saveError.set(message);
        this.status.showError(message);
        if (saved.length > 0) this.lastSavedAt.set(Date.now());
        done?.(false);
      },
      complete: () => {
        this.saving.set(false);
        this.lastSavedAt.set(Date.now());
        this.showToast(`Saved ${saved.join(' and ')}.`, 'ok');
        done?.(true);
      },
    });
  }

  private applySession(): void {
    const draft = this.draftSession();
    this.sessionTimeout.setTimeoutMinutes(draft.timeoutMinutes);
    this.sessionTimeout.setWarningMinutes(draft.warningMinutes);
    // The service clamps to its own limits, so what it now holds is what is saved.
    const applied = this.currentSession();
    this.savedSession.set(applied);
    this.draftSession.set({ ...applied });
  }

  private savePolicy(): Observable<unknown> {
    const body = mergePolicy(this.rawPolicy, this.draftPolicy());
    return this.api.updateAdminAccessControl({ anonymousPolicy: body }).pipe(
      tap((res) => {
        this.accessInfo.set(res);
        if (res.anonymousPolicy) {
          this.rawPolicy = { ...res.anonymousPolicy };
          const form = toPolicyForm(res.anonymousPolicy);
          this.savedPolicy.set(form);
          this.draftPolicy.set({ ...form });
        } else {
          this.rawPolicy = body;
          this.savedPolicy.set({ ...this.draftPolicy() });
        }
        this.auth.fetchSystemSession().subscribe();
      }),
      catchError((err: unknown) => throwError(() => new Error(errorMessage(err, 'Failed to update access control settings.')))),
    );
  }

  private saveNavigation(): Observable<unknown> {
    // Guest restrictions stay enforced: this page has never offered a way to turn that off.
    const navSettings: UiNavigationSettings = {
      enforceGuestRestrictions: true,
      tabs: this.draftTabs().map((tab) => ({ ...tab })),
    };
    return this.api.updateAdminAccessControl({ uiNavigation: navSettings }).pipe(
      tap((res) => {
        this.accessInfo.set(res);
        const applied = res.uiNavigation?.tabs?.length ? res.uiNavigation.tabs : navSettings.tabs;
        this.savedTabs.set(applied.map((tab) => ({ ...tab })));
        this.draftTabs.set(applied.map((tab) => ({ ...tab })));
        this.uiNav.settings.set({ enforceGuestRestrictions: true, tabs: applied.map((tab) => ({ ...tab })) });
      }),
      catchError((err: unknown) => throwError(() => new Error(errorMessage(err, 'Failed to update UI navigation settings.')))),
    );
  }

  // --- discarding and undoing ----------------------------------------------------------------

  askDiscard(): void {
    if (this.dirty() && !this.saving()) this.barPrompt.set('discard');
  }

  confirmBarPrompt(): void {
    const prompt = this.barPrompt();
    this.barPrompt.set(null);
    if (prompt === 'discard') this.discardAll();
    else if (prompt === 'reload') this.reloadAll();
  }

  /** Backing out of a prompt hands keyboard focus back to the bar, which just replaced the button that had it. */
  closeBarPrompt(): void {
    this.barPrompt.set(null);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('.ac-bar-actions button')?.focus(), 0);
  }

  private discardAll(): void {
    const count = this.changeCount();
    const restore = this.snapshotAll();
    this.resetDrafts();
    this.reviewOpen.set(false);
    this.showToast(`Discarded ${count} unsaved change${count === 1 ? '' : 's'}.`, 'info', {
      label: 'Undo',
      run: () => {
        restore();
        this.showToast('Your changes are back.', 'ok');
      },
    });
  }

  private resetDrafts(): void {
    this.draftTabs.set(this.savedTabs().map((tab) => ({ ...tab })));
    this.draftPolicy.set({ ...this.savedPolicy() });
    this.draftSession.set({ ...this.savedSession() });
  }

  /** The drafts as they are now, as a function that puts them back. The values are never edited in place, so references are enough. */
  private snapshotAll(): () => void {
    const tabs = this.draftTabs();
    const policy = this.draftPolicy();
    const session = this.draftSession();
    return () => {
      this.draftTabs.set(tabs);
      this.draftPolicy.set(policy);
      this.draftSession.set(session);
    };
  }

  /** An "Undo" is only honest while nothing else has changed, so any further edit retires it. */
  private invalidateUndo(): void {
    if (this.toast()?.action) this.dismissToast();
  }

  revertChange(change: ChangeItem): void {
    if (this.saving()) return;
    if (change.section === 'nav') {
      const saved = this.savedTabs().find((tab) => tab.id === change.target);
      if (saved) this.setFlag(change.target, change.field as NavFlag, saved[change.field as NavFlag]);
    } else if (change.section === 'policy') {
      this.revertPolicy(change.target as PolicyKey);
    } else {
      this.revertSession(change.target as keyof SessionForm);
    }
  }

  // --- purging stale guests ------------------------------------------------------------------

  openPurge(): void {
    if (this.pendingPurge() || this.purging()) return;
    this.purgeError.set(null);
    this.dialog.set('purge');
  }

  setPurgeInput(raw: string): void {
    this.purgeInput.set(raw);
  }

  setPurgeDays(days: number): void {
    this.purgeInput.set(String(days));
  }

  /** Out-of-range days are pulled back into 1-90 once the box is left, so the field never sits on a refused value. */
  settlePurgeInput(): void {
    const value = parseNumberInput(this.purgeInput());
    if (value === null) {
      this.purgeInput.set('7');
      return;
    }
    this.purgeInput.set(String(Math.min(90, Math.max(1, Math.round(value)))));
  }

  /** Confirming starts a short countdown rather than deleting at once, so a slip can still be taken back. */
  startPurge(): void {
    const days = this.purgeDays();
    if (days === null || !this.canStartPurge()) return;
    const estimate = this.purgeEstimate();
    this.dialog.set(null);
    this.pendingPurge.set({
      days,
      projects: estimate.certainProjects,
      sessions: estimate.certainSessions,
      secondsLeft: UNDO_SECONDS,
      total: UNDO_SECONDS,
    });
    this.stopPurgeTimer();
    this.purgeTimer = setInterval(() => this.tickPurge(), 1000);
  }

  undoPurge(): void {
    if (!this.pendingPurge()) return;
    this.stopPurgeTimer();
    this.pendingPurge.set(null);
    this.showToast('Purge cancelled. Nothing was deleted.', 'info');
  }

  private tickPurge(): void {
    const pending = this.pendingPurge();
    if (!pending) {
      this.stopPurgeTimer();
      return;
    }
    if (pending.secondsLeft <= 1) {
      this.stopPurgeTimer();
      this.pendingPurge.set(null);
      this.runPurge(pending.days);
      return;
    }
    this.pendingPurge.set({ ...pending, secondsLeft: pending.secondsLeft - 1 });
  }

  private runPurge(days: number): void {
    this.purging.set(true);
    this.purgeError.set(null);
    this.api.purgeGuestProjects(days).subscribe({
      next: (res) => {
        this.purging.set(false);
        this.showToast(`Purged ${res.projectsPurged} stale guest project(s) across ${res.guestScopesCleaned} guest scope(s).`, 'ok');
        this.loadUserScopes();
      },
      error: (err: unknown) => {
        const message = errorMessage(err, 'Failed to purge guest projects.');
        this.purging.set(false);
        this.purgeError.set(message);
        this.status.showError(message);
      },
    });
  }

  private stopPurgeTimer(): void {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
    this.purgeTimer = null;
  }

  // --- scopes and channels: filters, sorting, paging -----------------------------------------

  setScopeFilter(filter: ScopeFilter): void {
    this.prefs.update((p) => ({ ...p, scopeFilter: filter }));
    this.scopePage.set(0);
  }

  setScopeActivity(raw: string): void {
    const activity = SCOPE_ACTIVITIES.find((a) => a === raw);
    if (!activity) return;
    this.prefs.update((p) => ({ ...p, scopeActivity: activity }));
    this.scopePage.set(0);
  }

  setScopeQuery(raw: string): void {
    this.scopeQuery.set(raw);
    this.scopePage.set(0);
  }

  /** Clicking a heading sorts by it; clicking it again flips the direction. */
  toggleScopeSort(key: ScopeSortKey): void {
    const current = this.scopeSort();
    const dir: SortDir = current.key === key
      ? (current.dir === 'asc' ? 'desc' : 'asc')
      : (key === 'name' || key === 'type' ? 'asc' : 'desc');
    this.prefs.update((p) => ({ ...p, scopeSort: { key, dir } }));
    this.scopePage.set(0);
  }

  setScopeSortValue(value: string): void {
    const option = SCOPE_SORT_OPTIONS.find((o) => `${o.key}:${o.dir}` === value);
    if (!option) return;
    this.prefs.update((p) => ({ ...p, scopeSort: { key: option.key, dir: option.dir } }));
    this.scopePage.set(0);
  }

  ariaSort(key: ScopeSortKey): 'ascending' | 'descending' | 'none' {
    const sort = this.scopeSort();
    return sort.key !== key ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending';
  }

  sortMark(key: ScopeSortKey): string {
    const sort = this.scopeSort();
    return sort.key !== key ? '' : sort.dir === 'asc' ? '▲' : '▼';
  }

  setPageSize(raw: string): void {
    const size = Number(raw);
    if (!PAGE_SIZES.includes(size)) return;
    this.prefs.update((p) => ({ ...p, scopePageSize: size }));
    this.scopePage.set(0);
  }

  gotoPage(page: number): void {
    this.scopePage.set(Math.min(Math.max(0, page), this.scopePageCount() - 1));
  }

  clearScopeFilters(): void {
    this.scopeQuery.set('');
    this.prefs.update((p) => ({ ...p, scopeFilter: 'all', scopeActivity: 'any' }));
    this.scopePage.set(0);
  }

  setChannelFilter(filter: ChannelFilter): void {
    this.prefs.update((p) => ({ ...p, channelFilter: filter }));
  }

  setChannelSortValue(value: string): void {
    const option = CHANNEL_SORT_OPTIONS.find((o) => `${o.key}:${o.dir}` === value);
    if (option) this.prefs.update((p) => ({ ...p, channelSort: { key: option.key, dir: option.dir } }));
  }

  clearChannelFilters(): void {
    this.channelQuery.set('');
    this.setChannelFilter('all');
  }

  markThumbBroken(key: string): void {
    this.brokenThumbs.update((keys) => new Set(keys).add(key));
  }

  copyId(id: string): void {
    const clipboard = navigator.clipboard;
    if (!clipboard) {
      this.showToast('Copying is not available in this browser.', 'warn');
      return;
    }
    clipboard.writeText(id).then(
      () => this.showToast('ID copied to the clipboard.', 'ok'),
      () => this.showToast('Could not copy the ID.', 'warn'),
    );
  }

  // --- dialogs -------------------------------------------------------------------------------

  private syncDialog(): void {
    const kind = this.dialog();
    const element = this.dlg()?.nativeElement;
    if (!element) return;
    if (kind !== null && !element.open) {
      element.showModal();
      // The dialog's content for this kind is rendered just after this runs, so the browser's own
      // autofocus has nothing to find yet: put focus on the safe choice once it exists.
      setTimeout(() => element.querySelector<HTMLElement>('[autofocus]')?.focus(), 0);
    } else if (kind === null && element.open) {
      this.programmaticClose = true;
      element.close();
    }
  }

  /** Escape on a modal dialog: the browser asks to close it, and this decides what that means for the page. */
  onDialogCancel(event: Event): void {
    event.preventDefault();
    this.cancelDialog();
  }

  /** The browser closed the dialog itself (a second Escape it does not let a page veto). */
  onDialogClosed(): void {
    if (this.programmaticClose) {
      this.programmaticClose = false;
      return;
    }
    if (this.dialog() !== null) this.cancelDialog();
  }

  onDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelDialog();
  }

  cancelDialog(): void {
    const kind = this.dialog();
    this.dialog.set(null);
    if (kind === 'leave') this.settleLeave(false);
  }

  // --- leaving the page ----------------------------------------------------------------------

  /**
   * In-app navigation away asks first; closing the tab is covered by beforeunload below.
   * Routes are declared elsewhere, so the page registers its own guard on its route for as long
   * as it is alive and takes it off again when it goes - a guard left behind would block the next visit.
   */
  private guardRoute(): void {
    const config = this.route.routeConfig;
    if (!config) return;
    const guard: CanDeactivateFn<unknown> = () => this.canLeave();
    config.canDeactivate = [...(config.canDeactivate ?? []), guard];
    this.destroyRef.onDestroy(() => {
      const rest = (config.canDeactivate ?? []).filter((g) => g !== guard);
      config.canDeactivate = rest.length > 0 ? rest : undefined;
    });
  }

  private canLeave(): boolean | Promise<boolean> {
    if (!this.dirty() && !this.pendingPurge()) return true;
    this.settleLeave(false);
    return new Promise<boolean>((resolve) => {
      this.leaveResolve = resolve;
      this.barPrompt.set(null);
      this.dialog.set('leave');
    });
  }

  private settleLeave(leave: boolean): void {
    const resolve = this.leaveResolve;
    this.leaveResolve = null;
    resolve?.(leave);
  }

  leaveDiscard(): void {
    this.dialog.set(null);
    this.stopPurgeTimer();
    this.pendingPurge.set(null);
    this.resetDrafts();
    this.settleLeave(true);
  }

  leaveSave(): void {
    if (this.dirty() && !this.canSave()) return;
    this.dialog.set(null);
    if (this.dirty()) {
      this.runSave('all', (ok) => this.settleLeave(ok));
    } else {
      this.settleLeave(true);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty() || this.pendingPurge()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // --- keyboard ------------------------------------------------------------------------------

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.dialog() || this.loading() || this.loadError() !== null) return;
      if (this.dirty()) this.requestSave('all');
      else this.showToast('Nothing to save.', 'info');
      return;
    }
    if (event.key === 'Escape') this.onEscape(event);
  }

  /** Closes the topmost thing that is open. Escape never discards edits by itself. */
  private onEscape(event: KeyboardEvent): void {
    if (this.dialog()) return;
    if (this.barPrompt()) {
      this.closeBarPrompt();
      event.preventDefault();
    } else if (this.pendingPurge()) {
      this.undoPurge();
      event.preventDefault();
    } else if (this.reviewOpen()) {
      this.reviewOpen.set(false);
      event.preventDefault();
    }
  }

  // --- toasts --------------------------------------------------------------------------------

  private showToast(text: string, tone: ToastTone = 'ok', action?: { label: string; run: () => void }): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    const id = ++this.toastSeq;
    this.toast.set({ id, text, tone, action });
    this.toastTimer = setTimeout(() => {
      if (this.toast()?.id === id) this.toast.set(null);
    }, action ? 9000 : 4500);
  }

  dismissToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = null;
    this.toast.set(null);
  }

  runToastAction(): void {
    const toast = this.toast();
    if (!toast?.action) return;
    this.dismissToast();
    toast.action.run();
  }

  // --- small helpers for the template --------------------------------------------------------

  timeoutLabel(minutes: number): string {
    const hours = minutes >= 60 && minutes % 60 === 0 ? ` (${minutes / 60} hour${minutes === 60 ? '' : 's'})` : '';
    return `${minutes} minutes${hours}${minutes === DEFAULT_TIMEOUT_MINUTES ? ', default' : ''}`;
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  plural(count: number, word: string): string {
    return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;
  }

  fmt(value: number): string {
    return value.toLocaleString();
  }

  ago(ms: number | null): string {
    return ago(ms, this.now());
  }
}
