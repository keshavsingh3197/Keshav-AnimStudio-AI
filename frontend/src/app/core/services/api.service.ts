import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AdminAccess, AdminAuditEntry, AdminHealth, AdminJob, AdminProviderBody, AdminProviders,
  AdminProviderTest, AdminUsage, AiCapabilities, ApiResponse, Asset, BundleApplyBody,
  BundleImportResult, BundlePreview, Character, CharacterBody, ClipMergeBody, ClipOrder,
  ClipStudio, CreateProjectBody,
  CreateSceneBody, DialogueBody, IngestCapabilities, IngestResult, IngestSummary,
  PlacementBody, Project, RenderJob, ExportTimelineFormat, RendererStatus, Scene, SceneAudioBody, SceneDetail,
  SceneGenerationResult, ScriptDetail, ScriptSummary, UpdateProjectBody, UpdateSceneBody,
  WatermarkBody, OutroBody, BrandChannel, DEFAULT_BRAND_CHANNEL, StorageSummary, StorageDetail,
  ProjectEdit, CreateEditBody, UpdateEditBody, SaveEditDraftBody,
} from '../models/api.models';

/**
 * Typed wrapper over the API.
 *
 * Every endpoint returns the same envelope, so unwrapping happens in one place and
 * components never deal with `{ success, data }`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
    public getHubConfig() {
    return this.http.get<ApiResponse<any>>(`${this.base}/api/system/hub-config`).pipe(
      map(r => r.data),
      catchError(err => {
        console.warn('Could not fetch HubConfig from backend. Using static fallbacks.');
        return of({
          presets: [
            { label: '9:16 Shorts', width: 1080, height: 1920 },
            { label: '16:9 Landscape', width: 1920, height: 1080 },
            { label: '1:1 Square', width: 1080, height: 1080 },
            { label: '4:5 Social', width: 1080, height: 1350 }
          ],
          templates: [
            { id: 'Talking Head', name: 'Subtitled Talking Head', wireframeClass: 'talking-head', tags: ['Viral', 'Caption-Ready'] },
            { id: 'Cinematic Intro', name: 'Cinematic Intro', wireframeClass: 'cinematic', tags: ['Motion', 'Epic'] },
            { id: 'Split Screen', name: 'Split Screen (Duo)', wireframeClass: 'split-screen', tags: ['Reaction', 'Podcast'] }
          ],
          quickStarts: [
            { id: 'captions', icon: '💬', label: 'Auto-Captions', tooltip: 'Start with Auto-Captions' },
            { id: 'text2video', icon: '✨', label: 'Text-to-Video', tooltip: 'Start with AI Video Prompt' },
            { id: 'screenrec', icon: '⏺️', label: 'Screen Record', tooltip: 'Start Screen Recording' }
          ]
        });
      })
    );
  }

  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // --- system
  /** How full the media store is, measured on the server against the configured quota. */
  storageSummary(): Observable<StorageSummary> {
    return this.unwrap(this.http.get<ApiResponse<StorageSummary>>(`${this.base}/api/system/storage`));
  }

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

  // Branding is per brand channel (one per YouTube channel). `channel` omitted or null means
  // the built-in default channel; an unknown id also reads as the default.

  getGlobalBranding(channel?: string | null): Observable<WatermarkBody | null> {
    return this.unwrap(
      this.http.get<ApiResponse<WatermarkBody | null>>(`${this.base}/api/system/branding${channelQuery(channel)}`));
  }

  /** Always carries a query string, so callers add cache-busters with `&`. */
  globalLogoUrl(channel?: string | null): string {
    return `${this.base}/api/system/branding/logo${channelQuery(channel, true)}`;
  }

  getGlobalOutro(channel?: string | null): Observable<OutroBody | null> {
    return this.unwrap(
      this.http.get<ApiResponse<OutroBody | null>>(`${this.base}/api/system/branding/outro${channelQuery(channel)}`));
  }

  /** Always carries a query string, so callers add cache-busters with `&`. */
  globalOutroMediaUrl(channel?: string | null): string {
    return `${this.base}/api/system/branding/outro/media${channelQuery(channel, true)}`;
  }

  /** Every brand channel, the default first. Readable by any signed-in user. */
  listBrandChannels(): Observable<BrandChannel[]> {
    return this.unwrap(
      this.http.get<ApiResponse<BrandChannel[]>>(`${this.base}/api/system/branding/channels`));
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

  // --- Folders ---
  getFolders(projectId: string): Observable<import('../models/api.models').AssetFolder[]> {
    return this.unwrap(this.http.get<ApiResponse<import('../models/api.models').AssetFolder[]>>(`${this.base}/api/projects/${projectId}/folders`));
  }

  createFolder(projectId: string, name: string): Observable<import('../models/api.models').AssetFolder> {
    return this.unwrap(this.http.post<ApiResponse<import('../models/api.models').AssetFolder>>(`${this.base}/api/projects/${projectId}/folders`, { name }));
  }

  updateFolder(projectId: string, folderId: string, name: string): Observable<import('../models/api.models').AssetFolder> {
    return this.unwrap(this.http.put<ApiResponse<import('../models/api.models').AssetFolder>>(`${this.base}/api/projects/${projectId}/folders/${folderId}`, { name }));
  }

  deleteFolder(projectId: string, folderId: string): Observable<unknown> {
    return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.base}/api/projects/${projectId}/folders/${folderId}`));
  }

  reorderAssets(projectId: string, assetIds: string[]): Observable<unknown> {
    return this.unwrap(this.http.put<ApiResponse<unknown>>(`${this.base}/api/projects/${projectId}/assets/reorder`, { assetIds }));
  }

  moveAssetToFolder(projectId: string, assetId: string, folderId: string | null): Observable<Asset> {
    return this.unwrap(this.http.put<ApiResponse<Asset>>(`${this.base}/api/projects/${projectId}/assets/${assetId}/folder`, { folderId }));
  }

  uploadAsset(projectId: string, file: File, folderId?: string | null): Observable<Asset> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (folderId) {
      form.append('folderId', folderId);
    }
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

  /** Direct URL to the fast lightweight thumbnail image (320px JPEG for videos). */
  assetThumbnailUrl(assetId: string, version = 2): string {
    return `${this.base}/api/assets/${encodeURIComponent(assetId)}/thumbnail?v=${version}`;
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

  /** Where each clip, sound and overlay sits in the finished export. */
  timelineUrl(jobId: string, format: ExportTimelineFormat): string {
    return `${this.base}/api/render-jobs/${encodeURIComponent(jobId)}/timeline?format=${format}`;
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

  /** Saves the complete studio timeline, overlays, audio cues and state to the project database. */
  saveStudioDraft(projectId: string, draftJson: string): Observable<unknown> {
    return this.unwrap(this.http.put<ApiResponse<unknown>>(
      `${this.base}/api/projects/${projectId}/clips/draft`, { draftJson }));
  }

  // --- cuts (videos / Shorts) of a project

  listEdits(projectId: string): Observable<ProjectEdit[]> {
    return this.unwrap(this.http.get<ApiResponse<ProjectEdit[]>>(
      `${this.base}/api/projects/${projectId}/edits`));
  }

  /** One cut with its timeline document. */
  getEdit(projectId: string, editId: string): Observable<ProjectEdit> {
    return this.unwrap(this.http.get<ApiResponse<ProjectEdit>>(
      `${this.base}/api/projects/${projectId}/edits/${encodeURIComponent(editId)}`));
  }

  createEdit(projectId: string, body: CreateEditBody): Observable<ProjectEdit> {
    return this.unwrap(this.http.post<ApiResponse<ProjectEdit>>(
      `${this.base}/api/projects/${projectId}/edits`, body));
  }

  updateEdit(projectId: string, editId: string, body: UpdateEditBody): Observable<ProjectEdit> {
    return this.unwrap(this.http.patch<ApiResponse<ProjectEdit>>(
      `${this.base}/api/projects/${projectId}/edits/${encodeURIComponent(editId)}`, body));
  }

  saveEditDraft(projectId: string, editId: string, body: SaveEditDraftBody): Observable<ProjectEdit> {
    return this.unwrap(this.http.put<ApiResponse<ProjectEdit>>(
      `${this.base}/api/projects/${projectId}/edits/${encodeURIComponent(editId)}/draft`, body));
  }

  duplicateEdit(projectId: string, editId: string): Observable<ProjectEdit> {
    return this.unwrap(this.http.post<ApiResponse<ProjectEdit>>(
      `${this.base}/api/projects/${projectId}/edits/${encodeURIComponent(editId)}/duplicate`, {}));
  }

  deleteEdit(projectId: string, editId: string): Observable<unknown> {
    return this.unwrap(this.http.delete<ApiResponse<unknown>>(
      `${this.base}/api/projects/${projectId}/edits/${encodeURIComponent(editId)}`));
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

  adminStorage(refresh = false): Observable<StorageDetail> {
    return this.unwrap(this.http.get<ApiResponse<StorageDetail>>(
      `${this.admin}/storage${refresh ? '?refresh=true' : ''}`));
  }

  updateStorageQuota(quotaGb: number | null): Observable<StorageDetail> {
    return this.unwrap(this.http.put<ApiResponse<StorageDetail>>(`${this.admin}/storage`, { quotaGb }));
  }

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

  createBrandChannel(name: string, copyFromChannelId?: string | null): Observable<BrandChannel[]> {
    return this.unwrap(this.http.post<ApiResponse<BrandChannel[]>>(
      `${this.admin}/branding/channels`, { name, copyFromChannelId: copyFromChannelId ?? null }));
  }

  renameBrandChannel(channelId: string, name: string): Observable<BrandChannel[]> {
    return this.unwrap(this.http.put<ApiResponse<BrandChannel[]>>(
      `${this.admin}/branding/channels/${encodeURIComponent(channelId)}`, { name }));
  }

  /** `moveProjectsTo`: where the channel's projects go; omitted, they go to the default. */
  deleteBrandChannel(channelId: string, moveProjectsTo?: string | null): Observable<BrandChannel[]> {
    const move = moveProjectsTo ? `?moveProjectsTo=${encodeURIComponent(moveProjectsTo)}` : '';
    return this.unwrap(this.http.delete<ApiResponse<BrandChannel[]>>(
      `${this.admin}/branding/channels/${encodeURIComponent(channelId)}${move}`));
  }

  /** Projects per channel id; projects with no (or a vanished) channel count under the default. */
  brandChannelUsage(): Observable<Record<string, number>> {
    return this.unwrap(this.http.get<ApiResponse<Record<string, number>>>(`${this.admin}/branding/channels/usage`));
  }

  updateGlobalBranding(body: WatermarkBody, channel?: string | null): Observable<WatermarkBody | null> {
    return this.unwrap(
      this.http.put<ApiResponse<WatermarkBody | null>>(`${this.admin}/branding${channelQuery(channel)}`, body));
  }

  uploadGlobalLogo(file: File, channel?: string | null): Observable<WatermarkBody | null> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(
      this.http.post<ApiResponse<WatermarkBody | null>>(`${this.admin}/branding/logo${channelQuery(channel)}`, form));
  }

  updateGlobalOutro(body: OutroBody, channel?: string | null): Observable<OutroBody | null> {
    return this.unwrap(
      this.http.put<ApiResponse<OutroBody | null>>(`${this.admin}/branding/outro${channelQuery(channel)}`, body));
  }

  uploadGlobalOutro(file: File, channel?: string | null): Observable<OutroBody | null> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(
      this.http.post<ApiResponse<OutroBody | null>>(`${this.admin}/branding/outro/upload${channelQuery(channel)}`, form));
  }

  /** Uploads the end card's QR code; the outro switches to a Card. */
  uploadGlobalOutroQr(file: File, channel?: string | null): Observable<OutroBody | null> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(
      this.http.post<ApiResponse<OutroBody | null>>(`${this.admin}/branding/outro/qr${channelQuery(channel)}`, form));
  }

  /**
   * Renders the outro AS GIVEN (saved or not) to an MP4, for previewing and for
   * downloading to attach to videos uploaded before the card existed.
   */
  previewGlobalOutro(body: OutroBody, format: 'landscape' | 'vertical' | 'square'): Observable<Blob> {
    return this.http.post(`${this.admin}/branding/outro/preview?format=${format}`, body, { responseType: 'blob' });
  }

  /**
   * The end card this project's export would finish with (its own outro, else the studio's),
   * rendered at the project's canvas unless `format` says otherwise. Pass `body` to preview
   * unsaved project settings.
   */
  previewProjectOutro(
    projectId: string, body: OutroBody | null = null, format?: 'landscape' | 'vertical' | 'square',
  ): Observable<Blob> {
    const query = format ? `?format=${format}` : '';
    return this.http.post(
      `${this.base}/api/projects/${encodeURIComponent(projectId)}/outro/preview${query}`, body, { responseType: 'blob' });
  }

  /** Global (studio-wide) assets such as the QR code are readable by any signed-in user. */
  assetContentUrl(assetId: string): string {
    return `${this.base}/api/assets/${encodeURIComponent(assetId)}/content`;
  }

  /** The asset's bytes, fetched through HttpClient so it can be edited on a canvas. */
  assetContent(assetId: string): Observable<Blob> {
    return this.http.get(this.assetContentUrl(assetId), { responseType: 'blob' });
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
  saveDebugScreenshot(base64Image: string, viewName: string): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/api/debug/screenshot`, { base64Image, viewName }));
  }

}

/** `?channel=<id>` for a named brand channel; for the default, nothing (or `?channel=default` when a query is required). */
function channelQuery(channel?: string | null, alwaysQuery = false): string {
  if (channel && channel !== DEFAULT_BRAND_CHANNEL) return `?channel=${encodeURIComponent(channel)}`;
  return alwaysQuery ? `?channel=${DEFAULT_BRAND_CHANNEL}` : '';
}
