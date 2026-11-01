import { AdminAuditEntry } from '../../core/models/api.models';
import { parseUtc } from './admin-format';

/**
 * What each audit action code means, as a sentence, a category and how much attention it
 * deserves.
 *
 * The codes are the API and are never renamed; the words here are not, so they can be
 * improved without a migration. A code this file has not heard of still renders - it falls
 * back to a category taken from its prefix and a readable form of the code itself - so a
 * new backend action never shows up as a blank row.
 */
export type AuditCategory =
  | 'members' | 'access' | 'ai' | 'render' | 'branding' | 'youtube' | 'settings' | 'database';

export type AuditTone = 'ok' | 'warn' | 'err' | 'brand' | '';

export interface AuditCategoryInfo {
  id: AuditCategory;
  label: string;
  icon: string;
}

export interface AuditKind {
  label: string;
  category: AuditCategory;
  tone: AuditTone;
  /** Changes who can get in, or what can speak for the studio - the ones worth a second look. */
  sensitive: boolean;
}

export const AUDIT_CATEGORIES: readonly AuditCategoryInfo[] = [
  { id: 'members', label: 'Sign-ups & members', icon: '🧑‍🤝‍🧑' },
  { id: 'access', label: 'Access & security', icon: '🔐' },
  { id: 'ai', label: 'AI providers', icon: '🤖' },
  { id: 'render', label: 'Renders', icon: '🎞️' },
  { id: 'branding', label: 'Branding', icon: '🛡️' },
  { id: 'youtube', label: 'YouTube & Drive', icon: '▶️' },
  { id: 'settings', label: 'Settings & storage', icon: '⚙️' },
  { id: 'database', label: 'Database', icon: '🗄️' },
];

const kind = (
  label: string, category: AuditCategory, tone: AuditTone = '', sensitive = false,
): AuditKind => ({ label, category, tone, sensitive });

const KINDS: Readonly<Record<string, AuditKind>> = {
  'signup.approved': kind('Approved an access request', 'members', 'ok', true),
  'signup.rejected': kind('Rejected an access request', 'members', 'err', true),
  'signup.settings': kind('Opened or closed access requests', 'members', 'warn', true),
  'member.deactivated': kind('Switched a member off', 'members', 'warn', true),
  'member.reactivated': kind('Switched a member back on', 'members', 'ok', true),

  'access-control.updated': kind('Changed guest quotas and access rules', 'access', 'brand', true),
  'access-control.ui-navigation': kind('Changed which pages each audience sees', 'access', 'brand', true),
  'user-scopes.purge-guests': kind('Purged inactive guest projects', 'access', 'warn', true),

  'ai.provider.update': kind('Changed provider settings', 'ai'),
  'ai.provider.reset': kind('Reset a provider to the configuration file', 'ai'),
  'ai.key.install': kind('Installed or rotated an API key', 'ai', 'brand', true),
  'ai.key.remove': kind('Removed an API key', 'ai', 'warn', true),
  'ai.chain.save': kind('Changed a fallback order', 'ai'),
  'ai.provider.test': kind('Tested a connection', 'ai'),

  'render.job.cancel': kind('Cancelled a render', 'render', 'warn'),
  'render.job.requeue': kind('Queued a render again', 'render'),

  'branding.channel-created': kind('Added a brand channel', 'branding', 'ok'),
  'branding.channel-renamed': kind('Renamed a brand channel', 'branding'),
  'branding.channel-made-default': kind('Made a channel the default', 'branding'),
  'branding.channel-deleted': kind('Removed a brand channel', 'branding', 'warn', true),
  'branding.updated': kind('Changed a watermark', 'branding'),
  'branding.logo-uploaded': kind('Uploaded a watermark logo', 'branding'),
  'branding.outro-updated': kind('Changed an end card', 'branding'),
  'branding.outro-uploaded': kind('Uploaded end-card media', 'branding'),
  'branding.outro-qr-uploaded': kind('Uploaded an end-card QR code', 'branding'),
  'branding.publishing-updated': kind('Changed YouTube publishing defaults', 'branding'),

  'youtube.channel.connect': kind('Connected a YouTube channel', 'youtube', 'ok', true),
  'youtube.channel.disconnect': kind('Disconnected a YouTube channel', 'youtube', 'warn', true),
  'google.drive.connect': kind('Connected Google Drive', 'youtube', 'ok', true),
  'google.drive.disconnect': kind('Disconnected Google Drive', 'youtube', 'warn', true),
  'youtube.video.details': kind('Updated a video\'s details', 'youtube'),
  'youtube.video.thumbnail': kind('Changed a video\'s thumbnail', 'youtube'),
  'youtube.video.schedule': kind('Scheduled a video', 'youtube'),
  'youtube.video.comment': kind('Posted a comment', 'youtube'),
  'youtube.video.forget': kind('Unlinked a video', 'youtube'),
  'youtube.handoff.apply': kind('Applied a phone handoff', 'youtube'),
  'youtube.live.create': kind('Created a live broadcast', 'youtube'),
  'live.key-saved': kind('Saved a stream key', 'youtube', 'brand', true),
  'live.key-removed': kind('Removed a stream key', 'youtube', 'warn', true),

  'settings.update': kind('Changed an application setting', 'settings'),
  'settings.reset': kind('Reset an application setting', 'settings'),
  'settings.refresh': kind('Reloaded application settings', 'settings'),
  'storage.quota.updated': kind('Changed the storage quota', 'settings'),

  'database.migrate_to_sql': kind('Migrated the database to SQL Server', 'database', 'warn', true),
  'database.sync_drive_data': kind('Synced drive data between databases', 'database'),
};

