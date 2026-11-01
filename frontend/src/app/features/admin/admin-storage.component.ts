import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { DriveSyncReport, StorageDetail, StorageFolder, formatBytes } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { csvCell } from '../youtube/csv';
import { downloadText, fileStamp, parseUtc, relativeTime } from './admin-format';

type Direction = 'MongoToSql' | 'SqlToMongo' | 'Both';
type SortKey = 'bytes' | 'files' | 'name';

const GB = 1024 ** 3;
const MAX_QUOTA_GB = 1_000_000;
const QUOTA_PRESETS = [50, 100, 250, 500, 1000] as const;
/** The meter turns amber here, and red when the quota is reached. */
const WARN_AT = 85;
const SEGMENT_COLOURS = ['#6c8cff', '#22d36b', '#f59e0b', '#a78bfa', '#38bdf8', '#f472b6'];

interface Segment {
  name: string;
  bytes: number;
  files: number;
  colour: string;
  /** Width as a share of the whole bar. */
  width: number;
}

const DIRECTIONS: Record<Direction, { label: string; detail: string }> = {
  Both: {
    label: 'Sync both ways',
    detail: 'Copies new and changed records in both directions. Where a topic or post was edited in both, the newer edit wins.',
  },
  MongoToSql: {
    label: 'MongoDB → SQL Server',
    detail: 'Copies drive folders, topics, calendar posts and Drive copies from MongoDB into SQL Server.',
  },
  SqlToMongo: {
    label: 'SQL Server → MongoDB',
    detail: 'Copies drive folders, topics, calendar posts and Drive copies from SQL Server into MongoDB.',
  },
};

/**
 * Where the media goes: how much of the store is used, which folders hold it, and the
 * quota the project hub's storage bar fills against.
 *
 * A quota only changes what the bar fills against - it never deletes or blocks anything -
 * so setting one below the current usage is allowed, once it has been said out loud.
 */
@Component({
  selector: 'app-admin-storage',
  imports: [DatePipe],
  templateUrl: './admin-storage.component.html',
  styleUrls: ['./admin-ui.css', './admin-storage.component.css'],
})
export class AdminStorageComponent {
  private readonly api = inject(ApiService);
  readonly status = inject(StatusService);
  readonly bytes = formatBytes;

  readonly presets = QUOTA_PRESETS;
  readonly directions = DIRECTIONS;
  readonly directionKeys: readonly Direction[] = ['Both', 'MongoToSql', 'SqlToMongo'];

  readonly detail = signal<StorageDetail | null>(null);
  readonly loading = signal(true);
  readonly measuring = signal(false);
  readonly failure = signal<string | null>(null);
  readonly now = signal(Date.now());

  /** Null = untouched; empty = no quota; otherwise what was typed. */
  readonly quotaInput = signal<string | null>(null);
  readonly confirmLow = signal(false);
  readonly savingQuota = signal(false);
  readonly flash = signal<{ tone: 'ok' | 'err'; text: string } | null>(null);

  readonly query = signal('');
  readonly sortKey = signal<SortKey>('bytes');
  readonly sortDesc = signal(true);

  readonly syncAvailable = signal(false);
  readonly syncReport = signal<DriveSyncReport | null>(null);
  readonly syncAsk = signal<Direction | null>(null);
  readonly syncRunning = signal<Direction | null>(null);
  readonly syncFailure = signal<string | null>(null);
  readonly syncFinishedAt = signal<number | null>(null);

  readonly percent = computed(() => {
    const s = this.detail()?.summary;
    return s?.capacityBytes ? (s.usedBytes / s.capacityBytes) * 100 : 0;
  });

  readonly state = computed<'ok' | 'warn' | 'full'>(() => {
    const p = this.percent();
    return p >= 100 ? 'full' : p >= WARN_AT ? 'warn' : 'ok';
  });

  readonly headline = computed(() => {
    const d = this.detail();
    if (!d || !d.summary.capacityBytes) return '';
    const left = d.summary.capacityBytes - d.summary.usedBytes;
    if (left <= 0) return `Over by ${formatBytes(-left)}`;
    return `${formatBytes(left)} left`;
  });

