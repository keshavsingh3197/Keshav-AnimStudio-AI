import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionTimeoutService } from '../core/services/session-timeout.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-session-timeout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Warning Banner -->
    @if (auth.isAuthenticated() && sessionTimeout.isWarning()) {
      <div class="session-top-banner" [class.urgent]="sessionTimeout.isUrgent()" role="alert" aria-live="assertive">
        <div class="banner-content">
          <div class="banner-info">
            <span class="banner-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <div class="banner-text">
              <strong>Session Expiring:</strong>
              <span>You will be logged out in <strong>{{ sessionTimeout.formattedRemaining() }}</strong> due to inactivity.</span>
            </div>
          </div>

          <div class="banner-actions">
            <button
              type="button"
              class="btn-extend"
              (click)="sessionTimeout.extendSession()"
              title="Extend session for another {{ sessionTimeout.timeoutMinutes() }} minutes"
            >
              Extend Session
            </button>
            <button
              type="button"
              class="btn-signout"
              (click)="sessionTimeout.signOut()"
              title="Sign out now"
            >
              Sign Out
            </button>
          </div>
        </div>

        <!-- Banner Progress Bar -->
        <div class="banner-progress-track">
          <div
            class="banner-progress-bar"
            [class.urgent]="sessionTimeout.isUrgent()"
            [style.width.%]="sessionTimeout.progressPercent()"
          ></div>
        </div>
      </div>
    }

    <!-- Automatic Pop-up Warning Modal -->
    @if (auth.isAuthenticated() && sessionTimeout.showWarningModal()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="timeout-modal" role="dialog" aria-labelledby="timeout-title" aria-modal="true">
          <header class="modal-header">
            <div class="header-icon-box" [class.urgent]="sessionTimeout.isUrgent()">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h3 id="timeout-title">Session Expiring Soon</h3>
              <p class="modal-sub">Inactivity detected on this device.</p>
            </div>
            <button type="button" class="close-btn" (click)="sessionTimeout.dismissModal()" aria-label="Dismiss modal">
              &times;
            </button>
          </header>

          <div class="modal-body">
            <div class="countdown-hero">
              <span class="countdown-label">Time remaining before automatic sign out:</span>
              <div class="countdown-digits" [class.urgent]="sessionTimeout.isUrgent()">
                {{ sessionTimeout.formattedRemaining() }}
              </div>
            </div>

            <!-- Modal Progress Bar -->
            <div class="modal-progress-container">
              <div class="modal-progress-track">
                <div
                  class="modal-progress-fill"
                  [class.urgent]="sessionTimeout.isUrgent()"
                  [style.width.%]="sessionTimeout.progressPercent()"
                ></div>
              </div>
              <div class="progress-labels">
                <span>Expiring soon</span>
                <span>{{ sessionTimeout.progressPercent() }}%</span>
              </div>
            </div>

            <p class="modal-desc">
              Would you like to extend your session? Extending will reset the inactivity timer and keep your studio changes and renders safe.
            </p>

            <!-- Configurable Timeout Limit Quick Selector -->
            <div class="config-timeout-box">
              <label class="config-label">Inactivity timeout limit:</label>
              <div class="timeout-pills">
                @for (m of availableTimeouts; track m) {
                  <button
                    type="button"
                    class="pill-btn"
                    [class.active]="sessionTimeout.timeoutMinutes() === m"
                    (click)="sessionTimeout.setTimeoutMinutes(m)"
                  >
                    {{ m }}m
                  </button>
                }
              </div>
            </div>
          </div>

          <footer class="modal-footer">
            <div class="footer-left">
              <button type="button" class="btn-ghost" (click)="sessionTimeout.signOut()">
                Sign Out Now
              </button>
            </div>
            <div class="footer-right">
              <button type="button" class="btn-secondary" (click)="sessionTimeout.dismissModal()">
                Dismiss
              </button>
              <button
                type="button"
                class="btn-primary-glow"
                (click)="sessionTimeout.extendSession()"
                autofocus
              >
                Extend Session
              </button>
            </div>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ------------------------------------------------------------- */
    /* TOP WARNING BANNER                                            */
    /* ------------------------------------------------------------- */
    .session-top-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1045;
      background: linear-gradient(90deg, #2a1b04 0%, #1e1505 50%, #2a1804 100%);
      border-bottom: 1px solid rgba(245, 158, 11, 0.4);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.2);
      animation: bannerSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: background 0.3s ease, border-color 0.3s ease;
    }

    .session-top-banner.urgent {
      background: linear-gradient(90deg, #3d0c0c 0%, #290808 50%, #3d0c0c 100%);
      border-bottom-color: rgba(239, 68, 68, 0.6);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3);
    }

    .banner-content {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0.55rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .banner-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .banner-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fbbf24;
      animation: pulseAlert 2s infinite ease-in-out;
    }

    .session-top-banner.urgent .banner-icon {
      color: #f87171;
    }

    .banner-text {
      font-size: 0.88rem;
      color: #fef3c7;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .session-top-banner.urgent .banner-text {
      color: #fee2e2;
    }

    .banner-text strong {
      font-weight: 700;
    }

    .banner-actions {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .btn-extend {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      color: #fff;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 0.38rem 0.95rem;
      border: 1px solid rgba(251, 191, 36, 0.5);
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
      transition: all 0.16s ease;
    }

    .btn-extend:hover {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 3px 12px rgba(245, 158, 11, 0.5);
      transform: translateY(-1px);
    }

    .btn-signout {
      background: transparent;
      color: #cbd5e1;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.38rem 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-signout:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .banner-progress-track {
      height: 3px;
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }

    .banner-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      transition: width 1s linear;
    }

    .banner-progress-bar.urgent {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    /* ------------------------------------------------------------- */
    /* MODAL POP-UP                                                  */
    /* ------------------------------------------------------------- */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 15, 0.82);
      backdrop-filter: blur(8px);
      z-index: 1090;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      animation: modalFadeIn 0.18s ease-out;
    }

    .timeout-modal {
      background: #0d1322;
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 14px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.2);
      overflow: hidden;
      animation: modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1.2rem 1.4rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);
      position: relative;
    }

    .header-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-icon-box.urgent {
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 700;
      color: #fff;
    }

    .modal-sub {
      margin: 0.15rem 0 0;
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1.1rem;
      background: none;
      border: none;
      font-size: 1.4rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }

    .modal-body {
      padding: 1.4rem;
    }

    .countdown-hero {
      text-align: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      margin-bottom: 1.15rem;
    }

    .countdown-label {
      font-size: 0.8rem;
      color: #94a3b8;
      display: block;
      margin-bottom: 0.35rem;
    }

    .countdown-digits {
      font-size: 2.75rem;
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 0.06em;
      color: #fbbf24;
      line-height: 1;
      text-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
      transition: color 0.3s ease;
    }

    .countdown-digits.urgent {
      color: #f87171;
      text-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
      animation: urgentPulse 1s infinite alternate;
    }

    .modal-progress-container {
      margin-bottom: 1.15rem;
    }

    .modal-progress-track {
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 0.35rem;
    }

    .modal-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      border-radius: 999px;
      transition: width 1s linear;
    }

    .modal-progress-fill.urgent {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #64748b;
    }

    .modal-desc {
      font-size: 0.86rem;
      color: #cbd5e1;
      line-height: 1.45;
      margin: 0 0 1.25rem;
    }

    .config-timeout-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0.9rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      gap: 0.75rem;
    }

    .config-label {
      font-size: 0.78rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .timeout-pills {
      display: flex;
      gap: 0.35rem;
    }

    .pill-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.22rem 0.55rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pill-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .pill-btn.active {
      background: rgba(245, 158, 11, 0.2);
      border-color: rgba(245, 158, 11, 0.6);
      color: #fbbf24;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.4rem;
      background: rgba(0, 0, 0, 0.25);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      gap: 0.75rem;
    }

    .footer-left {
      display: flex;
      align-items: center;
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .btn-primary-glow {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      color: #fff;
      border: 1px solid rgba(251, 191, 36, 0.5);
      padding: 0.55rem 1.25rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4);
      transition: all 0.16s ease;
    }

    .btn-primary-glow:hover {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 6px 18px rgba(245, 158, 11, 0.55);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-ghost {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      transition: color 0.15s ease;
    }

    .btn-ghost:hover {
      color: #f87171;
    }

    /* ------------------------------------------------------------- */
    /* KEYFRAMES                                                     */
    /* ------------------------------------------------------------- */
    @keyframes bannerSlideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }

    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalScaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes pulseAlert {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.08); }
    }

    @keyframes urgentPulse {
      0% { opacity: 1; }
      100% { opacity: 0.75; }
    }
  `]
})
export class SessionTimeoutComponent {
  readonly sessionTimeout = inject(SessionTimeoutService);
  readonly auth = inject(AuthService);

  readonly availableTimeouts = [15, 30, 60, 120];

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.sessionTimeout.showWarningModal() && event.key === 'Enter') {
      this.sessionTimeout.extendSession();
    } else if (this.sessionTimeout.showWarningModal() && event.key === 'Escape') {
      this.sessionTimeout.dismissModal();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.sessionTimeout.dismissModal();
    }
  }
}

