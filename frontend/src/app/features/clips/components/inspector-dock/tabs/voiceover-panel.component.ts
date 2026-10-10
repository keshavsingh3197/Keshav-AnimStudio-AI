import { Component, OnDestroy, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Asset, MyVoice, VoiceoverEngine, VoiceoverVoice } from '../../../../../core/models/api.models';
import { ApiService } from '../../../../../core/services/api.service';
import { ProjectStore } from '../../../../../core/services/project-store';
import { StudioStateService } from '../../../services/studio-state.service';
import {
  MAX_LINE_CHARS, MY_VOICE_PREFIX, VoiceScriptLine, findCharacter, parseVoiceScript,
} from './voice-script';
import {
  LEGACY_SCRIPT_KEY_PREFIX, LIBRARY_KEY_PREFIX, MAX_SCRIPTS, MAX_SCRIPT_NAME, SavedScript, ScriptLibrary,
  activeScript, addScript, deleteScript, lastApplied, markApplied, readLibrary, renameScript, setActive,
  updateActiveText,
} from './voice-script-library';
/** Before voices were remembered per language; still read so nobody loses their choice. */
const LEGACY_VOICE_KEY = 'animstudio_vo_voice';
const VOICE_KEY_PREFIX = 'animstudio_vo_voice_';
const FAVORITES_KEY = 'animstudio_vo_favorites';
const RATE_KEY = 'animstudio_vo_rate';
const ENGINE_KEY = 'animstudio_vo_engine';
const MODEL_KEY_PREFIX = 'animstudio_vo_model_';

/** A picker value naming one of the user's own voices rather than a built-in one. */
const MY_PREFIX = 'my:';

/** Must match MyVoicesController: the sample size cap and the shortest usable sample. */
const MAX_SAMPLE_BYTES = 25 * 1024 * 1024;
const MIN_SAMPLE_SECONDS = 4;
const MAX_RECORD_SECONDS = 60;
/** Must stay under VoiceScriptController's upload cap: 16 kHz mono 16-bit WAV is ~1.9MB a minute. */
const MAX_DICTATE_SECONDS = 180;
/** What whisper.cpp reads; hosted recognizers take it too. */
const DICTATE_SAMPLE_RATE = 16000;
/** Must stay under NarrationController's cap: 48 kHz mono 16-bit WAV is ~5.8MB a minute. */
const MAX_NARRATE_SECONDS = 300;
const NARRATION_SAMPLE_RATE = 48000;

/** The least breath between two lines when they are pulled earlier to end inside the video. */
const MIN_GAP_SECONDS = 0.15;
const MAX_RATE = 1.3;
/** The fastest a script-timed line is sped up to finish inside its time; past this it sounds rushed. */
const MAX_FIT_RATE = 1.6;
/** Passes that re-speak a line faster; speech doesn't shorten exactly in step with the speed. */
const FIT_PASSES = 2;

/** Kokoro voice ids start with a language letter and a gender letter: "hf_alpha", "am_michael". */
const KOKORO_LANGUAGES: Record<string, string> = {
  a: 'English (US)', b: 'English (UK)', h: 'Hindi', e: 'Spanish', f: 'French',
  i: 'Italian', j: 'Japanese', p: 'Portuguese', z: 'Chinese',
};

/** ISO 639's "multiple languages": a voice that speaks whatever the script is in (Gemini's). */
const ANY_LANGUAGE = 'mul';
const ANY_LANGUAGE_LABEL = 'Any language';

/** The voices that sound most natural in each language, tried in order. */
const PREFERRED_VOICES = {
  hindi: ['hm_omega', 'hf_alpha', 'hm_psi', 'hf_beta'],
  other: ['af_heart', 'am_michael', 'bm_george', 'af_bella'],
};

/** What to read aloud when recording a sample: varied sounds, said naturally. */
const SAMPLE_PROMPTS = {
  hindi: 'नमस्ते, यह मेरी आवाज़ है। मैं इसे अपने वीडियो की कहानी सुनाने के लिए रिकॉर्ड कर रहा हूँ। ' +
    'सुबह की धूप, नदी का किनारा, और मंदिर की घंटियाँ - हर शब्द साफ़ और आराम से बोलिए।',
  other: 'Hello, this is my voice. I am recording it to narrate the stories in my videos. ' +
    'The morning sun rose over the quiet river, and the temple bells rang softly in the distance.',
};

type Language = 'hindi' | 'other';
/** "script" places each line at the time the script gives it. */
type Placement = 'clips' | 'playhead' | 'script';

/** A script line with the voice and speed it will actually be spoken in. */
interface ScriptLine extends VoiceScriptLine {
  /** The picker value it is spoken in: a built-in voice id, or "my:" and a voice's id. */
  selection: string;
  /** The built-in voice that speaks the words ('' when none could be found). */
  voiceId: string;
  myVoice: MyVoice | null;
  rate: number;
}

/** What a line is spoken with: when any of it changes, earlier takes no longer match. */
function keyOf(lines: ScriptLine[], engine: string): string {
  return JSON.stringify([engine, ...lines.map((l) => [l.text, l.selection, l.voiceId, l.rate])]);
}

type Busy = 'idle' | 'previewing' | 'applying';

interface LineResult {
  index: number;
  text: string;
  character?: string;
  /** Unsaved audio from a preview run, as an object URL; nothing is in the library yet. */
  previewUrl?: string;
  /** Set once the line has been applied and saved to the library. */
  asset?: Asset;
  durationSeconds?: number;
  error?: string;
}

/** Where a line will start on A1 under the current placement. */
interface LinePlan {
  startSeconds: number;
  endSeconds: number;
  /** Seconds the line runs past the end of the clip it was placed on. */
  overrunSeconds?: number;
  /** Pulled earlier than its clip's start so that it ends inside the video. */
  pulledEarly?: boolean;
  /** The start the script gave, when the line had to move off it (to not overlap, or to end inside the video). */
  movedFromSeconds?: number;
}

/** A line playing under the timeline while "Play with clips" runs. */
interface MixVoice {
  audio: HTMLAudioElement;
  plan: LinePlan;
}

interface VoiceOption {
  value: string;
  label: string;
}

interface VoiceGroup {
  label: string;
  voices: VoiceOption[];
}

/** A sample about to become one of the user's voices. */
interface PendingSample {
  blob: Blob;
  fileName: string;
  url: string;
  seconds?: number;
}

/**
 * Voiceover from a script: each line is spoken by the server's speech engine - in a built-in
 * voice, or re-voiced into one of the user's own - saved to the library, and laid on A1 lined
 * up with the clips (line 1 on clip 1, ...) or back to back from the playhead. Everything
 * placed by one run, including the earlier lines it replaces, is a single Undo step.
 */
@Component({
  selector: 'app-voiceover-panel',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './voiceover-panel.component.html',
  styleUrls: ['./voiceover-panel.component.css'],
})
export class VoiceoverPanelComponent implements OnInit, OnDestroy {
  readonly state = inject(StudioStateService);
  private readonly api = inject(ApiService);
  private readonly store = inject(ProjectStore);

  readonly maxLineChars = MAX_LINE_CHARS;
  readonly maxRecordSeconds = MAX_RECORD_SECONDS;
  readonly minSampleSeconds = MIN_SAMPLE_SECONDS;

  readonly loadingVoices = signal(true);
  readonly available = signal(false);
  readonly unavailableReason = signal('');
  readonly voices = signal<VoiceoverVoice[]>([]);
  /** Speech engines that are on, in the configured order; the first is what a line uses by default. */
  readonly engines = signal<VoiceoverEngine[]>([]);
  /** The engine whose voices are listed and which speaks the lines ('' until the server says). */
  readonly engine = signal('');
  /** One of the engine's offered models ('' for its configured one). */
  readonly model = signal('');
  readonly currentEngine = computed(() => this.engines().find((e) => e.id === this.engine()) ?? null);
  /** Takes and fitted speeds hold only for the engine and model they were made with. */
  readonly engineKey = computed(() => `${this.engine()}|${this.model()}`);
  readonly myVoices = signal<MyVoice[]>([]);
  readonly myVoicesAvailable = signal(false);
  readonly favorites = signal<string[]>([]);

