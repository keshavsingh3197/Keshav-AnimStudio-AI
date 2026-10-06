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
        <span class="cp-ico">📺</span>
        <span class="cp-text">
          <span class="cp-name">{{ current()?.name ?? 'Default' }}
            @if (current()?.isDefault) { <span class="cp-tag">default</span> }
          </span>
          <span class="cp-meta">{{ summary(current()) }}</span>
        </span>
        <span class="cp-caret">▾</span>
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
    :host { display: inline-block; position: relative; min-width: 260px; }
    .cp-current {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 7px 12px; border-radius: 8px; cursor: pointer; text-align: left;
      background: var(--surface-2, #141721); border: 1px solid var(--border, #1e2433); color: inherit;
    }
    .cp-current:hover, .cp-current[aria-expanded="true"] { border-color: var(--brand, #6c8cff); }
    .cp-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .cp-name { font-weight: 600; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cp-meta { font-size: 0.7rem; color: var(--muted, #8b9bb4); }
    .cp-tag { font-size: 0.6rem; text-transform: uppercase; letter-spacing: .06em; color: var(--brand, #6c8cff); margin-left: 4px; }
    .cp-caret { color: var(--muted, #8b9bb4); }
    .cp-pop {
      position: absolute; z-index: 50; top: calc(100% + 4px); left: 0; width: max(100%, 340px);
      background: var(--surface, #0f1422); border: 1px solid var(--border, #1e2433); border-radius: 10px;
      box-shadow: 0 12px 32px rgba(0,0,0,.55); padding: 8px;
    }
    .cp-search {
      width: 100%; box-sizing: border-box; padding: 7px 10px; border-radius: 7px; margin-bottom: 6px;
      border: 1px solid var(--border, #1e2433); background: var(--bg, #0b0f19); color: inherit;
    }
    .cp-search:focus { outline: none; border-color: var(--brand, #6c8cff); }
    .cp-list { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; }
    .cp-list li { display: flex; flex-direction: column; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
    .cp-list li.active { background: color-mix(in srgb, #fff 6%, transparent); }
    .cp-list li.selected { box-shadow: inset 2px 0 0 var(--brand, #6c8cff); }
    .cp-empty { color: var(--muted, #8b9bb4); font-size: .8rem; cursor: default !important; }
    .cp-more { font-size: .72rem; color: var(--muted, #8b9bb4); padding: 6px 8px 2px; }
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
