import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { ChannelAnalysis, VideoLookup } from '../models/youtube-analysis.models';

/**
 * Channel analysis. Reading it costs nothing outside the app: what was found is kept on the server. Refresh reads the
 * numbers from YouTube again (at most every half hour); a plan asks the text model only when the numbers or the goal changed.
 */
@Injectable({ providedIn: 'root' })
export class YouTubeAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/youtube/analysis`;

  list(): Observable<ChannelAnalysis[]> {
    return this.unwrap(this.http.get<ApiResponse<ChannelAnalysis[]>>(this.base));
  }

  refresh(channelId: string): Observable<ChannelAnalysis> {
    return this.unwrap(this.http.post<ApiResponse<ChannelAnalysis>>(`${this.channel(channelId)}/refresh`, {}));
  }

  /** The advice and the plan. With the same numbers and goal the kept plan comes back, unless fresh. */
  plan(channelId: string, goal: string | null, fresh = false): Observable<ChannelAnalysis> {
    return this.unwrap(this.http.post<ApiResponse<ChannelAnalysis>>(`${this.channel(channelId)}/plan`, { goal, fresh }));
  }

  /** Looks up one video by link or id. Asked again within a few hours, the kept answer comes back unless fresh. */
  lookup(channelId: string, link: string, fresh = false): Observable<VideoLookup> {
    return this.unwrap(this.http.post<ApiResponse<VideoLookup>>(`${this.channel(channelId)}/videos/lookup`, { link, fresh }));
  }

  /** A video looked up before, with its day-by-day numbers. Calls nothing outside the app. */
  getLookup(channelId: string, videoId: string): Observable<VideoLookup> {
    return this.unwrap(this.http.get<ApiResponse<VideoLookup>>(`${this.channel(channelId)}/videos/${encodeURIComponent(videoId)}`));
  }

  removeLookup(channelId: string, videoId: string): Observable<unknown> {
    return this.http.delete(`${this.channel(channelId)}/videos/${encodeURIComponent(videoId)}`);
  }

  private channel(id: string): string {
    return `${this.base}/${encodeURIComponent(id)}`;
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
