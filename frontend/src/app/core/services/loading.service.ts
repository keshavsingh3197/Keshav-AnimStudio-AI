import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

/** Delay before showing the cold-start wakeup banner so fast requests never flash it. */
const WAKEUP_DELAY_MS = 2200;

/**
 * Unified application loading coordinator (zoneless-safe via signals).
 *
 * Tracks active foreground HTTP requests and Angular router navigations, and surfaces a
 * gentle wakeup hint when cold-started backend / DB services take more than ~2.2 seconds.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _httpCount = signal(0);
  private readonly _navigating = signal(false);
  private readonly _slow = signal(false);
  private readonly _dismissed = signal(false);
  private readonly _elapsedSec = signal(0);

  private slowTimer: ReturnType<typeof setTimeout> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private activeSince = 0;

  /** True whenever any foreground HTTP call or lazy route load is in progress. */
  readonly active = computed(() => this._httpCount() > 0 || this._navigating());
  readonly httpActive = computed(() => this._httpCount() > 0);
  readonly navigating = this._navigating.asReadonly();
  readonly slow = computed(() => this._slow() && !this._dismissed() && this.active());
  readonly elapsedSec = this._elapsedSec.asReadonly();

  constructor() {
    const sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.setNavigating(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.setNavigating(false);
      }
    });
    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
      this.clearTimers();
    });
  }

  beginHttp(): void {
    this._httpCount.update((c) => c + 1);
    this.syncTimers();
  }

  endHttp(): void {
    this._httpCount.update((c) => Math.max(0, c - 1));
    this.syncTimers();
  }

  setNavigating(isNavigating: boolean): void {
    if (this._navigating() === isNavigating) return;
    this._navigating.set(isNavigating);
    this.syncTimers();
  }

  dismissSlow(): void {
    this._dismissed.set(true);
  }

  private syncTimers(): void {
    if (this.active()) {
      if (!this.activeSince) {
        this.activeSince = Date.now();
        this._dismissed.set(false);
        this._elapsedSec.set(0);
      }
      if (!this.slowTimer) {
        this.slowTimer = setTimeout(() => {
          this.slowTimer = null;
          if (!this.active()) return;
          this._slow.set(true);
          this._elapsedSec.set(Math.max(2, Math.floor((Date.now() - this.activeSince) / 1000)));
          if (!this.tickTimer) {
            this.tickTimer = setInterval(() => {
              if (!this.active()) {
                this.clearTimers();
                return;
              }
              this._elapsedSec.set(Math.max(2, Math.floor((Date.now() - this.activeSince) / 1000)));
            }, 1000);
          }
        }, WAKEUP_DELAY_MS);
      }
    } else {
      this.clearTimers();
      this.activeSince = 0;
      this._slow.set(false);
      this._dismissed.set(false);
      this._elapsedSec.set(0);
    }
  }

  private clearTimers(): void {
    if (this.slowTimer !== null) {
      clearTimeout(this.slowTimer);
      this.slowTimer = null;
    }
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }
}