  readonly script = signal('');
  /** Every script kept for this project; the Script box edits the active one. */
  readonly library = signal<ScriptLibrary>({ activeId: '', scripts: [] });
  readonly activeSaved = computed<SavedScript | null>(() =>
    this.library().scripts.length > 0 ? activeScript(this.library()) : null);
  /** The script applied most recently: its lines are the ones on A1 (unless replaced by hand). */
  readonly lastAppliedId = computed(() => lastApplied(this.library())?.id ?? null);
  readonly maxScripts = MAX_SCRIPTS;
  readonly maxScriptName = MAX_SCRIPT_NAME;
  /** The name being typed while the active script is renamed; null when not renaming. */
  readonly renameDraft = signal<string | null>(null);
  /** Read when the panel opens, so a project switch mid-edit can't write one project's scripts to another. */
  private libraryKey = '';

  // --- speaking the script, and polishing it
  readonly dictating = signal(false);
  readonly dictateSeconds = signal(0);
  readonly maxDictateSeconds = MAX_DICTATE_SECONDS;
  readonly assist = signal<'idle' | 'transcribing' | 'polishing'>('idle');
  /** What the last dictation or polish did, shown under the Script box. */
  readonly assistNote = signal('');
  private dictateRecorder: MediaRecorder | null = null;
  private dictateTimer: ReturnType<typeof setInterval> | null = null;
  /** Scripts already polished while the panel is open. */
  private readonly polishedTexts = new Set<string>();

  // --- recording the narration in the user's own voice
  readonly narrating = signal(false);
  readonly narrateSeconds = signal(0);
  readonly maxNarrateSeconds = MAX_NARRATE_SECONDS;
  readonly narrationTake = signal<PendingSample | null>(null);
  readonly narrationName = signal('');
  readonly narrationBusy = signal(false);
  readonly narrationNote = signal('');
  private narrateRecorder: MediaRecorder | null = null;
  private narrateTimer: ReturnType<typeof setInterval> | null = null;

  /** The picker's value: a built-in voice id, or "my:" and the id of one of the user's voices. */
  readonly selection = signal('');
  readonly rate = signal(0.95);
  readonly maxFitRate = MAX_FIT_RATE;
  /**
   * Faster speeds that make script-timed lines finish inside their time, by line index. They hold
   * only for the script, voices and speeds they were worked out for (`key`).
   */
  private readonly fitted = signal<{ key: string; rates: Map<number, number> }>({ key: '', rates: new Map() });
  /** The line being re-spoken faster to fit its time, while a preview runs. */
  readonly fittingIndex = signal<number | null>(null);
  readonly placement = signal<Placement>('clips');
  /** Breath after a cut before the line starts, and between back-to-back lines. */
  readonly leadInSeconds = signal(0.3);
  readonly gapSeconds = signal(0.4);
  /** Take the voiceover lines already on A1 off when applying, in the same Undo step. */
  readonly replaceExisting = signal(true);

  readonly busy = signal<Busy>('idle');
  readonly generating = computed(() => this.busy() !== 'idle');
  readonly doneCount = signal(0);
  readonly results = signal<LineResult[]>([]);
  readonly applied = signal(false);
  /** How many lines the last apply took off A1. */
  readonly replacedCount = signal(0);
  readonly error = signal('');
  readonly promptCopied = signal(false);
  private cancelRequested = false;
  private preview: HTMLAudioElement | null = null;
  readonly previewingIndex = signal<number | null>(null);

  /** Where "From playhead" starts, frozen when a run starts so playback can't drag the plan along. */
  private readonly anchorSeconds = signal(0);
  /** The script, voice and speed the current results were spoken with. */
  private readonly resultsKey = signal('');

  /** The last run's results, so the object URLs it made can be released when replaced. */
  private previousResults: LineResult[] = [];

  readonly withClips = signal(false);
  private mix: MixVoice[] = [];
  private mixEnd = 0;

  // --- adding one of the user's own voices
  readonly addingVoice = signal(false);
  readonly newVoiceName = signal('');
  readonly newVoiceBase = signal('');
  readonly newVoiceConsent = signal(false);
  readonly newSample = signal<PendingSample | null>(null);
  readonly recording = signal(false);
  readonly recordSeconds = signal(0);
  readonly savingVoice = signal(false);
  readonly voiceError = signal('');
  readonly cleaning = signal(false);
  private recorder: MediaRecorder | null = null;
  private recordTimer: ReturnType<typeof setInterval> | null = null;

  /** The script as written: plain lines, lines with cues, or JSON (see voice-script.ts). */
  readonly parsed = computed(() => parseVoiceScript(this.script()));

  /**
   * Every line with the voice and speed it is spoken in: its own, else its character's, else
   * the panel's. A voice the script names that isn't installed is an error, never a fallback.
   */
  private readonly resolved = computed(() => {
    const script = this.parsed();
    const errors: string[] = [];
    const lines = script.lines.map((line): ScriptLine => {
      const character = findCharacter(script, line.character);
      const named = line.voice ?? character?.voice;
      let selection = this.selection();
      if (named) {
        const found = this.selectionFor(named);
        if (found) selection = found;
        else {
          selection = '';
          if (errors.length < 10) errors.push(`Line ${line.index + 1}: there is no voice "${named}". ${this.missingVoiceHint(named)}`);
        }
      }
      const myVoice = selection.startsWith(MY_PREFIX)
        ? this.myVoices().find((v) => v.id === selection.slice(MY_PREFIX.length)) ?? null
        : null;
      const voiceId = myVoice ? this.speakerFor(myVoice) : selection.startsWith(MY_PREFIX) ? '' : selection;
      return { ...line, selection, voiceId, myVoice, rate: line.speed ?? character?.speed ?? this.rate() };
    });
    return { lines, errors };
  });

  /** Every line as the script asks for it, before any speed-up to fit its time. */
  private readonly scriptLines = computed<ScriptLine[]>(() => this.resolved().lines);

  /** The speed-ups that still hold for the script as it is now, by line index. */
  readonly fittedRates = computed(() => {
    const fit = this.fitted();
    return fit.key === keyOf(this.scriptLines(), this.engineKey()) ? fit.rates : new Map<number, number>();
  });

  readonly lines = computed<ScriptLine[]>(() => {
    const rates = this.fittedRates();
    return rates.size === 0
      ? this.scriptLines()
      : this.scriptLines().map((l) => rates.has(l.index) ? { ...l, rate: rates.get(l.index)! } : l);
  });

  /**
   * The time each script-timed line has to be spoken in: from its start to its "end", else to
   * just before the next line's start, else (the last line) to the end of the video.
   */
  readonly slots = computed(() => {
    const slots = new Map<number, { start: number; end: number }>();
    if (this.placement() !== 'script') return slots;
    const lines = this.scriptLines();
    lines.forEach((line, i) => {
      if (line.start === undefined) return;
      const next = lines[i + 1];
      const end = line.end
        ?? (next ? next.start !== undefined ? next.start - MIN_GAP_SECONDS : undefined : this.videoEnd() || undefined);
      if (end !== undefined && end > line.start + 0.3) slots.set(line.index, { start: line.start, end });
    });
    return slots;
  });
  /** Mistakes in the script, and voices it names that aren't installed. Any one stops a run. */
  readonly scriptErrors = computed(() => [...this.parsed().errors, ...this.resolved().errors]);
  readonly hasTimings = computed(() => this.parsed().hasTimings);
  /** Lines whose voice or speed the script sets, so the panel's picker and slider don't apply to them. */
  readonly scriptSetsVoice = computed(() => this.parsed().structured);
  readonly characterNames = computed(() => {
    const names = new Set<string>();
    for (const l of this.lines()) if (l.character) names.add(l.character);
    return [...names];
  });

  /** "Line per clip" over only the clips picked on the timeline or in the library, not all of them. */
  readonly onlySelectedClips = signal(false);
  /** The clips picked on the timeline or in the media library, in timeline order. */
  readonly selectedClips = computed(() => {
    const ids = new Set(this.state.selectedLibraryIds());
    const one = this.state.selectedClipId();
    if (ids.size === 0 && one) ids.add(one);
    return this.state.clipSchedule().filter((c) => ids.has(c.clip.id));
  });
  /** The clips the lines go on, one each, under "Line per clip". */
  readonly voiceClips = computed(() =>
    this.onlySelectedClips() && this.selectedClips().length > 0 ? this.selectedClips() : this.state.clipSchedule());
  readonly clipCount = computed(() => this.voiceClips().length);
  readonly videoEnd = computed(() => this.state.totalSeconds());
  readonly hasTooLong = computed(() => this.lines().some((l) => l.tooLong));
  /** Everything a run needs: an engine, lines, a voice for each, and no mistakes in the script. */
  readonly ready = computed(() =>
    this.available() && this.lines().length > 0 && !this.hasTooLong()
    && this.scriptErrors().length === 0 && this.lines().every((l) => !!l.voiceId));
  readonly isHindi = computed(() => /[ऀ-ॿ]/.test(this.script()));
  readonly language = computed<Language>(() => this.isHindi() ? 'hindi' : 'other');
  readonly samplePrompt = computed(() => SAMPLE_PROMPTS[this.language()]);

