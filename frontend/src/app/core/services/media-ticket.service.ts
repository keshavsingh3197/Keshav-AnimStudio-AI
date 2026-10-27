import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { AuthService } from './auth.service';

const TICKET_KEY = 'animstudio_media_ticket';

/** Renewed this long before it expires, so a URL handed to the page never goes stale while shown. */
const RENEW_BEFORE_MS = 20 * 60 * 1000;

interface StoredTicket {
  ticket: string;
  expiresAt: number;
  userId: string;
}

/**
 * Keeps a short-lived media ticket for the signed-in user and appends it to media URLs.
 *
 * A browser never sends the Authorization header for an <img>, <video> or <audio> source or
 * a download link, so those requests reach the API anonymous and fail its ownership check.
 * The API accepts `?mt=<ticket>` - only on its media endpoints - as the same identity.
 *
 * `ticket` is a signal, so any template that builds a URL through {@link sign} re-renders
 * when the ticket arrives or is renewed.
 */
@Injectable({ providedIn: 'root' })
export class MediaTicketService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = environment.apiUrl;

  private readonly current = signal<StoredTicket | null>(this.restore());
  readonly ticket = () => this.current()?.ticket ?? null;

  private inFlight$: Observable<boolean> | null = null;
  private renewTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const token = this.auth.accessToken();
      const userId = this.auth.user()?.userId ?? null;
      untracked(() => {
        if (!token || !userId) {
          this.clear();
          return;
        }
        if (!this.isUsable(this.current(), userId)) {
          this.ensure().subscribe();
        } else {
          this.scheduleRenewal(this.current()!);
        }
      });
    });
  }

  /** Appends the ticket to an API media URL. Anything else, or no ticket, is returned unchanged. */
  sign(url: string): string;
  sign(url: string | null | undefined): string | null | undefined;
  sign(url: string | null | undefined): string | null | undefined {
    const t = this.ticket();
    if (!url || !t || !this.isApiUrl(url) || /[?&]mt=/.test(url)) return url;
    const absolute = url.startsWith('/api/') ? `${this.base}${url}` : url;
    return `${absolute}${absolute.includes('?') ? '&' : '?'}mt=${encodeURIComponent(t)}`;
  }

  /**
   * Fetches a ticket unless a usable one is held. Resolves to whether one is held afterwards;
   * never errors, so it is safe to await during start-up.
   */
  ensure(renew = false): Observable<boolean> {
    const userId = this.auth.user()?.userId ?? null;
    if (!this.auth.accessToken() || !userId) return of(false);
    if (!renew && this.isUsable(this.current(), userId)) return of(true);
    if (this.inFlight$) return this.inFlight$;

    this.inFlight$ = this.http
      .post<ApiResponse<{ ticket: string; expiresAt: string }>>(`${this.base}/api/auth/media-ticket`, {})
      .pipe(
        timeout(8000),
        map((r) => {
          const data = r.data;
          const expiresAt = data ? Date.parse(data.expiresAt) : NaN;
          if (!data?.ticket || Number.isNaN(expiresAt)) return false;
          this.store({ ticket: data.ticket, expiresAt, userId });
          return true;
        }),
        catchError(() => of(false)),
        finalize(() => (this.inFlight$ = null)),
        shareReplay(1),
      );

    return this.inFlight$;
  }

  clear(): void {
    if (this.renewTimer) {
      clearTimeout(this.renewTimer);
      this.renewTimer = null;
    }
    this.current.set(null);
    try {
      sessionStorage.removeItem(TICKET_KEY);
    } catch {
      // Storage blocked: nothing persisted to remove
    }
  }

  private store(t: StoredTicket): void {
    this.current.set(t);
    try {
      sessionStorage.setItem(TICKET_KEY, JSON.stringify(t));
    } catch {
      // Storage blocked: the ticket still works for this page's lifetime
    }
    this.scheduleRenewal(t);
  }

  private scheduleRenewal(t: StoredTicket): void {
    if (this.renewTimer) clearTimeout(this.renewTimer);
    const inMs = Math.max(5000, t.expiresAt - Date.now() - RENEW_BEFORE_MS);
    this.renewTimer = setTimeout(() => {
      this.renewTimer = null;
      // The old ticket stays in use until the new one arrives, so no URL is ever unsigned.
      this.ensure(true).subscribe();
    }, inMs);
  }

  private isUsable(t: StoredTicket | null, userId: string): boolean {
    return !!t && t.userId === userId && t.expiresAt - Date.now() > RENEW_BEFORE_MS / 2;
  }

  private isApiUrl(url: string): boolean {
    return url.startsWith('/api/') || (!!this.base && url.startsWith(`${this.base}/api/`));
  }

  private restore(): StoredTicket | null {
    try {
      const raw = sessionStorage.getItem(TICKET_KEY);
      if (!raw) return null;
      const t = JSON.parse(raw) as StoredTicket;
      return t?.ticket && t.expiresAt > Date.now() && t.userId ? t : null;
    } catch {
      return null;
    }
  }
}
