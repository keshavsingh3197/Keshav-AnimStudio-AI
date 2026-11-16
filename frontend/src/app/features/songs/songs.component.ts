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

/**
 * Pieces of a music direction. One of each is drawn for "fresh tune", so every song (and every template) asks for a
 * different melody instead of the same default arrangement.
 */
const RAGAS = ['Yaman', 'Bhairav', 'Bhupali', 'Kafi', 'Desh', 'Bhimpalasi', 'Khamaj', 'Durga', 'Malkauns', 'Pahadi', 'Shivranjani', 'Bageshree'];
const TEMPOS = ['slow 64 BPM', 'gentle 72 BPM', 'flowing 84 BPM', 'lilting 96 BPM', 'lively 108 BPM', 'joyful 120 BPM'];
const INSTRUMENTS = [
  'harmonium and tabla', 'bansuri flute and soft strings', 'sitar and tanpura drone', 'santoor and light percussion',
  'acoustic guitar and dholak', 'shehnai and temple bells', 'veena and mridangam', 'piano and soft pads with manjira',
];
const VOICES = ['warm male voice', 'soft female voice', 'male and female duet', 'small chorus answering the lead'];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** What a pasted template answer is split into. */
interface PastedSong { title: string | null; musicStyle: string | null; lyrics: string | null }

/** Reads TITLE:, MUSIC STYLE: and LYRICS: from an outside AI's answer (markdown and code fences tolerated). */
export function parsePastedSong(reply: string): PastedSong {
  const text = (reply ?? '').replace(/\r/g, '').replace(/```[a-z]*\n?/gi, '').replace(/\*\*/g, '');
  const line = (label: string) => {
    const m = new RegExp(`^\\s*${label}\\s*[:：-]\\s*(.+)$`, 'im').exec(text);
    return m ? m[1].trim() : null;
  };
  const lyricsAt = /^\s*LYRICS\s*[:：]?\s*$/im.exec(text);
  let lyrics: string | null = null;
  if (lyricsAt) {
    lyrics = text.slice(lyricsAt.index + lyricsAt[0].length).trim();
  } else if (/\[(verse|chorus|intro|bridge|outro|मुखड़ा|अंतरा)/i.test(text)) {
    // No LYRICS: label: take everything from the first section tag.
    const first = text.search(/\[(verse|chorus|intro|bridge|outro|मुखड़ा|अंतरा)/i);
    lyrics = text.slice(first).trim();
  }
  return { title: line('TITLE'), musicStyle: line('MUSIC STYLE'), lyrics: lyrics || null };
}

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

  /** 'ai' drafts here with the configured text model; 'template' gives a prompt for any outside AI tool. */
  readonly lyricsSource = signal<'ai' | 'template'>('ai');
  readonly templateReply = signal('');

  /** The prompt to copy into ChatGPT, Gemini or Claude; built from the form so it always matches the choices. */
  readonly lyricsTemplate = computed(() => {
    const hindi = this.language() === 'hi';
    const style = this.styleLabel(this.style());
    const feel = this.mood().trim();
    const full = this.fullLength();
    const max = this.maxLyricsChars();
    return [
      `Write an original ${style} song${hindi ? ' in Hindi' : ' in English'} about the story below, ready for an AI music generator (Google Lyria).`,
      '',
      'STORY / THEME:',
      this.theme().trim() || '(describe the story, festival or deity here)',
      '',
      'RULES',
      `- Language: ${hindi ? 'pure, singable Hindi in Devanagari script (simple words, natural rhyme).' : 'simple, singable English with natural rhyme.'}`,
      `- Structure: ${full ? '[Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus], [Outro]' : 'one short [Verse] and one [Chorus], about 30 seconds sung'}. Section names in square brackets on their own line.`,
      `- Keep the whole lyrics under ${max} characters. Short lines (4 to 9 words) that are easy to sing; a chorus that repeats a memorable line.`,
      '- Tell the story faithfully and respectfully; no copied lines from existing songs.',
      `- MUSIC STYLE: invent a FRESH, specific melody direction for this song (raga or scale, tempo in BPM, lead instruments, rhythm, vocal type, mood)${feel ? `, built around: ${feel}` : ''}. Make it different from a generic default arrangement. One line, under 80 characters.`,
      '',
      'OUTPUT - return ONLY these three parts, nothing else:',
      'TITLE: <song title>',
      'MUSIC STYLE: <one line>',
      'LYRICS:',
      '[Verse 1]',
      '...',
    ].join('\n');
  });

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

  async copyTemplate(): Promise<void> {
    this.clearMessages();
    try {
      await navigator.clipboard.writeText(this.lyricsTemplate());
      this.notice.set('Template copied. Paste it into ChatGPT, Gemini or Claude, then paste the whole answer below.');
    } catch {
      this.error.set('Copy did not work in this browser. Select the template text and copy it by hand.');
    }
  }

  /** Fills title, feel and lyrics from the pasted answer. The text is only placed in the form; nothing runs or is sent. */
  usePastedSong(): void {
    this.clearMessages();
    const parsed = parsePastedSong(this.templateReply());
    if (!parsed.lyrics && !parsed.title) {
      this.error.set('No TITLE or LYRICS found in that answer. Paste the full reply of your AI tool.');
      return;
    }
    if (this.lyrics().trim() && parsed.lyrics && !confirm('Replace the lyrics you have with the pasted ones?')) return;
    if (parsed.title) this.title.set(parsed.title.slice(0, 120));
    if (parsed.musicStyle) this.mood.set(parsed.musicStyle.slice(0, 80));
    if (parsed.lyrics) {
      this.lyrics.set(parsed.lyrics.slice(0, 6000));
      this.instrumental.set(false);
    }
    this.notice.set(this.lyrics().length > this.maxLyricsChars()
      ? 'Pasted. The lyrics are longer than Lyria accepts: shorten a verse before composing.'
      : 'Pasted into the form below. Read and edit the lyrics, then compose.');
  }

  /** A new, specific music direction (raga, tempo, instruments, voice) so the next song gets a fresh tune. */
  freshTune(): void {
    const base = `Raag ${pick(RAGAS)}, ${pick(TEMPOS)}, ${pick(INSTRUMENTS)}`;
    const withVoice = `${base}, ${pick(VOICES)}`;
    // The feel field holds 80 characters: drop the voice rather than cut a word in half.
    this.mood.set(withVoice.length <= 80 ? withVoice : base.slice(0, 80));
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
