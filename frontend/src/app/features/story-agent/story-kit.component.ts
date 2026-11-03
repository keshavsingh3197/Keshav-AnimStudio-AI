import { Component, computed, inject, input, signal } from '@angular/core';

import { StoryKit, StoryMusic } from '../../core/models/story-agent.models';
import { StatusService } from '../../core/services/status.service';
import { copyText } from './story-agent.utils';

/** YouTube's own limits, which the server has already kept the kit within. Shown so the person can see how much room is left. */
const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT_BYTES = 5000;
const TAGS_LIMIT = 500;

/**
 * Everything needed to upload the finished video: titles to choose from, the description, tags, hashtags, chapters and
 * the two comments, each with a button that copies it exactly as YouTube wants it. Nothing here is sent anywhere.
 */
@Component({
  selector: 'app-story-kit',
  templateUrl: './story-kit.component.html',
  styleUrls: ['./story-kit.component.css'],
})
export class StoryKitComponent {
  private readonly status = inject(StatusService);

  readonly kit = input.required<StoryKit>();
  readonly music = input<StoryMusic | null>(null);

  readonly titleLimit = TITLE_LIMIT;
  readonly descriptionLimit = DESCRIPTION_LIMIT_BYTES;
  readonly tagsLimit = TAGS_LIMIT;

  /** What was last copied, so its button can say so for a moment. */
  readonly copied = signal<string | null>(null);
  /** The checklist items the person has ticked. This only helps them keep track; it is not saved. */
  readonly done = signal<ReadonlySet<number>>(new Set());

  readonly tagsText = computed(() => this.kit().tags.join(', '));
  readonly hashtagsText = computed(() => this.kit().hashtags.join(' '));
  readonly chaptersText = computed(() => this.kit().chapters.map((chapter) => `${chapter.stamp} ${chapter.title}`).join('\n'));

  async copy(id: string, text: string): Promise<void> {
    if (!text.trim()) return;
    if (await copyText(text)) {
      this.copied.set(id);
      setTimeout(() => this.copied.update((current) => (current === id ? null : current)), 1800);
    } else {
      this.status.showError('The browser did not allow copying. Allow clipboard access for this site and try again.');
    }
  }

  toggle(index: number): void {
    this.done.update((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  }
}
