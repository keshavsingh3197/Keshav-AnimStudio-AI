import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, concatMap, forkJoin, map, of } from 'rxjs';
import { ClipStudio, EDIT_FORMATS, EditFormat, Project, ProjectEdit } from '../../../../core/models/api.models';
import { ApiService } from '../../../../core/services/api.service';
import { StudioStateService } from '../../services/studio-state.service';
import {
  ALL_TRANSFER_LAYERS, TRANSFER_LAYERS, TimelineFragment, TransferLayer, TransferRange,
  draftSpanSeconds, extractFragment, fragmentAssetIds, fragmentToDraft, isEmptyFragment, withPendingRange,
} from '../../services/timeline-transfer';

export type TransferMode = 'import' | 'create';

/** A source timeline, loaded and ready to take pieces from. */
interface LoadedSource {
  projectId: string;
  editId: string;
  draft: unknown;
  /** Set on a cut made from part of another that has not been opened since. */
  pending: TransferRange | null;
  /** Length of the timeline as the user sees it once opened. */
  seconds: number;
  audioLength: (assetId: string) => number | undefined;
}

type RangeChoice = 'all' | 'selection' | 'custom';

/**
 * Two directions over the same pieces: bring part of any video (this project or another)
 * into the open one, or start a new video from part of the open one. Either way the user
 * picks the stretch of time and which layers - clips, overlays, images, text, voice, music,
 * clip effects - come along.
 */
