import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** The tab bar shared by the YouTube pages, so moving between them looks and works the same everywhere. */
@Component({
  selector: 'app-yt-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="ytn" aria-label="YouTube sections">
      <a routerLink="/youtube" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" title="Channels and published videos">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
        </svg>
        <span>Overview</span>
      </a>
      <a routerLink="/youtube/queue" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" title="Videos queued for YouTube and when each goes out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
        </svg>
        <span>Publishing board</span>
      </a>
      <a routerLink="/youtube/analysis" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" title="What your numbers say, and what to make next">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
        </svg>
        <span>Analysis &amp; plan</span>
      </a>
      <a routerLink="/youtube/checkup" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" title="Audit and fix video details with AI">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
        </svg>
        <span>Checkup</span>
      </a>
      <a routerLink="/youtube/details" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" title="Captions, music, chapters and SEO from video IDs or links">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/>
        </svg>
        <span>Details from IDs</span>
      </a>
    </nav>
  `,
  styles: `
    :host { display: block; margin-bottom: 1.15rem; }
    .ytn {
      display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem; overflow-x: auto; scrollbar-width: none;
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--inner-highlight);
    }
    .ytn::-webkit-scrollbar { display: none; }
    .ytn a {
      display: inline-flex; align-items: center; gap: 0.5rem; flex: none; padding: 0.5rem 0.95rem;
      border-radius: var(--radius-sm); border: 1px solid transparent;
      color: var(--muted); font-size: 0.86rem; font-weight: 600; text-decoration: none; white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .ytn a svg { flex-shrink: 0; opacity: 0.82; transition: opacity 0.15s ease, color 0.15s ease; }
    .ytn a:hover { color: var(--text); background: var(--ov-2); }
    .ytn a:hover svg { opacity: 1; }
    .ytn a.active {
      color: var(--text);
      background: linear-gradient(135deg, rgba(108, 140, 255, 0.22), rgba(80, 110, 240, 0.12));
      border-color: rgba(108, 140, 255, 0.42);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    .ytn a.active svg { opacity: 1; color: var(--brand-bright); }
    .ytn a:focus-visible { outline: 2px solid var(--brand); outline-offset: 1px; }
    @media (max-width: 640px) {
      .ytn a { padding: 0.45rem 0.75rem; font-size: 0.8rem; }
    }
  `,
})
export class YtNavComponent {}
