import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Attaches JWT Bearer authentication, guest identity headers, and withCredentials flag
 * to all AnimStudio backend requests.
 *
 * Automatically attempts a silent session refresh when receiving a 401 Unauthorized,
 * replaying the failed request upon successful token retrieval.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const base = environment.apiUrl;

  const isApi = req.url.startsWith(base) || req.url.startsWith('/api/');
  const isAuthRoute = req.url.includes('/api/auth/') || req.url.includes('/sso/');

  if (!isApi) {
    return next(req);
  }

  const token = auth.accessToken();
  const guestId = auth.guestId();

  // If a token exists but has expired or is expiring imminently, proactively refresh it
  // before making the request. This prevents lifetime validation failures and ensures
  // anonymous/admin-access endpoints do not silently drop claims.
  if (token && !isAuthRoute && auth.isTokenExpired(token)) {
    return auth.refreshSession().pipe(
      switchMap((res) => {
        let refreshedHeaders = req.headers.set('Authorization', `Bearer ${res.accessToken}`);
        if (refreshedHeaders.has('X-Guest-Id')) {
          refreshedHeaders = refreshedHeaders.delete('X-Guest-Id');
        }
        return next(
          req.clone({
            headers: refreshedHeaders,
            withCredentials: true,
          })
        );
      }),
      catchError((refreshErr) => {
        if (auth.isAuthRejection(refreshErr)) {
          auth.clearLocalSession();
        }
        // If it was a public session or access check, fall back to guest headers gracefully
        if (req.url.includes('/api/system/session') || req.url.includes('/api/system/admin-access')) {
          let guestHeaders = req.headers.delete('Authorization');
          if (!guestHeaders.has('X-Guest-Id')) {
            guestHeaders = guestHeaders.set('X-Guest-Id', auth.guestId());
          }
          return next(
            req.clone({
              headers: guestHeaders,
              withCredentials: true,
            })
          );
        }
        return throwError(() => refreshErr);
      })
    );
  }

  let headers = req.headers;
  if (token) {
    if (!headers.has('Authorization')) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (headers.has('X-Guest-Id')) {
      headers = headers.delete('X-Guest-Id');
    }
  } else if (guestId && !headers.has('X-Guest-Id')) {
    headers = headers.set('X-Guest-Id', guestId);
  }

  const authed = req.clone({
    headers,
    withCredentials: true,
  });

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || isAuthRoute || !auth.accessToken()) {
        return throwError(() => err);
      }

      // If unauthorized and we have a token, attempt silent SSO refresh once
      return auth.refreshSession().pipe(
        switchMap((res) => {
          let retryHeaders = req.headers.set('Authorization', `Bearer ${res.accessToken}`);
          if (retryHeaders.has('X-Guest-Id')) {
            retryHeaders = retryHeaders.delete('X-Guest-Id');
          }
          return next(
            req.clone({
              headers: retryHeaders,
              withCredentials: true,
            })
          );
        }),
        catchError((refreshErr) => {
          if (auth.isAuthRejection(refreshErr)) {
            auth.clearLocalSession();
          }
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

