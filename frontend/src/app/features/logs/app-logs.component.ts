import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { StatusService } from '../../core/services/status.service';

@Component({
  selector: 'app-logs',
  imports: [DatePipe],
  templateUrl: './app-logs.component.html'
})
export class AppLogsComponent {
  readonly status = inject(StatusService);
}

