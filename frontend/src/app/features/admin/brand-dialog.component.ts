import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, inject, input, output, viewChild } from '@angular/core';

let nextId = 0;

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * A modal for the Branding page: traps Tab, closes on Escape or a click outside, and hands
 * focus back to whatever opened it. Put the body in the default slot and the buttons in
 * `<div bdActions>`; mark the button that should take focus first with `data-autofocus`.
 */
@Component({
  selector: 'app-brand-dialog',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
  template: `
    <div class="bd-backdrop" (mousedown)="onBackdrop($event)">
      <div #panel class="bd-panel" role="dialog" aria-modal="true" tabindex="-1"
           [attr.aria-labelledby]="uid + '-title'" [attr.aria-describedby]="uid + '-body'" (keydown)="onKeydown($event)">
        <header class="bd-head">
          <span class="bd-ico" [attr.data-tone]="tone()" aria-hidden="true">
            @if (tone() === 'danger') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            } @else if (tone() === 'warn') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            }
          </span>
          <h2 class="bd-title" [id]="uid + '-title'">{{ title() }}</h2>
          <button type="button" class="bd-x" aria-label="Close dialog" [disabled]="busy()" (click)="dismissed.emit()">&#10005;</button>
        </header>
        <div class="bd-body" [id]="uid + '-body'"><ng-content /></div>
        <footer class="bd-foot"><ng-content select="[bdActions]" /></footer>
      </div>
    </div>
  `,
  styles: [`
    .bd-backdrop {
      position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;
      background: var(--scrim); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: bd-fade .14s ease;
    }
    .bd-panel {
      display: flex; flex-direction: column; width: min(620px, 100%); max-height: calc(100dvh - 2rem);
      color: var(--text); background: var(--surface); border: 1px solid var(--border-bright); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg), var(--inner-highlight); animation: bd-pop .16s cubic-bezier(.16, 1, .3, 1);
    }
    .bd-panel:focus { outline: none; }
    .bd-head { display: flex; align-items: center; gap: .7rem; padding: 1rem 1.15rem .8rem; border-bottom: 1px solid var(--border); }
    .bd-ico { display: inline-grid; place-items: center; width: 2.1rem; height: 2.1rem; flex: none; border-radius: 9px; color: var(--brand-bright); background: var(--brand-subtle); border: 1px solid color-mix(in srgb, var(--brand) 35%, transparent); }
    .bd-ico[data-tone='warn'] { color: var(--warn); background: var(--warn-dim); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
    .bd-ico[data-tone='danger'] { color: var(--err); background: var(--err-dim); border-color: color-mix(in srgb, var(--err) 40%, transparent); }
    .bd-title { flex: 1; margin: 0; font-size: 1.08rem; font-weight: 800; letter-spacing: -.01em; }
    .bd-x { padding: .2rem .55rem; font-size: .9rem; color: var(--muted); background: transparent; border: 1px solid transparent; box-shadow: none; }
    .bd-x:hover:not(:disabled) { color: var(--text); background: var(--ov-2); border-color: var(--border); box-shadow: none; transform: none; }
    .bd-body { padding: 1rem 1.15rem; overflow-y: auto; font-size: .9rem; line-height: 1.55; color: var(--text-dim); }
    .bd-foot { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .55rem; padding: .8rem 1.15rem 1rem; border-top: 1px solid var(--border); }
    .bd-foot:empty { display: none; }
    @keyframes bd-fade { from { opacity: 0; } }
    @keyframes bd-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } }
    @media (prefers-reduced-motion: reduce) { .bd-backdrop, .bd-panel { animation: none; } }
  `],
})
export class BrandDialogComponent implements AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly tone = input<'neutral' | 'warn' | 'danger'>('neutral');
  /** While true the dialog cannot be dismissed (a save or a bulk update is running). */
  readonly busy = input(false);
  readonly dismissed = output<void>();

  protected readonly uid = `br-dialog-${++nextId}`;
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly document = inject(DOCUMENT);
  private readonly opener = this.document.activeElement as HTMLElement | null;

  ngAfterViewInit(): void {
    const panel = this.panel().nativeElement;
    (panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel).focus();
  }

  ngOnDestroy(): void {
    if (this.opener?.isConnected) this.opener.focus();
  }

  onEscape(event: Event): void {
    if (this.busy()) return;
    event.preventDefault();
    this.dismissed.emit();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.busy()) this.dismissed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panel().nativeElement;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
