import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';

export type AnimateFormat = 'landscape' | 'vertical' | 'square';

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
}

/** The Animate Image page (api/animate). Nothing is stored on the server: the picture goes up, the MP4 comes back. */
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
}