  /** The user's own voice the lines are re-voiced into, if one is picked. */
  readonly myVoice = computed(() => {
    const sel = this.selection();
    return sel.startsWith(MY_PREFIX) ? this.myVoices().find((v) => v.id === sel.slice(MY_PREFIX.length)) ?? null : null;
  });

  /** The built-in voice that speaks the words. For one of the user's voices, it is adapted to the script's language. */
  readonly voiceId = computed(() => {
    const mine = this.myVoice();
    if (!mine) return this.selection().startsWith(MY_PREFIX) ? '' : this.selection();
    return this.speakerFor(mine);
  });

  readonly isFavorite = computed(() => this.favorites().includes(this.selection()));

  /** Favourites that still exist, for the one-click chips. */
  readonly favoriteOptions = computed<VoiceOption[]>(() =>
    this.favorites().filter((f) => this.isKnown(f)).map((value) => ({ value, label: this.labelFor(value) })));

  readonly voiceGroups = computed<VoiceGroup[]>(() => {
    const groups: VoiceGroup[] = [];
    if (this.myVoices().length > 0) {
      groups.push({
        label: 'My voices',
        voices: this.myVoices().map((v) => ({ value: MY_PREFIX + v.id, label: v.name })),
      });
    }
    const byLanguage = new Map<string, VoiceGroup>();
    for (const v of this.voices()) {
      const { language, label } = this.describeVoice(v);
      if (!byLanguage.has(language)) byLanguage.set(language, { label: language, voices: [] });
      byLanguage.get(language)!.voices.push({ value: v.id, label });
    }
    return [...groups, ...byLanguage.values()];
  });

  /** Built-in voices only, for choosing what speaks the words of a new voice. */
  readonly builtInGroups = computed(() => this.voiceGroups().filter((g) => g.label !== 'My voices'));

  readonly placedCount = computed(() => this.applied() ? this.results().filter((r) => r.asset).length : 0);
  readonly audibleCount = computed(() => this.results().filter((r) => r.previewUrl || r.asset).length);
  readonly existingLineCount = computed(() => this.state.voiceoverTracks().length);

  /** Voiceover files in the library that nothing on the timeline plays - left over from earlier takes. */
  readonly unusedVoiceoverFiles = computed(() =>
    (this.state.studio()?.musicCandidates ?? [])
      .filter((a) => a.name.startsWith('VO - ') && !this.state.isAudioAssetInUse(a.id)));

  /** The script, voice or speed changed since the results were spoken: they no longer match. */
  readonly stale = computed(() =>
    this.results().length > 0 && this.resultsKey() !== this.currentKey());

  /** Start, end and overrun for every line that has audio, under the current placement. */
  readonly plans = computed(() => {
    const schedule = this.voiceClips();
    const byClip = this.placement() === 'clips';
    const byScript = this.placement() === 'script';
    const scriptStarts = new Map(this.lines().map((l) => [l.index, l.start]));
    const entries: { index: number; plan: LinePlan; given?: number; clipStart?: number; clipEnd?: number }[] = [];
    let cursor = byClip || byScript ? 0 : this.anchorSeconds();
    let previousEnd = -Infinity;
    let first = true;

    for (const r of this.results()) {
      if (!r.previewUrl && !r.asset) continue;
      const duration = this.durationOf(r);
      const clip = byClip ? schedule[r.index] : undefined;
      // A time the script gives is the earliest the line starts: when the line before is still
      // speaking, it waits for it, so two voices never talk over each other.
      const given = byScript ? scriptStarts.get(r.index) : undefined;
      const start = given !== undefined
        ? first ? given : Math.max(given, previousEnd + MIN_GAP_SECONDS)
        : clip
        ? Math.max(clip.startSeconds + this.leadInSeconds(), previousEnd + this.gapSeconds())
        : first && !byClip ? cursor : Math.max(cursor, previousEnd + this.gapSeconds());
      const end = start + duration;
      entries.push({ index: r.index, plan: { startSeconds: start, endSeconds: end }, given, clipStart: clip?.startSeconds, clipEnd: clip?.endSeconds });
      previousEnd = end;
      cursor = end;
      first = false;
    }

    // Lines pushed along by the ones before them can end after the video does, where there is
    // no picture left. Pull the last ones earlier - into the breaths and lead-ins - when the
    // whole script fits; when it can't, they stay put and the panel offers a faster speed.
    const videoEnd = this.videoEnd();
    const speech = entries.reduce((sum, e) => sum + e.plan.endSeconds - e.plan.startSeconds, 0);
    const fits = speech + MIN_GAP_SECONDS * Math.max(0, entries.length - 1) <= videoEnd;
    if ((byClip || byScript) && fits && videoEnd > 0) {
      let limit = videoEnd;
      for (let i = entries.length - 1; i >= 0; i--) {
        const plan = entries[i].plan;
        if (plan.endSeconds <= limit + 0.001) break;
        const duration = plan.endSeconds - plan.startSeconds;
        plan.startSeconds = limit - duration;
        plan.endSeconds = limit;
        limit = plan.startSeconds - MIN_GAP_SECONDS;
      }
    }

    const plans = new Map<number, LinePlan>();
    for (const e of entries) {
      if (e.clipEnd !== undefined) e.plan.overrunSeconds = Math.max(0, e.plan.endSeconds - e.clipEnd);
      if (e.clipStart !== undefined && e.plan.startSeconds < e.clipStart - 0.05) e.plan.pulledEarly = true;
      if (e.given !== undefined && Math.abs(e.plan.startSeconds - e.given) > 0.05) e.plan.movedFromSeconds = e.given;
      plans.set(e.index, e.plan);
    }
    return plans;
  });

  readonly overruns = computed(() =>
    [...this.plans().values()].filter((p) => (p.overrunSeconds ?? 0) > 0.05));

  /** Seconds the last line runs past the end of the video, where the picture has ended. */
  readonly pastEndSeconds = computed(() => {
    const ends = [...this.plans().values()].map((p) => p.endSeconds);
    return ends.length === 0 || this.videoEnd() <= 0 ? 0 : Math.max(0, Math.max(...ends) - this.videoEnd());
  });

  /** The speed at which every line ends inside the video, or null when speed alone can't do it. */
  readonly fitRate = computed<number | null>(() => {
    const plans = [...this.plans().values()];
    // Lines the script times, or speeds, don't move with the panel's speed slider.
    if (this.placement() === 'script' || this.lines().some((l) => l.rate !== this.rate())) return null;
    if (plans.length === 0 || this.pastEndSeconds() <= 0.05) return null;
    const speech = plans.reduce((sum, p) => sum + p.endSeconds - p.startSeconds, 0);
    const firstStart = this.placement() === 'clips'
      ? (this.voiceClips()[0]?.startSeconds ?? 0) + this.leadInSeconds()
      : this.anchorSeconds();
    const room = this.videoEnd() - firstStart - MIN_GAP_SECONDS * (plans.length - 1);
    if (room <= 0) return null;
    // Speech gets shorter roughly in proportion to the speed; a little extra covers the rest.
    const needed = Math.ceil((this.rate() * speech / room) * 1.03 * 20) / 20;
    return needed > this.rate() && needed <= MAX_RATE ? needed : null;
  });

  /** Keeps the voice lines in step with the picture while "Play with clips" runs. */
  private readonly mixSync = effect(() => {
    if (!this.withClips()) return;
    const playing = this.state.isPlaying();
    this.state.currentTime();
    untracked(() => this.syncMix(playing));
  });

