import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusService } from '../../core/services/status.service';
import { SessionTimeoutService } from '../../core/services/session-timeout.service';
import { UiNavigationService, DEFAULT_UI_NAVIGATION_TABS } from '../../core/services/ui-navigation.service';
import {
  AdminAccessControl,
  AdminYouTubeChannelItem,
  AnonymousAccessPolicy,
  UiNavigationItemConfig,
  UiNavigationSettings,
  UserScopeItem,
  UserScopesOverview,
} from '../../core/models/auth.models';

type AdminViewTab = 'matrix' | 'policy' | 'scopes' | 'identity';

@Component({
  selector: 'app-admin-access-control',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section class="access-control-page">
      <header class="page-head" style="margin-top: 0">
        <div style="display: flex; align-items: flex-start; gap: 0.85rem">
          <div class="studio-icon-badge" style="width: 2.6rem; height: 2.6rem; margin-top: 2px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div class="row" style="gap: 0.5rem; margin-bottom: 0.15rem">
              <h2 style="margin: 0">Access Control & UI Navigation</h2>
              <span class="pill brand">{{ accessInfo()?.mode || 'RBAC' }}</span>
              <span class="pill success">Multi-Tenant Scoped</span>
            </div>
            <p class="muted">
              Configure tab and page visibility, enforce anonymous visitor restrictions, manage isolated user scopes, and supervise connected cloud integrations.
            </p>
          </div>
        </div>
      </header>

      <!-- Sub-navigation Tabs -->
      <nav class="sub-nav-tabs" aria-label="Access Control Sections">
        <button
          type="button"
          class="sub-tab-btn"
          [class.active]="activeTab() === 'matrix'"
          (click)="setTab('matrix')"
        >
          <span class="tab-icon">🎛️</span>
          <span>UI Tab Visibility Matrix</span>
        </button>
        <button
          type="button"
          class="sub-tab-btn"
          [class.active]="activeTab() === 'policy'"
          (click)="setTab('policy')"
        >
          <span class="tab-icon">🛡️</span>
          <span>Guest Quotas & Policies</span>
        </button>
        <button
          type="button"
          class="sub-tab-btn"
          [class.active]="activeTab() === 'scopes'"
          (click)="setTab('scopes')"
        >
          <span class="tab-icon">👥</span>
          <span>User & Session Scopes</span>
          @if (userScopes()?.guestSessions; as gs) {
            <span class="tab-badge">{{ gs }}</span>
          }
        </button>
        <button
          type="button"
          class="sub-tab-btn"
          [class.active]="activeTab() === 'identity'"
          (click)="setTab('identity')"
        >
          <span class="tab-icon">▶️</span>
          <span>YouTube Channels & IdP</span>
        </button>
      </nav>

      @if (loading()) {
        <div class="card muted" style="display: flex; align-items: center; gap: 0.65rem">
          <span class="spinner"></span> Loading access control and UI configurations&hellip;
        </div>
      } @else {

        <!-- ================================================================= -->
        <!-- TAB 1: UI TAB & PAGE VISIBILITY MATRIX                            -->
        <!-- ================================================================= -->
        @if (activeTab() === 'matrix') {
          <div class="card">
            <div class="card-head">
              <div>
                <h3>UI Tab & Navigation Visibility Control</h3>
                <p class="muted">
                  Control which navigation tabs and pages appear in the top bar for Anonymous Guests vs Authenticated Members.
                  Sensitive features (YouTube, Google Drive, Music Master Release) are protected from unauthenticated access.
                </p>
              </div>
              <div class="head-actions">
                <button
                  type="button"
                  class="btn-outline btn-sm"
                  (click)="applyPreset('strict')"
                  title="Hide all sensitive cloud publishing from guests"
                >
                  🔒 Strict Privacy
                </button>
                <button
                  type="button"
                  class="btn-outline btn-sm"
                  (click)="applyPreset('defaults')"
                  title="Restore default visibility settings"
                >
                  ↺ Reset Defaults
                </button>
                <button
                  type="button"
                  class="btn-primary-glow"
                  (click)="saveUiNavigation()"
                  [disabled]="saving()"
                >
                  @if (saving()) {
                    <span class="spinner"></span> Saving...
                  } @else {
                    Save Navigation
                  }
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="channel-table matrix-table">
                <thead>
                  <tr>
                    <th>Feature Tab / Page</th>
                    <th>Route Path</th>
                    <th>Sensitivity</th>
                    <th style="text-align: center">Visible to Guests</th>
                    <th style="text-align: center">Visible to Members</th>
                    <th style="text-align: center">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tab of navTabs; track tab.id) {
                    <tr [class.is-sensitive]="tab.isSensitive">
                      <td>
                        <div class="tab-row-cell">
                          <span class="tab-row-icon">{{ tabIcon(tab.id) }}</span>
                          <div>
                            <strong>{{ tab.label }}</strong>
                            <p class="cell-desc">{{ tab.description || 'Workspace section' }}</p>
                          </div>
                        </div>
                      </td>
                      <td><code>{{ tab.path }}</code></td>
                      <td>
                        @if (tab.isSensitive) {
                          <span class="pill warn" title="Contains external cloud credentials and publishing capabilities">
                            Sensitive Integration
                          </span>
                        } @else if (tab.requiresAuth) {
                          <span class="pill brand">Requires Sign-In</span>
                        } @else {
                          <span class="pill">Public Safe</span>
                        }
                      </td>
                      <td style="text-align: center">
                        <input
                          type="checkbox"
                          class="matrix-checkbox"
                          [(ngModel)]="tab.visibleToAnonymous"
                          [name]="'anon_' + tab.id"
                          [title]="'Show ' + tab.label + ' for anonymous guests'"
                        />
                      </td>
                      <td style="text-align: center">
                        <input
                          type="checkbox"
                          class="matrix-checkbox"
                          [(ngModel)]="tab.visibleToMembers"
                          [name]="'member_' + tab.id"
                          [title]="'Show ' + tab.label + ' for authenticated members'"
                        />
                      </td>
                      <td style="text-align: center">
                        <input
                          type="checkbox"
                          class="matrix-checkbox"
                          [(ngModel)]="tab.enabled"
                          [name]="'enabled_' + tab.id"
                          [title]="'Enable ' + tab.label + ' globally across studio'"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ================================================================= -->
        <!-- TAB 2: GUEST QUOTAS & POLICIES                                    -->
        <!-- ================================================================= -->
        @if (activeTab() === 'policy') {
          <div class="card">
            <div class="card-head">
              <div>
                <h3>Anonymous Visitor Quotas & Feature Tiers</h3>
                <p class="muted">
                  Governs public visitors exploring AnimStudio without signing in. Restrict heavy workloads and lock sensitive publishing to protect server resources and channel credentials.
                </p>
              </div>
              <button
                type="button"
                class="btn-primary-glow"
                (click)="savePolicy()"
                [disabled]="saving()"
              >
                @if (saving()) {
                  <span class="spinner"></span> Saving...
                } @else {
                  Save Policy
                }
              </button>
            </div>

            <div class="grid-form">
              <label class="toggle-control">
                <input
                  type="checkbox"
                  [(ngModel)]="policy.enabled"
                  name="enabled"
                />
                <span class="toggle-text">
                  <strong>Allow Anonymous / Public Browsing</strong>
                  <span class="muted">Unauthenticated visitors can explore the studio editor and templates.</span>
                </span>
              </label>

              <label class="toggle-control">
                <input
                  type="checkbox"
                  [(ngModel)]="policy.allowGuestProjectCreation"
                  name="allowGuestProjectCreation"
                />
                <span class="toggle-text">
                  <strong>Allow Guest Project Creation</strong>
                  <span class="muted">Permit visitors to create isolated temporary projects in their session.</span>
                </span>
              </label>

              <div class="input-control">
                <label for="maxGuestProjects">
                  <strong>Max Projects per Guest</strong>
                  <span class="muted">Ceiling on active projects an unauthenticated visitor may create.</span>
                </label>
                <input
                  id="maxGuestProjects"
                  type="number"
                  min="1"
                  max="50"
                  [(ngModel)]="policy.maxGuestProjects"
                  name="maxGuestProjects"
                />
              </div>

              <label class="toggle-control">
                <input
                  type="checkbox"
                  [(ngModel)]="policy.allowRender"
                  name="allowRender"
                />
                <span class="toggle-text">
                  <strong>Allow Guest Video Renders</strong>
                  <span class="muted">Permit unauthenticated guests to render preview clips locally.</span>
                </span>
              </label>

              <div class="input-control">
                <label for="maxDuration">
                  <strong>Max Guest Render Duration (seconds)</strong>
                  <span class="muted">Ceiling on preview export length for visitors.</span>
                </label>
                <input
                  id="maxDuration"
                  type="number"
                  min="5"
                  max="300"
                  [(ngModel)]="policy.maxRenderDurationSeconds"
                  name="maxRenderDurationSeconds"
                />
              </div>

              <div class="input-control">
                <label for="maxAi">
                  <strong>Max Guest AI Calls (per day)</strong>
                  <span class="muted">Daily rate limit on free-tier LLM and voiceover requests per guest.</span>
                </label>
                <input
                  id="maxAi"
                  type="number"
                  min="0"
                  max="50"
                  [(ngModel)]="policy.maxAiCallsPerDay"
                  name="maxAiCallsPerDay"
                />
              </div>

              <!-- Sensitive Feature Toggles with Security Warnings -->
              <label class="toggle-control danger-border">
                <input
                  type="checkbox"
                  [(ngModel)]="policy.allowYouTubePublish"
                  name="allowYouTubePublish"
                />
                <span class="toggle-text">
                  <strong style="color: #fca5a5">Allow Guest YouTube Publishing</strong>
                  <span class="muted">Permit guests to connect and upload to YouTube (strongly recommended: OFF).</span>
                </span>
              </label>

              <label class="toggle-control danger-border">
                <input
                  type="checkbox"
                  [(ngModel)]="policy.allowGoogleDrivePublish"
                  name="allowGoogleDrivePublish"
                />
                <span class="toggle-text">
                  <strong style="color: #fca5a5">Allow Guest Google Drive Publishing</strong>
                  <span class="muted">Permit guests to connect Google Drive and export renders (strongly recommended: OFF).</span>
                </span>
              </label>

              <label class="toggle-control">
                <input
                  type="checkbox"
                  [(ngModel)]="policy.allowCloudSave"
                  name="allowCloudSave"
                />
                <span class="toggle-text">
                  <strong>Allow Guest Database Persistence</strong>
                  <span class="muted">Persist guest projects to the central database rather than memory only.</span>
                </span>
              </label>
            </div>
          </div>
        }

        <!-- ================================================================= -->
        <!-- TAB 3: USER & SESSION SCOPES INSPECTOR                            -->
        <!-- ================================================================= -->
        @if (activeTab() === 'scopes') {
          <div class="card">
            <div class="card-head">
              <div>
                <h3>User &amp; Guest Isolation Scopes</h3>
                <p class="muted">
                  AnimStudio enforces strict user scoping: every project, asset, and credential is bound to a single user identity or isolated guest session.
                  No user or guest can see or modify another user's projects.
                </p>
              </div>
              <div class="head-actions">
                <button
                  type="button"
                  class="btn-outline btn-sm icon"
                  (click)="loadUserScopes()"
                  [disabled]="loadingScopes()"
                  title="Refresh active scopes"
                >
                  <span [class.spin]="loadingScopes()">↻</span> Refresh
                </button>
                <button
                  type="button"
                  class="btn-outline btn-sm danger"
                  (click)="openPurgeModal()"
                  title="Purge inactive guest projects"
                >
                  🧹 Purge Stale Guests
                </button>
              </div>
            </div>

            <!-- Scope Stats Bar -->
            @if (userScopes(); as us) {
              <div class="scope-stats-grid">
                <div class="stat-box">
                  <span class="stat-number">{{ us.totalProjects }}</span>
                  <span class="stat-label">Total Projects</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number brand">{{ us.registeredMembers }}</span>
                  <span class="stat-label">Registered Accounts</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number warn">{{ us.guestSessions }}</span>
                  <span class="stat-label">Guest Sessions</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number success">100%</span>
                  <span class="stat-label">Isolation Integrity</span>
                </div>
              </div>

              <!-- Session Inactivity & Lifetime Policy Card -->
              <div class="card" style="margin-top: 1.25rem; border: 1px solid rgba(108, 140, 255, 0.25); background: rgba(15, 23, 42, 0.55);">
                <div class="card-head">
                  <div>
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem">
                      <span>⏱️</span> Session Inactivity &amp; Expiry Policy
                    </h3>
                    <p class="muted">
                      Configure automatic sign out due to inactivity. Continuous user interactions (typing, editing, timeline scrubbing, renders) reset the countdown.
                    </p>
                  </div>
                  <div class="head-actions">
                    <button
                      type="button"
                      class="btn-primary-glow btn-sm"
                      (click)="saveSessionPolicy()"
                      title="Save inactivity policy"
                    >
                      Save Policy
                    </button>
                  </div>
                </div>

                <div class="policy-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; padding: 1rem 0;">
                  <div class="form-field">
                    <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #cbd5e1;">
                      Inactivity Timeout Limit:
                    </label>
                    <select
                      [(ngModel)]="sessionTimeoutMinutes"
                      style="width: 100%; padding: 0.5rem; background: #0b101b; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; color: #f1f5f9;"
                    >
                      <option [value]="15">15 Minutes</option>
                      <option [value]="30">30 Minutes (Recommended)</option>
                      <option [value]="45">45 Minutes</option>
                      <option [value]="60">60 Minutes (1 Hour)</option>
                      <option [value]="120">120 Minutes (2 Hours)</option>
                      <option [value]="180">180 Minutes (3 Hours)</option>
                    </select>
                    <span class="muted" style="font-size: 0.76rem; display: block; margin-top: 0.3rem">
                      User will be logged out after this duration of continuous inactivity.
                    </span>
                  </div>

                  <div class="form-field">
                    <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #cbd5e1;">
                      Warning Alert Window:
                    </label>
                    <select
                      [(ngModel)]="sessionWarningMinutes"
                      style="width: 100%; padding: 0.5rem; background: #0b101b; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; color: #f1f5f9;"
                    >
                      <option [value]="1">1 Minute before expiry</option>
                      <option [value]="2">2 Minutes before expiry (Default)</option>
                      <option [value]="3">3 Minutes before expiry</option>
                      <option [value]="5">5 Minutes before expiry</option>
                    </select>
                    <span class="muted" style="font-size: 0.76rem; display: block; margin-top: 0.3rem">
                      When this time remains, a top banner and pop-up with a progress bar will appear.
                    </span>
                  </div>

                  <div class="form-field" style="display: flex; flex-direction: column; justify-content: center; background: rgba(0, 0, 0, 0.25); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                    <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 0.25rem;">Live Session Countdown:</div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #fbbf24; font-family: monospace;">
                      {{ sessionTimeout.formattedRemaining() }} remaining
                    </div>
                    <div style="font-size: 0.74rem; color: #64748b; margin-top: 0.2rem;">
                      Status: {{ sessionTimeout.isWarning() ? '⚠️ Warning Active' : '🟢 Session Active' }}
                    </div>
                  </div>
                </div>
              </div>

              @if (loadingScopes()) {
                <p class="muted">Loading user scopes&hellip;</p>
              } @else if (us.scopes.length === 0) {
                <p class="muted">No project scopes recorded yet.</p>
              } @else {
                <div class="table-responsive">
                  <table class="channel-table">
                    <thead>
                      <tr>
                        <th>User Scope / Guest ID</th>
                        <th>Type</th>
                        <th>Projects Owned</th>
                        <th>Storage Used</th>
                        <th>Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of us.scopes; track s.userId) {
                        <tr>
                          <td>
                            <div class="scope-id-cell">
                              <span class="scope-icon">{{ s.isGuest ? '👤' : '👑' }}</span>
                              <div>
                                <strong>{{ s.displayName }}</strong>
                                <span class="mono muted scope-mono">{{ s.userId }}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            @if (s.isGuest) {
                              <span class="pill">Guest Session</span>
                            } @else {
                              <span class="pill brand">Registered Member</span>
                            }
                          </td>
                          <td>
                            <strong>{{ s.projectCount }}</strong>
                            <span class="muted"> project(s)</span>
                          </td>
                          <td class="muted">{{ s.storageEstimate }}</td>
                          <td class="muted">{{ s.lastActiveUtc ? (s.lastActiveUtc | date:'short') : 'Recently' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          </div>

          <!-- Purge Inactive Guests Modal -->
          @if (showPurgeDialog()) {
            <div class="modal-backdrop" (click)="showPurgeDialog.set(false)">
              <div class="modal-card" (click)="$event.stopPropagation()">
                <div class="modal-head">
                  <h4>🧹 Purge Inactive Guest Sessions</h4>
                  <button type="button" class="modal-close" (click)="showPurgeDialog.set(false)">✕</button>
                </div>
                <p class="muted" style="margin-top: 0">
                  Safely deletes temporary projects created by unauthenticated visitors that have been inactive for longer than the specified period.
                  Registered member accounts and their projects are NEVER purged.
                </p>
                <div class="input-control" style="margin-bottom: 1.25rem">
                  <label for="purgeDays">
                    <strong>Inactive Days Threshold</strong>
                    <span class="muted">Purge guest projects older than this many days:</span>
                  </label>
                  <input
                    id="purgeDays"
                    type="number"
                    min="1"
                    max="90"
                    [(ngModel)]="purgeDays"
                  />
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn-outline" (click)="showPurgeDialog.set(false)">
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="btn-danger-glow"
                    (click)="confirmPurgeGuests()"
                    [disabled]="purging()"
                  >
                    @if (purging()) {
                      <span class="spinner"></span> Purging...
                    } @else {
                      Confirm Purge
                    }
                  </button>
                </div>
              </div>
            </div>
          }
        }

        <!-- ================================================================= -->
        <!-- TAB 4: IDENTITY & MASTER YOUTUBE ACCOUNTS                         -->
        <!-- ================================================================= -->
        @if (activeTab() === 'identity') {
          <!-- Central Identity Boundary & Roles Card -->
          <div class="card">
            <div class="card-head">
              <div>
                <h3>Central Identity & App Scoping (id.keshavsingh.in)</h3>
                <p class="muted">
                  Hierarchical RBAC and app isolation boundaries enforced by the centralized Identity Provider.
                </p>
              </div>
            </div>

            <div class="identity-info-box">
              <div class="info-row">
                <span class="info-label">Active Roles:</span>
                <div class="roles-pills">
                  @for (role of accessInfo()?.availableRoles; track role) {
                    <span class="pill" [class.brand]="role === 'Admin'">{{ role }}</span>
                  }
                </div>
              </div>

              <div class="info-notice">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>
                  <strong>App Boundary Rule:</strong> Users registered on AnimStudio receive the <code>StudioUser</code> role scoped to <code>app=studio</code>. By IdP security design, these accounts cannot authenticate to other admin portals unless explicitly granted permission by an administrator.
                </span>
              </div>
            </div>
          </div>

          <!-- Master Connected YouTube Channels Card -->
          <div class="card">
            <div class="card-head">
              <div>
                <h3>Master YouTube Channel Supervision</h3>
                <p class="muted">
                  Global view of every YouTube channel connected across all users. Regular users can only see their own channels; administrators have platform oversight.
                </p>
              </div>
              <button
                type="button"
                class="btn-outline icon"
                (click)="loadAllChannels()"
                [disabled]="loadingChannels()"
                title="Refresh channel list"
              >
                <span [class.spin]="loadingChannels()">↻</span>
              </button>
            </div>

            @if (loadingChannels()) {
              <p class="muted">Loading channels&hellip;</p>
            } @else if (allChannels().length === 0) {
              <div class="empty-channels">
                <p class="muted">No YouTube channels have been connected by any user yet.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="channel-table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Channel ID</th>
                      <th>Owner (User ID)</th>
                      <th>Status</th>
                      <th>Connected</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of allChannels(); track c.id) {
                      <tr>
                        <td class="ch-cell">
                          @if (c.thumbnailUrl) {
                            <img [src]="c.thumbnailUrl" class="ch-thumb" alt="" />
                          } @else {
                            <div class="ch-placeholder">▶</div>
                          }
                          <span class="ch-title">{{ c.channelTitle || 'Untitled Channel' }}</span>
                        </td>
                        <td><code>{{ c.channelId }}</code></td>
                        <td>
                          <span class="owner-badge" [class.admin]="c.ownerUserId === 'ks_admin' || c.ownerUserId.startsWith('admin')">
                            {{ c.ownerUserId }}
                          </span>
                        </td>
                        <td>
                          <span class="status-badge" [class.active]="c.status === 'Connected'">
                            {{ c.status }}
                          </span>
                        </td>
                        <td class="muted">{{ c.connectedAt | date:'mediumDate' }}</td>
                        <td class="muted">{{ c.lastUsedAt ? (c.lastUsedAt | date:'short') : 'Never' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .access-control-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sub-nav-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.5rem;
    }

    .sub-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      background: transparent;
      border: 1px solid transparent;
      color: #94a3b8;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .sub-tab-btn:hover {
      background: rgba(255, 255, 255, 0.03);
      color: #fff;
    }

    .sub-tab-btn.active {
      background: rgba(108, 140, 255, 0.12);
      border-color: rgba(108, 140, 255, 0.35);
      color: #8bb0ff;
    }

    .tab-badge {
      padding: 0.1rem 0.4rem;
      border-radius: 99px;
      background: rgba(245, 158, 11, 0.25);
      color: #f59e0b;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .card {
      background: var(--surface-1, #131b2e);
      border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .card-head h3 {
      margin: 0 0 0.25rem;
      font-size: 1.15rem;
      color: #fff;
    }

    .head-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .grid-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .toggle-control {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 0.9rem 1rem;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .toggle-control:hover {
      border-color: rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.035);
    }

    .toggle-control.danger-border {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.03);
    }

    .toggle-control input[type="checkbox"] {
      width: 1.15rem;
      height: 1.15rem;
      margin-top: 0.15rem;
      accent-color: #6c8cff;
      cursor: pointer;
    }

    .toggle-text {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .toggle-text strong {
      font-size: 0.92rem;
      color: #e2e8f0;
    }

    .toggle-text .muted {
      font-size: 0.78rem;
      line-height: 1.4;
    }

    .input-control {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 0.9rem 1rem;
    }

    .input-control label {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .input-control strong {
      font-size: 0.92rem;
      color: #e2e8f0;
    }

    .input-control input {
      margin-top: 0.35rem;
      padding: 0.45rem 0.75rem;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      color: #fff;
      font-size: 0.92rem;
      outline: none;
    }

    .matrix-table th, .matrix-table td {
      vertical-align: middle;
    }

    .matrix-table tr.is-sensitive {
      background: rgba(245, 158, 11, 0.02);
    }

    .tab-row-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .tab-row-icon {
      font-size: 1.25rem;
    }

    .cell-desc {
      margin: 0.15rem 0 0;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .matrix-checkbox {
      width: 1.25rem;
      height: 1.25rem;
      accent-color: #6c8cff;
      cursor: pointer;
    }

    .scope-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .stat-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .stat-number {
      font-size: 1.75rem;
      font-weight: 800;
      color: #fff;
    }

    .stat-number.brand { color: #8bb0ff; }
    .stat-number.warn { color: #f59e0b; }
    .stat-number.success { color: #10b981; }

    .stat-label {
      font-size: 0.78rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    .scope-id-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .scope-icon {
      font-size: 1.15rem;
    }

    .scope-mono {
      display: block;
      font-size: 0.75rem;
      color: #8bb0ff;
    }

    .btn-primary-glow {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #fff;
      border: none;
      padding: 0.55rem 1.15rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      box-shadow: 0 0 15px rgba(79, 70, 229, 0.35);
      transition: all 0.15s ease;
    }

    .btn-primary-glow:hover {
      box-shadow: 0 0 20px rgba(79, 70, 229, 0.6);
      transform: translateY(-1px);
    }

    .btn-danger-glow {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: #fff;
      border: none;
      padding: 0.55rem 1.15rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      box-shadow: 0 0 15px rgba(220, 38, 38, 0.35);
    }

    .btn-outline.danger {
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }

    .btn-outline.danger:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background: var(--surface-1, #131b2e);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 1.75rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .modal-head h4 {
      margin: 0;
      font-size: 1.15rem;
      color: #fff;
    }

    .modal-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1.1rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .channel-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .channel-table th,
    .channel-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .channel-table th {
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .ch-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .ch-thumb {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
    }

    .ch-placeholder {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: #ff0000;
    }

    .owner-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 0.78rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }

    .owner-badge.admin {
      background: rgba(108, 140, 255, 0.12);
      border-color: rgba(108, 140, 255, 0.35);
      color: #8bb0ff;
    }

    .status-badge {
      font-size: 0.76rem;
      padding: 0.15rem 0.5rem;
      border-radius: 99px;
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      font-weight: 600;
    }

    .status-badge.active {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    .identity-info-box {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .info-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .roles-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }

    .info-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      font-size: 0.82rem;
      color: #94a3b8;
      background: rgba(108, 140, 255, 0.06);
      border: 1px solid rgba(108, 140, 255, 0.2);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      line-height: 1.45;
    }

    .info-notice code {
      color: #8bb0ff;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .pill.brand {
      background: rgba(108, 140, 255, 0.15);
      color: #8bb0ff;
      border: 1px solid rgba(108, 140, 255, 0.3);
    }

    .pill.success {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .pill.warn {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class AdminAccessControlComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly status = inject(StatusService);
  private readonly uiNav = inject(UiNavigationService);
  readonly sessionTimeout = inject(SessionTimeoutService);

  readonly activeTab = signal<AdminViewTab>('matrix');
  readonly accessInfo = signal<AdminAccessControl | null>(null);
  readonly allChannels = signal<AdminYouTubeChannelItem[]>([]);
  readonly userScopes = signal<UserScopesOverview | null>(null);

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly loadingChannels = signal<boolean>(false);
  readonly loadingScopes = signal<boolean>(false);
  readonly purging = signal<boolean>(false);
  readonly showPurgeDialog = signal<boolean>(false);

  purgeDays = 7;
  sessionTimeoutMinutes = this.sessionTimeout.timeoutMinutes();
  sessionWarningMinutes = this.sessionTimeout.warningMinutes();

  saveSessionPolicy(): void {
    this.sessionTimeout.setTimeoutMinutes(this.sessionTimeoutMinutes);
    this.sessionTimeout.setWarningMinutes(this.sessionWarningMinutes);
    this.status.showNotice(`Session policy updated: ${this.sessionTimeoutMinutes} min inactivity timeout, ${this.sessionWarningMinutes} min warning.`);
  }

  // Form model for Anonymous visitor policies
  policy: AnonymousAccessPolicy = {
    enabled: true,
    allowRender: true,
    maxRenderDurationSeconds: 60,
    maxAiCallsPerDay: 5,
    allowYouTubePublish: false,
    allowCloudSave: false,
    allowGoogleDrivePublish: false,
    maxGuestProjects: 5,
    allowGuestProjectCreation: true,
  };

  // Nav tabs model for matrix configuration
  navTabs: UiNavigationItemConfig[] = [...DEFAULT_UI_NAVIGATION_TABS];

  constructor() {
    this.loadData();
    this.loadAllChannels();
    this.loadUserScopes();
  }

  setTab(tab: AdminViewTab): void {
    this.activeTab.set(tab);
    if (tab === 'scopes' && !this.userScopes()) {
      this.loadUserScopes();
    }
  }

  loadData(): void {
    this.loading.set(true);
    this.api.adminAccessControl().subscribe({
      next: (data) => {
        this.accessInfo.set(data);
        if (data.anonymousPolicy) {
          this.policy = { ...data.anonymousPolicy };
        }
        if (data.uiNavigation && data.uiNavigation.tabs?.length > 0) {
          this.navTabs = data.uiNavigation.tabs.map((t) => ({ ...t }));
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.status.showError(err?.message || 'Failed to load access control settings.');
        this.loading.set(false);
      },
    });
  }

  loadAllChannels(): void {
    this.loadingChannels.set(true);
    this.api.adminAllYouTubeChannels().subscribe({
      next: (channels) => {
        this.allChannels.set(channels);
        this.loadingChannels.set(false);
      },
      error: () => {
        this.loadingChannels.set(false);
      },
    });
  }

  loadUserScopes(): void {
    this.loadingScopes.set(true);
    this.api.adminUserScopes().subscribe({
      next: (overview) => {
        this.userScopes.set(overview);
        this.loadingScopes.set(false);
      },
      error: () => {
        this.loadingScopes.set(false);
      },
    });
  }

  savePolicy(): void {
    this.saving.set(true);
    this.api.updateAdminAccessControl({ anonymousPolicy: this.policy }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.accessInfo.set(res);
        if (res.anonymousPolicy) {
          this.policy = { ...res.anonymousPolicy };
        }
        this.status.showNotice('Access control policy updated successfully.');
        this.auth.fetchSystemSession().subscribe();
      },
      error: (err) => {
        this.saving.set(false);
        this.status.showError(err?.message || 'Failed to update access control settings.');
      },
    });
  }

  saveUiNavigation(): void {
    this.saving.set(true);
    const navSettings: UiNavigationSettings = {
      enforceGuestRestrictions: true,
      tabs: this.navTabs,
    };

    this.api.updateAdminAccessControl({ uiNavigation: navSettings }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.accessInfo.set(res);
        this.uiNav.settings.set(navSettings);
        this.status.showNotice('UI Navigation visibility rules saved and updated.');
      },
      error: (err) => {
        this.saving.set(false);
        this.status.showError(err?.message || 'Failed to update UI navigation settings.');
      },
    });
  }

  applyPreset(preset: 'strict' | 'defaults'): void {
    if (preset === 'strict') {
      for (const t of this.navTabs) {
        if (t.isSensitive || t.requiresAuth) {
          t.visibleToAnonymous = false;
        }
      }
      this.status.showNotice('Strict Privacy preset applied: sensitive publishing features hidden from guests.');
    } else {
      this.navTabs = DEFAULT_UI_NAVIGATION_TABS.map((t) => ({ ...t }));
      this.status.showNotice('Defaults restored.');
    }
  }

  openPurgeModal(): void {
    this.showPurgeDialog.set(true);
  }

  confirmPurgeGuests(): void {
    this.purging.set(true);
    this.api.purgeGuestProjects(this.purgeDays).subscribe({
      next: (res) => {
        this.purging.set(false);
        this.showPurgeDialog.set(false);
        this.status.showNotice(`Purged ${res.projectsPurged} stale guest project(s) across ${res.guestScopesCleaned} guest scope(s).`);
        this.loadUserScopes();
      },
      error: (err) => {
        this.purging.set(false);
        this.status.showError(err?.message || 'Failed to purge guest projects.');
      },
    });
  }

  tabIcon(id: string): string {
    switch (id) {
      case 'projects': return '📁';
      case 'shorts': return '📱';
      case 'calendar': return '📅';
      case 'effects': return '✨';
      case 'clips': return '🎞️';
      case 'tools': return '🛠️';
      case 'release': return '🎵';
      case 'youtube': return '▶️';
      case 'details': return '🔍';
      case 'live': return '🔴';
      case 'camera': return '📷';
      case 'motion-copy': return '🕺';
      case 'collab': return '👥';
      case 'logs': return '📜';
      case 'admin': return '⚙️';
      default: return '📄';
    }
  }
}
