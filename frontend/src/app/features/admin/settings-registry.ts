/**
 * Every page of server settings, as data.
 * <p>
 * The sidebar, its groups and the search box are all drawn from this list, so a new
 * setting is one entry here - not a new tab squeezed into a row that already overflows.
 * `keywords` names the individual controls on the page: search matches them, which is
 * what lets someone type "opacity" or "qr" and land on the right page without knowing
 * where it lives.
 * </p>
 */
export interface SettingsPage {
  id: string;
  group: SettingsGroup;
  label: string;
  icon: string;
  /** Relative to /admin. */
  route: string;
  description: string;
  keywords: readonly string[];
}

export const SETTINGS_GROUPS = ['Branding', 'Media', 'AI', 'System'] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export const SETTINGS_PAGES: readonly SettingsPage[] = [
  {
    id: 'channels', group: 'Branding', label: 'Channels', icon: '📺', route: 'channels',
    description: 'Every brand channel: add, rename, duplicate, remove, and how many projects use each.',
    keywords: ['channel', 'channels', 'youtube', 'brand', 'add channel', 'rename', 'delete', 'duplicate', 'projects'],
  },
  {
    id: 'watermark', group: 'Branding', label: 'Watermark', icon: '🛡️', route: 'branding/watermark',
    description: 'Each channel\'s logo or text mark, its position, size and opacity.',
    keywords: ['brand', 'hallmark', 'logo', 'text', 'position', 'opacity', 'size', 'margin', 'colour', 'color', 'backplate', 'youtube'],
  },
  {
    id: 'end-card', group: 'Branding', label: 'End card', icon: '🎬', route: 'branding/end-card',
    description: 'Outro bumper, end-card graphic or support card per channel.',
    keywords: ['outro', 'bumper', 'end screen', 'qr', 'support', 'headline', 'language', 'hindi', 'transition', 'card'],
  },
  {
    id: 'publishing', group: 'Branding', label: 'YouTube publishing', icon: '▶️', route: 'branding/publishing',
    description: 'Which YouTube channel each brand channel uploads to, and its default visibility, tags and description footer.',
    keywords: ['youtube', 'publish', 'upload', 'privacy', 'visibility', 'category', 'tags', 'footer', 'kids', 'connect', 'oauth'],
  },
  {
    id: 'storage', group: 'Media', label: 'Storage', icon: '💾', route: 'storage',
    description: 'Space used by media and renders, by folder, and the storage quota.',
    keywords: ['disk', 'space', 'quota', 'gb', 'folder', 'usage', 'size', 'free'],
  },
  {
    id: 'chunking', group: 'Media', label: 'Video chunking', icon: '✂️', route: 'media/chunking',
    description: 'Default segment length when long videos are split into clips.',
    keywords: ['split', 'segment', 'duration', 'seconds', 'shorts', 'chunk'],
  },
  {
    id: 'providers', group: 'AI', label: 'AI providers', icon: '🤖', route: 'providers',
    description: 'Which AI services write, draw, speak and transcribe, and in what order.',
    keywords: ['gemini', 'groq', 'openrouter', 'ollama', 'lm studio', 'key', 'api key', 'model', 'order', 'chain', 'image', 'speech', 'tts', 'whisper'],
  },
  {
    id: 'usage', group: 'AI', label: 'AI usage', icon: '📊', route: 'usage',
    description: 'Requests and spend per provider over recent days.',
    keywords: ['cost', 'tokens', 'limit', 'quota', 'requests', 'daily'],
  },
  {
    id: 'app-settings', group: 'System', label: 'Application settings', icon: '⚙️', route: 'settings',
    description: 'Render quality, timeouts, import limits, streaming and YouTube options - stored in the database, applied without a deploy.',
    keywords: ['config', 'configuration', 'appsettings', 'websettings', 'refresh', 'reload', 'crf', 'preset', 'fps', 'timeout', 'limit', 'restart', 'yt-dlp', 'client id', 'redirect'],
  },
  {
    id: 'health', group: 'System', label: 'This machine', icon: '🖥️', route: 'health',
    description: 'FFmpeg, encoders and tools installed on the server.',
    keywords: ['ffmpeg', 'encoder', 'gpu', 'qsv', 'nvenc', 'yt-dlp', 'fonts', 'health', 'version'],
  },
  {
    id: 'jobs', group: 'System', label: 'Renders', icon: '🎞️', route: 'jobs',
    description: 'The render queue: running, failed and finished jobs.',
    keywords: ['queue', 'job', 'cancel', 'retry', 'export', 'failed'],
  },
  {
    id: 'activity', group: 'System', label: 'Activity', icon: '📜', route: 'activity',
    description: 'Who changed which setting, and when.',
    keywords: ['audit', 'log', 'history', 'changes'],
  },
];

export interface SettingsMatch {
  page: SettingsPage;
  /** The keyword that matched, when it was not the label - shown so the hit makes sense. */
  via: string | null;
}

/** Ranked: label prefix, then label, then a control's keyword, then the description. */
export function searchSettings(query: string): SettingsMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { m: SettingsMatch; score: number }[] = [];
  for (const page of SETTINGS_PAGES) {
    const label = page.label.toLowerCase();
    const keyword = page.keywords.find((k) => k.includes(q));
    const score = label.startsWith(q) ? 4
      : label.includes(q) ? 3
      : keyword ? 2
      : page.description.toLowerCase().includes(q) ? 1 : 0;
    if (score > 0) scored.push({ m: { page, via: score === 2 ? keyword! : null }, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.m);
}
