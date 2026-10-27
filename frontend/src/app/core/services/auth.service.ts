import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { StatusService } from './status.service';
import {
  AnonymousAccessPolicy,
  LoginCredentials,
  LoginResult,
  StudioSession,
  StudioUser,
  TwoFactorVerifyCredentials,
} from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'animstudio_access_token';
const USER_KEY = 'animstudio_user';
const GUEST_ID_KEY = 'animstudio_guest_id';

const DEFAULT_ANONYMOUS_POLICY: AnonymousAccessPolicy = {
  enabled: true,
  allowRender: true,
  maxRenderDurationSeconds: 60,
  maxAiCallsPerDay: 5,
  allowYouTubePublish: false,
  allowCloudSave: false,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly status = inject(StatusService);
  private readonly base = environment.apiUrl;

  readonly accessToken = signal<string | null>(this.getStoredAccessToken());
  readonly user = signal<StudioUser | null>(this.getStoredUser());
  readonly session = signal<StudioSession | null>(null);
  readonly guestId = signal<string>(this.getOrCreateGuestId());
  readonly isAuthModalOpen = signal<boolean>(false);

  readonly isAuthenticated = computed(() => {
    const u = this.user();
    return !!u && u.isAuthenticated && !!this.accessToken();
  });

  readonly isAdmin = computed(() => {
    if (!this.isAuthenticated()) return false;
    const u = this.user();
    if (!u) return false;
    return u.isAdmin || (u.roles || []).some((r) => r.toLowerCase() === 'admin');
  });

  readonly isAnonymous = computed(() => !this.isAuthenticated());

  readonly anonymousPolicy = computed<AnonymousAccessPolicy>(() => {
    return this.session()?.anonymousPolicy ?? DEFAULT_ANONYMOUS_POLICY;
  });

  private refreshInProgress$: Observable<{ accessToken: string }> | null = null;
  private refreshTimer: any = null;

  constructor() {
    this.scheduleAutoRefresh(this.accessToken());
    const handledFromRedirect = this.checkRedirectAuthParams();
    if (!handledFromRedirect) {
      this.initSession();
    }
    this.listenForExternalSessionCompletion();
  }

  /**
   * Inspects URL query params and fragment for returned auth tokens from Central SSO / Admin redirect.
   * If detected, establishes session, strips sensitive tokens from browser URL, and closes auth modal.
   */
  checkRedirectAuthParams(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      let hashParams: URLSearchParams | null = null;
      if (url.hash && url.hash.includes('=')) {
        try {
          hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        } catch {
          // Ignore hash parse errors
        }
      }

      const token =
        params.get('token') ||
        params.get('access_token') ||
        params.get('accessToken') ||
        hashParams?.get('token') ||
        hashParams?.get('access_token') ||
        hashParams?.get('accessToken');

      const ticket =
        params.get('ticket') ||
        params.get('sessionConfirmationTicket') ||
        hashParams?.get('ticket');

      const ssoSuccess =
        params.get('sso') === 'success' ||
        params.get('login') === 'success' ||
        params.get('auth') === 'success';

      let handled = false;

      // Check if user came back from a pending passkey flow
      const isPasskeyPending = sessionStorage.getItem('animstudio_passkey_pending') === 'true';
      if (isPasskeyPending) {
        sessionStorage.removeItem('animstudio_passkey_pending');
      }

      if (token) {
        this.saveAccessToken(token);
        this.closeAuthModal();
        this.fetchSystemSession().subscribe({
          next: (s) => {
            this.status.showNotice(`Welcome back, ${s.displayName || 'User'}! Signed in with Passkey.`);
          },
        });
        handled = true;
      } else if (ticket) {
        this.confirmSession(ticket).subscribe({
          next: (res) => {
            if (res.success) {
              this.closeAuthModal();
              this.fetchSystemSession().subscribe();
              this.status.showNotice('Signed in successfully.');
            }
          },
        });
        handled = true;
      } else if (ssoSuccess || isPasskeyPending) {
        this.refreshSession().subscribe({
          next: () => {
            this.closeAuthModal();
            this.fetchSystemSession().subscribe({
              next: (s) => {
                this.status.showNotice(`Welcome back, ${s.displayName || 'User'}!`);
              },
            });
          },
          error: () => {
            this.initSession();
          },
        });
        handled = true;
      }

      if (handled) {
        // Clean URL to prevent tokens/parameters from persisting in history/bookmarks
        params.delete('token');
        params.delete('access_token');
        params.delete('accessToken');
        params.delete('ticket');
        params.delete('sessionConfirmationTicket');
        params.delete('sso');
        params.delete('login');
        params.delete('auth');

        const newSearch = params.toString() ? `?${params.toString()}` : '';
        const cleanUrl = `${url.pathname}${newSearch}`;
        window.history.replaceState({}, document.title, cleanUrl);
        return true;
      }
    } catch {
      // Ignore URL parsing errors
    }
    return false;
  }

  /**
   * Listens for tab refocus, visibility change, and inter-window messages so if the user
   * completed SSO authentication in an adjacent tab or popup, this page auto-syncs.
   */
  private listenForExternalSessionCompletion(): void {
    if (typeof window === 'undefined') return;

    let debounceTimer: any = null;
    const handleRecheck = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!this.isAuthenticated() || this.isAuthModalOpen()) {
          this.refreshSession().subscribe({
            next: () => {
              this.closeAuthModal();
              this.fetchSystemSession().subscribe({
                next: (sess) => {
                  this.status.showNotice(`Welcome back, ${sess.displayName || 'User'}!`);
                },
              });
            },
            error: () => {
              // No remote SSO session established
            },
          });
        }
      }, 500);
    };

    window.addEventListener('focus', handleRecheck);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleRecheck();
      }
    });

    let storageSyncTimer: ReturnType<typeof setTimeout> | null = null;
    window.addEventListener('storage', (event) => {
      if (event.key !== ACCESS_TOKEN_KEY && event.key !== USER_KEY) return;
      if (storageSyncTimer) clearTimeout(storageSyncTimer);
      storageSyncTimer = setTimeout(() => {
        storageSyncTimer = null;
        const token = this.getStoredAccessToken();
        const user = this.getStoredUser();
        this.accessToken.set(token);
        this.user.set(user);
        this.scheduleAutoRefresh(token);

        if (token && user?.isAuthenticated) {
          this.closeAuthModal();
          this.fetchSystemSession().subscribe({
            next: (sess) => {
              if (sess.isAuthenticated) {
                this.status.showNotice(`Welcome back, ${sess.displayName || 'User'}!`);
              }
            },
          });
        }
      }, 0);
    });

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('animstudio_auth');
        channel.onmessage = (event) => {
          if (event.data?.type === 'AUTH_SUCCESS') {
            if (event.data.token) {
              this.saveAccessToken(event.data.token);
            }
            this.closeAuthModal();
            this.fetchSystemSession().subscribe();
          }
        };
      } catch {
        // Channel unavailable
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'ANIMSTUDIO_AUTH_SUCCESS') {
        if (event.data.token) {
          this.saveAccessToken(event.data.token);
        }
        this.closeAuthModal();
        this.fetchSystemSession().subscribe();
      }
    });
  }

  /**
   * Initializes session: checks current identity from API and triggers silent SSO if needed.
   */
  initSession(): void {
    const token = this.accessToken();
    if (token && this.isTokenExpired(token)) {
      // Token exists in localStorage but is expired: refresh immediately via SSO cookie
      this.refreshSession().subscribe({
        next: () => this.fetchSystemSession().subscribe(),
        error: () => {
          this.clearLocalSession();
          this.fetchSystemSession().subscribe();
        },
      });
      return;
    }

    this.fetchSystemSession().subscribe({
      next: (sess) => {
        if (!sess.isAuthenticated && !this.accessToken()) {
          // Attempt silent SSO via IdP refresh cookie if present
          this.refreshSession().subscribe({
            next: () => this.fetchSystemSession().subscribe(),
            error: () => {
              // Remaining anonymous is acceptable
            },
          });
        }
      },
      error: () => {
        // Fallback for offline or restricted environments
      },
    });
  }

  fetchSystemSession(): Observable<StudioSession> {
    return this.http
      .get<ApiResponse<StudioSession>>(`${this.base}/api/system/session`, {
        withCredentials: true,
        headers: this.buildAuthHeaders(),
      })
      .pipe(
        map((r) => (r.data ?? {
          isAuthenticated: false,
          userId: this.guestId(),
          displayName: 'Guest',
          email: null,
          isAdmin: false,
          roles: ['Anonymous'],
          anonymousPolicy: DEFAULT_ANONYMOUS_POLICY,
        }) as StudioSession),
        tap((sess: StudioSession) => {
          this.session.set(sess);
          if (sess.isAuthenticated) {
            const u: StudioUser = {
              userId: sess.userId,
              email: sess.email,
              displayName: sess.displayName,
              isAuthenticated: true,
              isAdmin: sess.isAdmin,
              roles: sess.roles || [],
            };
            this.saveUser(u);
          } else if (!this.accessToken()) {
            this.user.set(null);
            localStorage.removeItem(USER_KEY);
          }
        }),
        catchError((err) => {
          const fallbackSession: StudioSession = {
            isAuthenticated: false,
            userId: this.guestId(),
            displayName: 'Guest',
            email: null,
            isAdmin: false,
            roles: ['Anonymous'],
            anonymousPolicy: DEFAULT_ANONYMOUS_POLICY,
          };
          this.session.set(fallbackSession);
          return of(fallbackSession);
        })
      );
  }

  login(credentials: LoginCredentials): Observable<LoginResult> {
    if (credentials.twoFactorCode && credentials.twoFactorToken) {
      return this.verifyTwoFactor({
        twoFactorToken: credentials.twoFactorToken,
        code: credentials.twoFactorCode,
        method: 0,
      });
    }

    return this.http
      .post<any>(`${this.base}/api/auth/login`, credentials, {
        withCredentials: true,
        headers: { 'X-Guest-Id': this.guestId() },
      })
      .pipe(
        map((resp) => {
          // Response may be wrapped in ApiResponse or raw IdP payload
          const data = resp?.data ?? resp;

          if (data.twoFactorRequired) {
            return {
              success: false,
              twoFactorRequired: true,
              twoFactorToken: data.twoFactorToken,
            } as LoginResult;
          }

          if (data.requiresSessionConfirmation) {
            return {
              success: false,
              requiresSessionConfirmation: true,
              sessionConfirmationTicket: data.sessionConfirmationTicket,
            } as LoginResult;
          }

          const session = this.extractSessionUser(data);
          if (session) {
            this.saveAccessToken(session.token);
            this.saveUser(session.user);
            this.closeAuthModal();
            this.fetchSystemSession().subscribe();
            return { success: true, user: session.user };
          }

          if (data.error || data.message) {
            return {
              success: false,
              error: data.error || data.message,
            };
          }

          return { success: false, error: 'Unexpected sign in response.' };
        }),
        catchError((err) => {
          if (err?.status === 423) {
            const retry = Number(err?.error?.retryAfterSeconds ?? err?.headers?.get?.('Retry-After'));
            const wait = Number.isFinite(retry) && retry > 0 ? ` Try again in about ${Math.ceil(retry / 60)} minute(s).` : ' Please wait a while and try again.';
            return of({
              success: false,
              error: `This account is temporarily locked after too many failed sign-in attempts.${wait} You can also reset your password at id.keshavsingh.in.`,
            });
          }
          const message =
            (typeof err?.error === 'string' ? undefined : err?.error?.message) ||
            (typeof err?.error === 'string' ? undefined : err?.error?.error) ||
            err?.message ||
            'Failed to connect to authentication service.';
          return of({ success: false, error: message });
        })
      );
  }

  verifyTwoFactor(credentials: TwoFactorVerifyCredentials): Observable<LoginResult> {
    return this.http
      .post<any>(`${this.base}/api/auth/2fa/verify`, credentials, {
        withCredentials: true,
        headers: { 'X-Guest-Id': this.guestId() },
      })
      .pipe(
        map((resp) => {
          const data = resp?.data ?? resp;

          const session = this.extractSessionUser(data);
          if (session) {
            this.saveAccessToken(session.token);
            this.saveUser(session.user);
            this.closeAuthModal();
            this.fetchSystemSession().subscribe();
            return { success: true, user: session.user };
          }

          if (data.requiresSessionConfirmation && data.sessionConfirmationTicket) {
            return {
              success: false,
              requiresSessionConfirmation: true,
              sessionConfirmationTicket: data.sessionConfirmationTicket,
            };
          }

          if (data.error || data.message) {
            return {
              success: false,
              error: data.error || data.message,
            };
          }

          return { success: false, error: 'Verification failed. Check your code and try again.' };
        }),
        catchError((err) => {
          const message =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Failed to verify authentication code.';
          return of({ success: false, error: message });
        })
      );
  }

  confirmSession(ticket: string): Observable<LoginResult> {
    return this.http
      .post<any>(`${this.base}/api/auth/session/confirm`, {
        sessionConfirmationTicket: ticket,
        revokeAllOthers: true,
      }, {
        withCredentials: true,
        headers: { 'X-Guest-Id': this.guestId() },
      })
      .pipe(
        map((resp) => {
          const data = resp?.data ?? resp;
          const session = this.extractSessionUser(data);
          if (session) {
            this.saveAccessToken(session.token);
            this.saveUser(session.user);
            this.closeAuthModal();
            this.fetchSystemSession().subscribe();
            return { success: true, user: session.user };
          }
          return { success: false, error: data.error || data.message || 'Session confirmation failed.' };
        }),
        catchError((err) => {
          return of({ success: false, error: err?.error?.message || err?.error?.error || 'Session confirmation failed.' });
        })
      );
  }

  private extractSessionUser(data: any): { token: string; user: StudioUser } | null {
    if (!data) return null;

    const token =
      data.accessToken ||
      data.AccessToken ||
      data.tokens?.accessToken ||
      data.tokens?.AccessToken ||
      data.session?.accessToken ||
      data.session?.AccessToken ||
      data.Session?.AccessToken;

    const userInfo =
      data.user ||
      data.User ||
      data.tokens?.user ||
      data.tokens?.User ||
      data.session?.user ||
      data.session?.User ||
      data.Session?.User;

    if (!token || !userInfo) return null;

    const rawRoles = userInfo.roles || userInfo.Roles;
    const roles: string[] = Array.isArray(rawRoles) ? rawRoles : [];

    const studioUser: StudioUser = {
      userId: userInfo.id || userInfo.Id || userInfo.userId || userInfo.UserId || '',
      email: userInfo.email || userInfo.Email || null,
      displayName: userInfo.displayName || userInfo.DisplayName || userInfo.username || userInfo.Username || userInfo.email || 'User',
      isAuthenticated: true,
      isAdmin: roles.some((r: string) => r.toLowerCase() === 'admin'),
      roles,
    };

    return { token, user: studioUser };
  }

  passkeyLoginBegin(): Observable<{ handle: string; options: any }> {
    return this.http.post<{ handle: string; options: any }>(
      `${this.base}/api/auth/passkeys/login/begin`,
      {},
      { withCredentials: true }
    );
  }

  passkeyLoginComplete(handle: string, response: unknown): Observable<LoginResult> {
    return this.http
      .post<any>(
        `${this.base}/api/auth/passkeys/login/complete`,
        { handle, response },
        { withCredentials: true }
      )
      .pipe(
        map((resp) => {
          const data = resp?.data ?? resp;
          const authData = this.extractSessionUser(data);
          if (authData) {
            this.saveAccessToken(authData.token);
            this.saveUser(authData.user);
            return { success: true, user: authData.user } as LoginResult;
          }

          if (data.accessToken) {
            this.saveAccessToken(data.accessToken);
            if (data.user) {
              const u: StudioUser = {
                userId: data.user.id || data.user.userId || '',
                email: data.user.email,
                displayName: data.user.displayName || data.user.name || 'User',
                isAuthenticated: true,
                isAdmin: data.user.isAdmin || (data.user.roles || []).includes('Admin'),
                roles: data.user.roles || [],
              };
              this.saveUser(u);
            }
            return { success: true, user: this.user()! } as LoginResult;
          }

          return { success: false, error: data.error || 'Passkey sign-in failed.' } as LoginResult;
        }),
        tap((res) => {
          if (res.success) {
            this.fetchSystemSession().subscribe();
          }
        }),
        catchError((err) => {
          const message =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Passkey sign-in failed.';
          return of({ success: false, error: message });
        })
      );
  }

  refreshSession(): Observable<{ accessToken: string }> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    this.refreshInProgress$ = this.http
      .post<any>(
        `${this.base}/api/auth/session`,
        {},
        {
          withCredentials: true,
          headers: { 'X-Guest-Id': this.guestId() },
        }
      )
      .pipe(
        map((resp) => {
          const data = resp?.data ?? resp;
          const token =
            data.accessToken ||
            data.tokens?.accessToken ||
            data.session?.accessToken;
          const userInfo =
            data.user ||
            data.tokens?.user ||
            data.session?.user;

          if (token) {
            this.saveAccessToken(token);
            if (userInfo) {
              const roles: string[] = Array.isArray(userInfo.roles) ? userInfo.roles : [];
              const studioUser: StudioUser = {
                userId: userInfo.id || userInfo.userId,
                email: userInfo.email,
                displayName: userInfo.displayName || userInfo.username || userInfo.email,
                isAuthenticated: true,
                isAdmin: roles.some((r: string) => r.toLowerCase() === 'admin'),
                roles,
              };
              this.saveUser(studioUser);
            }
            return { accessToken: token };
          }
          throw new Error('Refresh response missing token.');
        }),
        catchError((err) => {
          this.saveAccessToken(null);
          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInProgress$ = null;
        }),
        shareReplay(1)
      );

    return this.refreshInProgress$;
  }

  signOut(): void {
    this.logout();
  }

  logout(): Observable<void> {
    // 1. Immediately wipe local auth state and session cache
    this.clearLocalSession();

    // 2. Instruct backend / IdP to invalidate SSO session and cookies
    const req$ = this.http
      .post<void>(
        `${this.base}/api/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: this.buildAuthHeaders(),
        }
      )
      .pipe(
        timeout({ each: 2500, with: () => of(undefined) }),
        tap(() => {
          this.fetchSystemSession().subscribe();
        }),
        catchError(() => {
          this.fetchSystemSession().subscribe();
          return of(undefined);
        }),
        shareReplay(1)
      );

    // Auto-subscribe immediately so calling auth.logout() from template event bindings executes
    req$.subscribe();
    return req$;
  }

  clearLocalSession(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.saveAccessToken(null);
    this.saveUser(null);
    this.resetGuestId();
    const fallbackSession: StudioSession = {
      isAuthenticated: false,
      userId: this.guestId(),
      displayName: 'Guest',
      email: null,
      isAdmin: false,
      roles: ['Anonymous'],
      anonymousPolicy: DEFAULT_ANONYMOUS_POLICY,
    };
    this.session.set(fallbackSession);
  }

  resetGuestId(): string {
    const gid = 'guest_' + Math.random().toString(36).substring(2, 10);
    try {
      localStorage.setItem(GUEST_ID_KEY, gid);
    } catch {
      // Storage access blocked or restricted
    }
    this.guestId.set(gid);
    return gid;
  }

  openAuthModal(): void {
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
  }

  buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Guest-Id': this.guestId(),
    };
    const token = this.accessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  isTokenExpired(token?: string | null, skewSeconds = 30): boolean {
    const t = token ?? this.accessToken();
    if (!t) return true;
    try {
      const parts = t.split('.');
      if (parts.length < 2) return true;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload || !payload.exp) return false;
      return Date.now() >= (payload.exp - skewSeconds) * 1000;
    } catch {
      return true;
    }
  }

  getTokenExpiryMs(token?: string | null): number | null {
    const t = token ?? this.accessToken();
    if (!t) return null;
    try {
      const parts = t.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload || !payload.exp) return null;
      return payload.exp * 1000;
    } catch {
      return null;
    }
  }

  private scheduleAutoRefresh(token: string | null): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (!token) return;

    const expiryMs = this.getTokenExpiryMs(token);
    if (!expiryMs) return;

    // Refresh 90 seconds before token expires (or in 5 seconds if already very close)
    const now = Date.now();
    const refreshInMs = Math.max(5000, expiryMs - now - 90000);

    if (expiryMs > now) {
      this.refreshTimer = setTimeout(() => {
        if (this.accessToken()) {
          this.refreshSession().subscribe({
            next: () => {
              // Successfully refreshed token ahead of expiration
            },
            error: () => {
              // SSO session may have expired
            },
          });
        }
      }, refreshInMs);
    }
  }

  private saveAccessToken(token: string | null): void {
    this.accessToken.set(token);
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    this.scheduleAutoRefresh(token);
  }

  private saveUser(user: StudioUser | null): void {
    this.user.set(user);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  private getStoredAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): StudioUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getOrCreateGuestId(): string {
    try {
      let gid = localStorage.getItem(GUEST_ID_KEY);
      if (!gid) {
        gid = 'guest_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(GUEST_ID_KEY, gid);
      }
      return gid;
    } catch {
      return 'guest_' + Math.random().toString(36).substring(2, 10);
    }
  }
}
