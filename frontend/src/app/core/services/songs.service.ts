import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';

export interface Song {
  id: string;
  title: string;
  theme?: string | null;
  language: 'hi' | 'en';
  style: string;
  mood?: string | null;
  lyrics?: string | null;
  instrumental: boolean;
  model: string;
  mimeType: string;
  durationSeconds?: number | null;
  sourcePostId?: string | null;
  createdAtUtc: string;
}

export interface SongList {
  songs: Song[];
  /** False until Google Gemini speech (which carries Lyria) is set up in Settings → AI providers. */
  composerConfigured: boolean;
  maxLyricsChars: number;
}

export interface SongLyricsDraft {
  title: string;
  lyrics: string;
  musicStyle?: string | null;
  provider: string;
}

export interface ComposeSongBody {
  title: string;
  theme?: string | null;
  language: 'hi' | 'en';
  style: string;
  mood?: string | null;
  lyrics?: string | null;
  instrumental: boolean;
  /** True: a complete song (Lyria 3 Pro). False: a 30-second clip (Lyria 3 Clip). */
  fullLength: boolean;
  sourcePostId?: string | null;
}

/** What the Auto Post page hands to the Songs page through router state. */
export interface SongSeed {
  title?: string;
  theme?: string;
  language?: 'hi' | 'en';
  postId?: string;
}

@Injectable({ providedIn: 'root' })
export class SongsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/songs`;

  list(): Observable<SongList> {
    return this.unwrap(this.http.get<ApiResponse<SongList>>(this.base));
  }

  writeLyrics(body: { theme: string; language: 'hi' | 'en'; style: string; mood?: string | null }): Observable<SongLyricsDraft> {
    return this.unwrap(this.http.post<ApiResponse<SongLyricsDraft>>(`${this.base}/lyrics`, body));
  }

  compose(body: ComposeSongBody): Observable<Song> {
    return this.unwrap(this.http.post<ApiResponse<Song>>(this.base, body));
  }

  /** Fetched through HttpClient, not an <audio src>, so the request carries the caller's identity. */
  audio(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${encodeURIComponent(id)}/audio`, { responseType: 'blob' });
  }

  delete(id: string): Observable<boolean> {
    return this.unwrap(this.http.delete<ApiResponse<boolean>>(`${this.base}/${encodeURIComponent(id)}`));
  }

  private unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(
      map((res) => {
        if (!res.success) throw new Error(res.message || res.errors?.[0]?.message || 'Request failed');
        return res.data as T;
      })
    );
  }
}
