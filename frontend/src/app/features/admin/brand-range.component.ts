import { Component, computed, input, output, signal } from '@angular/core';

import { clamp, round } from './branding.logic';

let nextId = 0;

function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf('.');
  return dot < 0 ? 0 : text.length - dot - 1;
}

/**
 * A slider and a number field for one value, kept in step. The slider covers the usual
 * range; the number field may allow more (`inputMin` / `inputMax`). A value typed outside the
 * allowed range is flagged while typing and clamped when the field is left.
 */
@Component({
  selector: 'app-brand-range',
  template: `
    <div class="rg" [class.is-invalid]="invalid()" [class.is-disabled]="disabled()">
      <div class="rg-head">
        <label class="rg-label" [for]="uid + '-r'">{{ label() }}</label>
        <span class="rg-field">
          <input class="rg-num" type="number" inputmode="decimal" [id]="uid + '-n'"
                 [attr.aria-label]="label() + ' value' + (unit() ? ' in ' + unitName() : '')"
                 [attr.aria-invalid]="invalid()" [attr.aria-describedby]="invalid() ? uid + '-e' : null"
                 [min]="lo()" [max]="hi()" [step]="step()" [disabled]="disabled()" [value]="field()"
                 (focus)="onFocus()" (input)="onNumberInput($event)" (change)="onNumberCommit($event)" (blur)="onNumberCommit($event)" />
          @if (unit()) { <span class="rg-unit" aria-hidden="true">{{ unit() }}</span> }
        </span>
      </div>
      <input class="rg-slider" type="range" [id]="uid + '-r'" [min]="min()" [max]="max()" [step]="step()"
             [disabled]="disabled()" [value]="sliderValue()" [style.--fill]="fill() + '%'"
             [attr.aria-valuetext]="display() + (unit() ? ' ' + unitName() : '')"
             [attr.aria-describedby]="hint() ? uid + '-h' : null"
             (input)="onSlider($event)" />
      <div class="rg-scale" aria-hidden="true"><span>{{ min() }}{{ unit() }}</span><span>{{ max() }}{{ unit() }}</span></div>
      @if (invalid()) {
        <p class="rg-error" [id]="uid + '-e'" role="alert">Use a value from {{ lo() }} to {{ hi() }}{{ unit() }}.</p>
      }
      @if (hint()) { <p class="rg-hint" [id]="uid + '-h'">{{ hint() }}</p> }
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .rg-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
    .rg-label { margin: 0; font-size: .86rem; font-weight: 700; color: var(--text); }
    .rg-field {
      display: inline-flex; align-items: center; gap: .25rem; padding: 0 .55rem; height: 2rem;
      border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface-2);
      transition: border-color .15s ease, box-shadow .15s ease;
    }
    .rg-field:hover { border-color: var(--border-bright); }
    .rg-field:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }
    .rg.is-invalid .rg-field { border-color: var(--err); box-shadow: 0 0 0 3px var(--err-dim); }
    .rg-num {
      width: 4.1rem; min-width: 0; padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none;
      text-align: right; font: inherit; font-weight: 700; font-size: .88rem; font-variant-numeric: tabular-nums; color: var(--text);
    }
    .rg-num:focus { outline: none; box-shadow: none; border: 0; background: transparent; }
    .rg-unit { font-size: .78rem; font-weight: 700; color: var(--muted); }
    .rg-slider {
      -webkit-appearance: none; appearance: none; display: block; width: 100%; height: 6px; margin: .8rem 0 .3rem; padding: 0;
      border: 0; border-radius: 99px; cursor: pointer; outline: none;
      background: linear-gradient(to right, var(--brand) 0, var(--brand) var(--fill, 0%), var(--ov-4) var(--fill, 0%), var(--ov-4) 100%);
    }
    .rg-slider::-webkit-slider-runnable-track { height: 6px; background: transparent; border-radius: 99px; }
    .rg-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px; margin-top: -6px; border-radius: 50%;
      background: #fff; border: 2px solid var(--brand); box-shadow: 0 1px 5px rgba(0, 0, 0, .4); transition: box-shadow .12s ease, transform .12s ease;
    }
    .rg-slider::-moz-range-track { height: 6px; background: transparent; border-radius: 99px; }
    .rg-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid var(--brand); box-shadow: 0 1px 5px rgba(0, 0, 0, .4); }
    .rg-slider:hover::-webkit-slider-thumb { transform: scale(1.12); }
    .rg-slider:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 5px var(--brand-glow), 0 1px 5px rgba(0, 0, 0, .4); }
    .rg-slider:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 5px var(--brand-glow); }
    .rg-slider:disabled { cursor: not-allowed; opacity: .5; }
    .rg-scale { display: flex; justify-content: space-between; font-size: .7rem; color: var(--muted); font-variant-numeric: tabular-nums; }
    .rg-hint { margin: .35rem 0 0; font-size: .8rem; line-height: 1.45; color: var(--muted); }
    .rg-error { margin: .3rem 0 0; font-size: .8rem; font-weight: 600; color: var(--c-red); }
    @media (prefers-reduced-motion: reduce) { .rg-slider::-webkit-slider-thumb { transition: none; } }
  `],
})
export class BrandRangeComponent {
  readonly label = input.required<string>();
  /** Shown after the number: "%", "s". */
  readonly unit = input('');
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1);
  readonly value = input.required<number>();
  /** The number field may allow more than the slider does. */
  readonly inputMin = input<number | null>(null);
  readonly inputMax = input<number | null>(null);
  readonly hint = input('');
  readonly disabled = input(false);
  readonly valueChange = output<number>();

  protected readonly uid = `br-range-${++nextId}`;
  private readonly editing = signal(false);
  private readonly typed = signal('');

  protected readonly lo = computed(() => this.inputMin() ?? this.min());
  protected readonly hi = computed(() => this.inputMax() ?? this.max());
  private readonly decimals = computed(() => decimalsOf(this.step()));
  protected readonly display = computed(() => String(round(this.value(), this.decimals())));
  protected readonly field = computed(() => (this.editing() ? this.typed() : this.display()));
  protected readonly sliderValue = computed(() => clamp(this.value(), this.min(), this.max()));
  protected readonly fill = computed(() => {
    const span = this.max() - this.min();
    return span <= 0 ? 0 : round(((this.sliderValue() - this.min()) / span) * 100, 2);
  });
  protected readonly unitName = computed(() => (this.unit() === '%' ? 'percent' : this.unit() === 's' ? 'seconds' : this.unit()));
  protected readonly invalid = computed(() => {
    if (!this.editing()) return false;
    const raw = this.typed().trim();
    if (raw === '') return false;
    const n = Number(raw);
    return !Number.isFinite(n) || n < this.lo() || n > this.hi();
  });

  protected onSlider(event: Event): void {
    this.valueChange.emit(round(Number((event.target as HTMLInputElement).value), this.decimals()));
  }

  protected onFocus(): void {
    this.typed.set(this.display());
    this.editing.set(true);
  }

  protected onNumberInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.typed.set(raw);
    const n = Number(raw);
    // Live while typing, but only for values the field accepts; the rest wait for the commit.
    if (raw.trim() !== '' && Number.isFinite(n) && n >= this.lo() && n <= this.hi()) {
      this.valueChange.emit(round(n, this.decimals()));
    }
  }

  protected onNumberCommit(event: Event): void {
    const el = event.target as HTMLInputElement;
    const n = Number(el.value);
    this.editing.set(false);
    if (el.value.trim() === '' || !Number.isFinite(n)) {
      el.value = this.display();
      return;
    }
    const next = round(clamp(n, this.lo(), this.hi()), this.decimals());
    if (next !== this.value()) this.valueChange.emit(next);
    el.value = String(next);
  }
}