  /** Null = untouched; 'invalid' = not a whole number of GB; otherwise the parsed value (null = no quota). */
  readonly quotaDraft = computed<number | null | 'invalid' | 'untouched'>(() => {
    const raw = this.quotaInput();
    if (raw === null) return 'untouched';
    if (raw.trim() === '') return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 1 && n <= MAX_QUOTA_GB ? n : 'invalid';
  });

  readonly quotaValid = computed(() => this.quotaDraft() !== 'invalid');
  readonly quotaDirty = computed(() => {
    const draft = this.quotaDraft();
    return draft !== 'untouched' && draft !== 'invalid' && draft !== (this.detail()?.quotaGb ?? null);
  });

  /** What the bar would read at the quota being typed. */
  readonly preview = computed(() => {
    const draft = this.quotaDraft();
    const used = this.detail()?.summary.usedBytes ?? 0;
    if (typeof draft !== 'number') return null;
    const pct = (used / (draft * GB)) * 100;
    return { pct, state: pct >= 100 ? 'full' : pct >= WARN_AT ? 'warn' : 'ok' } as const;
  });

  readonly belowUsage = computed(() => this.preview()?.state === 'full');

  readonly diskFreePct = computed(() => {
    const d = this.detail();
    return d && d.diskTotalBytes && d.diskFreeBytes !== null ? (d.diskFreeBytes / d.diskTotalBytes) * 100 : null;
  });

  readonly diskLow = computed(() => {
    const d = this.detail();
    const pct = this.diskFreePct();
    return !!d && d.diskFreeBytes !== null && (d.diskFreeBytes < 5 * GB || (pct !== null && pct < 10));
  });

  /** The meter is cut into the biggest folders so "what is using it" needs no second look. */
  readonly segments = computed<Segment[]>(() => {
    const d = this.detail();
    if (!d || d.summary.usedBytes <= 0) return [];

    const whole = Math.max(d.summary.capacityBytes ?? 0, d.summary.usedBytes);
    const sorted = [...d.folders].filter((f) => f.bytes > 0).sort((a, b) => b.bytes - a.bytes);
    const top = sorted.slice(0, SEGMENT_COLOURS.length - 1);
    const rest = sorted.slice(top.length);

    const parts: Segment[] = top.map((f, i) => ({
      name: f.name, bytes: f.bytes, files: f.files, colour: SEGMENT_COLOURS[i], width: (f.bytes / whole) * 100,
    }));
    if (rest.length > 0) {
      const bytes = rest.reduce((s, f) => s + f.bytes, 0);
      parts.push({
        name: `${rest.length} other ${rest.length === 1 ? 'folder' : 'folders'}`, bytes,
        files: rest.reduce((s, f) => s + f.files, 0), colour: SEGMENT_COLOURS[SEGMENT_COLOURS.length - 1],
        width: (bytes / whole) * 100,
      });
    }
    return parts;
  });

  readonly folderRows = computed(() => {
    const d = this.detail();
    if (!d) return [];

    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const dir = this.sortDesc() ? -1 : 1;
    const key = this.sortKey();

    return d.folders
      .filter((f) => terms.every((t) => f.name.toLowerCase().includes(t)))
      .sort((a, b) => {
        const order = key === 'name' ? a.name.localeCompare(b.name) : key === 'files' ? a.files - b.files : a.bytes - b.bytes;
        return order * dir || b.bytes - a.bytes;
      });
  });

  readonly measuredAgo = computed(() => {
    const at = parseUtc(this.detail()?.summary.measuredAt);
    return Number.isNaN(at) ? '' : relativeTime(at, this.now());
  });

  readonly syncTotals = computed(() => {
    const report = this.syncReport();
    if (!report) return null;
    return {
      copied: report.details.reduce((s, x) => s + x.copied, 0),
      updated: report.details.reduce((s, x) => s + x.updated, 0),
      skipped: report.details.reduce((s, x) => s + x.skipped, 0),
    };
  });

  constructor() {
    this.load(false);
    this.api.syncDriveDataAvailable().subscribe({
      next: (ok) => this.syncAvailable.set(ok),
      error: () => this.syncAvailable.set(false),
    });
  }

