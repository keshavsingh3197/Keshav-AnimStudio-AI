import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, firstValueFrom, of } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { SignupService } from '../core/services/signup.service';
import { StatusService } from '../core/services/status.service';
import { environment } from '../../environments/environment';
import { createPasskeyErrorMessage, getPasskeyAssertion, isPasskeySupported, ServerCredentialOptions } from '../core/services/webauthn';

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
              <h3>{{ mode() === 'signin' ? 'Sign in to AnimStudio AI' : 'Request AnimStudio access' }}</h3>
            </div>
            <button type="button" class="close-btn" (click)="auth.closeAuthModal()" aria-label="Close">
              &times;
            </button>
          </header>

          <div class="modal-body">
            @if (errorMessage()) {
              <div class="alert alert-error" role="alert">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            @if (mode() === 'sent') {
              <div class="request-sent" role="status">
                <div class="request-sent-icon" aria-hidden="true">✓</div>
                <h4>Request sent</h4>
                <p>{{ sentMessage() }}</p>
                <p class="field-hint">Nothing else is needed from you. Come back and sign in with the email and password you chose once an administrator has approved it.</p>
                <div class="modal-actions">
                  <button type="button" class="btn btn-primary" (click)="backToSignIn()">Back to sign in</button>
                </div>
              </div>
            } @else if (mode() === 'request') {
              <form (ngSubmit)="submitRequest()" autocomplete="on">
                <p class="form-hint">
                  Ask for an AnimStudio account. An administrator reviews every request; once approved you can sign in
                  here. The account works for AnimStudio only - it cannot be used to sign in anywhere else.
                </p>

                <div class="form-field">
                  <label for="rq-name">Your name</label>
                  <input id="rq-name" name="rq-name" type="text" autocomplete="name" maxlength="120" [(ngModel)]="reqName" required />
                </div>

                <div class="form-field">
                  <label for="rq-email">Email</label>
                  <input id="rq-email" name="rq-email" type="email" autocomplete="email" maxlength="256" placeholder="you@example.com" [(ngModel)]="reqEmail" required />
                </div>

                <div class="form-field">
                  <div class="form-label-row">
                    <label for="rq-password">Choose a password</label>
                    <button type="button" class="btn-text-link" (click)="showReqPassword.set(!showReqPassword())">{{ showReqPassword() ? 'Hide' : 'Show' }}</button>
                  </div>
                  <input id="rq-password" name="rq-password" [type]="showReqPassword() ? 'text' : 'password'" autocomplete="new-password"
                         maxlength="256" [(ngModel)]="reqPassword" required />
                  <div class="strength" aria-hidden="true"><span [style.width.%]="passwordStrength().percent" [class]="passwordStrength().tone"></span></div>
                  <span class="field-hint" [class.hint-ok]="passwordStrength().ok">{{ passwordStrength().text }}</span>
                </div>

                <div class="form-field">
                  <label for="rq-confirm">Repeat the password</label>
                  <input id="rq-confirm" name="rq-confirm" [type]="showReqPassword() ? 'text' : 'password'" autocomplete="new-password"
                         maxlength="256" [(ngModel)]="reqConfirm" required />
                  @if (reqConfirm && reqConfirm !== reqPassword) {
                    <span class="field-hint hint-bad">The two passwords don't match.</span>
                  }
                </div>

                <div class="form-field">
                  <label for="rq-reason">What will you make? <span class="optional">(optional)</span></label>
                  <textarea id="rq-reason" name="rq-reason" rows="2" maxlength="900" [(ngModel)]="reqReason"
                            placeholder="A line for the administrator reviewing your request"></textarea>
                </div>

                <!-- Hidden from people; only a script fills it in. -->
                <div class="hp" aria-hidden="true">
                  <label for="rq-website">Website</label>
                  <input id="rq-website" name="rq-website" type="text" tabindex="-1" autocomplete="off" [(ngModel)]="reqWebsite" />
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="backToSignIn()">Back</button>
                  <button type="submit" class="btn btn-primary" [disabled]="!canSubmitRequest() || loading()">
                    @if (loading()) {
                      <span class="spinner"></span> Sending...
                    } @else {
                      Send request
                    }
                  </button>
                </div>
              </form>
            } @else if (twoFactorRequired()) {
              <form (ngSubmit)="submitTwoFactor()">
                <p class="form-hint">
                  @if (isBackupMode()) {
                    Enter one of your 8-character emergency backup codes generated when 2FA was set up.
                  } @else {
                    Two-Factor Authentication is enabled on this account. Enter the 6-digit code from your authenticator app.
                  }
                </p>
                <div class="form-field">
                  <div class="form-label-row">
                    <label for="twoFactorCode">{{ isBackupMode() ? 'Backup Code' : 'Verification Code' }}</label>
                    <button type="button" class="btn-text-link" (click)="toggleBackupMode()">
                      {{ isBackupMode() ? 'Use Authenticator App' : 'Use a backup code' }}
                    </button>
                  </div>
                  <input
                    id="twoFactorCode"
                    type="text"
                    [placeholder]="isBackupMode() ? 'e.g. a1b2-c3d4' : '000000'"
                    [(ngModel)]="twoFactorCode"
                    name="twoFactorCode"
                    required
                    autofocus
                  />
                  <span class="field-hint">
                    @if (isBackupMode()) {
                      Backup codes are single-use emergency codes.
                    } @else {
                      Codes change every 30 seconds. If a code was already submitted or just rotated, wait for the next 30s code or sync your phone clock.
                    }
                  </span>
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
                    Use your Central SSO password here, not a device PIN or passkey. To use a passkey, choose the passkey button below.
                  </span>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="auth.closeAuthModal()">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="loading() || passkeyLoading() || !email || !password">
                    @if (loading()) {
                      <span class="spinner"></span> Signing in...
                    } @else {
                      Sign In
                    }
                  </button>
                </div>
              </form>

              @if (passkeySupported) {
                <div class="or-divider"><span>or</span></div>
                <button class="btn-passkey" type="button" [disabled]="loading() || passkeyLoading()"
                        (click)="signInWithPasskey()">
                  🔑 {{ passkeyLoading() ? 'Connecting to passkey…' : (isLocalhost ? 'Sign in with Passkey (Central SSO)' : 'Sign in with a passkey') }}
                </button>
              }
            }
          </div>

          @if (mode() === 'signin' && !twoFactorRequired()) {
            <footer class="modal-footer">
              @if (signupOpen()) {
                <span class="footer-note">New to AnimStudio?</span>
                <button type="button" class="link-register" (click)="startRequest()">Request access &rarr;</button>
              } @else {
                <span class="footer-note">Access requests are closed right now.</span>
              }
            </footer>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, var(--bg) 78%, transparent);
      backdrop-filter: blur(8px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-dialog {
      background: var(--surface);
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
      border-bottom: 1px solid var(--ov-3);
      background: var(--ov-1);
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
      color: var(--text);
    }

    .modal-badge {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      background: rgba(108, 140, 255, 0.2);
      border: 1px solid rgba(108, 140, 255, 0.4);
      color: var(--c-blue);
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
      color: var(--text);
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
      color: var(--c-red);
    }

    .form-hint {
      font-size: 0.84rem;
      color: var(--text-dim);
      margin: 0 0 1.1rem;
      line-height: 1.45;
    }

    .form-field {
      margin-bottom: 1.15rem;
    }

    .form-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }

    .form-label-row label {
      margin-bottom: 0;
    }

    .btn-text-link {
      background: none;
      border: none;
      color: var(--c-blue);
      font-size: 0.78rem;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      transition: color 0.15s ease;
    }

    .btn-text-link:hover {
      color: var(--text-dim);
    }

    .field-hint {
      display: block;
      font-size: 0.74rem;
      color: var(--text-dim);
      margin-top: 0.35rem;
      line-height: 1.35;
    }

    .form-field label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-dim);
      margin-bottom: 0.4rem;
    }

    .form-field input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--ov-4);
      background: var(--sunk-2);
      color: var(--text);
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
      color: var(--text-dim);
      background: rgba(108, 140, 255, 0.06);
      border: 1px solid rgba(108, 140, 255, 0.15);
      border-radius: 8px;
      padding: 0.65rem 0.8rem;
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }

    .info-callout code {
      color: var(--c-blue);
      background: var(--sunk-2);
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
      background: var(--ov-2);
      border-color: var(--ov-4);
      color: var(--text);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--ov-3);
      color: var(--text);
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
      border: 2px solid var(--ov-5);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.4rem;
      background: var(--sunk-2);
      border-top: 1px solid var(--ov-2);
      font-size: 0.78rem;
    }

    .footer-note {
      color: var(--muted);
    }

    .link-register {
      color: var(--c-blue);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s ease;
      background: none;
      border: 0;
      padding: 0;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      box-shadow: none;
    }

    .link-register:hover {
      color: var(--text-dim);
      text-decoration: underline;
      background: none;
      box-shadow: none;
      transform: none;
    }

    .form-field textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--ov-4);
      background: var(--sunk-2);
      color: var(--text);
      font: inherit;
      font-size: 0.9rem;
      min-height: 0;
      resize: vertical;
      outline: none;
    }

    .form-field textarea:focus {
      border-color: #6c8cff;
      box-shadow: 0 0 0 3px rgba(108, 140, 255, 0.25);
    }

    .optional { font-weight: 400; color: var(--muted); }

    .strength {
      height: 4px;
      margin-top: 0.45rem;
      border-radius: 99px;
      background: var(--ov-3);
      overflow: hidden;
    }

    .strength > span {
      display: block;
      height: 100%;
      border-radius: inherit;
      transition: width 0.2s ease;
    }

    .strength > span.weak { background: var(--err, #ef4444); }
    .strength > span.fair { background: var(--warn, #f59e0b); }
    .strength > span.strong { background: var(--ok, #22d36b); }
    .hint-ok { color: var(--ok, #22d36b); }
    .hint-bad { color: var(--err, #ef4444); }

    .request-sent { text-align: center; padding: 0.5rem 0.25rem 0.25rem; }
    .request-sent h4 { margin: 0.6rem 0 0.4rem; font-size: 1.05rem; color: var(--text); }
    .request-sent p { margin: 0 0 0.6rem; font-size: 0.88rem; color: var(--text-dim); line-height: 1.5; }
    .request-sent .modal-actions { justify-content: center; }
    .request-sent-icon {
      width: 3rem;
      height: 3rem;
      margin: 0 auto;
      display: grid;
      place-items: center;
      border-radius: 50%;
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--ok, #22d36b);
      background: rgba(34, 211, 107, 0.12);
      border: 1px solid rgba(34, 211, 107, 0.35);
    }

    /* The trap field: out of sight and out of reach for people. */
    .hp { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }

    .modal-body { max-height: calc(100vh - 11rem); overflow-y: auto; }

    .or-divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.15rem 0;
      color: var(--muted);
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .or-divider::before, .or-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--ov-3);
    }

    .btn-passkey {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text);
      background: var(--ov-1);
      border: 1px solid rgba(148, 163, 184, 0.2);
      cursor: pointer;
      transition: all 0.16s ease;
    }

    .btn-passkey:hover:not(:disabled) {
      background: rgba(108, 140, 255, 0.12);
      border-color: rgba(108, 140, 255, 0.45);
      color: var(--text-dim);
    }

    .btn-passkey:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
  private readonly signup = inject(SignupService);

  email = '';
  password = '';
  twoFactorCode = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  twoFactorRequired = signal(false);
  twoFactorToken = signal<string | null>(null);
  readonly isBackupMode = signal(false);

  // Asking for access (no account yet): an administrator approves it, and the account made
  // works for AnimStudio only.
  readonly mode = signal<'signin' | 'request' | 'sent'>('signin');
  readonly signupOpen = signal(false);
  readonly showReqPassword = signal(false);
  readonly sentMessage = signal('');
  reqName = '';
  reqEmail = '';
  reqPassword = '';
  reqConfirm = '';
  reqReason = '';
  reqWebsite = '';

  constructor() {
    // Ask whether requests are open each time the dialog opens, so closing them takes effect at once.
    effect(() => {
      if (!this.auth.isAuthModalOpen()) return;
      this.mode.set('signin');
      this.signup.status().pipe(catchError(() => of(false))).subscribe((open) => this.signupOpen.set(open));
    });
  }

  startRequest(): void {
    this.errorMessage.set(null);
    this.mode.set('request');
  }

  backToSignIn(): void {
    this.errorMessage.set(null);
    this.mode.set('signin');
  }

  /** What the password still needs, as the server will judge it (twelve characters or more, not guessable). */
  passwordStrength(): { percent: number; tone: string; text: string; ok: boolean } {
    const p = this.reqPassword;
    if (!p) return { percent: 0, tone: 'weak', text: 'Use at least 12 characters - a few words together work well.', ok: false };
    const local = this.reqEmail.split('@')[0]?.toLowerCase() ?? '';
    const name = this.reqName.trim().toLowerCase();
    const lower = p.toLowerCase();
    if (p.length < 12) return { percent: Math.max(8, (p.length / 12) * 45), tone: 'weak', text: `${12 - p.length} more character${12 - p.length === 1 ? '' : 's'} needed.`, ok: false };
    if (new Set(p).size < 5) return { percent: 30, tone: 'weak', text: 'Too repetitive. Mix it up.', ok: false };
    if ((local.length >= 4 && lower.includes(local)) || (name.length >= 4 && lower.includes(name))) {
      return { percent: 40, tone: 'weak', text: "Don't include your name or email in the password.", ok: false };
    }
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
    const percent = Math.min(100, 55 + kinds * 10 + Math.min(15, p.length - 12));
    return { percent, tone: kinds >= 3 || p.length >= 16 ? 'strong' : 'fair', text: kinds >= 3 || p.length >= 16 ? 'Good password.' : 'Fine - longer or more varied is stronger.', ok: true };
  }

  canSubmitRequest(): boolean {
    return this.reqName.trim().length >= 2
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.reqEmail.trim())
      && this.passwordStrength().ok
      && this.reqPassword === this.reqConfirm;
  }

  submitRequest(): void {
    if (!this.canSubmitRequest() || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.signup.request({
      email: this.reqEmail.trim(),
      displayName: this.reqName.trim(),
      password: this.reqPassword,
      reason: this.reqReason.trim() || undefined,
      website: this.reqWebsite,
    }).subscribe({
      next: (receipt) => {
        this.loading.set(false);
        this.sentMessage.set(receipt.message);
        this.reqPassword = '';
        this.reqConfirm = '';
        this.mode.set('sent');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.message || 'The request could not be sent.');
      },
    });
  }

  readonly isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  readonly passkeySupported = isPasskeySupported();
  readonly passkeyLoading = signal(false);

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.auth.closeAuthModal();
    }
  }

  toggleBackupMode() {
    this.isBackupMode.update((v) => !v);
    this.twoFactorCode = '';
    this.errorMessage.set(null);
  }

  resetForm() {
    this.twoFactorRequired.set(false);
    this.twoFactorToken.set(null);
    this.twoFactorCode = '';
    this.isBackupMode.set(false);
    this.errorMessage.set(null);
  }

  submitLogin() {
    if (this.loading() || this.passkeyLoading() || !this.email || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.twoFactorRequired) {
          this.twoFactorRequired.set(true);
          this.twoFactorToken.set(res.twoFactorToken ?? null);
        } else if (res.requiresSessionConfirmation && res.sessionConfirmationTicket) {
          this.loading.set(true);
          this.auth.confirmSession(res.sessionConfirmationTicket).subscribe({
            next: (cRes) => {
              this.loading.set(false);
              if (cRes.success) {
                this.status.showNotice(`Welcome back, ${cRes.user?.displayName || cRes.user?.email || 'User'}!`);
                this.resetForm();
                this.email = '';
                this.password = '';
                this.auth.closeAuthModal();
              } else {
                this.errorMessage.set(cRes.error || 'Failed to establish session.');
              }
            },
            error: (err) => {
              this.loading.set(false);
              this.errorMessage.set(err?.message || 'Failed to confirm session.');
            },
          });
        } else if (res.success) {
          this.status.showNotice(`Welcome back, ${res.user?.displayName || res.user?.email || 'User'}!`);
          this.resetForm();
          this.email = '';
          this.password = '';
          this.auth.closeAuthModal();
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
    if (this.loading() || this.passkeyLoading() || !code) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const isBackup = this.isBackupMode() || code.length === 8 || code.includes('-') || /[a-zA-Z]/.test(code);
    const method = isBackup ? 2 : 0;

    const req$ = token
      ? this.auth.verifyTwoFactor({ twoFactorToken: token, code, method })
      : this.auth.login({
          email: this.email,
          password: this.password,
          twoFactorCode: code,
          twoFactorToken: token ?? undefined,
          recoveryCode: isBackup ? code : undefined,
        });

    req$.subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.status.showNotice(`Welcome back, ${res.user?.displayName || 'User'}!`);
          this.resetForm();
          this.email = '';
          this.password = '';
          this.auth.closeAuthModal();
        } else if (res.requiresSessionConfirmation && res.sessionConfirmationTicket) {
          this.loading.set(true);
          this.auth.confirmSession(res.sessionConfirmationTicket).subscribe({
            next: (cRes) => {
              this.loading.set(false);
              if (cRes.success) {
                this.status.showNotice(`Welcome back, ${cRes.user?.displayName || 'User'}!`);
                this.resetForm();
                this.email = '';
                this.password = '';
                this.auth.closeAuthModal();
              } else {
                this.errorMessage.set(cRes.error || 'Failed to establish session.');
              }
            },
            error: (err) => {
              this.loading.set(false);
              this.errorMessage.set(err?.message || 'Failed to confirm session.');
            },
          });
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

  buildCentralSsoUrl(mode: 'passkey' | 'standard' = 'passkey'): string {
    const callback = typeof window !== 'undefined'
      ? new URL(window.location.href)
      : new URL('http://localhost/');
    if (mode === 'passkey') {
      callback.searchParams.set('login', 'success');
    }
    const returnUrl = callback.toString();
    const target = new URL(`${environment.adminUrl}/login`);
    target.searchParams.set('app', 'studio');
    target.searchParams.set('returnUrl', returnUrl);
    target.searchParams.set('redirect', returnUrl);
    target.searchParams.set('redirect_uri', returnUrl);
    target.searchParams.set('return_url', returnUrl);
    if (mode === 'passkey') {
      target.searchParams.set('mode', 'passkey');
      target.searchParams.set('auth_mode', 'passkey');
    }
    return target.toString();
  }

  openPasskeyPopup(): void {
    const ssoUrl = this.buildCentralSsoUrl('passkey');
    const popup = window.open(ssoUrl, '_blank');
    if (!popup) {
      this.errorMessage.set('Your browser blocked the Central SSO window. Allow pop-ups for AnimStudio and try again.');
      return;
    }
    try {
      sessionStorage.setItem('animstudio_passkey_pending', 'true');
    } catch {}
    popup.opener = null;
    this.status.showNotice('Complete passkey sign-in in the Central SSO tab. AnimStudio will stay open and update when you return.');
  }

  async signInWithPasskey(): Promise<void> {
    this.errorMessage.set(null);

    // Localhost cannot use passkeys registered for the Central SSO relying-party domain.
    if (this.isLocalhost) {
      this.passkeyLoading.set(true);
      this.openPasskeyPopup();
      this.passkeyLoading.set(false);
      return;
    }

    this.passkeyLoading.set(true);
    try {
      const begin = await firstValueFrom(this.auth.passkeyLoginBegin());
      const assertion = await getPasskeyAssertion(begin.options as unknown as ServerCredentialOptions);
      const res = await firstValueFrom(this.auth.passkeyLoginComplete(begin.handle, assertion));
      if (res.success) {
        this.status.showNotice(`Welcome back, ${res.user?.displayName || res.user?.email || 'User'}!`);
        this.resetForm();
        this.email = '';
        this.password = '';
        this.auth.closeAuthModal();
      } else {
        this.errorMessage.set(res.error || 'Passkey sign-in failed.');
      }
    } catch (err: any) {
      if (err?.name === 'SecurityError') {
        this.openPasskeyPopup();
        return;
      }
      this.errorMessage.set(createPasskeyErrorMessage(err, 'Passkey sign-in failed.'));
    } finally {
      this.passkeyLoading.set(false);
    }
  }
}
