import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';

export type AnimateFormat = 'landscape' | 'vertical' | 'square';
export type ProceduralResolution = '720p' | '1080p';
export type ProceduralSceneTheme =
  | 'Auto'
  | 'VedicTempleSunrise3D'
  | 'CosmosSacred3D'
  | 'HistoryChronicle3D'
  | 'NeonCyberGrid3D'
  | 'SereneNatureGlow';

export interface ProceduralThemePreset {
  id: string;
  theme: ProceduralSceneTheme;
  name: string;
  bestFor: string;
  accentHex: string;
  description: string;
}

export interface ProceduralVideoGenerationRequest {
  title: string;
  prompt?: string | null;
  script?: string | null;
  theme: ProceduralSceneTheme;
  format: AnimateFormat;
  resolution: ProceduralResolution;
  durationSeconds: number;
  includeCaptions: boolean;
  includeAmbientAudio: boolean;
  language: string;
  footerLabel?: string | null;
  saveAsRenderJob?: boolean;
}

export interface ProceduralVideoResponse {
  renderJobId: string | null;
  projectId: string | null;
  resolvedTheme: ProceduralSceneTheme;
  themeDisplayName: string;
  width: number;
  height: number;
  durationSeconds: number;
  sizeBytes: number;
  previewUrl: string | null;
  downloadUrl: string | null;
  summary: string;
}

/** How a still moves and looks. Focus is percent of the frame, as the editor's image clips use. */
export interface AnimatePlan {
  motion: string;
  intensity: number;
  focusX: number;
  focusY: number;
  easing: string;
  look: string;
  vignette: boolean;
  grain: boolean;
  cinemaBars: boolean;
  durationSeconds: number;
  format: AnimateFormat;
  summary: string;
}

export interface AnimatePlanResult extends AnimatePlan {
  /** The AI provider that planned it, or `built-in` for the keyword reader. */
  plannedBy: string;
  note: string | null;
}

export interface AnimateCapabilities {
  rendererAvailable: boolean;
  rendererUnavailableReason: string | null;
  minSeconds: number;
  maxSeconds: number;
  maxImageBytes: number;
  motions: string[];
  looks: string[];
  formats: AnimateFormat[];
  proceduralThemes?: ProceduralThemePreset[];
  proceduralMinSeconds?: number;
  proceduralMaxSeconds?: number;
}

/** The Animate Image & Procedural 3D Generator page (api/animate). */
@Injectable({ providedIn: 'root' })
export class AnimateService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  capabilities(): Observable<AnimateCapabilities> {
    return this.http.get<ApiResponse<AnimateCapabilities>>(`${this.base}/api/animate/capabilities`)
      .pipe(map((r) => r.data as AnimateCapabilities));
  }

  plan(description: string, useAi: boolean, format: AnimateFormat | null): Observable<AnimatePlanResult> {
    return this.http.post<ApiResponse<AnimatePlanResult>>(`${this.base}/api/animate/plan`, { description, useAi, format })
      .pipe(map((r) => r.data as AnimatePlanResult));
  }

  render(file: File, plan: AnimatePlan): Observable<Blob> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('motion', plan.motion);
    form.append('intensity', String(plan.intensity));
    form.append('focusX', String(plan.focusX));
    form.append('focusY', String(plan.focusY));
    form.append('easing', plan.easing);
    form.append('look', plan.look);
    form.append('vignette', String(plan.vignette));
    form.append('grain', String(plan.grain));
    form.append('cinemaBars', String(plan.cinemaBars));
    form.append('durationSeconds', String(plan.durationSeconds));
    form.append('format', plan.format);
    return this.http.post(`${this.base}/api/animate/render`, form, { responseType: 'blob' });
  }

  generateProceduralVideo(request: ProceduralVideoGenerationRequest): Observable<Blob> {
    return this.http.post(`${this.base}/api/animate/generate-video`, request, { responseType: 'blob' });
  }

  generateProceduralRenderJob(request: ProceduralVideoGenerationRequest): Observable<ProceduralVideoResponse> {
    return this.http.post<ApiResponse<ProceduralVideoResponse>>(
      `${this.base}/api/animate/generate-render-job`,
      request
    ).pipe(map((r) => r.data as ProceduralVideoResponse));
  }
}
