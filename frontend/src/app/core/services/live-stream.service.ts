import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  CameraStreamSettings,
  CameraStreamStatus,
  LiveStreamGoLive,
  LiveStreamItemRequest,
  LiveStreamKeyStatus,
  LiveStreamSettings,
  LiveStreamSetup,
  LiveStreamStatus,
  PlaylistEntry,
  YouTubeAudienceStats,
} from '../models/live-stream.models';

@Injectable({ providedIn: 'root' })
export class LiveStreamService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/live-streams`;

  setup(): Observable<LiveStreamSetup> {
    return this.http
      .get<ApiResponse<LiveStreamSetup>>(`${this.base}/setup`)
      .pipe(map((r) => r.data as LiveStreamSetup));
  }

  list(): Observable<LiveStreamStatus[]> {
    return this.http.get<ApiResponse<LiveStreamStatus[]>>(this.base).pipe(map((r) => r.data ?? []));
  }

  /**
   * Sends the playlist to be prepared. Files go as numbered parts (file0, cover0, ...) and
   * each item names its parts; nothing about the user's file names decides a server path.
   * The stream key, when given, travels only in this request body - never in a URL, where
   * it would end up in server and proxy logs, and never in browser storage.
   */
  create(entries: PlaylistEntry[], settings: LiveStreamSettings, goLive?: LiveStreamGoLive): Observable<LiveStreamStatus> {
    const form = new FormData();
    const items: LiveStreamItemRequest[] = entries.map((entry, i) => {
      const item: LiveStreamItemRequest = { source: entry.source, title: entry.title || undefined };
      switch (entry.source) {
        case 'Upload':
          item.fileField = `file${i}`;
          form.append(item.fileField, entry.file!, entry.file!.name);
          if (entry.cover) {
            item.coverField = `cover${i}`;
            form.append(item.coverField, entry.cover, entry.cover.name);
          }
          break;
        case 'Render':
          item.renderJobId = entry.renderJobId;
          break;
        case 'Asset':
          item.assetId = entry.assetId;
          item.coverAssetId = entry.coverAssetId;
          break;
        case 'Url':
          item.url = entry.url;
          item.audioOnly = entry.audioOnly;
          break;
        case 'ReleaseKit':
          item.releaseKitId = entry.releaseKitId;
          item.useVisualizer = entry.useVisualizer;
          break;
      }
      return item;
    });

    form.append('settings', JSON.stringify(settings));
    form.append('items', JSON.stringify(items));
    if (goLive) form.append('goLive', JSON.stringify(goLive));

    return this.http
      .post<ApiResponse<LiveStreamStatus>>(this.base, form)
      .pipe(map((r) => r.data as LiveStreamStatus));
  }

  goLive(id: string, goLive: LiveStreamGoLive): Observable<LiveStreamStatus> {
    return this.http
      .post<ApiResponse<LiveStreamStatus>>(`${this.base}/${encodeURIComponent(id)}/go-live`, goLive)
      .pipe(map((r) => r.data as LiveStreamStatus));
  }

  stop(id: string): Observable<LiveStreamStatus> {
    return this.http
      .post<ApiResponse<LiveStreamStatus>>(`${this.base}/${encodeURIComponent(id)}/stop`, {})
      .pipe(map((r) => r.data as LiveStreamStatus));
  }

  discard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }

  /** A prepared item exactly as it will be sent - usable directly as a <video> source. */
  previewUrl(id: string, index: number): string {
    return `${this.base}/${encodeURIComponent(id)}/items/${index}/preview`;
  }

  /** Admin only. The key goes in the body and comes back masked. */
  saveKey(channelId: string, destinationId: string, streamKey: string): Observable<LiveStreamKeyStatus> {
    return this.http
      .put<ApiResponse<LiveStreamKeyStatus>>(
        `${this.base}/keys/${encodeURIComponent(channelId)}/${encodeURIComponent(destinationId)}`, { streamKey })
      .pipe(map((r) => r.data as LiveStreamKeyStatus));
  }

  deleteKey(channelId: string, destinationId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/keys/${encodeURIComponent(channelId)}/${encodeURIComponent(destinationId)}`);
  }

  // ------------------------------------------------------------------ camera / screen

  /** Starts the server's encoder. As with a playlist, a pasted key travels only in this body. */
  startCamera(settings: CameraStreamSettings, goLive: LiveStreamGoLive): Observable<CameraStreamStatus> {
    return this.http
      .post<ApiResponse<CameraStreamStatus>>(`${this.base}/camera`, { settings, goLive })
      .pipe(map((r) => r.data as CameraStreamStatus));
  }

  cameraStreams(): Observable<CameraStreamStatus[]> {
    return this.http.get<ApiResponse<CameraStreamStatus[]>>(`${this.base}/camera`).pipe(map((r) => r.data ?? []));
  }

  cameraStream(id: string): Observable<CameraStreamStatus> {
    return this.http
      .get<ApiResponse<CameraStreamStatus>>(`${this.base}/camera/${encodeURIComponent(id)}`)
      .pipe(map((r) => r.data as CameraStreamStatus));
  }

  /** One numbered chunk of the recording. Safe to retry: the server acknowledges a repeat without writing it twice. */
  sendCameraChunk(id: string, generation: number, sequence: number, chunk: Blob): Observable<CameraStreamStatus> {
    const params = new HttpParams().set('generation', generation).set('sequence', sequence);
    return this.http
      .post<ApiResponse<CameraStreamStatus>>(`${this.base}/camera/${encodeURIComponent(id)}/chunks`, chunk, {
        params,
        headers: { 'Content-Type': 'application/octet-stream' },
      })
      .pipe(map((r) => r.data as CameraStreamStatus));
  }

  stopCamera(id: string): Observable<CameraStreamStatus> {
    return this.http
      .post<ApiResponse<CameraStreamStatus>>(`${this.base}/camera/${encodeURIComponent(id)}/stop`, {})
      .pipe(map((r) => r.data as CameraStreamStatus));
  }

  /** Public subscriber / live viewer numbers, looked up by the server so the API key never reaches the browser. */
  audience(channel?: string, video?: string): Observable<YouTubeAudienceStats> {
    let params = new HttpParams();
    if (channel) params = params.set('channel', channel);
    if (video) params = params.set('video', video);
    return this.http
      .get<ApiResponse<YouTubeAudienceStats>>(`${this.base}/audience`, { params })
      .pipe(map((r) => r.data as YouTubeAudienceStats));
  }
}
