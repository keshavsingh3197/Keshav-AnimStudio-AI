import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiResponse } from '../models/api.models';

/** A failed call, already reduced to something worth showing a user. */
export class ApiFailure extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
    this.name = 'ApiFailure';
  }
}

/**
 * Turns every transport-level failure into an {@link ApiFailure}.
 *
 * The backend answers errors in the same envelope as successes, so the readable message is
 * always in the body. Unwrapping it here means no component has to know that, and none of
 * them can accidentally surface a raw status code instead.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(catchError((error: unknown) => throwError(() => describe(error))));

function describe(error: unknown): ApiFailure {
  if (!(error instanceof HttpErrorResponse)) {
    return new ApiFailure('Something went wrong.', 'unknown', 0);
  }

  // Status 0 is the browser refusing to connect at all - almost always a stopped API.
  if (error.status === 0) {
    return new ApiFailure(
      'Could not reach the API. Is the backend running?', 'offline', 0);
  }

  const body = error.error as ApiResponse<unknown> | string | null;

  if (body && typeof body === 'object') {
    const first = body.errors?.[0];
    if (first) return new ApiFailure(first.message, first.code, error.status);
    if (body.message) return new ApiFailure(body.message, 'error', error.status);
  }

  return new ApiFailure('Something went wrong.', 'error', error.status);
}
