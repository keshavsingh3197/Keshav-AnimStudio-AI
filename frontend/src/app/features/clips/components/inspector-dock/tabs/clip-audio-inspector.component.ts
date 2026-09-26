import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';

@Component({
  selector: 'app-clip-audio-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './clip-audio-inspector.component.html',
})
export class ClipAudioInspectorComponent {
  readonly state = inject(StudioStateService);
  readonly Math = Math;

  isMusicActiveForClip(clipId: string): boolean {
    const sched = this.state.clipSchedule().find((s) => s.clip.id === clipId);
    if (!sched) return this.state.hasMusicOnTimeline();
    const hasTrack = this.state.musicTracks().some((t) => {
      const dur = this.state.musicTrackDurationSeconds(t);
      const tStart = t.startSeconds;
      const tEnd = tStart + dur;
      return tStart < sched.endSeconds && tEnd > sched.startSeconds;
    });
    return hasTrack || (this.state.musicAssetId() !== '' && this.state.musicVolume() > 0);
  }

  getMusicVolumeDisplay(override: number | null | undefined): string {
    if (override === null || override === undefined) {
      return 'Track Default';
    }
    if (override === 0) {
      return '0% (Muted)';
    }
    return `${Math.round(override * 100)}%`;
  }

  scopeBadgeLabel(): string {
    const scope = this.state.targetScope();
    if (scope === 'current') return '▶ Current Playing Clip';
    if (scope === 'selected') {
      const count = this.state.selectedClipsCount();
      return count > 1 ? `🎯 Selected (${count} clips)` : '🎯 Selected Clip';
    }
    if (scope === 'under_selected_music') return `🎵 Track Clips (${this.state.clipsUnderSelectedMusic().length})`;
    if (scope === 'under_music') return `🎶 All Music Clips (${this.state.clipsUnderMusic().length})`;
    if (scope === 'all') return `🌐 All Clips (${this.state.included().length})`;
    return '🎯 Selected Clip';
  }
}
