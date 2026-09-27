import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ResolvedOverlap, StudioStateService } from '../../../services/studio-state.service';
import {
  AUDIO_OVERLAP_CHOICES,
  AudioOverlapRuleOrInherit,
} from '../../../models/clip-studio.models';

/**
 * The Selection view: one card describing whatever is selected on the timeline - a music
 * track, one clip, or several. The same four controls in the same order every time
 * (level, overlap rule, fades, trim), so nothing has to be hunted for.
 */
@Component({
  selector: 'app-clip-audio-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './clip-audio-inspector.component.html',
})
export class ClipAudioInspectorComponent {
  readonly state = inject(StudioStateService);
  readonly Math = Math;

  readonly overlapChoices = AUDIO_OVERLAP_CHOICES;
  readonly duckPresets = [0.1, 0.25, 0.5];

  /** What the precedence chain decided for the clip on screen, if a clip is on screen. */
  readonly resolved = computed<ResolvedOverlap | null>(() => {
    const target = this.state.activeTargetAudioItem();
    return target ? this.state.resolveOverlap(target.clipId) : null;
  });

  /** Plain sentence naming the rule in force and the level that set it. */
  resolvedLine(): string {
    const r = this.resolved();
    if (!r) return '';
    if (!r.hasMusicUnder) return 'No music under this clip — the rule has nothing to do here.';

    const rule = this.state.overlapRuleLabel(r.rule);
    if (r.source === 'clip') return `${rule} — set on this clip.`;
    if (r.source === 'track') {
      return `${rule} — inherited from music track "${r.sourceLabel}".`;
    }
    return `${rule} — inherited from the project default.`;
  }

  /** True while the resolved rule actually attenuates something, so depth is worth showing. */
  showsDuckDepth(): boolean {
    const r = this.resolved();
    return Boolean(r && r.hasMusicUnder && (r.rule === 'DuckMusic' || r.rule === 'DuckVideo'));
  }

  /** Which side the duck depth applies to, named so the number is not ambiguous. */
  duckDepthTarget(): string {
    return this.resolved()?.rule === 'DuckVideo' ? 'video sound' : 'music';
  }

  effectiveDuckLevel(clipId: string): number {
    return this.state.clipDuckLevelOverride(clipId) ?? this.state.duckLevel();
  }

  /** Every rule the batch shares, or null when the selected clips disagree. */
  batchRule(): AudioOverlapRuleOrInherit | null {
    const ids = Array.from(this.state.batchTargetIds());
    if (ids.length === 0) return null;
    const first = this.state.clipOverlapRule(ids[0]);
    return ids.every((id) => this.state.clipOverlapRule(id) === first) ? first : null;
  }

  scopeLabel(): string {
    const scope = this.state.targetScope();
    if (scope === 'current') return 'the clip under the playhead';
    if (scope === 'under_selected_music') return `clips under this music track (${this.state.clipsUnderSelectedMusic().length})`;
    if (scope === 'under_music') return `clips under any music (${this.state.clipsUnderMusic().length})`;
    if (scope === 'all') return `every clip (${this.state.included().length})`;
    const n = this.state.selectedClipsCount();
    return n > 1 ? `the ${n} selected clips` : 'the selected clip';
  }
}
