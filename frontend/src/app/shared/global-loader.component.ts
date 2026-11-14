import { Component, inject } from '@angular/core';

import { LoadingService } from '../core/services/loading.service';

/**
 * Top studio progress indicator + delayed cold-start backend wakeup banner.
 * Uses Obsidian Studio CSS tokens so it adapts seamlessly between dark & light themes.
 */
@Component({
  selector: 'app-global-loader',
  standalone: true,
  template: `
    @if (loading.active()) {
      <div class="agl-bar" role="progressbar" aria-label="Loading studio data">
        <div class="agl-bar-track"></div>
      </div>
    }

    @if (loading.slow()) {
      <aside class="agl-wakeup" role="status" aria-live="polite">
        <span class="btn-spin agl-spin" aria-hidden="true"></span>
        <div class="agl-copy">
          <strong>Waking up AnimStudio AI… ({{ loading.elapsedSec() }}s)</strong>
          <span>
            @if (loading.navigating() && !loading.httpActive()) {
              Loading studio workspace view…
            } @else {
              Starting backend &amp; media services — first load after idle can take up to 30–50s.
            }
          </span>
        </div>
        <button type="button" class="agl-dismiss secondary small" (click)="loading.dismissSlow()">
          Dismiss
        </button>
      </aside>
    }
  `,
  styles: [`
    .agl-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 9999;
      pointer-events: none;
      overflow: hidden;
      background: color-mix(in srgb, var(--brand) 16%, transparent);
    }

    .agl-bar-track {
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, transparent, var(--brand-bright), var(--accent, #a78bfa), transparent);
      animation: aglSlide 1.15s cubic-bezier(.4, 0, .2, 1) infinite;
    }

    @keyframes aglSlide {
      0%   { transform: translateX(-110%); }
      100% { transform: translateX(350%); }
    }

    .agl-wakeup {
      position: fixed;
      top: 4.3rem;
      right: 1rem;
      z-index: 9990;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      max-width: min(28rem, calc(100vw - 2rem));
      padding: 0.75rem 0.95rem;
      border-radius: var(--radius-lg, 14px);
      background: color-mix(in srgb, var(--surface-2) 92%, transparent);
      backdrop-filter: blur(18px);
      border: 1px solid color-mix(in srgb, var(--brand) 40%, var(--border-bright));
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
      color: var(--text);
      font-size: 0.82rem;
      animation: aglFadeIn 0.2s ease-out;
    }

    @keyframes aglFadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .agl-spin {
      width: 1rem;
      height: 1rem;
      color: var(--brand-bright);
    }

    .agl-copy {
      display: flex;
      flex-direction: column;
      gap: 0.14rem;
      min-width: 0;
      flex: 1 1 auto;
    }

    .agl-copy strong {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text);
    }

    .agl-copy span {
      font-size: 0.75rem;
      color: var(--muted);
      line-height: 1.35;
    }

    .agl-dismiss {
      flex-shrink: 0;
    }

    @media (max-width: 640px) {
      .agl-wakeup {
        left: 0.75rem;
        right: 0.75rem;
        top: 3.9rem;
      }
    }
  `],
})
export class GlobalLoaderComponent {
  readonly loading = inject(LoadingService);
}
