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
}

