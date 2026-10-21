import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ContentPlanItem, ContentPlanStatus, ContentTopic, STATUS_LABELS, worstAttention,
} from '../../core/models/calendar.models';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { cadenceLabel, errorText, localDayKey } from './calendar-helpers';
import { PlanItemPanelComponent } from './plan-item-panel.component';
import { TopicEditorComponent } from './topic-editor.component';

type CalendarView = 'agenda' | 'month';
type QuickFilter = 'all' | 'attention' | 'todo' | 'ready';

interface DayGroup {
  key: string;
  date: Date;
  isToday: boolean;
  items: ContentPlanItem[];
}

interface MonthCell {
  key: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: ContentPlanItem[];
}

const VIEW_KEY = 'animstudio.calendar.view';

/**
 * The content calendar: every topic's planned posts on one timeline, what still needs doing
 * before each goes live, and whether YouTube has it scheduled. The background planner keeps
 * cadence slots filled and YouTube state fresh; this page is where the owner works through it.
 */
@Component({
  selector: 'app-content-calendar',
  imports: [DatePipe, FormsModule, RouterLink, PlanItemPanelComponent, TopicEditorComponent],
  templateUrl: './content-calendar.component.html',
  styleUrl: './content-calendar.component.css',
})
export class ContentCalendarComponent implements OnInit {
  private readonly api = inject(ContentCalendarService);

  readonly statusLabels = STATUS_LABELS;

  readonly topics = signal<ContentTopic[]>([]);
  readonly items = signal<ContentPlanItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly view = signal<CalendarView>(readView());
  readonly filter = signal<QuickFilter>('all');
  readonly topicFilter = signal<string>('all');
  readonly showArchived = signal(false);
  /** First day of the month shown in month view. */
  readonly monthStart = signal(startOfMonth(new Date()));

  readonly editingTopic = signal<ContentTopic | null | undefined>(undefined);
  readonly panelItem = signal<ContentPlanItem | null | undefined>(undefined);
  readonly panelStartAt = signal<string | null>(null);

  readonly topicById = computed(() => new Map(this.topics().map((t) => [t.id, t])));
  readonly visibleTopics = computed(() => this.topics().filter((t) => this.showArchived() || !t.archived));

  readonly filtered = computed(() => {
    const topic = this.topicFilter();
    const f = this.filter();
    return this.items().filter((i) => {
      if (topic !== 'all' && i.topicId !== topic) return false;
      if (f === 'attention') return worstAttention(i) === 'Problem' || worstAttention(i) === 'Warning';
      if (f === 'todo') return i.status === 'Idea' || i.status === 'InProgress';
      if (f === 'ready') return i.status === 'Ready' || i.status === 'Scheduled';
      return true;
    });
  });

  readonly summary = computed(() => {
    const now = Date.now();
    const week = now + 7 * 86_400_000;
    const upcoming = this.items().filter((i) => new Date(i.publishAt).getTime() >= now);
    return {
      attention: this.items().filter((i) => worstAttention(i) === 'Problem' || worstAttention(i) === 'Warning').length,
      thisWeek: upcoming.filter((i) => new Date(i.publishAt).getTime() < week && i.status !== 'Skipped').length,
      todo: upcoming.filter((i) => i.status === 'Idea' || i.status === 'InProgress').length,
      scheduled: upcoming.filter((i) => i.status === 'Scheduled').length,
    };
  });

  /** Agenda: today onwards by day, with anything overdue from the past week on top. */
  readonly agenda = computed<DayGroup[]>(() => {
    const todayKey = localDayKey(new Date());
    const groups = new Map<string, DayGroup>();
    for (const item of this.filtered()) {
      const key = localDayKey(item.publishAt);
      const done = item.status === 'Published' || item.status === 'Skipped';
      if (key < todayKey && done) continue; // the past only shows what still needs attention
      let g = groups.get(key);
      if (!g) {
        g = { key, date: new Date(item.publishAt), isToday: key === todayKey, items: [] };
        groups.set(key, g);
      }
      g.items.push(item);
    }
    return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
  });

