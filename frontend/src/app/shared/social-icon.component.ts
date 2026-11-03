import { Component, input } from '@angular/core';

import { SiteLink } from '../core/site-links';

/** The outline icon for a {@link SiteLink}, drawn in currentColor so it follows the theme. */
@Component({
  selector: 'app-social-icon',
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" stroke="currentColor" stroke-width="2" fill="none"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (id()) {
        @case ('youtube') {
          <rect x="2" y="4" width="20" height="16" rx="4"/><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none"/>
        }
        @case ('github') {
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        }
        @default {
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        }
      }
    </svg>
  `,
  styles: [`:host { display: inline-flex; flex-shrink: 0; }`],
})
export class SocialIconComponent {
  readonly id = input.required<SiteLink['id']>();
  readonly size = input(16);
}
