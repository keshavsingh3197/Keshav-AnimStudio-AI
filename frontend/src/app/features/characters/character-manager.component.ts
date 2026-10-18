import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Character } from '../../core/models/api.models';
import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { CharacterVoice, VOICE_PRESETS, describeVoice, sanitizeVoice, voiceFromPreset } from '../../shared/voice/character-voice';
import { TEST_LINE_SECONDS, VoiceTester } from '../../shared/voice/voice-tester';

export interface ArchetypePreset {
  id: string;
  label: string;
  icon: string;
  name: string;
  description: string;
  subtitleColor: string;
  age?: number;
  gender: string;
  hair: string;
  clothes: string;
  additionalDetails: string;
  /** A voice preset to start from; none keeps the performer's own voice. */
  voice?: string;
}

/** The cast: who appears, what they look like, and what colour their subtitles are. */
@Component({
  selector: 'app-character-manager',
  imports: [FormsModule, DecimalPipe, FileDropDirective],
  templateUrl: './character-manager.component.html',
  styleUrls: ['./character-manager.component.css'],
})
export class CharacterManagerComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly editing = signal<string | null>(null);
  readonly confirming = signal<string | null>(null);
  readonly searchQuery = signal<string>('');
  readonly viewMode = signal<'grid' | 'table'>('grid');
  readonly filterType = signal<'all' | 'animated' | 'static' | 'narrator'>('all');

  // Lip-Flap animation test in card list
  readonly testingFlapCharacterId = signal<string | null>(null);
  readonly mouthOpenState = signal<boolean>(false);
  private flapTimer: ReturnType<typeof setInterval> | null = null;

  // Lip-Flap animation test inside creation/editing form
  readonly isFormFlapping = signal<boolean>(false);
  readonly formFlapState = signal<boolean>(false);
  private formFlapTimer: ReturnType<typeof setInterval> | null = null;

  // Upload progress indicators
  readonly isUploadingClosed = signal<boolean>(false);
  readonly isUploadingOpen = signal<boolean>(false);

  // Subtitle preview line
  readonly sampleDialogue = signal<string>('Welcome to the studio! Let us bring this story to life.');

  // Character voice: presets, and a recorded line to hear it on
  readonly voicePresets = VOICE_PRESETS;
  readonly describeVoice = describeVoice;
  readonly testLineSeconds = TEST_LINE_SECONDS;
  readonly testerState = signal<'idle' | 'recording' | 'ready' | 'playing'>('idle');
  readonly testerError = signal<string | null>(null);
  readonly studioAvailable = signal(false);
  /** This server can turn a performance into a sampled person's voice (Seed-VC installed). */
  readonly aiAvailable = signal(false);
  readonly isUploadingSample = signal(false);
  /** Project recordings that can be a voice sample: audio, or video with sound. */
  readonly sampleAssets = computed(() => this.store.assets().filter((a) => a.kind === 'Audio' || a.kind === 'Video'));
  readonly studioBusy = signal(false);
  /** The studio version of the test line is what's playing. */
  readonly hearingStudio = signal(false);
  private readonly tester = new VoiceTester((state) => {
    this.testerState.set(state);
    this.hearingStudio.set(this.tester?.playingStudio ?? false);
  });

  // Pre-configured color palette
  readonly presetColors: string[] = [
    '#ffe164', // Studio Golden Yellow
    '#5ce1e6', // Cyber Cyan
    '#ffffff', // Crisp White
    '#ffb800', // Warm Amber
    '#00ff88', // Emerald Mint
    '#ff66b2', // Radiant Pink
    '#a78bfa', // Mystic Violet
    '#f87171', // Coral Red
  ];

  // AI Archetype Presets
  readonly archetypes: ArchetypePreset[] = [
    {
      id: 'young-hero',
      label: 'Young Protagonist',
      icon: '⚡',
      name: 'Aarav',
      description: 'The energetic and courageous main character on a journey of discovery.',
      subtitleColor: '#ffe164',
      age: 21,
      gender: 'Male',
      hair: 'Messy textured black hair',
      clothes: 'Casual denim jacket over graphic tee and sneakers',
      additionalDetails: 'Expressive determined eyes, athletic build, confident stance',
    },
    {
      id: 'wise-mentor',
      label: 'Wise Mentor / Elder',
      icon: '🧙',
      name: 'Guru Ji',
      description: 'A venerable teacher who guides with ancient wisdom and patience.',
      subtitleColor: '#5ce1e6',
      age: 68,
      gender: 'Male',
      hair: 'Long flowing white hair and neatly trimmed silver beard',
      clothes: 'Traditional draped saffron and white robes with embroidered borders',
      additionalDetails: 'Calm and enlightened gaze, wooden prayer beads, gentle posture',
      voice: 'sage',
    },
    {
      id: 'narrator',
      label: 'Master Narrator',
      icon: '🎙️',
      name: 'Narrator',
      description: 'The omniscient storyteller presenting background context and lore.',
      subtitleColor: '#ffd700',
      age: 38,
      gender: 'Neutral',
      hair: 'Polished sleek dark hair',
      clothes: 'Formal dark studio blazer with satin lapel',
      additionalDetails: 'Authoritative presence, clear resonant cadence, neutral background framing',
      voice: 'narrator',
    },
    {
      id: 'action-hero',
      label: 'Anime Action Hero',
      icon: '🦸',
      name: 'Ren',
      description: 'A dynamic martial artist with explosive agility and fierce determination.',
      subtitleColor: '#ff7a00',
      age: 18,
      gender: 'Male',
      hair: 'Spiky anime hairstyle with crimson highlights',
      clothes: 'Sleeveless martial arts tunic with arm wraps and utility combat belt',
      additionalDetails: 'Scar across left cheek, intense focused expression, ready combat stance',
    },
    {
      id: 'cyber-hacker',
      label: 'Cyberpunk Specialist',
      icon: '💻',
      name: 'Nyx',
      description: 'A tech-savvy hacker navigating neon dystopias with quick wit.',
      subtitleColor: '#00ff88',
      age: 25,
      gender: 'Female',
      hair: 'Asymmetric neon teal bob haircut',
      clothes: 'High-collar dark techwear jacket with luminous circuit lines',
      additionalDetails: 'Digital HUD eye implant, fingerless tactile gloves, holographic console',
    },
    {
      id: 'cheerful-friend',
      label: 'Cheerful Companion',
      icon: '🌸',
      name: 'Maya',
      description: 'The heartwarming, optimistic sidekick who brings laughter and loyalty.',
      subtitleColor: '#ff66b2',
      age: 20,
      gender: 'Female',
      hair: 'Shoulder-length wavy chestnut hair with cute clips',
      clothes: 'Bright pastel layered sweater and pleated skirt',
      additionalDetails: 'Radiant smile, expressive hand gestures, warm compassionate presence',
    },
  ];

  form = {
    name: '',
    description: '',
    aliases: '',
    closedMouthAssetId: '',
    openMouthAssetId: '',
    subtitleColorHex: '#ffe164',
    age: null as number | null,
    gender: '',
    hair: '',
    clothes: '',
    additionalDetails: '',
    voice: null as CharacterVoice | null,
  };

  // Filtered characters list computed from store and current active filters
  readonly filteredCharacters = computed(() => {
    let list = this.store.characters();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.filterType();

    if (query) {
      list = list.filter((c) => {
        const matchName = c.name.toLowerCase().includes(query);
        const matchDesc = (c.description ?? '').toLowerCase().includes(query);
        const matchAliases = c.aliases.some((a) => a.toLowerCase().includes(query));
        const matchLook = (
          (c.appearance.gender ?? '') +
          ' ' +
          (c.appearance.hair ?? '') +
          ' ' +
          (c.appearance.clothes ?? '') +
          ' ' +
          (c.appearance.additionalDetails ?? '')
        ).toLowerCase().includes(query);

        return matchName || matchDesc || matchAliases || matchLook;
      });
    }

    if (filter === 'animated') {
      list = list.filter((c) => !!c.closedMouthAssetId && !!c.openMouthAssetId);
    } else if (filter === 'static') {
      list = list.filter((c) => !c.closedMouthAssetId || !c.openMouthAssetId);
    } else if (filter === 'narrator') {
      list = list.filter((c) => c.isNarrator);
    }

    return list;
  });

  // Summary counts
  readonly animatedCount = computed(() =>
    this.store.characters().filter((c) => !!c.closedMouthAssetId && !!c.openMouthAssetId).length
  );
  readonly castCount = computed(() =>
    this.store.characters().filter((c) => !c.isNarrator).length
  );
  readonly narratorCount = computed(() =>
    this.store.characters().filter((c) => c.isNarrator).length
  );

  constructor() {
    void firstValueFrom(this.api.studioVoiceAvailable())
      .then((status) => {
        this.studioAvailable.set(status.available);
        this.aiAvailable.set(!!status.aiAvailable);
      })
      .catch(() => this.studioAvailable.set(false));
  }

  /** Picks (or clears) the recording of the person whose voice this character speaks with. */
  setVoiceSample(assetId: string | null): void {
    // A new person needs a new confirmation.
    this.patchVoice({ aiSampleAssetId: assetId || null, aiSampleConsent: false });
  }

  onUploadVoiceSample(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const projectId = this.store.projectId();
    if (!file || !projectId) return;

    this.isUploadingSample.set(true);
    this.status.run(this.api.uploadAsset(projectId, file), (asset) => {
      this.isUploadingSample.set(false);
      this.store.refreshAssets();
      this.setVoiceSample(asset.id);
      this.status.notify([`Uploaded voice sample: ${asset.name}`]);
    });
  }

  ngOnDestroy(): void {
    this.stopFlap();
    this.stopFormFlap();
    this.tester.close();
  }

  // ── Character Voice ──
  /** Null is the performer's own voice. */
  setVoicePreset(id: string | null): void {
    const sample = this.form.voice;
    // A preset changes the effects, not whose voice it is: an AI sample and its consent stay.
    this.form.voice = id === null ? null : {
      ...voiceFromPreset(id),
      aiSampleAssetId: sample?.aiSampleAssetId ?? null,
      aiSampleConsent: sample?.aiSampleConsent ?? false,
    };
    this.tester.setVoice(this.form.voice);
  }

  /** A hand change turns the preset into a custom voice. */
  patchVoice(change: Partial<CharacterVoice>): void {
    this.form.voice = sanitizeVoice({ ...(this.form.voice ?? voiceFromPreset('custom')), ...change, preset: 'custom' });
    this.tester.setVoice(this.form.voice);
  }

  async recordTestLine(): Promise<void> {
    this.testerError.set(null);
    if (this.testerState() === 'recording') {
      this.tester.stopRecording();
      return;
    }
    try {
      this.tester.setVoice(this.form.voice);
      await this.tester.record();
    } catch (err: unknown) {
      const refused = err instanceof DOMException && err.name === 'NotAllowedError';
      this.testerError.set(refused
        ? 'Microphone permission was refused. Allow it in the address bar, then try again.'
        : "The microphone couldn't be opened.");
    }
  }

  /**
   * Sends the test line to the server and plays it back re-voiced at studio quality: the
   * body (Size) moved apart from the pitch, the way it will sound after "Studio voice".
   */
  async hearStudioQuality(): Promise<void> {
    const line = this.tester.line;
    const voice = this.form.voice;
    if (!line || !voice || this.studioBusy()) return;
    this.testerError.set(null);
    this.studioBusy.set(true);
    try {
      const studio = await firstValueFrom(this.api.studioVoice(line, [{ startSeconds: 0, voice: { ...voice, enabled: true } }]));
      await this.tester.play(studio);
      this.hearingStudio.set(true);
    } catch (err: unknown) {
      this.testerError.set(err instanceof ApiFailure ? (err.hint ? `${err.message} ${err.hint}` : err.message) : "The studio voice couldn't be made.");
    } finally {
      this.studioBusy.set(false);
    }
  }

  async toggleTestPlayback(): Promise<void> {
    this.testerError.set(null);
    if (this.testerState() === 'playing') {
      this.tester.stopPlaying();
      return;
    }
    try {
      await this.tester.play();
      if (this.tester.pitchUnavailable) this.testerError.set("Pitch changes can't run in this browser; the other effects still play.");
    } catch {
      this.testerError.set("The test line couldn't be played.");
    }
  }

  // ── Lip-Flap Animation in Character List ──
  toggleFlap(character: Character): void {
    if (this.testingFlapCharacterId() === character.id) {
      this.stopFlap();
    } else {
      this.stopFlap();
      this.testingFlapCharacterId.set(character.id);
      this.flapTimer = setInterval(() => {
        this.mouthOpenState.update((prev) => !prev);
      }, 180);
    }
  }

  stopFlap(): void {
    this.testingFlapCharacterId.set(null);
    this.mouthOpenState.set(false);
    if (this.flapTimer !== null) {
      clearInterval(this.flapTimer);
      this.flapTimer = null;
    }
  }

  getSpriteToDisplay(character: Character): string | null {
    if (
      this.testingFlapCharacterId() === character.id &&
      this.mouthOpenState() &&
      character.openMouthAssetId
    ) {
      return this.assetUrl(character.openMouthAssetId);
    }
    return character.closedMouthAssetId
      ? this.assetUrl(character.closedMouthAssetId)
      : character.openMouthAssetId
      ? this.assetUrl(character.openMouthAssetId)
      : null;
  }

  // ── Lip-Flap Animation in Form Viewport ──
  toggleFormFlap(): void {
    if (this.isFormFlapping()) {
      this.stopFormFlap();
    } else {
      this.isFormFlapping.set(true);
      this.formFlapTimer = setInterval(() => {
        this.formFlapState.update((prev) => !prev);
      }, 180);
    }
  }

  stopFormFlap(): void {
    this.isFormFlapping.set(false);
    this.formFlapState.set(false);
    if (this.formFlapTimer !== null) {
      clearInterval(this.formFlapTimer);
      this.formFlapTimer = null;
    }
  }

  getFormSpriteToDisplay(): string | null {
    if (this.isFormFlapping() && this.formFlapState() && this.form.openMouthAssetId) {
      return this.assetUrl(this.form.openMouthAssetId);
    }
    if (this.form.closedMouthAssetId) {
      return this.assetUrl(this.form.closedMouthAssetId);
    }
    if (this.form.openMouthAssetId) {
      return this.assetUrl(this.form.openMouthAssetId);
    }
    return null;
  }

  // ── Direct File Uploading ──
  onUploadClosedSprite(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.uploadClosedSprite(file);
  }

  uploadClosedSprite(file: File): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.isUploadingClosed.set(true);
    this.status.run(
      this.api.uploadAsset(projectId, file),
      (asset) => {
        this.isUploadingClosed.set(false);
        this.form.closedMouthAssetId = asset.id;
        this.store.refreshAssets();
        this.status.notify([`Uploaded closed-mouth sprite: ${asset.name}`]);
      }
    );
  }

  onUploadOpenSprite(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.uploadOpenSprite(file);
  }

  uploadOpenSprite(file: File): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.isUploadingOpen.set(true);
    this.status.run(
      this.api.uploadAsset(projectId, file),
      (asset) => {
        this.isUploadingOpen.set(false);
        this.form.openMouthAssetId = asset.id;
        this.store.refreshAssets();
        this.status.notify([`Uploaded open-mouth sprite: ${asset.name}`]);
      }
    );
  }

  clearClosedSprite(): void {
    this.form.closedMouthAssetId = '';
  }

  clearOpenSprite(): void {
    this.form.openMouthAssetId = '';
  }

  // ── Archetype Preset Application ──
  applyArchetype(preset: ArchetypePreset): void {
    this.form.name = preset.name;
    this.form.description = preset.description;
    this.form.subtitleColorHex = preset.subtitleColor;
    this.form.age = preset.age ?? null;
    this.form.gender = preset.gender;
    this.form.hair = preset.hair;
    this.form.clothes = preset.clothes;
    this.form.additionalDetails = preset.additionalDetails;
    this.setVoicePreset(preset.voice ?? null);
    this.status.notify([`Applied archetype preset: ${preset.label}`]);
    this.scrollToForm();
  }

  setSubtitleColor(hex: string): void {
    this.form.subtitleColorHex = hex;
  }

  // ── Edit, Duplicate, Cancel & Save ──
  edit(character: Character): void {
    this.editing.set(character.id);
    this.tester.setVoice(sanitizeVoice(character.voice));
    this.form = {
      name: character.name,
      description: character.description ?? '',
      aliases: character.aliases.join(', '),
      closedMouthAssetId: character.closedMouthAssetId ?? '',
      openMouthAssetId: character.openMouthAssetId ?? '',
      subtitleColorHex: character.subtitleColorHex ?? '#ffe164',
      age: character.appearance.age ?? null,
      gender: character.appearance.gender ?? '',
      hair: character.appearance.hair ?? '',
      clothes: character.appearance.clothes ?? '',
      additionalDetails: character.appearance.additionalDetails ?? '',
      voice: sanitizeVoice(character.voice),
    };
    this.scrollToForm();
  }

  duplicate(character: Character): void {
    this.editing.set(null);
    this.tester.setVoice(sanitizeVoice(character.voice));
    this.form = {
      name: `${character.name} (Copy)`,
      description: character.description ?? '',
      aliases: character.aliases.join(', '),
      closedMouthAssetId: character.closedMouthAssetId ?? '',
      openMouthAssetId: character.openMouthAssetId ?? '',
      subtitleColorHex: character.subtitleColorHex ?? '#ffe164',
      age: character.appearance.age ?? null,
      gender: character.appearance.gender ?? '',
      hair: character.appearance.hair ?? '',
      clothes: character.appearance.clothes ?? '',
      additionalDetails: character.appearance.additionalDetails ?? '',
      voice: sanitizeVoice(character.voice),
    };
    this.status.notify([`Duplicated "${character.name}" into form.`]);
    this.scrollToForm();
  }

  cancel(): void {
    this.editing.set(null);
    this.stopFormFlap();
    this.form = {
      name: '',
      description: '',
      aliases: '',
      closedMouthAssetId: '',
      openMouthAssetId: '',
      subtitleColorHex: '#ffe164',
      age: null,
      gender: '',
      hair: '',
      clothes: '',
      additionalDetails: '',
      voice: null,
    };
    this.tester.setVoice(null);
  }

  save(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    const body = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || null,
      aliases: this.form.aliases.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
      closedMouthAssetId: this.form.closedMouthAssetId || null,
      openMouthAssetId: this.form.openMouthAssetId || null,
      subtitleColorHex: this.form.subtitleColorHex || null,
      appearance: {
        age: this.form.age ?? undefined,
        gender: this.form.gender.trim() || undefined,
        hair: this.form.hair.trim() || undefined,
        clothes: this.form.clothes.trim() || undefined,
        additionalDetails: this.form.additionalDetails.trim() || undefined,
      },
      voice: this.form.voice ? { ...this.form.voice, enabled: true as const } : { enabled: false as const },
    };

    const id = this.editing();
    const call = id === null
      ? this.api.createCharacter(projectId, body)
      : this.api.updateCharacter(id, body);

    this.status.run(call, () => {
      this.cancel();
      this.store.refreshCharacters();
      this.status.notify([id === null ? 'Character created successfully.' : 'Character updated successfully.']);
    });
  }

  remove(characterId: string): void {
    this.status.run(this.api.deleteCharacter(characterId), (scenesTouched) => {
      this.confirming.set(null);
      this.store.refreshCharacters();
      this.store.refreshScenes();

      if (scenesTouched > 0) {
        this.status.notify([
          `Its lines in ${scenesTouched} scene(s) were handed to the narrator.`,
        ]);
      } else {
        this.status.notify(['Character removed.']);
      }
    });
  }

  appearanceOf(character: Character): string | null {
    const look = character.appearance;
    const parts = [
      look.age === undefined || look.age === null ? null : `${look.age} yrs`,
      look.gender,
      look.hair,
      look.clothes,
    ].filter((part): part is string => !!part && part.length > 0);

    return parts.length > 0 ? parts.join(' · ') : null;
  }

  assetUrl(assetId: string): string {
    return this.api.assetUrl(assetId);
  }

  isFlatSprite(assetId: string | undefined): boolean {
    if (!assetId) return false;
    const asset = this.store.assets().find((a) => a.id === assetId);
    return asset !== undefined && !asset.hasAlpha;
  }

  scrollToForm(): void {
    const el = document.getElementById('character-editor-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
