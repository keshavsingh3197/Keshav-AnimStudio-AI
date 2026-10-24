import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusService } from '../../core/services/status.service';
import {
  AdminAccessControl,
  AdminYouTubeChannelItem,
  AnonymousAccessPolicy,
} from '../../core/models/auth.models';

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
              <h2 style="margin: 0">Access & Quotas</h2>
              <span class="pill brand">{{ accessInfo()?.mode || 'RBAC' }}</span>
            </div>
            <p class="muted">
              Configure anonymous visitor policies, render duration ceilings, AI call quotas, and supervise all connected YouTube accounts across the platform.
            </p>
          </div>
        </div>
      </header>

      @if (loading()) {
        <div class="card muted" style="display: flex; align-items: center; gap: 0.65rem">
          <span class="spinner"></span> Loading access control configurations&hellip;
        </div>
      } @else {
        <!-- Anonymous Visitor Policy Card -->
        <div class="card">
          <div class="card-head">
            <div>
              <h3>Anonymous Visitor Quotas & Feature Tiers</h3>
              <p class="muted">
                Governs public visitors exploring AnimStudio without signing in. Restrict heavy workloads to protect server resources.
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
                [(ngModel)]="policy.allowRender"
                name="allowRender"
              />
              <span class="toggle-text">
                <strong>Allow Guest Renders</strong>
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
                min="10"
                max="600"
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

            <label class="toggle-control">
              <input
                type="checkbox"
                [(ngModel)]="policy.allowYouTubePublish"
                name="allowYouTubePublish"
              />
              <span class="toggle-text">
                <strong>Allow Guest YouTube Publishing</strong>
                <span class="muted">Should guests be allowed to publish directly (strongly recommended: OFF).</span>
              </span>
            </label>

            <label class="toggle-control">
              <input
                type="checkbox"
                [(ngModel)]="policy.allowCloudSave"
                name="allowCloudSave"
              />
              <span class="toggle-text">
                <strong>Allow Guest Cloud Persistence</strong>
                <span class="muted">Persist guest projects to the main database rather than browser session storage.</span>
              </span>
            </label>
          </div>
        </div>

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
                <strong>App Boundary Rule:</strong> Users registered on AnimStudio receive the <code>StudioUser</code> role scoped to <code>app=studio</code>. By IdP security design, these accounts cannot authenticate to the Admin Web Portal or private family APIs (FamSphere, GharLedger) unless explicitly granted permission by an administrator.
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
    </section>
  `,
  styles: [`
    .access-control-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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
      font-size: 1.1rem;
      color: #fff;
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
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(108, 140, 255, 0.3);
    }

    .toggle-control input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 1.1rem;
      height: 1.1rem;
      accent-color: #6c8cff;
      cursor: pointer;
    }

    .toggle-text {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .toggle-text strong {
      font-size: 0.88rem;
      color: #e2e8f0;
    }

    .input-control {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 0.9rem 1rem;
    }

    .input-control label {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .input-control label strong {
      font-size: 0.88rem;
      color: #e2e8f0;
    }

    .input-control input {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      padding: 0.45rem 0.75rem;
      color: #fff;
      font-size: 0.92rem;
      outline: none;
    }

    .input-control input:focus {
      border-color: #6c8cff;
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

    .ch-title {
      font-weight: 600;
      color: #fff;
    }

    .owner-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 0.76rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.06);
      color: #cbd5e1;
    }

    .owner-badge.admin {
      background: rgba(108, 140, 255, 0.18);
      color: #8bb0ff;
      border: 1px solid rgba(108, 140, 255, 0.3);
    }

    .status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 99px;
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .status-badge.active {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border-color: rgba(34, 197, 94, 0.3);
    }

    .btn-outline.icon {
      padding: 0.4rem 0.65rem;
      font-size: 1.1rem;
      cursor: pointer;
    }

    .spin {
      display: inline-block;
      animation: spin 0.8s linear infinite;
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

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadingChannels = signal(false);

  readonly accessInfo = signal<AdminAccessControl | null>(null);
  readonly allChannels = signal<AdminYouTubeChannelItem[]>([]);

  policy: AnonymousAccessPolicy = {
    enabled: true,
    allowRender: true,
    maxRenderDurationSeconds: 60,
    maxAiCallsPerDay: 5,
    allowYouTubePublish: false,
    allowCloudSave: false,
  };

  constructor() {
    this.loadData();
    this.loadAllChannels();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.adminAccessControl().subscribe({
      next: (data) => {
        this.accessInfo.set(data);
        if (data.anonymousPolicy) {
          this.policy = { ...data.anonymousPolicy };
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

  savePolicy(): void {
    this.saving.set(true);
    this.api.updateAdminAccessControl({ anonymousPolicy: this.policy }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.accessInfo.set(res);
        if (res.anonymousPolicy) {
          this.policy = { ...res.anonymousPolicy };
        }
        this.status.showNotice('Access control and quota settings updated successfully.');
        // Refresh local session to apply updated anonymous policy
        this.auth.fetchSystemSession().subscribe();
      },
      error: (err) => {
        this.saving.set(false);
        this.status.showError(err?.message || 'Failed to update access control settings.');
      },
    });
  }
}

