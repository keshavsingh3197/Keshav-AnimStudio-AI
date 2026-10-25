import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { StatusService } from '../core/services/status.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (auth.isAuthModalOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-dialog">
          <header class="modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">SSO</span>
              <h3>Sign in to AnimStudio AI</h3>
            </div>
            <button type="button" class="close-btn" (click)="auth.closeAuthModal()" aria-label="Close">
              &times;
            </button>
          </header>

          <div class="modal-body">
            @if (errorMessage()) {
              <div class="alert alert-error">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            @if (twoFactorRequired()) {
              <form (ngSubmit)="submitTwoFactor()">
                <p class="form-hint">Two-Factor Authentication is enabled on this account. Enter the 6-digit code from your authenticator app.</p>
                <div class="form-field">
                  <label for="twoFactorCode">Verification Code</label>
                  <input
                    id="twoFactorCode"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="8"
                    placeholder="000000"
                    [(ngModel)]="twoFactorCode"
                    name="twoFactorCode"
                    required
                    autofocus
                  />
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="resetForm()">Back</button>
                  <button type="submit" class="btn btn-primary" [disabled]="loading()">
                    @if (loading()) {
                      <span class="spinner"></span> Verifying...
                    } @else {
                      Verify & Sign In
                    }
                  </button>
                </div>
              </form>
            } @else {
              <form (ngSubmit)="submitLogin()">
                <div class="form-field">
                  <label for="email">Email or Username</label>
                  <input
                    id="email"
                    type="text"
                    autocomplete="username"
                    placeholder="you@keshavsingh.in"
                    [(ngModel)]="email"
                    name="email"
                    required
                  />
                </div>

                <div class="form-field">
                  <label for="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="••••••••••••"
                    [(ngModel)]="password"
                    name="password"
                    required
                  />
                </div>

                <div class="info-callout">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>
                    Powered by Keshav Singh Central SSO (<code>id.keshavsingh.in</code>). Accounts registered here are securely scoped to AnimStudio.
                  </span>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="auth.closeAuthModal()">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="loading() || !email || !password">
                    @if (loading()) {
                      <span class="spinner"></span> Signing in...
                    } @else {
                      Sign In
                    }
                  </button>
                </div>
              </form>
            }
          </div>

          <footer class="modal-footer">
            <span class="footer-note">Need an account?</span>
            <a [href]="registerUrl" target="_blank" rel="noopener noreferrer" class="link-register">
              Create Keshav Identity Account &rarr;
            </a>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 8, 16, 0.78);
      backdrop-filter: blur(8px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-dialog {
      background: #0f1524;
      border: 1px solid rgba(108, 140, 255, 0.25);
      border-radius: 14px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(108, 140, 255, 0.15);
      overflow: hidden;
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.15rem 1.4rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);
    }

    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .modal-title-group h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }

    .modal-badge {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      background: rgba(108, 140, 255, 0.2);
      border: 1px solid rgba(108, 140, 255, 0.4);
      color: #8bb0ff;
      border-radius: 4px;
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--muted, #8a99ad);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.2rem;
      transition: color 0.15s ease;
    }

    .close-btn:hover {
      color: #fff;
    }

    .modal-body {
      padding: 1.4rem;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      font-size: 0.84rem;
      margin-bottom: 1.1rem;
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
    }

    .form-hint {
      font-size: 0.84rem;
      color: #94a3b8;
      margin: 0 0 1.1rem;
      line-height: 1.45;
    }

    .form-field {
      margin-bottom: 1.15rem;
    }

    .form-field label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.4rem;
    }

    .form-field input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(0, 0, 0, 0.35);
      color: #fff;
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .form-field input:focus {
      border-color: #6c8cff;
      box-shadow: 0 0 0 3px rgba(108, 140, 255, 0.25);
    }

    .info-callout {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      font-size: 0.76rem;
      color: #94a3b8;
      background: rgba(108, 140, 255, 0.06);
      border: 1px solid rgba(108, 140, 255, 0.15);
      border-radius: 8px;
      padding: 0.65rem 0.8rem;
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }

    .info-callout code {
      color: #8bb0ff;
      background: rgba(0, 0, 0, 0.25);
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.65rem;
      margin-top: 1.25rem;
    }

    .btn {
      padding: 0.55rem 1.05rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .btn-primary {
      background: #3b82f6;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #4338ca 0%, #2563eb 100%);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45);
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.4rem;
      background: rgba(0, 0, 0, 0.25);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.78rem;
    }

    .footer-note {
      color: #64748b;
    }

    .link-register {
      color: #8bb0ff;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s ease;
    }

    .link-register:hover {
      color: #c7d2fe;
      text-decoration: underline;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class LoginModalComponent {
  readonly auth = inject(AuthService);
  private readonly status = inject(StatusService);

  email = '';
  password = '';
  twoFactorCode = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  twoFactorRequired = signal(false);
  twoFactorToken = signal<string | null>(null);

  readonly registerUrl = `${environment.adminUrl}/register?app=studio`;

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.auth.closeAuthModal();
    }
  }

  resetForm() {
    this.twoFactorRequired.set(false);
    this.twoFactorToken.set(null);
    this.twoFactorCode = '';
    this.errorMessage.set(null);
  }

  submitLogin() {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.twoFactorRequired) {
          this.twoFactorRequired.set(true);
          this.twoFactorToken.set(res.twoFactorToken ?? null);
        } else if (res.success) {
          this.status.showNotice(`Welcome back, ${res.user?.displayName || res.user?.email || 'User'}!`);
          this.resetForm();
          this.email = '';
          this.password = '';
        } else {
          this.errorMessage.set(res.error || 'Invalid email or password.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.message || 'Failed to sign in.');
      },
    });
  }

  submitTwoFactor() {
    const code = this.twoFactorCode.trim();
    const token = this.twoFactorToken();
    if (!code) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const req$ = token
      ? this.auth.verifyTwoFactor({ twoFactorToken: token, code, method: 0 })
      : this.auth.login({
          email: this.email,
          password: this.password,
          twoFactorCode: code,
          twoFactorToken: token ?? undefined,
        });

    req$.subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.status.showNotice(`Welcome back, ${res.user?.displayName || 'User'}!`);
          this.resetForm();
          this.email = '';
          this.password = '';
        } else {
          this.errorMessage.set(res.error || 'Invalid verification code.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.message || 'Verification failed.');
      },
    });
  }
}

