import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { Song, SongSeed, SongsService } from '../../core/services/songs.service';
import { saveBlob } from '../story-agent/story-agent.utils';

const STYLES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'devotional bhajan', label: 'Bhajan' },
  { value: 'aarti', label: 'Aarti' },
  { value: 'kirtan, call and response', label: 'Kirtan' },
  { value: 'mantra chant, meditative', label: 'Mantra chant' },
  { value: 'devotional pop', label: 'Devotional pop' },
  { value: 'Indian folk', label: 'Folk' },
  { value: 'lullaby (lori)', label: 'Lullaby (Lori)' },
  { value: 'cinematic devotional, orchestral', label: 'Cinematic devotional' },
  { value: 'story ballad', label: 'Story ballad' },
];

@Component({
  selector: 'app-songs',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './songs.component.html',
  styleUrl: './songs.component.css',
})
export class SongsComponent implements OnInit, OnDestroy {
  private readonly api = inject(SongsService);

  readonly styles = STYLES;

  // 1. What the song is about
  readonly theme = signal('');
  readonly language = signal<'hi' | 'en'>('hi');
  readonly style = signal(STYLES[0].value);
  readonly mood = signal('');
  readonly sourcePostId = signal<string | null>(null);

  // 2. Lyrics
  readonly title = signal('');
  readonly lyrics = signal('');
  readonly instrumental = signal(false);

  // 3. Compose
  readonly fullLength = signal(true);

  readonly songs = signal<Song[]>([]);
  readonly composerConfigured = signal(true);
  readonly maxLyricsChars = signal(1600);
  readonly loading = signal(true);
  readonly busy = signal<'lyrics' | 'compose' | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  /** Object URLs of fetched audio, by song id; revoked when the page closes. */
  readonly audioUrls = signal<Record<string, string>>({});
  readonly expanded = signal<string | null>(null);

  readonly lyricsTooLong = computed(() => this.lyrics().length > this.maxLyricsChars());
  readonly canWriteLyrics = computed(() => this.theme().trim().length >= 3 && !this.busy());
  readonly canCompose = computed(() =>
    !this.busy()
    && this.composerConfigured()
    && this.title().trim().length > 0
    && (this.instrumental() || (this.lyrics().trim().length > 0 && !this.lyricsTooLong())));

  async ngOnInit(): Promise<void> {
    this.applySeed(history.state as SongSeed | null);
    await this.load();
  }

  ngOnDestroy(): void {
    for (const url of Object.values(this.audioUrls())) URL.revokeObjectURL(url);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this.api.list());
      this.songs.set(list.songs);
      this.composerConfigured.set(list.composerConfigured);
      this.maxLyricsChars.set(list.maxLyricsChars);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'Your songs could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  async writeLyrics(): Promise<void> {
    if (!this.canWriteLyrics()) return;
    if (this.lyrics().trim() && !confirm('Replace the lyrics you have with a new AI draft?')) return;
    this.busy.set('lyrics');
    this.clearMessages();
    try {
      const draft = await firstValueFrom(this.api.writeLyrics({
        theme: this.theme().trim(), language: this.language(), style: this.style(), mood: this.mood().trim() || null,
      }));
      this.title.set(draft.title);
      this.lyrics.set(draft.lyrics);
      this.instrumental.set(false);
      if (draft.musicStyle && !this.mood().trim()) this.mood.set(draft.musicStyle.slice(0, 80));
      this.notice.set(`Lyrics drafted by ${draft.provider}. Read and edit them before composing.`);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The lyrics could not be written.'));
    } finally {
      this.busy.set(null);
    }
  }

  async compose(): Promise<void> {
    if (!this.canCompose()) return;
    this.busy.set('compose');
    this.clearMessages();
    try {
      const song = await firstValueFrom(this.api.compose({
        title: this.title().trim(),
        theme: this.theme().trim() || null,
        language: this.language(),
        style: this.style(),
        mood: this.mood().trim() || null,
        lyrics: this.instrumental() ? null : this.lyrics().trim(),
        instrumental: this.instrumental(),
        fullLength: this.fullLength(),
        sourcePostId: this.sourcePostId(),
      }));
      this.songs.update((list) => [song, ...list]);
      this.expanded.set(song.id);
      await this.play(song);
      this.notice.set(`"${song.title}" is ready. Listen below; download it to use in a video or the Music Release kit.`);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The song could not be composed.'));
    } finally {
      this.busy.set(null);
    }
  }

  /** Fetches the song's audio once (with the caller's identity) and keeps a local URL for the player. */
  async play(song: Song): Promise<void> {
    if (this.audioUrls()[song.id]) return;
    try {
      const blob = await firstValueFrom(this.api.audio(song.id));
      const url = URL.createObjectURL(blob);
      this.audioUrls.update((urls) => ({ ...urls, [song.id]: url }));
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The song could not be loaded.'));
    }
  }

  async download(song: Song): Promise<void> {
    try {
      const blob = await firstValueFrom(this.api.audio(song.id));
      const ext = song.mimeType === 'audio/mpeg' ? 'mp3' : 'wav';
      saveBlob(blob, `${song.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'song'}.${ext}`);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The song could not be downloaded.'));
    }
  }

  async remove(song: Song): Promise<void> {
    if (!confirm(`Delete "${song.title}"? This cannot be undone.`)) return;
    try {
      await firstValueFrom(this.api.delete(song.id));
      const url = this.audioUrls()[song.id];
      if (url) URL.revokeObjectURL(url);
      this.songs.update((list) => list.filter((s) => s.id !== song.id));
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The song could not be deleted.'));
    }
  }

  /** Loads a song's words and settings back into the form, to compose a new take or a variation. */
  reuse(song: Song): void {
    this.title.set(song.title);
    this.theme.set(song.theme ?? '');
    this.language.set(song.language);
    this.style.set(song.style);
    this.mood.set(song.mood ?? '');
    this.lyrics.set(song.lyrics ?? '');
    this.instrumental.set(song.instrumental);
    this.notice.set(`Loaded "${song.title}". Change anything, then compose again.`);
    this.error.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggle(song: Song): void {
    this.expanded.set(this.expanded() === song.id ? null : song.id);
    if (this.expanded() === song.id) void this.play(song);
  }

  styleLabel(value: string): string {
    return STYLES.find((s) => s.value === value)?.label ?? value;
  }

  duration(seconds?: number | null): string {
    if (!seconds) return '';
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  private applySeed(seed: SongSeed | null): void {
    if (!seed || typeof seed !== 'object') return;
    if (typeof seed.theme === 'string') this.theme.set(seed.theme.slice(0, 6000));
    if (typeof seed.title === 'string') this.title.set(seed.title.slice(0, 120));
    if (seed.language === 'hi' || seed.language === 'en') this.language.set(seed.language);
    if (typeof seed.postId === 'string') this.sourcePostId.set(seed.postId.slice(0, 80));
    if (seed.theme) this.notice.set('The auto post\'s story is filled in below. Draft lyrics with AI, or write your own.');
  }

  private clearMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private message(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure || failure instanceof Error ? failure.message : fallback;
  }
}
