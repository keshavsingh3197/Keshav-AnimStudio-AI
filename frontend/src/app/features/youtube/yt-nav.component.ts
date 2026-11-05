import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** The tab bar shared by the YouTube pages, so moving between them looks and works the same everywhere. */
@Component({
  selector: 'app-yt-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="ytn" aria-label="YouTube sections">
      @for (t of tabs; track t.path) {
        <a [routerLink]="t.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" [title]="t.hint">
          <span aria-hidden="true">{{ t.icon }}</span> {{ t.label }}
        </a>
      }
    </nav>
  `,
  styles: `
    :host { display: block; }
    .ytn { display: flex; gap: .25rem; padding: .25rem; overflow-x: auto; scrollbar-width: none;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--inner-highlight); }
    .ytn::-webkit-scrollbar { display: none; }
    .ytn a { display: inline-flex; align-items: center; gap: .4rem; flex: none; padding: .5rem .9rem; border-radius: var(--radius-sm);
      color: var(--muted); font-size: .88rem; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background .15s, color .15s; }
    .ytn a:hover { color: var(--text); background: var(--ov-2); }
    .ytn a.active { color: var(--text); background: var(--brand-subtle); box-shadow: inset 0 0 0 1px var(--brand-glow); }
    .ytn a:focus-visible { outline: 2px solid var(--brand); outline-offset: 1px; }
  `,
})
export class YtNavComponent {
  readonly tabs = [
    { path: '/youtube', icon: '📊', label: 'Overview', hint: 'Channels and published videos' },
    { path: '/youtube/queue', icon: '🗓️', label: 'Publishing board', hint: 'Videos queued for YouTube and when each goes out' },
    { path: '/youtube/analysis', icon: '📈', label: 'Analysis & plan', hint: 'What your numbers say, and what to make next' },
    { path: '/youtube/checkup', icon: '🩺', label: 'Checkup', hint: 'Audit and fix video details with AI' },
    { path: '/youtube/details', icon: '🔎', label: 'Details from IDs', hint: 'Captions, music, chapters and SEO from video IDs or links' },
  ];
}
