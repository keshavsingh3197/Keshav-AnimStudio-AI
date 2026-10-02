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
import { FileDropDirective } from '../../shared/file-drop.directive';

type SourceKind = 'PastedText' | 'SubtitleFile' | 'YouTubeCaptions';

/**
 * Turns a transcript into scenes, and keeps the record of every attempt.
 *
 * Re-importing is safe: a scene you have edited or added by hand is preserved, and only
 * the untouched generated ones are rebuilt.
 */
@Component({
  selector: 'app-import',
  imports: [DatePipe, DecimalPipe, FormsModule, FileDropDirective],
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

  // --- "no transcript yet" helper: a prompt to paste into any AI chat, and a place to
  // paste back what it gives you.
  aiVideoTitle = '';
  aiVideoMinutes: number | null = null;
  aiVideoNotes = '';
  aiPastedResult = '';
  readonly showAiHelper = signal(false);

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
    const file = input.files?.[0];
    input.value = '';
    if (file) this.uploadSubtitleFile(file);
  }

  uploadSubtitleFile(file: File): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.uploadAsset(projectId, file), (asset) => {
      this.store.refreshAssets();
      this.subtitleAssetId = asset.id;
    });
  }

  // --- "no transcript yet": a prompt for any external AI chat, no key needed here because
  // the AI part happens outside this application entirely.

  /**
   * Built fresh on every read rather than cached, so editing the title, length or notes
   * updates the box immediately - it is meant to be copied right before pasting.
   */
  aiPrompt(): string {
    const title = this.aiVideoTitle.trim();
    const minutes = this.aiVideoMinutes;
    const notes = this.aiVideoNotes.trim();

    const about = title ? `titled "${title}"` : 'I am working on';
    const length = minutes && minutes > 0 ? `, about ${minutes} minute(s) long` : '';

    const source = notes.length > 0
      ? `Here is what is said in it (my own rough transcript, notes, or script):\n"""\n${notes}\n"""\nClean up wording only where needed for readability - do not invent new dialogue or events.`
      : 'I will paste what is said in it right after this message - wait for that before answering.';

    return [
      `I have a video ${about}${length}. Please write accurate subtitles for it in SubRip`,
      '(.srt) format.',
      '',
      source,
      '',
      'Rules:',
      '- Reply with ONLY the .srt file content - no commentary before or after it.',
      '- Number every cue starting at 1.',
      '- Timestamps must use the format 00:00:00,000 --> 00:00:00,000.',
      minutes && minutes > 0
        ? `- Pace the timestamps evenly across the real ${minutes}-minute length, at a natural`
        : '- Pace the timestamps at a natural',
      '  reading speed (roughly 150 words per minute).',
      '- Keep each cue to one or two short lines, under about 42 characters per line.',
      '- Do not add speaker names unless I gave them to you above.',
    ].join('\n');
  }

  copyAiPrompt(): void {
    const text = this.aiPrompt();
    navigator.clipboard?.writeText(text).then(
      () => this.status.notify(['Prompt copied. Paste it into any AI chat tool.']),
      () => this.status.notify(['Could not copy automatically - select the text and copy it.']));
  }

  /**
   * Turns whatever the AI handed back into an uploaded subtitle file, then switches to the
   * Subtitle file source with it selected - the same real-timings path a dropped .srt takes,
   * just typed in from a paste instead of a file picker.
   */
  saveAiSubtitles(): void {
    const projectId = this.store.projectId();
    const text = this.aiPastedResult.trim();
    if (!projectId || text.length === 0) return;

    const looksLikeVtt = text.startsWith('WEBVTT');
    const name = looksLikeVtt ? 'ai-subtitles.vtt' : 'ai-subtitles.srt';
    const file = new File([text], name, {
      type: looksLikeVtt ? 'text/vtt' : 'application/x-subrip',
    });

    this.status.run(this.api.uploadAsset(projectId, file), (asset) => {
      this.store.refreshAssets();
      this.source.set('SubtitleFile');
      this.subtitleAssetId = asset.id;
      this.aiPastedResult = '';
      this.status.notify(['Saved. Review it below, then build scenes when you are ready.']);
    });
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
