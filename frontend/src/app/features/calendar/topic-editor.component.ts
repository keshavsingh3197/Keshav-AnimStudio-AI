import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ContentTopic, ContentTopicRequest, DayOfWeekName, WEEK_DAYS } from '../../core/models/calendar.models';
import { YouTubeChannel } from '../../core/models/youtube.models';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { browserTimeZone, dayShort, errorText } from './calendar-helpers';

const COLORS = ['#6c8cff', '#a855f7', '#06b6d4', '#22d36b', '#f59e0b', '#f44350', '#ec4899', '#94a3b8'];

/**
 * Creating or editing a topic: its cadence (which days, what time, how many days ahead it
 * must be ready), its channel, and what the planner may do on YouTube by itself.
 */
@Component({
  selector: 'app-topic-editor',
  imports: [FormsModule],
  template: `
    <div class="cal-modal-backdrop" (click)="closed.emit()"></div>
    <section class="cal-modal" role="dialog" aria-modal="true" aria-labelledby="topic-editor-title">
      <header class="cal-modal-head">
        <h2 id="topic-editor-title">{{ topic() ? 'Edit topic' : 'New topic' }}</h2>
        <button type="button" class="secondary small" (click)="closed.emit()" aria-label="Close">✕</button>
      </header>

      <div class="cal-modal-body">
        <div class="field">
          <label for="topic-name">Name</label>
          <input id="topic-name" type="text" maxlength="80" [(ngModel)]="name" placeholder="e.g. Monday motivation" />
        </div>

        <div class="field">
          <label for="topic-desc">What it's about <span class="muted">(optional)</span></label>
          <textarea id="topic-desc" rows="2" maxlength="500" [(ngModel)]="description"></textarea>
        </div>

        <div class="field">
          <label>Colour</label>
          <div class="swatches">
            @for (c of colors; track c) {
              <button type="button" class="swatch" [style.background]="c" [class.on]="color === c"
                      (click)="color = c" [attr.aria-label]="'Colour ' + c"></button>
            }
          </div>
        </div>

        <div class="field">
          <label>Publish days</label>
          <div class="day-toggles">
            @for (d of weekDays; track d) {
              <button type="button" class="day" [class.on]="days().includes(d)" (click)="toggleDay(d)">{{ short(d) }}</button>
            }
          </div>
          <p class="muted small">Every chosen day gets a planned post automatically. Leave all off to add posts by hand.</p>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="topic-time">Goes live at</label>
            <input id="topic-time" type="time" [(ngModel)]="publishTime" />
          </div>
          <div class="field">
            <label for="topic-tz">Time zone</label>
            <input id="topic-tz" type="text" maxlength="64" [(ngModel)]="timeZone" list="tz-list" />
            <datalist id="tz-list">
              @for (z of zones; track z) { <option [value]="z"></option> }
            </datalist>
          </div>
          <div class="field">
            <label for="topic-lead">Ready this many days before</label>
            <input id="topic-lead" type="number" min="0" max="30" [(ngModel)]="leadDays" />
          </div>
          <div class="field">
            <label for="topic-ahead">Plan this many days ahead</label>
            <input id="topic-ahead" type="number" min="1" max="90" [(ngModel)]="planAheadDays" />
          </div>
        </div>

        <div class="field">
          <label for="topic-channel">YouTube channel</label>
          <select id="topic-channel" [(ngModel)]="channelId">
            <option value="">- Not linked to a channel -</option>
            @for (c of channels(); track c.channelId) {
              <option [value]="c.channelId">{{ c.channelTitle }}</option>
            }
          </select>
          @if (channels().length === 0) {
            <p class="muted small">Connect a channel on the YouTube page to let the calendar check and set publish times.</p>
          }
        </div>

        @if (channelId) {
          <label class="check">
            <input type="checkbox" [(ngModel)]="autoLinkUploads" />
            Find my uploads (also from the phone) and link them to the matching post
          </label>
          <label class="check">
            <input type="checkbox" [(ngModel)]="autoSchedule" />
            If a linked video is private without the planned time, set the publish time on YouTube for me
          </label>
        }

        <div class="field">
          <label for="topic-tags">Tags / hashtags to reuse <span class="muted">(comma separated)</span></label>
          <input id="topic-tags" type="text" [(ngModel)]="tags" placeholder="#motivation, #shorts" />
        </div>

        <div class="field">
          <label for="topic-check">Checklist for every post <span class="muted">(one per line)</span></label>
          <textarea id="topic-check" rows="4" [(ngModel)]="checklist" placeholder="Script&#10;Record voice&#10;Edit&#10;Thumbnail"></textarea>
        </div>

        @if (topic()) {
          <label class="check">
            <input type="checkbox" [(ngModel)]="archived" />
            Archived (stops planning new posts)
          </label>
        }

        @if (error()) { <p class="cal-error" role="alert">{{ error() }}</p> }
      </div>

      <footer class="cal-modal-foot">
        @if (topic()) {
          @if (confirmDelete()) {
            <span class="muted small">Delete the topic and all its posts?</span>
            <button type="button" class="danger small" (click)="remove()" [disabled]="busy()">Yes, delete</button>
            <button type="button" class="secondary small" (click)="confirmDelete.set(false)">Keep</button>
          } @else {
            <button type="button" class="danger small" (click)="confirmDelete.set(true)">Delete</button>
          }
        }
        <span class="spacer"></span>
        <button type="button" class="secondary" (click)="closed.emit()">Cancel</button>
        <button type="button" (click)="save()" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save' }}</button>
      </footer>
    </section>
  `,
  styleUrl: './calendar-modal.css',
})
export class TopicEditorComponent implements OnInit {
  private readonly api = inject(ContentCalendarService);
  private readonly youTube = inject(YouTubePublishService);

