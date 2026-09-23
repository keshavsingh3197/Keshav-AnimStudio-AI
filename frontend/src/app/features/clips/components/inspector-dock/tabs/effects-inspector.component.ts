import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../../services/studio-state.service';

@Component({
  selector: 'app-effects-inspector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './effects-inspector.component.html',
  styleUrls: ['./effects-inspector.component.css'],
})
export class EffectsInspectorComponent {
  readonly state = inject(StudioStateService);
}

