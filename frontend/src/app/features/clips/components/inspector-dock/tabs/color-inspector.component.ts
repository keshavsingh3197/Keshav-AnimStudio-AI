import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../../services/studio-state.service';

@Component({
  selector: 'app-color-inspector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './color-inspector.component.html',
})
export class ColorInspectorComponent {
  readonly state = inject(StudioStateService);
}

