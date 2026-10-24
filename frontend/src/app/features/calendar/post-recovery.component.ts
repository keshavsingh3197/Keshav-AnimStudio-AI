import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { ContentPlanItem, ContentRecovery, STATUS_LABELS } from '../../core/models/calendar.models';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { errorText, fromLocalInput, toLocalInput } from './calendar-helpers';

/**
 * What to do with a post that won't be ready in time (or already missed its time): trade days
 * with a later post that is ready, move it to the topic's next free day, pick another time,
 * or skip it. A linked video's YouTube schedule follows the move on the server.
 */
@Component({
  selector: 'app-post-recovery',
  imports: [DatePipe, FormsModule],
  template: `
    <div class="recovery" [class.missed]="missed()">
      <p class="rec-head">
        <strong>{{ missed() ? 'This post missed its time.' : 'Running late?' }}</strong>
        <span class="muted small">{{ missed() ? 'Give it a new day, or skip it.' : 'Keep the channel on schedule:' }}</span>
      </p>
      @if (loading()) {
        <p class="muted small">Looking at the calendar…</p>
      } @else if (options(); as o) {
        <div class="rec-options">
          @for (p of o.swapWith; track p.id) {
            <button type="button" class="rec-option" (click)="swap(p)" [disabled]="busy()">
              <span class="rec-title">⇄ Publish “{{ p.title }}” instead</span>
              <span class="muted small">
                it is {{ statusLabels[p.status].toLowerCase() }}; this one moves to {{ p.publishAt | date: 'EEE d MMM, HH:mm' }}
              </span>
            </button>
          }
          @if (o.nextFreeAt) {
            <button type="button" class="rec-option" (click)="postpone()" [disabled]="busy()">
              <span class="rec-title">→ Move to {{ o.nextFreeAt | date: 'EEE d MMM, HH:mm' }}</span>
              <span class="muted small">the next day this topic has free</span>
            </button>
          }
          <div class="rec-option rec-pick">
            <span class="rec-title">🕑 Pick another time</span>
            <span class="inline">
              <input type="datetime-local" [(ngModel)]="customAt" aria-label="New go-live time" />
              <button type="button" class="secondary small" (click)="postponeTo()" [disabled]="busy() || !customAt">Move</button>
            </span>
          </div>
          <button type="button" class="rec-option" (click)="skip()" [disabled]="busy()">
            <span class="rec-title">⤼ Skip this one</span>
            <span class="muted small">the day stays empty and the planner won't refill it</span>
          </button>
        </div>
      }
      @if (error()) { <p class="cal-error small" role="alert">{{ error() }}</p> }
    </div>
  `,
  styles: `
    .recovery { display: grid; gap: 0.5rem; padding: 0.7rem; border-radius: var(--radius-sm);
      border: 1px solid color-mix(in srgb, var(--warn) 45%, var(--border)); background: color-mix(in srgb, var(--warn) 7%, var(--surface)); }
    .recovery.missed { border-color: color-mix(in srgb, var(--err) 55%, var(--border)); background: color-mix(in srgb, var(--err) 7%, var(--surface)); }
    .rec-head { margin: 0; display: flex; flex-wrap: wrap; gap: 0.2rem 0.6rem; align-items: baseline; }
    .rec-options { display: grid; gap: 0.4rem; }
    .rec-option { display: grid; gap: 0.1rem; text-align: left; padding: 0.5rem 0.65rem; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface-2); color: var(--text); }
    button.rec-option:hover:not(:disabled) { border-color: var(--brand); transform: none; background: var(--surface-3); }
    .rec-title { font-weight: 600; font-size: 0.88rem; }
    .rec-pick .inline { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }
    .rec-pick input { flex: 1; min-width: 12rem; }
    .cal-error { color: var(--err); background: var(--err-dim); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); margin: 0; }
  `,
})
export class PostRecoveryComponent implements OnInit {
  private readonly api = inject(ContentCalendarService);

  readonly item = input.required<ContentPlanItem>();
  /** Every post the action changed (two for a swap). */
  readonly changed = output<ContentPlanItem[]>();

  readonly statusLabels = STATUS_LABELS;
  readonly options = signal<ContentRecovery | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly missed = computed(() => new Date(this.item().publishAt).getTime() <= Date.now());

  customAt = '';

  ngOnInit(): void {
    const tomorrow = new Date(Math.max(Date.now(), new Date(this.item().publishAt).getTime()) + 86_400_000);
    this.customAt = toLocalInput(tomorrow.toISOString());
    this.api.recovery(this.item().id).subscribe({
      next: (o) => {
        this.options.set(o);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.options.set({ nextFreeAt: null, swapWith: [] });
        this.loading.set(false);
        this.error.set(errorText(err, 'The options could not be loaded.'));
      },
    });
  }

  swap(other: ContentPlanItem): void {
    this.run(this.api.swap(this.item().id, other.id), (list) => list);
  }

  postpone(): void {
    this.run(this.api.postpone(this.item().id), (saved) => [saved]);
  }

  postponeTo(): void {
    const at = fromLocalInput(this.customAt);
    if (!at) return this.error.set('Pick the new date and time.');
    this.run(this.api.postpone(this.item().id, at), (saved) => [saved]);
  }

  skip(): void {
    this.run(this.api.setStatus(this.item().id, 'Skipped'), (saved) => [saved]);
  }

  private run<T>(request: Observable<T>, toList: (value: T) => ContentPlanItem[]): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: (value) => {
        this.busy.set(false);
        this.changed.emit(toList(value));
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorText(err, 'That didn’t work. Try again.'));
      },
    });
  }
}

/** A post that is still being worked on and is late, nearly due, or past its time. */
export function needsRecovery(item: ContentPlanItem): boolean {
  if (item.status !== 'Idea' && item.status !== 'InProgress') return false;
  return item.attention.some((a) => a.code === 'missed' || a.code === 'prep-late' || a.code === 'prep-soon');
}
