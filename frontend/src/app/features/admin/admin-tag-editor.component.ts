import { Component, ElementRef, computed, input, model, signal, viewChild } from '@angular/core';

import { AdminIconComponent } from './admin-channel-kit';
import { TagRules, addTags, tagBudget } from './admin-publishing.logic';

/**
 * A tag field made of chips. Typing a comma (or Enter) turns the text into a tag, pasting a list
 * adds each item, duplicates are ignored without regard to case, and nothing that would break
 * the rules is added - the reason is said under the field instead.
 */
@Component({
  selector: 'app-tag-editor',
  imports: [AdminIconComponent],
  templateUrl: './admin-tag-editor.component.html',
  styleUrl: './admin-tag-editor.component.css',
})
export class AdminTagEditorComponent {
  readonly tags = model<string[]>([]);
  readonly rules = input.required<TagRules>();
  /** Matches the `for` of the label outside, so the label focuses the field. */
  readonly inputId = input.required<string>();
  readonly placeholder = input('Type a tag, then press Enter or comma');
  readonly prefix = input('');
  readonly error = input<string | null>(null);

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  readonly note = signal<{ kind: 'info' | 'warn'; text: string } | null>(null);

  readonly budget = computed(() => tagBudget(this.tags(), this.rules()));
  readonly percent = computed(() => {
    const b = this.budget();
    return b ? Math.min(100, Math.round((b.used / b.limit) * 100)) : 0;
  });
  readonly full = computed(() => this.tags().length >= this.rules().maxCount);
  readonly over = computed(() => {
    const b = this.budget();
    return (b !== null && b.used > b.limit) || this.tags().length > this.rules().maxCount;
  });
  readonly warn = computed(() => (this.budget()?.left ?? Infinity) <= (this.budget()?.limit ?? 0) * 0.1);

  focus(): void {
    this.field().nativeElement.focus();
  }

  onInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    if (this.rules().split.test(el.value)) this.add(el.value, el);
    else if (this.note()) this.note.set(null);
  }

  onKey(e: KeyboardEvent): void {
    const el = e.target as HTMLInputElement;
    if (e.key === 'Enter') {
      // Enter belongs to the field: it must never submit a form around it.
      e.preventDefault();
      if (el.value.trim()) this.add(el.value, el);
    } else if (e.key === 'Backspace' && !el.value && this.tags().length > 0) {
      const last = this.tags()[this.tags().length - 1];
      this.tags.set(this.tags().slice(0, -1));
      this.note.set({ kind: 'info', text: `Removed “${last}”.` });
    } else if (e.key === 'Escape' && el.value) {
      el.value = '';
      this.note.set(null);
      e.stopPropagation();
    }
  }

  onPaste(e: ClipboardEvent): void {
    const text = e.clipboardData?.getData('text') ?? '';
    // A one-line field would flatten a pasted list; split it here instead.
    if (/[\n\r,]/.test(text)) {
      e.preventDefault();
      this.add(text, e.target as HTMLInputElement);
    }
  }

  commit(): void {
    const el = this.field().nativeElement;
    if (el.value.trim()) this.add(el.value, el);
  }

  remove(tag: string): void {
    this.tags.set(this.tags().filter((t) => t !== tag));
    this.note.set({ kind: 'info', text: `Removed “${tag}”.` });
    this.focus();
  }

  clear(): void {
    const n = this.tags().length;
    this.tags.set([]);
    this.note.set({ kind: 'info', text: `Removed all ${n} ${this.rules().noun}${n === 1 ? '' : 's'}.` });
    this.focus();
  }

  private add(raw: string, el: HTMLInputElement): void {
    const rules = this.rules();
    const result = addTags(this.tags(), raw, rules);
    if (result.added.length > 0) this.tags.set(result.tags);
    el.value = '';

    const said: string[] = [];
    if (result.added.length > 0) said.push(`Added ${result.added.length} ${rules.noun}${result.added.length === 1 ? '' : 's'}.`);
    if (result.duplicates.length > 0) said.push(`${result.duplicates.length} already there.`);
    for (const r of result.rejected.slice(0, 2)) said.push(`“${r.tag}” not added: ${r.reason}`);
    if (result.rejected.length > 2) said.push(`${result.rejected.length - 2} more not allowed.`);
    for (const r of result.overflow.slice(0, 1)) said.push(`“${r.tag}” not added: ${r.reason}`);
    if (result.overflow.length > 1) said.push(`${result.overflow.length - 1} more left out.`);
    const bad = result.rejected.length + result.overflow.length > 0;
    this.note.set(said.length ? { kind: bad ? 'warn' : 'info', text: said.join(' ') } : null);
  }
}
