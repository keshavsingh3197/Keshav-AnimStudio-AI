import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  ContentPlanItem, ContentPlanItemRequest, ContentPlanStatus, ContentRecovery, ContentSourceLink, ContentSourceLinkRequest,
  ContentTopic, ContentTopicRequest, ContentUploadCandidate,
} from '../models/calendar.models';

@Injectable({ providedIn: 'root' })
export class ContentCalendarService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/calendar`;

  // ---------------------------------------------------------------- topics

  listTopics(): Observable<ContentTopic[]> {
    return this.http.get<ApiResponse<ContentTopic[]>>(`${this.base}/topics`).pipe(map((r) => r.data ?? []));
  }

  createTopic(body: ContentTopicRequest): Observable<ContentTopic> {
    return this.http.post<ApiResponse<ContentTopic>>(`${this.base}/topics`, body).pipe(map((r) => r.data as ContentTopic));
  }

  updateTopic(id: string, body: ContentTopicRequest): Observable<ContentTopic> {
    return this.http
      .put<ApiResponse<ContentTopic>>(`${this.base}/topics/${encodeURIComponent(id)}`, body)
      .pipe(map((r) => r.data as ContentTopic));
  }

  deleteTopic(id: string, deletePosts: boolean): Observable<unknown> {
    return this.http.delete(`${this.base}/topics/${encodeURIComponent(id)}`, { params: { deletePosts } });
  }

  /** Adds the topic's next cadence posts now; returns how many were added. */
  planTopic(id: string): Observable<number> {
    return this.http
      .post<ApiResponse<number>>(`${this.base}/topics/${encodeURIComponent(id)}/plan`, {})
      .pipe(map((r) => r.data ?? 0));
  }

  // ---------------------------------------------------------------- posts

  listItems(from: Date, to: Date, topicId?: string): Observable<ContentPlanItem[]> {
    const params: Record<string, string> = { from: from.toISOString(), to: to.toISOString() };
    if (topicId) params['topicId'] = topicId;
    return this.http.get<ApiResponse<ContentPlanItem[]>>(`${this.base}/items`, { params }).pipe(map((r) => r.data ?? []));
  }

  getItem(id: string): Observable<ContentPlanItem> {
    return this.item(this.http.get<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}`));
  }

  createItem(body: ContentPlanItemRequest): Observable<ContentPlanItem> {
    return this.http.post<ApiResponse<ContentPlanItem>>(`${this.base}/items`, body).pipe(map((r) => r.data as ContentPlanItem));
  }

  updateItem(id: string, body: ContentPlanItemRequest): Observable<ContentPlanItem> {
    return this.http
      .put<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}`, body)
      .pipe(map((r) => r.data as ContentPlanItem));
  }

  setStatus(id: string, status: ContentPlanStatus): Observable<ContentPlanItem> {
    return this.http
      .put<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}/status`, { status })
      .pipe(map((r) => r.data as ContentPlanItem));
  }

  deleteItem(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/items/${encodeURIComponent(id)}`);
  }

  // ---------------------------------------------------------------- when a post won't be ready

  recovery(id: string): Observable<ContentRecovery> {
    return this.http
      .get<ApiResponse<ContentRecovery>>(`${this.base}/items/${encodeURIComponent(id)}/recovery`)
      .pipe(map((r) => r.data ?? { nextFreeAt: null, swapWith: [] }));
  }

  /** Moves the post to `publishAt`, or to the topic's next free day when omitted. */
  postpone(id: string, publishAt?: string): Observable<ContentPlanItem> {
    return this.item(this.http.post<ApiResponse<ContentPlanItem>>(
      `${this.base}/items/${encodeURIComponent(id)}/postpone`, { publishAt: publishAt ?? null }));
  }

  /** Trades days with another post of the same topic; returns both. */
  swap(id: string, otherId: string): Observable<ContentPlanItem[]> {
    return this.http
      .post<ApiResponse<ContentPlanItem[]>>(`${this.base}/items/${encodeURIComponent(id)}/swap`, { otherId })
      .pipe(map((r) => r.data ?? []));
  }

  // ---------------------------------------------------------------- the YouTube video

  linkVideo(id: string, video: string): Observable<ContentPlanItem> {
    return this.item(this.http.put<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}/video`, { video }));
  }

  unlinkVideo(id: string): Observable<ContentPlanItem> {
    return this.item(this.http.delete<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}/video`));
  }

  confirmVideo(id: string): Observable<ContentPlanItem> {
    return this.item(this.http.post<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}/video/confirm`, {}));
  }

  syncVideo(id: string): Observable<ContentPlanItem> {
    return this.item(this.http.post<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}/video/sync`, {}));
  }

  /** Makes the video private with YouTube publishing it at the planned time. */
  scheduleVideo(id: string): Observable<ContentPlanItem> {
    return this.item(this.http.post<ApiResponse<ContentPlanItem>>(`${this.base}/items/${encodeURIComponent(id)}/video/schedule`, {}));
  }

  candidates(id: string): Observable<ContentUploadCandidate[]> {
    return this.http
      .get<ApiResponse<ContentUploadCandidate[]>>(`${this.base}/items/${encodeURIComponent(id)}/video/candidates`)
      .pipe(map((r) => r.data ?? []));
  }

  // ---------------------------------------------------------------- source links

  listLinks(topicId?: string, planItemId?: string): Observable<ContentSourceLink[]> {
    const params: Record<string, string> = {};
    if (topicId) params['topicId'] = topicId;
    if (planItemId) params['planItemId'] = planItemId;
    return this.http.get<ApiResponse<ContentSourceLink[]>>(`${this.base}/links`, { params }).pipe(map((r) => r.data ?? []));
  }

  addLink(body: ContentSourceLinkRequest): Observable<ContentSourceLink> {
    return this.http.post<ApiResponse<ContentSourceLink>>(`${this.base}/links`, body).pipe(map((r) => r.data as ContentSourceLink));
  }

  updateLink(id: string, body: ContentSourceLinkRequest): Observable<ContentSourceLink> {
    return this.http
      .put<ApiResponse<ContentSourceLink>>(`${this.base}/links/${encodeURIComponent(id)}`, body)
      .pipe(map((r) => r.data as ContentSourceLink));
  }

  deleteLink(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/links/${encodeURIComponent(id)}`);
  }

  private item(request: Observable<ApiResponse<ContentPlanItem>>): Observable<ContentPlanItem> {
    return request.pipe(map((r) => r.data as ContentPlanItem));
  }
}