  ngOnInit(): void {
    const projectId = this.store.projectId() ?? 'none';
    this.libraryKey = LIBRARY_KEY_PREFIX + projectId;
    this.library.set(readLibrary(
      this.readStorage(this.libraryKey), this.readStorage(LEGACY_SCRIPT_KEY_PREFIX + projectId), Date.now()));
    this.script.set(activeScript(this.library()).text);
    if (this.hasTimings()) this.placement.set('script');
    const savedRate = Number(this.readStorage(RATE_KEY));
    if (savedRate >= 0.5 && savedRate <= 2) this.rate.set(savedRate);
    this.favorites.set(this.readFavorites());
    this.loadVoices(this.readStorage(ENGINE_KEY) ?? '');
  }

  /**
   * The voices of <paramref name="engine"/> ('' for the default one). An engine that has been
   * turned off since it was remembered is quietly replaced by the default.
   */
  private loadVoices(engine: string): void {
    this.loadingVoices.set(true);
    this.api.voiceoverVoices(engine || undefined).subscribe({
      next: (res) => {
        this.loadingVoices.set(false);
        this.available.set(res.available);
        this.unavailableReason.set(res.reason);
        this.voices.set(res.voices ?? []);
        this.engines.set(res.engines ?? []);
        this.engine.set(res.providerId ?? '');
        this.model.set(this.pickModel());
        this.myVoices.set(res.myVoices ?? []);
        this.myVoicesAvailable.set(res.myVoicesAvailable ?? false);
        if (!this.isKnown(this.selection())) this.selection.set(this.pickDefaultSelection());
        if (this.addingVoice() && !this.voices().some((v) => v.id === this.newVoiceBase())) {
          this.newVoiceBase.set(this.pickFrom(PREFERRED_VOICES[this.language()]) ?? this.voices()[0]?.id ?? '');
        }
      },
      error: (err: unknown) => {
        this.loadingVoices.set(false);
        this.available.set(false);
        this.unavailableReason.set(err instanceof Error ? err.message : 'Could not reach the server.');
      },
    });
  }

  onEngineChange(engine: string): void {
    if (engine === this.engine()) return;
    this.writeStorage(ENGINE_KEY, engine);
    this.loadVoices(engine);
  }

  onModelChange(model: string): void {
    this.model.set(model);
    this.writeStorage(MODEL_KEY_PREFIX + this.engine(), model);
  }

  /** The model last used with this engine, if it still offers it; else its configured one. */
  private pickModel(): string {
    const engine = this.currentEngine();
    if (!engine || engine.models.length === 0) return '';
    const remembered = this.readStorage(MODEL_KEY_PREFIX + engine.id);
    if (remembered && engine.models.some((m) => m.id === remembered)) return remembered;
    return engine.models.some((m) => m.id === engine.model) ? engine.model! : engine.models[0].id;
  }

  ngOnDestroy(): void {
    this.cancelRequested = true;
    this.stopPreview();
    this.stopWithClips();
    this.stopRecording(true);
    this.stopDictation(true);
    this.stopNarration(true);
    this.discardNarration();
    this.discardSample();
    this.releasePreviews(this.results());
  }

  setPlacement(placement: Placement): void {
    this.placement.set(placement);
    this.anchorSeconds.set(this.state.currentTime());
  }

  onScriptChange(value: string): void {
    this.showScript(value);
    this.saveLibrary(updateActiveText(this.library(), value, Date.now()));
  }

  // --- the project's scripts

  switchScript(id: string): void {
    if (this.generating() || id === this.library().activeId) return;
    this.renameDraft.set(null);
    this.assistNote.set('');
    this.saveLibrary(setActive(this.library(), id));
    this.showScript(activeScript(this.library()).text);
  }

  /** Starts an empty script; the one in the box stays in the list. */
  newScript(): void {
    this.addAndShow('', null);
  }

  duplicateScript(): void {
    const current = this.activeSaved();
    if (current) this.addAndShow(current.text, `${current.name} copy`);
  }

  startRename(): void {
    this.renameDraft.set(this.activeSaved()?.name ?? '');
  }

  commitRename(): void {
    const name = this.renameDraft();
    this.renameDraft.set(null);
    if (name !== null) this.saveLibrary(renameScript(this.library(), this.library().activeId, name));
  }

  cancelRename(): void {
    this.renameDraft.set(null);
  }

  /** Not undoable, so it asks first; the lines it placed on A1 stay. */
  deleteCurrentScript(): void {
    const current = this.activeSaved();
    if (!current || this.generating()) return;
    if (current.text.trim() && !confirm(`Delete the script "${current.name}"? Lines already on A1 stay.`)) return;
    this.saveLibrary(deleteScript(this.library(), current.id, Date.now()));
    this.showScript(activeScript(this.library()).text);
  }