  /** `refresh` re-walks the disk instead of using the server's recent measurement. */
  load(refresh: boolean): void {
    if (refresh) this.measuring.set(true);
    else this.loading.set(true);

    this.api.adminStorage(refresh).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.failure.set(null);
        this.loading.set(false);
        this.measuring.set(false);
        this.now.set(Date.now());
      },
      error: (failure: unknown) => {
        this.loading.set(false);
        this.measuring.set(false);
        this.failure.set(this.messageOf(failure, 'Storage could not be measured.'));
      },
    });
  }

  // --- quota ---------------------------------------------------------------------------

  onQuotaInput(value: string): void {
    this.quotaInput.set(value);
    this.confirmLow.set(false);
    this.flash.set(null);
  }

  usePreset(gb: number): void {
    this.onQuotaInput(String(gb));
  }

  resetQuotaInput(): void {
    this.quotaInput.set(null);
    this.confirmLow.set(false);
  }

  /** A quota below what is already stored is allowed, but only after it has been said out loud. */
  saveQuota(): void {
    const draft = this.quotaDraft();
    if (draft === 'untouched' || draft === 'invalid' || this.savingQuota()) return;
    if (this.belowUsage() && !this.confirmLow()) {
      this.confirmLow.set(true);
      return;
    }
    this.applyQuota(draft);
  }

  clearQuota(): void {
    this.applyQuota(null);
  }

  private applyQuota(quota: number | null): void {
    this.savingQuota.set(true);
    this.flash.set(null);

    this.api.updateStorageQuota(quota).subscribe({
      next: (d) => {
        this.savingQuota.set(false);
        this.detail.set(d);
        this.quotaInput.set(null);
        this.confirmLow.set(false);
        const text = quota === null ? 'Storage quota removed.' : `Storage quota set to ${quota} GB.`;
        this.flash.set({ tone: 'ok', text });
        this.status.notify([text]);
      },
      error: (failure: unknown) => {
        this.savingQuota.set(false);
        this.flash.set({ tone: 'err', text: this.messageOf(failure, 'The quota could not be saved.') });
      },
    });
  }

  // --- folders -------------------------------------------------------------------------

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDesc.update((d) => !d);
    } else {
      this.sortKey.set(key);
      this.sortDesc.set(key !== 'name');
    }
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    return this.sortKey() !== key ? 'none' : this.sortDesc() ? 'descending' : 'ascending';
  }

  /** Folders folded into "other" share its colour, so every row in the table maps to the bar. */
  colourOf(folder: StorageFolder): string {
    return this.segments().find((s) => s.name === folder.name)?.colour ?? SEGMENT_COLOURS[SEGMENT_COLOURS.length - 1];
  }

  share(folder: StorageFolder): number {
    const used = this.detail()?.summary.usedBytes ?? 0;
    return used === 0 ? 0 : (folder.bytes / used) * 100;
  }

  pct(value: number): string {
    return value > 0 && value < 1 ? '<1%' : `${Math.round(value)}%`;
  }

  exportCsv(): void {
    const d = this.detail();
    if (!d || d.folders.length === 0) return;

    const used = d.summary.usedBytes;
    const lines = [...d.folders].sort((a, b) => b.bytes - a.bytes).map((f) =>
      [f.name, f.bytes, f.files, used === 0 ? 0 : ((f.bytes / used) * 100).toFixed(2)].map(csvCell).join(','));

    downloadText(`animstudio-storage-${fileStamp()}.csv`,
      [['Folder', 'Bytes', 'Files', 'Share of used %'].join(','), ...lines].join('\r\n'));
  }

  // --- database sync -------------------------------------------------------------------

  askSync(direction: Direction): void {
    this.syncFailure.set(null);
    this.syncAsk.set(direction);
  }

  runSync(): void {
    const direction = this.syncAsk();
    if (!direction || this.syncRunning()) return;

    this.syncAsk.set(null);
    this.syncRunning.set(direction);
    this.syncFailure.set(null);

    this.api.syncDriveData(direction).subscribe({
      next: (report) => {
        this.syncRunning.set(null);
        this.syncReport.set(report);
        this.syncFinishedAt.set(Date.now());
        this.status.notify([report.message]);
      },
      error: (failure: unknown) => {
        this.syncRunning.set(null);
        this.syncFailure.set(this.messageOf(failure, 'The sync could not be run.'));
      },
    });
  }

  private messageOf(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure ? failure.message : fallback;
  }
}
