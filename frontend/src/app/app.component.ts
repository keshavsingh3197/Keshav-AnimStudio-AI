import { Component } from '@angular/core';

import { AppShellComponent } from './layouts/app-shell.component';

@Component({
  selector: 'app-root',
  imports: [AppShellComponent],
  template: `<app-shell></app-shell>`,
})
export class AppComponent {}
