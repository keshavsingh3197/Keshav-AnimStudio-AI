import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import {
  Asset, Character, IngestCapabilities, Project, RenderJob, RendererStatus, Scene, isTerminal,
} from '../../core/models/api.models';

type SourceKind = 'PastedText' | 'YouTubeCaptions';

@Component({
  selector: 'app-studio',
  imports: [CommonModule, FormsModule],
  templateUrl: './studio.component.html',
})
export class StudioComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  /** Polling handle; cleared on every terminal status and on destroy. */
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  readonly renderer = signal<RendererStatus | null>(null);
  readonly capabilities = signal<IngestCapabilities | null>(null);

  readonly project = signal<Project | null>(null);
  readonly assets = signal<Asset[]>([]);
  readonly characters = signal<Character[]>([]);
  readonly scenes = signal<Scene[]>([]);
  readonly job = signal<RenderJob | null>(null);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notices = signal<string[]>([]);

  // --- form state
  readonly source = signal<SourceKind>('PastedText');
  projectName = 'My first animation';
  url = '';
  transcript = [
    'Rahul: Hey Priya, look at this park!',
    "Priya: It's beautiful. I come here every morning.",
    "Rahul: Then let's make it our meeting spot.",
  ].join('\n');

  attestOwnRights = false;
  basisCode = 'IOwnTheContent';

  readonly urlSourceAvailable = computed(() =>
    this.capabilities()?.sources.find((s) => s.kind === 'YouTubeCaptions')?.available ?? false);

  readonly urlSourceReason = computed(() =>
    this.capabilities()?.sources.find((s) => s.kind === 'YouTubeCaptions')?.unavailableReason ?? null);

  readonly backgrounds = computed(() => this.assets().filter((a) => a.kind === 'Image'));

  readonly scenesReady = computed(() =>
    this.scenes().length > 0 && this.scenes().every((s) => !!s.backgroundAssetId));

  readonly canRender = computed(() =>
    !!this.project() && this.scenesReady() && (this.renderer()?.available ?? false) && !this.busy());

  constructor() {
    this.api.rendererStatus().subscribe({
      next: (status) => this.renderer.set(status),
      error: () => this.error.set('Could not reach the API. Is the backend running?'),
    });

    this.api.ingestCapabilities().subscribe({
      next: (caps) => this.capabilities.set(caps),
      error: () => undefined,
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  createProject(): void {
    this.run(this.api.createProject(this.projectName), (project) => {
      this.project.set(project);
      this.refreshAssets();
      this.refreshCharacters();
    });
  }

  upload(event: Event, role: 'background' | 'closed' | 'open'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const project = this.project();
    if (!file || !project) return;

    this.run(this.api.uploadAsset(project.id, file), (asset) => {
      this.assets.update((list) => [asset, ...list]);

      if (role === 'background') return;

      // A sprite without transparency composites as an opaque rectangle, so say so now
      // rather than letting it surface in the finished video.
      if (!asset.hasAlpha) {
        this.notices.update((list) => [
          ...list,
          `"${asset.name}" has no transparency, so it will render as a solid rectangle. ` +
            'Use a PNG with an alpha channel.',
        ]);
      }
    });
    input.value = '';
  }

  createCharacter(closedId: string, openId: string): void {
    const project = this.project();
    if (!project) return;

    this.run(
      this.api.createCharacter(project.id, {
        name: 'Rahul',
        aliases: ['Rahul'],
        closedMouthAssetId: closedId,
        openMouthAssetId: openId || undefined,
        subtitleColorHex: '#FFE164',
      }),
      (character) => this.characters.update((list) => [...list, character]));
  }

  ingest(): void {
    const project = this.project();
    if (!project) return;

    const kind = this.source();

    const body =
      kind === 'YouTubeCaptions'
        ? {
            source: kind,
            url: this.url,
            rightsAttestation: {
              isOwnerOrLicensed: this.attestOwnRights,
              basisCode: this.basisCode,
              attestedByName: 'Local user',
            },
          }
        : { source: kind, text: this.transcript };

    this.run(this.api.ingest(project.id, body), (result) => {
      this.notices.update((list) => [...list, ...result.warnings]);

      if (!result.scriptId) {
        this.error.set('The transcript produced no script.');
        return;
      }

      this.run(this.api.generateScenes(result.scriptId!), (generated) => {
        this.notices.update((list) => [...list, ...generated.warnings]);
        this.refreshScenes();
      });
    });
  }

  applyBackground(assetId: string): void {
    const project = this.project();
    if (!project || !assetId) return;

    this.run(this.api.setAllBackgrounds(project.id, assetId), () => this.refreshScenes());
  }

  render(): void {
    const project = this.project();
    if (!project) return;

    this.run(this.api.render(project.id), (job) => {
      this.job.set(job);
      this.startPolling(job.jobId);
    });
  }

  cancel(): void {
    const job = this.job();
    if (!job) return;
    this.api.cancelJob(job.jobId).subscribe({ error: () => undefined });
  }

  previewUrl(): string | null {
    const job = this.job();
    return job?.hasOutput ? this.api.previewUrl(job.jobId) : null;
  }

  downloadUrl(): string | null {
    const job = this.job();
    return job?.hasOutput ? this.api.downloadUrl(job.jobId) : null;
  }

  dismissNotices(): void {
    this.notices.set([]);
  }

  statusClass(status: string): string {
    if (status === 'Completed' || status === 'CompletedWithWarnings') return 'pill ok';
    if (status === 'Failed') return 'pill err';
    if (status === 'Cancelled') return 'pill warn';
    return 'pill';
  }

  private startPolling(jobId: string): void {
    this.stopPolling();

    // Polling rather than a socket, per the current design; the response shape is already
    // what a push transport would deliver, so swapping later changes nothing here.
    this.pollHandle = setInterval(() => {
      this.api.job(jobId).subscribe({
        next: (job) => {
          this.job.set(job);
          if (isTerminal(job.status)) {
            this.stopPolling();
            if (job.warnings.length > 0) {
              this.notices.update((list) => [...list, ...job.warnings]);
            }
          }
        },
        error: () => this.stopPolling(),
      });
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  private refreshAssets(): void {
    const project = this.project();
    if (project) this.api.listAssets(project.id).subscribe((list) => this.assets.set(list));
  }

  private refreshCharacters(): void {
    const project = this.project();
    if (project) this.api.listCharacters(project.id).subscribe((list) => this.characters.set(list));
  }

  private refreshScenes(): void {
    const project = this.project();
    if (project) this.api.listScenes(project.id).subscribe((list) => this.scenes.set(list));
  }

  /** Runs a call with shared busy/error handling so each handler stays about its own job. */
  private run<T>(source: import('rxjs').Observable<T>, next: (value: T) => void): void {
    this.busy.set(true);
    this.error.set(null);

    source.subscribe({
      next: (value) => {
        this.busy.set(false);
        next(value);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(this.describe(err));
      },
    });
  }

  private describe(err: unknown): string {
    const body = (err as { error?: { message?: string; errors?: { message: string }[] } })?.error;
    return body?.errors?.[0]?.message ?? body?.message ?? 'Something went wrong.';
  }
}
