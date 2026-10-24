import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Project } from '../../core/models/api.models';
import {
  ContentChecklistItem, ContentPlanItem, ContentPlanItemRequest, ContentPlanStatus, ContentSourceLink,
  ContentTopic, ContentUploadCandidate, STATUS_LABELS, STATUS_ORDER,
} from '../../core/models/calendar.models';
import { ApiService } from '../../core/services/api.service';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { copyText, errorText, fromLocalInput, safeHttps, toLocalInput } from './calendar-helpers';
import { PostRecoveryComponent, needsRecovery } from './post-recovery.component';

/**
 * One post: what it is, when it goes live, how far along it is, the YouTube video it became
 * (with the planned time checked - and set - on YouTube), and the source links saved for it.
 */
@Component({
  selector: 'app-plan-item-panel',
  imports: [DatePipe, FormsModule, RouterLink, PostRecoveryComponent],
  templateUrl: './plan-item-panel.component.html',
  styleUrl: './plan-item-panel.component.css',
})
export class PlanItemPanelComponent implements OnInit {
  private readonly api = inject(ContentCalendarService);
  private readonly projectsApi = inject(ApiService);

  readonly item = input<ContentPlanItem | null>(null);
  readonly topics = input.required<ContentTopic[]>();
  /** For a new post: the topic and time to start from. */
  readonly startTopicId = input<string | null>(null);
  readonly startAt = input<string | null>(null);

  readonly saved = output<ContentPlanItem>();
  readonly deleted = output<string>();
  readonly closed = output<void>();

  readonly statusLabels = STATUS_LABELS;
  readonly statuses = STATUS_ORDER;

  readonly current = signal<ContentPlanItem | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly links = signal<ContentSourceLink[]>([]);
  readonly candidates = signal<ContentUploadCandidate[] | null>(null);
  readonly busy = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly confirmDelete = signal(false);
  readonly checklist = signal<ContentChecklistItem[]>([]);

  topicId = '';
  title = '';
  notes = '';
  publishAtLocal = '';
  status: ContentPlanStatus = 'Idea';
  projectId = '';
  fileLink = '';
  videoInput = '';
  newCheck = '';
  newLinkUrl = '';
  newLinkNote = '';

  readonly topic = computed(() => this.topics().find((t) => t.id === (this.current()?.topicId ?? this.topicIdSignal())) ?? null);
  private readonly topicIdSignal = signal('');

  readonly scheduleDiffers = computed(() => {
    const c = this.current();
    const at = c?.youTube?.scheduledAt;
    return !!c && !!at && Math.abs(new Date(at).getTime() - new Date(c.publishAt).getTime()) > 2 * 60_000;
  });

  ngOnInit(): void {
    const it = this.item();
    if (it) {
      this.load(it);
    } else {
      this.topicId = this.startTopicId() ?? this.topics().find((t) => !t.archived)?.id ?? '';
      this.topicIdSignal.set(this.topicId);
      const start = this.startAt() ?? defaultStart(this.topics().find((t) => t.id === this.topicId));
      this.publishAtLocal = toLocalInput(start);
      this.checklist.set((this.topics().find((t) => t.id === this.topicId)?.checklist ?? []).map((text) => ({ text, done: false })));
    }
    this.projectsApi.listProjects().subscribe({ next: (p) => this.projects.set(p), error: () => this.projects.set([]) });
  }

  private load(it: ContentPlanItem): void {
    this.current.set(it);
    this.topicId = it.topicId;
    this.topicIdSignal.set(it.topicId);
    this.title = it.title;
    this.notes = it.notes ?? '';
    this.publishAtLocal = toLocalInput(it.publishAt);
    this.status = it.status;
    this.projectId = it.projectId ?? '';
    this.fileLink = it.fileLink ?? '';
    this.checklist.set(it.checklist.map((c) => ({ ...c })));
    this.loadLinks();
  }

  onTopicChange(id: string): void {
    this.topicId = id;
    this.topicIdSignal.set(id);
  }

  // ---------------------------------------------------------------- checklist

  toggleCheck(index: number): void {
    this.checklist.update((list) => list.map((c, i) => (i === index ? { ...c, done: !c.done } : c)));
    if (this.current()) this.save(true);
  }

  addCheck(): void {
    const text = this.newCheck.trim();
    if (!text) return;
    this.checklist.update((list) => [...list, { text, done: false }]);
    this.newCheck = '';
  }

  removeCheck(index: number): void {
    this.checklist.update((list) => list.filter((_, i) => i !== index));
  }

  readonly checklistDone = computed(() => this.checklist().filter((c) => c.done).length);

  // ---------------------------------------------------------------- save

  save(quiet = false): void {
    const publishAt = fromLocalInput(this.publishAtLocal);
    if (!this.topicId) return this.error.set('Pick a topic.');
    if (!this.title.trim()) return this.error.set('Give the post a title.');
    if (!publishAt) return this.error.set('Pick the date and time it goes live.');

    const body: ContentPlanItemRequest = {
      topicId: this.topicId,
      title: this.title.trim(),
      notes: this.notes.trim() || null,
      publishAt,
      status: this.status,
      checklist: this.checklist(),
      projectId: this.projectId || null,
      fileLink: this.fileLink.trim() || null,
    };
    const c = this.current();
    this.run('save', c ? this.api.updateItem(c.id, body) : this.api.createItem(body), (saved) => {
      this.apply(saved);
      if (!quiet) this.notice.set('Saved.');
    });
  }

