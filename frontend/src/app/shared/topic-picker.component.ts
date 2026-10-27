import { Component, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ContentTopic, ContentTopicRequest } from '../core/models/calendar.models';
import { ContentCalendarService } from '../core/services/content-calendar.service';

const NEW = '__new';

/**
 * Picks one of the shared topics (the content calendar's own list) - or none - and can make
 * a new one on the spot. Used wherever a short is created, uploaded or filed, so a topic is
 * always the same thing: one list for the calendar and the Drive library.
 */
@Component({
  selector: 'app-topic-picker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="tp">
      @if (label()) { <label class="tp-label">{{ label() }}</label> }
      <div class="tp-row">
        <span class="tp-dot" [style.background]="dot()"></span>
        <select class="tp-select" [ngModel]="adding() ? NEW : (value() ?? '')" (ngModelChange)="pick($event)" [disabled]="disabled()">
          <option value="">{{ emptyLabel() }}</option>
          @for (t of topics(); track t.id) { <option [value]="t.id">{{ t.name }}</option> }
          <option [value]="NEW">+ New topic…</option>
        </select>
      </div>
      @if (adding()) {
        <div class="tp-row">
          <input class="tp-input" maxlength="80" placeholder="Topic name, e.g. Mahadev" [ngModel]="draft()"
                 (ngModelChange)="draft.set($event)" (keydown.enter)="create()" autofocus />
          <button type="button" class="tp-btn" (click)="create()" [disabled]="saving() || !draft().trim()">Add</button>
          <button type="button" class="tp-btn" (click)="cancel()">Cancel</button>
        </div>
      }
      @if (error(); as e) { <p class="tp-error">{{ e }}</p> }
    </div>
  `,
  styles: [`
    .tp { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .tp-label { font-size: 0.78rem; color: var(--muted, #8b949e); }
    .tp-row { display: flex; align-items: center; gap: 6px; }
    .tp-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; border: 1px solid var(--border, #30363d); }
    .tp-select, .tp-input { flex: 1; min-width: 0; background: transparent; color: inherit; border: 1px solid var(--border, #30363d); border-radius: 8px; padding: 6px 8px; font: inherit; font-size: 0.85rem; }
    .tp-select option { color: #000; }
    .tp-btn { background: transparent; color: inherit; border: 1px solid var(--border, #30363d); border-radius: 8px; padding: 5px 10px; cursor: pointer; font: inherit; font-size: 0.8rem; }
    .tp-btn:disabled { opacity: 0.5; cursor: default; }
    .tp-error { margin: 0; color: #f85149; font-size: 0.78rem; }
  `],
})
export class TopicPickerComponent {
  private readonly calendar = inject(ContentCalendarService);

  readonly NEW = NEW;

  /** The chosen topic id, or null for none. */
  readonly value = model<string | null>(null);
  readonly label = input<string>('');
  readonly emptyLabel = input<string>('No topic');
  readonly disabled = input(false);
  /** Change this to make the picker reload its list (e.g. after the page created topics). */
  readonly refresh = input<unknown>(null);

  readonly topics = signal<ContentTopic[]>([]);
  readonly adding = signal(false);
  readonly draft = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => { this.refresh(); this.load(); });
  }

  dot(): string {
    return this.topics().find((t) => t.id === this.value())?.color ?? 'transparent';
  }

  pick(id: string): void {
    this.error.set(null);
    if (id === NEW) {
      this.adding.set(true);
      return;
    }
    this.adding.set(false);
    this.value.set(id || null);
  }

  create(): void {
    const name = this.draft().trim();
    if (!name || this.saving()) return;

    const existing = this.topics().find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      this.finish(existing);
      return;
    }

    this.saving.set(true);
    const body: ContentTopicRequest = {
      name, description: null, color: '', channelId: null, channelTitle: null, days: [],
      publishTime: '18:00', timeZone: 'UTC', leadDays: 3, planAheadDays: 21,
      autoSchedule: true, autoLinkUploads: true, tags: [], checklist: [], archived: false,
    };
    this.calendar.createTopic(body).subscribe({
      next: (t) => { this.saving.set(false); this.topics.update((l) => [...l, t]); this.finish(t); },
      error: () => { this.saving.set(false); this.error.set('Could not create the topic.'); },
    });
  }

  cancel(): void {
    this.adding.set(false);
    this.draft.set('');
    this.error.set(null);
  }

  private finish(topic: ContentTopic): void {
    this.adding.set(false);
    this.draft.set('');
    this.value.set(topic.id);
  }

  private load(): void {
    this.calendar.listTopics().subscribe({
      next: (t) => this.topics.set(t.filter((x) => !x.archived)),
      error: () => this.error.set('Could not load topics.'),
    });
  }
}
