import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { Asset } from '../../core/models/api.models';
import { MusicOptions, MusicSort, MusicTrack } from '../../core/models/music.models';
import { MusicLibraryService } from '../../core/services/music-library.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

interface SortTab {
  id: MusicSort;
  label: string;
  hint: string;
}

/** What adding a track does: the project's background music, the asset library, or the open timeline. */
export type MusicAddTarget = 'background' | 'assets' | 'timeline';

const SORT_TABS: SortTab[] = [
  { id: 'Trending', label: '🔥 Trending', hint: 'Most played this week' },
  { id: 'PopularMonth', label: '📈 This month', hint: 'Most played this month' },
  { id: 'Top', label: '🏆 All-time top', hint: 'Most played ever' },
  { id: 'Newest', label: '🆕 New releases', hint: 'Newest first' },
];

/**
 * Find music for the project's videos: trending and top charts, search, and filters for genre,
 * mood, tempo and length. Everything listed is Creative Commons music the server has checked
 * against this project's licence settings; adding a track puts it in the asset library, where
 * the settings page, the video editor and the mixer pick it up like any uploaded audio.
 * Inside the video studio (`inStudio`) a track goes straight onto the timeline instead.
 */
@Component({
  selector: 'app-music-library',
  imports: [FormsModule, RouterLink],
  templateUrl: './music-library.component.html',
  styleUrls: ['./music-library.component.css'],
})
export class MusicLibraryComponent implements OnInit {
  private readonly api = inject(MusicLibraryService);
  private readonly status = inject(StatusService);
  readonly store = inject(ProjectStore);

  /** Shown in the video studio: offers "Add to timeline" in place of the background-music choice. */
  readonly inStudio = input(false);
  /** The library asset of a track added with "Add to timeline", for the studio to place. */
  readonly addToTimeline = output<Asset>();

  readonly sortTabs = SORT_TABS;

  readonly options = signal<MusicOptions | null>(null);
  readonly tracks = signal<MusicTrack[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  readonly error = signal<string | null>(null);

  readonly query = signal('');
  readonly sort = signal<MusicSort>('Trending');
  readonly genre = signal('');
  readonly mood = signal('');
  readonly tempo = signal('');
  readonly length = signal('');
  readonly instrumental = signal(false);
  /** Hides tracks this project can't use, instead of listing them greyed out. */
  readonly usableOnly = signal(true);

  readonly playingId = signal<string | null>(null);
  readonly importingId = signal<string | null>(null);

  readonly visible = computed(() =>
    this.usableOnly() ? this.tracks().filter((t) => t.usable) : this.tracks());
  readonly hiddenCount = computed(() => this.tracks().length - this.visible().length);
  readonly searching = computed(() => this.query().trim().length > 0);
  readonly backgroundId = computed(() => this.store.project()?.backgroundMusicAssetId ?? null);
  readonly filtersActive = computed(() =>
    Boolean(this.genre() || this.mood() || this.tempo() || this.length() || this.instrumental()));

  private page = 1;
  private requestSeq = 0;
  private debounce: ReturnType<typeof setTimeout> | null = null;
  private readonly audio = new Audio();

  constructor() {
    this.audio.preload = 'none';
    this.audio.addEventListener('ended', () => this.playingId.set(null));
    this.audio.addEventListener('error', () => {
      if (this.playingId()) this.status.notify(['That preview could not be played.']);
      this.playingId.set(null);
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.debounce) clearTimeout(this.debounce);
      this.audio.pause();
      this.audio.removeAttribute('src');
    });
  }

  ngOnInit(): void {
    this.api.options().subscribe({
      next: (options) => {
        this.options.set(options);
        if (options.configured) this.search();
      },
      error: (e: unknown) => this.error.set(this.message(e)),
    });
  }

  setSort(sort: MusicSort): void {
    if (this.sort() === sort && !this.searching()) return;
    // A chart is a ranking of everything, so picking one clears the search box.
    this.query.set('');
    this.sort.set(sort);
    this.search();
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.search(), 400);
  }

  onFilterChange(): void {
    this.search();
  }

  clearFilters(): void {
    this.genre.set('');
    this.mood.set('');
    this.tempo.set('');
    this.length.set('');
    this.instrumental.set(false);
    this.search();
  }

  search(): void {
    this.page = 1;
    this.load(false);
  }

  loadMore(): void {
    if (this.loading() || !this.hasMore()) return;
    this.page++;
    this.load(true);
  }

  togglePreview(track: MusicTrack): void {
    if (this.playingId() === track.id) {
      this.audio.pause();
      this.playingId.set(null);
      return;
    }
    if (!track.previewUrl) return;
    this.audio.src = track.previewUrl;
    this.playingId.set(track.id);
    this.audio.play().catch(() => this.playingId.set(null));
  }

  add(track: MusicTrack, target: MusicAddTarget): void {
    const projectId = this.store.project()?.id;
    if (!projectId || this.importingId()) return;
    this.importingId.set(track.id);

    this.api.import(projectId, track.id, target === 'background').subscribe({
      next: (result) => {
        this.importingId.set(null);
        this.tracks.update((list) => list.map((t) => (t.id === track.id ? { ...t, assetId: result.asset.id } : t)));
        this.store.refreshAssets();
        if (result.usedAsBackground) {
          this.store.project.update((p) => p && { ...p, backgroundMusicAssetId: result.asset.id });
        }
        if (target === 'timeline') {
          if (this.playingId()) this.togglePreview(track);
          this.addToTimeline.emit(result.asset);
          this.status.notify([`"${track.title}" added to the timeline.`]);
          return;
        }
        this.status.notify([result.usedAsBackground
          ? `"${track.title}" is now the background music.`
          : result.alreadyAdded ? `"${track.title}" is already in your assets.` : `"${track.title}" added to your assets.`]);
      },
      error: (e: unknown) => {
        this.importingId.set(null);
        this.status.notify([this.message(e)]);
      },
    });
  }

  isBackground(track: MusicTrack): boolean {
    return Boolean(track.assetId) && track.assetId === this.backgroundId();
  }

  duration(seconds: number): string {
    const s = Math.max(0, Math.round(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  licenseTone(track: MusicTrack): 'ok' | 'warn' | 'err' {
    if (!track.usable) return 'err';
    return track.licenseClass === 'AttributionOnly' || track.licenseClass === 'PublicDomain' ? 'ok' : 'warn';
  }

  private load(append: boolean): void {
    const projectId = this.store.project()?.id;
    if (!projectId || !this.options()?.configured) return;

    const seq = ++this.requestSeq;
    this.loading.set(true);
    this.error.set(null);

    this.api.search(projectId, {
      q: this.query().trim() || undefined,
      // With text, the best match first; the chart tabs apply when browsing.
      sort: this.searching() ? 'BestMatch' : this.sort(),
      genre: this.genre() || undefined,
      mood: this.mood() || undefined,
      tempo: this.tempo() || undefined,
      length: this.length() || undefined,
      instrumental: this.instrumental(),
      page: this.page,
    }).subscribe({
      next: (result) => {
        if (seq !== this.requestSeq) return;
        this.tracks.update((list) => (append ? [...list, ...result.tracks.filter((t) => !list.some((x) => x.id === t.id))] : result.tracks));
        this.hasMore.set(result.hasMore);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        if (seq !== this.requestSeq) return;
        this.loading.set(false);
        this.error.set(this.message(e));
      },
    });
  }

  private message(e: unknown): string {
    return e instanceof ApiFailure ? e.message : 'Something went wrong. Try again.';
  }
}
