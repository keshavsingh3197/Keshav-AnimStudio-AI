import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Asset, VoiceoverVoice } from '../../../../../core/models/api.models';
import { ApiService } from '../../../../../core/services/api.service';
import { ProjectStore } from '../../../../../core/services/project-store';
import { StudioStateService } from '../../../services/studio-state.service';

/** Must match VoiceoverController.MaxTextChars. */
const MAX_LINE_CHARS = 2000;
const SCRIPT_KEY_PREFIX = 'animstudio_vo_script_';
const VOICE_KEY = 'animstudio_vo_voice';
const RATE_KEY = 'animstudio_vo_rate';

/** Kokoro voice ids start with a language letter and a gender letter: "hf_alpha", "am_michael". */
const KOKORO_LANGUAGES: Record<string, string> = {
  a: 'English (US)', b: 'English (UK)', h: 'Hindi', e: 'Spanish', f: 'French',
  i: 'Italian', j: 'Japanese', p: 'Portuguese', z: 'Chinese',
};

/** The voices that sound most natural in each language, tried in order. */
const PREFERRED_VOICES = {
  hindi: ['hm_omega', 'hf_alpha', 'hm_psi', 'hf_beta'],
  other: ['af_heart', 'am_michael', 'bm_george', 'af_bella'],
};

type Placement = 'clips' | 'playhead';

interface ScriptLine {
  index: number;
  text: string;
  tooLong: boolean;
}

interface LineResult {
  index: number;
  text: string;
  asset?: Asset;
  error?: string;
  startSeconds?: number;
  /** Seconds the line runs past the end of the clip it was placed on. */
  overrunSeconds?: number;
}

interface VoiceGroup {
  label: string;
  voices: { id: string; label: string }[];
}

