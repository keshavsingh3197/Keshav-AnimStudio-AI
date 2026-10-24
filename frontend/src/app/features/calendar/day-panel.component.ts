import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentPlanItem, ContentTopic, STATUS_LABELS, worstAttention } from '../../core/models/calendar.models';
import { safeHttps } from './calendar-helpers';
import { PostRecoveryComponent, needsRecovery } from './post-recovery.component';

/** The four things a post goes through before it is out; each is done or not. */
interface Step {
  label: string;
  done: boolean;
  hint: string;
}

/**
 * Everything going out on one day: each post's topic, time, how far along it is (prepared,
 * uploaded, scheduled, live), its video on YouTube, where the work lives, and - for a post
 * that won't make it - the ways to keep the day covered.
 */
@Component({
  selector: 'app-day-panel',
  imports: [DatePipe, RouterLink, PostRecoveryComponent],
  templateUrl: './day-panel.component.html',
  styleUrls: ['./plan-item-panel.component.css', './day-panel.component.css'],
})
export class DayPanelComponent {
  readonly date = input.required<Date>();
  readonly items = input.required<ContentPlanItem[]>();
  readonly topics = input.required<ContentTopic[]>();

  readonly open = output<ContentPlanItem>();
  readonly changed = output<ContentPlanItem[]>();
  readonly add = output<Date>();
  readonly markReady = output<ContentPlanItem>();
  readonly closed = output<void>();

  readonly statusLabels = STATUS_LABELS;
  /** Post ids whose "running late" options are open. */
  readonly fixing = signal<ReadonlySet<string>>(new Set());

  readonly topicById = computed(() => new Map(this.topics().map((t) => [t.id, t])));

  readonly sorted = computed(() => [...this.items()].sort((a, b) => a.publishAt.localeCompare(b.publishAt)));

  readonly summary = computed(() => {
    const list = this.items().filter((i) => i.status !== 'Skipped');
    return {
      total: list.length,
      live: list.filter((i) => i.status === 'Published').length,
      onTrack: list.filter((i) => i.status === 'Ready' || i.status === 'Scheduled').length,
      toDo: list.filter((i) => i.status === 'Idea' || i.status === 'InProgress').length,
      skipped: this.items().length - list.length,
    };
  });

  /** Topics that post on this weekday but have nothing on the calendar for it. */
  readonly uncovered = computed(() => {
    const weekday = this.date().toLocaleDateString('en-US', { weekday: 'long' });
    const covered = new Set(this.items().map((i) => i.topicId));
    return this.topics().filter((t) => !t.archived && t.days.some((d) => d === weekday) && !covered.has(t.id));
  });

  topicOf(item: ContentPlanItem): ContentTopic | undefined {
    return this.topicById().get(item.topicId);
  }

  steps(item: ContentPlanItem): Step[] {
    const yt = item.youTube;
    const prepared = item.status !== 'Idea' && item.status !== 'InProgress' && item.status !== 'Skipped';
    const checklist = item.checklist.length ? ` (${item.checklist.filter((c) => c.done).length}/${item.checklist.length} steps)` : '';
    return [
      { label: 'Prepared', done: prepared, hint: prepared ? 'Marked ready' : `Not ready yet${checklist}` },
      { label: 'Uploaded', done: !!item.videoId, hint: item.videoId ? 'Video linked' : 'No YouTube video linked' },
      {
        label: 'Scheduled',
        done: item.status === 'Scheduled' || item.status === 'Published',
        hint: yt?.scheduledAt ? 'YouTube publishes it at the planned time' : 'YouTube has no publish time for it',
      },
      { label: 'Live', done: item.status === 'Published', hint: item.status === 'Published' ? 'Public on YouTube' : 'Not public yet' },
    ];
  }

  level(item: ContentPlanItem): string {
    return (worstAttention(item) ?? 'ok').toLowerCase();
  }

  canFix(item: ContentPlanItem): boolean {
    return needsRecovery(item);
  }

  toggleFix(item: ContentPlanItem): void {
    this.fixing.update((set) => {
      const next = new Set(set);
      if (!next.delete(item.id)) next.add(item.id);
      return next;
    });
  }

  recovered(list: ContentPlanItem[]): void {
    this.fixing.set(new Set());
    this.changed.emit(list);
  }

  href(url: string | null | undefined): string | null {
    return safeHttps(url);
  }

  statusClass(item: ContentPlanItem): string {
    return 'status st-' + item.status.toLowerCase();
  }
}
