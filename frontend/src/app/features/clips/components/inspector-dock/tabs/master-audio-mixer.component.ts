import { Component, inject } from '@angular/core';
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

  setDuckLevel(level: number): void {
    this.state.duckLevel.set(Math.max(0, Math.min(1, level)));
    this.state.markDirty();
  }

  projectRuleHint(): string {
    const rule = this.state.projectOverlapRule();
    return AUDIO_OVERLAP_CHOICES.find((c) => c.id === rule)?.hint ?? '';
  }
}
