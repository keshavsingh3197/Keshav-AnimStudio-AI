import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import { RangePickerComponent } from './range-picker/range-picker.component';
import {
  CreateEditBody, CreateEditMode, EDIT_CATEGORY_SUGGESTIONS, EDIT_FORMATS, EditFormat, ProjectEdit, SHORTS_MAX_SECONDS,
} from '../../core/models/api.models';

type SortKey = 'recent' | 'name' | 'longest';

/** What the create / details dialog is editing. */
interface EditForm {
  name: string;
  format: EditFormat;
  category: string;
  tags: string;
  mode: CreateEditMode;
  sourceEditId: string | null;
  rangeStart: number;
  rangeEnd: number;
  openAfter: boolean;
}

/**
 * Every cut of a project - the full video, Shorts, teasers - in one place. Each cut uses
 * the same project assets but keeps its own timeline, so a Short can be carved out of the
 * full video and both stay editable.
 */
@Component({
  selector: 'app-videos-page',
  standalone: true,
  imports: [RangePickerComponent],
  templateUrl: './videos-page.component.html',
  styleUrl: './videos-page.component.css',
})
export class VideosPageComponent {
  private readonly api = inject(ApiService);
  private readonly store = inject(ProjectStore);
  private readonly status = inject(StatusService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly formats = EDIT_FORMATS;
  readonly shortsMax = SHORTS_MAX_SECONDS;

  readonly projectId = computed(() => this.store.project()?.id ?? null);
  readonly edits = signal<ProjectEdit[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);

  // --- filters
  readonly search = signal('');
  readonly formatFilter = signal<EditFormat | 'All'>('All');
  readonly categoryFilter = signal<string | null>(null);
  readonly sort = signal<SortKey>('recent');

  readonly categories = computed(() => {
    const set = new Set<string>();
    for (const e of this.edits()) if (e.category) set.add(e.category);
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  readonly categorySuggestions = computed(() =>
    [...new Set([...this.categories(), ...EDIT_CATEGORY_SUGGESTIONS])]);

  readonly formatCounts = computed(() => {
    const counts: Record<string, number> = { All: this.edits().length, Video: 0, Short: 0, Square: 0 };
    for (const e of this.edits()) counts[e.format] = (counts[e.format] ?? 0) + 1;
    return counts;
  });

  readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    const fmt = this.formatFilter();
    const cat = this.categoryFilter();
    const list = this.edits().filter((e) =>
      (fmt === 'All' || e.format === fmt)
      && (!cat || e.category === cat)
      && (!q || e.name.toLowerCase().includes(q)
        || (e.category ?? '').toLowerCase().includes(q)
        || e.tags.some((t) => t.toLowerCase().includes(q))));
    const by = this.sort();
    return [...list].sort((a, b) =>
      by === 'name' ? a.name.localeCompare(b.name)
        : by === 'longest' ? b.durationSeconds - a.durationSeconds
          : b.updatedAt.localeCompare(a.updatedAt));
  });

  // --- dialog
  readonly dialog = signal<{ kind: 'create' } | { kind: 'details'; edit: ProjectEdit } | null>(null);
  readonly form = signal<EditForm>(this.blankForm());
  readonly confirmDeleteId = signal<string | null>(null);

  readonly formSource = computed(() => this.edits().find((e) => e.id === this.form().sourceEditId) ?? null);
  /** Lengths read from the timelines themselves by the preview; the listing can be stale. */
  private readonly measuredLengths = signal<Record<string, number>>({});
  readonly formSourceLength = computed(() => {
    const src = this.formSource();
    return src ? this.measuredLengths()[src.id] ?? src.durationSeconds : 0;
  });
  readonly formRangeLength = computed(() => Math.max(0, this.form().rangeEnd - this.form().rangeStart));
  readonly formError = computed<string | null>(() => {
    const f = this.form();
    if (!f.name.trim()) return 'Give it a name.';
    if (this.dialog()?.kind !== 'create') return null;
    if (f.mode !== 'Blank' && !f.sourceEditId) return 'Choose which video to start from.';
    if (f.mode === 'Range' && this.formRangeLength() < 1) return 'The part to keep must be at least one second long.';
    return null;
  });

  private readonly query = toSignal(this.route.queryParamMap);

  constructor() {
    effect(() => {
      const id = this.projectId();
      if (id) untracked(() => this.load(id));
    });

    // ?create=1&from=<id>: opened from the editor's "New video or Short from this one".
    effect(() => {
      const q = this.query();
      const list = this.edits();
      if (!q?.get('create') || list.length === 0) return;
      untracked(() => {
        const from = list.find((e) => e.id === q.get('from'));
        this.openCreate(from ?? null, from ? 'Range' : 'Blank');
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      });
    });
  }

  private load(projectId: string): void {
    this.loading.set(true);
    this.api.listEdits(projectId).subscribe({
      next: (list) => {
        if (this.projectId() !== projectId) return;
        this.edits.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.status.error.set("Could not load this project's videos.");
      },
    });
  }

  // --- helpers for the template

  thumbUrl(e: ProjectEdit): string | null {
    return e.thumbnailAssetId ? this.api.assetThumbnailUrl(e.thumbnailAssetId) : null;
  }

  ratio(format: EditFormat): string {
    return EDIT_FORMATS.find((f) => f.value === format)?.ratio ?? '16:9';
  }

  formatLabel(format: EditFormat): string {
    return EDIT_FORMATS.find((f) => f.value === format)?.label ?? format;
  }

  sourceName(e: ProjectEdit): string | null {
    return e.sourceEditId ? this.edits().find((x) => x.id === e.sourceEditId)?.name ?? 'a deleted video' : null;
  }

  clock(seconds: number | null | undefined): string {
    const s = Math.max(0, Math.round(seconds ?? 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  }

  ago(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} d ago`;
    return new Date(iso).toLocaleDateString();
  }

  // --- actions

  open(e: ProjectEdit): void {
    const id = this.projectId();
    if (id) this.router.navigate(['/projects', id, 'clips'], { queryParams: { edit: e.id } });
  }

  private blankForm(): EditForm {
    return {
      name: '', format: 'Video', category: '', tags: '', mode: 'Blank',
      sourceEditId: null, rangeStart: 0, rangeEnd: 60, openAfter: true,
    };
  }

  openCreate(from: ProjectEdit | null = null, mode: CreateEditMode = 'Blank', format: EditFormat = from ? 'Short' : 'Video'): void {
    const length = from?.durationSeconds ?? 0;
    const end = format === 'Short' ? Math.min(length, 60) : length;
    const n = this.edits().filter((e) => e.format === format).length + 1;
    this.form.set({
      ...this.blankForm(),
      name: format === 'Short' ? `Short ${n}` : format === 'Square' ? `Square ${n}` : `Video ${n}`,
      format,
      category: format === 'Short' ? 'Short' : '',
      mode: from ? mode : 'Blank',
      sourceEditId: from?.id ?? this.edits()[0]?.id ?? null,
      rangeStart: 0,
      rangeEnd: end > 0 ? end : 60,
    });
    this.dialog.set({ kind: 'create' });
  }

  openDetails(e: ProjectEdit): void {
    this.form.set({ ...this.blankForm(), name: e.name, format: e.format, category: e.category ?? '', tags: e.tags.join(', ') });
    this.dialog.set({ kind: 'details', edit: e });
  }

  closeDialog(): void { this.dialog.set(null); }

  patchForm(patch: Partial<EditForm>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  /** Picking a Short caps the kept part at the Shorts limit if it was longer. */
  setFormat(format: EditFormat): void {
    const f = this.form();
    const patch: Partial<EditForm> = { format };
    if (format === 'Short' && f.rangeEnd - f.rangeStart > SHORTS_MAX_SECONDS) {
      patch.rangeEnd = f.rangeStart + Math.min(60, SHORTS_MAX_SECONDS);
    }
    if (format === 'Short' && !f.category) patch.category = 'Short';
    this.patchForm(patch);
  }

  setSource(id: string): void {
    const src = this.edits().find((e) => e.id === id);
    this.patchForm({ sourceEditId: id });
    const len = this.measuredLengths()[id] ?? src?.durationSeconds ?? 0;
    if (len > 0) this.fitRangeInto(len);
  }

  /** The part to keep, as the range picker proposes it: clamped to the source, at least 1 s. */
  setRangeBoth(start: number, end: number): void {
    const len = this.formSourceLength();
    const max = len > 0 ? len : 24 * 3600;
    const round = (v: number) => Math.round(Math.max(0, Math.min(max, v)) * 10) / 10;
    let s = round(start);
    let e = round(end);
    if (e - s < 1) {
      if (s + 1 <= max) e = round(s + 1);
      else s = round(e - 1);
    }
    this.patchForm({ rangeStart: s, rangeEnd: e });
  }

  /**
   * The preview read the source's real length. A fresh dialog whose default part ran past
   * the listed (possibly stale or zero) length is pulled back inside it.
   */
  setSourceLength(editId: string, seconds: number): void {
    this.measuredLengths.update((m) => ({ ...m, [editId]: seconds }));
    if (this.form().sourceEditId === editId) this.fitRangeInto(seconds);
  }

  /** Keeps the part's length where it can, sliding it back inside a source of `seconds`. */
  private fitRangeInto(seconds: number): void {
    const f = this.form();
    if (f.rangeEnd > seconds || f.rangeStart >= seconds) {
      const span = Math.min(f.rangeEnd - f.rangeStart, seconds);
      const start = Math.min(f.rangeStart, Math.max(0, seconds - span));
      this.setRangeBoth(start, start + span);
    }
  }

  private parseTags(text: string): string[] {
    return text.split(',').map((t) => t.trim()).filter(Boolean);
  }

  submit(): void {
    const id = this.projectId();
    const d = this.dialog();
    if (!id || !d || this.formError() || this.busy()) return;
    const f = this.form();
    this.busy.set(true);

    if (d.kind === 'details') {
      this.api.updateEdit(id, d.edit.id, {
        name: f.name.trim(), format: f.format, category: f.category.trim(), tags: this.parseTags(f.tags),
      }).subscribe({
        next: (saved) => {
          this.edits.update((list) => list.map((e) => (e.id === saved.id ? saved : e)));
          this.busy.set(false);
          this.closeDialog();
        },
        error: () => { this.busy.set(false); this.status.error.set('Could not save the details.'); },
      });
      return;
    }

    const body: CreateEditBody = {
      name: f.name.trim(),
      format: f.format,
      category: f.category.trim() || null,
      tags: this.parseTags(f.tags),
      mode: f.mode,
      sourceEditId: f.mode === 'Blank' ? null : f.sourceEditId,
      rangeStart: f.mode === 'Range' ? f.rangeStart : null,
      rangeEnd: f.mode === 'Range' ? f.rangeEnd : null,
    };
    this.api.createEdit(id, body).subscribe({
      next: (created) => {
        this.edits.update((list) => [created, ...list]);
        this.busy.set(false);
        this.closeDialog();
        if (f.openAfter) this.open(created);
      },
      error: () => { this.busy.set(false); this.status.error.set('Could not create the video.'); },
    });
  }

  duplicate(e: ProjectEdit): void {
    const id = this.projectId();
    if (!id || this.busy()) return;
    this.busy.set(true);
    this.api.duplicateEdit(id, e.id).subscribe({
      next: (copy) => { this.edits.update((list) => [copy, ...list]); this.busy.set(false); },
      error: () => { this.busy.set(false); this.status.error.set('Could not duplicate the video.'); },
    });
  }

  remove(e: ProjectEdit): void {
    const id = this.projectId();
    if (!id || this.busy()) return;
    this.busy.set(true);
    this.api.deleteEdit(id, e.id).subscribe({
      next: () => {
        this.edits.update((list) => list.filter((x) => x.id !== e.id));
        this.confirmDeleteId.set(null);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.confirmDeleteId.set(null);
        this.status.error.set(this.edits().length <= 1
          ? 'A project keeps at least one video.'
          : 'Could not delete the video.');
      },
    });
  }
}
