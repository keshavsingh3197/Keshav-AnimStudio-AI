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

  const body = error.error as ApiResponse<unknown> | any;

  if (body && typeof body === 'object') {
    // Standard ApiResponse<T> where errors is an array of { message, code }
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const first = body.errors[0];
      return new ApiFailure(first.message || 'Request failed.', first.code || 'error', error.status);
    }
    // Standard ASP.NET Core ValidationProblemDetails: { errors: { field: [msg, ...] } }
    if (body.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
      const entries = Object.entries(body.errors);
      if (entries.length > 0) {
        const [, val] = entries[0];
        const msg = Array.isArray(val) && val.length > 0 ? val[0] : String(val);
        return new ApiFailure(msg, 'validation_error', error.status);
      }
    }
    if (body.message) return new ApiFailure(body.message, 'error', error.status);
    if (body.title) return new ApiFailure(body.title, 'error', error.status);
    if (body.detail) return new ApiFailure(body.detail, 'error', error.status);
  }

  if (typeof body === 'string' && body.trim()) {
    return new ApiFailure(body.trim(), 'error', error.status);
  }

  return new ApiFailure('Something went wrong.', 'error', error.status);
}
