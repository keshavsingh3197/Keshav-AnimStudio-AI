import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiFailure } from '../interceptors/api-error.interceptor';

export interface AppLogEntry {
  id: number;
  timestamp: Date;
  message: string;
}

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
  private nextLogId = 1;

  readonly busy = computed(() => this.inFlight() > 0);
  readonly error = signal<string | null>(null);
  
  // Transient toast notification for the top bar (only shows the most recent one)
  readonly latestNotice = signal<string | null>(null);
  private noticeTimeout: any = null;

  // Persistent logs for the dedicated logs page
  readonly logEntries = signal<AppLogEntry[]>([]);

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
    
    // Show the last message as a transient toast
    const lastMessage = messages[messages.length - 1];
    this.latestNotice.set(lastMessage);
    
    if (this.noticeTimeout) clearTimeout(this.noticeTimeout);
    this.noticeTimeout = setTimeout(() => {
      this.latestNotice.set(null);
    }, 4000); // auto-hide after 4 seconds

    // Add all to persistent logs
    const newLogs = messages.map(msg => ({
      id: this.nextLogId++,
      timestamp: new Date(),
      message: msg
    }));
    
    this.logEntries.update(logs => [...newLogs, ...logs]);
  }

  clearError(): void {
    this.error.set(null);
  }

  dismissNotice(): void {
    this.latestNotice.set(null);
    if (this.noticeTimeout) clearTimeout(this.noticeTimeout);
  }

  clearLogs(): void {
    this.logEntries.set([]);
  }
}

