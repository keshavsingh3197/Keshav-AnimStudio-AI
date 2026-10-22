import { HttpClient, HttpEventType, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { EffectClip, EffectQuery, EffectUpdate, EffectUpload, EffectUseResult } from '../models/effects.models';

/** The user's effects library (api/effects). Every call is scoped to the signed-in user on the server. */
@Injectable({ providedIn: 'root' })
export class EffectsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  list(query: EffectQuery = {}): Observable<EffectClip[]> {
    let params = new HttpParams();
    if (query.category) params = params.set('category', query.category);
    if (query.kind) params = params.set('kind', query.kind);
    if (query.q?.trim()) params = params.set('q', query.q.trim());
    if (query.favorites) params = params.set('favorites', 'true');
    return this.unwrap(this.http.get<ApiResponse<EffectClip[]>>(`${this.base}/api/effects`, { params }));
  }

  upload(body: EffectUpload, onProgress?: (percent: number) => void): Observable<EffectClip> {
    const form = new FormData();
    form.append('file', body.file, body.file.name);
    if (body.name?.trim()) form.append('name', body.name.trim());
    if (body.category) form.append('category', body.category);
    for (const tag of body.tags ?? []) form.append('tags', tag);
    if (body.isGreenScreen) form.append('isGreenScreen', 'true');

    return this.http.post<ApiResponse<EffectClip>>(`${this.base}/api/effects`, form, { reportProgress: true, observe: 'events' }).pipe(
      tap((event) => {
        if (onProgress && event.type === HttpEventType.UploadProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      }),
      filter((event): event is HttpResponse<ApiResponse<EffectClip>> => event.type === HttpEventType.Response),
      map((event) => event.body?.data as EffectClip),
    );
  }

  update(id: string, body: EffectUpdate): Observable<EffectClip> {
    return this.unwrap(this.http.put<ApiResponse<EffectClip>>(`${this.base}/api/effects/${encodeURIComponent(id)}`, body));
  }

  delete(id: string): Observable<unknown> {
    return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/api/effects/${encodeURIComponent(id)}`));
  }

  /** Copies the effect into the project (once) and returns the asset the editor places. */
  use(id: string, projectId: string): Observable<EffectUseResult> {
    return this.unwrap(this.http.post<ApiResponse<EffectUseResult>>(
      `${this.base}/api/effects/${encodeURIComponent(id)}/use`, { projectId }));
  }

  /** Saves a file already in the project to the library. */
  saveFromAsset(projectId: string, assetId: string): Observable<EffectClip> {
    return this.unwrap(this.http.post<ApiResponse<EffectClip>>(`${this.base}/api/effects/from-asset`, { projectId, assetId }));
  }

  contentUrl(id: string): string {
    return `${this.base}/api/effects/${encodeURIComponent(id)}/content`;
  }

  thumbnailUrl(effect: EffectClip): string | null {
    return effect.hasThumbnail ? `${this.base}/api/effects/${encodeURIComponent(effect.id)}/thumbnail` : null;
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
