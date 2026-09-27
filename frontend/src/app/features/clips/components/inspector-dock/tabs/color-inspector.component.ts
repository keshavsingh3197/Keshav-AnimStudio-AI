import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../../services/studio-state.service';
import { ScopeBarComponent } from './scope-bar.component';

@Component({
  selector: 'app-color-inspector',
  standalone: true,
  imports: [FormsModule, ScopeBarComponent],
  templateUrl: './color-inspector.component.html',
})
export class ColorInspectorComponent {
  readonly state = inject(StudioStateService);
}