@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './transfer-dialog.component.html',
  styleUrls: ['./transfer-dialog.component.css'],
})
export class TransferDialogComponent implements OnInit {
  readonly state = inject(StudioStateService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly mode = input.required<TransferMode>();
  readonly closed = output<void>();

  readonly layers = TRANSFER_LAYERS;
  readonly formats = EDIT_FORMATS;

  // --- where the pieces come from (import)
  readonly projects = signal<Project[]>([]);
  readonly sourceProjectId = signal<string>('');
  readonly sourceEdits = signal<ProjectEdit[]>([]);
  readonly sourceEditId = signal<string>('');
  readonly source = signal<LoadedSource | null>(null);
  readonly loadingSource = signal(false);

  // --- what to take
  readonly selectedLayers = signal<Set<TransferLayer>>(new Set(ALL_TRANSFER_LAYERS));
  readonly rangeChoice = signal<RangeChoice>('all');
  readonly rangeStart = signal(0);
  readonly rangeEnd = signal(0);
  readonly placement = signal<'start' | 'playhead' | 'end'>('end');

  // --- the new video (create)
  readonly newName = signal('');
  readonly newFormat = signal<EditFormat>('Short');
  readonly openAfterCreate = signal(true);

  readonly working = signal(false);
  readonly error = signal<string | null>(null);

  readonly isCrossProject = computed(() =>
    this.mode() === 'import' && !!this.sourceProjectId() && this.sourceProjectId() !== this.state.openProjectId);

  readonly hasSelection = computed(() => this.mode() === 'create' && this.state.selectedClipsRange() !== null);

  /** Length of the timeline pieces are taken from. */
  readonly sourceSeconds = computed(() =>
    this.mode() === 'create' ? this.state.contentDurationSeconds() : this.source()?.seconds ?? 0);

  /** The stretch to take, on the timeline as the user sees it. */
  readonly range = computed<TransferRange | null>(() => {
    switch (this.rangeChoice()) {
      case 'selection': return this.state.selectedClipsRange();
      case 'custom': return { start: this.rangeStart(), end: this.rangeEnd() };
      default: return null;
    }
  });

  readonly rangeInvalid = computed<string | null>(() => {
    const r = this.range();
    if (!r) return null;
    if (!(r.end > r.start)) return 'The end must come after the start.';
    if (r.start >= this.sourceSeconds()) return 'The start is past the end of the video.';
    return null;
  });

  /** Everything the source holds, per layer, so each checkbox can say what it brings. */
  readonly layerCounts = computed<Record<TransferLayer, number>>(() => {
    const all = this.extract(ALL_TRANSFER_LAYERS, this.range(), true);
    const counts: Record<TransferLayer, number> = { video: 0, overlay: 0, image: 0, text: 0, voice: 0, music: 0, effects: 0 };
    if (!all) return counts;
    counts.video = all.rows.length;
    for (const it of all.items) {
      if (it.type === 'text') counts.text++;
      else if (it.trackId === 'IMG1' || it.trackId === 'IMG' || it.type === 'image') counts.image++;
      else if (it.trackId === 'A1') counts.voice++;
      else if (it.trackId === 'A2' || it.type === 'audio') counts.music++;
      else counts.overlay++;
    }
    for (const t of all.musicTracks) {
      if (t.key.startsWith('vo_')) counts.voice++;
      else counts.music++;
    }
    counts.effects = new Set([
      ...Object.keys(all.clipColors), ...Object.keys(all.clipTransforms), ...Object.keys(all.clipSounds),
      ...Object.keys(all.clipTexts), ...all.clipFraming.map(([k]) => k), ...all.clipAudioFade.map(([k]) => k),
    ]).size + all.junctionOverrides.length;
    return counts;
  });

  /** What would actually be taken with the current choices. */
  readonly preview = computed<TimelineFragment | null>(() =>
    this.rangeInvalid() ? null : this.extract(this.selectedLayers(), this.range(), false));

  readonly previewSummary = computed<string>(() => {
    const f = this.preview();
    if (!f || isEmptyFragment(f)) return 'Nothing to take with these choices.';
    const parts: string[] = [];
    if (f.rows.length) parts.push(`${f.rows.length} clip${f.rows.length > 1 ? 's' : ''}`);
    const items = f.items.length;
    if (items) parts.push(`${items} overlay/text item${items > 1 ? 's' : ''}`);
    if (f.musicTracks.length) parts.push(`${f.musicTracks.length} audio track${f.musicTracks.length > 1 ? 's' : ''}`);
    return `${parts.join(' · ')} — ${this.state.formatTimecode(f.spanSeconds)} long`;
  });

  readonly canConfirm = computed(() => {
    if (this.working() || this.rangeInvalid()) return false;
    const f = this.preview();
    if (!f || isEmptyFragment(f)) return false;
    if (this.mode() === 'create') return this.newName().trim().length > 0;
    return !!this.source();
  });

  ngOnInit(): void {
    if (this.mode() === 'create') {
      const range = this.state.selectedClipsRange();
      if (range) {
        this.rangeChoice.set('selection');
        this.rangeStart.set(round1(range.start));
        this.rangeEnd.set(round1(range.end));
      } else {
        this.rangeEnd.set(round1(this.state.contentDurationSeconds()));
      }
      const current = this.state.currentEdit()?.name ?? 'Video';
      this.newName.set(range ? `${current} - part` : `${current} - new`);
      return;
    }

    this.placement.set(this.state.included().length > 0 ? 'end' : 'start');
    const projectId = this.state.openProjectId;
    this.api.listProjects().subscribe({
      next: (list) => this.projects.set(list),
      error: () => this.error.set('Could not list your projects.'),
    });
    if (projectId) this.pickProject(projectId);
  }

  // --- source picking (import)

  pickProject(projectId: string): void {
    this.sourceProjectId.set(projectId);
    this.sourceEdits.set([]);
    this.sourceEditId.set('');
    this.source.set(null);
    this.error.set(null);
    this.api.listEdits(projectId).subscribe({
      next: (list) => {
        if (this.sourceProjectId() !== projectId) return;
        this.sourceEdits.set(list);
        // Another cut of this project is the likely pick; the open one is still allowed.
        const first = list.find((e) => e.id !== this.state.openEditId) ?? list[0];
        if (first) this.pickEdit(first.id);
      },
      error: () => this.error.set('Could not list the videos of that project.'),
    });
  }

  pickEdit(editId: string): void {
    const projectId = this.sourceProjectId();
    this.sourceEditId.set(editId);
    this.source.set(null);
    this.error.set(null);
    if (!editId) return;
    this.loadingSource.set(true);

    const sameProject = projectId === this.state.openProjectId;
    const studio$: Observable<ClipStudio | null> = sameProject ? of(this.state.studio()) : this.api.clipStudio(projectId);
    forkJoin({ edit: this.api.getEdit(projectId, editId), studio: studio$ }).subscribe({
      next: ({ edit, studio }) => {
        this.loadingSource.set(false);
        if (this.sourceEditId() !== editId) return;
        const draft = this.draftOf(edit, studio);
        const audioLength = (id: string) => studio?.musicCandidates?.find((m) => m.id === id)?.durationSeconds ?? undefined;
        const pending = edit.pendingRangeStart !== null && edit.pendingRangeEnd !== null
          ? { start: edit.pendingRangeStart, end: edit.pendingRangeEnd } : null;
        const seconds = pending ? pending.end - pending.start : draftSpanSeconds(draft, audioLength);
        this.source.set({ projectId, editId, draft, pending, seconds, audioLength });
        this.rangeStart.set(0);
        this.rangeEnd.set(round1(seconds));
      },
      error: () => {
        this.loadingSource.set(false);
        this.error.set('Could not open that video.');
      },
    });
  }

  /** A cut's timeline; the first cut of a project never edited plays every clip in order. */
  private draftOf(edit: ProjectEdit, studio: ClipStudio | null): unknown {
    if (edit.draftJson) {
      try {
        return JSON.parse(edit.draftJson);
      } catch {
        return {};
      }
    }
    if (edit.id.startsWith('main-') && studio) {
      return { rows: (studio.clips ?? []).filter((c) => !c.isExport).map((clip) => ({ clip, included: true })) };
    }
    return {};
  }

  // --- choices

  toggleLayer(layer: TransferLayer): void {
    this.selectedLayers.update((set) => {
      const next = new Set(set);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  setAllLayers(on: boolean): void {
    this.selectedLayers.set(on ? new Set(ALL_TRANSFER_LAYERS) : new Set());
  }

  /** Only the clips, or only the audio - the two shortcuts people reach for most. */
  onlyLayers(layers: TransferLayer[]): void {
    this.selectedLayers.set(new Set(layers));
  }

  setRangeChoice(choice: RangeChoice): void {
    this.rangeChoice.set(choice);
    if (choice === 'selection') {
      const r = this.state.selectedClipsRange();
      if (r) {
        this.rangeStart.set(round1(r.start));
        this.rangeEnd.set(round1(r.end));
      }
    }
  }

  useSelectionAsCustom(): void {
    const r = this.state.selectedClipsRange();
    if (!r) return;
    this.rangeStart.set(round1(r.start));
    this.rangeEnd.set(round1(r.end));
    this.rangeChoice.set('custom');
  }

  setRangeStart(v: number | string): void {
    this.rangeStart.set(clampSeconds(v, this.sourceSeconds()));
  }

  setRangeEnd(v: number | string): void {
    this.rangeEnd.set(clampSeconds(v, this.sourceSeconds()));
  }

  // --- doing it

  confirm(): void {
    if (!this.canConfirm()) return;
    this.error.set(null);
    if (this.mode() === 'create') this.createVideo();
    else this.importIntoOpenVideo();
  }

  close(): void {
    if (!this.working()) this.closed.emit();
  }

  private extract(layers: ReadonlySet<TransferLayer>, range: TransferRange | null, ignoreInvalid: boolean): TimelineFragment | null {
    if (!ignoreInvalid && this.rangeInvalid()) return null;
    if (this.mode() === 'create') {
      return extractFragment(this.state.buildDraftData(), {
        layers, range, audioLength: (id) => this.state.audioFileLength(id),
      });
    }
    const src = this.source();
    if (!src) return null;
    return extractFragment(src.draft, {
      layers, range: withPendingRange(range, src.pending), audioLength: src.audioLength,
    });
  }

  private importIntoOpenVideo(): void {
    const src = this.source();
    const targetProjectId = this.state.openProjectId;
    if (!src || !targetProjectId) return;
    const layers = this.selectedLayers();
    const range = withPendingRange(this.range(), src.pending);

    if (src.projectId === targetProjectId) {
      this.finishImport(extractFragment(src.draft, { layers, range, audioLength: src.audioLength }), 0);
      return;
    }

    // From another project: its files are copied in first, because a render here only
    // reads this project's own files. Then the same piece is taken again, pointing at
    // the copies.
    const draft = extractFragment(src.draft, { layers, range, audioLength: src.audioLength });
    const wanted = fragmentAssetIds(draft);
    this.working.set(true);
    this.api.copyAssetsFromProject(targetProjectId, src.projectId, wanted).subscribe({
      next: (mapping) => {
        const fragment = extractFragment(src.draft, {
          layers, range, audioLength: src.audioLength, assetMap: (id) => mapping[id] ?? null,
        });
        const missing = wanted.filter((id) => !mapping[id]).length;
        this.state.refreshStudioLibrary(() => {
          this.working.set(false);
          this.finishImport(fragment, missing);
        });
      },
      error: () => {
        this.working.set(false);
        this.error.set('Could not copy the files from that project.');
      },
    });
  }

  private finishImport(fragment: TimelineFragment, missingFiles: number): void {
    if (isEmptyFragment(fragment)) {
      this.error.set('Nothing could be brought over.');
      return;
    }
    this.state.importFragment(fragment, this.placement());
    const note = missingFiles > 0 ? ` ${missingFiles} file${missingFiles > 1 ? 's' : ''} could not be copied and ${missingFiles > 1 ? 'were' : 'was'} left out.` : '';
    this.state.status.notify([`Brought in ${this.previewSummaryOf(fragment)}.${note}`]);
    this.closed.emit();
  }

  private createVideo(): void {
    const projectId = this.state.openProjectId;
    if (!projectId) return;
    const base = this.state.buildDraftData();
    const fragment = extractFragment(base, {
      layers: this.selectedLayers(), range: this.range(), audioLength: (id) => this.state.audioFileLength(id),
    });
    const draft = fragmentToDraft(fragment, base);
    const first = fragment.rows[0]?.clip;
    const name = this.newName().trim();

    this.working.set(true);
    this.api.createEdit(projectId, {
      name, format: this.newFormat(), mode: 'Blank',
      category: this.newFormat() === 'Short' ? 'Short' : null,
    }).pipe(
      concatMap((edit) => this.api.saveEditDraft(projectId, edit.id, {
        draftJson: JSON.stringify(draft),
        durationSeconds: Math.round(fragment.spanSeconds * 100) / 100,
        clipCount: fragment.rows.length,
        thumbnailAssetId: first?.assetId ?? null,
      }).pipe(map(() => edit))),
    ).subscribe({
      next: (edit) => {
        this.working.set(false);
        this.state.refreshProjectEdits();
        this.state.status.notify([`Created "${edit.name}" with ${this.previewSummaryOf(fragment)}.`]);
        this.closed.emit();
        if (this.openAfterCreate()) {
          this.router.navigate([], { queryParams: { edit: edit.id }, queryParamsHandling: 'merge' });
        }
      },
      error: () => {
        this.working.set(false);
        this.error.set('Could not create the new video.');
      },
    });
  }

  private previewSummaryOf(f: TimelineFragment): string {
    const parts: string[] = [];
    if (f.rows.length) parts.push(`${f.rows.length} clip${f.rows.length > 1 ? 's' : ''}`);
    if (f.items.length) parts.push(`${f.items.length} overlay/text item${f.items.length > 1 ? 's' : ''}`);
    if (f.musicTracks.length) parts.push(`${f.musicTracks.length} audio track${f.musicTracks.length > 1 ? 's' : ''}`);
    return parts.join(', ');
  }

  editLabel(e: ProjectEdit): string {
    const fmt = e.format === 'Short' ? '9:16' : e.format === 'Square' ? '1:1' : '16:9';
    const s = Math.max(0, Math.round(e.durationSeconds));
    const self = e.id === this.state.openEditId && this.sourceProjectId() === this.state.openProjectId ? ' (this one)' : '';
    return `${e.name}${self} · ${fmt} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function clampSeconds(v: number | string, max: number): number {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(n)) return 0;
  return round1(Math.max(0, Math.min(n, Math.max(0, max))));
}
