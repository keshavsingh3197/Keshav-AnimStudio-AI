import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';

export type WebSettingType = 'Boolean' | 'Integer' | 'Number' | 'Text' | 'Choice' | 'Url';

export interface WebSetting {
  key: string;
  group: string;
  label: string;
  description: string;
  type: WebSettingType;
  appliesLive: boolean;
  min?: number;
  max?: number;
  choices?: string[];
  maxLength: number;
  /** From appsettings.json / the environment: what Reset goes back to. */
  fileValue?: string;
  /** Set from this console (the WebSettings table), or null. */
  storedValue?: string;
  effectiveValue?: string;
  pendingRestart: boolean;
  updatedAt?: string;
  updatedByUserId?: string;
}

export interface WebSettingsOverview {
  settings: WebSetting[];
  loadedAt?: string;
  pendingRestartCount: number;
}

/** A brand channel's YouTube publishing setup. */
export interface ChannelPublishSettings {
  youTubeChannelId: string | null;
  youTubeChannelTitle: string | null;
  privacy: 'public' | 'unlisted' | 'private';
  categoryId: string;
  madeForKids: boolean;
  notifySubscribers: boolean;
  tags: string[];
  descriptionFooter: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin`;

  list(): Observable<WebSettingsOverview> {
    return this.http.get<ApiResponse<WebSettingsOverview>>(`${this.base}/settings`).pipe(map((r) => r.data!));
  }

  set(key: string, value: string): Observable<WebSettingsOverview> {
    return this.http.put<ApiResponse<WebSettingsOverview>>(`${this.base}/settings`, { key, value }).pipe(map((r) => r.data!));
  }

  reset(key: string): Observable<WebSettingsOverview> {
    return this.http.post<ApiResponse<WebSettingsOverview>>(`${this.base}/settings/reset`, { key }).pipe(map((r) => r.data!));
  }

  /** Re-reads the WebSettings table and applies it without a restart. */
  refresh(): Observable<WebSettingsOverview> {
    return this.http.post<ApiResponse<WebSettingsOverview>>(`${this.base}/settings/refresh`, {}).pipe(map((r) => r.data!));
  }

  publishing(channel: string | null): Observable<ChannelPublishSettings> {
    return this.http
      .get<ApiResponse<ChannelPublishSettings>>(`${this.base}/branding/publishing${channelQuery(channel)}`)
      .pipe(map((r) => r.data!));
  }

  savePublishing(channel: string | null, body: ChannelPublishSettings): Observable<ChannelPublishSettings> {
    return this.http
      .put<ApiResponse<ChannelPublishSettings>>(`${this.base}/branding/publishing${channelQuery(channel)}`, body)
      .pipe(map((r) => r.data!));
  }
}

function channelQuery(channel: string | null): string {
  return channel ? `?channel=${encodeURIComponent(channel)}` : '';
}
