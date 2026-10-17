import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  ShortsActive, ShortsBulkResponse, ShortsDriveCheck, ShortsOverview, YouTubeBulkPublishBody,
} from '../models/shorts.models';

/** The Shorts page's calls: every short across projects, and the bulk actions on them. */
@Injectable({ providedIn: 'root' })
export class ShortsService {
  private readonly http = inject(HttpClient);
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
  saveToDrive(body: { jobIds: string[]; channelId?: string | null; folderName?: string | null; again?: boolean }): Observable<ShortsBulkResponse> {
    return this.http.post<ApiResponse<ShortsBulkResponse>>(`${this.base}/drive`, {
      jobIds: body.jobIds,
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
}
