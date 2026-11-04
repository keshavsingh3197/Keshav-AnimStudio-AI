import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  CategorySuggestion, PublishQueueBoard, PublishQueueBulkResult, PublishQueueCandidate, PublishQueueItem,
  PublishQueueMode, PublishQueueState, PublishQueueUpdate, PublishSlot, QUEUE_MODE_LABELS, QueueBulkStrategy,
  formatWhen, fromLocalInput, relativeTime, toLocalInput,
} from '../../core/models/publish-queue.models';
import { YouTubeChannel, YouTubeCategory, YouTubePrivacy, parseYouTubeTags } from '../../core/models/youtube.models';
import { ApiService } from '../../core/services/api.service';
import { MediaTicketService } from '../../core/services/media-ticket.service';
import { PublishQueueService, localTimeZone } from '../../core/services/publish-queue.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';

type BoardView = 'timeline' | 'columns' | 'week';
type Filter = 'all' | 'upcoming' | 'today' | 'attention' | 'uploading' | 'published' | 'held';

interface DayGroup { key: string; label: string; items: PublishQueueItem[] }
interface Column { state: PublishQueueState | 'Ended'; label: string; hint: string; items: PublishQueueItem[] }

/** Remembered per browser: the view and the channel last looked at. */
const PREFS_KEY = 'animstudio.youtube.queue';

/** The board is re-read this often while something is uploading or about to go. */
const FAST_POLL_MS = 10_000;
const SLOW_POLL_MS = 60_000;

/** Editable copy of an item's details in the drawer. */
interface EditForm {
  channelId: string;
  title: string;
  description: string;
  tagsText: string;
  categoryId: string;
  privacy: YouTubePrivacy;
  madeForKids: boolean;
  notifySubscribers: boolean;
  firstComment: string;
  scheduledLocal: string;
  mode: PublishQueueMode;
  notes: string;
  removeThumbnail: boolean;
}

/**
 * The publishing board: every video waiting to go to YouTube, when it goes, and how it is
 * doing. Videos come from the publish dialog ("Add to queue") or many at once from the
 * exports here; the server pushes each one when it is due - or uploads it ahead and lets
 * YouTube release it on the dot - so nothing depends on this page being open.
 */
@Component({
  selector: 'app-publish-board',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, RouterLink],
  templateUrl: './publish-board.component.html',
  styleUrl: './publish-board.component.css',
})
export class PublishBoardComponent implements OnInit {
  private readonly queue = inject(PublishQueueService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly api = inject(ApiService);
  private readonly media = inject(MediaTicketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly modeLabels = QUEUE_MODE_LABELS;
  readonly timeZone = localTimeZone();
  readonly when = formatWhen;

  readonly board = signal<PublishQueueBoard | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly channels = signal<YouTubeChannel[]>([]);
  readonly categories = signal<YouTubeCategory[]>([]);
  readonly configured = signal(true);
  readonly busyId = signal<string | null>(null);
  readonly toast = signal<{ text: string; kind: 'ok' | 'err' } | null>(null);

  readonly view = signal<BoardView>('timeline');
  readonly filter = signal<Filter>('upcoming');
  readonly channelFilter = signal('');
  readonly search = signal('');
  /** Monday-based offset in weeks from this week, for the week view. */
  readonly weekOffset = signal(0);

  /** Ticks every 15 s so countdowns move without re-reading the board. */
  readonly now = signal(Date.now());

  // --- derived ---

  readonly items = computed(() => {
    const list = this.board()?.items ?? [];
    const channel = this.channelFilter();
    const q = this.search().trim().toLowerCase();
    return list.filter((i) =>
      (!channel || i.channelId === channel)
      && (!q || i.title.toLowerCase().includes(q) || (i.projectName ?? '').toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q))));
  });

  readonly filtered = computed(() => {
    const now = this.now();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const items = this.items();
    switch (this.filter()) {
      case 'upcoming': return items.filter((i) => i.state === 'Waiting' || i.state === 'Uploading' || i.state === 'Held');
      case 'today': return items.filter((i) => i.scheduledAt && Date.parse(i.scheduledAt) <= endOfToday.getTime() && isOpen(i.state));
      case 'attention': return items.filter(needsAttention);
      case 'uploading': return items.filter((i) => i.state === 'Uploading');
      case 'published': return items.filter((i) => i.state === 'Published');
      case 'held': return items.filter((i) => i.state === 'Held');
      default: return items;
    }
  });

