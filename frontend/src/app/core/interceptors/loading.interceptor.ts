import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoadingService } from '../services/loading.service';

/** Attach to background / polling requests so they never flicker the global progress bar. */
export const SILENT_HTTP = new HttpContextToken<boolean>(() => false);

/** Helper context for polling, health checks, and background sync calls. */
export function silentHttpContext(): HttpContext {
  return new HttpContext().set(SILENT_HTTP, true);
}

const SILENT_URL_FRAGMENTS = [
  '/api/auth/media-ticket',
  '/api/logs/stream',
  '/api/shorts/active',
  '/api/system/admin-access',
  '/api/system/ecosystem',
  '/assets/',
];

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SILENT_HTTP) || req.headers.has('X-Silent-Request')) {
    return next(req);
  }
  const url = req.url.toLowerCase();
  if (SILENT_URL_FRAGMENTS.some((part) => url.includes(part))) {
    return next(req);
  }

  const loading = inject(LoadingService);
  loading.beginHttp();
  return next(req).pipe(finalize(() => loading.endHttp()));
};
