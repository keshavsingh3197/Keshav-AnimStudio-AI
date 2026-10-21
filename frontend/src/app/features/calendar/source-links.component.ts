import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ContentSourceLink, ContentTopic } from '../../core/models/calendar.models';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { copyText, errorText, safeHttps } from './calendar-helpers';

const TOPIC_KEY = 'animstudio.links.topic';

/**
 * Every link downloaded in Media Studio or saved by hand, by topic - built for the phone:
 * pick a topic, copy or share a link straight into the app you remix or upload from.
 */
@Component({
  selector: 'app-source-links',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './source-links.component.html',
  styleUrl: './source-links.component.css',
})
export class SourceLinksComponent implements OnInit {
  private readonly api = inject(ContentCalendarService);

  readonly topics = signal<ContentTopic[]>([]);
  readonly links = signal<ContentSourceLink[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);

  readonly topicFilter = signal<string>(readTopic());
  readonly query = signal('');
  readonly unusedOnly = signal(false);
  readonly showAdd = signal(false);

  readonly canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  newUrl = '';
  newTitle = '';
  newNote = '';
  newTopic = '';

  readonly topicById = computed(() => new Map(this.topics().map((t) => [t.id, t])));

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const topic = this.topicFilter();
    return this.links().filter((l) => {
      if (topic === 'none' && l.topicId) return false;
      if (topic !== 'all' && topic !== 'none' && l.topicId !== topic) return false;
      if (this.unusedOnly() && l.used) return false;
      if (!q) return true;
      return l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
        || (l.note ?? '').toLowerCase().includes(q) || l.platformName.toLowerCase().includes(q);
    });
  });

  ngOnInit(): void {
    this.api.listTopics().subscribe({ next: (t) => this.topics.set(t), error: () => this.topics.set([]) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listLinks().subscribe({
      next: (list) => {
        this.links.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorText(err, 'Saved links could not be loaded.'));
      },
    });
  }

  setTopic(id: string): void {
    this.topicFilter.set(id);
    try { localStorage.setItem(TOPIC_KEY, id); } catch { /* per-viewer convenience only */ }
  }

  openAdd(): void {
    const t = this.topicFilter();
    this.newTopic = t !== 'all' && t !== 'none' ? t : '';
    this.showAdd.set(true);
  }

  add(): void {
    const url = this.newUrl.trim();
    if (!url) return;
    this.busyId.set('new');
    this.api.addLink({
      url,
      title: this.newTitle.trim() || null,
      note: this.newNote.trim() || null,
      topicId: this.newTopic || null,
      used: false,
    }).subscribe({
      next: (saved) => {
        this.busyId.set(null);
        this.links.update((list) => [saved, ...list.filter((l) => l.id !== saved.id)]);
        this.newUrl = this.newTitle = this.newNote = '';
        this.showAdd.set(false);
        this.notice.set('Link saved.');
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.error.set(errorText(err, 'The link could not be saved.'));
      },
    });
  }

  toggleUsed(link: ContentSourceLink): void {
    this.update(link, { used: !link.used });
  }

  moveTo(link: ContentSourceLink, topicId: string): void {
    // A post belongs to one topic, so moving the link off it drops the post too.
    this.update(link, { topicId: topicId || null, planItemId: topicId === link.topicId ? link.planItemId : null });
  }

  remove(link: ContentSourceLink): void {
    this.busyId.set(link.id);
    this.api.deleteLink(link.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.links.update((list) => list.filter((l) => l.id !== link.id));
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.error.set(errorText(err, 'The link could not be deleted.'));
      },
    });
  }

  async copy(link: ContentSourceLink): Promise<void> {
    this.notice.set((await copyText(link.url)) ? 'Link copied.' : 'Copy failed - long-press the link to copy it.');
  }

  async share(link: ContentSourceLink): Promise<void> {
    try {
      await navigator.share({ title: link.title, url: link.url });
    } catch {
      // Cancelled by the user, or the share sheet isn't available; nothing to report.
    }
  }

  href(url: string): string | null {
    return safeHttps(url);
  }

  topicName(id: string | null | undefined): string | null {
    return id ? this.topicById().get(id)?.name ?? null : null;
  }

  topicColor(id: string | null | undefined): string {
    return (id && this.topicById().get(id)?.color) || 'var(--border-bright)';
  }

  private update(link: ContentSourceLink, change: Partial<ContentSourceLink>): void {
    const next = { ...link, ...change };
    this.busyId.set(link.id);
    this.api.updateLink(link.id, {
      title: next.title, note: next.note, topicId: next.topicId, planItemId: next.planItemId, used: next.used,
    }).subscribe({
      next: (saved) => {
        this.busyId.set(null);
        this.links.update((list) => list.map((l) => (l.id === saved.id ? saved : l)));
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.error.set(errorText(err, 'The link could not be updated.'));
      },
    });
  }
}

function readTopic(): string {
  try {
    return localStorage.getItem(TOPIC_KEY) || 'all';
  } catch {
    return 'all';
  }
}
