import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { StatusService } from './status.service';

export const SESSION_TIMEOUT_STORAGE_KEY = 'animstudio_session_timeout_min';
export const SESSION_WARNING_STORAGE_KEY = 'animstudio_session_warning_min';

export const DEFAULT_TIMEOUT_MINUTES = 120;
export const DEFAULT_WARNING_MINUTES = 2;
const ACTIVITY_THROTTLE_MS = 3000;
const SLIDING_TOKEN_REFRESH_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes before token expires

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly status = inject(StatusService);

  readonly timeoutMinutes = signal<number>(this.loadTimeoutMinutes());
  readonly warningMinutes = signal<number>(this.loadWarningMinutes());

  readonly remainingSeconds = signal<number>(this.timeoutMinutes() * 60);
  readonly isWarning = signal<boolean>(false);
  readonly showWarningModal = signal<boolean>(false);

  private lastActivityTime = Date.now();
  private lastRecordedTime = 0;
  private timerInterval: any = null;
  private isRefreshingToken = false;
  private wasAuthenticated = false;

  readonly isUrgent = computed(() => this.isWarning() && this.remainingSeconds() <= 30);

  /** Percentage of warning duration remaining (0-100%) */
  readonly progressPercent = computed(() => {
    const totalWarningSecs = this.warningMinutes() * 60;
    if (totalWarningSecs <= 0) return 0;
    const remaining = this.remainingSeconds();
    const pct = (remaining / totalWarningSecs) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  });

  /** Formatted as MM:SS */
  readonly formattedRemaining = computed(() => {
    const s = Math.max(0, this.remainingSeconds());
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.wasAuthenticated = true;
        this.resetTimer();
      } else {
        this.wasAuthenticated = false;
      }
    });
    this.initActivityListeners();
    this.startTimer();
  }

  /**
   * Records user activity (mouse movement, clicks, typing, scrolling, touches).
   * Resets the inactivity timer so active users never expire.
   */
  recordActivity(): void {
    const now = Date.now();
    if (now - this.lastRecordedTime < ACTIVITY_THROTTLE_MS) {
      return;
    }
    this.lastRecordedTime = now;

    if (!this.auth.isAuthenticated()) {
      return;
    }

    this.lastActivityTime = now;
    this.remainingSeconds.set(this.timeoutMinutes() * 60);
    this.isWarning.set(false);
    this.showWarningModal.set(false);

    // Proactively refresh token if user is actively working and token is nearing expiry
    this.checkSlidingTokenRefresh(now);
  }

  /**
   * Explicitly extends the session, resetting timeout and refreshing auth credentials.
   */
  extendSession(): void {
    const now = Date.now();
    this.lastActivityTime = now;
    this.remainingSeconds.set(this.timeoutMinutes() * 60);
    this.isWarning.set(false);
    this.showWarningModal.set(false);

    // Call backend/IdP token refresh to ensure server-side session survives
    this.auth.refreshSession().subscribe({
      next: () => {
        this.status.showNotice(`Session extended for another ${this.timeoutMinutes()} minutes.`);
      },
      error: () => {
        // If refresh fails, try system session check
        this.auth.fetchSystemSession().subscribe();
        this.status.showNotice('Session refreshed.');
      },
    });
  }

  /**
   * Dismisses the modal popup while keeping the top warning bar visible.
   */
  dismissModal(): void {
    this.showWarningModal.set(false);
  }

  /**
   * Signs the user out immediately.
   */
  signOut(): void {
    this.isWarning.set(false);
    this.showWarningModal.set(false);
    this.auth.signOut();
  }

  /**
   * Updates configurable timeout minutes.
   */
  setTimeoutMinutes(minutes: number): void {
    const valid = Math.max(5, Math.min(240, Math.round(minutes)));
    this.timeoutMinutes.set(valid);
    try {
      localStorage.setItem(SESSION_TIMEOUT_STORAGE_KEY, valid.toString());
    } catch {
      // Storage unavailable
    }
    this.resetTimer();
  }

  /**
   * Updates configurable warning window minutes.
   */
  setWarningMinutes(minutes: number): void {
    const valid = Math.max(1, Math.min(15, Math.round(minutes)));
    this.warningMinutes.set(valid);
    try {
      localStorage.setItem(SESSION_WARNING_STORAGE_KEY, valid.toString());
    } catch {
      // Storage unavailable
    }
  }

  private resetTimer(): void {
    this.lastActivityTime = Date.now();
    this.remainingSeconds.set(this.timeoutMinutes() * 60);
    this.isWarning.set(false);
    this.showWarningModal.set(false);
  }

  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private tick(): void {
    if (!this.auth.isAuthenticated()) {
      this.wasAuthenticated = false;
      if (this.isWarning()) this.isWarning.set(false);
      if (this.showWarningModal()) this.showWarningModal.set(false);
      return;
    }

    // A fresh sign-in must start a full window. Otherwise inactivity accrued as a guest
    // (the page sat open before login) would expire the new session on the first tick.
    if (!this.wasAuthenticated) {
      this.wasAuthenticated = true;
      this.resetTimer();
      return;
    }

    const now = Date.now();
    const elapsedSecs = (now - this.lastActivityTime) / 1000;
    const totalSecs = this.timeoutMinutes() * 60;
    const remaining = Math.max(0, Math.round(totalSecs - elapsedSecs));

    this.remainingSeconds.set(remaining);

    const warningThresholdSecs = this.warningMinutes() * 60;

    if (remaining <= warningThresholdSecs && remaining > 0) {
      if (!this.isWarning()) {
        this.isWarning.set(true);
        this.showWarningModal.set(true);
      }
    } else if (remaining > warningThresholdSecs) {
      if (this.isWarning()) {
        this.isWarning.set(false);
        this.showWarningModal.set(false);
      }
    }

    if (remaining <= 0) {
      this.handleSessionExpired();
    }
  }

  private handleSessionExpired(): void {
    this.isWarning.set(false);
    this.showWarningModal.set(false);
    this.remainingSeconds.set(0);

    this.auth.signOut();
    this.status.showNotice('Your session expired due to inactivity. Please sign in again.');
    this.auth.openAuthModal();
  }

  private checkSlidingTokenRefresh(now: number): void {
    if (this.isRefreshingToken) return;

    const token = this.auth.accessToken();
    if (!token) return;

    const expiryMs = this.auth.getTokenExpiryMs(token);
    if (!expiryMs) return;

    // If active and token will expire within SLIDING_TOKEN_REFRESH_THRESHOLD_MS, refresh silently
    if (expiryMs - now <= SLIDING_TOKEN_REFRESH_THRESHOLD_MS && expiryMs > now) {
      this.isRefreshingToken = true;
      this.auth.refreshSession().subscribe({
        next: () => {
          this.isRefreshingToken = false;
        },
        error: () => {
          this.isRefreshingToken = false;
        },
      });
    }
  }

  private initActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    const handler = () => this.recordActivity();

    for (const evt of events) {
      window.addEventListener(evt, handler, { passive: true });
    }
  }

  private loadTimeoutMinutes(): number {
    try {
      const stored = localStorage.getItem(SESSION_TIMEOUT_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= 5 && val <= 240) {
          return val;
        }
      }
    } catch {
      // Storage unavailable
    }
    return DEFAULT_TIMEOUT_MINUTES;
  }

  private loadWarningMinutes(): number {
    try {
      const stored = localStorage.getItem(SESSION_WARNING_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= 1 && val <= 15) {
          return val;
        }
      }
    } catch {
      // Storage unavailable
    }
    return DEFAULT_WARNING_MINUTES;
  }
}
