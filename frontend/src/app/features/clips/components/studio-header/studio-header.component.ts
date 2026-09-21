import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudioStateService } from '../../services/studio-state.service';

@Component({
  selector: 'app-studio-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './studio-header.component.html',
  styleUrls: ['./studio-header.component.css'],
})
export class StudioHeaderComponent {
  readonly state = inject(StudioStateService);
}

