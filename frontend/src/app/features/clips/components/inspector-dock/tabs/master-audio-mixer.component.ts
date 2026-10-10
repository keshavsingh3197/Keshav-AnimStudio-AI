import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { AUDIO_OVERLAP_CHOICES } from '../../../models/clip-studio.models';

/**
 * The Mix view: project-wide levels, the project default overlap rule, and the duck depth
 * every Duck rule shares. Anything that belongs to one clip or one music track lives in the
 * Selection view instead, so no control appears twice.
 */
@Component({
  selector: 'app-master-audio-mixer',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './master-audio-mixer.component.html',
})
export class MasterAudioMixerComponent {
  readonly state = inject(StudioStateService);
  readonly Math = Math;

  readonly overlapChoices = AUDIO_OVERLAP_CHOICES;
  readonly duckPresets = [0.1, 0.2, 0.25, 0.35, 0.5];
  readonly audioBuses = [
    { id: 'A1', name: 'Voice', color: '#8b5cf6' },
    { id: 'A2', name: 'Music', color: '#a855f7' },
  ] as const;

  // --- Auto-enhance: music bed, a sound on every cut, music under the voice, YouTube loudness

  /** Library audio that isn't a voiceover line, longest first: songs before short effects. */
  readonly soundFiles = computed(() =>
    (this.state.studio()?.musicCandidates ?? [])
      .filter((a) => !a.name.startsWith('VO - ') && (a.durationSeconds ?? 0) > 0)
      .sort((a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0)));
  /** Short files make good cut effects; shortest first. */
  readonly effectFiles = computed(() =>
    [...this.soundFiles()].filter((a) => (a.durationSeconds ?? 0) <= 6)
      .sort((a, b) => (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0)));

  readonly bedAssetId = signal('');
  readonly bedVolume = signal(0.25);
  readonly cutAssetId = signal('');
  readonly cutVolume = signal(0.6);
  readonly enhanceNote = signal('');

  layBed(): void {
    const id = this.bedAssetId() || this.soundFiles()[0]?.id;
    if (!id) return;
    const pieces = this.state.layMusicBed(id, this.bedVolume());
    this.enhanceNote.set(pieces > 0
      ? `Music laid under the whole video${pieces > 1 ? ` (repeated ${pieces}×)` : ''} on A2. Ctrl+Z takes it back.`
      : 'Add clips first: the music is laid under the whole video.');
  }

  addCutSounds(): void {
    const id = this.cutAssetId() || this.effectFiles()[0]?.id;
    if (!id) return;
    const placed = this.state.addCutEffects(id, this.cutVolume());
    this.enhanceNote.set(placed > 0
      ? `Placed on ${placed} cut${placed === 1 ? '' : 's'}, just before each one. Ctrl+Z takes them back.`
      : 'There are no cuts yet: add a second clip.');
  }

  setVoiceDuck(on: boolean): void {
    this.state.duckMusicUnderVoice.set(on);
    this.state.markDirty();
  }

  setVoiceDuckLevel(level: number): void {
    this.state.voiceDuckLevel.set(Math.max(0, Math.min(1, level)));
    this.state.markDirty();
  }

  setLoudness(on: boolean): void {
    this.state.exportYouTubeLoudness.set(on);
    this.state.markDirty();
  }

  busVolume(lane: 'A1' | 'A2'): number {
    return lane === 'A1' ? this.state.trackA1Volume() : this.state.trackA2Volume();
  }

  setDuckLevel(level: number): void {
    this.state.duckLevel.set(Math.max(0, Math.min(1, level)));
    this.state.markDirty();
  }

  projectRuleHint(): string {
    const rule = this.state.projectOverlapRule();
    return AUDIO_OVERLAP_CHOICES.find((c) => c.id === rule)?.hint ?? '';
  }
}
