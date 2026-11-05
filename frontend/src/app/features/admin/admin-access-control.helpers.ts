import {
  AnonymousAccessPolicy,
  UiNavigationItemConfig,
  UserScopeItem,
} from '../../core/models/auth.models';

/*
 * Pure logic for the Access & UI Navigation page: what changed, what each audience will see,
 * how scopes and channels are searched and sorted, and which UI choices are remembered.
 * Nothing here touches Angular, the network or the DOM, so it can be reasoned about on its own.
 */

// --- remembered UI state -----------------------------------------------------------------------

export type SectionId = 'preview' | 'nav' | 'policy' | 'session' | 'scopes' | 'identity';
export const SECTION_IDS: readonly SectionId[] = ['preview', 'nav', 'policy', 'session', 'scopes', 'identity'];

/** Rarely changed, mostly read-only sections start folded so the page opens on what is edited most. */
export const COLLAPSED_BY_DEFAULT: Readonly<Record<SectionId, boolean>> = {
  preview: false,
  nav: false,
  policy: false,
  session: true,
  scopes: false,
  identity: true,
};

export type Persona = 'guest' | 'member' | 'admin';
export const PERSONAS: readonly Persona[] = ['guest', 'member', 'admin'];

export type NavFilter = 'all' | 'changed' | 'guest-visible' | 'guest-hidden' | 'sensitive' | 'disabled';
export const NAV_FILTERS: readonly NavFilter[] = ['all', 'changed', 'guest-visible', 'guest-hidden', 'sensitive', 'disabled'];

export type ScopeFilter = 'all' | 'registered' | 'guest' | 'stale';
export const SCOPE_FILTERS: readonly ScopeFilter[] = ['all', 'registered', 'guest', 'stale'];

export type ScopeSortKey = 'lastActive' | 'name' | 'type' | 'projects' | 'storage';
export const SCOPE_SORT_KEYS: readonly ScopeSortKey[] = ['lastActive', 'name', 'type', 'projects', 'storage'];

export type ScopeActivity = 'any' | 'day' | 'week' | 'month' | 'older';
export const SCOPE_ACTIVITIES: readonly ScopeActivity[] = ['any', 'day', 'week', 'month', 'older'];

export type ChannelFilter = 'all' | 'connected' | 'reconnect';
export const CHANNEL_FILTERS: readonly ChannelFilter[] = ['all', 'connected', 'reconnect'];

export type ChannelSortKey = 'title' | 'connected' | 'lastActive';
export const CHANNEL_SORT_KEYS: readonly ChannelSortKey[] = ['title', 'connected', 'lastActive'];

export type SortDir = 'asc' | 'desc';
export const PAGE_SIZES: readonly number[] = [10, 25, 50, 100];

export interface AccessPrefs {
  collapsed: Partial<Record<SectionId, boolean>>;
  persona: Persona;
  navFilter: NavFilter;
  scopeFilter: ScopeFilter;
  scopeActivity: ScopeActivity;
  scopeSort: { key: ScopeSortKey; dir: SortDir };
  scopePageSize: number;
  channelFilter: ChannelFilter;
  channelSort: { key: ChannelSortKey; dir: SortDir };
}

const PREFS_KEY = 'animstudio.admin.access.prefs.v1';

