import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  ContentPlanItem, ContentPlanStatus, ContentTopic, STATUS_LABELS, worstAttention,
} from '../../core/models/calendar.models';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { cadenceLabel, errorText, localDayKey } from './calendar-helpers';
import { DayPanelComponent } from './day-panel.component';
import { PlanItemPanelComponent } from './plan-item-panel.component';
import { TopicEditorComponent } from './topic-editor.component';

type CalendarView = 'agenda' | 'month' | 'progress';
type ProgressPeriod = 'month' | 'last30' | 'next30' | 'quarter';
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
  /** "2/3" posts ready, scheduled or live; null for an empty day. */
  ready: string | null;
  allReady: boolean;
}

/** Where each topic stands in the progress period. Counts exclude skipped posts unless named. */
export interface TopicProgress {
  topic: ContentTopic;
  total: number;
  live: number;
  scheduled: number;
  ready: number;
  toPrepare: number;
  missed: number;
  skipped: number;
  /** Planned but not live yet: scheduled + ready + to prepare. */
  remaining: number;
  next: ContentPlanItem | null;
  lastLive: string | null;
}

/** The progress bar's segments, in the order a post moves through them (missed last). */
export const PROGRESS_SEGMENTS = [
  { key: 'live', label: 'Live' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'ready', label: 'Ready to upload' },
  { key: 'toPrepare', label: 'To prepare' },
  { key: 'missed', label: 'Missed' },
] as const;

const VIEW_KEY = 'animstudio.calendar.view';

/**
 * The content calendar: every topic's planned posts on one timeline, what still needs doing
 * before each goes live, and whether YouTube has it scheduled. The background planner keeps
 * cadence slots filled and YouTube state fresh; this page is where the owner works through it.
 */
