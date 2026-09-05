import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IngestCapabilities, IngestSummary, ScriptDetail, ScriptSummary, TranscriptSourceStatus,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

type SourceKind = 'PastedText' | 'SubtitleFile' | 'YouTubeCaptions';

/**
 * Turns a transcript into scenes, and keeps the record of every attempt.
 *
 * Re-importing is safe: a scene you have edited or added by hand is preserved, and only
 * the untouched generated ones are rebuilt.
 */
@Component({
  selector: 'app-import',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './import.component.html',
})
export class ImportComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly capabilities = signal<IngestCapabilities | null>(null);
  readonly source = signal<SourceKind>('PastedText');

  readonly ingests = signal<IngestSummary[]>([]);
  readonly scripts = signal<ScriptSummary[]>([]);
  readonly preview = signal<ScriptDetail | null>(null);

  readonly urlSource = computed(() => this.sourceStatus('YouTubeCaptions'));
  readonly urlSourceAvailable = computed(() => this.urlSource()?.available ?? false);

  url = '';
  subtitleAssetId = '';
  transcript = [
    'Rahul: Hey Priya, look at this park!',
    "Priya: It's beautiful. I come here every morning.",
    "Rahul: Then let's make it our meeting spot.",
  ].join('\n');

  attestOwnRights = false;
  basisCode = 'IOwnTheContent';

  /** The project whose history is already loaded, so a store refresh does not refetch it. */
  private historyLoadedFor: string | null = null;

  constructor() {
    this.api.ingestCapabilities().subscribe({
      next: (caps) => this.capabilities.set(caps),
      error: () => undefined,
    });

    // The store loads asynchronously, so the history waits for the project to arrive.
    effect(() => {
      const project = this.store.project();
      if (!project || this.historyLoadedFor === project.id) return;

      this.historyLoadedFor = project.id;
      this.reloadHistory();
    });
  }

  /** Uploads a .srt or .vtt, then selects it - the common case is one file, once. */
  uploadSubtitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    const projectId = this.store.projectId();
    const file = input.files?.[0];

    if (!projectId || !file) return;

    this.status.run(this.api.uploadAsset(projectId, file), (asset) => {
      this.store.refreshAssets();
      this.subtitleAssetId = asset.id;
    });

    input.value = '';
  }

  ingest(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

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
        : kind === 'SubtitleFile'
          ? { source: kind, subtitleAssetId: this.subtitleAssetId }
          : { source: kind, text: this.transcript };

    this.status.run(this.api.ingest(projectId, body), (result) => {
      this.status.notify(result.warnings);
      this.reloadHistory();

      if (!result.scriptId) {
        this.status.notify(['That transcript produced no script.']);
        return;
      }

      this.generateFrom(result.scriptId);
    });
  }

  /** Cuts scenes from a script - the one just imported, or an older one. */
  generateFrom(scriptId: string): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.generateScenes(scriptId), (generated) => {
      this.status.notify(generated.warnings);

      if (generated.unresolvedSpeakers.length > 0) {
        this.status.notify([
          `No character matched: ${generated.unresolvedSpeakers.join(', ')}. `
          + 'Add them on the Characters tab, then import again.',
        ]);
      }

      this.store.refreshScenes();
      this.store.refreshCharacters();
      void this.router.navigate(['/projects', projectId, 'scenes']);
    });
  }

  previewScript(scriptId: string): void {
    if (this.preview()?.id === scriptId) {
      this.preview.set(null);
      return;
    }

    this.status.run(this.api.getScript(scriptId), (detail) => this.preview.set(detail));
  }

  sourceStatus(kind: string): TranscriptSourceStatus | null {
    return this.capabilities()?.sources.find((s) => s.kind === kind) ?? null;
  }

  canSubmit(): boolean {
    if (this.status.busy()) return false;

    switch (this.source()) {
      case 'YouTubeCaptions':
        return this.attestOwnRights && this.url.trim().length > 0;
      case 'SubtitleFile':
        return this.subtitleAssetId.length > 0;
      default:
        return this.transcript.trim().length > 0;
    }
  }

  private reloadHistory(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.api.listIngests(projectId).subscribe({
      next: (list) => this.ingests.set(list),
      error: () => undefined,
    });

    this.api.listScripts(projectId).subscribe({
      next: (list) => this.scripts.set(list),
      error: () => undefined,
    });
  }
}