export const DEFAULT_PREFS: Readonly<AccessPrefs> = {
  collapsed: {},
  persona: 'guest',
  navFilter: 'all',
  scopeFilter: 'all',
  scopeActivity: 'any',
  scopeSort: { key: 'lastActive', dir: 'desc' },
  scopePageSize: 25,
  channelFilter: 'all',
  channelSort: { key: 'connected', dir: 'desc' },
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Whatever is in storage is untrusted: every field is checked and falls back on its own. */
export function loadPrefs(): AccessPrefs {
  let stored: Record<string, unknown> = {};
  try {
    stored = asRecord(JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null'));
  } catch {
    // Unreadable or storage blocked: start from the defaults.
  }

  const collapsed: Partial<Record<SectionId, boolean>> = {};
  const rawCollapsed = asRecord(stored['collapsed']);
  for (const id of SECTION_IDS) {
    const flag = rawCollapsed[id];
    if (typeof flag === 'boolean') collapsed[id] = flag;
  }

  const scopeSort = asRecord(stored['scopeSort']);
  const channelSort = asRecord(stored['channelSort']);
  const pageSize = stored['scopePageSize'];

  return {
    collapsed,
    persona: pick(stored['persona'], PERSONAS, DEFAULT_PREFS.persona),
    navFilter: pick(stored['navFilter'], NAV_FILTERS, DEFAULT_PREFS.navFilter),
    scopeFilter: pick(stored['scopeFilter'], SCOPE_FILTERS, DEFAULT_PREFS.scopeFilter),
    scopeActivity: pick(stored['scopeActivity'], SCOPE_ACTIVITIES, DEFAULT_PREFS.scopeActivity),
    scopeSort: {
      key: pick(scopeSort['key'], SCOPE_SORT_KEYS, DEFAULT_PREFS.scopeSort.key),
      dir: pick(scopeSort['dir'], ['asc', 'desc'] as const, DEFAULT_PREFS.scopeSort.dir),
    },
    scopePageSize: typeof pageSize === 'number' && PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PREFS.scopePageSize,
    channelFilter: pick(stored['channelFilter'], CHANNEL_FILTERS, DEFAULT_PREFS.channelFilter),
    channelSort: {
      key: pick(channelSort['key'], CHANNEL_SORT_KEYS, DEFAULT_PREFS.channelSort.key),
      dir: pick(channelSort['dir'], ['asc', 'desc'] as const, DEFAULT_PREFS.channelSort.dir),
    },
  };
}

export function savePrefs(prefs: AccessPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private window or full storage: the choices are simply not remembered.
  }
}

// --- guest policy ------------------------------------------------------------------------------

export type PolicyNumberKey = 'maxGuestProjects' | 'maxRenderDurationSeconds' | 'maxAiCallsPerDay';
export type PolicyBoolKey =
  | 'enabled' | 'allowGuestProjectCreation' | 'allowCloudSave' | 'allowRender'
  | 'allowYouTubePublish' | 'allowGoogleDrivePublish';
export type PolicyKey = PolicyBoolKey | PolicyNumberKey;

/** The editable part of the guest policy. A number is null while its box is empty. */
export interface PolicyForm {
  enabled: boolean;
  allowGuestProjectCreation: boolean;
  maxGuestProjects: number | null;
  allowCloudSave: boolean;
  allowRender: boolean;
  maxRenderDurationSeconds: number | null;
  maxAiCallsPerDay: number | null;
  allowYouTubePublish: boolean;
  allowGoogleDrivePublish: boolean;
}

/** The ranges the server accepts (WebSettingCatalog); anything else is refused part-way through a save. */
export const POLICY_LIMITS: Readonly<Record<PolicyNumberKey, { min: number; max: number }>> = {
  maxGuestProjects: { min: 1, max: 50 },
  maxRenderDurationSeconds: { min: 5, max: 120 },
  maxAiCallsPerDay: { min: 0, max: 50 },
};

/** The server's built-in defaults: the most restrictive publishing posture. */
export const DEFAULT_POLICY_FORM: Readonly<PolicyForm> = {
  enabled: true,
  allowGuestProjectCreation: true,
  maxGuestProjects: 5,
  allowCloudSave: false,
  allowRender: true,
  maxRenderDurationSeconds: 30,
  maxAiCallsPerDay: 3,
  allowYouTubePublish: false,
  allowGoogleDrivePublish: false,
};

interface PolicyFieldMeta {
  label: string;
  kind: 'bool' | 'number';
  unit?: string;
}

export const POLICY_FIELDS: Readonly<Record<PolicyKey, PolicyFieldMeta>> = {
  enabled: { label: 'Anonymous browsing', kind: 'bool' },
  allowGuestProjectCreation: { label: 'Guest project creation', kind: 'bool' },
  maxGuestProjects: { label: 'Max projects per guest', kind: 'number', unit: 'projects' },
  allowCloudSave: { label: 'Guest cloud save', kind: 'bool' },
  allowRender: { label: 'Guest renders', kind: 'bool' },
  maxRenderDurationSeconds: { label: 'Max render length', kind: 'number', unit: 's' },
  maxAiCallsPerDay: { label: 'Guest AI calls per day', kind: 'number', unit: '/day' },
  allowYouTubePublish: { label: 'Guest YouTube publishing', kind: 'bool' },
  allowGoogleDrivePublish: { label: 'Guest Google Drive publishing', kind: 'bool' },
};

export const POLICY_KEYS = Object.keys(POLICY_FIELDS) as PolicyKey[];
export const POLICY_NUMBER_KEYS: readonly PolicyNumberKey[] = ['maxGuestProjects', 'maxRenderDurationSeconds', 'maxAiCallsPerDay'];

/** A change in this direction deserves a second look before it is saved. */
const POLICY_CAUTIONS: Partial<Record<PolicyKey, { when: boolean; text: string }>> = {
  enabled: { when: false, text: 'Visitors who are not signed in will no longer be able to use the studio.' },
  allowCloudSave: { when: true, text: 'Guest projects will be stored in the central database.' },
  allowYouTubePublish: { when: true, text: 'Signed-out visitors will be able to connect a YouTube channel and publish. Sensitive tabs shown to guests will appear.' },
  allowGoogleDrivePublish: { when: true, text: 'Signed-out visitors will be able to connect Google Drive and export to it.' },
};

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Fills what an older server leaves out with the same defaults the server itself would apply. */
export function toPolicyForm(policy: AnonymousAccessPolicy): PolicyForm {
  const d = DEFAULT_POLICY_FORM;
  return {
    enabled: policy.enabled ?? d.enabled,
    allowGuestProjectCreation: policy.allowGuestProjectCreation ?? d.allowGuestProjectCreation,
    maxGuestProjects: finiteNumber(policy.maxGuestProjects, d.maxGuestProjects ?? 5),
    allowCloudSave: policy.allowCloudSave ?? d.allowCloudSave,
    allowRender: policy.allowRender ?? d.allowRender,
    maxRenderDurationSeconds: finiteNumber(policy.maxRenderDurationSeconds, d.maxRenderDurationSeconds ?? 30),
    maxAiCallsPerDay: finiteNumber(policy.maxAiCallsPerDay, d.maxAiCallsPerDay ?? 3),
    allowYouTubePublish: policy.allowYouTubePublish ?? d.allowYouTubePublish,
    allowGoogleDrivePublish: policy.allowGoogleDrivePublish ?? d.allowGoogleDrivePublish,
  };
}

/**
 * The body to send: whatever the server gave us, with the edited fields laid over it, so a
 * field this page does not know about (the server's own `allowedFeatures`) is sent back untouched.
 */
export function mergePolicy(base: AnonymousAccessPolicy | null, form: PolicyForm): AnonymousAccessPolicy {
  return {
    ...(base ?? {}),
    enabled: form.enabled,
    allowGuestProjectCreation: form.allowGuestProjectCreation,
    maxGuestProjects: form.maxGuestProjects ?? DEFAULT_POLICY_FORM.maxGuestProjects ?? 5,
    allowCloudSave: form.allowCloudSave,
    allowRender: form.allowRender,
    maxRenderDurationSeconds: form.maxRenderDurationSeconds ?? DEFAULT_POLICY_FORM.maxRenderDurationSeconds ?? 30,
    maxAiCallsPerDay: form.maxAiCallsPerDay ?? DEFAULT_POLICY_FORM.maxAiCallsPerDay ?? 3,
    allowYouTubePublish: form.allowYouTubePublish,
    allowGoogleDrivePublish: form.allowGoogleDrivePublish,
  };
}

export function policyErrors(form: PolicyForm): Partial<Record<PolicyNumberKey, string>> {
  const errors: Partial<Record<PolicyNumberKey, string>> = {};
  for (const key of POLICY_NUMBER_KEYS) {
    const value = form[key];
    const { min, max } = POLICY_LIMITS[key];
    if (value === null || !Number.isFinite(value)) errors[key] = 'Enter a whole number.';
    else if (!Number.isInteger(value)) errors[key] = 'Whole numbers only.';
    else if (value < min || value > max) errors[key] = `Use a value from ${min} to ${max}.`;
  }
  return errors;
}

export function formatPolicyValue(key: PolicyKey, value: boolean | number | null): string {
  const meta = POLICY_FIELDS[key];
  if (meta.kind === 'bool') return value ? 'On' : 'Off';
  if (value === null) return 'empty';
  return meta.unit === 's' ? `${value} s` : String(value);
}

/** Reads a number box: empty or unreadable is null, so it can be flagged instead of guessed at. */
export function parseNumberInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

// --- browser session policy ---------------------------------------------------------------------

export interface SessionForm {
  timeoutMinutes: number;
  warningMinutes: number;
}

export const TIMEOUT_OPTIONS: readonly number[] = [15, 30, 45, 60, 120, 180];
export const WARNING_OPTIONS: readonly number[] = [1, 2, 3, 5];

/** The presets, plus the stored value when it is none of them, so the select never shows blank. */
export function withCurrent(options: readonly number[], current: number): number[] {
  return options.includes(current) ? [...options] : [...options, current].sort((a, b) => a - b);
}

// --- navigation tabs ---------------------------------------------------------------------------

export type NavFlag = 'visibleToAnonymous' | 'visibleToMembers' | 'enabled';
export const NAV_FLAGS: readonly NavFlag[] = ['visibleToAnonymous', 'visibleToMembers', 'enabled'];

export const NAV_FLAG_LABEL: Readonly<Record<NavFlag, string>> = {
  visibleToAnonymous: 'Guests',
  visibleToMembers: 'Members',
  enabled: 'Enabled',
};

/** Mirrors UiNavigationService: these two are shown to administrators only, whatever their switches say. */
const ADMIN_ONLY_TABS: ReadonlySet<string> = new Set(['admin', 'logs']);
export const isAdminOnlyTab = (tab: { id: string }): boolean => ADMIN_ONLY_TABS.has(tab.id);

const TAB_ICONS: Readonly<Record<string, string>> = {
  projects: '📁',
  shorts: '📱',
  calendar: '📅',
  effects: '✨',
  clips: '🎞️',
  tools: '🛠️',
  release: '🎵',
  youtube: '▶️',
  details: '🔍',
  live: '🔴',
  camera: '📷',
  'motion-copy': '🕺',
  animate: '🖼️',
  collab: '👥',
  logs: '📜',
  admin: '⚙️',
};

export const tabIcon = (id: string): string => TAB_ICONS[id] ?? '📄';

export interface Verdict {
  visible: boolean;
  reason: string | null;
}

const SHOWN: Verdict = { visible: true, reason: null };
const hiddenBecause = (reason: string): Verdict => ({ visible: false, reason });

/**
 * Whether one audience sees a tab in the navigation bar. This follows
 * UiNavigationService.visibleNavItems step for step, including the rule that a sensitive tab
 * is withheld from guests while guest YouTube publishing is off - a rule the switches alone
 * do not reveal.
 */
export function verdict(persona: Persona, tab: UiNavigationItemConfig, guestsMaySeeSensitive: boolean): Verdict {
  if (!tab.enabled) return hiddenBecause('Switched off for everyone');
  const adminOnly = isAdminOnlyTab(tab);

  switch (persona) {
    case 'guest':
      if (adminOnly) return hiddenBecause('Administrators only');
      if (!tab.visibleToAnonymous) return hiddenBecause('Hidden from guests');
      if (tab.isSensitive && !guestsMaySeeSensitive) return hiddenBecause('Sensitive: withheld while guest YouTube publishing is off');
      return SHOWN;
    case 'member':
      if (adminOnly) return hiddenBecause('Administrators only');
      return tab.visibleToMembers ? SHOWN : hiddenBecause('Hidden from members');
    case 'admin':
      if (adminOnly) return SHOWN;
      return tab.visibleToMembers ? SHOWN : hiddenBecause('Hidden from members (administrators follow that switch)');
  }
}

export interface PersonaItem {
  tab: UiNavigationItemConfig;
  visible: boolean;
  was: boolean;
  reason: string | null;
}

export interface PersonaView {
  persona: Persona;
  /** Visible now, or visible before the unsaved edits - so what is about to disappear stays on screen. */
  shown: PersonaItem[];
  hidden: PersonaItem[];
  visible: number;
  total: number;
  added: number;
  removed: number;
}

export function buildPersonaViews(
  savedTabs: readonly UiNavigationItemConfig[],
  draftTabs: readonly UiNavigationItemConfig[],
  savedAllowSensitive: boolean,
  draftAllowSensitive: boolean,
): PersonaView[] {
  const before = new Map(savedTabs.map((tab) => [tab.id, tab]));

  return PERSONAS.map((persona) => {
    const items: PersonaItem[] = draftTabs.map((tab) => {
      const now = verdict(persona, tab, draftAllowSensitive);
      const saved = before.get(tab.id);
      const was = saved ? verdict(persona, saved, savedAllowSensitive).visible : false;
      return { tab, visible: now.visible, was, reason: now.reason };
    });
    return {
      persona,
      shown: items.filter((item) => item.visible || item.was),
      hidden: items.filter((item) => !item.visible && !item.was),
      visible: items.filter((item) => item.visible).length,
      total: items.length,
      added: items.filter((item) => item.visible && !item.was).length,
      removed: items.filter((item) => !item.visible && item.was).length,
    };
  });
}

export type CapabilityTone = 'on' | 'off' | 'safe' | 'risk';

export interface Capability {
  key: string;
  label: string;
  value: string;
  tone: CapabilityTone;
  changed: boolean;
}

/** What the guest limits mean in plain words, with a marker on whatever the unsaved edits touch. */
export function guestCapabilities(saved: PolicyForm, draft: PolicyForm): Capability[] {
  const differs = (...keys: PolicyKey[]) => keys.some((key) => saved[key] !== draft[key]);
  const on = (allowed: boolean, yes: string, no: string): { value: string; tone: CapabilityTone } =>
    allowed ? { value: yes, tone: 'on' } : { value: no, tone: 'off' };

  const browse = on(draft.enabled, 'Allowed', 'Blocked: sign-in required');
  const create = !draft.enabled
    ? { value: 'Not applicable', tone: 'off' as CapabilityTone }
    : on(draft.allowGuestProjectCreation, `Up to ${draft.maxGuestProjects ?? '?'} projects`, 'Not allowed');
  const render = !draft.enabled
    ? { value: 'Not applicable', tone: 'off' as CapabilityTone }
    : on(draft.allowRender, `Up to ${draft.maxRenderDurationSeconds ?? '?'} s per render`, 'Not allowed');
  const ai = !draft.enabled
    ? { value: 'Not applicable', tone: 'off' as CapabilityTone }
    : draft.maxAiCallsPerDay === 0
      ? { value: 'None', tone: 'off' as CapabilityTone }
      : { value: `${draft.maxAiCallsPerDay ?? '?'} calls per day`, tone: 'on' as CapabilityTone };

  return [
    { key: 'browse', label: 'Use the studio', ...browse, changed: differs('enabled') },
    { key: 'create', label: 'Create projects', ...create, changed: differs('enabled', 'allowGuestProjectCreation', 'maxGuestProjects') },
    { key: 'render', label: 'Render previews', ...render, changed: differs('enabled', 'allowRender', 'maxRenderDurationSeconds') },
    { key: 'ai', label: 'AI requests', ...ai, changed: differs('enabled', 'maxAiCallsPerDay') },
    {
      key: 'cloud', label: 'Where projects live',
      value: draft.allowCloudSave ? 'Central database' : 'This session only',
      tone: draft.allowCloudSave ? 'risk' : 'safe',
      changed: differs('allowCloudSave'),
    },
    {
      key: 'youtube', label: 'Publish to YouTube',
      value: draft.allowYouTubePublish ? 'Allowed' : 'Blocked',
      tone: draft.allowYouTubePublish ? 'risk' : 'safe',
      changed: differs('allowYouTubePublish'),
    },
    {
      key: 'drive', label: 'Export to Google Drive',
      value: draft.allowGoogleDrivePublish ? 'Allowed' : 'Blocked',
      tone: draft.allowGoogleDrivePublish ? 'risk' : 'safe',
      changed: differs('allowGoogleDrivePublish'),
    },
  ];
}

// --- what changed ------------------------------------------------------------------------------

export type ChangeSection = 'nav' | 'policy' | 'session';

export interface ChangeItem {
  id: string;
  section: ChangeSection;
  /** A tab id, a policy key or a session key. */
  target: string;
  field: string;
  title: string;
  from: string;
  to: string;
  /** Why this change needs a deliberate yes before it is saved, or null. */
  caution: string | null;
}

export const SECTION_LABEL: Readonly<Record<ChangeSection, string>> = {
  nav: 'Navigation',
  policy: 'Guest policy',
  session: 'Session',
};

function navWord(flag: NavFlag, on: boolean): string {
  if (flag === 'enabled') return on ? 'Enabled' : 'Disabled';
  return on ? 'Visible' : 'Hidden';
}

function navCaution(tab: UiNavigationItemConfig, flag: NavFlag): string | null {
  if (flag === 'visibleToAnonymous' && tab.visibleToAnonymous && !isAdminOnlyTab(tab) && (tab.isSensitive || tab.requiresAuth)) {
    return `${tab.label} is ${tab.isSensitive ? 'a sensitive tab' : 'meant for signed-in people'}, and this shows it to signed-out visitors.`;
  }
  if (flag === 'enabled' && !tab.enabled && tab.id === 'admin') {
    return 'This removes the Settings link from the navigation for everyone, including you. /admin still opens directly.';
  }
  return null;
}

export function diffTabs(saved: readonly UiNavigationItemConfig[], draft: readonly UiNavigationItemConfig[]): ChangeItem[] {
  const before = new Map(saved.map((tab) => [tab.id, tab]));
  const changes: ChangeItem[] = [];
  for (const tab of draft) {
    const was = before.get(tab.id);
    if (!was) continue;
    for (const flag of NAV_FLAGS) {
      if (was[flag] === tab[flag]) continue;
      changes.push({
        id: `nav:${tab.id}:${flag}`,
        section: 'nav',
        target: tab.id,
        field: flag,
        title: `${tab.label} · ${NAV_FLAG_LABEL[flag]}`,
        from: navWord(flag, was[flag]),
        to: navWord(flag, tab[flag]),
        caution: navCaution(tab, flag),
      });
    }
  }
  return changes;
}

export function diffPolicy(saved: PolicyForm, draft: PolicyForm): ChangeItem[] {
  const changes: ChangeItem[] = [];
  for (const key of POLICY_KEYS) {
    if (saved[key] === draft[key]) continue;
    const caution = POLICY_CAUTIONS[key];
    changes.push({
      id: `policy:${key}`,
      section: 'policy',
      target: key,
      field: 'value',
      title: POLICY_FIELDS[key].label,
      from: formatPolicyValue(key, saved[key]),
      to: formatPolicyValue(key, draft[key]),
      caution: caution && draft[key] === caution.when ? caution.text : null,
    });
  }
  return changes;
}

export function diffSession(saved: SessionForm, draft: SessionForm): ChangeItem[] {
  const changes: ChangeItem[] = [];
  if (saved.timeoutMinutes !== draft.timeoutMinutes) {
    changes.push({
      id: 'session:timeoutMinutes', section: 'session', target: 'timeoutMinutes', field: 'value',
      title: 'Inactivity timeout', from: `${saved.timeoutMinutes} min`, to: `${draft.timeoutMinutes} min`, caution: null,
    });
  }
  if (saved.warningMinutes !== draft.warningMinutes) {
    changes.push({
      id: 'session:warningMinutes', section: 'session', target: 'warningMinutes', field: 'value',
      title: 'Warning window', from: `${saved.warningMinutes} min`, to: `${draft.warningMinutes} min`, caution: null,
    });
  }
  return changes;
}

export function matchesNavQuery(tab: UiNavigationItemConfig, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = `${tab.label} ${tab.id} ${tab.path} ${tab.description ?? ''}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

export function matchesNavFilter(
  tab: UiNavigationItemConfig, filter: NavFilter, changedIds: ReadonlySet<string>, guestsMaySeeSensitive: boolean,
): boolean {
  switch (filter) {
    case 'all': return true;
    case 'changed': return changedIds.has(tab.id);
    case 'guest-visible': return verdict('guest', tab, guestsMaySeeSensitive).visible;
    case 'guest-hidden': return !verdict('guest', tab, guestsMaySeeSensitive).visible;
    case 'sensitive': return tab.isSensitive;
    case 'disabled': return !tab.enabled;
  }
}

// --- time --------------------------------------------------------------------------------------

export const DAY_MS = 86_400_000;

/** The API names these fields UTC; a stamp without an offset would otherwise be read as local time. */
export function parseUtc(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const text = value.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T00:00:00Z`
    : /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}Z`;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function ago(ms: number | null, now: number): string {
  if (ms === null) return '—';
  const diff = now - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / DAY_MS);
  if (days < 60) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// --- user and guest scopes ---------------------------------------------------------------------

export interface ScopeRow {
  item: UserScopeItem;
  lastMs: number | null;
  idleDays: number | null;
  megabytes: number;
  search: string;
  /** A guest whose newest project is older than the idle threshold: exactly what a purge removes. */
  stale: boolean;
}

/** "~36 MB" is an estimate the server builds from the project count; this turns it back into a number to sort by. */
export function parseStorageMb(text: string | null | undefined): number {
  const match = /([\d.,]+)\s*(KB|MB|GB|TB)/i.exec(text ?? '');
  if (!match) return 0;
  const amount = parseFloat(match[1].replace(/,/g, ''));
  if (!Number.isFinite(amount)) return 0;
  switch (match[2].toUpperCase()) {
    case 'KB': return amount / 1024;
    case 'GB': return amount * 1024;
    case 'TB': return amount * 1024 * 1024;
    default: return amount;
  }
}

export function toScopeRows(items: readonly UserScopeItem[], now: number, staleDays: number): ScopeRow[] {
  const cutoff = now - staleDays * DAY_MS;
  return items.map((item) => {
    const lastMs = parseUtc(item.lastActiveUtc);
    return {
      item,
      lastMs,
      idleDays: lastMs === null ? null : Math.max(0, Math.floor((now - lastMs) / DAY_MS)),
      megabytes: parseStorageMb(item.storageEstimate),
      search: `${item.displayName ?? ''} ${item.userId ?? ''}`.toLowerCase(),
      stale: !!item.isGuest && lastMs !== null && lastMs < cutoff,
    };
  });
}

export function matchesScopeFilter(row: ScopeRow, filter: ScopeFilter): boolean {
  switch (filter) {
    case 'all': return true;
    case 'registered': return !row.item.isGuest;
    case 'guest': return !!row.item.isGuest;
    case 'stale': return row.stale;
  }
}

/** Any kind of scope, by how recently it was touched. A scope with no recorded time only matches "any time". */
export function matchesActivity(row: ScopeRow, activity: ScopeActivity, now: number): boolean {
  if (activity === 'any') return true;
  if (row.lastMs === null) return false;
  const age = now - row.lastMs;
  switch (activity) {
    case 'day': return age <= DAY_MS;
    case 'week': return age <= 7 * DAY_MS;
    case 'month': return age <= 30 * DAY_MS;
    case 'older': return age > 30 * DAY_MS;
  }
}

export function sortScopes(rows: readonly ScopeRow[], sort: { key: ScopeSortKey; dir: SortDir }): ScopeRow[] {
  const factor = sort.dir === 'asc' ? 1 : -1;
  const name = (row: ScopeRow) => (row.item.displayName ?? '').toLowerCase();
  return [...rows].sort((a, b) => {
    let result = 0;
    switch (sort.key) {
      case 'lastActive':
        // An unknown time sorts last in either direction rather than posing as the oldest or newest.
        if (a.lastMs === null || b.lastMs === null) {
          if (a.lastMs !== b.lastMs) return a.lastMs === null ? 1 : -1;
        } else {
          result = a.lastMs - b.lastMs;
        }
        break;
      case 'name': result = name(a).localeCompare(name(b)); break;
      case 'type': result = Number(!!a.item.isGuest) - Number(!!b.item.isGuest); break;
      case 'projects': result = a.item.projectCount - b.item.projectCount; break;
      case 'storage': result = a.megabytes - b.megabytes; break;
    }
    return result * factor || (a.item.userId ?? '').localeCompare(b.item.userId ?? '');
  });
}

export interface PurgePreview {
  /** Projects in guest sessions whose newest project is past the threshold: all of them go. */
  certainProjects: number;
  certainSessions: number;
  /** Older projects that could also go from guest sessions with a newer one; the server decides per project. */
  possibleProjects: number;
  possibleSessions: number;
  /** The most idle sessions affected, to show who is about to lose what. */
  sample: ScopeRow[];
}

/**
 * What a purge would remove, estimated from the scope list. The server deletes per project by
 * its own last-update time, while the list only knows each session's newest one, so the
 * guaranteed part and the possible part are kept apart rather than blended into one guess.
 */
export function purgePreview(rows: readonly ScopeRow[], days: number, now: number): PurgePreview {
  const cutoff = now - days * DAY_MS;
  let certainProjects = 0;
  let certainSessions = 0;
  let possibleProjects = 0;
  let possibleSessions = 0;
  const affected: ScopeRow[] = [];

  for (const row of rows) {
    if (!row.item.isGuest) continue;
    if (row.lastMs !== null && row.lastMs < cutoff) {
      certainProjects += row.item.projectCount;
      certainSessions++;
      affected.push(row);
    } else {
      // Its newest project is safe, so at most the others can go; with no timestamp, any of them.
      const maybe = row.lastMs === null ? row.item.projectCount : row.item.projectCount - 1;
      if (maybe > 0) {
        possibleProjects += maybe;
        possibleSessions++;
      }
    }
  }

  affected.sort((a, b) => (a.lastMs ?? 0) - (b.lastMs ?? 0));
  return { certainProjects, certainSessions, possibleProjects, possibleSessions, sample: affected.slice(0, 5) };
}

// --- connected YouTube channels ----------------------------------------------------------------

export interface ChannelRow {
  key: string;
  channelId: string;
  title: string;
  handle: string | null;
  thumbnail: string | null;
  owner: string | null;
  status: string;
  needsReconnect: boolean;
  canComment: boolean | null;
  connectedMs: number | null;
  lastActiveMs: number | null;
  search: string;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function flag(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/** Only https images are drawn: the URL comes from the server's record of a third party's channel. */
function safeImage(url: string | null): string | null {
  return url !== null && /^https:\/\//i.test(url) ? url : null;
}

/**
 * The channel list as the server really sends it (channelId, channelTitle, channelHandle,
 * needsReconnect, lastUploadAt ...) and as the typed model describes it (id, ownerUserId,
 * status, lastUsedAt ...). Both shapes are read, and a field that is absent is simply absent
 * instead of being something the table crashes on.
 */
export function toChannelRows(list: readonly unknown[] | null | undefined): ChannelRow[] {
  const seen = new Set<string>();
  return (list ?? []).map((entry, index) => {
    const raw = asRecord(entry);
    const channelId = text(raw['channelId']) ?? '';
    const owner = text(raw['ownerUserId']);
    const statusText = text(raw['status']);
    const needsReconnect = flag(raw['needsReconnect']) ?? (statusText !== null && statusText.toLowerCase() !== 'connected');
    const title = text(raw['channelTitle']) ?? 'Untitled channel';

    let key = text(raw['id']) ?? `${owner ?? ''}:${channelId}`;
    if (seen.has(key)) key = `${key}#${index}`;
    seen.add(key);

    return {
      key,
      channelId,
      title,
      handle: text(raw['channelHandle']),
      thumbnail: safeImage(text(raw['thumbnailUrl'])),
      owner,
      status: statusText ?? (needsReconnect ? 'Needs reconnect' : 'Connected'),
      needsReconnect,
      canComment: flag(raw['canComment']),
      connectedMs: parseUtc(raw['connectedAt']),
      lastActiveMs: parseUtc(raw['lastUsedAt'] ?? raw['lastUploadAt']),
      search: `${title} ${channelId} ${text(raw['channelHandle']) ?? ''} ${owner ?? ''}`.toLowerCase(),
    };
  });
}

export function sortChannels(rows: readonly ChannelRow[], sort: { key: ChannelSortKey; dir: SortDir }): ChannelRow[] {
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let result = 0;
    switch (sort.key) {
      case 'title': result = a.title.toLowerCase().localeCompare(b.title.toLowerCase()); break;
      case 'connected': result = (a.connectedMs ?? 0) - (b.connectedMs ?? 0); break;
      case 'lastActive': result = (a.lastActiveMs ?? 0) - (b.lastActiveMs ?? 0); break;
    }
    return result * factor || a.key.localeCompare(b.key);
  });
}