/**
 * Voiceover from a script: each line is spoken by the server's speech engine, saved to the
 * library, and laid on A1 - lined up with the clips (line 1 on clip 1, ...) or back to back
 * from the playhead. Everything placed by one run is a single Undo step.
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

  readonly loadingVoices = signal(true);
  readonly available = signal(false);
  readonly unavailableReason = signal('');
  readonly voices = signal<VoiceoverVoice[]>([]);

  readonly script = signal('');
  readonly voiceId = signal('');
  readonly rate = signal(0.95);
  readonly placement = signal<Placement>('clips');
  /** Breath after a cut before the line starts, and between back-to-back lines. */
  readonly leadInSeconds = signal(0.3);
  readonly gapSeconds = signal(0.4);

  readonly generating = signal(false);
  readonly doneCount = signal(0);
  readonly results = signal<LineResult[]>([]);
  readonly error = signal('');
  private cancelRequested = false;
  private preview: HTMLAudioElement | null = null;
  readonly previewingId = signal<string | null>(null);

  readonly lines = computed<ScriptLine[]>(() =>
    this.script()
      .split(/\r?\n/)
      // A leading "1." / "1)" / "[3]" numbers the line for the writer, not the listener.
      .map((raw) => raw.replace(/^\s*(\[\d+\]|\d+[.)])\s*/, '').trim())
      .filter((text) => text.length > 0)
      .map((text, index) => ({ index, text, tooLong: text.length > MAX_LINE_CHARS })));

  readonly clipCount = computed(() => this.state.clipSchedule().length);
  readonly hasTooLong = computed(() => this.lines().some((l) => l.tooLong));
  readonly isHindi = computed(() => /[ऀ-ॿ]/.test(this.script()));

  readonly voiceGroups = computed<VoiceGroup[]>(() => {
    const groups = new Map<string, VoiceGroup>();
    for (const v of this.voices()) {
      const { language, label } = this.describeVoice(v);
      if (!groups.has(language)) groups.set(language, { label: language, voices: [] });
      groups.get(language)!.voices.push({ id: v.id, label });
    }
    return [...groups.values()];
  });

  readonly placedCount = computed(() => this.results().filter((r) => r.asset).length);
  readonly overruns = computed(() => this.results().filter((r) => (r.overrunSeconds ?? 0) > 0.05));

  ngOnInit(): void {
    this.script.set(this.readStorage(this.scriptKey()) ?? '');
    const savedRate = Number(this.readStorage(RATE_KEY));
    if (savedRate >= 0.5 && savedRate <= 2) this.rate.set(savedRate);

    this.api.voiceoverVoices().subscribe({
      next: (res) => {
        this.loadingVoices.set(false);
        this.available.set(res.available);
        this.unavailableReason.set(res.reason);
        this.voices.set(res.voices ?? []);
        this.voiceId.set(this.pickDefaultVoice(this.readStorage(VOICE_KEY)));
      },
      error: (err: unknown) => {
        this.loadingVoices.set(false);
        this.available.set(false);
        this.unavailableReason.set(err instanceof Error ? err.message : 'Could not reach the server.');
      },
    });
  }

  ngOnDestroy(): void {
    this.cancelRequested = true;
    this.stopPreview();
  }

  onScriptChange(value: string): void {
    this.script.set(value);
    this.writeStorage(this.scriptKey(), value);
    // A Hindi script with an English voice picked by default reads it out letter by letter.
    if (this.isHindi() && !this.voiceId().startsWith('h')) {
      const hindi = this.pickFrom(PREFERRED_VOICES.hindi);
      if (hindi) this.voiceId.set(hindi);
    }
  }

  onVoiceChange(id: string): void {
    this.voiceId.set(id);
    this.writeStorage(VOICE_KEY, id);
  }

  onRateChange(rate: number): void {
    this.rate.set(rate);
    this.writeStorage(RATE_KEY, String(rate));
  }

  async generate(): Promise<void> {
    const projectId = this.store.projectId();
    const lines = this.lines();
    if (!projectId || lines.length === 0 || !this.voiceId() || this.hasTooLong() || this.generating()) return;

    this.generating.set(true);
    this.cancelRequested = false;
    this.doneCount.set(0);
    this.error.set('');
    this.results.set([]);

    const results: LineResult[] = [];
    for (const line of lines) {
      if (this.cancelRequested) break;
      try {
        const asset = await firstValueFrom(this.api.generateVoiceover(projectId, {
          text: line.text,
          voiceId: this.voiceId(),
          rate: this.rate(),
        }));
        results.push({ index: line.index, text: line.text, asset });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not speak this line.';
        results.push({ index: line.index, text: line.text, error: message });
        // The engine is off or down: every other line would fail the same way.
        if (/unavailable|reach the api/i.test(message) || (err as { status?: number })?.status === 503) {
          this.error.set(message);
          break;
        }
      }
      this.doneCount.set(results.length);
      this.results.set([...results]);
    }

    // A project switch mid-run must not drop this project's lines onto another timeline.
    if (this.store.projectId() === projectId) {
      this.place(results);
    }
    this.results.set(results);
    this.generating.set(false);
  }

  cancel(): void {
    this.cancelRequested = true;
  }

  togglePreview(asset: Asset): void {
    if (this.previewingId() === asset.id) {
      this.stopPreview();
      return;
    }
    this.stopPreview();
    this.preview = new Audio(this.api.assetUrl(asset.id));
    this.preview.onended = () => this.previewingId.set(null);
    this.previewingId.set(asset.id);
    this.preview.play().catch(() => this.previewingId.set(null));
  }

  seekTo(result: LineResult): void {
    if (result.startSeconds !== undefined) this.state.seekTo(result.startSeconds);
  }

  voiceHint(): string {
    if (this.unavailableReason() === 'Disabled' || this.unavailableReason() === 'NotConfigured') {
      return 'No speech engine is turned on.';
    }
    if (this.unavailableReason() === 'CircuitOpen') {
      return 'The speech engine stopped answering. Check that it is running, then reopen this panel.';
    }
    return this.unavailableReason();
  }

  /** Lays the generated lines on A1 and records where each one landed. */
  private place(results: LineResult[]): void {
    const schedule = this.state.clipSchedule();
    const placements: { asset: Asset; startSeconds: number }[] = [];
    let cursor = this.placement() === 'playhead' ? this.state.currentTime() : 0;
    let previousEnd = -Infinity;

    results.forEach((result, i) => {
      if (!result.asset) return;
      const duration = result.asset.durationSeconds ?? this.estimateSeconds(result.text);
      let start: number;
      let clipEnd: number | null = null;

      if (this.placement() === 'clips' && schedule[result.index]) {
        const clip = schedule[result.index];
        start = Math.max(clip.startSeconds + this.leadInSeconds(), previousEnd + this.gapSeconds());
        clipEnd = clip.endSeconds;
      } else {
        start = i === 0 && this.placement() === 'playhead' ? cursor : Math.max(cursor, previousEnd + this.gapSeconds());
      }

      result.startSeconds = start;
      result.overrunSeconds = clipEnd !== null ? Math.max(0, start + duration - clipEnd) : undefined;
      previousEnd = start + duration;
      cursor = previousEnd;
      placements.push({ asset: result.asset, startSeconds: start });
    });

    this.state.addVoiceoverTracks(placements);
  }

  /** About 2.6 words a second - only used when the server could not probe the file. */
  private estimateSeconds(text: string): number {
    return Math.max(1, text.split(/\s+/).length / 2.6);
  }

  private describeVoice(v: VoiceoverVoice): { language: string; label: string } {
    const match = /^([a-z])([fm])_(.+)$/.exec(v.id);
    if (match && KOKORO_LANGUAGES[match[1]]) {
      const name = match[3].charAt(0).toUpperCase() + match[3].slice(1);
      return { language: KOKORO_LANGUAGES[match[1]], label: `${name} (${match[2] === 'f' ? 'female' : 'male'})` };
    }
    const gender = v.gender ? ` (${v.gender.toLowerCase()})` : '';
    return { language: v.languageCode || 'Voices', label: `${v.name || v.id}${gender}` };
  }

  private pickDefaultVoice(saved: string | null): string {
    if (saved && this.voices().some((v) => v.id === saved)) return saved;
    const preferred = this.pickFrom(this.isHindi() ? PREFERRED_VOICES.hindi : PREFERRED_VOICES.other);
    return preferred ?? this.voices()[0]?.id ?? '';
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
    this.previewingId.set(null);
  }

  private scriptKey(): string {
    return `${SCRIPT_KEY_PREFIX}${this.store.projectId() ?? 'none'}`;
  }

  // The script draft and voice choice are per-viewer conveniences: storage may be blocked.
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
