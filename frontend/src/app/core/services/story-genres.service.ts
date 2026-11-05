import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { StoryGenre, StoryGenresPage } from '../models/story-genre.models';

/** The Story Agent's genres, for the admin console. Every call is behind the server's admin policy. */
@Injectable({ providedIn: 'root' })
export class StoryGenresService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin/story-genres`;

  list(): Observable<StoryGenresPage> {
    return this.http.get<ApiResponse<StoryGenresPage>>(this.base).pipe(map((r) => r.data!));
  }

  create(genre: StoryGenre): Observable<StoryGenre> {
    return this.http.post<ApiResponse<StoryGenre>>(this.base, genre).pipe(map((r) => r.data!));
  }

  update(genre: StoryGenre): Observable<StoryGenre> {
    return this.http.put<ApiResponse<StoryGenre>>(`${this.base}/${encodeURIComponent(genre.id)}`, genre).pipe(map((r) => r.data!));
  }

  /** Deletes a genre an administrator made, or resets a built-in one; returns what is left (the reset genre) or null. */
  remove(id: string): Observable<StoryGenre | null> {
    return this.http.delete<ApiResponse<StoryGenre | null>>(`${this.base}/${encodeURIComponent(id)}`).pipe(map((r) => r.data ?? null));
  }
}