  readonly stats = computed(() => {
    const items = this.items();
    const now = this.now();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const weekEnd = now + 7 * 24 * 3600 * 1000;
    const next = items
      .filter((i) => i.state === 'Waiting' && i.scheduledAt)
      .sort((a, b) => Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!))[0] ?? null;
    return {
      next,
      today: items.filter((i) => isOpen(i.state) && i.scheduledAt && Date.parse(i.scheduledAt) <= endOfToday.getTime()).length,
      week: items.filter((i) => isOpen(i.state) && i.scheduledAt && Date.parse(i.scheduledAt) <= weekEnd).length,
      uploading: items.filter((i) => i.state === 'Uploading').length,
      held: items.filter((i) => i.state === 'Held').length,
      attention: items.filter(needsAttention).length,
      published: items.filter((i) => i.state === 'Published').length,
    };
  });

  /** Timeline: needs attention first, then by day, then what has no time yet. */
  readonly dayGroups = computed<DayGroup[]>(() => {
    const items = this.filtered();
    const groups: DayGroup[] = [];
    const attention = items.filter(needsAttention);
    if (attention.length) groups.push({ key: 'attention', label: '⚠ Needs attention', items: attention });

    const dated = items.filter((i) => !needsAttention(i) && i.scheduledAt)
      .sort((a, b) => Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!));
    const byDay = new Map<string, PublishQueueItem[]>();
    for (const item of dated) {
      const d = new Date(item.scheduledAt!);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      byDay.set(key, [...(byDay.get(key) ?? []), item]);
    }
    for (const [key, list] of byDay) groups.push({ key, label: this.dayLabel(new Date(list[0].scheduledAt!)), items: list });

    const undated = items.filter((i) => !needsAttention(i) && !i.scheduledAt);
    if (undated.length) groups.push({ key: 'undated', label: '⏸ No time yet', items: undated });
    return groups;
  });

  readonly columns = computed<Column[]>(() => {
    const items = this.items();
    const byTime = (a: PublishQueueItem, b: PublishQueueItem) =>
      (a.scheduledAt ? Date.parse(a.scheduledAt) : Infinity) - (b.scheduledAt ? Date.parse(b.scheduledAt) : Infinity);
    const recentFirst = (a: PublishQueueItem, b: PublishQueueItem) =>
      Date.parse(b.finishedAt ?? b.updatedAt) - Date.parse(a.finishedAt ?? a.updatedAt);
    return [
      { state: 'Held', label: 'Held', hint: 'Paused or no time yet', items: items.filter((i) => i.state === 'Held').sort(byTime) },
      { state: 'Waiting', label: 'Scheduled', hint: 'Goes out on its own', items: items.filter((i) => i.state === 'Waiting').sort(byTime) },
      { state: 'Uploading', label: 'Uploading', hint: 'On its way', items: items.filter((i) => i.state === 'Uploading') },
      { state: 'Published', label: 'Published', hint: 'On YouTube', items: items.filter((i) => i.state === 'Published').sort(recentFirst) },
      { state: 'Ended', label: 'Failed / cancelled', hint: 'Fix, retry or remove', items: items.filter((i) => i.state === 'Failed' || i.state === 'Cancelled').sort(recentFirst) },
    ];
  });

  readonly weekDays = computed(() => {
    const start = new Date(this.now());
    start.setHours(0, 0, 0, 0);
    // Monday as the first day.
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + this.weekOffset() * 7);
    const items = this.items().filter((i) => i.scheduledAt && i.state !== 'Cancelled');
    const today = new Date(this.now()).toDateString();
    return Array.from({ length: 7 }, (_, n) => {
      const day = new Date(start);
      day.setDate(start.getDate() + n);
      const list = items.filter((i) => new Date(i.scheduledAt!).toDateString() === day.toDateString())
        .sort((a, b) => Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!));
      return { date: day, isToday: day.toDateString() === today, isPast: day.getTime() + 86_400_000 <= this.now(), items: list };
    });
  });

  readonly weekLabel = computed(() => {
    const days = this.weekDays();
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${days[0].date.toLocaleDateString(undefined, opts)} – ${days[6].date.toLocaleDateString(undefined, opts)}`;
  });

  // --- the drawer (one item, played and edited) ---

  readonly openId = signal<string | null>(null);
  readonly opened = computed(() => this.board()?.items.find((i) => i.id === this.openId()) ?? null);
  readonly form = signal<EditForm | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly categoryIdeas = signal<CategorySuggestion[]>([]);
  readonly slotIdeas = signal<PublishSlot[]>([]);
  readonly playing = signal(false);

  readonly formTags = computed(() => parseYouTubeTags(this.form()?.tagsText ?? ''));
  readonly formModeLocked = computed(() => this.form()?.privacy !== 'public');

  // --- add from exports ---

  readonly addOpen = signal(false);
  readonly candidates = signal<PublishQueueCandidate[]>([]);
  readonly candidatesLoading = signal(false);
  readonly candidateQuery = signal('');
  readonly showUsed = signal(false);
  readonly picked = signal<ReadonlySet<string>>(new Set());
  readonly bulkChannel = signal('');
  readonly bulkStrategy = signal<QueueBulkStrategy>('Slots');
  readonly bulkStartLocal = signal('');
  readonly bulkInterval = signal(24);
  readonly bulkMode = signal<PublishQueueMode>('ReleaseOnYouTube');
  readonly bulkPrivacy = signal<YouTubePrivacy>('public');
  readonly bulkCategory = signal('auto');
  readonly bulkSuffix = signal('');
  readonly bulkKids = signal(false);
  readonly bulkNotify = signal(true);
  readonly bulkBusy = signal(false);
  readonly bulkResult = signal<PublishQueueBulkResult | null>(null);
  readonly bulkError = signal<string | null>(null);
  readonly bulkSlots = signal<PublishSlot[]>([]);

  readonly shownCandidates = computed(() => {
    const q = this.candidateQuery().trim().toLowerCase();
    return this.candidates().filter((c) =>
      (this.showUsed() || (!c.onYouTube && !c.inQueue))
      && (!q || c.name.toLowerCase().includes(q) || c.projectName.toLowerCase().includes(q)));
  });
  readonly pickedCandidates = computed(() => this.candidates().filter((c) => this.picked().has(c.jobId)));

  /** What each picked video's time will be, for the preview list. */
  readonly bulkPlan = computed(() => {
    const picked = this.pickedCandidates();
    switch (this.bulkStrategy()) {
      case 'Slots': return picked.map((c, n) => ({ c, at: this.bulkSlots()[n]?.at ?? null, note: this.bulkSlots()[n]?.reason ?? 'Held: no free slot found' }));
      case 'Interval': {
        const start = fromLocalInput(this.bulkStartLocal()) ?? new Date(this.now());
        return picked.map((c, n) => ({ c, at: new Date(start.getTime() + n * this.bulkInterval() * 3_600_000).toISOString(), note: '' }));
      }
      case 'Now': return picked.map((c) => ({ c, at: null, note: 'As soon as possible' }));
      default: return picked.map((c) => ({ c, at: null, note: 'Held - schedule later' }));
    }
  });

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.restorePrefs();
    const tick = setInterval(() => this.now.set(Date.now()), 15_000);
    this.destroyRef.onDestroy(() => {
      clearInterval(tick);
      if (this.pollTimer) clearTimeout(this.pollTimer);
      if (this.toastTimer) clearTimeout(this.toastTimer);
    });

    effect(() => {
      const prefs = { view: this.view(), channel: this.channelFilter() };
      untracked(() => {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable: nothing to remember */ }
      });
    });

    // The bulk slot preview follows the channel and the picked videos.
    effect(() => {
      const open = this.addOpen();
      const strategy = this.bulkStrategy();
      const channel = this.bulkChannel();
      const picked = this.pickedCandidates();
      untracked(() => {
        if (!open || strategy !== 'Slots' || !picked.length) {
          this.bulkSlots.set([]);
          return;
        }
        const vertical = picked.every((c) => c.isVertical && (c.durationSeconds ?? 0) <= 180);
        this.queue.slots(channel || null, vertical, Math.min(50, picked.length)).subscribe({
          next: (slots) => this.bulkSlots.set(slots),
          error: () => this.bulkSlots.set([]),
        });
      });
    });
  }

  ngOnInit(): void {
    this.load();
    this.youtube.status().subscribe({
      next: (st) => {
        this.channels.set(st.channels);
        this.categories.set(st.categories);
        this.configured.set(st.configured);
        if (!this.bulkChannel() && st.channels.length) this.bulkChannel.set(st.channels[0].channelId);
      },
      error: () => this.configured.set(false),
    });
  }

  load(quiet = false): void {
    if (!quiet) this.loading.set(true);
    this.queue.board().subscribe({
      next: (b) => {
        this.board.set(b);
        this.loadError.set(null);
        this.loading.set(false);
        this.now.set(Date.now());
        this.schedulePoll();
      },
      error: (e: Error) => {
        this.loadError.set(e.message);
        this.loading.set(false);
        this.schedulePoll();
      },
    });
  }

  /** Fast while something is moving or about to, slow otherwise; never while a tab is hidden. */
  private schedulePoll(): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    const items = this.board()?.items ?? [];
    const soon = Date.now() + 5 * 60_000;
    const busy = items.some((i) => i.state === 'Uploading' || (i.state === 'Waiting' && i.dueAt && Date.parse(i.dueAt) <= soon));
    this.pollTimer = setTimeout(() => {
      if (document.visibilityState === 'visible' && !this.saving()) this.load(true);
      else this.schedulePoll();
    }, busy ? FAST_POLL_MS : SLOW_POLL_MS);
  }

  // --- labels ---

  dayLabel(d: Date): string {
    const today = new Date(this.now());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  }

  time(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  modeLabel(mode: PublishQueueMode): string {
    return QUEUE_MODE_LABELS[mode];
  }

  weekday(d: Date): string {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  rel(iso: string): string {
    return relativeTime(iso, this.now());
  }

  stateLabel(i: PublishQueueItem): string {
    switch (i.state) {
      case 'Waiting': return i.error ? 'Retrying' : 'Scheduled';
      case 'Held': return 'Held';
      case 'Uploading': return 'Uploading';
      case 'Published': return i.youTubePublishAt && Date.parse(i.youTubePublishAt) > this.now() ? 'Uploaded · releases soon' : 'Published';
      case 'Failed': return 'Failed';
      default: return 'Cancelled';
    }
  }

  /** What happens next, in a few words. */
  nextStep(i: PublishQueueItem): string {
    if (i.state === 'Waiting' && i.dueAt) {
      if (i.error) return `Retry ${this.rel(i.dueAt)}`;
      return i.effectiveMode === 'ReleaseOnYouTube' && i.scheduledAt && i.dueAt !== i.scheduledAt
        ? `Uploads ${this.rel(i.dueAt)} · public ${this.time(i.scheduledAt)}`
        : `Uploads ${this.rel(i.dueAt)}`;
    }
    if (i.state === 'Uploading') return `${i.percent ?? 0}% sent`;
    if (i.state === 'Published' && i.youTubePublishAt && Date.parse(i.youTubePublishAt) > this.now())
      return `YouTube makes it public ${this.rel(i.youTubePublishAt)}`;
    if (i.state === 'Published' && i.finishedAt) return `Went up ${this.rel(i.finishedAt)}`;
    if (i.state === 'Held') return i.scheduledAt ? `Paused · was ${this.when(i.scheduledAt)}` : 'Pick a time to schedule';
    return '';
  }

  thumbUrl(i: PublishQueueItem, width = 320): string | null {
    const base = `${environment.apiUrl}/api/youtube`;
    if (i.hasCustomThumbnail && i.thumbnailFrameAt == null)
      return this.media.sign(`${base}/queue/${encodeURIComponent(i.id)}/thumbnail`) ?? null;
    const at = i.thumbnailFrameAt ?? Math.min(2, (i.durationSeconds ?? 4) / 3);
    return this.media.sign(`${base}/render-jobs/${encodeURIComponent(i.jobId)}/frame?at=${at.toFixed(2)}&width=${width}`) ?? null;
  }

  previewUrl(i: PublishQueueItem): string {
    return this.api.previewUrl(i.jobId);
  }

  channelOf(id: string): YouTubeChannel | undefined {
    return this.channels().find((c) => c.channelId === id);
  }

  clock(seconds: number | null | undefined): string {
    if (seconds == null) return '';
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // --- quick actions ---

  publishNow(i: PublishQueueItem): void {
    if (!confirm(`Send "${i.title}" to ${i.channelTitle} now (${i.privacy})?`)) return;
    this.run(i, this.queue.publishNow(i.id), 'Upload started.');
  }

  hold(i: PublishQueueItem): void {
    this.run(i, this.queue.hold(i.id), 'Paused. It keeps its time but won\'t go out until you resume it.');
  }

  resume(i: PublishQueueItem): void {
    // A time that has passed needs a new one; open the drawer to pick it.
    if (!i.scheduledAt || Date.parse(i.scheduledAt) < this.now() - 5 * 60_000) {
      this.open(i);
      this.formError.set('Pick a new time, then press "Save & schedule".');
      return;
    }
    this.run(i, this.queue.schedule(i.id), 'Back on the schedule.');
  }

  retry(i: PublishQueueItem): void {
    this.run(i, this.queue.publishNow(i.id), 'Trying again now.');
  }

  /** +1 hour, +1 day: quick moves without opening the drawer. */
  shift(i: PublishQueueItem, hours: number): void {
    const base = i.scheduledAt && Date.parse(i.scheduledAt) > this.now() ? Date.parse(i.scheduledAt) : this.now();
    const at = new Date(base + hours * 3_600_000).toISOString();
    this.run(i, i.state === 'Waiting' ? this.queue.update(i.id, { scheduledAt: at }) : this.queue.schedule(i.id, at), `Moved to ${this.when(at)}.`);
  }

  cancel(i: PublishQueueItem): void {
    const msg = i.state === 'Uploading' ? `Stop uploading "${i.title}"?` : `Cancel "${i.title}"? It stays on the board so you can reschedule it.`;
    if (!confirm(msg)) return;
    this.run(i, this.queue.cancel(i.id), 'Cancelled.');
  }

  remove(i: PublishQueueItem): void {
    const msg = i.state === 'Published'
      ? `Remove "${i.title}" from the board? The video stays on YouTube.`
      : `Remove "${i.title}" from the board? It won't be published.`;
    if (!confirm(msg)) return;
    this.busyId.set(i.id);
    this.queue.remove(i.id).subscribe({
      next: () => {
        this.busyId.set(null);
        if (this.openId() === i.id) this.closeDrawer();
        this.board.update((b) => (b ? { ...b, items: b.items.filter((x) => x.id !== i.id) } : b));
        this.notify('Removed from the board.');
      },
      error: (e: Error) => {
        this.busyId.set(null);
        this.notify(e.message, 'err');
      },
    });
  }

  private run(i: PublishQueueItem, call: ReturnType<PublishQueueService['hold']>, message: string): void {
    this.busyId.set(i.id);
    call.subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.replace(updated);
        this.notify(updated.state === 'Waiting' && updated.errorCode === 'youtube-too-many-uploads'
          ? 'All your upload slots are busy; it goes as soon as one is free.'
          : message);
        this.load(true);
      },
      error: (e: Error) => {
        this.busyId.set(null);
        this.notify(e.message, 'err');
        this.load(true);
      },
    });
  }

  private replace(updated: PublishQueueItem): void {
    this.board.update((b) => (b ? { ...b, items: b.items.map((x) => (x.id === updated.id ? updated : x)) } : b));
    if (this.openId() === updated.id) this.fillForm(updated);
  }

  notify(text: string, kind: 'ok' | 'err' = 'ok'): void {
    this.toast.set({ text, kind });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), kind === 'err' ? 8000 : 4000);
  }

  // --- drawer ---

  open(i: PublishQueueItem): void {
    this.openId.set(i.id);
    this.playing.set(false);
    this.formError.set(null);
    this.categoryIdeas.set([]);
    this.slotIdeas.set([]);
    this.fillForm(i);
    if (i.canEdit) {
      this.suggestCategory();
      this.loadSlots();
    }
  }

  closeDrawer(): void {
    this.openId.set(null);
    this.form.set(null);
    this.playing.set(false);
  }

  private fillForm(i: PublishQueueItem): void {
    this.form.set({
      channelId: i.channelId,
      title: i.title,
      description: i.description,
      tagsText: i.tags.join(', '),
      categoryId: i.categoryId,
      privacy: i.privacy,
      madeForKids: i.madeForKids,
      notifySubscribers: i.notifySubscribers,
      firstComment: i.firstComment ?? '',
      scheduledLocal: i.scheduledAt ? toLocalInput(new Date(i.scheduledAt)) : '',
      mode: i.mode,
      notes: i.notes ?? '',
      removeThumbnail: false,
    });
  }

  patch<K extends keyof EditForm>(key: K, value: EditForm[K]): void {
    this.form.update((f) => (f ? { ...f, [key]: value } : f));
  }

  suggestCategory(): void {
    const f = this.form();
    const i = this.opened();
    if (!f || !i) return;
    this.queue.suggestCategory({ jobId: i.jobId, title: f.title, description: f.description, tags: this.formTags() }).subscribe({
      next: (list) => this.categoryIdeas.set(list),
      error: () => this.categoryIdeas.set([]),
    });
  }

  loadSlots(): void {
    const i = this.opened();
    const f = this.form();
    if (!i || !f) return;
    this.queue.slots(f.channelId, i.isVertical && (i.durationSeconds ?? 0) <= 180, 6).subscribe({
      next: (s) => this.slotIdeas.set(s),
      error: () => this.slotIdeas.set([]),
    });
  }

  pickSlot(slot: PublishSlot): void {
    this.patch('scheduledLocal', toLocalInput(new Date(slot.at)));
  }

  /** Saves the drawer; with `andSchedule`, a held/failed video goes back on the schedule too. */
  save(andSchedule = false): void {
    const i = this.opened();
    const f = this.form();
    if (!i || !f) return;

    const at = f.scheduledLocal ? fromLocalInput(f.scheduledLocal) : null;
    if (f.scheduledLocal && !at) {
      this.formError.set('That date and time can\'t be read.');
      return;
    }
    if (andSchedule && !at) {
      this.formError.set('Pick when it should go out.');
      return;
    }
    if (at && at.getTime() < Date.now() - 5 * 60_000) {
      this.formError.set('That time has passed. Pick a time from now on.');
      return;
    }

    const change: PublishQueueUpdate = {
      title: f.title.trim(),
      description: f.description,
      tags: this.formTags(),
      categoryId: f.categoryId,
      privacy: f.privacy,
      madeForKids: f.madeForKids,
      notifySubscribers: f.notifySubscribers,
      firstComment: f.firstComment.trim(),
      mode: f.mode,
      notes: f.notes,
      removeThumbnail: f.removeThumbnail,
    };
    if (f.channelId !== i.channelId) change.channelId = f.channelId;
    if (at && (!i.scheduledAt || at.getTime() !== Date.parse(i.scheduledAt))) change.scheduledAt = at.toISOString();

    this.saving.set(true);
    this.formError.set(null);
    this.queue.update(i.id, change).subscribe({
      next: (updated) => {
        if (andSchedule && updated.state !== 'Waiting') {
          this.queue.schedule(updated.id, at!.toISOString()).subscribe({
            next: (scheduled) => this.saved(scheduled, `Scheduled for ${this.when(scheduled.scheduledAt!)}.`),
            error: (e: Error) => this.saveFailed(e),
          });
          return;
        }
        this.saved(updated, 'Saved.');
      },
      error: (e: Error) => this.saveFailed(e),
    });
  }

  private saved(updated: PublishQueueItem, message: string): void {
    this.saving.set(false);
    this.replace(updated);
    this.notify(message);
  }

  private saveFailed(e: Error): void {
    this.saving.set(false);
    this.formError.set(e.message);
  }

  // --- add from exports ---

  openAdd(): void {
    this.addOpen.set(true);
    this.bulkResult.set(null);
    this.bulkError.set(null);
    this.picked.set(new Set());
    if (!this.bulkStartLocal()) {
      const start = new Date(Date.now() + 60 * 60_000);
      start.setMinutes(0, 0, 0);
      this.bulkStartLocal.set(toLocalInput(start));
    }
    this.candidatesLoading.set(true);
    this.queue.candidates().subscribe({
      next: (list) => {
        this.candidates.set(list);
        this.candidatesLoading.set(false);
      },
      error: (e: Error) => {
        this.bulkError.set(e.message);
        this.candidatesLoading.set(false);
      },
    });
  }

  togglePick(jobId: string): void {
    this.picked.update((set) => {
      const next = new Set(set);
      if (!next.delete(jobId)) {
        if (next.size >= 50) return set;
        next.add(jobId);
      }
      return next;
    });
  }

  pickAllShown(): void {
    const shown = this.shownCandidates().slice(0, 50).map((c) => c.jobId);
    const all = shown.every((id) => this.picked().has(id));
    this.picked.set(all ? new Set() : new Set(shown));
  }

  candidateThumb(c: PublishQueueCandidate): string | null {
    const at = Math.min(2, (c.durationSeconds ?? 4) / 3);
    return this.media.sign(`${environment.apiUrl}/api/youtube/render-jobs/${encodeURIComponent(c.jobId)}/frame?at=${at.toFixed(2)}&width=240`) ?? null;
  }

  submitBulk(): void {
    const jobIds = [...this.picked()];
    if (!jobIds.length || !this.bulkChannel()) return;
    const start = fromLocalInput(this.bulkStartLocal());
    if (this.bulkStrategy() === 'Interval' && !start) {
      this.bulkError.set('Pick when the first one goes out.');
      return;
    }

    this.bulkBusy.set(true);
    this.bulkError.set(null);
    this.queue.bulk({
      jobIds,
      channelId: this.bulkChannel(),
      strategy: this.bulkStrategy(),
      startAt: this.bulkStrategy() === 'Interval' && start ? start.toISOString() : null,
      intervalHours: this.bulkInterval(),
      timeZone: this.timeZone,
      mode: this.bulkMode(),
      privacy: this.bulkPrivacy(),
      madeForKids: this.bulkKids(),
      notifySubscribers: this.bulkNotify(),
      categoryId: this.bulkCategory(),
      titleSuffix: this.bulkSuffix().trim() || null,
      skipPublished: !this.showUsed(),
    }).subscribe({
      next: (result) => {
        this.bulkBusy.set(false);
        this.bulkResult.set(result);
        this.picked.set(new Set());
        this.load(true);
        if (result.failed === 0) {
          this.addOpen.set(false);
          this.notify(`${result.started} video${result.started === 1 ? '' : 's'} added to the board${result.skipped ? `, ${result.skipped} skipped` : ''}.`);
        }
      },
      error: (e: Error) => {
        this.bulkBusy.set(false);
        this.bulkError.set(e.message);
      },
    });
  }

  candidateName(jobId: string): string {
    return this.candidates().find((c) => c.jobId === jobId)?.name ?? jobId;
  }

  private restorePrefs(): void {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw) as { view?: BoardView; channel?: string };
      if (prefs.view === 'timeline' || prefs.view === 'columns' || prefs.view === 'week') this.view.set(prefs.view);
      if (typeof prefs.channel === 'string') this.channelFilter.set(prefs.channel);
    } catch {
      // Storage unavailable or unreadable: start with the defaults.
    }
  }
}

function isOpen(state: PublishQueueState): boolean {
  return state === 'Waiting' || state === 'Held' || state === 'Uploading';
}

function needsAttention(i: PublishQueueItem): boolean {
  return i.state === 'Failed' || (i.state === 'Waiting' && !!i.error);
}
