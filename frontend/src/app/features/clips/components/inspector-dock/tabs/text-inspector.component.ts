import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';

@Component({
  selector: 'app-text-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './text-inspector.component.html',
})
export class TextInspectorComponent {
  readonly state = inject(StudioStateService);
  readonly Math = Math;
}

