import { Component, computed, input } from '@angular/core';

import { endCardLayout, round, scriptLang, type EndCardLine } from './branding.logic';

/**
 * The support card laid out the way the renderer lays it out: lines above the code and below
 * it, centred as one block, sized from the SHORT side of the frame (so the same card reads
 * alike on 16:9 and 9:16), a second-language line smaller and softer under its partner.
 * Text is only estimated to fit; the exact render is the server's.
 */
@Component({
  selector: 'app-brand-endcard-mock',
  template: `
    <div class="em" data-theme="dark">
      <div class="em-frame" [style.--ar]="ratio()" [style.--u]="layout().unit === 'h' ? '1cqh' : '1cqw'"
           [style.background]="background()" [style.color]="foreground()" role="img" [attr.aria-label]="summary()">
        <div class="em-stack" [style.gap]="'calc(' + layout().gapU + ' * var(--u))'">
          @if (above().length) {
            <div class="em-group" [style.gap]="'calc(' + layout().pairGapU + ' * var(--u))'">
              @for (line of above(); track line.role) {
                <div class="em-line" [class.is-secondary]="line.secondary" [attr.lang]="langOf(line.text)"
                     [style.font-size]="'calc(' + line.sizeU + ' * var(--u))'">{{ line.text }}</div>
              }
            </div>
          }
          @if (layout().qrU > 0) {
            <div class="em-qr" [style.width]="'calc(' + layout().qrU + ' * var(--u))'" [style.height]="'calc(' + layout().qrU + ' * var(--u))'"
                 [style.padding]="'calc(' + qrPad() + ' * var(--u))'">
              @if (qrUrl(); as src) { <img [src]="src" alt="" draggable="false" /> }
            </div>
          }
          @if (below().length) {
            <div class="em-group" [style.gap]="'calc(' + layout().pairGapU + ' * var(--u))'">
              @for (line of below(); track line.role) {
                <div class="em-line" [class.is-secondary]="line.secondary" [attr.lang]="langOf(line.text)"
                     [style.font-size]="'calc(' + line.sizeU + ' * var(--u))'">{{ line.text }}</div>
              }
            </div>
          }
        </div>
        @if (empty()) { <span class="em-empty">Add a QR code or a headline</span> }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }
    .em { display: flex; justify-content: center; padding: var(--ws-pad, .85rem); border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg); }
    .em-frame {
      position: relative; flex: none; overflow: hidden; container-type: size; display: grid; place-items: center;
      width: min(100%, calc(var(--ws-max-h, 420px) * var(--ar, 1.7778))); aspect-ratio: var(--ar, 1.7778);
      border-radius: 9px; border: 1px solid rgba(148, 163, 184, .3); box-shadow: 0 12px 32px rgba(0, 0, 0, .5);
    }
    .em-stack { display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 100%; text-align: center; }
    .em-group { display: flex; flex-direction: column; align-items: center; max-width: 100%; }
    .em-line { max-width: 100%; font-weight: 700; line-height: 1.12; white-space: nowrap; font-family: 'Segoe UI', 'Nirmala UI', system-ui, sans-serif; }
    .em-line.is-secondary { font-weight: 600; opacity: .85; }
    .em-qr { flex: none; box-sizing: border-box; background: #fff; border-radius: 2px; }
    .em-qr img { display: block; width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
    .em-empty { position: absolute; font: 600 .74rem/1 system-ui, sans-serif; opacity: .6; }
  `],
})
export class BrandEndCardMockComponent {
  readonly headline = input('');
  readonly headlineSecondary = input('');
  readonly subtext = input('');
  readonly subtextSecondary = input('');
  readonly background = input('#101828');
  readonly foreground = input('#ffffff');
  readonly qrUrl = input<string | null>(null);
  readonly width = input(1920);
  readonly height = input(1080);

  protected readonly ratio = computed(() => round(this.width() / this.height(), 4));
  protected readonly layout = computed(() => endCardLayout({
    headline: this.headline(), headlineSecondary: this.headlineSecondary(),
    subtext: this.subtext(), subtextSecondary: this.subtextSecondary(),
  }, !!this.qrUrl(), this.width(), this.height()));
  protected readonly above = computed<readonly EndCardLine[]>(() => this.layout().lines.filter((l) => l.above));
  protected readonly below = computed<readonly EndCardLine[]>(() => this.layout().lines.filter((l) => !l.above));
  /** The white square includes a quiet zone of 7% of its side. */
  protected readonly qrPad = computed(() => round(this.layout().qrU * 0.07, 2));
  protected readonly empty = computed(() => this.layout().lines.length === 0 && this.layout().qrU === 0);
  protected readonly summary = computed(() =>
    `End card layout: ${this.layout().lines.map((l) => l.text).join(', ') || 'empty'}${this.layout().qrU ? ', with a QR code' : ''}`);

  protected langOf(text: string): string | null {
    return scriptLang(text);
  }
}
