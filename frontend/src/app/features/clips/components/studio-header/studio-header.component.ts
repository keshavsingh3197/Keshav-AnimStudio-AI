import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudioStateService } from '../../services/studio-state.service';
import { EditFormat } from '../../../../core/models/api.models';

@Component({
  selector: 'app-studio-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './studio-header.component.html',
  styleUrls: ['./studio-header.component.css'],
})
export class StudioHeaderComponent {
  readonly state = inject(StudioStateService);

  /** The cut switcher in the breadcrumb. */
  readonly cutMenuOpen = signal(false);

  fmtLabel(format: EditFormat): string {
    return format === 'Short' ? '9:16' : format === 'Square' ? '1:1' : '16:9';
  }

  duration(seconds: number): string {
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }
}
