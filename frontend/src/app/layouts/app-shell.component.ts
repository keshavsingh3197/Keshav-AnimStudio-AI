import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminAccess } from '../core/models/api.models';
import { ActivityPanelComponent } from './activity-panel.component';
import { LoginModalComponent } from '../shared/login-modal.component';
import { ProjectHubModalComponent } from './project-hub-modal.component';
import { SessionTimeoutComponent } from '../shared/session-timeout.component';
import { ActivityService } from '../core/services/activity.service';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ShortsService } from '../core/services/shorts.service';
import { SessionTimeoutService } from '../core/services/session-timeout.service';
import { StatusService } from '../core/services/status.service';
import { UiNavigationService } from '../core/services/ui-navigation.service';

/** How often the Shorts badge is re-read; alerts change on the scale of renders and days, not seconds. */
const SHORTS_ATTENTION_MS = 5 * 60 * 1000;

/**
 * The frame every screen sits in: the brand bar, the one place errors and warnings are
 * shown, and the outlet. Keeping the banners here means no feature has to render them.
 *
 * The settings link appears only when this browser would actually be admitted. That is a
 * courtesy rather than a control - the server enforces the same rule on every admin
 * endpoint - and it comes from the server rather than being guessed here, so the link and
 * the refusal can never disagree.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ProjectHubModalComponent, ActivityPanelComponent, LoginModalComponent, SessionTimeoutComponent],
  template: `
    <app-session-timeout></app-session-timeout>

    <header class="topbar">
      <div class="wrap topbar-inner">
        <a routerLink="/projects" class="brand">AnimStudio<span>AI</span></a>

        <button
          type="button"
          class="mobile-nav-toggle"
          (click)="toggleMobileNav()"
          [attr.aria-expanded]="mobileNavOpen()"
          aria-controls="studio-navigation"
          [attr.aria-label]="mobileNavOpen() ? 'Close studio navigation' : 'Open studio navigation'">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true">
            @if (mobileNavOpen()) {
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            } @else {
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            }
          </svg>
          <span>{{ mobileNavOpen() ? 'Close' : 'Menu' }}</span>
        </button>

        <nav
          id="studio-navigation"
          class="topbar-nav"
          [class.mobile-open]="mobileNavOpen()"
          (click)="closeMobileNav()"
          aria-label="Main Studio Navigation">
          @for (tab of uiNav.visibleNavItems(); track tab.id) {
            @if (tab.id === 'clips') {
              <button type="button" (click)="openVideoModal()" class="topbar-navlink topbar-navbtn" [title]="tab.description || tab.label">
                <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                <span>{{ tab.label }}</span>
              </button>
            } @else if (tab.id !== 'admin') {
              <a [routerLink]="tab.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: tab.path === '/live' }" class="topbar-navlink" [title]="tab.description || tab.label">
                @switch (tab.id) {
                  @case ('projects') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  }
                  @case ('shorts') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  }
                  @case ('calendar') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  }
                  @case ('effects') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/><line x1="19" y1="17" x2="19" y2="22"/><line x1="16.5" y1="19.5" x2="21.5" y2="19.5"/></svg>
                  }
                  @case ('tools') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                  }
                  @case ('release') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  }
                  @case ('youtube') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="4"/><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none"/></svg>
                  }
                  @case ('details') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>
                  }
                  @case ('live') {
                    <span class="topbar-live-dot" aria-hidden="true"></span>
                  }
                  @case ('camera') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  }
                  @case ('motion-copy') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="5" r="2"/><path d="M12 7v6M5 10l7 1 7-1M9 22l3-9 3 9"/></svg>
                  }
                  @case ('collab') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  }
                  @case ('logs') {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                  }
                  @default {
                    <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/></svg>
                  }
                }
                <span>{{ tab.label }}</span>
                @if (tab.id === 'shorts' && shortsAttention() > 0) {
                  <span class="topbar-badge warn">{{ shortsAttention() }}</span>
                }
                @if (tab.id === 'logs' && status.logEntries().length > 0) {
                  <span class="topbar-badge">{{ status.logEntries().length }}</span>
                }
              </a>
            }
          }
        </nav>

        <div class="topbar-end">
          @if (activity.items().length > 0) {
            <button type="button" class="topbar-activity" (click)="activityPanel()?.toggle()"
                    [class.is-running]="activity.running().length > 0"
                    title="Uploads, exports and downloads">
              @if (activity.running().length > 0) {
                <span class="topbar-busy-dot"></span>
                <span>{{ activity.running().length }} active</span>
              } @else {
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Activity</span>
              }
            </button>
          }
          @if (status.busy()) {
            <span class="topbar-busy" role="status" aria-live="polite">
              <span class="topbar-busy-dot"></span>
              <span>Working&hellip;</span>
            </span>
          }
          @if (auth.isAuthenticated()) {
            <div class="user-pill">
              <span
                class="topbar-session-timer"
                [class.warning]="sessionTimeout.isWarning()"
                [class.urgent]="sessionTimeout.isUrgent()"
                [attr.aria-label]="'Automatic sign-out in ' + sessionTimeout.formattedRemaining() + ' due to inactivity'"
                [title]="'Automatic sign-out in ' + sessionTimeout.formattedRemaining() + ' due to inactivity'"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ sessionTimeout.formattedRemaining() }}
              </span>
              <span class="user-avatar" [title]="auth.user()?.email || 'User'">{{ (auth.user()?.displayName || auth.user()?.email || 'U')[0].toUpperCase() }}</span>
              <span class="user-name" [title]="auth.user()?.email || 'User'">{{ auth.user()?.displayName || auth.user()?.email }}</span>
              @if (auth.isAdmin()) {
                <span class="user-role-badge">Admin</span>
              }
              <button type="button" class="btn-logout" (click)="signOut()" [disabled]="signingOut()" title="Sign out">
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          } @else {
            <div class="guest-pill" title="You are browsing as Guest. Actions and renders are governed by the studio guest quota.">
              <span class="guest-dot"></span>
              <span class="guest-label">Guest</span>
              <button type="button" class="topbar-signin-btn" (click)="auth.openAuthModal()">
                Sign In
              </button>
            </div>
          }

          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" class="topbar-navlink topbar-settings" title="Server & Studio Settings">
              <svg class="topbar-svg" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings</span>
            </a>
          }
        </div>
      </div>
    </header>

    <main class="wrap">
      <app-login-modal></app-login-modal>
      <!--
        Both banners share one wrapper so there is a single thing to scroll to, and it
        exists only while there is something to say - which is what lets the effect below
        exists only while there is something to say — which is what lets the effect below
        notice it appearing.
      -->
      @if (status.error() !== null || status.latestNotice() !== null) {
        <div #banner class="topbar-banners">
          @if (status.error(); as message) {
            <div class="notice error">
              <div class="notice-body">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ message }}</span>
              </div>
              <button class="secondary small" type="button" (click)="status.clearError()">Dismiss</button>
            </div>
          }

          @if (status.latestNotice(); as notice) {
            <div class="notice notice-info">
              <div class="notice-body">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>{{ notice }}</span>
              </div>
              <button class="secondary small" type="button" (click)="status.dismissNotice()">Dismiss</button>
            </div>
          }
        </div>
      }

      <app-project-hub-modal [(isOpen)]="showVideoModal"></app-project-hub-modal>
      <router-outlet></router-outlet>
    </main>

    <app-activity-panel></app-activity-panel>

    <footer class="app-footer">
      <div class="wrap app-footer-inner">
        <div class="app-footer-brand">
          <a routerLink="/projects" class="brand">AnimStudio<span>AI</span></a>
          <span class="app-footer-tagline">Script to screen: scenes, clips, live broadcast, and renders in one studio.</span>
        </div>

        <nav class="app-footer-links" aria-label="Footer">
          @for (tab of uiNav.visibleNavItems(); track tab.id) {
            @if (tab.id !== 'clips') {
              <a [routerLink]="tab.path">{{ tab.label }}</a>
            }
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin">Settings</a>
          }
        </nav>

        <span class="app-footer-copy">&copy; {{ year }} AnimStudio AI</span>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    :host > main {
      flex: 1 0 auto;
      width: 100%;
    }

    .app-footer {
      border-top: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      backdrop-filter: blur(16px);
      color: var(--muted);
      font-size: .8rem;
    }

    .app-footer-inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: .85rem 1.5rem;
      padding-top: 1.1rem;
      padding-bottom: 1.1rem;
    }

    .app-footer-brand {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .75rem;
    }

    .app-footer-brand .brand {
      font-size: 0.98rem;
    }

    .app-footer-tagline {
      color: var(--muted);
      font-size: 0.8rem;
    }

    .app-footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.9rem;
    }

    .app-footer-links a {
      color: var(--muted);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s ease;
    }

    .app-footer-links a:hover {
      color: var(--text);
    }

    .topbar-nav {
      display: flex;
      align-items: center;
      gap: .22rem;
      flex: 1 1 auto;
      justify-content: center;
      overflow-x: auto;
      scrollbar-width: none;
      padding: 2px 4px;
    }

    .topbar-nav::-webkit-scrollbar {
      display: none;
    }

    .mobile-nav-toggle {
      display: none;
    }

    .topbar-divider {
      width: 1px;
      height: 1.15rem;
      background: var(--border-bright);
      margin: 0 0.25rem;
      flex-shrink: 0;
      opacity: 0.65;
    }

    .topbar-navlink {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .38rem .72rem;
      border-radius: 8px;
      border: 1px solid transparent;
      text-decoration: none;
      color: var(--muted);
      font-size: .83rem;
      font-weight: 600;
      white-space: nowrap;
      transition: color .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
      position: relative;
      flex-shrink: 0;
    }

    .topbar-navbtn {
      background: transparent;
      box-shadow: none;
      cursor: pointer;
    }

    .topbar-navbtn:hover:not(:disabled) {
      transform: none;
      box-shadow: none;
    }

    .topbar-navlink:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.06);
    }

    .topbar-navlink.active {
      color: #ffffff;
      background: linear-gradient(180deg, rgba(108, 140, 255, 0.18) 0%, rgba(108, 140, 255, 0.08) 100%);
      border-color: rgba(108, 140, 255, 0.35);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 10px rgba(61, 98, 230, 0.16);
    }

    .topbar-navlink.active .topbar-svg {
      color: var(--brand-bright);
    }

    .topbar-svg {
      flex-shrink: 0;
      opacity: 0.88;
      transition: color 0.15s ease, opacity 0.15s ease;
    }

    .topbar-navlink:hover .topbar-svg {
      opacity: 1;
    }

    .topbar-live-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #f44350;
      box-shadow: 0 0 8px rgba(244, 67, 80, 0.7);
      flex-shrink: 0;
    }

    .topbar-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.15rem;
      height: 1.15rem;
      padding: 0 .32rem;
      border-radius: 99px;
      background: var(--brand-dim);
      color: #fff;
      font-size: .65rem;
      font-weight: 800;
      line-height: 1;
    }

    .topbar-badge.warn {
      background: rgba(245, 158, 11, 0.22);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: var(--warn);
    }

    .topbar-end {
      display: flex;
      align-items: center;
      gap: .55rem;
      flex-shrink: 0;
    }

    .topbar-session-timer {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      color: #a7f3d0;
      font-size: .72rem;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      white-space: nowrap;
    }

    .topbar-session-timer.warning {
      color: #fbbf24;
    }

    .topbar-session-timer.urgent {
      color: #f87171;
    }

    .topbar-busy {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: 0.28rem 0.65rem;
      border-radius: 99px;
      background: rgba(108, 140, 255, 0.1);
      border: 1px solid rgba(108, 140, 255, 0.25);
      color: var(--brand-bright);
      font-size: .78rem;
      font-weight: 600;
    }

    .topbar-busy-dot {
      width: .5rem;
      height: .5rem;
      border-radius: 50%;
      background: var(--brand);
      box-shadow: 0 0 8px var(--brand);
      animation: busyPulse 1.2s ease-in-out infinite;
    }

    @keyframes busyPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .4; transform: scale(.75); }
    }

    .topbar-activity {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .34rem .72rem;
      border: 1px solid var(--border);
      border-radius: 99px;
      background: var(--surface-2);
      color: var(--text-dim);
      font: inherit;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: none;
    }

    .topbar-activity:hover:not(:disabled),
    .topbar-activity.is-running {
      color: var(--text);
      background: var(--surface-3);
      border-color: color-mix(in srgb, var(--brand) 55%, var(--border));
      box-shadow: 0 0 12px rgba(108, 140, 255, 0.16);
      transform: none;
    }

    .topbar-settings {
      border-radius: 8px;
      padding: .36rem .68rem;
      font-size: .82rem;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.025);
    }

    .topbar-banners {
      margin-bottom: 1.1rem;
    }

    .notice {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .notice-body {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .notice-info {
      border-left-color: var(--brand);
    }

    .guest-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.22rem 0.55rem;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.78rem;
    }

    .guest-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: #94a3b8;
    }

    .guest-label {
      color: #94a3b8;
      font-weight: 600;
    }

    .topbar-signin-btn {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%);
      border: 1px solid rgba(108, 140, 255, 0.4);
      color: #c7d2fe;
      border-radius: 99px;
      padding: 0.16rem 0.58rem;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: none;
      transition: all 0.15s ease;
    }

    .topbar-signin-btn:hover {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.65) 0%, rgba(59, 130, 246, 0.65) 100%);
      color: #fff;
      box-shadow: 0 0 10px rgba(108, 140, 255, 0.25);
    }

    .user-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.18rem 0.5rem 0.18rem 0.22rem;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(108, 140, 255, 0.25);
      font-size: 0.78rem;
    }

    .user-avatar {
      width: 1.45rem;
      height: 1.45rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.72rem;
    }

    .user-name {
      color: #e2e8f0;
      font-weight: 600;
      max-width: 130px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-role-badge {
      font-size: 0.62rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 0.1rem 0.35rem;
      background: rgba(108, 140, 255, 0.2);
      border: 1px solid rgba(108, 140, 255, 0.45);
      color: #8bb0ff;
      border-radius: 4px;
    }

    .btn-logout {
      background: none;
      border: none;
      color: var(--muted, #8a99ad);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.2rem;
      margin-left: 0.15rem;
      border-radius: 4px;
      transition: color 0.15s ease, background 0.15s ease;
      box-shadow: none;
    }

    .btn-logout:hover:not(:disabled) {
      color: #f87171;
      background: rgba(239, 68, 68, 0.12);
    }

    .btn-logout:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    @media (max-width: 900px) {
      .topbar-inner {
        flex-wrap: wrap;
        gap: .45rem .65rem;
      }

      .mobile-nav-toggle {
        display: inline-flex;
        align-items: center;
        gap: .4rem;
        order: 2;
        min-height: 42px;
        padding: .45rem .75rem;
        color: var(--text-dim);
        background: var(--surface-2);
        border: 1px solid var(--border);
        box-shadow: none;
      }

      .topbar-nav {
        display: none;
        order: 4;
        flex: 1 1 100%;
        width: 100%;
        min-width: 0;
        justify-content: stretch;
        padding: .5rem;
      }

      .topbar-nav.mobile-open {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-height: min(65svh, 520px);
        overflow-x: hidden;
        overflow-y: auto;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        box-shadow: var(--shadow-md);
      }

      .topbar-navlink {
        min-width: 0;
        min-height: 44px;
        padding: .55rem;
        white-space: normal;
        line-height: 1.25;
      }

      .topbar-navlink > span:not(.topbar-badge):not(.topbar-live-dot) {
        overflow-wrap: anywhere;
      }

      .topbar-end {
        order: 3;
        flex: 1 1 100%;
        margin-left: 0;
        max-width: 100%;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .topbar-end::-webkit-scrollbar {
        display: none;
      }

      .topbar-end > * {
        flex-shrink: 0;
      }

      .topbar-end .topbar-navlink {
        white-space: nowrap;
      }
    }
  `],
})

export class AppShellComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly sessionTimeout = inject(SessionTimeoutService);
  readonly uiNav = inject(UiNavigationService);

  readonly status = inject(StatusService);
  readonly activity = inject(ActivityService);
  readonly access = signal<AdminAccess | null>(null);
  readonly activityPanel = viewChild(ActivityPanelComponent);

  readonly showVideoModal = signal(false);
  readonly mobileNavOpen = signal(false);
  /** Warnings and errors on the Shorts page - failed renders or copies, used-up stock, a missed weekly goal. */
  readonly shortsAttention = signal(0);
  private readonly shorts = inject(ShortsService);
  readonly year = new Date().getFullYear();
  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  private refreshShortsAttention(): void {
    // A badge is a nicety: if the overview can't be read, there is simply no badge.
    this.shorts.overview().subscribe({
      next: (o) => this.shortsAttention.set(o.alerts.filter((a) => a.severity !== 'info').length),
      error: () => undefined,
    });
  }

  readonly signingOut = signal(false);

  signOut(): void {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.status.showNotice('Signing out...');
    this.access.set(null);

    this.auth.logout().subscribe({
      next: () => {
        this.signingOut.set(false);
        this.status.showNotice('Signed out successfully.');
        window.location.href = '/projects';
      },
      error: () => {
        this.signingOut.set(false);
        this.status.showNotice('Signed out.');
        window.location.href = '/projects';
      },
    });
  }

  openVideoModal() {
    this.showVideoModal.set(true);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  constructor() {
    this.refreshShortsAttention();
    setInterval(() => this.refreshShortsAttention(), SHORTS_ATTENTION_MS);

    /**
     * Brings a new banner into view.
     *
     * The banners sit at the top of the page, and the screens are long - the clip editor
     * is several screens tall - so a refused upload reported up here, while the user is
     * looking at the watermark settings, is a refusal nobody sees: the click appears to do
     * nothing at all. Scrolling is done here rather than by each feature because this is
     * the only place that knows a banner just appeared.
     *
     * Both the message and the count are read so a SECOND failure, arriving while a
     * banner is already showing, scrolls again instead of being silently appended.
     */
    effect(() => {
      const message = this.status.error();
      const notice = this.status.latestNotice();

      // The query resolves a render after the wrapper appears, so this effect runs again
      // with the element in hand - no manual "wait for the DOM" needed.
      const element = this.banner()?.nativeElement;

      if (element && (message !== null || notice !== null)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    // Asked once per visit. A failure here must not put a banner over the whole
    // application: not knowing whether to show a link is not an error worth reporting, so
    // this deliberately bypasses the shared error handling.
    this.api.adminAccess().subscribe({
      next: (access) => this.access.set(access),
      error: () => this.access.set(null),
    });
  }
}
