import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, model, signal } from '@angular/core';

import { VoiceoverEngine, VoiceoverVoice } from '../../core/models/api.models';
import { StoryAgentOptions, StoryBuildOptions } from '../../core/models/story-agent.models';
import { ApiService } from '../../core/services/api.service';

let nextId = 0;

/** A stock Kokoro voice: its language letter, then gender (`hf_alpha` is a Hindi female voice). Other engines send a language code. */
const STOCK_VOICE = /^([abefhijpz])([fm])_(.+)$/;
const KOKORO_LANGUAGES: Record<string, string> = {
  a: 'American English', b: 'British English', e: 'Spanish', f: 'French', h: 'Hindi',
  i: 'Italian', j: 'Japanese', p: 'Portuguese', z: 'Chinese',
};
/** The voices that speak a story's language come first in the list. */
const FIRST_LETTERS: Record<string, string[]> = { hi: ['h'], en: ['a', 'b'] };

/** Must match the server's 300-character limit on a delivery style. */
const MAX_STYLE_CHARS = 300;

/** Ready-made delivery instructions for an engine that takes one; any other phrase works too. */
const STYLE_SUGGESTIONS = [
  'Warm, unhurried storyteller', 'Calm and devotional', 'Gentle bedtime story for children',
  'Serious documentary narrator', 'Excited and energetic', 'Whispered, mysterious',
];

/** "hi-IN" as "Hindi (India)"; the code itself where the browser can't name it. */
const LANGUAGE_NAMES = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' });
  } catch {
    return null;
  }
})();

function languageName(code?: string | null): string | null {
  if (!code) return null;
  try {
    return LANGUAGE_NAMES?.of(code) ?? code;
  } catch {
    return code;
  }
}

interface VoiceChoice {
  id: string;
  label: string;
}

interface VoiceGroup {
  label: string;
  voices: VoiceChoice[];
}

/**
 * How the video is made once the script is approved: the voice, the pictures, the music and whether to render. Used
 * twice - when a story is started, and again on the review page just before Build - so the two never disagree.
 * Choices this server cannot carry out are shown, switched off, with the reason, rather than hidden.
 */
@Component({
  selector: 'app-story-options',
  imports: [DecimalPipe],
  templateUrl: './story-options.component.html',
  styleUrls: ['./story-options.component.css'],
})
export class StoryOptionsComponent {
  private readonly api = inject(ApiService);

  readonly caps = input.required<StoryAgentOptions>();
  /** The story's language, so the voices that speak it are listed first. */
  readonly language = input('hi');
  /** True while a story is being made: the choices are shown but cannot be changed. */
  readonly disabled = input(false);
  /** Whether to offer "skip the review"; it only means something before a script exists. */
  readonly offerAutoApprove = input(false);
  readonly value = model.required<StoryBuildOptions>();

  readonly uid = `so${++nextId}`;
  private readonly voices = signal<VoiceoverVoice[]>([]);
  /** The speech engines that are on, in the configured order. */
  readonly engines = signal<VoiceoverEngine[]>([]);
  readonly currentEngine = computed(() => this.engines().find((e) => e.id === this.value().speechEngine) ?? null);
  /** Each character gets a voice from the engine's voices in the story's language; Piper's models are not cast. */
  readonly castAvailable = computed(() => this.value().speechEngine !== 'piper-local');
  readonly styleSuggestions = STYLE_SUGGESTIONS;
  readonly maxStyleChars = MAX_STYLE_CHARS;
  /** The engine whose voices are listed, so a slow answer for an earlier pick is dropped. */
  private listedFor: string | null = null;

  /** The voices grouped by the language they speak, the story's own language first. */
  readonly voiceGroups = computed<VoiceGroup[]>(() => {
    const groups = new Map<string, { order: number; group: VoiceGroup }>();
    const preferred = FIRST_LETTERS[this.language().toLowerCase()] ?? [];
    const storyLanguage = this.language().toLowerCase();

    for (const voice of this.voices()) {
      const stock = STOCK_VOICE.exec(voice.id);
      const key = stock ? stock[1] : (voice.group ?? voice.languageCode ?? '?');
      const name = stock ? `${KOKORO_LANGUAGES[stock[1]]}` : (voice.group ?? languageName(voice.languageCode) ?? 'Other voices');
      const label = stock
        ? `${titled(stock[3])} · ${stock[2] === 'f' ? 'female' : 'male'}`
        : `${voice.name}${voice.gender ? ' · ' + voice.gender : ''}`;

      // Voices that speak any language, or the story's own, come before the rest of another engine's library.
      const speaksStory = !stock && (!!voice.group || voice.languageCode?.toLowerCase().startsWith(storyLanguage));
      const order = preferred.indexOf(key) >= 0 ? preferred.indexOf(key)
        : speaksStory ? preferred.length
        : preferred.length + (stock ? 1 : 2);
      const entry = groups.get(key) ?? { order, group: { label: name, voices: [] } };
      entry.group.voices.push({ id: voice.id, label });
      groups.set(key, entry);
    }

    return [...groups.values()]
      .sort((a, b) => a.order - b.order || a.group.label.localeCompare(b.group.label))
      .map((entry) => entry.group);
  });

  readonly myVoice = computed(() => this.caps().myVoices.find((voice) => voice.id === this.value().voiceProfileId) ?? null);

  constructor() {
    this.loadVoices(undefined);
  }

  /** A failed list only means the picker is not offered; the server then uses its own default voice. */
  private loadVoices(engine: string | null | undefined): void {
    this.listedFor = engine ?? null;
    this.api.voiceoverVoices(engine ?? undefined).subscribe({
      next: (list) => {
        if (this.listedFor !== (engine ?? null)) return;
        this.voices.set(list.voices ?? []);
        if (list.engines?.length) this.engines.set(list.engines);
        // A story reopened for review names its engine; list that engine's voices, not the default's.
        if (engine === undefined && this.value().speechEngine) this.loadVoices(this.value().speechEngine);
      },
      error: () => undefined,
    });
  }

  setEngine(engine: string | null): void {
    // A voice or model belongs to the engine it was picked for; the style is kept and only sent where it is understood.
    this.patch({ speechEngine: engine, voiceId: null, speechModel: null });
    this.voices.set([]);
    this.loadVoices(engine);
  }

  setStyle(style: string): void {
    this.patch({ speechStyle: style.slice(0, MAX_STYLE_CHARS) || null });
  }

  googleEngineName(id: string): string {
    return this.engines().find((e) => e.id === id)?.name ?? 'Google Gemini TTS';
  }

  patch(change: Partial<StoryBuildOptions>): void {
    this.value.update((current) => ({ ...current, ...change }));
  }

  setNarration(narration: StoryBuildOptions['narration']): void {
    const caps = this.caps();
    // My voice needs one of the person's voices picked; the first is the sensible start.
    const profile = narration === 'MyVoice' ? (this.value().voiceProfileId ?? caps.myVoices[0]?.id ?? null) : null;
    this.patch({ narration, voiceProfileId: profile });
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  numeric(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }
}

/** "alpha" -> "Alpha", "amelia_inno" -> "Amelia inno". */
function titled(name: string): string {
  const spaced = name.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
