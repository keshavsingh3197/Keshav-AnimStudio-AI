import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  MediaDownloadRequest,
  MediaDownloadResult,
  MediaProbeResponse,
  MediaSystemSettings,
  VideoChunkResult,
} from '../models/media-tools.models';

@Injectable({ providedIn: 'root' })
export class MediaToolsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  probeUrl(url: string): Observable<MediaProbeResponse> {
    return this.unwrap(
      this.http.post<ApiResponse<MediaProbeResponse>>(`${this.base}/api/media/probe`, { url })
    );
  }

  downloadMedia(req: MediaDownloadRequest): Observable<MediaDownloadResult> {
    return this.unwrap(
      this.http.post<ApiResponse<MediaDownloadResult>>(`${this.base}/api/media/download`, req)
    );
  }

  chunkVideo(formData: FormData): Observable<VideoChunkResult> {
    return this.unwrap(
      this.http.post<ApiResponse<VideoChunkResult>>(`${this.base}/api/media/chunk`, formData)
    );
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

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}

