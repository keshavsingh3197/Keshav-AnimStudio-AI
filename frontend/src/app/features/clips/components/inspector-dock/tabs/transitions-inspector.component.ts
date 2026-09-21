import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';

@Component({
  selector: 'app-transitions-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './transitions-inspector.component.html',
})
export class TransitionsInspectorComponent {
  readonly state = inject(StudioStateService);
}

