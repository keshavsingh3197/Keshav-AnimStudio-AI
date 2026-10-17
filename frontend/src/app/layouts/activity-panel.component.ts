import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ActivityItem, ActivityKind, ActivityService } from '../core/services/activity.service';

const KIND_ICON: Record<ActivityKind, string> = {
  export: '🎞️',
  render: '🎬',
  youtube: '▶️',
  upload: '⬆️',
  download: '⬇️',
  drive: '☁️',
};

/**
 * The corner panel listing everything in progress, in the manner of a cloud drive's upload
 * box: a header with the counts that folds the list away, and a row per task with its own
 * progress. It shows itself when new work starts and can be closed once nothing is running;
 * the top-bar chip ({@link toggle}) brings it back.
 */
@Component({
  selector: 'app-activity-panel',
  imports: [RouterLink],
  template: `
    @if (open() && activity.items().length > 0) {
      <section class="ap" role="region" aria-label="Background activity">
        <header class="ap-head">
          <button type="button" class="ap-title" (click)="expanded.set(!expanded())"
                  [attr.aria-expanded]="expanded()">
            @if (activity.running().length > 0) {
              <span class="ap-spinner" aria-hidden="true"></span>
            }
            <span>{{ headline() }}</span>
          </button>
          <button type="button" class="ap-icon" (click)="expanded.set(!expanded())"
                  [attr.aria-label]="expanded() ? 'Collapse' : 'Expand'"
                  [title]="expanded() ? 'Collapse' : 'Expand'">
            <span class="ap-chevron" [class.up]="!expanded()">▾</span>
          </button>
          <button type="button" class="ap-icon" (click)="close()"
                  [disabled]="activity.running().length > 0"
                  [title]="activity.running().length > 0 ? 'Still working - collapse instead' : 'Close'"
                  aria-label="Close">✕</button>
        </header>

        @if (expanded()) {
          <ul class="ap-list">
            @for (item of activity.items(); track item.id) {
              <li [class]="'ap-row is-' + item.state">
                <span class="ap-kind" aria-hidden="true">{{ icon(item) }}</span>
                <div class="ap-body">
                  <div class="ap-line">
                    @if (item.link) {
                      <a class="ap-name" [routerLink]="item.link" [title]="item.title">{{ item.title }}</a>
                    } @else {
                      <span class="ap-name" [title]="item.title">{{ item.title }}</span>
                    }
                    <span class="ap-state">{{ stateLabel(item) }}</span>
                  </div>
                  @if (item.detail) {
                    <div class="ap-detail" [title]="item.detail">{{ item.detail }}</div>
                  }
                  @if (item.state === 'running') {
                    <div class="ap-bar" [class.indeterminate]="item.percent === null">
                      <span [style.width.%]="item.percent ?? 35"></span>
                    </div>
                  }
                </div>
                <div class="ap-actions">
                  @if (item.externalUrl && item.state !== 'running') {
                    <a class="ap-icon" [href]="item.externalUrl" target="_blank" rel="noopener noreferrer"
                       title="Open" aria-label="Open">↗</a>
                  }
                  @if (item.state !== 'running') {
                    <button type="button" class="ap-icon" (click)="activity.dismiss(item.id)"
                            title="Remove from list" aria-label="Remove from list">✕</button>
                  }
                </div>
              </li>
            }
          </ul>
          @if (activity.finished().length > 0) {
            <footer class="ap-foot">
              <button type="button" class="link" (click)="activity.clearFinished()">Clear finished</button>
            </footer>
          }
        }
      </section>
    }
  `,
  styles: [`
    .ap {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 1200;
      width: min(360px, calc(100vw - 2rem));
      background: var(--surface);
      border: 1px solid var(--border-bright, var(--border));
      border-radius: var(--radius, 10px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, .45);
      overflow: hidden;
      font-size: .85rem;
    }

    .ap-head {
      display: flex;
      align-items: center;
      gap: .25rem;
      padding: .45rem .5rem .45rem .75rem;
      background: var(--surface-2);
    }

    .ap-title {
      flex: 1 1 auto;
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      min-width: 0;
      background: none;
      border: 0;
      padding: .2rem 0;
      color: var(--text);
      font: inherit;
      font-weight: 700;
      text-align: left;
      cursor: pointer;
    }

    .ap-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      flex: 0 0 auto;
      background: none;
      border: 0;
      border-radius: 50%;
      color: var(--muted);
      font-size: .85rem;
      text-decoration: none;
      cursor: pointer;
    }

    .ap-icon:hover:not(:disabled) {
      background: color-mix(in srgb, var(--text) 10%, transparent);
      color: var(--text);
    }

    .ap-icon:disabled {
      opacity: .35;
      cursor: not-allowed;
    }

    .ap-chevron {
      display: inline-block;
      transition: transform .15s ease;
    }

    .ap-chevron.up {
      transform: rotate(180deg);
    }

    .ap-spinner {
      width: .85rem;
      height: .85rem;
      flex: 0 0 auto;
      border: 2px solid color-mix(in srgb, var(--brand) 30%, transparent);
      border-top-color: var(--brand);
      border-radius: 50%;
      animation: apSpin .8s linear infinite;
    }

    .ap-list {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: min(50vh, 360px);
      overflow-y: auto;
    }

    .ap-row {
      display: flex;
      align-items: flex-start;
      gap: .6rem;
      padding: .55rem .5rem .55rem .75rem;
      border-top: 1px solid var(--border);
    }

    .ap-kind {
      flex: 0 0 auto;
      line-height: 1.4;
    }

    .ap-body {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ap-line {
      display: flex;
      align-items: baseline;
      gap: .5rem;
    }

    .ap-name {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--text);
      font-weight: 600;
      text-decoration: none;
    }

    a.ap-name:hover {
      text-decoration: underline;
    }

    .ap-state {
      flex: 0 0 auto;
      color: var(--muted);
      font-size: .75rem;
      font-variant-numeric: tabular-nums;
    }

    .is-done .ap-state { color: var(--ok); }
    .is-warning .ap-state { color: var(--warn); }
    .is-failed .ap-state { color: var(--err); }

    .ap-detail {
      margin-top: .1rem;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--muted);
      font-size: .75rem;
    }

    .is-failed .ap-detail { color: var(--err); }

    .ap-bar {
      position: relative;
      height: 4px;
      margin-top: .4rem;
      border-radius: 99px;
      background: color-mix(in srgb, var(--brand) 18%, transparent);
      overflow: hidden;
    }

    .ap-bar > span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--brand);
      transition: width .4s ease;
    }

    .ap-bar.indeterminate > span {
      position: absolute;
      animation: apSlide 1.3s ease-in-out infinite;
    }

    .ap-actions {
      display: flex;
      flex: 0 0 auto;
    }

    .ap-foot {
      display: flex;
      justify-content: flex-end;
      padding: .35rem .75rem;
      border-top: 1px solid var(--border);
      font-size: .78rem;
    }

    @keyframes apSpin {
      to { transform: rotate(360deg); }
    }

    @keyframes apSlide {
      0% { left: -35%; }
      100% { left: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ap-spinner, .ap-bar.indeterminate > span { animation: none; }
    }
  `],
})
export class ActivityPanelComponent {
  readonly activity = inject(ActivityService);

