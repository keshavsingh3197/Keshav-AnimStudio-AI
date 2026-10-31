import {
  Component, ElementRef, HostListener, ViewChild, computed, inject, input, output, signal,
} from '@angular/core';

import { BrandChannel, DEFAULT_BRAND_CHANNEL } from '../core/models/api.models';

/** "Logo · Card" - what a channel has set up, in a few words. */
export function channelSummary(c: BrandChannel | null | undefined): string {
  if (!c) return '';
  const wm = c.watermark && c.watermark.kind !== 'None' ? `${c.watermark.kind.toLowerCase()} watermark` : 'no watermark';
  const outro = !c.outro || c.outro.kind === 'None' ? 'no end card'
    : c.outro.kind === 'Video' ? 'bumper video' : c.outro.kind === 'Image' ? 'end graphic' : 'QR end card';
  return `${wm} · ${outro}`;
}

/**
 * Picks one brand channel out of any number of them.
 * <p>
 * A row of tabs is fine for three channels and useless for three hundred, so this is a
 * button that opens a searchable list instead. Only the first {@link MAX_SHOWN} matches are
 * drawn; past that, the list says how many more there are and asks for a narrower search,
 * which is quicker than scrolling a thousand rows anyway. Arrow keys, Enter and Escape work
 * as in any combobox.
 * </p>
 */
@Component({
  selector: 'app-channel-picker',
  template: `
    <div class="cp">
      <button type="button" class="cp-current" (click)="toggle()"
              aria-haspopup="listbox" [attr.aria-expanded]="open()">
        <span class="cp-ico" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
        </span>
        <span class="cp-text">
          <span class="cp-name">{{ current()?.name ?? 'Default' }}
            @if (current()?.isDefault) { <span class="cp-tag">default</span> }
          </span>
          <span class="cp-meta">{{ summary(current()) }}</span>
        </span>
        <span class="cp-caret" [class.open]="open()">▾</span>
      </button>

      @if (open()) {
        <div class="cp-pop" (keydown)="onKey($event)">
          <input #search class="cp-search" type="search" autocomplete="off"
                 [placeholder]="'Search ' + channels().length + ' channels…'"
                 [value]="query()" (input)="query.set(search.value); active.set(0)" />
          <ul class="cp-list" role="listbox">
            @for (c of visible(); track c.id; let i = $index) {
              <li role="option" [attr.aria-selected]="c.id === selectedId()"
                  [class.active]="i === active()" [class.selected]="c.id === selectedId()"
                  (mouseenter)="active.set(i)" (click)="choose(c)">
                <span class="cp-name">{{ c.name }} @if (c.isDefault) { <span class="cp-tag">default</span> }</span>
                <span class="cp-meta">{{ summary(c) }}</span>
              </li>
            } @empty {
              <li class="cp-empty">No channel matches “{{ query() }}”.</li>
            }
          </ul>
          @if (hidden() > 0) {
            <div class="cp-more">{{ hidden() }} more - type to narrow the list</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; position: relative; min-width: min(260px, 100%); max-width: 100%; z-index: 40; }
    .cp-current {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 8px 12px; border-radius: 10px; cursor: pointer; text-align: left;
      background: linear-gradient(180deg, rgba(25, 31, 48, 0.85), rgba(15, 19, 32, 0.92));
      border: 1px solid rgba(148, 163, 184, 0.16); color: inherit;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.16s ease;
    }
    .cp-current:hover, .cp-current[aria-expanded="true"] {
      border-color: rgba(108, 140, 255, 0.45);
      box-shadow: 0 0 0 3px rgba(108, 140, 255, 0.12), 0 4px 14px rgba(0, 0, 0, 0.3);
      transform: none;
    }
    .cp-ico {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 8px;
      background: rgba(108, 140, 255, 0.14); border: 1px solid rgba(108, 140, 255, 0.28);
      color: #a5b8ff; flex-shrink: 0;
    }
    .cp-text { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 1px; }
    .cp-name { font-weight: 700; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
    .cp-meta { font-size: 0.7rem; color: var(--muted, #8b9bb4); }
    .cp-tag {
      font-size: 0.58rem; text-transform: uppercase; letter-spacing: .06em;
      color: #a5b8ff; background: rgba(108, 140, 255, 0.16);
      border: 1px solid rgba(108, 140, 255, 0.3); border-radius: 999px;
      padding: 1px 6px; margin-left: 4px; font-weight: 700;
    }
    .cp-caret { color: var(--muted, #8b9bb4); transition: transform 0.15s ease; }
    .cp-caret.open { transform: rotate(180deg); color: var(--brand); }
    .cp-pop {
      position: absolute; z-index: 100; top: calc(100% + 6px); left: 0; width: max(100%, 340px);
      background: linear-gradient(180deg, rgba(19, 24, 38, 0.98) 0%, rgba(11, 15, 25, 0.99) 100%);
      border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(16px); padding: 10px;
    }
    .cp-search {
      width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px;
      border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(6, 9, 17, 0.85); color: inherit;
      font-size: 0.82rem;
    }
    .cp-search:focus { outline: none; border-color: var(--brand, #6c8cff); box-shadow: 0 0 0 3px rgba(108, 140, 255, 0.15); }
    .cp-list { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
    .cp-list li { display: flex; flex-direction: column; gap: 2px; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: background 0.12s ease; }
    .cp-list li.active { background: rgba(108, 140, 255, 0.12); }
    .cp-list li.selected { background: rgba(108, 140, 255, 0.16); box-shadow: inset 3px 0 0 var(--brand, #6c8cff); }
    .cp-empty { color: var(--muted, #8b9bb4); font-size: .8rem; cursor: default !important; text-align: center; padding: 14px 8px !important; }
    .cp-more { font-size: .72rem; color: var(--muted, #8b9bb4); padding: 8px 8px 2px; border-top: 1px solid rgba(148, 163, 184, 0.1); margin-top: 4px; }
    @media (max-width: 600px) {
      :host { width: 100%; min-width: 0; }
      .cp-pop { width: 100%; }
      .cp-current { min-width: 0; white-space: normal; }
      .cp-search { font-size: 16px; }
    }
  `],
})
export class ChannelPickerComponent {
  static readonly MAX_SHOWN = 50;

