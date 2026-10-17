import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { MusicImportResult, MusicOptions, MusicSearchParams, MusicSearchResult } from '../models/music.models';

@Injectable({ providedIn: 'root' })
export class MusicLibraryService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** Filters to offer, and whether search is set up on this server. */
  options(): Observable<MusicOptions> {
    return this.unwrap(this.http.get<ApiResponse<MusicOptions>>(`${this.base}/api/music/options`));
  }

  /** Results are checked against this project's licence settings on the server. */
  search(projectId: string, params: MusicSearchParams): Observable<MusicSearchResult> {
    let query = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '' && value !== false) query = query.set(key, String(value));
    }
    return this.unwrap(this.http.get<ApiResponse<MusicSearchResult>>(
      `${this.base}/api/projects/${encodeURIComponent(projectId)}/music/search`, { params: query }));
  }

  /** Adds the track to the project's library; optionally makes it the background music. */
  import(projectId: string, trackId: string, useAsBackground: boolean): Observable<MusicImportResult> {
    return this.unwrap(this.http.post<ApiResponse<MusicImportResult>>(
      `${this.base}/api/projects/${encodeURIComponent(projectId)}/music/import`, { trackId, useAsBackground }));
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
