import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, retry, throwError, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { ApiFailure } from '../interceptors/api-error.interceptor';
import {
  LibraryBulk, LibraryPage, LibraryQuery, ShortsActive, ShortsBulkResponse, ShortsDriveCheck, ShortsOverview, YouTubeBulkPublishBody,
} from '../models/shorts.models';
import { MediaTicketService } from './media-ticket.service';

/** The Shorts page's calls: every short across projects, and the bulk actions on them. */
@Injectable({ providedIn: 'root' })
export class ShortsService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaTicketService);
  private readonly base = `${environment.apiUrl}/api/shorts`;

  /** Every short (or every render, with scope 'all'), its Drive and YouTube state, stock and alerts. */
  overview(projectId?: string | null, scope: 'shorts' | 'all' = 'shorts'): Observable<ShortsOverview> {
    let params = new HttpParams().set('scope', scope);
    if (projectId) params = params.set('projectId', projectId);
    return this.http.get<ApiResponse<ShortsOverview>>(`${this.base}/overview`, { params })
      .pipe(map((r) => r.data as ShortsOverview));
  }

  /** How many renders each of a project's files is in. */
  usage(projectId: string): Observable<Record<string, number>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.base}/usage`, { params: { projectId } })
      .pipe(map((r) => r.data ?? {}));
  }

  /** Renders still running and Drive copies still on their way, across every project. */
  active(): Observable<ShortsActive> {
    return this.http.get<ApiResponse<ShortsActive>>(`${this.base}/active`)
      .pipe(map((r) => r.data ?? { jobs: [], driveCopies: [] }));
  }

  /** Copies many renders to Drive; ones still rendering are copied when they finish. */
  saveToDrive(body: { jobIds: string[]; channelId?: string | null; folderName?: string | null; topicId?: string | null; again?: boolean }): Observable<ShortsBulkResponse> {
    return this.http.post<ApiResponse<ShortsBulkResponse>>(`${this.base}/drive`, {
      jobIds: body.jobIds,
      topicId: body.topicId || null,
      channelId: body.channelId || null,
      folderName: body.folderName?.trim() || null,
      again: !!body.again,
    }).pipe(map((r) => r.data as ShortsBulkResponse));
  }

  /**
   * Asks Drive whether every copy is still there (deleted ones stop counting as on Drive);
   * with organize, also files older copies into project / day / batch folders.
   */
  checkDrive(organize: boolean): Observable<ShortsDriveCheck> {
    return this.http.post<ApiResponse<ShortsDriveCheck>>(`${this.base}/drive/check`, { organize })
      .pipe(map((r) => r.data as ShortsDriveCheck));
  }

  /** Puts failed or cancelled renders back in the queue. */
  retry(jobIds: string[]): Observable<ShortsBulkResponse> {
    return this.http.post<ApiResponse<ShortsBulkResponse>>(`${this.base}/retry`, { jobIds })
      .pipe(map((r) => r.data as ShortsBulkResponse));
  }

  /** Queues many finished renders for one YouTube channel. */
  publishToYouTube(body: YouTubeBulkPublishBody): Observable<ShortsBulkResponse> {
    return this.http.post<ApiResponse<ShortsBulkResponse>>(`${environment.apiUrl}/api/youtube/render-jobs/bulk-publish`, body)
      .pipe(map((r) => r.data as ShortsBulkResponse));
  }

  private readonly library = `${environment.apiUrl}/api/shorts/library`;
  private readonly libraryReadRetry = {
    count: 2,
    delay: (error: unknown, attempt: number) => error instanceof ApiFailure &&
      (error.status === 0 || error.status === 408 || error.status >= 500)
        ? timer(attempt * 1000)
        : throwError(() => error),
  };

  /** Reads every connected Drive's Topics / Archive folders and adds what the library doesn't know yet. */
  importFromDrive(): Observable<{ drives: number; added: number; topicsAdded: number; revived: number; skippedDrives: number }> {
    return this.http.post<ApiResponse<{ drives: number; added: number; topicsAdded: number; revived: number; skippedDrives: number }>>(
      `${this.library}/import-drive`, {}).pipe(map((r) => r.data as { drives: number; added: number; topicsAdded: number; revived: number; skippedDrives: number }));
  }

  /** One page of the Drive library for the filters, with the counts the filter chips show. */
  libraryItems(query: LibraryQuery): Observable<LibraryPage> {
    return this.http.get<ApiResponse<LibraryPage>>(`${this.library}/items`, { params: this.libraryParams(query) })
      .pipe(retry(this.libraryReadRetry), map((r) => r.data as LibraryPage));
  }

  /** Every id the filters match, across pages. */
  libraryIds(query: LibraryQuery): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.library}/ids`, { params: this.libraryParams(query) })
      .pipe(retry(this.libraryReadRetry), map((r) => r.data ?? []));
  }

  private libraryParams(q: LibraryQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(q)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return params;
  }

  /** Files copies under a shared topic (null takes them out of any topic), moving them on Drive. */
  moveToTopic(handoffIds: string[], topicId: string | null): Observable<LibraryBulk> {
    return this.http.post<ApiResponse<LibraryBulk>>(`${this.library}/move`, { handoffIds, topicId })
      .pipe(map((r) => r.data as LibraryBulk));
  }

  markUsed(handoffIds: string[], used: boolean, archive = true): Observable<LibraryBulk> {
    return this.http.post<ApiResponse<LibraryBulk>>(`${this.library}/used`, { handoffIds, used, archive })
      .pipe(map((r) => r.data as LibraryBulk));
  }

  /** Moves the given copies (or, with none given, every used one) to the Drive Archive folder. */
  archive(handoffIds?: string[]): Observable<LibraryBulk> {
    return this.http.post<ApiResponse<LibraryBulk>>(`${this.library}/archive`, { handoffIds: handoffIds ?? null })
      .pipe(map((r) => r.data as LibraryBulk));
  }

  restore(handoffIds: string[]): Observable<LibraryBulk> {
    return this.http.post<ApiResponse<LibraryBulk>>(`${this.library}/restore`, { handoffIds })
      .pipe(map((r) => r.data as LibraryBulk));
  }

  /** Deletes the given copies (or, with none given, every used one); the Drive file goes to the Drive trash. */
  deleteArchived(handoffIds?: string[]): Observable<LibraryBulk> {
    return this.http.post<ApiResponse<LibraryBulk>>(`${this.library}/delete`, { handoffIds: handoffIds ?? null })
      .pipe(map((r) => r.data as LibraryBulk));
  }

  /** The copy's bytes, streamed from Drive through the server; with markUsed it is then marked used. */
  downloadCopy(handoffId: string, markUsed: boolean, autoArchive = true): Observable<Blob> {
    return this.http.get(`${this.library}/download/${encodeURIComponent(handoffId)}`, {
      params: { markUsed, autoArchive }, responseType: 'blob',
    });
  }

  /** Direct signed inline stream URL for previewing/sampling a library item in a <video> player. */
  streamUrl(handoffId: string): string {
    return this.media.sign(`${this.library}/download/${encodeURIComponent(handoffId)}?inline=true&markUsed=false`);
  }

  /** Direct signed JPEG frame URL for a library item's render job. */
  frameUrl(jobId: string, atSeconds = 1.2, width = 360): string {
    return this.media.sign(
      `${environment.apiUrl}/api/youtube/render-jobs/${encodeURIComponent(jobId)}/frame?at=${atSeconds}&width=${width}`,
    );
  }
}
