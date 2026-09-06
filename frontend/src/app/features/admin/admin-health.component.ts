import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { AdminHealth, AdminHealthProbe } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/**
 * What is actually installed on the machine the server runs on.
 *
 * This is the screen that turns "the render failed" into "ffmpeg is not on this process's
 * PATH" without anyone reading a log. Most of the list is optional, and saying so is the
 * point: only the renderer, the media inspector, the database and file storage have to be
 * there for a bundle to become a video.
 */
@Component({
  selector: 'app-admin-health',
  imports: [DatePipe],
  templateUrl: './admin-health.component.html',
})
export class AdminHealthComponent {
  private readonly api = inject(ApiService);

  readonly status = inject(StatusService);
  readonly health = signal<AdminHealth | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.status.run(this.api.adminHealth(), (health) => this.health.set(health));
  }

  tone(probe: AdminHealthProbe): 'ok' | 'warn' | 'err' | '' {
    switch (probe.state) {
      case 'Ok': return 'ok';
      case 'Degraded': return 'warn';
      case 'Failed': return 'err';
      default: return probe.required ? 'err' : '';
    }
  }

  word(probe: AdminHealthProbe): string {
    switch (probe.state) {
      case 'Ok': return 'working';
      case 'Degraded': return 'partly';
      case 'Failed': return 'broken';
      default: return probe.required ? 'missing' : 'not installed';
    }
  }
}
