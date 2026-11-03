import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { StoryRunSummary } from '../../core/models/story-agent.models';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { StoryTab } from './story-run.component';
import { STATUS_LABEL, Tone, clock, publicationState, statusTone, timeAgo, whenLabel } from './story-agent.utils';

const POLL_MS = 5000;

type ColumnId = 'script' | 'approved' | 'making' | 'ready' | 'scheduled' | 'published' | 'stopped';

interface Column {
  id: ColumnId;
  label: string;
  hint: string;
  /** The tab a card in this column opens on. */
  tab: StoryTab;
}

const COLUMNS: Column[] = [
  { id: 'script', label: 'Script', hint: 'Being written, or waiting for you to read and approve', tab: 'script' },
  { id: 'approved', label: 'Approved', hint: 'Add the pictures, then build', tab: 'pictures' },
  { id: 'making', label: 'Being made', hint: 'Pictures, voice, music and the render', tab: 'overview' },
  { id: 'ready', label: 'Ready to publish', hint: 'Watch it once, then send it to YouTube', tab: 'publish' },
  { id: 'scheduled', label: 'Scheduled', hint: 'On YouTube, going public at its time', tab: 'publish' },
  { id: 'published', label: 'On YouTube', hint: 'Uploaded: public, unlisted or private', tab: 'publish' },
  { id: 'stopped', label: 'Stopped', hint: 'Failed or stopped; open to try again', tab: 'overview' },
];

/** Where a story sits on the board: by where it is in the making, and once made, by what YouTube has of it. */
function columnOf(run: StoryRunSummary, now: number): ColumnId {
  switch (run.status) {
    case 'Researching':
    case 'WritingScript':
    case 'AwaitingScript':
      return 'script';
    case 'ScriptReady':
      return run.scriptApprovedAtUtc ? 'approved' : 'script';
    case 'Building':
      return 'making';
    case 'Failed':
    case 'Cancelled':
      return 'stopped';
    default:
      if (!run.publication) return 'ready';
      return publicationState(run.publication, now).state === 'scheduled' ? 'scheduled' : 'published';
  }
}

/**
 * Every story in one place, as a board: what is still being written, what waits for the person, what is being made,
 * what is ready to publish, and what is already on YouTube - scheduled or live. A card opens the story on the tab its
 * column is about. Nothing here changes a story; it is the map, and the story page is where the work happens.
 */
@Component({
  selector: 'app-story-board',
  imports: [RouterLink],
  templateUrl: './story-board.component.html',
  styleUrls: ['./story-board.component.css'],
})
export class StoryBoardComponent {
  private readonly stories = inject(StoryAgentService);

  /** Null until the first answer, so the board can tell "loading" from "none yet". */
  readonly runs = signal<StoryRunSummary[] | null>(null);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  /** Object URLs of the cover pictures, by story and scene; revoked when the board closes. */
  readonly covers = signal<Record<string, string>>({});

  readonly label = STATUS_LABEL;
  readonly tone = statusTone;
  readonly ago = timeAgo;
  readonly clock = clock;
  readonly when = whenLabel;
  readonly videoState = publicationState;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.runs() ?? [];
    return q ? all.filter((run) => run.title.toLowerCase().includes(q)) : all;
  });

  readonly columns = computed(() => {
    const now = Date.now();
    const placed = new Map<ColumnId, StoryRunSummary[]>(COLUMNS.map((c) => [c.id, []]));
    for (const run of this.filtered()) placed.get(columnOf(run, now))!.push(run);
    // Something scheduled shows soonest first; everything else newest first, as the server sends it.
    placed.get('scheduled')!.sort((a, b) => Date.parse(a.publication!.publishAtUtc!) - Date.parse(b.publication!.publishAtUtc!));
    return COLUMNS.map((column) => ({ ...column, runs: placed.get(column.id)! }));
  });

  readonly counts = computed(() => {
    const columns = this.columns();
    const size = (id: ColumnId) => columns.find((c) => c.id === id)!.runs.length;
    return {
      total: this.filtered().length,
      waiting: (this.filtered().filter((r) => r.status === 'AwaitingScript' || (r.status === 'ScriptReady' && !r.scriptApprovedAtUtc)).length) + size('ready'),
      making: size('making'),
      scheduled: size('scheduled'),
      published: size('published'),
    };
  });

  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private fetchingCovers = false;
  private readonly failedCovers = new Set<string>();

  constructor() {
    this.refresh();
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      if (this.timer !== null) clearTimeout(this.timer);
      Object.values(this.covers()).forEach((url) => URL.revokeObjectURL(url));
    });
  }

  refresh(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.stories.list().subscribe({
      next: (runs) => {
        if (this.destroyed) return;
        this.error.set(null);
        this.runs.set(runs);
        void this.loadCovers();
        // Only a story being made changes by itself, so only then is the board asked again.
        if (runs.some((run) => run.working)) this.timer = setTimeout(() => this.refresh(), POLL_MS);
      },
      error: (failure: unknown) => {
        if (this.destroyed) return;
        this.error.set(failure instanceof ApiFailure ? failure.message : 'Your stories could not be loaded.');
        if (this.runs() === null) this.runs.set([]);
      },
    });
  }

  cover(run: StoryRunSummary): string | null {
    return run.coverScene === null ? null : (this.covers()[this.coverKey(run)] ?? null);
  }

  tabFor(column: Column): { tab: StoryTab } {
    return { tab: column.tab };
  }

  stateOf(run: StoryRunSummary): { label: string; tone: Tone } {
    return run.publication ? publicationState(run.publication) : { label: STATUS_LABEL[run.status], tone: statusTone(run.status) };
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private coverKey(run: StoryRunSummary): string {
    return `${run.id}:${run.coverScene}`;
  }

  /** Fetches the cover pictures one at a time, through the API so they carry the person's identity. */
  private async loadCovers(): Promise<void> {
    if (this.fetchingCovers) return;
    this.fetchingCovers = true;
    try {
      for (;;) {
        const wanted = (this.runs() ?? []).find((run) => {
          const key = this.coverKey(run);
          return run.coverScene !== null && !this.covers()[key] && !this.failedCovers.has(key);
        });
        if (!wanted || this.destroyed) break;

        const key = this.coverKey(wanted);
        try {
          const blob = await lastValueFrom(this.stories.sceneImage(wanted.id, wanted.coverScene!));
          if (this.destroyed) break;
          this.covers.update((all) => ({ ...all, [key]: URL.createObjectURL(blob) }));
        } catch {
          this.failedCovers.add(key);
        }
      }
    } finally {
      this.fetchingCovers = false;
    }
  }
}
