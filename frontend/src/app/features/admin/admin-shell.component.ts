import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminAccess } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/**
 * The frame around the console: what may be administered, and a plain statement of who is
 * allowed to.
 *
 * The access check is made here rather than in each screen so the answer is asked for once
 * and the reason is said once. It is not a security boundary - every endpoint underneath
 * enforces the same rule server-side - it is there so the screens are not a row of
 * refusals.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
})
export class AdminShellComponent {
  private readonly api = inject(ApiService);

  readonly status = inject(StatusService);
  readonly access = signal<AdminAccess | null>(null);

  constructor() {
    this.status.run(this.api.adminAccess(), (access) => this.access.set(access));
  }
}