  /** "Today 7:57 pm" or "9 Oct, 7:57 pm", for when a script was last applied. */
  whenLabel(epochMs: number): string {
    const date = new Date(epochMs);
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return date.toDateString() === new Date().toDateString()
      ? `today ${time}`
      : `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
  }

  private addAndShow(text: string, name: string | null): void {
    if (this.generating()) return;
    const next = addScript(this.library(), text, name, Date.now());
    if (!next) {
      this.error.set(`You can keep up to ${MAX_SCRIPTS} scripts per project. Delete one you no longer need first.`);
      return;
    }
    this.renameDraft.set(null);
    this.saveLibrary(next);
    this.showScript(text);
  }

  private saveLibrary(library: ScriptLibrary): void {
    this.library.set(library);
    if (this.libraryKey) this.writeStorage(this.libraryKey, JSON.stringify(library));
  }

  // --- speaking the script instead of typing it

  /** Records the script spoken aloud; stopping sends it to the server's speech-to-text engine. */
  async startDictation(): Promise<void> {
    if (this.dictating() || this.assist() !== 'idle') return;
    this.assistNote.set('');
    this.error.set('');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      this.error.set('The microphone could not be opened. Allow microphone access for this site and try again.');
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (this.dictateRecorder !== recorder) return;
      this.dictateRecorder = null;
      void this.transcribe(new Blob(chunks, { type: recorder.mimeType }));
    };
    this.dictateRecorder = recorder;
    this.dictateSeconds.set(0);
    this.dictating.set(true);
    recorder.start();
    this.dictateTimer = setInterval(() => {
      this.dictateSeconds.update((s) => s + 1);
      if (this.dictateSeconds() >= MAX_DICTATE_SECONDS) this.stopDictation();
    }, 1000);
  }

  /** Stops the microphone; <paramref name="discard"/> throws the recording away. */
  stopDictation(discard = false): void {
    if (this.dictateTimer) {
      clearInterval(this.dictateTimer);
      this.dictateTimer = null;
    }
    this.dictating.set(false);
    const recorder = this.dictateRecorder;
    if (!recorder) return;
    if (discard) this.dictateRecorder = null;
    if (recorder.state !== 'inactive') recorder.stop();
    else if (discard) recorder.stream.getTracks().forEach((t) => t.stop());
  }

  /** Adds what was said to the end of the script, one line per spoken phrase. */
  private async transcribe(recording: Blob): Promise<void> {
    const projectId = this.store.projectId();
    if (!projectId) return;
    const scriptId = this.library().activeId;
    this.assist.set('transcribing');
    try {
      const wav = await toWav(recording, DICTATE_SAMPLE_RATE);
      const language = this.language() === 'hindi' ? 'hi' : null;
      const heard = await firstValueFrom(this.api.dictateVoiceScript(projectId, wav, language));
      // Switching scripts while it was heard: the words belong to the one it was spoken into.
      if (this.library().activeId !== scriptId || this.store.projectId() !== projectId) return;
      const current = this.script().trimEnd();
      this.onScriptChange((current ? `${current}\n` : '') + heard.lines.join('\n'));
      this.assistNote.set(`Added ${heard.lines.length} line(s) from your recording. Read them over, or ✨ Polish them.`);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'The recording could not be turned into text.');
    } finally {
      this.assist.set('idle');
    }
  }

  /**
   * Has the AI text model rewrite the script so it reads aloud well, and keeps the result as a
   * new script next to the original, so nothing written by hand is ever overwritten.
   */
  async polishScript(): Promise<void> {
    const projectId = this.store.projectId();
    const source = this.activeSaved();
    if (!projectId || !source || !this.script().trim() || this.assist() !== 'idle' || this.generating()) return;
    this.assistNote.set('');
    this.error.set('');
    this.assist.set('polishing');
    try {
      // A second polish of the same words asks for a new take, not the cached first one.
      const text = this.script();
      const fresh = this.polishedTexts.has(text);
      const result = await firstValueFrom(this.api.polishVoiceScript(projectId, text, fresh));
      if (this.store.projectId() !== projectId) return;
      this.polishedTexts.add(text);
      const base = source.name.replace(/ · polished( \(\d+\))?$/, '');
      this.addAndShow(result.script, `${base} · polished`);
      this.assistNote.set(`Polished version saved as a new script. "${source.name}" is still in the list.`);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'The script could not be polished.');
    } finally {
      this.assist.set('idle');
    }
  }

  // --- narrating in the user's own voice, cleaned on the server

  /** Records a narration take; stopping keeps it to listen to before it is cleaned and placed. */
  async startNarration(): Promise<void> {
    if (this.narrating() || this.narrationBusy()) return;
    this.narrationNote.set('');
    this.error.set('');
    this.discardNarration();
    let stream: MediaStream;
    try {
      // The browser's own processing is off: the server cleans the take, and two noise
      // reducers in a row make a voice sound underwater.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      this.error.set('The microphone could not be opened. Allow microphone access for this site and try again.');
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (this.narrateRecorder !== recorder) return;
      this.narrateRecorder = null;
      void this.keepNarration(new Blob(chunks, { type: recorder.mimeType }));
    };
    this.narrateRecorder = recorder;
    this.narrateSeconds.set(0);
    this.narrating.set(true);
    recorder.start();
    this.narrateTimer = setInterval(() => {
      this.narrateSeconds.update((s) => s + 1);
      if (this.narrateSeconds() >= MAX_NARRATE_SECONDS) this.stopNarration();
    }, 1000);
  }

  /** Stops the microphone; <paramref name="discard"/> throws the take away. */
  stopNarration(discard = false): void {
    if (this.narrateTimer) {
      clearInterval(this.narrateTimer);
      this.narrateTimer = null;
    }
    this.narrating.set(false);
    const recorder = this.narrateRecorder;
    if (!recorder) return;
    if (discard) this.narrateRecorder = null;
    if (recorder.state !== 'inactive') recorder.stop();
    else if (discard) recorder.stream.getTracks().forEach((t) => t.stop());
  }

  discardNarration(): void {
    const take = this.narrationTake();
    if (take) URL.revokeObjectURL(take.url);
    this.narrationTake.set(null);
  }

  /**
   * Sends the take to be cleaned (rumble, room noise, silence at the ends, uneven level) and
   * puts the cleaned line on A1 at the playhead, as one Undo step.
   */
  async placeNarration(): Promise<void> {
    const projectId = this.store.projectId();
    const take = this.narrationTake();
    if (!projectId || !take || this.narrationBusy()) return;
    const start = this.state.currentTime();
    this.narrationBusy.set(true);
    this.error.set('');
    try {
      const asset = await firstValueFrom(this.api.recordNarration(projectId, take.blob, this.narrationName()));
      if (this.store.projectId() !== projectId) return;
      this.state.addVoiceoverTracks([{ asset, startSeconds: start }]);
      this.store.refreshAssets();
      this.discardNarration();
      this.narrationName.set('');
      this.narrationNote.set(
        `Cleaned and placed on A1 at ${start.toFixed(1)}s (${(asset.durationSeconds ?? 0).toFixed(1)}s). Ctrl+Z takes it back.`);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'The take could not be cleaned.');
    } finally {
      this.narrationBusy.set(false);
    }
  }

  private async keepNarration(recording: Blob): Promise<void> {
    try {
      const wav = await toWav(recording, NARRATION_SAMPLE_RATE);
      const url = URL.createObjectURL(wav);
      this.narrationTake.set({ blob: wav, fileName: 'narration.wav', url, seconds: await this.readDuration(url) });
    } catch {
      this.error.set('That recording could not be read. Try again.');
    }
  }

  /** Shows a script's text in the box, keeping the placement and voice in step with it. Saves nothing. */
  private showScript(value: string): void {
    const before = this.language();
    const hadTimings = this.hasTimings();
    this.script.set(value);
    // A script that gives times means them; one that stops giving them can't be placed by them.
    if (this.hasTimings() && !hadTimings) this.setPlacement('script');
    else if (!this.hasTimings() && this.placement() === 'script') this.setPlacement('clips');
    // A Hindi script in an English voice is read out letter by letter: switch to the voice
    // last used for the script's language (or a natural-sounding one) when the language flips.
    if (this.language() !== before && !this.fitsLanguage(this.selection(), this.language())) {
      this.selection.set(this.pickDefaultSelection());
    }
  }

  onVoiceChange(value: string): void {
    this.selection.set(value);
    // Remembered per language, so a Hindi script and an English one each get their own voice back.
    this.writeStorage(VOICE_KEY_PREFIX + this.language(), value);
  }

  toggleFavorite(): void {
    const sel = this.selection();
    if (!sel) return;
    const next = this.favorites().includes(sel)
      ? this.favorites().filter((f) => f !== sel)
      : [...this.favorites(), sel];
    this.favorites.set(next);
    this.writeStorage(FAVORITES_KEY, JSON.stringify(next));
  }

  onRateChange(rate: number): void {
    this.rate.set(rate);
    this.writeStorage(RATE_KEY, String(rate));
  }

  /** Raises the speed to what makes every line end inside the video, and speaks the lines again. */
  async speedUpToFit(): Promise<void> {
    const rate = this.fitRate();
    if (rate === null) return;
    this.onRateChange(rate);
    await this.previewLines();
  }

  /**
   * Step 1: speaks every line without saving anything, so the voice, speed and timing can be
   * heard - alone or against the clips - before any of it touches the library or A1.
   */
  async previewLines(): Promise<void> {
    const projectId = this.store.projectId();
    if (!projectId || !this.canRun()) return;

    this.begin('previewing');
    // Each preview works the speed-ups out afresh from the script's own speeds.
    this.fitted.set({ key: '', rates: new Map() });
    const results: LineResult[] = [];

    for (const line of this.lines()) {
      if (this.cancelRequested) break;
      try {
        results.push(await this.previewOne(projectId, line));
      } catch (err: unknown) {
        if (this.recordFailure(results, line, err)) break;
      }
      this.progress(results);
    }

    await this.fitToSlots(projectId, results);
    this.fittingIndex.set(null);
    this.finish(results, this.currentKey());
  }

  /**
   * Speeds up each script-timed line that runs past its time and speaks it again, so it ends
   * before the next line starts (or by its "end") instead of being pushed later. Speeds stop at
   * MAX_FIT_RATE; a line still too long there is pushed along and shows where it moved from.
   */
  private async fitToSlots(projectId: string, results: LineResult[]): Promise<void> {
    const slots = this.slots();
    if (slots.size === 0) return;
    const scriptKey = keyOf(this.scriptLines(), this.engineKey());

    for (let pass = 0; pass < FIT_PASSES && !this.cancelRequested; pass++) {
      const rates = new Map(this.fittedRates());
      const refit: ScriptLine[] = [];
      for (const line of this.lines()) {
        const slot = slots.get(line.index);
        const r = results.find((x) => x.index === line.index && x.previewUrl);
        if (!slot || !r?.durationSeconds) continue;
        const room = slot.end - slot.start;
        if (r.durationSeconds <= room + 0.05) continue;
        // Speech shortens roughly in step with the speed; a little extra covers the rest.
        const rate = Math.min(MAX_FIT_RATE, Math.ceil(line.rate * (r.durationSeconds / room) * 1.03 * 100) / 100);
        if (rate <= line.rate + 0.005) continue;
        rates.set(line.index, rate);
        refit.push({ ...line, rate });
      }
      if (refit.length === 0) return;
      this.fitted.set({ key: scriptKey, rates });

      for (const line of refit) {
        if (this.cancelRequested) return;
        this.fittingIndex.set(line.index);
        const at = results.findIndex((x) => x.index === line.index);
        try {
          const faster = await this.previewOne(projectId, line);
          if (results[at].previewUrl) URL.revokeObjectURL(results[at].previewUrl!);
          results[at] = faster;
        } catch (err: unknown) {
          if (this.recordFailure([], line, err)) return;
        }
        this.progress(results);
      }
    }
  }

  private async previewOne(projectId: string, line: ScriptLine): Promise<LineResult> {
    const blob = await firstValueFrom(this.api.previewVoiceover(projectId, this.bodyFor(line)));
    const previewUrl = URL.createObjectURL(blob);
    return {
      index: line.index, text: line.text, character: line.character, previewUrl,
      durationSeconds: await this.readDuration(previewUrl),
    };
  }

  /**
   * Step 2: saves every line to the library and lays it on A1 as one Undo step. Lines just
   * previewed come back from the server's speech cache, and a line already saved with the
   * same words, voice and speed is reused rather than saved again.
   */
  async apply(): Promise<void> {
    const projectId = this.store.projectId();
    if (!projectId || !this.canRun()) return;
    // Script-timed lines get their speeds from a preview: speak them first so the saved
    // takes are the ones that fit.
    if (this.slots().size > 0 && (this.results().length === 0 || this.stale())) {
      await this.previewLines();
      if (this.cancelRequested || this.store.projectId() !== projectId || !this.canRun()) return;
    }

    this.stopWithClips();
    this.begin('applying');
    this.anchorSeconds.set(this.state.currentTime());
    const key = this.currentKey();
    const previews = this.stale() ? [] : this.results();
    const results: LineResult[] = [];

    for (const line of this.lines()) {
      if (this.cancelRequested) break;
      const previewed = previews.find((r) => r.index === line.index && r.previewUrl);
      try {
        const asset = await firstValueFrom(this.api.generateVoiceover(projectId, this.bodyFor(line)));
        results.push({
          index: line.index, text: line.text, character: line.character, asset, previewUrl: previewed?.previewUrl,
          durationSeconds: asset.durationSeconds ?? previewed?.durationSeconds,
        });
      } catch (err: unknown) {
        if (this.recordFailure(results, line, err)) break;
      }
      this.progress(results);
    }

    this.finish(results, key);

    // A project switch mid-run must not drop this project's lines onto another timeline.
    if (this.store.projectId() === projectId) {
      const plans = this.plans();
      const placements = results
        .filter((r) => r.asset && plans.has(r.index))
        .map((r) => ({ asset: r.asset!, startSeconds: plans.get(r.index)!.startSeconds }));
      const replacing = this.replaceExisting() && placements.length > 0 ? this.existingLineCount() : 0;
      this.state.addVoiceoverTracks(placements, replacing > 0);
      this.replacedCount.set(replacing);
      this.applied.set(placements.length > 0);
      if (placements.length > 0) {
        // So the script list says which take is on the timeline.
        this.saveLibrary(markApplied(this.library(), Date.now()));
        // New files must show on the Assets page too, not only in the studio's media panel.
        this.store.refreshAssets();
      }
    }
  }

  cancel(): void {
    this.cancelRequested = true;
  }

  /** Deletes library voiceover files nothing on the timeline uses. Not undoable, so it asks first. */
  async deleteUnusedFiles(): Promise<void> {
    const files = this.unusedVoiceoverFiles();
    if (files.length === 0 || this.cleaning()) return;
    if (!confirm(`Delete ${files.length} voiceover file(s) that aren't on the timeline? This can't be undone.`)) return;

    this.cleaning.set(true);
    const deleted: string[] = [];
    try {
      for (const file of files) {
        // Checked again: an Undo while this runs can put a file back on A1.
        if (this.state.isAudioAssetInUse(file.id)) continue;
        await firstValueFrom(this.api.deleteAsset(file.id));
        deleted.push(file.id);
      }
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Some files could not be deleted.');
    } finally {
      this.state.forgetAudioAssets(deleted);
      if (deleted.length > 0) this.store.refreshAssets();
      this.cleaning.set(false);
    }
  }

  togglePreview(result: LineResult): void {
    if (this.previewingIndex() === result.index) {
      this.stopPreview();
      return;
    }
    const src = result.previewUrl ?? (result.asset ? this.api.assetUrl(result.asset.id) : null);
    if (!src) return;
    this.stopPreview();
    this.stopWithClips();
    this.preview = new Audio(src);
    this.preview.onended = () => this.previewingIndex.set(null);
    this.previewingIndex.set(result.index);
    this.preview.play().catch(() => this.previewingIndex.set(null));
  }

  /** Plays the timeline with the previewed lines over it, without placing anything. */
  toggleWithClips(): void {
    if (this.withClips()) {
      this.stopWithClips();
      this.state.pause();
      return;
    }
    const plans = this.plans();
    this.stopPreview();
    this.mix = this.results()
      .filter((r) => plans.has(r.index) && (r.previewUrl || r.asset))
      .map((r) => {
        const audio = new Audio(r.previewUrl ?? this.api.assetUrl(r.asset!.id));
        audio.preload = 'auto';
        return { audio, plan: plans.get(r.index)! };
      });
    if (this.mix.length === 0) return;

    const firstStart = Math.min(...this.mix.map((m) => m.plan.startSeconds));
    this.mixEnd = Math.max(...this.mix.map((m) => m.plan.endSeconds));
    // From the clip the first line sits on, so the lead-in is heard too.
    const clip = this.state.clipSchedule().find((c) => c.startSeconds <= firstStart && firstStart < c.endSeconds);
    this.state.seekTo(clip && this.placement() === 'clips' ? clip.startSeconds : Math.max(0, firstStart - 0.5));
    this.withClips.set(true);
    // The lines already on A1 would talk over this take.
    this.state.auditioningVoiceover.set(true);
    this.state.play();
  }

  /**
   * Instructions for an AI writing tool, with this studio's real voices and the video's length
   * filled in, so the script it writes can be pasted straight into the Script box.
   */
  async copyAiPrompt(): Promise<void> {
    const mine = this.myVoices().map((v) => `my:${v.name}`);
    const groups = this.voiceGroups().filter((g) => g.label !== 'My voices');
    // Gemini's voices are told apart by their character ("Kore (Firm)"), which helps the AI cast them.
    const builtIn = groups.map((g) => g.label === ANY_LANGUAGE_LABEL
      ? `  ${g.label}: ${g.voices.map((v) => `${v.value} - ${v.label.replace(/^\S+\s*\((.+)\)$/, '$1').toLowerCase()}`).join(', ')}`
      : `  ${g.label}: ${g.voices.map((v) => v.value).join(', ')}`);
    const anyLanguage = groups.some((g) => g.label === ANY_LANGUAGE_LABEL);
    const byLanguage = groups.some((g) => g.label !== ANY_LANGUAGE_LABEL);
    const clips = this.voiceClips()
      .map((c, i) => `  clip ${i + 1}: ${c.startSeconds.toFixed(1)}s - ${c.endSeconds.toFixed(1)}s`);
    const prompt = [
      'Write the voiceover script for my video as JSON in exactly this format, with nothing else around it:',
      '',
      '{',
      '  "version": 1,',
      '  "characters": [',
      '    { "name": "Narrator", "voice": "<voice>", "speed": 0.95 }',
      '  ],',
      '  "lines": [',
      '    { "character": "Narrator", "start": 0.3, "end": 7.5, "emotion": "calm", "text": "<what is said>" }',
      '  ]',
      '}',
      '',
      'Rules:',
      '- "start" is the second in the video the line begins (a number like 10.5, or "0:10.5"). Leave it out to follow straight on after the previous line.',
      `- "end" (optional) is the second the line must have finished by. Without it a line must finish before the next line's "start" (the last one, before the video ends). A line too long for its time is spoken faster, up to ${MAX_FIT_RATE}x, so keep the words to what fits.`,
      '- "speed" is 0.5 to 2.0; 0.9 - 1.0 sounds like calm narration. A line\'s own "speed" or "voice" overrides its character\'s.',
      '- "emotion" is one word (calm, excited, sad, angry, whispering, divine, ...).',
      ...(anyLanguage ? [
        `- With an "${ANY_LANGUAGE_LABEL}" voice, a line's "text" may begin with a short acting direction, like "Say excitedly: ..." or "Whisper: ..."; it is performed, not read out. Never do this with any other voice - it would be read aloud.`,
      ] : []),
      '- Keep each line to one or two sentences, sized to its time: about 2.5 words per second at speed 1.0 (fewer for Hindi - about 2), so a 7-second line at speed 0.9 has room for about 15 English words.',
      '- Lines must not overlap, and the last line must end before the video does. Add up the time of every line and check the total fits.',
      `- "voice" must be one of these.${mine.length > 0 ? ` My own voices: ${mine.join(', ')}.` : ''} Built-in voices:`,
      ...builtIn,
      ...(byLanguage ? ['  (Those listed by language speak only that language: a Hindi script needs a Hindi voice - ids starting with "h"; my own voices speak any language.)'] : []),
      ...(anyLanguage ? [`  ("${ANY_LANGUAGE_LABEL}" voices speak Hindi, English and more, read from the text itself. Write only the id, like "Kore", and pick by the character after it.)`] : []),
      '',
      `The video is ${this.videoEnd().toFixed(1)} seconds long.${clips.length > 0 ? ' Its clips:' : ''}`,
      ...clips,
      '',
      'Here is what the voiceover should say:',
      '',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(prompt);
      this.promptCopied.set(true);
      setTimeout(() => this.promptCopied.set(false), 2500);
    } catch {
      this.error.set('The browser did not allow copying. Allow clipboard access for this site and try again.');
    }
  }

  seekTo(index: number): void {
    const plan = this.plans().get(index);
    if (plan) this.state.seekTo(plan.startSeconds);
  }

  voiceHint(): string {
    switch (this.unavailableReason()) {
      case 'Disabled':
      case 'NotConfigured':
        return 'No speech engine is turned on.';
      case 'CircuitOpen':
        return 'The speech engine stopped answering. Check that it is running, then reopen this panel.';
      case 'Unreachable':
        return 'The speech engine is turned on but not running - nothing answered on its address.';
      default:
        return this.unavailableReason();
    }
  }

  // --- the user's own voices

  openAddVoice(): void {
    // A voice of your own is built on a voice of the default engine (first in the configured
    // order), which is also what speaks its lines - never a picked hosted one.
    const fallback = this.engines()[0]?.id;
    if (fallback && this.engine() !== fallback) this.onEngineChange(fallback);
    this.voiceError.set('');
    this.newVoiceName.set(this.myVoices().length === 0 ? 'My voice' : `My voice ${this.myVoices().length + 1}`);
    this.newVoiceBase.set(this.voiceId() || this.pickFrom(PREFERRED_VOICES[this.language()]) || this.voices()[0]?.id || '');
    this.newVoiceConsent.set(false);
    this.discardSample();
    this.addingVoice.set(true);
  }

  closeAddVoice(): void {
    this.stopRecording(true);
    this.discardSample();
    this.addingVoice.set(false);
  }

  async startRecording(): Promise<void> {
    this.voiceError.set('');
    this.discardSample();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      this.voiceError.set('The microphone could not be opened. Allow microphone access for this site, or upload a recording instead.');
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (this.recorder !== recorder) return;
      this.recorder = null;
      void this.useRecording(new Blob(chunks, { type: recorder.mimeType }));
    };
    this.recorder = recorder;
    this.recordSeconds.set(0);
    this.recording.set(true);
    recorder.start();
    this.recordTimer = setInterval(() => {
      this.recordSeconds.update((s) => s + 1);
      if (this.recordSeconds() >= MAX_RECORD_SECONDS) this.stopRecording();
    }, 1000);
  }

  /** Stops the microphone; <paramref name="discard"/> throws the take away. */
  stopRecording(discard = false): void {
    if (this.recordTimer) {
      clearInterval(this.recordTimer);
      this.recordTimer = null;
    }
    this.recording.set(false);
    const recorder = this.recorder;
    if (!recorder) return;
    if (discard) this.recorder = null;
    if (recorder.state !== 'inactive') recorder.stop();
    else if (discard) recorder.stream.getTracks().forEach((t) => t.stop());
  }

  onSampleFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.voiceError.set('');
    if (file.size > MAX_SAMPLE_BYTES) {
      this.voiceError.set('That file is over 25MB. Half a minute of clear speech is plenty.');
      return;
    }
    void this.setSample(file, file.name);
  }

  async saveMyVoice(): Promise<void> {
    const sample = this.newSample();
    const name = this.newVoiceName().trim();
    if (!sample || !name || !this.newVoiceConsent() || !this.newVoiceBase() || this.savingVoice()) return;

    this.savingVoice.set(true);
    this.voiceError.set('');
    try {
      const voice = await firstValueFrom(this.api.addMyVoice(sample.blob, sample.fileName, name, this.newVoiceBase()));
      this.myVoices.update((v) => [...v, voice]);
      this.onVoiceChange(MY_PREFIX + voice.id);
      this.closeAddVoice();
    } catch (err: unknown) {
      this.voiceError.set(err instanceof Error ? err.message : 'The voice could not be added.');
    } finally {
      this.savingVoice.set(false);
    }
  }

  async deleteMyVoice(): Promise<void> {
    const voice = this.myVoice();
    if (!voice) return;
    if (!confirm(`Delete "${voice.name}"? Its sample is deleted too. Lines already placed on the timeline stay.`)) return;
    try {
      await firstValueFrom(this.api.deleteMyVoice(voice.id));
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'The voice could not be deleted.');
      return;
    }
    const value = MY_PREFIX + voice.id;
    this.myVoices.update((v) => v.filter((x) => x.id !== voice.id));
    if (this.favorites().includes(value)) {
      this.favorites.update((f) => f.filter((x) => x !== value));
      this.writeStorage(FAVORITES_KEY, JSON.stringify(this.favorites()));
    }
    this.selection.set(this.pickDefaultSelection());
  }

  labelFor(value: string): string {
    if (value.startsWith(MY_PREFIX)) {
      return this.myVoices().find((v) => MY_PREFIX + v.id === value)?.name ?? 'My voice';
    }
    const voice = this.voices().find((v) => v.id === value);
    return voice ? this.describeVoice(voice).label : value;
  }

  private async useRecording(blob: Blob): Promise<void> {
    // A browser recording's container often has no duration in its header, so the server
    // couldn't measure it; plain WAV always can.
    try {
      const wav = await toWav(blob);
      await this.setSample(wav, 'recording.wav');
    } catch {
      this.voiceError.set('That recording could not be read. Try again, or upload a file.');
    }
  }

  private async setSample(blob: Blob, fileName: string): Promise<void> {
    this.discardSample();
    const url = URL.createObjectURL(blob);
    const seconds = await this.readDuration(url);
    this.newSample.set({ blob, fileName, url, seconds });
    if (seconds !== undefined && seconds < MIN_SAMPLE_SECONDS) {
      this.voiceError.set(`That's only ${seconds.toFixed(1)}s. Record at least ${MIN_SAMPLE_SECONDS}s - 15 to 30s sounds most like you.`);
    }
  }

  private discardSample(): void {
    const sample = this.newSample();
    if (sample) URL.revokeObjectURL(sample.url);
    this.newSample.set(null);
  }

  // --- internals

  private canRun(): boolean {
    return this.ready() && !this.generating();
  }

  private begin(busy: Busy): void {
    this.stopPreview();
    this.busy.set(busy);
    this.cancelRequested = false;
    this.doneCount.set(0);
    this.error.set('');
    this.applied.set(false);
    this.replacedCount.set(0);
  }

  private progress(results: LineResult[]): void {
    this.doneCount.set(results.length);
    this.results.set([...results]);
  }

  private finish(results: LineResult[], key: string): void {
    // Object URLs from the previous run that this one did not carry over.
    const kept = new Set(results.map((r) => r.previewUrl));
    this.releasePreviews(this.previousResults.filter((r) => !kept.has(r.previewUrl)));
    this.previousResults = results;
    this.results.set(results);
    this.resultsKey.set(key);
    this.busy.set('idle');
  }

  /** Records a failed line; true when the engine is down and the rest would fail the same way. */
  private recordFailure(results: LineResult[], line: ScriptLine, err: unknown): boolean {
    const message = err instanceof Error ? err.message : 'Could not speak this line.';
    results.push({ index: line.index, text: line.text, character: line.character, error: message });
    const status = (err as { status?: number })?.status;
    if (status === 503 || status === 0 || /unavailable|not running|reach the api/i.test(message)) {
      this.error.set(message);
      return true;
    }
    return false;
  }

  private bodyFor(line: ScriptLine) {
    // A line in the user's own voice is made on this machine; the server ignores an engine for it.
    if (line.myVoice) return { text: line.text, voiceId: line.voiceId, rate: line.rate, myVoiceId: line.myVoice.id };
    return {
      text: line.text, voiceId: line.voiceId, rate: line.rate,
      engine: this.engine() || undefined, model: this.model() || undefined,
    };
  }

  private currentKey(): string {
    return keyOf(this.lines(), this.engineKey());
  }

  /**
   * The picker value for a voice a script names: "my:<name or id>" for one of the user's own
   * voices, otherwise a built-in voice id. Null when no such voice is installed.
   */
  private selectionFor(named: string): string | null {
    if (named.toLowerCase().startsWith(MY_VOICE_PREFIX)) {
      const wanted = named.slice(MY_VOICE_PREFIX.length).trim().toLowerCase();
      const mine = this.myVoices().find((v) => v.name.trim().toLowerCase() === wanted || v.id === wanted);
      return mine ? MY_PREFIX + mine.id : null;
    }
    // A Kokoro blend ("af_bella+af_sky") is spoken as long as each part is installed.
    const parts = named.split('+');
    return parts.every((p) => this.voices().some((v) => v.id === p)) ? named : null;
  }

  private missingVoiceHint(named: string): string {
    if (!named.toLowerCase().startsWith(MY_VOICE_PREFIX)) return 'Use an id from the Voice list, like hm_omega.';
    const names = this.myVoices().map((v) => v.name);
    return names.length > 0 ? `Your voices are: ${names.join(', ')}.` : 'Add your own voice first.';
  }

  private durationOf(r: LineResult): number {
    return r.durationSeconds ?? r.asset?.durationSeconds ?? this.estimateSeconds(r.text);
  }

  private readDuration(url: string): Promise<number | undefined> {
    return new Promise((resolve) => {
      const probe = new Audio();
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => resolve(Number.isFinite(probe.duration) ? probe.duration : undefined);
      probe.onerror = () => resolve(undefined);
      probe.src = url;
    });
  }

  private syncMix(playing: boolean): void {
    const t = this.state.getCurrentTimeExact();
    if (t > this.mixEnd + 0.5) {
      this.stopWithClips();
      this.state.pause();
      return;
    }
    for (const { audio, plan } of this.mix) {
      const inside = playing && t >= plan.startSeconds && t < plan.endSeconds;
      if (!inside) {
        if (!audio.paused) audio.pause();
        continue;
      }
      const offset = t - plan.startSeconds;
      // Finished a little before its estimated end: let it stay finished.
      if (audio.ended && offset >= audio.duration - 0.35) continue;
      // Re-seek on a jump (a scrub, or the first frame inside the line), not on every tick.
      if (audio.paused || Math.abs(audio.currentTime - offset) > 0.35) {
        audio.currentTime = offset;
      }
      if (audio.paused) audio.play().catch(() => undefined);
    }
  }

  private stopWithClips(): void {
    for (const { audio } of this.mix) audio.pause();
    this.mix = [];
    this.withClips.set(false);
    this.state.auditioningVoiceover.set(false);
  }

  private releasePreviews(results: LineResult[]): void {
    for (const r of results) if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
  }

  /** About 2.6 words a second - only used when the server could not probe the file. */
  private estimateSeconds(text: string): number {
    return Math.max(1, text.split(/\s+/).length / 2.6);
  }

  private describeVoice(v: VoiceoverVoice): { language: string; label: string } {
    // Saved from Kokoro's Tune tab: "hx_keshav_tuned" is a Hindi voice tuned from a recording.
    const tuned = /^([a-z])[a-z]?_(.+)_tuned$/.exec(v.id);
    if (tuned && KOKORO_LANGUAGES[tuned[1]]) {
      const name = tuned[2].replace(/_/g, ' ');
      return { language: KOKORO_LANGUAGES[tuned[1]], label: `${name.charAt(0).toUpperCase()}${name.slice(1)} (tuned)` };
    }
    const match = /^([a-z])([fm])_(.+)$/.exec(v.id);
    if (match && KOKORO_LANGUAGES[match[1]]) {
      const name = match[3].charAt(0).toUpperCase() + match[3].slice(1);
      return { language: KOKORO_LANGUAGES[match[1]], label: `${name} (${match[2] === 'f' ? 'female' : 'male'})` };
    }
    const gender = v.gender ? ` (${v.gender.toLowerCase()})` : '';
    const language = v.languageCode === ANY_LANGUAGE ? ANY_LANGUAGE_LABEL : v.languageCode || 'Voices';
    return { language, label: `${v.name || v.id}${gender}` };
  }

  /**
   * The built-in voice that speaks the words for one of the user's voices. Its timbre is
   * replaced, but its language is not: a Hindi script needs a Hindi speaker of the same gender.
   */
  private speakerFor(mine: MyVoice): string {
    const base = mine.baseVoiceId;
    if (this.fitsLanguage(base, this.language())) return base;
    const gender = /^[a-z]([fm])_/.exec(base)?.[1];
    const preferred = PREFERRED_VOICES[this.language()];
    const sameGender = preferred.filter((id) => id[1] === gender);
    return this.pickFrom(sameGender) ?? this.pickFrom(preferred) ?? base;
  }

  private isKnown(value: string): boolean {
    return value.startsWith(MY_PREFIX)
      ? this.myVoices().some((v) => MY_PREFIX + v.id === value)
      : this.voices().some((v) => v.id === value);
  }

  /** The user's own voices and Gemini's speak any language; a Kokoro voice speaks its own. */
  private fitsLanguage(value: string, language: Language): boolean {
    if (!value) return false;
    if (value.startsWith(MY_PREFIX)) return true;
    if (this.voices().some((v) => v.id === value && v.languageCode === ANY_LANGUAGE)) return true;
    return value.startsWith('h') === (language === 'hindi');
  }

  /** The voice last used for the script's language, else a favourite that speaks it, else a natural one. */
  private pickDefaultSelection(): string {
    const language = this.language();
    const remembered = [this.readStorage(VOICE_KEY_PREFIX + language), this.readStorage(LEGACY_VOICE_KEY)];
    for (const value of remembered) {
      if (value && this.isKnown(value) && this.fitsLanguage(value, language)) return value;
    }
    const favorite = this.favorites().find((f) => this.isKnown(f) && this.fitsLanguage(f, language));
    if (favorite) return favorite;
    return this.pickFrom(PREFERRED_VOICES[language]) ?? this.voices()[0]?.id ?? '';
  }

  private pickFrom(ids: string[]): string | undefined {
    const known = new Set(this.voices().map((v) => v.id));
    return ids.find((id) => known.has(id));
  }

  private stopPreview(): void {
    if (this.preview) {
      this.preview.pause();
      this.preview = null;
    }
    this.previewingIndex.set(null);
  }

  private readFavorites(): string[] {
    try {
      const parsed: unknown = JSON.parse(this.readStorage(FAVORITES_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string' && v.length <= 80) : [];
    } catch {
      return [];
    }
  }

  // The script draft, voice choice and favourites are per-viewer conveniences: storage may be blocked.
  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private window or blocked storage: the panel still works, it just forgets. */
    }
  }
}

