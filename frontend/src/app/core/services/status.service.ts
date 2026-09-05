import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiFailure } from '../interceptors/api-error.interceptor';

/**
 * Shared busy / error / notice state.
 *
 * Every page needs the same three things and they are always rendered in the same place
 * (the shell), so they live in one service rather than being reimplemented per component.
 */
@Injectable({ providedIn: 'root' })
export class StatusService {
  /** A counter, not a flag: two calls in flight must not un-busy each other. */
  private readonly inFlight = signal(0);

  readonly busy = computed(() => this.inFlight() > 0);
  readonly error = signal<string | null>(null);
  readonly notices = signal<string[]>([]);

  /** Runs a call with shared busy and error handling. */
  run<T>(source: Observable<T>, next: (value: T) => void = () => undefined): void {
    this.inFlight.update((count) => count + 1);
    this.error.set(null);

    source.subscribe({
      next: (value) => {
        this.inFlight.update((count) => count - 1);
        next(value);
      },
      error: (failure: unknown) => {
        this.inFlight.update((count) => count - 1);
        this.error.set(
          failure instanceof ApiFailure ? failure.message : 'Something went wrong.');
      },
    });
  }

  notify(messages: readonly string[]): void {
    if (messages.length === 0) return;
    this.notices.update((list) => [...list, ...messages]);
  }

  clearError(): void {
    this.error.set(null);
  }

  dismissNotices(): void {
    this.notices.set([]);
  }
}
