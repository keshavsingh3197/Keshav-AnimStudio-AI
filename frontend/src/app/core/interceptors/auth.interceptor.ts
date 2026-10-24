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

  let headers = req.headers;
  if (guestId && !headers.has('X-Guest-Id')) {
    headers = headers.set('X-Guest-Id', guestId);
  }
  if (token && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const authed = req.clone({
    headers,
    withCredentials: true,
  });

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || isAuthRoute) {
        return throwError(() => err);
      }

      // If unauthorized and we have a token, attempt silent SSO refresh once
      return auth.refreshSession().pipe(
        switchMap((res) => {
          const retryHeaders = req.headers
            .set('Authorization', `Bearer ${res.accessToken}`)
            .set('X-Guest-Id', guestId);
          return next(
            req.clone({
              headers: retryHeaders,
              withCredentials: true,
            })
          );
        }),
        catchError((refreshErr) => {
          auth.clearLocalSession();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