  readonly monthCells = computed<MonthCell[]>(() => {
    const start = this.monthStart();
    const first = new Date(start);
    const offset = (first.getDay() + 6) % 7; // weeks start on Monday
    first.setDate(first.getDate() - offset);
    const todayKey = localDayKey(new Date());
    const byDay = new Map<string, ContentPlanItem[]>();
    for (const item of this.filtered()) {
      const key = localDayKey(item.publishAt);
      byDay.set(key, [...(byDay.get(key) ?? []), item]);
    }
    const cells: MonthCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      const key = localDayKey(d);
      cells.push({ key, date: d, inMonth: d.getMonth() === start.getMonth(), isToday: key === todayKey, items: byDay.get(key) ?? [] });
    }
    return cells;
  });

  ngOnInit(): void {
    this.loadTopics();
    this.loadItems();
  }

  // ---------------------------------------------------------------- loading

  loadTopics(): void {
    this.api.listTopics().subscribe({
      next: (list) => this.topics.set(list),
      error: (err: unknown) => this.error.set(errorText(err, 'Topics could not be loaded.')),
    });
  }

  loadItems(): void {
    const [from, to] = this.range();
    this.loading.set(true);
    this.api.listItems(from, to).subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorText(err, 'The calendar could not be loaded.'));
      },
    });
  }

  private range(): [Date, Date] {
    if (this.view() === 'month') {
      const start = this.monthStart();
      const from = new Date(start);
      from.setDate(from.getDate() - 7);
      const to = new Date(start.getFullYear(), start.getMonth() + 1, 8);
      return [from, to];
    }
    const now = new Date();
    return [new Date(now.getTime() - 7 * 86_400_000), new Date(now.getTime() + 70 * 86_400_000)];
  }

  setView(view: CalendarView): void {
    this.view.set(view);
    try { localStorage.setItem(VIEW_KEY, view); } catch { /* per-viewer convenience only */ }
    this.loadItems();
  }

  shiftMonth(by: number): void {
    const s = this.monthStart();
    this.monthStart.set(new Date(s.getFullYear(), s.getMonth() + by, 1));
    this.loadItems();
  }

  thisMonth(): void {
    this.monthStart.set(startOfMonth(new Date()));
    this.loadItems();
  }

  // ---------------------------------------------------------------- topics

  newTopic(): void {
    this.editingTopic.set(null);
  }

  editTopic(t: ContentTopic, event?: Event): void {
    event?.stopPropagation();
    this.editingTopic.set(t);
  }

  topicSaved(saved: ContentTopic): void {
    this.editingTopic.set(undefined);
    this.topics.update((list) => [...list.filter((t) => t.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
    this.loadItems(); // the cadence may have planned new posts
  }

  topicDeleted(id: string): void {
    this.editingTopic.set(undefined);
    this.topics.update((list) => list.filter((t) => t.id !== id));
    this.items.update((list) => list.filter((i) => i.topicId !== id));
    if (this.topicFilter() === id) this.topicFilter.set('all');
  }

  cadence(t: ContentTopic): string {
    return cadenceLabel(t);
  }

  // ---------------------------------------------------------------- posts

  newPost(day?: Date): void {
    if (day) {
      const topic = this.topicFilter() !== 'all' ? this.topicById().get(this.topicFilter()) : undefined;
      const [h, m] = (topic?.publishTime ?? '18:00').split(':').map(Number);
      const at = new Date(day);
      at.setHours(h || 18, m || 0, 0, 0);
      this.panelStartAt.set(at.toISOString());
    } else {
      this.panelStartAt.set(null);
    }
    this.panelItem.set(null);
  }

  openPost(item: ContentPlanItem): void {
    this.panelItem.set(item);
  }

  postSaved(saved: ContentPlanItem): void {
    this.items.update((list) => {
      const rest = list.filter((i) => i.id !== saved.id);
      return [...rest, saved].sort((a, b) => a.publishAt.localeCompare(b.publishAt));
    });
  }

  postDeleted(id: string): void {
    this.panelItem.set(undefined);
    this.items.update((list) => list.filter((i) => i.id !== id));
  }

  quickStatus(item: ContentPlanItem, status: ContentPlanStatus, event: Event): void {
    event.stopPropagation();
    this.api.setStatus(item.id, status).subscribe({
      next: (saved) => this.postSaved(saved),
      error: (err: unknown) => this.error.set(errorText(err, 'The status could not be changed.')),
    });
  }

  topicOf(item: ContentPlanItem): ContentTopic | undefined {
    return this.topicById().get(item.topicId);
  }

  level(item: ContentPlanItem): string {
    return (worstAttention(item) ?? 'ok').toLowerCase();
  }

  firstMessage(item: ContentPlanItem): string | null {
    return item.attention[0]?.message ?? null;
  }

  checklistProgress(item: ContentPlanItem): string | null {
    if (item.checklist.length === 0) return null;
    return `${item.checklist.filter((c) => c.done).length}/${item.checklist.length}`;
  }

  statusClass(status: ContentPlanStatus): string {
    return 'st-' + status.toLowerCase();
  }
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function readView(): CalendarView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'month' ? 'month' : 'agenda';
  } catch {
    return 'agenda';
  }
}