/**
 * Decodes any recording the browser can play and writes it as 16-bit mono PCM WAV, resampled
 * to <paramref name="sampleRate"/> when one is given.
 */
async function toWav(blob: Blob, sampleRate?: number): Promise<Blob> {
  const context = new AudioContext();
  try {
    let audio = await context.decodeAudioData(await blob.arrayBuffer());
    if (sampleRate && audio.sampleRate !== sampleRate) {
      const offline = new OfflineAudioContext(audio.numberOfChannels, Math.ceil(audio.duration * sampleRate), sampleRate);
      const source = offline.createBufferSource();
      source.buffer = audio;
      source.connect(offline.destination);
      source.start();
      audio = await offline.startRendering();
    }
    const mono = new Float32Array(audio.length);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const channel = audio.getChannelData(c);
      for (let i = 0; i < channel.length; i++) mono[i] += channel[i] / audio.numberOfChannels;
    }

    const bytes = new DataView(new ArrayBuffer(44 + mono.length * 2));
    const text = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) bytes.setUint8(offset + i, value.charCodeAt(i));
    };
    text(0, 'RIFF');
    bytes.setUint32(4, 36 + mono.length * 2, true);
    text(8, 'WAVE');
    text(12, 'fmt ');
    bytes.setUint32(16, 16, true);
    bytes.setUint16(20, 1, true);
    bytes.setUint16(22, 1, true);
    bytes.setUint32(24, audio.sampleRate, true);
    bytes.setUint32(28, audio.sampleRate * 2, true);
    bytes.setUint16(32, 2, true);
    bytes.setUint16(34, 16, true);
    text(36, 'data');
    bytes.setUint32(40, mono.length * 2, true);
    for (let i = 0; i < mono.length; i++) {
      const s = Math.max(-1, Math.min(1, mono[i]));
      bytes.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([bytes.buffer], { type: 'audio/wav' });
  } finally {
    void context.close();
  }
}
