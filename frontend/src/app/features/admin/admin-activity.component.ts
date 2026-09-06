import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { AdminAuditEntry } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/**
 * Every administrative change, in the order it happened.
 *
 * Append-only: there is no edit and no delete, here or in the API, because a record its own
 * subject can tidy away answers no question worth asking. Nothing in it is a secret - a key
 * change records the fingerprint that identifies which key was installed, and never any part
 * of the key itself.
 */
@Component({
  selector: 'app-admin-activity',
  imports: [DatePipe],
  templateUrl: './admin-activity.component.html',
})
export class AdminActivityComponent {
  private readonly api = inject(ApiService);

  readonly status = inject(StatusService);
  readonly entries = signal<AdminAuditEntry[]>([]);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.status.run(this.api.adminAudit(), (entries) => this.entries.set(entries));
  }

  /** The stable action code as a sentence. The codes are the API; these words are not. */
  describe(entry: AdminAuditEntry): string {
    switch (entry.action) {
      case 'ai.provider.update': return 'Changed provider settings';
      case 'ai.provider.reset': return 'Reset a provider to the configuration file';
      case 'ai.key.install': return 'Installed or rotated an API key';
      case 'ai.key.remove': return 'Removed an API key';
      case 'ai.chain.save': return 'Changed a fallback order';
      case 'ai.provider.test': return 'Tested a connection';
      case 'render.job.cancel': return 'Cancelled a render';
      case 'render.job.requeue': return 'Queued a render again';
      default: return entry.action;
    }
  }
}
