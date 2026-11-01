import { AfterViewInit, Component, Directive, ElementRef, computed, inject, input } from '@angular/core';

/** Small pieces shared by the Channels and YouTube publishing pages. */

const ICONS: Readonly<Record<string, readonly string[]>> = {
  search: ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0', 'M21 21l-4.3-4.3'],
  plus: ['M12 5v14M5 12h14'],
  refresh: ['M21 2v6h-6', 'M3 12a9 9 0 0 1 15-6.7L21 8', 'M3 22v-6h6', 'M21 12a9 9 0 0 1-15 6.7L3 16'],
  youtube: [
    'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z',
    'M9.75 15.02L15.5 12L9.75 8.98Z',
  ],
  link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  unlink: [
    'M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M5.17 11.75l-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71',
    'M8 2v3M2 8h3M16 19v3M19 16h3',
  ],
  copy: ['M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  star: ['M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z'],
  trash: ['M3 6h18', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6M14 11v6', 'M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  edit: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'],
  more: ['M12 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2z', 'M19 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2z', 'M5 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2z'],
  key: ['M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'],
  image: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M7 8.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0', 'M21 15l-5-5L5 21'],
  check: ['M20 6L9 17l-5-5'],
  alert: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  x: ['M18 6L6 18M6 6l12 12'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  chevronRight: ['M9 18l6-6-6-6'],
  external: ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  film: [
    'M4.18 2h15.64A2.18 2.18 0 0 1 22 4.18v15.64A2.18 2.18 0 0 1 19.82 22H4.18A2.18 2.18 0 0 1 2 19.82V4.18A2.18 2.18 0 0 1 4.18 2z',
    'M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5',
  ],
  folder: ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'],
  info: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 16v-4', 'M12 8h.01'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  tag: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
  sliders: ['M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'],
  arrowUp: ['M12 19V5', 'M5 12l7-7 7 7'],
  arrowDown: ['M12 5v14', 'M19 12l-7 7-7-7'],
  undo: ['M1 4v6h6', 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10'],
  layers: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  save: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
  clock: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 6v6l4 2'],
  message: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  send: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'],
  text: ['M3 6h18M3 10h18M3 14h18M3 18h12'],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'],
  moveTop: ['M17 11l-5-5-5 5', 'M12 6v12', 'M5 3h14'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
};

/** An inline SVG icon from the set above; it takes its colour from the surrounding text. */
@Component({
  selector: 'app-ico',
  host: { '[style.fontSize.px]': 'size()', 'aria-hidden': 'true' },
  styles: [':host { display: inline-flex; width: 1em; height: 1em; flex: none; } svg { width: 100%; height: 100%; display: block; }'],
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
      @for (d of paths(); track $index) { <path [attr.d]="d" /> }
    </svg>`,
})
export class AdminIconComponent {
  readonly name = input.required<keyof typeof ICONS | string>();
  readonly size = input(16);
  readonly paths = computed(() => ICONS[this.name()] ?? []);
}

/** Puts the caret in a field the moment it appears (a rename box, an add form). */
@Directive({ selector: '[adminAutofocus]' })
export class AdminAutofocusDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    node.focus({ preventScroll: false });
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) node.select();
  }
}
