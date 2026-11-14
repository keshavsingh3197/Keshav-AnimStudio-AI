import { Component, computed, input } from '@angular/core';

export type LoadingStateMode = 'cards' | 'list' | 'table' | 'inline';

/**
 * Reusable Obsidian Studio skeleton / inline busy state so views never flash empty boxes
 * or bare "Loading..." text while fetching backend data.
 */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="als-wrap" [class.als-compact]="compact()" role="status" aria-live="polite">
      @if (title() || subtitle()) {
        <div class="als-head">
          <span class="btn-spin als-head-spin" aria-hidden="true"></span>
          <div class="als-head-copy">
            @if (title()) {
              <strong>{{ title() }}</strong>
            }
            @if (subtitle()) {
              <span>{{ subtitle() }}</span>
            }
          </div>
        </div>
      }

      @if (mode() === 'cards') {
        <div class="als-cards">
          @for (item of items(); track item) {
            <div class="als-card">
              <div class="als-thumb anim-shimmer"></div>
              <div class="als-card-body">
                <div class="als-line als-w-70 anim-shimmer"></div>
                <div class="als-line als-w-45 anim-shimmer"></div>
                <div class="als-line als-w-85 anim-shimmer"></div>
              </div>
            </div>
          }
        </div>
      } @else if (mode() === 'table') {
        <div class="als-table">
          @for (item of items(); track item) {
            <div class="als-row">
              <div class="als-line als-w-35 anim-shimmer"></div>
              <div class="als-line als-w-25 anim-shimmer"></div>
              <div class="als-line als-w-20 anim-shimmer"></div>
              <div class="als-line als-w-15 anim-shimmer"></div>
            </div>
          }
        </div>
      } @else if (mode() === 'list') {
        <div class="als-list">
          @for (item of items(); track item) {
            <div class="als-list-item">
              <div class="als-avatar anim-shimmer"></div>
              <div class="als-list-copy">
                <div class="als-line als-w-60 anim-shimmer"></div>
                <div class="als-line als-w-40 anim-shimmer"></div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .als-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      padding: 1.1rem;
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
    }

    .als-wrap.als-compact {
      padding: 0.75rem 0.9rem;
      gap: 0.6rem;
    }

    .als-head {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .als-head-spin {
      width: 0.95rem;
      height: 0.95rem;
      color: var(--brand-bright);
    }

    .als-head-copy {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      font-size: 0.84rem;
    }

    .als-head-copy strong {
      color: var(--text);
      font-weight: 700;
    }

    .als-head-copy span {
      color: var(--muted);
      font-size: 0.76rem;
    }

    .als-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      gap: 0.85rem;
    }

    .als-card {
      border-radius: var(--radius, 10px);
      border: 1px solid var(--border);
      background: var(--surface-2);
      overflow: hidden;
    }

    .als-thumb {
      height: 7.5rem;
      width: 100%;
    }

    .als-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      padding: 0.75rem;
    }

    .als-table,
    .als-list {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .als-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.65rem;
      border-radius: var(--radius, 8px);
      background: var(--surface-2);
    }

    .als-list-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.65rem;
      border-radius: var(--radius, 8px);
      background: var(--surface-2);
    }

    .als-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .als-list-copy {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .als-line {
      height: 0.72rem;
      border-radius: 6px;
    }

    .als-w-15 { width: 15%; }
    .als-w-20 { width: 20%; }
    .als-w-25 { width: 25%; }
    .als-w-35 { width: 35%; }
    .als-w-40 { width: 40%; }
    .als-w-45 { width: 45%; }
    .als-w-60 { width: 60%; }
    .als-w-70 { width: 70%; }
    .als-w-85 { width: 85%; }
  `],
})
export class LoadingStateComponent {
  readonly mode = input<LoadingStateMode>('cards');
  readonly count = input(3);
  readonly title = input<string>('Loading…');
  readonly subtitle = input<string | null>(null);
  readonly compact = input(false);

  readonly items = computed(() =>
    Array.from({ length: Math.max(1, Math.min(8, this.count())) }, (_, idx) => idx));
}
