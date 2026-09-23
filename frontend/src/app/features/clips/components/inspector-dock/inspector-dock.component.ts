import { Component, inject } from '@angular/core';
import { StudioStateService } from '../../services/studio-state.service';
import { TransformInspectorComponent } from './tabs/transform-inspector.component';
import { ClipAudioInspectorComponent } from './tabs/clip-audio-inspector.component';
import { MasterAudioMixerComponent } from './tabs/master-audio-mixer.component';
import { ColorInspectorComponent } from './tabs/color-inspector.component';
import { EffectsInspectorComponent } from './tabs/effects-inspector.component';
import { TransitionsInspectorComponent } from './tabs/transitions-inspector.component';
import { TextInspectorComponent } from './tabs/text-inspector.component';

@Component({
  selector: 'app-inspector-dock',
  standalone: true,
  imports: [
    TransformInspectorComponent,
    ClipAudioInspectorComponent,
    MasterAudioMixerComponent,
    ColorInspectorComponent,
    EffectsInspectorComponent,
    TransitionsInspectorComponent,
    TextInspectorComponent,
  ],
  templateUrl: './inspector-dock.component.html',
  styleUrls: ['./inspector-dock.component.css'],
})
export class InspectorDockComponent {
  readonly state = inject(StudioStateService);
}

