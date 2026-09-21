import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';

@Component({
  selector: 'app-transform-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './transform-inspector.component.html',
})
export class TransformInspectorComponent {
  readonly state = inject(StudioStateService);
}