  markReady(): void {
    const c = this.current();
    if (!c) {
      this.status = 'Ready';
      return;
    }
    this.run('status', this.api.setStatus(c.id, 'Ready'), (saved) => this.apply(saved));
  }

  readonly showRecovery = computed(() => {
    const c = this.current();
    return !!c && needsRecovery(c);
  });

  /** A recovery action moved this post (and, for a swap, another one). */
  recovered(list: ContentPlanItem[]): void {
    const c = this.current();
    for (const saved of list) {
      if (saved.id === c?.id) this.apply(saved);
      else this.saved.emit(saved);
    }
    const mine = list.find((i) => i.id === c?.id);
    if (mine) {
      this.notice.set(mine.status === 'Skipped'
        ? 'Skipped.'
        : `Moved to ${new Date(mine.publishAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`);
    }
  }

  remove(): void {
    const c = this.current();
    if (!c) return;
    this.run('delete', this.api.deleteItem(c.id), () => this.deleted.emit(c.id));
  }

  // ---------------------------------------------------------------- YouTube

  linkVideo(reference?: string): void {
    const c = this.current();
    const value = (reference ?? this.videoInput).trim();
    if (!c || !value) return;
    this.run('link', this.api.linkVideo(c.id, value), (saved) => {
      this.videoInput = '';
      this.candidates.set(null);
      this.apply(saved);
      this.notice.set(saved.status === 'Scheduled' ? 'Linked - YouTube will publish it at the planned time.' : 'Linked.');
    });
  }

  findUploads(): void {
    const c = this.current();
    if (!c) return;
    this.run('find', this.api.candidates(c.id), (list) => this.candidates.set(list));
  }

  sync(): void {
    const c = this.current();
    if (c) this.run('sync', this.api.syncVideo(c.id), (saved) => this.apply(saved));
  }

  schedule(): void {
    const c = this.current();
    if (!c) return;
    this.run('schedule', this.api.scheduleVideo(c.id), (saved) => {
      this.apply(saved);
      this.notice.set('YouTube will publish it at the planned time.');
    });
  }

  confirmLink(): void {
    const c = this.current();
    if (c) this.run('confirm', this.api.confirmVideo(c.id), (saved) => this.apply(saved));
  }

  unlink(): void {
    const c = this.current();
    if (c) this.run('unlink', this.api.unlinkVideo(c.id), (saved) => this.apply(saved));
  }

  // ---------------------------------------------------------------- links

  private loadLinks(): void {
    const c = this.current();
    if (!c) return;
    this.api.listLinks(c.topicId).subscribe({
      next: (list) => this.links.set(list.filter((l) => !l.planItemId || l.planItemId === c.id)),
      error: () => this.links.set([]),
    });
  }

  readonly postLinks = computed(() => this.links().filter((l) => l.planItemId === this.current()?.id));
  readonly topicLinks = computed(() => this.links().filter((l) => !l.planItemId));

  addLink(): void {
    const c = this.current();
    const url = this.newLinkUrl.trim();
    if (!c || !url) return;
    this.run('add-link', this.api.addLink({ url, note: this.newLinkNote.trim() || null, topicId: c.topicId, planItemId: c.id, used: false }), () => {
      this.newLinkUrl = '';
      this.newLinkNote = '';
      this.loadLinks();
    });
  }

  attachLink(link: ContentSourceLink): void {
    const c = this.current();
    if (!c) return;
    this.run('attach', this.api.updateLink(link.id, { title: link.title, note: link.note, topicId: c.topicId, planItemId: c.id, used: link.used }),
      () => this.loadLinks());
  }

  toggleUsed(link: ContentSourceLink): void {
    this.run('used', this.api.updateLink(link.id, { title: link.title, note: link.note, topicId: link.topicId, planItemId: link.planItemId, used: !link.used }),
      () => this.loadLinks());
  }

  async copy(text: string, what: string): Promise<void> {
    this.notice.set((await copyText(text)) ? `${what} copied.` : 'Copy failed - select and copy it by hand.');
  }

  tagsText(): string {
    return (this.topic()?.tags ?? []).join(' ');
  }

  href(url: string | null | undefined): string | null {
    return safeHttps(url);
  }

  thumbnail(url: string | null | undefined): string | null {
    return safeHttps(url);
  }

  // ---------------------------------------------------------------- plumbing

  private apply(saved: ContentPlanItem): void {
    this.load(saved);
    this.saved.emit(saved);
  }

  private run<T>(what: string, request: Observable<T>, done: (value: T) => void): void {
    this.busy.set(what);
    this.error.set(null);
    this.notice.set(null);
    request.subscribe({
      next: (value) => {
        this.busy.set(null);
        done(value);
      },
      error: (err: unknown) => {
        this.busy.set(null);
        this.error.set(errorText(err, 'That didn’t work. Try again.'));
      },
    });
  }
}

/** Tomorrow at the topic's publish time (viewer's clock), or 18:00. */
function defaultStart(topic: ContentTopic | undefined): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const [h, m] = (topic?.publishTime ?? '18:00').split(':').map(Number);
  d.setHours(h || 18, m || 0, 0, 0);
  return d.toISOString();
}
