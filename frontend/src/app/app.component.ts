import { Component } from '@angular/core';

import { StudioComponent } from './features/studio/studio.component';

@Component({
  selector: 'app-root',
  imports: [StudioComponent],
  template: `<app-studio />`,
})
export class AppComponent {}
