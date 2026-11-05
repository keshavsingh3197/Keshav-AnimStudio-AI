import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  CategorySuggestion, PublishQueueAdd, PublishQueueBoard, PublishQueueBulk, PublishQueueBulkResult,
  PublishQueueCandidate, PublishQueueItem, PublishQueueUpdate, PublishSlot,
} from '../models/publish-queue.models';

/** The viewer's IANA zone, so suggested slots land on their own clock. */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/** The publishing board: videos queued for YouTube with a time, pushed by the server when due. */
@Injectable({ providedIn: 'root' })
export class PublishQueueService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/youtube`;

  board(): Observable<PublishQueueBoard> {
    return this.http.get<ApiResponse<PublishQueueBoard>>(`${this.base}/queue`).pipe(map((r) => r.data as PublishQueueBoard));
  }

  item(id: string): Observable<PublishQueueItem> {
    return this.http.get<ApiResponse<PublishQueueItem>>(`${this.base}/queue/${encodeURIComponent(id)}`).pipe(map((r) => r.data as PublishQueueItem));
  }

  candidates(limit = 200): Observable<PublishQueueCandidate[]> {
    return this.http
      .get<ApiResponse<PublishQueueCandidate[]>>(`${this.base}/queue/candidates`, { params: { limit } })
      .pipe(map((r) => r.data ?? []));
  }

  slots(channelId: string | null, vertical: boolean, count = 6): Observable<PublishSlot[]> {
    const params: Record<string, string | number | boolean> = { timeZone: localTimeZone(), vertical, count };
    if (channelId) params['channelId'] = channelId;
    return this.http.get<ApiResponse<PublishSlot[]>>(`${this.base}/queue/slots`, { params }).pipe(map((r) => r.data ?? []));
  }

  suggestCategory(input: { jobId?: string | null; title?: string; description?: string; tags?: string[] }): Observable<CategorySuggestion[]> {
    return this.http
      .post<ApiResponse<CategorySuggestion[]>>(`${this.base}/queue/suggest-category`, input)
      .pipe(map((r) => r.data ?? []));
  }

  add(jobId: string, request: PublishQueueAdd): Observable<PublishQueueItem> {
    return this.http
      .post<ApiResponse<PublishQueueItem>>(`${this.base}/render-jobs/${encodeURIComponent(jobId)}/queue`, request)
      .pipe(map((r) => r.data as PublishQueueItem));
  }

  bulk(request: PublishQueueBulk): Observable<PublishQueueBulkResult> {
    return this.http
      .post<ApiResponse<PublishQueueBulkResult>>(`${this.base}/queue/bulk`, request)
      .pipe(map((r) => r.data as PublishQueueBulkResult));
  }

  update(id: string, change: PublishQueueUpdate): Observable<PublishQueueItem> {
    return this.http
      .put<ApiResponse<PublishQueueItem>>(`${this.base}/queue/${encodeURIComponent(id)}`, change)
      .pipe(map((r) => r.data as PublishQueueItem));
  }

  hold(id: string): Observable<PublishQueueItem> {
    return this.action(id, 'hold');
  }

  /** Back on the schedule, at `scheduledAt` or its own time when that is still ahead. */
  schedule(id: string, scheduledAt: string | null = null): Observable<PublishQueueItem> {
    return this.action(id, 'schedule', { scheduledAt });
  }

  publishNow(id: string): Observable<PublishQueueItem> {
    return this.action(id, 'publish-now');
  }

  cancel(id: string): Observable<PublishQueueItem> {
    return this.action(id, 'cancel');
  }

  /** Off the board. A video already on YouTube stays there. */
  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/queue/${encodeURIComponent(id)}`);
  }

  private action(id: string, verb: string, body: object = {}): Observable<PublishQueueItem> {
    return this.http
      .post<ApiResponse<PublishQueueItem>>(`${this.base}/queue/${encodeURIComponent(id)}/${verb}`, body)
      .pipe(map((r) => r.data as PublishQueueItem));
  }
}
