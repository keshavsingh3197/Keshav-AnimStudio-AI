import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiResponse, Asset, Character, IngestCapabilities, IngestResult, Project,
  RenderJob, RendererStatus, Scene, SceneGenerationResult,
} from '../models/api.models';

/**
 * Typed wrapper over the API.
 *
 * Every endpoint returns the same envelope, so unwrapping happens in one place and
 * components never deal with `{ success, data }`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // --- system
  rendererStatus(): Observable<RendererStatus> {
    return this.unwrap(this.http.get<ApiResponse<RendererStatus>>(`${this.base}/api/system/renderer`));
  }

  ingestCapabilities(): Observable<IngestCapabilities> {
    return this.unwrap(
      this.http.get<ApiResponse<IngestCapabilities>>(`${this.base}/api/ingest/capabilities`));
  }

  // --- projects
  listProjects(): Observable<Project[]> {
    return this.unwrap(this.http.get<ApiResponse<Project[]>>(`${this.base}/api/projects`));
  }

  createProject(name: string): Observable<Project> {
    return this.unwrap(
      this.http.post<ApiResponse<Project>>(`${this.base}/api/projects`, { name }));
  }

  // --- assets
  listAssets(projectId: string): Observable<Asset[]> {
    return this.unwrap(
      this.http.get<ApiResponse<Asset[]>>(`${this.base}/api/projects/${projectId}/assets`));
  }

  uploadAsset(projectId: string, file: File): Observable<Asset> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(
      this.http.post<ApiResponse<Asset>>(`${this.base}/api/projects/${projectId}/assets`, form));
  }

  // --- characters
  listCharacters(projectId: string): Observable<Character[]> {
    return this.unwrap(
      this.http.get<ApiResponse<Character[]>>(`${this.base}/api/projects/${projectId}/characters`));
  }

  createCharacter(projectId: string, body: Partial<Character>): Observable<Character> {
    return this.unwrap(
      this.http.post<ApiResponse<Character>>(
        `${this.base}/api/projects/${projectId}/characters`, body));
  }

  // --- ingest
  ingest(projectId: string, body: unknown): Observable<IngestResult> {
    return this.unwrap(
      this.http.post<ApiResponse<IngestResult>>(
        `${this.base}/api/projects/${projectId}/ingests`, body));
  }

  generateScenes(scriptId: string): Observable<SceneGenerationResult> {
    return this.unwrap(
      this.http.post<ApiResponse<SceneGenerationResult>>(
        `${this.base}/api/scripts/${scriptId}/generate-scenes`, {}));
  }

  listScenes(projectId: string): Observable<Scene[]> {
    return this.unwrap(
      this.http.get<ApiResponse<Scene[]>>(`${this.base}/api/projects/${projectId}/scenes`));
  }

  setAllBackgrounds(projectId: string, assetId: string): Observable<number> {
    return this.unwrap(
      this.http.put<ApiResponse<number>>(
        `${this.base}/api/projects/${projectId}/scenes/background`, { assetId }));
  }

  // --- rendering
  render(projectId: string): Observable<RenderJob> {
    return this.unwrap(
      this.http.post<ApiResponse<RenderJob>>(`${this.base}/api/projects/${projectId}/render`, {}));
  }

  job(jobId: string): Observable<RenderJob> {
    return this.unwrap(
      this.http.get<ApiResponse<RenderJob>>(`${this.base}/api/render-jobs/${jobId}`));
  }

  cancelJob(jobId: string): Observable<unknown> {
    return this.unwrap(
      this.http.post<ApiResponse<unknown>>(`${this.base}/api/render-jobs/${jobId}/cancel`, {}));
  }

  previewUrl(jobId: string): string {
    return `${this.base}/api/render-jobs/${jobId}/preview`;
  }

  downloadUrl(jobId: string): string {
    return `${this.base}/api/render-jobs/${jobId}/download`;
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
