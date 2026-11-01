import { computed, signal, type Signal, type WritableSignal } from '@angular/core';

import { diffDrafts, type FieldChange, type FieldSpec } from './branding.logic';

const HISTORY_LIMIT = 80;
/** Edits to the same field closer together than this are one undo step (a slider drag, a burst of typing). */
const COALESCE_MS = 900;

function sameDraft<D extends object>(a: D, b: D): boolean {
  const keys = Object.keys(a) as (keyof D)[];
  return keys.every((k) => a[k] === b[k]);
}

/**
 * One editable form: what is on screen (`draft`), what the server holds (`saved`), the
 * difference between them, and an undo/redo history of the edits made since it was loaded.
 */
export class DraftStore<D extends object> {
  readonly draft: WritableSignal<D>;
  readonly saved: WritableSignal<D>;
  /** What differs between saved and draft, only counting fields that matter for the draft. */
  readonly changes: Signal<FieldChange[]>;
  readonly dirty: Signal<boolean>;
  readonly canUndo: Signal<boolean>;
  readonly canRedo: Signal<boolean>;

  private readonly specs: readonly FieldSpec<D>[];
  private readonly blank: () => D;
  private readonly version = signal(0);
  private undoStack: D[] = [];
  private redoStack: D[] = [];
  private lastKey: string | null = null;
  private lastAt = 0;

  constructor(blank: () => D, specs: readonly FieldSpec<D>[]) {
    this.blank = blank;
    this.specs = specs;
    this.draft = signal(blank());
    this.saved = signal(blank());
    this.changes = computed(() => diffDrafts(this.specs, this.saved(), this.draft()));
    this.dirty = computed(() => this.changes().length > 0);
    this.canUndo = computed(() => {
      this.version();
      return this.undoStack.length > 0;
    });
    this.canRedo = computed(() => {
      this.version();
      return this.redoStack.length > 0;
    });
  }

  /** Replaces both draft and baseline, e.g. after a load. History starts over. */
  load(value: D | null): void {
    const next = value ?? this.blank();
    this.draft.set(next);
    this.saved.set(next);
    this.undoStack = [];
    this.redoStack = [];
    this.lastKey = null;
    this.version.update((v) => v + 1);
  }

  /** An edit. `key` names the field so a burst of edits to it collapses into one undo step. */
  set(next: D, key?: string): void {
    const current = this.draft();
    if (sameDraft(current, next)) return;

    const now = Date.now();
    const joins = key !== undefined && key === this.lastKey && now - this.lastAt < COALESCE_MS && this.undoStack.length > 0;
    if (!joins) {
      this.undoStack.push(current);
      if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    }
    this.redoStack = [];
    this.lastKey = key ?? null;
    this.lastAt = now;
    this.draft.set(next);
    this.version.update((v) => v + 1);
  }

  patch(partial: Partial<D>, key?: string): void {
    this.set({ ...this.draft(), ...partial }, key);
  }

  /** The server now holds `saved`. If nothing changed since `sent` went out, the draft adopts the server's (clamped) values. */
  markSaved(saved: D, sent: D): void {
    this.saved.set(saved);
    if (sameDraft(this.draft(), sent)) this.draft.set(saved);
  }

  /** Part of the baseline changed on the server by itself (an upload attached a file). */
  adoptSaved(partial: Partial<D>): void {
    this.saved.update((s) => ({ ...s, ...partial }));
  }

  /** Back to the baseline. An edit like any other, so it can be undone. */
  discard(): void {
    this.set(this.saved());
    this.lastKey = null;
  }

  undo(): void {
    const previous = this.undoStack.pop();
    if (previous === undefined) return;
    this.redoStack.push(this.draft());
    this.draft.set(previous);
    this.lastKey = null;
    this.version.update((v) => v + 1);
  }

  redo(): void {
    const next = this.redoStack.pop();
    if (next === undefined) return;
    this.undoStack.push(this.draft());
    this.draft.set(next);
    this.lastKey = null;
    this.version.update((v) => v + 1);
  }
}
