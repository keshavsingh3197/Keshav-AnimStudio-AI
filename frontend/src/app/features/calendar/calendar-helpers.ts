import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ContentTopic, DayOfWeekName, WEEK_DAYS } from '../../core/models/calendar.models';

/** "2026-10-26" in the viewer's local time - the calendar groups by the viewer's day. */
export function localDayKey(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** An ISO instant as the value of an <input type="datetime-local"> in the viewer's zone. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A datetime-local value back to an ISO instant; null when empty or unparseable. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** "Mon, Thu · 18:00" */
export function cadenceLabel(topic: ContentTopic): string {
  if (topic.days.length === 0) return 'No fixed days';
  const days = WEEK_DAYS.filter((d) => topic.days.includes(d)).map((d) => d.slice(0, 3));
  const label = days.length === 7 ? 'Every day' : days.join(', ');
  return `${label} · ${topic.publishTime}`;
}

export function dayShort(day: DayOfWeekName): string {
  return day.slice(0, 3);
}

export function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiFailure) return err.hint ? `${err.message} ${err.hint}` : err.message;
  return fallback;
}

/** Copies text; resolves false when the browser refuses (no permission, insecure context). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Only https links are ever rendered as hrefs. */
export function safeHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
