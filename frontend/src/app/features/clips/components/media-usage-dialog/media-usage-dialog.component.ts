import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Clip, EditFormat } from '../../../../core/models/api.models';
import { StudioStateService } from '../../services/studio-state.service';

/**
 * One library file's details and every video of the project that uses it - the open cut
 * live, the others as last saved - with a way to jump to each.
 */
@Component({
  selector: 'app-media-usage-dialog',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './media-usage-dialog.component.html',
  styleUrls: ['./media-usage-dialog.component.css'],
})
export class MediaUsageDialogComponent implements OnInit {
  readonly state = inject(StudioStateService);

  readonly clip = input.required<Clip>();
  readonly closed = output<void>();

  readonly type = computed(() => this.state.getClipType(this.clip()));
  readonly places = computed(() => this.state.mediaUsagePlaces(this.clip()));
  readonly inCurrent = computed(() => this.places().some((p) => p.isCurrent));
  readonly placements = computed(() => this.places().reduce((sum, p) => sum + p.total, 0));
  readonly addedToday = computed(() => this.state.isClipAddedToday(this.clip()));

  ngOnInit(): void {
    // Picks up anything another tab saved since the list was read.
    this.state.refreshProjectEdits();
  }

  close(): void {
    this.closed.emit();
  }

  addToCut(): void {
    this.state.addClipToCutWithPrompt(this.clip().id);
    this.close();
  }

  fmtLabel(format: EditFormat | null): string {
    return format === 'Short' ? '9:16' : format === 'Square' ? '1:1' : '16:9';
  }

  fileSize(bytes: number): string {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }
}