  readonly topic = input<ContentTopic | null>(null);
  readonly saved = output<ContentTopic>();
  readonly deleted = output<string>();
  readonly closed = output<void>();

  readonly colors = COLORS;
  readonly weekDays = WEEK_DAYS;
  readonly zones = commonZones();
  readonly channels = signal<YouTubeChannel[]>([]);
  readonly days = signal<DayOfWeekName[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirmDelete = signal(false);

  name = '';
  description = '';
  color = COLORS[0];
  publishTime = '18:00';
  timeZone = browserTimeZone();
  leadDays = 3;
  planAheadDays = 21;
  channelId = '';
  autoSchedule = true;
  autoLinkUploads = true;
  tags = '';
  checklist = '';
  archived = false;

  ngOnInit(): void {
    const t = this.topic();
    if (t) {
      this.name = t.name;
      this.description = t.description ?? '';
      this.color = t.color;
      this.days.set([...t.days]);
      this.publishTime = t.publishTime;
      this.timeZone = t.timeZone;
      this.leadDays = t.leadDays;
      this.planAheadDays = t.planAheadDays;
      this.channelId = t.channelId ?? '';
      this.autoSchedule = t.autoSchedule;
      this.autoLinkUploads = t.autoLinkUploads;
      this.tags = t.tags.join(', ');
      this.checklist = t.checklist.join('\n');
      this.archived = t.archived;
    }
    this.youTube.status().subscribe({
      next: (s) => this.channels.set(s.channels.filter((c) => !c.needsReconnect || c.channelId === this.channelId)),
      error: () => this.channels.set([]),
    });
  }

  short(d: DayOfWeekName): string {
    return dayShort(d);
  }

  toggleDay(d: DayOfWeekName): void {
    this.days.update((list) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d]));
  }

  save(): void {
    if (!this.name.trim()) {
      this.error.set('Give the topic a name.');
      return;
    }
    const channel = this.channels().find((c) => c.channelId === this.channelId);
    const body: ContentTopicRequest = {
      name: this.name.trim(),
      description: this.description.trim() || null,
      color: this.color,
      channelId: this.channelId || null,
      channelTitle: channel?.channelTitle ?? this.topic()?.channelTitle ?? null,
      days: this.days(),
      publishTime: this.publishTime || '18:00',
      timeZone: this.timeZone.trim() || 'UTC',
      leadDays: Number(this.leadDays) || 0,
      planAheadDays: Number(this.planAheadDays) || 21,
      autoSchedule: this.autoSchedule,
      autoLinkUploads: this.autoLinkUploads,
      tags: this.tags.split(',').map((t) => t.trim()).filter(Boolean),
      checklist: this.checklist.split('\n').map((t) => t.trim()).filter(Boolean),
      archived: this.archived,
    };
    this.busy.set(true);
    this.error.set(null);
    const t = this.topic();
    (t ? this.api.updateTopic(t.id, body) : this.api.createTopic(body)).subscribe({
      next: (saved) => {
        this.busy.set(false);
        this.saved.emit(saved);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorText(err, 'The topic could not be saved.'));
      },
    });
  }

  remove(): void {
    const t = this.topic();
    if (!t) return;
    this.busy.set(true);
    this.api.deleteTopic(t.id, true).subscribe({
      next: () => {
        this.busy.set(false);
        this.deleted.emit(t.id);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorText(err, 'The topic could not be deleted.'));
      },
    });
  }
}

function commonZones(): string[] {
  const own = browserTimeZone();
  const list = ['Asia/Kolkata', 'UTC', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles',
    'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney'];
  return [own, ...list.filter((z) => z !== own)];
}
