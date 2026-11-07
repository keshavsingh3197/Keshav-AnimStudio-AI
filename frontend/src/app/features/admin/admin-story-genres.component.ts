import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { StoryFormat, StoryGenreMode, StoryLookStyle, StorySourceConfidence } from '../../core/models/story-agent.models';
import {
  GranthText,
  STORY_GENRE_ID,
  STORY_GENRE_LIMITS,
  StoryGenre,
  StoryGenreSource,
  StoryGenreTopic,
} from '../../core/models/story-genre.models';
import { StoryGenresService } from '../../core/services/story-genres.service';
import { parseUtc, relativeTime } from './admin-format';

type Note = { tone: 'ok' | 'err'; text: string };
type ListField = 'moods' | 'tags' | 'hashtags';

const LOOKS: readonly StoryLookStyle[] = ['Auto', 'Gentle', 'Cinematic', 'Lively', 'MusicVideo'];
const FORMATS: readonly StoryFormat[] = ['Wide', 'Vertical'];
const CONFIDENCES: readonly StorySourceConfidence[] = ['High', 'Medium', 'Low'];

/** A new genre starts as a creative one with the fields a story needs already sensible. */
function blankGenre(order: number): StoryGenre {
  return {
    id: '', name: '', nameHindi: null, description: '', icon: '📖', order, enabled: true, builtIn: false, mode: 'Creative',
    styleGuide: '', moods: [], defaultLanguage: 'hi', defaultTargetSeconds: 120, defaultFormat: 'Wide', lookStyle: 'Auto',
    imageStyle: null, musicQuery: null, speechStyle: null, tags: [], hashtags: [], links: [], titleSuffix: null,
    pinnedLine: null, category: 'Entertainment', madeForKids: false, topics: [],
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Commas or new lines separate a list typed into one box. */
function splitList(text: string): string[] {
  return text.split(/[,\n]/).map((v) => v.trim()).filter((v) => v.length > 0);
}

/**
 * The Story Agent's genres - devotional, funny, kids' stories and whatever else is added - and what each one bundles:
 * the writer's style guide, the topics (with the Granth sources for a scripture genre), the defaults a new story starts
 * with, and the tags, hashtags and links of its YouTube kit. A new story picks one genre and takes a copy of all of it.
 */
@Component({
  selector: 'app-admin-story-genres',
  templateUrl: './admin-story-genres.component.html',
  styleUrls: ['./admin-ui.css', './admin-story-genres.component.css'],
})
export class AdminStoryGenresComponent {
  private readonly api = inject(StoryGenresService);

  readonly limits = STORY_GENRE_LIMITS;
  readonly looks = LOOKS;
  readonly formats = FORMATS;
  readonly confidences = CONFIDENCES;

  readonly genres = signal<StoryGenre[]>([]);
  readonly texts = signal<GranthText[]>([]);
  readonly categories = signal<string[]>([]);
  readonly scriptureSource = signal('');
  readonly loading = signal(true);
  readonly failure = signal<string | null>(null);

  /** The genre being edited, as a copy; null when nothing is open. */
  readonly draft = signal<StoryGenre | null>(null);
  /** True while the draft is a genre that does not exist yet. */
  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly confirmDelete = signal(false);
  readonly note = signal<Note | null>(null);
  readonly openTopic = signal<number | null>(null);
  readonly query = signal('');

  private original = '';

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.genres();
    return this.genres().filter((g) =>
      [g.id, g.name, g.nameHindi ?? '', g.description].some((v) => v.toLowerCase().includes(q)));
  });

  readonly dirty = computed(() => {
    const draft = this.draft();
    return draft !== null && JSON.stringify(draft) !== this.original;
  });

  /** What would stop the server saving the draft, as early feedback; the server checks again. */
  readonly problems = computed(() => {
    const g = this.draft();
    if (!g) return [];
    const out: string[] = [];
    if (!STORY_GENRE_ID.test(g.id)) out.push('The id is 2 to 40 lower-case letters, digits and dashes.');
    if (g.name.trim().length < 2) out.push('Give the genre a name.');
    if (g.mode === 'Creative' && g.styleGuide.trim().length < 20) out.push('A creative genre needs a style guide of a sentence or two.');
    if (g.links.some((l) => !l.label.trim() || !/^https?:\/\/\S+$/i.test(l.url.trim()))) out.push('Each link needs a label and a full http or https address.');
    g.topics.forEach((t, i) => {
      if (!STORY_GENRE_ID.test(t.id) || !t.name.trim()) out.push(`Topic ${i + 1} needs a name and an id of lower-case letters, digits and dashes.`);
      else if (t.keywords.length === 0) out.push(`Topic "${t.name}" needs at least one keyword.`);
      if (g.mode === 'Scripture' && t.sources.some((s) => !s.textId || !s.ref.trim())) out.push(`Topic "${t.name}": every source needs a text and a place.`);
    });
    if (new Set(g.topics.map((t) => t.id)).size !== g.topics.length) out.push('Two topics have the same id.');
    return out;
  });

  constructor() {
    void this.load();
  }

  private async load(selectId?: string): Promise<void> {
    this.loading.set(true);
    try {
      const page = await firstValueFrom(this.api.list());
      this.genres.set(page.genres);
      this.texts.set(page.texts);
      this.categories.set(page.categories);
      this.scriptureSource.set(page.scriptureSource);
      this.failure.set(null);
      const pick = page.genres.find((g) => g.id === (selectId ?? this.draft()?.id)) ?? page.genres[0];
      if (pick && !this.creating()) this.open(pick);
    } catch (failure: unknown) {
      this.failure.set(failure instanceof ApiFailure ? failure.message : 'The genres could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  // ------------------------------------------------------------------------------------------------ choosing

  open(genre: StoryGenre): void {
    if (this.dirty() && !confirm('Discard the changes to this genre?')) return;
    this.creating.set(false);
    this.setDraft(clone(genre));
  }

  startNew(): void {
    if (this.dirty() && !confirm('Discard the changes to this genre?')) return;
    const order = Math.max(0, ...this.genres().map((g) => g.order)) + 10;
    this.creating.set(true);
    this.setDraft(blankGenre(order));
  }

  /** A copy of the open genre under a new id, to start a variation from. */
  duplicate(): void {
    const source = this.draft();
    if (!source) return;
    const copy = clone(source);
    copy.id = `${source.id}-copy`.slice(0, 40);
    copy.name = `${source.name} (copy)`.slice(0, STORY_GENRE_LIMITS.name);
    copy.builtIn = false;
    copy.order = source.order + 1;
    this.creating.set(true);
    this.setDraft(copy);
    this.original = '';
  }

  discard(): void {
    const draft = this.draft();
    if (this.creating()) {
      this.creating.set(false);
      const first = this.genres()[0];
      if (first) this.setDraft(clone(first));
      else this.draft.set(null);
      return;
    }
    const saved = this.genres().find((g) => g.id === draft?.id);
    if (saved) this.setDraft(clone(saved));
  }

  private setDraft(genre: StoryGenre): void {
    this.draft.set(genre);
    this.original = JSON.stringify(genre);
    this.openTopic.set(null);
    this.confirmDelete.set(false);
    this.note.set(null);
  }

  // ------------------------------------------------------------------------------------------------ editing

  patch(changes: Partial<StoryGenre>): void {
    this.draft.update((g) => (g ? { ...g, ...changes } : g));
  }

  setText(field: 'id' | 'name' | 'description' | 'icon' | 'styleGuide' | 'category', value: string): void {
    this.patch({ [field]: field === 'id' ? value.trim().toLowerCase() : value } as Partial<StoryGenre>);
  }

  setOptional(field: 'nameHindi' | 'imageStyle' | 'musicQuery' | 'speechStyle' | 'titleSuffix' | 'pinnedLine', value: string): void {
    this.patch({ [field]: value.trim() ? value : null } as Partial<StoryGenre>);
  }

  listText(values: readonly string[]): string {
    return values.join(', ');
  }

  setList(field: ListField, text: string): void {
    this.patch({ [field]: splitList(text) } as Partial<StoryGenre>);
  }

  setMode(mode: StoryGenreMode): void {
    this.patch({ mode });
  }

  setNumber(field: 'order' | 'defaultTargetSeconds', value: string): void {
    const n = Math.round(Number(value));
    if (Number.isFinite(n)) this.patch({ [field]: n } as Partial<StoryGenre>);
  }

  // --- links

  addLink(): void {
    this.draft.update((g) => (g && g.links.length < STORY_GENRE_LIMITS.links ? { ...g, links: [...g.links, { label: '', url: 'https://' }] } : g));
  }

  setLink(index: number, field: 'label' | 'url', value: string): void {
    this.draft.update((g) => (g ? { ...g, links: g.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)) } : g));
  }

  removeLink(index: number): void {
    this.draft.update((g) => (g ? { ...g, links: g.links.filter((_, i) => i !== index) } : g));
  }

  // --- topics

  addTopic(): void {
    const g = this.draft();
    if (!g || g.topics.length >= STORY_GENRE_LIMITS.topics) return;
    const topic: StoryGenreTopic = { id: '', name: '', hindi: null, keywords: [], summary: '', musicQuery: null, sources: [] };
    this.patch({ topics: [...g.topics, topic] });
    this.openTopic.set(g.topics.length);
  }

  updateTopic(index: number, changes: Partial<StoryGenreTopic>): void {
    this.draft.update((g) => (g ? { ...g, topics: g.topics.map((t, i) => (i === index ? { ...t, ...changes } : t)) } : g));
  }

  setTopicText(index: number, field: 'id' | 'name' | 'summary', value: string): void {
    this.updateTopic(index, { [field]: field === 'id' ? value.trim().toLowerCase() : value });
  }

  setTopicOptional(index: number, field: 'hindi' | 'musicQuery', value: string): void {
    this.updateTopic(index, { [field]: value.trim() ? value : null });
  }

  setKeywords(index: number, text: string): void {
    this.updateTopic(index, { keywords: splitList(text) });
  }

  /** A new topic's id follows its name until the person types an id of their own. */
  nameTopic(index: number, value: string): void {
    const topic = this.draft()?.topics[index];
    if (!topic) return;
    const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    const follows = topic.id === '' || topic.id === slug(topic.name);
    this.updateTopic(index, follows ? { name: value, id: slug(value) } : { name: value });
  }

  removeTopic(index: number): void {
    this.draft.update((g) => (g ? { ...g, topics: g.topics.filter((_, i) => i !== index) } : g));
    this.openTopic.set(null);
  }

  toggleTopic(index: number): void {
    this.openTopic.update((open) => (open === index ? null : index));
  }

  addSource(topic: number): void {
    const t = this.draft()?.topics[topic];
    if (!t || t.sources.length >= STORY_GENRE_LIMITS.sourcesPerTopic) return;
    const source: StoryGenreSource = { textId: this.texts()[0]?.id ?? '', ref: '', note: null, confidence: 'Medium' };
    this.updateTopic(topic, { sources: [...t.sources, source] });
  }

  setSource(topic: number, index: number, changes: Partial<StoryGenreSource>): void {
    const t = this.draft()?.topics[topic];
    if (!t) return;
    this.updateTopic(topic, { sources: t.sources.map((s, i) => (i === index ? { ...s, ...changes } : s)) });
  }

  removeSource(topic: number, index: number): void {
    const t = this.draft()?.topics[topic];
    if (!t) return;
    this.updateTopic(topic, { sources: t.sources.filter((_, i) => i !== index) });
  }

  textName(id: string): string {
    return this.texts().find((t) => t.id === id)?.english ?? id;
  }

  // ------------------------------------------------------------------------------------------------ saving

  async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving() || this.problems().length > 0) return;
    this.saving.set(true);
    this.note.set(null);
    try {
      const saved = await firstValueFrom(this.creating() ? this.api.create(draft) : this.api.update(draft));
      this.creating.set(false);
      this.genres.update((list) => {
        const rest = list.filter((g) => g.id !== saved.id);
        return [...rest, saved].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
      });
      this.setDraft(clone(saved));
      this.note.set({ tone: 'ok', text: 'Saved. New stories in this genre use it from now on; stories already started keep their copy.' });
    } catch (failure: unknown) {
      this.note.set({ tone: 'err', text: failure instanceof ApiFailure ? failure.message : 'The genre could not be saved.' });
    } finally {
      this.saving.set(false);
    }
  }

  /** Deletes a genre an administrator made; a built-in one goes back to how it shipped. */
  async remove(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving()) return;
    if (this.creating()) {
      this.discard();
      return;
    }
    this.saving.set(true);
    try {
      const left = await firstValueFrom(this.api.remove(draft.id));
      this.genres.update((list) => (left ? list.map((g) => (g.id === left.id ? left : g)) : list.filter((g) => g.id !== draft.id)));
      if (left) {
        this.setDraft(clone(left));
        this.note.set({ tone: 'ok', text: 'Put back as it shipped with the app.' });
      } else {
        const first = this.genres()[0];
        if (first) this.setDraft(clone(first));
        else this.draft.set(null);
        this.note.set({ tone: 'ok', text: `Deleted "${draft.name}".` });
      }
    } catch (failure: unknown) {
      this.note.set({ tone: 'err', text: failure instanceof ApiFailure ? failure.message : 'The genre could not be deleted.' });
    } finally {
      this.saving.set(false);
      this.confirmDelete.set(false);
    }
  }

  /** When the genre was last saved, in words, or an empty string for one never saved. */
  updated(genre: StoryGenre): string {
    return relativeTime(parseUtc(genre.updatedAtUtc), Date.now());
  }

  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
