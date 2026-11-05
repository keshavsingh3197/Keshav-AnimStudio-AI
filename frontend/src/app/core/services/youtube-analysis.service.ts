import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { ChannelAnalysis } from '../models/youtube-analysis.models';

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

  private channel(id: string): string {
    return `${this.base}/${encodeURIComponent(id)}`;
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
