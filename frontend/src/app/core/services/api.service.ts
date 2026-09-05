import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiResponse, Asset, Character, CharacterBody, CreateProjectBody, CreateSceneBody,
  DialogueBody, IngestCapabilities, IngestResult, IngestSummary, PlacementBody, Project,
  RenderJob, RendererStatus, Scene, SceneAudioBody, SceneDetail, SceneGenerationResult,
  ScriptDetail, ScriptSummary, UpdateProjectBody, UpdateSceneBody,
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

  getProject(projectId: string): Observable<Project> {
    return this.unwrap(
      this.http.get<ApiResponse<Project>>(`${this.base}/api/projects/${projectId}`));
  }

  createProject(body: CreateProjectBody): Observable<Project> {
    return this.unwrap(this.http.post<ApiResponse<Project>>(`${this.base}/api/projects`, body));
  }

  updateProject(projectId: string, body: UpdateProjectBody): Observable<Project> {
    return this.unwrap(
      this.http.put<ApiResponse<Project>>(`${this.base}/api/projects/${projectId}`, body));
  }

  deleteProject(projectId: string): Observable<unknown> {
    return this.unwrap(
      this.http.delete<ApiResponse<unknown>>(`${this.base}/api/projects/${projectId}`));
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

  deleteAsset(assetId: string): Observable<unknown> {
    return this.unwrap(
      this.http.delete<ApiResponse<unknown>>(`${this.base}/api/assets/${assetId}`));
  }

  /** Direct URL to the stored bytes, for an <img> or an <audio> element. */
  assetUrl(assetId: string): string {
    return `${this.base}/api/assets/${assetId}/content`;
  }

  // --- characters
  listCharacters(projectId: string): Observable<Character[]> {
    return this.unwrap(
      this.http.get<ApiResponse<Character[]>>(`${this.base}/api/projects/${projectId}/characters`));
  }

  createCharacter(projectId: string, body: CharacterBody): Observable<Character> {
    return this.unwrap(
      this.http.post<ApiResponse<Character>>(
        `${this.base}/api/projects/${projectId}/characters`, body));
  }

  updateCharacter(characterId: string, body: CharacterBody): Observable<Character> {
    return this.unwrap(
      this.http.put<ApiResponse<Character>>(`${this.base}/api/characters/${characterId}`, body));
  }

  deleteCharacter(characterId: string): Observable<number> {
    return this.unwrap(
      this.http.delete<ApiResponse<number>>(`${this.base}/api/characters/${characterId}`));
  }

  // --- ingest
  ingest(projectId: string, body: unknown): Observable<IngestResult> {
    return this.unwrap(
      this.http.post<ApiResponse<IngestResult>>(
        `${this.base}/api/projects/${projectId}/ingests`, body));
  }

  /** Past imports, newest first - including the ones that failed. */
  listIngests(projectId: string): Observable<IngestSummary[]> {
    return this.unwrap(
      this.http.get<ApiResponse<IngestSummary[]>>(`${this.base}/api/projects/${projectId}/ingests`));
  }

  listScripts(projectId: string): Observable<ScriptSummary[]> {
    return this.unwrap(
      this.http.get<ApiResponse<ScriptSummary[]>>(`${this.base}/api/projects/${projectId}/scripts`));
  }

  getScript(scriptId: string): Observable<ScriptDetail> {
    return this.unwrap(
      this.http.get<ApiResponse<ScriptDetail>>(`${this.base}/api/scripts/${scriptId}`));
  }

  generateScenes(scriptId: string): Observable<SceneGenerationResult> {
    return this.unwrap(
      this.http.post<ApiResponse<SceneGenerationResult>>(
        `${this.base}/api/scripts/${scriptId}/generate-scenes`, {}));
  }

  // --- scenes
  listScenes(projectId: string): Observable<Scene[]> {
    return this.unwrap(
      this.http.get<ApiResponse<Scene[]>>(`${this.base}/api/projects/${projectId}/scenes`));
  }

  getScene(sceneId: string): Observable<SceneDetail> {
    return this.unwrap(
      this.http.get<ApiResponse<SceneDetail>>(`${this.base}/api/scenes/${sceneId}`));
  }

  createScene(projectId: string, body: CreateSceneBody): Observable<SceneDetail> {
    return this.unwrap(
      this.http.post<ApiResponse<SceneDetail>>(
        `${this.base}/api/projects/${projectId}/scenes`, body));
  }

  updateScene(sceneId: string, body: UpdateSceneBody): Observable<SceneDetail> {
    return this.unwrap(
      this.http.put<ApiResponse<SceneDetail>>(`${this.base}/api/scenes/${sceneId}`, body));
  }

  deleteScene(sceneId: string): Observable<unknown> {
    return this.unwrap(
      this.http.delete<ApiResponse<unknown>>(`${this.base}/api/scenes/${sceneId}`));
  }

  reorderScenes(projectId: string, sceneIds: string[]): Observable<Scene[]> {
    return this.unwrap(
      this.http.put<ApiResponse<Scene[]>>(
        `${this.base}/api/projects/${projectId}/scenes/order`, { sceneIds }));
  }

  setSceneBackground(sceneId: string, assetId: string): Observable<SceneDetail> {
    return this.unwrap(
      this.http.put<ApiResponse<SceneDetail>>(
        `${this.base}/api/scenes/${sceneId}/background`, { assetId }));
  }

  setAllBackgrounds(projectId: string, assetId: string): Observable<number> {
    return this.unwrap(
      this.http.put<ApiResponse<number>>(
        `${this.base}/api/projects/${projectId}/scenes/background`, { assetId }));
  }

  setSceneAudio(sceneId: string, body: SceneAudioBody): Observable<SceneDetail> {
    return this.unwrap(
      this.http.put<ApiResponse<SceneDetail>>(`${this.base}/api/scenes/${sceneId}/audio`, body));
  }

  setAllAudio(projectId: string, assetId: string): Observable<number> {
    return this.unwrap(
      this.http.put<ApiResponse<number>>(
        `${this.base}/api/projects/${projectId}/scenes/audio`, { assetId }));
  }

  addDialogue(sceneId: string, body: DialogueBody): Observable<SceneDetail> {
    return this.unwrap(
      this.http.post<ApiResponse<SceneDetail>>(
        `${this.base}/api/scenes/${sceneId}/dialogue`, body));
  }

  updateDialogue(sceneId: string, index: number, body: DialogueBody): Observable<SceneDetail> {
    return this.unwrap(
      this.http.put<ApiResponse<SceneDetail>>(
        `${this.base}/api/scenes/${sceneId}/dialogue/${index}`, body));
  }

  removeDialogue(sceneId: string, index: number): Observable<SceneDetail> {
    return this.unwrap(
      this.http.delete<ApiResponse<SceneDetail>>(
        `${this.base}/api/scenes/${sceneId}/dialogue/${index}`));
  }

  upsertPlacement(sceneId: string, body: PlacementBody): Observable<SceneDetail> {
    return this.unwrap(
      this.http.put<ApiResponse<SceneDetail>>(
        `${this.base}/api/scenes/${sceneId}/characters`, body));
  }

  removePlacement(sceneId: string, characterId: string): Observable<SceneDetail> {
    return this.unwrap(
      this.http.delete<ApiResponse<SceneDetail>>(
        `${this.base}/api/scenes/${sceneId}/characters/${characterId}`));
  }

  // --- rendering
  render(projectId: string): Observable<RenderJob> {
    return this.unwrap(
      this.http.post<ApiResponse<RenderJob>>(`${this.base}/api/projects/${projectId}/render`, {}));
  }

  listJobs(projectId: string): Observable<RenderJob[]> {
    return this.unwrap(
      this.http.get<ApiResponse<RenderJob[]>>(
        `${this.base}/api/projects/${projectId}/render-jobs`));
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
