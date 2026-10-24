import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  GoogleDriveStatus, PhoneHandoff, PhoneHandoffCheck,
  YouTubeCheckup, YouTubeCheckupSaved, YouTubeThumbnailSaved, YouTubeUrlSeoResult, YouTubeVideoDetailsSave, YouTubeVideoEditContext,
  YouTubeChannel, YouTubeDashboard, YouTubeDraft, YouTubeLiveBroadcast, YouTubeLiveSetup, YouTubeLiveSuggestParams, YouTubePublication, YouTubePublishSource, YouTubePublishStatus,
  YouTubeSuggestion, YouTubeSuggestOptions, YouTubeSuggestParams, YouTubeThumbnailChoice, YouTubeUpload, YouTubeVideoMetadata,
  YouTubeCommentPosted, YouTubeInspectParams, YouTubeScheduleSaved, YouTubeVideoInspection,
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

  /** `id` is a render job's id, or a release kit's id when `source` is `'release'`. */
  draft(id: string, source: YouTubePublishSource = 'render'): Observable<YouTubeDraft> {
    return this.http
      .get<ApiResponse<YouTubeDraft>>(`${this.sourceUrl(id, source)}/draft`)
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

  /** Every video on a connected channel (up to `max`) with what its details are missing. */
  checkup(channelId: string, max = 100): Observable<YouTubeCheckup> {
    return this.http
      .get<ApiResponse<YouTubeCheckup>>(`${this.base}/channels/${encodeURIComponent(channelId)}/checkup`, { params: { max } })
      .pipe(map((r) => r.data as YouTubeCheckup));
  }

  /** AI-written details for a video already on the channel. Saves nothing. */
  suggestForVideo(channelId: string, videoId: string, params: YouTubeSuggestParams): Observable<YouTubeSuggestion> {
    return this.http
      .post<ApiResponse<YouTubeSuggestion>>(
        `${this.base}/channels/${encodeURIComponent(channelId)}/videos/${encodeURIComponent(videoId)}/suggest`, params)
      .pipe(map((r) => r.data as YouTubeSuggestion));
  }

  /** Fetches metadata + spoken transcript for any YouTube URL/Video ID (100% free) and generates the full SEO package. */
  generateSeoFromUrl(body: {
    url: string;
    language?: string;
    tone?: string;
    brief?: string;
    providerId?: string;
    channelId?: string | null;
  }): Observable<YouTubeUrlSeoResult> {
    return this.http
      .post<ApiResponse<YouTubeUrlSeoResult>>(`${this.base}/seo-from-url`, body)
      .pipe(map((r) => r.data as YouTubeUrlSeoResult));
  }

  /** Writes reviewed details onto a video on the channel and adds it to playlists. */
  saveVideoDetails(channelId: string, videoId: string, body: YouTubeVideoDetailsSave): Observable<YouTubeCheckupSaved> {
    return this.http
      .put<ApiResponse<YouTubeCheckupSaved>>(
        `${this.base}/channels/${encodeURIComponent(channelId)}/videos/${encodeURIComponent(videoId)}`, body)
      .pipe(map((r) => r.data as YouTubeCheckupSaved));
  }

  /** Has a private video go public at `publishAt` (ISO); null takes the schedule off and keeps it private. */
  scheduleVideo(channelId: string, videoId: string, publishAt: string | null): Observable<YouTubeScheduleSaved> {
    return this.http
      .put<ApiResponse<YouTubeScheduleSaved>>(
        `${this.base}/channels/${encodeURIComponent(channelId)}/videos/${encodeURIComponent(videoId)}/schedule`, { publishAt })
      .pipe(map((r) => r.data as YouTubeScheduleSaved));
  }

  /** Posts a comment as the channel on one of its videos (YouTube's API can't pin it). */
  postVideoComment(channelId: string, videoId: string, text: string): Observable<YouTubeCommentPosted> {
    return this.http
      .post<ApiResponse<YouTubeCommentPosted>>(
        `${this.base}/channels/${encodeURIComponent(channelId)}/videos/${encodeURIComponent(videoId)}/comment`, { text })
      .pipe(map((r) => r.data as YouTubeCommentPosted));
  }

  /** Reads one video (captions, music, chapters) and writes fresh details for it. Saves nothing. */
  inspectVideo(params: YouTubeInspectParams): Observable<YouTubeVideoInspection> {
    return this.http
      .post<ApiResponse<YouTubeVideoInspection>>(`${this.base}/details/inspect`, params)
      .pipe(map((r) => r.data as YouTubeVideoInspection));
  }

  /** The brand channel footer and tags, and the AnimStudio project, for the edit dialog. */
  videoContext(channelId: string, videoId: string): Observable<YouTubeVideoEditContext> {
    return this.http
      .get<ApiResponse<YouTubeVideoEditContext>>(
        `${this.base}/channels/${encodeURIComponent(channelId)}/videos/${encodeURIComponent(videoId)}/context`)
      .pipe(map((r) => r.data as YouTubeVideoEditContext));
  }

  /** Sets a new custom thumbnail on a video on the channel: an uploaded picture or a frame of its render. */
  setVideoThumbnail(channelId: string, videoId: string, choice: YouTubeThumbnailChoice): Observable<YouTubeThumbnailSaved> {
    return this.http
      .put<ApiResponse<YouTubeThumbnailSaved>>(
        `${this.base}/channels/${encodeURIComponent(channelId)}/videos/${encodeURIComponent(videoId)}/thumbnail`, choice)
      .pipe(map((r) => r.data as YouTubeThumbnailSaved));
  }

  /** `firstComment` is posted on the video once it is up; empty posts nothing. */
  publish(id: string, channelId: string, metadata: YouTubeVideoMetadata, relatedVideoIds: string[] = [],
          firstComment = '', source: YouTubePublishSource = 'render',
          thumbnail: YouTubeThumbnailChoice | null = null, planItemId: string | null = null): Observable<YouTubeUpload> {
    return this.http
      .post<ApiResponse<YouTubeUpload>>(`${this.sourceUrl(id, source)}/publish`,
        { channelId, metadata, relatedVideoIds, firstComment: firstComment || null, thumbnail, planItemId })
      .pipe(map((r) => r.data as YouTubeUpload));
  }

  /** One frame of the video as a small JPEG, for the thumbnail picker. */
  frame(id: string, atSeconds: number, source: YouTubePublishSource = 'render', width = 480): Observable<Blob> {
    const at = Math.max(0, Math.round(atSeconds * 1000) / 1000);
    return this.http.get(`${this.sourceUrl(id, source)}/frame?at=${at}&width=${width}`, { responseType: 'blob' });
  }

  private sourceUrl(id: string, source: YouTubePublishSource): string {
    return `${this.base}/${source === 'release' ? 'release-kits' : 'render-jobs'}/${encodeURIComponent(id)}`;
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

  // ------------------------------------------------------------------ send to phone

  /** The Drive a channel's videos go to (its own, or the personal one); no channel is the personal Drive. */
  driveStatus(channelId?: string | null): Observable<GoogleDriveStatus> {
    return this.http
      .get<ApiResponse<GoogleDriveStatus>>(`${this.base}/drive`, { params: channelParams(channelId) })
      .pipe(map((r) => r.data as GoogleDriveStatus));
  }

  /** The personal Drive, then what every connected channel uses. */
  driveConnections(): Observable<GoogleDriveStatus[]> {
    return this.http
      .get<ApiResponse<GoogleDriveStatus[]>>(`${this.base}/drive/connections`)
      .pipe(map((r) => r.data ?? []));
  }

  /**
   * Where to send the browser to approve Drive access - for one channel, or (no channel) the
   * personal Drive. Google returns to /youtube/callback too.
   */
  startDriveConnect(returnPath: string, channelId?: string | null): Observable<string> {
    return this.http
      .post<ApiResponse<{ authorizationUrl: string }>>(`${this.base}/drive/oauth/start`, { returnPath, channelId: channelId || null })
      .pipe(map((r) => r.data!.authorizationUrl));
  }

  completeDriveConnect(code: string, state: string): Observable<{ drive: GoogleDriveStatus; returnPath: string }> {
    return this.http
      .post<ApiResponse<{ drive: GoogleDriveStatus; returnPath: string }>>(`${this.base}/drive/oauth/complete`, { code, state })
      .pipe(map((r) => r.data!));
  }

  /** The default folder for a channel (on whichever Drive it uses), or the personal Drive's own. */
  setDriveFolder(folderName: string, channelId?: string | null): Observable<GoogleDriveStatus> {
    return this.http
      .put<ApiResponse<GoogleDriveStatus>>(`${this.base}/drive/folder`, { folderName, channelId: channelId || null })
      .pipe(map((r) => r.data as GoogleDriveStatus));
  }

  /** Folders AnimStudio made on the Drive a channel uses, its default first. */
  driveFolders(channelId?: string | null): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.base}/drive/folders`, { params: channelParams(channelId) })
      .pipe(map((r) => r.data ?? []));
  }

  /** Disconnects a channel's own Drive, or the personal one. */
  disconnectDrive(channelId?: string | null): Observable<unknown> {
    return this.http.delete(`${this.base}/drive`, { params: channelParams(channelId) });
  }

  /** Copies a finished render to the Drive (and folder) a channel uses; nothing goes to YouTube. */
  saveToDrive(jobId: string, body: { channelId?: string | null; folderName?: string | null }): Observable<PhoneHandoff> {
    return this.http
      .post<ApiResponse<PhoneHandoff>>(`${this.base}/render-jobs/${encodeURIComponent(jobId)}/save-to-drive`, {
        channelId: body.channelId || null,
        folderName: body.folderName || null,
      })
      .pipe(map((r) => r.data as PhoneHandoff));
  }

  /** Copies the render to Drive; its details are put on the YouTube-app upload once it appears. */
  sendToPhone(jobId: string, body: {
    channelId: string; metadata: YouTubeVideoMetadata; relatedVideoIds: string[]; firstComment: string | null;
    folderName: string | null; muteAudio: boolean;
  }): Observable<PhoneHandoff> {
    return this.http
      .post<ApiResponse<PhoneHandoff>>(`${this.base}/render-jobs/${encodeURIComponent(jobId)}/send-to-phone`, body)
      .pipe(map((r) => r.data as PhoneHandoff));
  }

  handoffs(jobId?: string): Observable<PhoneHandoff[]> {
    const query = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
    return this.http
      .get<ApiResponse<PhoneHandoff[]>>(`${this.base}/phone-handoffs${query}`)
      .pipe(map((r) => r.data ?? []));
  }

  handoff(id: string): Observable<PhoneHandoff> {
    return this.http
      .get<ApiResponse<PhoneHandoff>>(`${this.base}/phone-handoffs/${encodeURIComponent(id)}`)
      .pipe(map((r) => r.data as PhoneHandoff));
  }

  /** Looks for the phone upload now; applies the details if exactly one video fits, else lists them to pick. */
  checkHandoff(id: string): Observable<PhoneHandoffCheck> {
    return this.http
      .post<ApiResponse<PhoneHandoffCheck>>(`${this.base}/phone-handoffs/${encodeURIComponent(id)}/check`, {})
      .pipe(map((r) => r.data as PhoneHandoffCheck));
  }

  applyHandoff(id: string, videoId: string): Observable<PhoneHandoff> {
    return this.http
      .post<ApiResponse<PhoneHandoff>>(`${this.base}/phone-handoffs/${encodeURIComponent(id)}/apply`, { videoId })
      .pipe(map((r) => r.data as PhoneHandoff));
  }

  cancelHandoff(id: string): Observable<PhoneHandoff> {
    return this.http
      .post<ApiResponse<PhoneHandoff>>(`${this.base}/phone-handoffs/${encodeURIComponent(id)}/cancel`, {})
      .pipe(map((r) => r.data as PhoneHandoff));
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

/** `?channelId=` only when there is one: none means the personal Drive. */
function channelParams(channelId?: string | null): Record<string, string> {
  return channelId ? { channelId } : {};
}
