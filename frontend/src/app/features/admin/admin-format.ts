/** Small formatting helpers the admin pages share: UTC dates from the API, durations, downloads. */

/** The API sends UTC; a value without a zone would otherwise be read as local time. */
export function parseUtc(iso: string | null | undefined): number {
  if (!iso) return Number.NaN;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso);
  return Date.parse(hasZone ? iso : `${iso}Z`);
}

export function relativeTime(then: number, now: number): string {
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((now - then) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(then).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "45s", "3m 05s", "2h 10m" - what a render took, not a clock time. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes}m ${String(total % 60).padStart(2, '0')}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function localDay(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayKey(time: number): string {
  return Number.isNaN(time) ? 'unknown' : localDay(time);
}

export function dayLabel(time: number, now: number): string {
  if (Number.isNaN(time)) return 'Unknown date';
  const key = localDay(time);
  if (key === localDay(now)) return 'Today';
  if (key === localDay(now - 86_400_000)) return 'Yesterday';
  return new Date(time).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function longDate(time: number, fallback = ''): string {
  return Number.isNaN(time)
    ? fallback
    : new Date(time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'medium' });
}

/** Saves text as a file. The BOM makes Excel read a CSV as UTF-8 rather than guessing. */
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob(['\ufeff' + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** yyyymmddhhmm in local time, for file names. */
export function fileStamp(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}${p(date.getHours())}${p(date.getMinutes())}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
