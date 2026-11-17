import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { YouTubeMonetizationAuditReport, YouTubePolicyFinding } from '../../core/models/youtube.models';

type VerdictFilter = 'all' | 'wrong' | 'good' | 'verify';

const DEFAULT_POLICY_URL = 'https://support.google.com/youtube/answer/1311392?hl=en';

/**
 * Shared YouTube Partner Program & recommendation policy panel modeled on
 * `https://support.google.com/youtube/answer/1311392?hl=en`.
 * Separates verified strengths ("good"), detected metadata/repetition risks ("wrong"),
 * and checks that APIs cannot observe automatically — especially on mobile or external uploads ("verify").
 */
@Component({
  selector: 'app-youtube-policy-audit',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="ypa-card" aria-labelledby="ypa-title">
      <div class="ypa-head">
        <div class="ypa-head-copy">
          <div class="ypa-kicker">YouTube Partner Program &amp; Recommendation Rules</div>
          <h3 id="ypa-title">🛡️ Monetization &amp; Originality Policy Audit</h3>
          @if (audit(); as a) {
            <p class="ypa-sub">
              Evaluated {{ a.videosEvaluated }} upload{{ a.videosEvaluated === 1 ? '' : 's' }} ·
              <strong>{{ a.appUploadedCount }}</strong> via AnimStudio ·
              <strong>{{ a.mobileOrExternalCount }}</strong> uploaded externally (mobile / YouTube Studio)
            </p>
          } @else {
            <p class="ypa-sub">
              Based on YouTube's official channel monetization policies (Inauthentic Content, Reused Content, Metadata &amp; Altered Media).
              @if (needsRefreshHint()) { Press <strong>Refresh numbers</strong> above to run the full metadata check on this channel's uploads. }
            </p>
          }
        </div>

        <div class="ypa-head-actions">
          @if (audit(); as a) {
            <span class="ypa-score-pill" [attr.data-status]="a.overallStatus.toLowerCase()">
              {{ a.scoreOutOf100 }}/100 · {{ statusLabel(a.overallStatus) }}
            </span>
          }
          <a [href]="policyUrl()" target="_blank" rel="noopener noreferrer" class="ypa-link-pill">
            Official Policy (answer/1311392) ↗
          </a>
          <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" class="ypa-link-pill ghost">
            YouTube Studio ↗
          </a>
          @if (showCheckupLink()) {
            <a routerLink="/youtube/checkup" class="ypa-link-pill ghost">
              Open Details Checkup →
            </a>
          }
        </div>
      </div>

      @if (audit(); as a) {
        @if (a.mobileOrExternalCount > 0) {
          <div class="ypa-mobile-note" role="note">
            <span aria-hidden="true">📱</span>
            <div>
              <strong>Note on mobile / external uploads:</strong>
              {{ a.mobileOrExternalCount }} upload{{ a.mobileOrExternalCount === 1 ? ' was' : 's were' }} posted outside AnimStudio.
              We audit titles, descriptions, tags, audience and playlists automatically, <strong>but APIs cannot watch your video frames, hear voiceover/music, or confirm YouTube Studio flags</strong> — review the “Verify Manually” checklist below.
            </div>
          </div>
        }

        <div class="ypa-tabs" role="tablist" aria-label="Filter policy checks">
          <button type="button" role="tab" [class.active]="filter() === 'all'" [attr.aria-selected]="filter() === 'all'" (click)="filter.set('all')">
            All checks ({{ a.items.length }})
          </button>
          <button type="button" role="tab" class="tab-wrong" [class.active]="filter() === 'wrong'" [attr.aria-selected]="filter() === 'wrong'" (click)="filter.set('wrong')">
            ⚠️ Needs Fixing ({{ counts().wrong }})
          </button>
          <button type="button" role="tab" class="tab-good" [class.active]="filter() === 'good'" [attr.aria-selected]="filter() === 'good'" (click)="filter.set('good')">
            ✅ Doing Good ({{ counts().good }})
          </button>
          <button type="button" role="tab" class="tab-verify" [class.active]="filter() === 'verify'" [attr.aria-selected]="filter() === 'verify'" (click)="filter.set('verify')">
            📱 Verify Manually ({{ counts().verify }})
          </button>
        </div>

        <div class="ypa-grid">
          @for (item of visibleItems(); track item.id) {
            <article class="ypa-item" [attr.data-verdict]="item.verdict">
              <div class="ypa-item-top">
                <span class="ypa-verdict-badge" [attr.data-verdict]="item.verdict">
                  {{ verdictIcon(item.verdict) }} {{ verdictLabel(item.verdict) }}
                </span>
                <span class="ypa-cat">{{ item.category }}</span>
              </div>
              <h4>{{ item.title }}</h4>
              <p class="ypa-detail">{{ item.detail }}</p>
              @if (item.steps.length > 0) {
                <ol class="ypa-steps">
                  @for (step of item.steps; track $index) {
                    <li>{{ step }}</li>
                  }
                </ol>
              }
              @if (item.issueCode && (item.affectedVideoIds?.length ?? 0) > 0 && showFilterAction()) {
                <div class="ypa-item-foot">
                  <button type="button" class="ypa-filter-btn" (click)="filterIssue.emit(item.issueCode!)">
                    Show matching videos ({{ item.affectedVideoIds!.length }}) ↓
                  </button>
                </div>
              }
            </article>
          } @empty {
            <p class="ypa-empty">No items in this filter.</p>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .ypa-card {
      background: var(--surface-1, rgba(255, 255, 255, 0.03));
      border: 1px solid var(--border, rgba(148, 163, 184, 0.25));
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .ypa-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .ypa-kicker { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--brand-bright, #818cf8); }
    .ypa-head-copy h3 { margin: 2px 0 4px; font-size: 17px; }
    .ypa-sub { margin: 0; font-size: 13px; color: var(--muted, #94a3b8); line-height: 1.45; }
    .ypa-head-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .ypa-score-pill {
      font-size: 12.5px; font-weight: 700; padding: 5px 11px; border-radius: 999px;
      border: 1px solid rgba(16, 185, 129, 0.45); background: rgba(16, 185, 129, 0.14); color: #34d399;
    }
    .ypa-score-pill[data-status="needsattention"] {
      border-color: rgba(245, 158, 11, 0.45); background: rgba(245, 158, 11, 0.14); color: #fbbf24;
    }
    .ypa-score-pill[data-status="atrisk"] {
      border-color: rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.14); color: #f87171;
    }
    .ypa-link-pill {
      font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 8px; text-decoration: none;
      background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: var(--text, #e2e8f0);
    }
    .ypa-link-pill.ghost { background: transparent; border-color: var(--border, rgba(148, 163, 184, 0.3)); color: var(--text-dim, #cbd5e1); }
    .ypa-link-pill:hover { border-color: var(--brand, #6366f1); }
    .ypa-mobile-note {
      display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; font-size: 12.5px; line-height: 1.45;
      background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.35); color: var(--text, #e2e8f0);
    }
    .ypa-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
    .ypa-tabs button {
      font-size: 12px; font-weight: 600; padding: 5px 11px; border-radius: 999px; cursor: pointer;
      background: var(--sunk-1, rgba(15, 23, 42, 0.35)); border: 1px solid var(--border, rgba(148, 163, 184, 0.25)); color: var(--text-dim, #cbd5e1);
    }
    .ypa-tabs button.active { background: var(--brand-subtle, rgba(99, 102, 241, 0.2)); border-color: var(--brand, #6366f1); color: var(--text, #fff); }
    .ypa-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 10px; }
    .ypa-item {
      padding: 12px 13px; border-radius: 10px; border: 1px solid var(--border, rgba(148, 163, 184, 0.22));
      border-left-width: 4px; background: var(--sunk-1, rgba(15, 23, 42, 0.28)); display: flex; flex-direction: column; gap: 6px;
    }
    .ypa-item[data-verdict="good"] { border-left-color: #10b981; }
    .ypa-item[data-verdict="wrong"] { border-left-color: #ef4444; }
    .ypa-item[data-verdict="verify"] { border-left-color: #38bdf8; }
    .ypa-item-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
    .ypa-verdict-badge { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
    .ypa-verdict-badge[data-verdict="good"] { background: rgba(16, 185, 129, 0.16); color: #34d399; }
    .ypa-verdict-badge[data-verdict="wrong"] { background: rgba(239, 68, 68, 0.16); color: #f87171; }
    .ypa-verdict-badge[data-verdict="verify"] { background: rgba(56, 189, 248, 0.16); color: #38bdf8; }
    .ypa-cat { font-size: 11px; color: var(--muted, #94a3b8); font-weight: 600; }
    .ypa-item h4 { margin: 0; font-size: 13.5px; line-height: 1.35; }
    .ypa-detail { margin: 0; font-size: 12.5px; color: var(--text-dim, #cbd5e1); line-height: 1.45; }
    .ypa-steps { margin: 2px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--muted, #94a3b8); line-height: 1.4; }
    .ypa-item-foot { margin-top: 2px; }
    .ypa-filter-btn {
      font-size: 11.5px; font-weight: 600; padding: 4px 9px; border-radius: 6px; cursor: pointer;
      background: rgba(99, 102, 241, 0.14); border: 1px solid rgba(99, 102, 241, 0.4); color: var(--brand-bright, #a5b4fc);
    }
    .ypa-empty { margin: 6px 0; font-size: 13px; color: var(--muted, #94a3b8); }
  `],
})
export class YouTubePolicyAuditComponent {
  readonly audit = input<YouTubeMonetizationAuditReport | null | undefined>(null);
  readonly showCheckupLink = input(false);
  readonly showFilterAction = input(false);
  readonly needsRefreshHint = input(false);

  readonly filterIssue = output<string>();

  readonly filter = signal<VerdictFilter>('all');

  readonly policyUrl = computed(() => this.audit()?.policyUrl || DEFAULT_POLICY_URL);

  readonly counts = computed(() => {
    const items = this.audit()?.items ?? [];
    return {
      good: items.filter((i) => i.verdict === 'good').length,
      wrong: items.filter((i) => i.verdict === 'wrong').length,
      verify: items.filter((i) => i.verdict === 'verify').length,
    };
  });

  readonly visibleItems = computed<readonly YouTubePolicyFinding[]>(() => {
    const items = this.audit()?.items ?? [];
    const f = this.filter();
    if (f === 'all') return items;
    return items.filter((item) => item.verdict === f);
  });

  statusLabel(status: string): string {
    switch (status) {
      case 'Strong': return 'Policy Strong';
      case 'AtRisk': return 'Action Required';
      default: return 'Needs Attention';
    }
  }

  verdictIcon(verdict: string): string {
    switch (verdict) {
      case 'good': return '✅';
      case 'wrong': return '⚠️';
      default: return '📱';
    }
  }

  verdictLabel(verdict: string): string {
    switch (verdict) {
      case 'good': return 'Doing Good';
      case 'wrong': return 'Needs Fixing';
      default: return 'Verify Manually';
    }
  }
}
