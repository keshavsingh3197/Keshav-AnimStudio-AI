/** Plain helpers shared by the Channels and YouTube publishing pages (no Angular in here). */

/** Clipboard write with a fallback for pages where the async API is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(box);
    box.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      box.remove();
    }
  }
}

/** Reads a JSON value kept in this browser; anything unreadable is treated as absent. */
export function readStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full disk: the choice simply isn't remembered.
  }
}

/** True while the user is typing somewhere, so single-key shortcuts must stay out of the way. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** The message of whatever a failed call threw. */
export function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return typeof error === 'string' && error ? error : 'Something went wrong.';
}

/** Only an https picture is ever used as an image source. */
export function safePicture(url: string | null | undefined): string | null {
  return url?.startsWith('https://') ? url : null;
}

/** Lower-cased and stripped of accents, so "cafe" finds "Café". */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();
}
