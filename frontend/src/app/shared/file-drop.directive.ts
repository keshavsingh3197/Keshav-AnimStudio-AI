import { DestroyRef, Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { StatusService } from '../core/services/status.service';

/**
 * Turns any element into a file target: drag files onto it, or press Ctrl+V with a copied
 * file or screenshot while it is hovered, focused, or was the last zone clicked. The click
 * upload stays with the `<input type="file">` already inside the element.
 *
 *   <div appFileDrop="image/png,image/jpeg" (filesDropped)="upload($event[0])">…</div>
 *
 * The value is an `accept` string, same syntax as the file input's, so both can share one.
 * `fileDropPasteOnly` is for places that already run their own drag-and-drop.
 */
@Directive({
  selector: '[appFileDrop]',
  standalone: true,
  exportAs: 'fileDrop',
  host: {
    '[class.file-drop-zone]': '!fileDropDisabled()',
    '[class.file-drop-active]': 'active()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(pointerdown)': 'onPointerDown()',
  },
})
export class FileDropDirective {
  readonly accept = input<string>('', { alias: 'appFileDrop' });
  readonly fileDropMultiple = input(false);
  readonly fileDropDisabled = input(false);
  readonly fileDropPasteOnly = input(false);

  /** Only files that pass `accept`; never empty. */
  readonly filesDropped = output<File[]>();

  readonly active = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly status = inject(StatusService);

  constructor() {
    register(this);
    inject(DestroyRef).onDestroy(() => unregister(this));
  }

  contains(node: Node | null): boolean {
    return !!node && this.host.contains(node);
  }

  get enabled(): boolean {
    return !this.fileDropDisabled() && this.host.isConnected;
  }

  // Hover and last click are tracked module-wide, so one Ctrl+V goes to exactly one zone.
  onMouseEnter(): void {
    zones.hovered = this;
  }

  onPointerDown(): void {
    zones.lastUsed = this;
  }

  onMouseLeave(): void {
    if (zones.hovered === this) zones.hovered = null;
  }

  onDragOver(event: DragEvent): void {
    if (this.fileDropPasteOnly() || this.fileDropDisabled() || !hasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.active.set(true);
  }

  onDragLeave(event: DragEvent): void {
    // dragleave also fires when moving onto a child; only a real exit counts.
    if (!this.contains(event.relatedTarget as Node | null)) this.active.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.fileDropPasteOnly() || this.fileDropDisabled() || !hasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    this.active.set(false);
    this.deliver(Array.from(event.dataTransfer?.files ?? []));
  }

  /** Called by the shared paste listener once this zone has been chosen. */
  deliver(files: File[]): void {
    const accepted = files.filter((f) => matchesAccept(f, this.accept()));
    const rejected = files.length - accepted.length;
    if (accepted.length === 0) {
      this.status.notify([
        rejected === 1 ? `"${files[0].name}" is not a supported file here.` : 'None of those files are supported here.',
      ]);
      return;
    }
    if (rejected > 0) this.status.notify([`Skipped ${rejected} unsupported file(s).`]);
    this.filesDropped.emit(this.fileDropMultiple() ? accepted : accepted.slice(0, 1));
  }
}

const zones = {
  all: new Set<FileDropDirective>(),
  hovered: null as FileDropDirective | null,
  lastUsed: null as FileDropDirective | null,
};

function register(zone: FileDropDirective): void {
  if (zones.all.size === 0) document.addEventListener('paste', onPaste, true);
  zones.all.add(zone);
}

function unregister(zone: FileDropDirective): void {
  zones.all.delete(zone);
  if (zones.hovered === zone) zones.hovered = null;
  if (zones.lastUsed === zone) zones.lastUsed = null;
  if (zones.all.size === 0) document.removeEventListener('paste', onPaste, true);
}

/**
 * Capture phase, so it runs before page-level paste handlers (the clip studio pastes clips
 * on Ctrl+V); they see `defaultPrevented` and stand down when a file was taken here.
 */
function onPaste(event: ClipboardEvent): void {
  const files = clipboardFiles(event);
  if (files.length === 0) return; // plain text paste: leave it to the field

  const target = pickPasteTarget();
  if (!target) return;

  event.preventDefault();
  event.stopPropagation();
  target.deliver(files);
}

/** Hovered beats focused beats last clicked; with only one zone on screen, that one. */
function pickPasteTarget(): FileDropDirective | null {
  const enabled = [...zones.all].filter((z) => z.enabled);
  if (zones.hovered?.enabled) return zones.hovered;
  const focused = enabled.find((z) => z.contains(document.activeElement));
  if (focused) return focused;
  if (zones.lastUsed?.enabled) return zones.lastUsed;
  return enabled.length === 1 ? enabled[0] : null;
}

function hasFiles(event: DragEvent): boolean {
  return !!event.dataTransfer?.types?.includes('Files');
}

function clipboardFiles(event: ClipboardEvent): File[] {
  const data = event.clipboardData;
  if (!data) return [];
  let files = Array.from(data.files ?? []);
  if (files.length === 0) {
    files = Array.from(data.items ?? [])
      .filter((i) => i.kind === 'file')
      .map((i) => i.getAsFile())
      .filter((f): f is File => !!f);
  }
  return files.map(nameScreenshot);
}

/**
 * A pasted screenshot arrives as "image.png" every time, which would collide with itself
 * in the library; give it a timestamped name instead.
 */
function nameScreenshot(file: File): File {
  const m = /^image\.(\w+)$/i.exec(file.name);
  if (!m) return file;
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return new File([file], `pasted-${stamp}.${m[1].toLowerCase()}`, { type: file.type, lastModified: file.lastModified });
}

/** Same rules as `<input accept>`: `.ext`, `type/*`, or an exact MIME type. */
export function matchesAccept(file: File, accept: string): boolean {
  const rules = accept.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return rules.some((r) =>
    r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? type.startsWith(r.slice(0, -1)) : type === r,
  );
}

/** For the few screens that read the clipboard themselves (the clip studio). */
export { clipboardFiles };