const PREFIX_CATEGORY: readonly (readonly [string, AuditCategory])[] = [
  ['signup.', 'members'], ['member.', 'members'],
  ['access-control.', 'access'], ['user-scopes.', 'access'],
  ['ai.', 'ai'], ['render.', 'render'], ['branding.', 'branding'],
  ['youtube.', 'youtube'], ['google.', 'youtube'], ['live.', 'youtube'],
  ['settings.', 'settings'], ['storage.', 'settings'], ['database.', 'database'],
];

export function auditKind(action: string): AuditKind {
  const known = KINDS[action];
  if (known) return known;

  const category = PREFIX_CATEGORY.find(([prefix]) => action.startsWith(prefix))?.[1] ?? 'settings';
  const words = action.replace(/[._-]+/g, ' ').trim();
  return kind(words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Unknown change', category);
}

export function auditCategory(id: AuditCategory): AuditCategoryInfo {
  return AUDIT_CATEGORIES.find((c) => c.id === id) ?? AUDIT_CATEGORIES[0];
}

/** "a1b2c3d4…" for an opaque id, the whole thing for an email - ids are noise at a glance. */
export function shortActor(actor: string | null): string {
  if (!actor) return 'unknown';
  if (actor.includes('@') || actor.length <= 14) return actor;
  return `${actor.slice(0, 8)}…`;
}

export interface AuditRow {
  /** Position in the loaded list - what the template tracks by. */
  id: number;
  /** Stable across reloads, so a row the admin opened stays open when the list refreshes. */
  key: string;
  entry: AdminAuditEntry;
  kind: AuditKind;
  category: AuditCategoryInfo;
  time: number;
  /** Lower-cased text the search box looks through. */
  haystack: string;
}

export function toAuditRows(entries: readonly AdminAuditEntry[]): AuditRow[] {
  return entries.map((entry, id) => {
    const k = auditKind(entry.action);
    const category = auditCategory(k.category);

    return {
      id,
      key: `${entry.atUtc}|${entry.action}|${entry.target ?? ''}|${entry.actorUserId ?? ''}`,
      entry,
      kind: k,
      category,
      time: parseUtc(entry.atUtc),
      haystack: [
        k.label, category.label, entry.action, entry.target, entry.before, entry.after,
        entry.actorUserId, entry.remoteAddress,
      ].filter(Boolean).join(' ').toLowerCase(),
    };
  });
}