@Component({
  selector: 'app-content-calendar',
  imports: [DatePipe, FormsModule, RouterLink, DayPanelComponent, PlanItemPanelComponent, TopicEditorComponent],
  templateUrl: './content-calendar.component.html',
  styleUrl: './content-calendar.component.css',
})
export class ContentCalendarComponent implements OnInit {
  private readonly api = inject(ContentCalendarService);
  private readonly route = inject(ActivatedRoute);

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
  /** The day whose details drawer is open. */
  readonly dayOpen = signal<Date | null>(null);
  readonly progressPeriod = signal<ProgressPeriod>('month');
  readonly segments = PROGRESS_SEGMENTS;

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
      const items = byDay.get(key) ?? [];
      const counted = items.filter((i) => i.status !== 'Skipped');
      const ready = counted.filter((i) => i.status === 'Ready' || i.status === 'Scheduled' || i.status === 'Published').length;
      cells.push({
        key, date: d, inMonth: d.getMonth() === start.getMonth(), isToday: key === todayKey, items,
        ready: counted.length ? `${ready}/${counted.length}` : null,
        allReady: counted.length > 0 && ready === counted.length,
      });
    }
    return cells;
  });

  readonly dayItems = computed(() => {
    const day = this.dayOpen();
    if (!day) return [];
    const key = localDayKey(day);
    return this.items().filter((i) => localDayKey(i.publishAt) === key);
  });

  /** Per topic: what went out, what is lined up, and what still needs work in the period. */
  readonly progress = computed<TopicProgress[]>(() => {
    const now = Date.now();
    const topicFilter = this.topicFilter();
    const rows = new Map<string, TopicProgress>();
    for (const t of this.topics()) {
      if (t.archived && !this.showArchived()) continue;
      if (topicFilter !== 'all' && t.id !== topicFilter) continue;
      rows.set(t.id, {
        topic: t, total: 0, live: 0, scheduled: 0, ready: 0, toPrepare: 0, missed: 0, skipped: 0, remaining: 0, next: null, lastLive: null,
      });
    }
    for (const i of this.items()) {
      const row = rows.get(i.topicId);
      if (!row) continue;
      if (i.status === 'Skipped') {
        row.skipped++;
        continue;
      }
      row.total++;
      if (i.status === 'Published') {
        row.live++;
        const at = i.youTube?.publishedAt ?? i.publishAt;
        if (!row.lastLive || at > row.lastLive) row.lastLive = at;
        continue;
      }
      if (new Date(i.publishAt).getTime() <= now) {
        row.missed++;
        continue;
      }
      if (i.status === 'Scheduled') row.scheduled++;
      else if (i.status === 'Ready') row.ready++;
      else row.toPrepare++;
      if (!row.next || i.publishAt < row.next.publishAt) row.next = i;
    }
    for (const row of rows.values()) row.remaining = row.scheduled + row.ready + row.toPrepare;
    return [...rows.values()].sort((a, b) =>
      (b.missed - a.missed) || (b.toPrepare - a.toPrepare) || a.topic.name.localeCompare(b.topic.name));
  });

  readonly progressTotals = computed(() => {
    const t = { total: 0, live: 0, scheduled: 0, ready: 0, toPrepare: 0, missed: 0, skipped: 0, remaining: 0 };
    for (const r of this.progress()) {
      t.total += r.total;
      t.live += r.live;
      t.scheduled += r.scheduled;
      t.ready += r.ready;
      t.toPrepare += r.toPrepare;
      t.missed += r.missed;
      t.skipped += r.skipped;
      t.remaining += r.remaining;
    }
    return t;
  });

  /** Upcoming posts still being worked on, the most urgent (earliest ready-by) first. */
  readonly prepQueue = computed(() => {
    const now = Date.now();
    const ids = new Set(this.progress().map((r) => r.topic.id));
    return this.items()
      .filter((i) => ids.has(i.topicId) && (i.status === 'Idea' || i.status === 'InProgress') && new Date(i.publishAt).getTime() > now)
      .sort((a, b) => a.prepareBy.localeCompare(b.prepareBy))
      .slice(0, 10);
  });

  readonly progressLabel = computed(() => {
    const [from, to] = this.progressRange();
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${from.toLocaleDateString(undefined, opts)} – ${new Date(to.getTime() - 1).toLocaleDateString(undefined, opts)}`;
  });

  ngOnInit(): void {
    this.loadTopics();
    this.loadItems();
    // ?post=<id> opens that post, e.g. after an upload linked to it.
    const post = this.route.snapshot.queryParamMap.get('post');
    if (post && /^[0-9a-f]{32}$/.test(post)) {
      this.api.getItem(post).subscribe({
        next: (item) => this.panelItem.set(item),
        error: (err: unknown) => this.error.set(errorText(err, 'That post could not be opened.')),
      });
    }
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
    if (this.view() === 'progress') return this.progressRange();
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

  private progressRange(): [Date, Date] {
    const now = new Date();
    const day = (offset: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    switch (this.progressPeriod()) {
      case 'last30': return [day(-30), day(1)];
      case 'next30': return [day(0), day(31)];
      case 'quarter': return [day(-60), day(31)];
      default: return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1)];
    }
  }

  setPeriod(period: ProgressPeriod): void {
    this.progressPeriod.set(period);
    this.loadItems();
  }

  /** Width of one bar segment as a share of the topic's posts in the period. */
  share(row: TopicProgress, key: (typeof PROGRESS_SEGMENTS)[number]['key']): number {
    return row.total ? (row[key] / row.total) * 100 : 0;
  }

  topicName(item: ContentPlanItem): string {
    return this.topicById().get(item.topicId)?.name ?? '';
  }

  overdue(item: ContentPlanItem): boolean {
    return new Date(item.prepareBy).getTime() <= Date.now();
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

  openDay(date: Date, event?: Event): void {
    event?.stopPropagation();
    this.dayOpen.set(date);
  }

  addOnDay(date: Date): void {
    this.dayOpen.set(null);
    this.newPost(date);
  }

  postsChanged(list: ContentPlanItem[]): void {
    for (const saved of list) this.postSaved(saved);
  }

  markReady(item: ContentPlanItem): void {
    this.api.setStatus(item.id, 'Ready').subscribe({
      next: (saved) => this.postSaved(saved),
      error: (err: unknown) => this.error.set(errorText(err, 'The status could not be changed.')),
    });
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
    const v = localStorage.getItem(VIEW_KEY);
    return v === 'month' || v === 'progress' ? v : 'agenda';
  } catch {
    return 'agenda';
  }
}
