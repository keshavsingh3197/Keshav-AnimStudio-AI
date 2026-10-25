import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
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
    const u = this.user();
    if (!u) return false;
    return u.isAdmin || u.roles.some((r) => r.toLowerCase() === 'admin');
  });

  readonly isAnonymous = computed(() => !this.isAuthenticated());

  readonly anonymousPolicy = computed<AnonymousAccessPolicy>(() => {
    return this.session()?.anonymousPolicy ?? DEFAULT_ANONYMOUS_POLICY;
  });

  constructor() {
    this.initSession();
  }

  /**
   * Initializes session: checks current identity from API and triggers silent SSO if needed.
   */
  initSession(): void {
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
          const message =
            err?.error?.message ||
            err?.error?.error ||
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

  refreshSession(): Observable<{ accessToken: string }> {
    return this.http
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
        })
      );
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

  private saveAccessToken(token: string | null): void {
    this.accessToken.set(token);
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
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