  readonly channels = input<BrandChannel[]>([]);
  readonly selectedId = input<string>(DEFAULT_BRAND_CHANNEL);
  readonly selectedIdChange = output<string>();

  readonly open = signal(false);
  readonly query = signal('');
  readonly active = signal(0);
  readonly summary = channelSummary;

  private readonly host = inject(ElementRef<HTMLElement>);
  @ViewChild('search') searchRef?: ElementRef<HTMLInputElement>;

  readonly current = computed(() =>
    this.channels().find((c) => c.id === this.selectedId()) ?? this.channels().find((c) => c.isDefault) ?? null);

  private readonly matches = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.channels().filter((c) => c.name.toLowerCase().includes(q)) : this.channels();
  });
  readonly visible = computed(() => this.matches().slice(0, ChannelPickerComponent.MAX_SHOWN));
  readonly hidden = computed(() => Math.max(0, this.matches().length - ChannelPickerComponent.MAX_SHOWN));

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.query.set('');
    this.active.set(Math.max(0, this.visible().findIndex((c) => c.id === this.selectedId())));
    this.open.set(true);
    setTimeout(() => this.searchRef?.nativeElement.focus());
  }

  choose(c: BrandChannel): void {
    this.close();
    if (c.id !== this.selectedId()) this.selectedIdChange.emit(c.id);
  }

  onKey(e: KeyboardEvent): void {
    const n = this.visible().length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); this.active.update((i) => (i + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); this.active.update((i) => (i - 1 + n) % n); }
    else if (e.key === 'Enter' && n) { e.preventDefault(); this.choose(this.visible()[this.active()]); }
    else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
  }

  private close(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.close();
  }
}
