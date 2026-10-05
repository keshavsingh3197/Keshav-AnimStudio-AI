import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  YouTubeChannel, YouTubeDraft, YouTubePublishStatus, YouTubeUpload, YouTubeVideoMetadata,
} from '../models/youtube.models';

@Injectable({ providedIn: 'root' })
export class YouTubePublishService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/youtube`;

  status(): Observable<YouTubePublishStatus> {
    return this.http
      .get<ApiResponse<YouTubePublishStatus>>(`${this.base}/status`)
      .pipe(map((r) => r.data as YouTubePublishStatus));
  }

  /** Where to send the browser to choose and approve a channel; Google returns to /youtube/callback. */
  startConnect(returnPath: string): Observable<string> {
    return this.http
      .post<ApiResponse<{ authorizationUrl: string }>>(`${this.base}/oauth/start`, { returnPath })
      .pipe(map((r) => r.data!.authorizationUrl));
  }

  completeConnect(code: string, state: string): Observable<{ connection: YouTubeChannel; returnPath: string }> {
    return this.http
      .post<ApiResponse<{ connection: YouTubeChannel; returnPath: string }>>(`${this.base}/oauth/complete`, { code, state })
      .pipe(map((r) => r.data!));
  }

  disconnect(channelId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/channels/${encodeURIComponent(channelId)}`);
  }

  draft(jobId: string): Observable<YouTubeDraft> {
    return this.http
      .get<ApiResponse<YouTubeDraft>>(`${this.base}/render-jobs/${encodeURIComponent(jobId)}/draft`)
      .pipe(map((r) => r.data as YouTubeDraft));
  }

  publish(jobId: string, channelId: string, metadata: YouTubeVideoMetadata): Observable<YouTubeUpload> {
    return this.http
      .post<ApiResponse<YouTubeUpload>>(`${this.base}/render-jobs/${encodeURIComponent(jobId)}/publish`, { channelId, metadata })
      .pipe(map((r) => r.data as YouTubeUpload));
  }

  uploads(jobId?: string): Observable<YouTubeUpload[]> {
    const query = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
    return this.http
      .get<ApiResponse<YouTubeUpload[]>>(`${this.base}/uploads${query}`)
      .pipe(map((r) => r.data ?? []));
  }

  upload(uploadId: string): Observable<YouTubeUpload> {
    return this.http
      .get<ApiResponse<YouTubeUpload>>(`${this.base}/uploads/${encodeURIComponent(uploadId)}`)
      .pipe(map((r) => r.data as YouTubeUpload));
  }

  cancel(uploadId: string): Observable<unknown> {
    return this.http.post(`${this.base}/uploads/${encodeURIComponent(uploadId)}/cancel`, {});
  }
}
