import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, model, signal } from '@angular/core';

import { VoiceoverVoice } from '../../core/models/api.models';
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

  /** The voices grouped by the language they speak, the story's own language first. */
  readonly voiceGroups = computed<VoiceGroup[]>(() => {
    const groups = new Map<string, { order: number; group: VoiceGroup }>();
    const preferred = FIRST_LETTERS[this.language().toLowerCase()] ?? [];

    for (const voice of this.voices()) {
      const stock = STOCK_VOICE.exec(voice.id);
      const key = stock ? stock[1] : (voice.languageCode ?? '?');
      const name = stock ? `${KOKORO_LANGUAGES[stock[1]]}` : (voice.languageCode ?? 'Other voices');
      const label = stock
        ? `${titled(stock[3])} · ${stock[2] === 'f' ? 'female' : 'male'}`
        : `${voice.name}${voice.gender ? ' · ' + voice.gender : ''}`;

      const entry = groups.get(key) ?? { order: preferred.indexOf(key) >= 0 ? preferred.indexOf(key) : preferred.length + (stock ? 1 : 2), group: { label: name, voices: [] } };
      entry.group.voices.push({ id: voice.id, label });
      groups.set(key, entry);
    }

    return [...groups.values()]
      .sort((a, b) => a.order - b.order || a.group.label.localeCompare(b.group.label))
      .map((entry) => entry.group);
  });

  readonly myVoice = computed(() => this.caps().myVoices.find((voice) => voice.id === this.value().voiceProfileId) ?? null);

  constructor() {
    // A failed list only means the picker is not offered; the server then uses its own default voice.
    this.api.voiceoverVoices().subscribe({
      next: (list) => this.voices.set(list.voices ?? []),
      error: () => undefined,
    });
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
