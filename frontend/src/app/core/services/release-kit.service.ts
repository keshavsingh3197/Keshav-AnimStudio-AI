import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { ReleaseKitOptions, ReleaseKitResult, ReleaseMetadata } from '../models/release-kit.models';

@Injectable({ providedIn: 'root' })
export class ReleaseKitService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  buildKit(
    audio: File,
    cover: File | null,
    metadata: ReleaseMetadata,
    options: ReleaseKitOptions,
  ): Observable<ReleaseKitResult> {
    const form = new FormData();
    form.append('audio', audio, audio.name);
    if (cover) form.append('cover', cover, cover.name);
    form.append('metadata', JSON.stringify(metadata));
    form.append('options', JSON.stringify(options));

    return this.http
      .post<ApiResponse<ReleaseKitResult>>(`${this.base}/api/releases/kits`, form)
      .pipe(map((response) => this.absolute(response.data as ReleaseKitResult)));
  }

  /** Fetched through HttpClient, not a plain link, so the download carries the same auth as every call. */
  fetchFile(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }

  private absolute(result: ReleaseKitResult): ReleaseKitResult {
    const fix = (url: string) => (url.startsWith('/') ? `${this.base}${url}` : url);
    return {
      ...result,
      zipDownloadUrl: fix(result.zipDownloadUrl),
      files: result.files.map((f) => ({ ...f, downloadUrl: fix(f.downloadUrl) })),
    };
  }
}