  readonly open = signal(true);
  readonly expanded = signal(true);

  readonly headline = computed(() => {
    const running = this.activity.running().length;
    const finished = this.activity.finished();
    if (running > 0) return `${running} ${running === 1 ? 'task' : 'tasks'} in progress`;
    const failed = finished.filter((i) => i.state === 'failed').length;
    if (failed > 0) return `${failed} failed, ${finished.length - failed} finished`;
    return `${finished.length} ${finished.length === 1 ? 'task' : 'tasks'} finished`;
  });

  constructor() {
    // New work brings the panel back, as a drive's upload box does - but a panel the user
    // folded stays folded; only the count in its header changes.
    let known = new Set<string>();
    effect(() => {
      const ids = this.activity.items().map((i) => i.id);
      const arrived = ids.some((id) => !known.has(id));
      known = new Set(ids);
      if (arrived) untracked(() => this.open.set(true));
    });
  }

  /** The top-bar chip: show the panel (unfolded), or hide it if it is already showing. */
  toggle(): void {
    if (this.open() && this.expanded()) {
      this.expanded.set(false);
      return;
    }
    this.open.set(true);
    this.expanded.set(true);
  }

  close(): void {
    if (this.activity.running().length > 0) return;
    this.open.set(false);
  }

  icon(item: ActivityItem): string {
    return KIND_ICON[item.kind];
  }

  stateLabel(item: ActivityItem): string {
    switch (item.state) {
      case 'running': return item.percent === null ? 'Working…' : `${item.percent}%`;
      case 'done': return 'Done';
      case 'warning': return 'Done with notes';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
    }
  }
}
