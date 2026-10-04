import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  MediaDownloadRequest,
  MediaDownloadResult,
  MediaProbeResponse,
  MediaSources,
  MediaSystemSettings,
  VideoChunkResult,
} from '../models/media-tools.models';

@Injectable({ providedIn: 'root' })
export class MediaToolsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** Supported sites and whether the downloader (yt-dlp) is installed. */
  getSources(): Observable<MediaSources> {
    return this.unwrap(this.http.get<ApiResponse<MediaSources>>(`${this.base}/api/media/sources`));
  }

  /** Fetches a finished download through HttpClient, so it carries the same auth as every call. */
  fetchFile(streamUrl: string): Observable<Blob> {
    return this.http.get(streamUrl, { responseType: 'blob' });
  }

  probeUrl(url: string): Observable<MediaProbeResponse> {
    return this.unwrap(
      this.http.post<ApiResponse<MediaProbeResponse>>(`${this.base}/api/media/probe`, { url })
    );
  }

  downloadMedia(req: MediaDownloadRequest): Observable<MediaDownloadResult> {
    return this.unwrap(
      this.http.post<ApiResponse<MediaDownloadResult>>(`${this.base}/api/media/download`, req)
    ).pipe(map((r) => ({
      ...r,
      streamUrl: r.streamUrl?.startsWith('/') ? `${this.base}${r.streamUrl}` : r.streamUrl,
    })));
  }

  chunkVideo(formData: FormData): Observable<VideoChunkResult> {
    return this.unwrap(
      this.http.post<ApiResponse<VideoChunkResult>>(`${this.base}/api/media/chunk`, formData)
    ).pipe(map((result) => this.rewriteChunkUrls(result)));
  }

  getMediaSettings(): Observable<MediaSystemSettings> {
    return this.unwrap(
      this.http.get<ApiResponse<MediaSystemSettings>>(`${this.base}/api/system/media-settings`)
    );
  }

  updateChunkDuration(durationSeconds: number): Observable<number> {
    return this.unwrap(
      this.http.put<ApiResponse<number>>(`${this.base}/api/system/chunk-duration`, {
        defaultChunkDurationSeconds: durationSeconds,
      })
    );
  }

  getZipDownloadUrl(jobId: string): string {
    return `${this.base}/api/media/chunks/${jobId}/zip`;
  }

  getChunkStreamUrl(jobId: string, index: number): string {
    return `${this.base}/api/media/chunks/${jobId}/${index}`;
  }

  /** Make sure all relative /api/... stream URLs from the backend get the full origin prefix
   *  so <video src> loads from the correct backend port, not the Angular dev-server port (4200). */
  private rewriteChunkUrls(result: VideoChunkResult): VideoChunkResult {
    const base = this.base;
    return {
      ...result,
      zipDownloadUrl: result.zipDownloadUrl?.startsWith('/')
        ? `${base}${result.zipDownloadUrl}` : result.zipDownloadUrl,
      chunks: result.chunks.map((c) => ({
        ...c,
        streamUrl: c.streamUrl?.startsWith('/')
          ? `${base}${c.streamUrl}` : c.streamUrl,
      })),
    };
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
