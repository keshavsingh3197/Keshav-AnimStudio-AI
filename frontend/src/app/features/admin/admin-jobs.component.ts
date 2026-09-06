import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminJob } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/**
 * Every render on this server, across every project.
 *
 * The render screen inside a project only ever shows that project's jobs, which is right
 * for the person making a video and useless for the person asking why the queue is stuck.
 * This is the other view: what is running, what failed, and a way to put a failed one back
 * in the queue without finding its project first.
 */
@Component({
  selector: 'app-admin-jobs',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-jobs.component.html',
})
export class AdminJobsComponent {
  private readonly api = inject(ApiService);

  readonly status = inject(StatusService);
  readonly jobs = signal<AdminJob[]>([]);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.status.run(this.api.adminJobs(), (jobs) => this.jobs.set(jobs));
  }

  cancel(job: AdminJob): void {
    this.status.run(this.api.cancelAdminJob(job.id), () => this.reload());
  }

  retry(job: AdminJob): void {
    this.status.run(this.api.retryAdminJob(job.id), () => this.reload());
  }

  /** Only a render that ended badly is worth queueing again. */
  canRetry(job: AdminJob): boolean {
    return job.status === 'Failed' || job.status === 'Cancelled';
  }

  tone(job: AdminJob): 'ok' | 'warn' | 'err' | '' {
    switch (job.status) {
      case 'Completed': return 'ok';
      case 'CompletedWithWarnings': return 'warn';
      case 'Failed': return 'err';
      case 'Cancelled': return '';
      default: return 'warn';
    }
  }
}
