import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../../services/studio-state.service';
import { ScopeBarComponent } from './scope-bar.component';

@Component({
  selector: 'app-effects-inspector',
  standalone: true,
  imports: [FormsModule, ScopeBarComponent],
  templateUrl: './effects-inspector.component.html',
  styleUrls: ['./effects-inspector.component.css'],
})
export class EffectsInspectorComponent {
  readonly state = inject(StudioStateService);
}

