import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AdminAccess, AdminAuditEntry, AdminHealth, AdminJob, AdminProviderBody, AdminProviders,
  AdminProviderTest, AdminUsage, AiCapabilities, ApiResponse, Asset, BundleApplyBody,
  BundleImportResult, BundlePreview, Character, CharacterBody, ClipMergeBody, ClipOrder,
  ClipStudio, CreateProjectBody,
  CreateSceneBody, DialogueBody, IngestCapabilities, IngestResult, IngestSummary,
  PlacementBody, Project, RenderJob, RendererStatus, Scene, SceneAudioBody, SceneDetail,
  SceneGenerationResult, ScriptDetail, ScriptSummary, UpdateProjectBody, UpdateSceneBody,
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

  /** Whether to offer an admin link at all, rather than one that leads to a refusal. */
  adminAccess(): Observable<AdminAccess> {
    return this.unwrap(
      this.http.get<ApiResponse<AdminAccess>>(`${this.base}/api/system/admin-access`));
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

  /** Direct link to a .srt built from the project's dialogue, timed as it renders. */
  subtitlesUrl(projectId: string): string {
    return `${this.base}/api/projects/${projectId}/subtitles.srt`;
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

  duplicateScene(sceneId: string): Observable<SceneDetail> {
    return this.unwrap(
      this.http.post<ApiResponse<SceneDetail>>(
        `${this.base}/api/scenes/${sceneId}/duplicate`, {}));
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

  // --- clips: several finished clips joined into one downloadable file

  /** The clips, what can mark or score them, and what this server's renderer can do. */
  clipStudio(projectId: string): Observable<ClipStudio> {
    return this.unwrap(
      this.http.get<ApiResponse<ClipStudio>>(`${this.base}/api/projects/${projectId}/clips`));
  }

  /**
   * Reads a written running order against the current selection.
   *
   * A read, not a write: pasting, seeing what matched, fixing a line and pasting again
   * costs nothing and changes nothing until the result is applied.
   */
  clipOrder(projectId: string, assetIds: string[], text: string): Observable<ClipOrder> {
    return this.unwrap(this.http.post<ApiResponse<ClipOrder>>(
      `${this.base}/api/projects/${projectId}/clips/order`, { assetIds, text }));
  }

  /** Saves the complete running order, so it survives reloads and another browser session. */
  saveClipOrder(projectId: string, assetIds: string[]): Observable<unknown> {
    return this.unwrap(this.http.put<ApiResponse<unknown>>(
      `${this.base}/api/projects/${projectId}/clips/order`, { assetIds }));
  }

  /** Queues the stitch. Polled and downloaded through the same job endpoints as a render. */
  mergeClips(projectId: string, body: ClipMergeBody): Observable<RenderJob> {
    return this.unwrap(this.http.post<ApiResponse<RenderJob>>(
      `${this.base}/api/projects/${projectId}/clips/merge`, body));
  }

  /** Bulk delete, because a bulk import is routinely followed by a bulk mistake. */
  deleteClips(projectId: string, assetIds: string[]): Observable<number> {
    return this.unwrap(this.http.post<ApiResponse<number>>(
      `${this.base}/api/projects/${projectId}/clips/delete`, { assetIds }));
  }

  // --- bundle: the no-AI path. One .zip carrying sheets, images and audio.

  /** Direct links, because a download is a navigation rather than a fetch. */
  bundleTemplateUrl(): string {
    return `${this.base}/api/templates/bundle`;
  }

  aiPromptPackUrl(): string {
    return `${this.base}/api/templates/ai-prompts`;
  }

  previewBundle(projectId: string, file: File): Observable<BundlePreview> {
    const form = new FormData();
    form.append('file', file, file.name);

    return this.unwrap(this.http.post<ApiResponse<BundlePreview>>(
      `${this.base}/api/projects/${projectId}/bundle/preview`, form));
  }

  applyBundle(projectId: string, body: BundleApplyBody): Observable<BundleImportResult> {
    return this.unwrap(this.http.post<ApiResponse<BundleImportResult>>(
      `${this.base}/api/projects/${projectId}/bundle/apply`, body));
  }

  /** The whole project as one zip: sheets plus every picture and sound they refer to. */
  bundleExportUrl(projectId: string, includeMedia = true): string {
    return `${this.base}/api/projects/${projectId}/bundle?includeMedia=${includeMedia}`;
  }

  // --- AI status, available to any signed-in user

  aiCapabilities(): Observable<AiCapabilities> {
    return this.unwrap(
      this.http.get<ApiResponse<AiCapabilities>>(`${this.base}/api/ai/capabilities`));
  }

  // --- running the server. Everything below is behind the admin policy; a browser that is
  // not admitted gets 403 with the standard envelope, which the interceptor turns into a
  // message rather than a blank screen.

  private readonly admin = `${this.base}/api/admin`;

  adminProviders(): Observable<AdminProviders> {
    return this.unwrap(this.http.get<ApiResponse<AdminProviders>>(`${this.admin}/providers`));
  }

  /**
   * Every write returns the whole provider list. One round trip, and the screen can never
   * drift from the server - which matters most for the key mask, where a stale view would
   * read as "the key did not save".
   */
  saveProvider(providerId: string, body: AdminProviderBody): Observable<AdminProviders> {
    return this.unwrap(this.http.put<ApiResponse<AdminProviders>>(
      `${this.admin}/providers/${providerId}`, body));
  }

  resetProvider(providerId: string): Observable<AdminProviders> {
    return this.unwrap(this.http.post<ApiResponse<AdminProviders>>(
      `${this.admin}/providers/${providerId}/reset`, {}));
  }

  setProviderKey(providerId: string, key: string): Observable<AdminProviders> {
    return this.unwrap(this.http.put<ApiResponse<AdminProviders>>(
      `${this.admin}/providers/${providerId}/key`, { key }));
  }

  deleteProviderKey(providerId: string): Observable<AdminProviders> {
    return this.unwrap(this.http.delete<ApiResponse<AdminProviders>>(
      `${this.admin}/providers/${providerId}/key`));
  }

  testProvider(providerId: string): Observable<AdminProviderTest> {
    return this.unwrap(this.http.post<ApiResponse<AdminProviderTest>>(
      `${this.admin}/providers/${providerId}/test`, {}));
  }

  saveChain(capability: string, providerIds: string[]): Observable<AdminProviders> {
    return this.unwrap(this.http.put<ApiResponse<AdminProviders>>(
      `${this.admin}/chains/${capability}`, { providerIds }));
  }

  adminUsage(days = 14): Observable<AdminUsage> {
    return this.unwrap(
      this.http.get<ApiResponse<AdminUsage>>(`${this.admin}/usage?days=${days}`));
  }

  adminHealth(): Observable<AdminHealth> {
    return this.unwrap(this.http.get<ApiResponse<AdminHealth>>(`${this.admin}/health`));
  }

  adminJobs(limit = 40): Observable<AdminJob[]> {
    return this.unwrap(
      this.http.get<ApiResponse<AdminJob[]>>(`${this.admin}/jobs?limit=${limit}`));
  }

  cancelAdminJob(jobId: string): Observable<unknown> {
    return this.unwrap(
      this.http.post<ApiResponse<unknown>>(`${this.admin}/jobs/${jobId}/cancel`, {}));
  }

  retryAdminJob(jobId: string): Observable<unknown> {
    return this.unwrap(
      this.http.post<ApiResponse<unknown>>(`${this.admin}/jobs/${jobId}/retry`, {}));
  }

  adminAudit(limit = 50): Observable<AdminAuditEntry[]> {
    return this.unwrap(
      this.http.get<ApiResponse<AdminAuditEntry[]>>(`${this.admin}/audit?limit=${limit}`));
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
