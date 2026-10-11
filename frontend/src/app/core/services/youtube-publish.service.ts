import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  YouTubeChannel, YouTubeDashboard, YouTubeDraft, YouTubeLiveBroadcast, YouTubeLiveSetup, YouTubeLiveSuggestParams, YouTubePublication, YouTubePublishStatus,
  YouTubeSuggestion, YouTubeSuggestOptions, YouTubeSuggestParams, YouTubeUpload, YouTubeVideoMetadata,
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

  /** Re-reads connected channels' names and pictures from YouTube; for an admin, linked brand channels follow. */
  refreshChannels(): Observable<{ channels: YouTubeChannel[]; failed: { channelId: string; channelTitle: string; reason: string }[] }> {
    return this.http
      .post<ApiResponse<{ channels: YouTubeChannel[]; failed: { channelId: string; channelTitle: string; reason: string }[] }>>(
        `${this.base}/channels/refresh`, {})
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

  /** AI-written details from the project's name, description and script. Saves nothing. */
  suggestOptions(): Observable<YouTubeSuggestOptions> {
    return this.http
      .get<ApiResponse<YouTubeSuggestOptions>>(`${this.base}/suggest-options`)
      .pipe(map((r) => r.data as YouTubeSuggestOptions));
  }

  suggest(jobId: string, params: YouTubeSuggestParams): Observable<YouTubeSuggestion> {
    return this.http
      .post<ApiResponse<YouTubeSuggestion>>(`${this.base}/render-jobs/${encodeURIComponent(jobId)}/suggest`, params)
      .pipe(map((r) => r.data as YouTubeSuggestion));
  }

  /** `firstComment` is posted on the video once it is up; empty posts nothing. */
  publish(jobId: string, channelId: string, metadata: YouTubeVideoMetadata, relatedVideoIds: string[] = [],
          firstComment = ''): Observable<YouTubeUpload> {
    return this.http
      .post<ApiResponse<YouTubeUpload>>(`${this.base}/render-jobs/${encodeURIComponent(jobId)}/publish`,
        { channelId, metadata, relatedVideoIds, firstComment: firstComment || null })
      .pipe(map((r) => r.data as YouTubeUpload));
  }

  /** Videos uploaded from the app, newest first; optionally one project's. */
  videos(projectId?: string): Observable<YouTubePublication[]> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.http
      .get<ApiResponse<YouTubePublication[]>>(`${this.base}/videos${query}`)
      .pipe(map((r) => r.data ?? []));
  }

  /** Asks YouTube how the videos are doing (rejected, failed, deleted) and returns the updated list. */
  refreshVideos(projectId?: string, force = false): Observable<YouTubePublication[]> {
    return this.http
      .post<ApiResponse<YouTubePublication[]>>(`${this.base}/videos/refresh`, { projectId: projectId ?? null, force })
      .pipe(map((r) => r.data ?? []));
  }

  /** Channels with subscriber/view counts and every app-uploaded video with its numbers. */
  dashboard(force = false): Observable<YouTubeDashboard> {
    return this.http
      .get<ApiResponse<YouTubeDashboard>>(`${this.base}/dashboard${force ? '?force=true' : ''}`)
      .pipe(map((r) => r.data as YouTubeDashboard));
  }

  /** Forgets the app's link to a video; the video on YouTube is untouched. */
  forgetVideo(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/videos/${encodeURIComponent(id)}`);
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

  // ------------------------------------------------------------------ live

  /** A connected channel's live defaults and the broadcasts not yet streamed to. */
  liveSetup(channelId: string): Observable<YouTubeLiveSetup> {
    return this.http
      .get<ApiResponse<YouTubeLiveSetup>>(`${this.base}/live/channels/${encodeURIComponent(channelId)}`)
      .pipe(map((r) => r.data as YouTubeLiveSetup));
  }

  /** AI-written title, description and tags for a stream, from its topic. Saves nothing. */
  liveSuggest(params: YouTubeLiveSuggestParams): Observable<YouTubeSuggestion> {
    return this.http
      .post<ApiResponse<YouTubeSuggestion>>(`${this.base}/live/suggest`, params)
      .pipe(map((r) => r.data as YouTubeSuggestion));
  }

  /** Creates the broadcast and its stream key on YouTube. The key stays on the server. */
  createBroadcast(channelId: string, metadata: YouTubeVideoMetadata, scheduledStartTime: string | null, enableDvr: boolean): Observable<YouTubeLiveBroadcast> {
    return this.http
      .post<ApiResponse<YouTubeLiveBroadcast>>(`${this.base}/live/broadcasts`, { channelId, metadata, scheduledStartTime, enableDvr })
      .pipe(map((r) => r.data as YouTubeLiveBroadcast));
  }
}
