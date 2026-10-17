import { DatePipe, DecimalPipe, NgStyle } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  ProjectContentType, RenderJob, aspectRatioLabel, isTerminal, videoFormat,
} from '../../core/models/api.models';
import { YouTubePublication, needsAttention } from '../../core/models/youtube.models';
import { ActivityService } from '../../core/services/activity.service';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { YouTubePublishDialogComponent } from '../../shared/youtube-publish-dialog.component';

type StatusFilter = 'all' | 'active' | 'completed' | 'failed' | 'cancelled';
type FormatFilter = 'all' | 'Short' | 'Video' | 'Square';
type YouTubeFilter = 'all' | 'published' | 'unpublished' | 'issues';
type SortKey = 'newest' | 'oldest' | 'name' | 'length';

/** Remembered per browser: how the render history is filtered, sorted and paged. */
const HISTORY_PREFS_KEY = 'animstudio.render.history';
const PAGE_SIZES = [10, 25, 50] as const;

interface HistoryPrefs {
  statusFilter?: StatusFilter;
  formatFilter?: FormatFilter;
  youtubeFilter?: YouTubeFilter;
  sortKey?: SortKey;
  pageSize?: number;
}

/** Queue a render, watch it, then play, download or publish the result. */
@Component({
  selector: 'app-render',
  imports: [DatePipe, DecimalPipe, FormsModule, NgStyle, RouterLink, YouTubePublishDialogComponent],
  templateUrl: './render.component.html',
  styleUrl: './render.component.css',
  host: {
    '(document:click)': 'menuFor.set(null)',
    '(document:keydown.escape)': 'menuFor.set(null)',
  },
})
export class RenderComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly activity = inject(ActivityService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- YouTube: links saved automatically when an upload finishes, plus their health ---

  /** This project's videos uploaded from the app, newest first. */
  readonly publications = signal<YouTubePublication[]>([]);
  readonly checkingYouTube = signal(false);
  readonly youtubeError = signal<string | null>(null);

  readonly publicationsByJob = computed(() => {
    const map = new Map<string, YouTubePublication[]>();
    for (const p of this.publications()) {
      const list = map.get(p.jobId);
      if (list) list.push(p); else map.set(p.jobId, [p]);
    }
    return map;
  });

  /** Videos YouTube rejected, failed to process or no longer has. */
  readonly youtubeIssues = computed(() => this.publications().filter(needsAttention));

  // --- Render history: search, filters, sorting, pagination ---

  readonly pageSizes = PAGE_SIZES;
  readonly query = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly formatFilter = signal<FormatFilter>('all');
  readonly youtubeFilter = signal<YouTubeFilter>('all');
  readonly sortKey = signal<SortKey>('newest');
  readonly pageSize = signal<number>(10);
  readonly page = signal(1);

  /** The row whose ⋯ menu is open. */
  readonly menuFor = signal<string | null>(null);
  /** The render being renamed, and the name being typed. */
  readonly editingId = signal<string | null>(null);
  readonly editName = signal('');
  readonly renaming = signal(false);

  readonly filteredJobs = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    const format = this.formatFilter();
    const yt = this.youtubeFilter();
    const pubs = this.publicationsByJob();

    const list = this.jobs().filter((job) => {
      if (status !== 'all' && this.statusGroup(job) !== status) return false;
      if (format !== 'all' && this.jobFormat(job) !== format) return false;

      const jobPubs = pubs.get(job.jobId) ?? [];
      if (yt === 'published' && jobPubs.length === 0) return false;
      if (yt === 'unpublished' && jobPubs.length > 0) return false;
      if (yt === 'issues' && !jobPubs.some(needsAttention)) return false;

      if (!q) return true;
      const haystack = [
        this.displayName(job), job.status, this.jobFormat(job), this.jobAspect(job), this.jobResolution(job),
        job.jobId, ...jobPubs.flatMap((p) => [p.title, p.channelTitle, p.videoId]),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });

    const byDate = (j: RenderJob) => new Date(j.createdAt).getTime();
    switch (this.sortKey()) {
      case 'oldest': return list.sort((a, b) => byDate(a) - byDate(b));
      case 'name': return list.sort((a, b) => this.displayName(a).localeCompare(this.displayName(b), undefined, { numeric: true }));
      case 'length': return list.sort((a, b) => (b.outputDurationSeconds ?? -1) - (a.outputDurationSeconds ?? -1));
      default: return list.sort((a, b) => byDate(b) - byDate(a));
    }
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredJobs().length / this.pageSize())));
  /** The requested page, kept in range as filters shrink the list. */
  readonly currentPage = computed(() => Math.min(Math.max(1, this.page()), this.totalPages()));

  readonly pagedJobs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredJobs().slice(start, start + this.pageSize());
  });

  readonly rangeLabel = computed(() => {
    const total = this.filteredJobs().length;
    if (total === 0) return 'No renders';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(total, start + this.pageSize() - 1);
    return `${start}–${end} of ${total}`;
  });

  /** Page buttons with gaps: 1 … 4 5 6 … 12. Zero marks a gap. */
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out: number[] = [];
    for (const p of sorted) {
      if (out.length && p - out[out.length - 1] > 1) out.push(0);
      out.push(p);
    }
    return out;
  });

  readonly hasActiveFilters = computed(() =>
    this.query().trim() !== '' || this.statusFilter() !== 'all' || this.formatFilter() !== 'all' || this.youtubeFilter() !== 'all');

  readonly statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Running' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  isTerminalStatus(status: string): boolean {
    return isTerminal(status);
  }

  encoderLabel(encoder: string): string {
    switch (encoder) {
      case 'h264_nvenc': return '⚡ NVENC GPU';
      case 'h264_qsv': return '⚡ QSV GPU';
      case 'h264_videotoolbox': return '⚡ VideoToolbox';
      default: return '🖥 CPU';
    }
  }

  readonly statusCounts = computed(() => {
    const counts: Record<StatusFilter, number> = { all: 0, active: 0, completed: 0, failed: 0, cancelled: 0 };
    for (const job of this.jobs()) {
      counts.all++;
      counts[this.statusGroup(job)]++;
    }
    return counts;
  });

  /** The render whose Publish to YouTube dialog is open. */
  readonly publishJobId = signal<string | null>(null);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  /** Polling handle; cleared on every terminal status and on destroy. */
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  readonly jobs = signal<RenderJob[]>([]);
  readonly job = signal<RenderJob | null>(null);

  readonly elapsedSeconds = signal<number>(0);
  readonly etaSeconds = signal<number | null>(null);
  readonly stageDurations = signal<Record<string, number>>({});
  readonly renderSpeed = signal<string>('1.0x');

  readonly scenesTotal = computed(() => {
    const j = this.job();
    if (j && j.scenesTotal > 0) return j.scenesTotal;
    return this.store.scenes().length || 1;
  });

  readonly scenesDone = computed(() => {
    const j = this.job();
    return j ? j.scenesDone : 0;
  });

  readonly scenesRemaining = computed(() => {
    return Math.max(0, this.scenesTotal() - this.scenesDone());
  });

  readonly elapsedFormatted = computed(() => {
    const totalSecs = this.elapsedSeconds();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly etaFormatted = computed(() => {
    const eta = this.etaSeconds();
    if (eta === null || eta <= 0) return '--:--';
    const mins = Math.floor(eta / 60);
    const secs = eta % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly isCompleted = computed(() => {
    const s = this.job()?.status;
    return s === 'Completed' || s === 'CompletedWithWarnings';
  });

  readonly isFailed = computed(() => {
    return this.job()?.status === 'Failed';
  });

  readonly pipelineStages = computed(() => {
    const j = this.job();
    const curStage = j?.currentStage ?? (this.running() ? 'Preparing' : 'Pending');
    const isDone = j?.status === 'Completed' || j?.status === 'CompletedWithWarnings';
    const durations = this.stageDurations();

    const stages = [
      {
        id: 'Preparing',
        name: 'Asset Preparation & Staging',
        summary: 'Resolving scene backgrounds, audio tracks and character assets',
        icon: '📁',
        durationSec: durations['Preparing'] ?? 0,
      },
      {
        id: 'RenderingScene',
        name: 'Scene Filtergraph Rendering',
        summary: `${this.scenesDone()} of ${this.scenesTotal()} scenes completed (${this.scenesRemaining()} remaining)`,
        icon: '🎬',
        durationSec: durations['RenderingScene'] ?? 0,
      },
      {
        id: 'Merging',
        name: 'Stream Concat & Audio Mixing',
        summary: 'Transitions, Ken Burns zooms, background music & subtitle burn-in',
        icon: '🔀',
        durationSec: durations['Merging'] ?? 0,
      },
      {
        id: 'Publishing',
        name: 'Packaging & Frame Validation',
        summary: 'Final MP4 container validation, faststart and storage publish',
        icon: '📦',
        durationSec: durations['Publishing'] ?? 0,
      },
    ];

    const order = ['Preparing', 'RenderingScene', 'Merging', 'Publishing'];
    const currentIdx = order.indexOf(curStage);

    return stages.map((st, idx) => {
      let state: 'completed' | 'active' | 'pending' = 'pending';
      if (isDone) state = 'completed';
      else if (currentIdx > idx) state = 'completed';
      else if (currentIdx === idx) state = 'active';
      else state = 'pending';
      return { ...st, state };
    });
  });

  formatStageDuration(sec: number): string {
    if (!sec || sec <= 0) return '0s';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  readonly diagnosticsModalOpen = signal<boolean>(false);
  readonly selectedDiagnosticsJob = signal<RenderJob | null>(null);

  openDiagnostics(job: RenderJob): void {
    this.selectedDiagnosticsJob.set(job);
    this.diagnosticsModalOpen.set(true);
  }

  closeDiagnostics(): void {
    this.diagnosticsModalOpen.set(false);
  }

  readonly selectedDiagnosticsStages = computed(() => {
    const j = this.selectedDiagnosticsJob();
    if (!j) return [];
    const durations = j.diagnostics
      ? {
          'Preparing': Math.round(j.diagnostics.preparingSeconds),
          'RenderingScene': Math.round(j.diagnostics.encodingSeconds),
          'Merging': Math.round(j.diagnostics.mergingSeconds),
          'Publishing': Math.round(j.diagnostics.publishingSeconds),
        }
      : this.deriveFallbackDurations(j);

    const isClipMerge = j.kind === 'ClipMerge';
    const itemsCount = j.diagnostics?.itemsCount || j.scenesTotal;

    return [
      {
        id: 'Preparing',
        name: 'Step 1: Asset Preparation & Staging',
        summary: isClipMerge ? 'Resolving media assets and watermark graphics' : 'Resolving scene backgrounds, audio tracks and character assets',
        icon: '📁',
        durationSec: durations['Preparing'] ?? 0,
        state: 'completed' as const,
      },
      {
        id: 'RenderingScene',
        name: isClipMerge ? 'Step 2: Clip Conformance & Filter Graph Encoding' : 'Step 2: Scene Filtergraph Rendering',
        summary: isClipMerge ? `Conformed and encoded ${itemsCount} clip streams` : `Rendered ${itemsCount} scene sequences`,
        icon: '🎬',
        durationSec: durations['RenderingScene'] ?? 0,
        state: 'completed' as const,
      },
      {
        id: 'Merging',
        name: isClipMerge ? 'Step 3: Stream Concat & Seamless Transitions' : 'Step 3: Stream Concat & Audio Mixing',
        summary: isClipMerge ? 'Joined conformed clips with xfade dissolves, text overlays & music' : 'Transitions, Ken Burns zooms, background music & subtitle burn-in',
        icon: '🔀',
        durationSec: durations['Merging'] ?? 0,
        state: 'completed' as const,
      },
      {
        id: 'Publishing',
        name: 'Step 4: Packaging & MP4 FastStart',
        summary: 'Final MP4 container validation, faststart multiplexing and storage publish',
        icon: '📦',
        durationSec: durations['Publishing'] ?? 0,
        state: 'completed' as const,
      },
    ];
  });

  readonly selectedDiagnosticsElapsedFormatted = computed(() => {
    const j = this.selectedDiagnosticsJob();
    if (!j) return '00:00';
    let totalSec = j.diagnostics?.totalSeconds;
    if (!totalSec && j.completedAt && j.createdAt) {
      totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
    }
    if (!totalSec) return '00:00';
    const mins = Math.floor(totalSec / 60);
    const secs = Math.round(totalSec % 60);
    return `${mins}m ${secs}s`;
  });

  readonly selectedDiagnosticsSpeed = computed(() => {
    const j = this.selectedDiagnosticsJob();
    if (j?.diagnostics?.speedFactor) return j.diagnostics.speedFactor;
    if (j?.outputDurationSeconds && j?.completedAt && j?.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      return `${(j.outputDurationSeconds / totalSec).toFixed(1)}x`;
    }
    return '1.0x';
  });

  deriveFallbackDurations(j: RenderJob): Record<string, number> {
    if (j.completedAt && j.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      const prep = Math.max(1, Math.round(totalSec * 0.08));
      const enc = Math.max(1, Math.round(totalSec * 0.72));
      const merge = Math.max(1, Math.round(totalSec * 0.15));
      const pub = Math.max(1, totalSec - (prep + enc + merge));
      return { Preparing: prep, RenderingScene: enc, Merging: merge, Publishing: pub };
    }
    return {};
  }

  applyJobDiagnostics(j: RenderJob | null): void {
    if (!j) return;
    if (j.diagnostics) {
      this.elapsedSeconds.set(Math.round(j.diagnostics.totalSeconds));
      if (j.diagnostics.speedFactor) this.renderSpeed.set(j.diagnostics.speedFactor);
      this.stageDurations.set({
        Preparing: Math.round(j.diagnostics.preparingSeconds),
        RenderingScene: Math.round(j.diagnostics.encodingSeconds),
        Merging: Math.round(j.diagnostics.mergingSeconds),
        Publishing: Math.round(j.diagnostics.publishingSeconds),
      });
    } else if (j.completedAt && j.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      this.elapsedSeconds.set(totalSec);
      if (j.outputDurationSeconds && totalSec > 0) {
        const factor = (j.outputDurationSeconds / totalSec).toFixed(1);
        this.renderSpeed.set(`${factor}x`);
      }
      this.stageDurations.set(this.deriveFallbackDurations(j));
    }
  }

  readonly previewFit = signal<'contain' | 'cover'>('contain');
  readonly previewZoom = signal<number>(100);
  readonly hasVideoClips = computed(() => this.store.assets().some((a) => a.kind === 'Video'));

  readonly rendererAvailable = computed(() => this.store.renderer()?.available ?? false);

  /** Short / Video / Square, read off the canvas - the same rule every other screen uses. */
  format(width: number, height: number): string {
    return videoFormat(width, height);
  }

  formatClass(width: number, height: number): string {
    return videoFormat(width, height) === 'Short' ? 'pill ok' : 'pill';
  }

  aspect(width: number, height: number): string {
    return aspectRatioLabel(width, height);
  }

  jobFormat(job: RenderJob): string {
    if (job.targetFormat) return job.targetFormat;
    if (job.width && job.height) return videoFormat(job.width, job.height);
    const proj = this.store.project();
    return proj ? videoFormat(proj.width, proj.height) : 'Video';
  }

  jobAspect(job: RenderJob): string {
    if (job.width && job.height) return aspectRatioLabel(job.width, job.height);
    const proj = this.store.project();
    return proj ? aspectRatioLabel(proj.width, proj.height) : '16:9';
  }

  jobResolution(job: RenderJob): string {
    if (job.width && job.height) return `${job.width}\u00d7${job.height}`;
    const proj = this.store.project();
    return proj ? `${proj.width}\u00d7${proj.height}` : '1920\u00d71080';
  }

  jobFormatClass(job: RenderJob): string {
    return this.jobFormat(job) === 'Short' ? 'pill ok' : 'pill';
  }

  renderAsShort(): void {
    const project = this.store.project();
    if (!project) return;

    let width = project.width;
    let height = project.height;
    if (width > height) {
      width = project.height;
      height = project.width;
    }

    this.status.run(
      this.api.updateProject(project.id, {
        name: project.name,
        description: project.description ?? undefined,
        width,
        height,
        fps: project.fps,
        distributionIntent: project.distributionIntent,
        acceptShareAlikeObligation: project.acceptShareAlikeObligation,
        backgroundMusicAssetId: project.backgroundMusicAssetId ?? null,
        backgroundMusicVolume: project.backgroundMusicVolume,
      }),
      (updated) => {
        this.store.project.set(updated);
        this.render();
      }
    );
  }

  /** A music project's renders publish to YouTube Music (the Music category) by default. */
  readonly isMusicProject = computed(() => this.store.project()?.contentType === 'music');

  /** Saved on the project, so every render of it - and the publish dialog - knows what it is for. */
  setContentType(contentType: ProjectContentType): void {
    const project = this.store.project();
    if (!project || (project.contentType ?? 'video') === contentType) return;

    this.status.run(
      this.api.updateProject(project.id, {
        name: project.name,
        description: project.description ?? undefined,
        width: project.width,
        height: project.height,
        fps: project.fps,
        distributionIntent: project.distributionIntent,
        acceptShareAlikeObligation: project.acceptShareAlikeObligation,
        backgroundMusicAssetId: project.backgroundMusicAssetId ?? null,
        backgroundMusicVolume: project.backgroundMusicVolume,
        contentType,
      }),
      (updated) => this.store.project.set(updated),
    );
  }

  readonly blockedReason = computed(() => {
    if (!this.rendererAvailable()) {
      return this.store.renderer()?.unavailableReason
        ?? 'Video rendering is not configured on this server.';
    }

    if (this.store.scenes().length === 0) return 'This project has no scenes yet.';

    const missing = this.store.scenesMissingBackground().length;
    if (missing > 0) return `${missing} scene(s) still need a background image.`;

    return null;
  });

  readonly running = computed(() => {
    const current = this.job();
    return current !== null && !isTerminal(current.status);
  });

  /** Only the id, so a reload of the same project does not restart the job list. */
  private readonly openProjectId = computed(() => this.store.project()?.id ?? null);

  constructor() {
    // The store loads asynchronously, so the job list waits for the project to arrive -
    // reading it once in the constructor found no project (or the previous one).
    effect(() => {
      if (!this.openProjectId()) return;
      untracked(() => {
        this.reload();
        this.loadPublications();
      });
    });

    this.readHistoryPrefs();

    // Back from connecting a channel on Google: reopen the dialog for the same render.
    const reopen = this.route.snapshot.queryParamMap.get('youtubePublish');
    if (reopen && /^[A-Za-z0-9_-]{1,64}$/.test(reopen)) {
      this.publishJobId.set(reopen);
      void this.router.navigate([], { relativeTo: this.route, queryParams: { youtubePublish: null }, replaceUrl: true });
    }
  }

  openPublish(jobId: string): void {
    this.menuFor.set(null);
    this.publishJobId.set(jobId);
  }

  // --- YouTube links and health ---

  /**
   * Shows the saved links at once, then asks YouTube how they are doing. The server skips
   * videos checked in the last few minutes, so opening the page often costs no quota.
   */
  loadPublications(force = false): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    if (!force) {
      this.youtube.videos(projectId).subscribe({
        next: (list) => { if (this.store.projectId() === projectId) this.publications.set(list); },
        error: (e: Error) => this.youtubeError.set(e.message),
      });
    }

    this.checkingYouTube.set(true);
    this.youtube.refreshVideos(projectId, force).subscribe({
      next: (list) => {
        if (this.store.projectId() === projectId) this.publications.set(list);
        this.youtubeError.set(null);
        this.checkingYouTube.set(false);
      },
      error: (e: Error) => {
        // The saved links are still shown; only the fresh check failed.
        this.youtubeError.set(force ? e.message : null);
        this.checkingYouTube.set(false);
      },
    });
  }

  /** The publish dialog finished an upload: the link is already saved, so just reload the list. */
  onPublished(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;
    this.youtube.videos(projectId).subscribe({
      next: (list) => this.publications.set(list),
      error: (e: Error) => this.youtubeError.set(e.message),
    });
  }

  jobPublications(jobId: string): YouTubePublication[] {
    return this.publicationsByJob().get(jobId) ?? [];
  }

  jobHasIssue(jobId: string): boolean {
    return this.jobPublications(jobId).some(needsAttention);
  }

  healthLabel(p: YouTubePublication): string {
    switch (p.health) {
      case 'Ok': return p.privacyStatus ? `Live · ${p.privacyStatus}` : 'Live';
      case 'Processing': return 'Processing';
      case 'Issue': return 'Issue';
      case 'Removed': return 'Removed';
      default: return 'Not checked';
    }
  }

  healthClass(p: YouTubePublication): string {
    switch (p.health) {
      case 'Ok': return 'yt-health ok';
      case 'Processing': return 'yt-health busy';
      case 'Issue':
      case 'Removed': return 'yt-health err';
      default: return 'yt-health';
    }
  }

  copyLink(url: string): void {
    this.menuFor.set(null);
    if (!navigator.clipboard) {
      this.status.notify(['Copying is blocked in this browser. Open the video and copy its address.']);
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => this.status.notify(['YouTube link copied.']),
      () => this.status.notify(['Copying is blocked in this browser. Open the video and copy its address.']),
    );
  }

  forgetPublication(p: YouTubePublication): void {
    this.menuFor.set(null);
    if (!confirm(`Remove the saved link to "${p.title}"? The video stays on YouTube.`)) return;
    this.youtube.forgetVideo(p.id).subscribe({
      next: () => this.publications.update((list) => list.filter((x) => x.id !== p.id)),
      error: (e: Error) => this.youtubeError.set(e.message),
    });
  }

  /** Jump from an issue to its render in the history. */
  showJobById(jobId: string): void {
    const job = this.jobs().find((j) => j.jobId === jobId);
    if (job) {
      this.watch(job);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- History: naming, filters, paging ---

  /** The render's name, or a readable stand-in for renders from before names existed. */
  displayName(job: RenderJob): string {
    if (job.name) return job.name;
    const project = this.store.project()?.name ?? 'Render';
    return `${project} · ${this.jobFormat(job)} ${this.jobAspect(job)}`;
  }

  statusGroup(job: RenderJob): Exclude<StatusFilter, 'all'> {
    switch (job.status) {
      case 'Completed':
      case 'CompletedWithWarnings': return 'completed';
      case 'Failed': return 'failed';
      case 'Cancelled': return 'cancelled';
      default: return 'active';
    }
  }

  statusLabel(status: string): string {
    return status === 'CompletedWithWarnings' ? 'Completed (warnings)' : status;
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.saveHistoryPrefs();
  }

  setFormatFilter(value: FormatFilter): void {
    this.formatFilter.set(value);
    this.page.set(1);
    this.saveHistoryPrefs();
  }

  setYouTubeFilter(value: YouTubeFilter): void {
    this.youtubeFilter.set(value);
    this.page.set(1);
    this.saveHistoryPrefs();
  }

  setSort(value: SortKey): void {
    this.sortKey.set(value);
    this.saveHistoryPrefs();
  }

  setPageSize(value: number | string): void {
    const size = Number(value);
    if (!(PAGE_SIZES as readonly number[]).includes(size)) return;
    this.pageSize.set(size);
    this.page.set(1);
    this.saveHistoryPrefs();
  }

  goToPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  clearFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
    this.formatFilter.set('all');
    this.youtubeFilter.set('all');
    this.page.set(1);
    this.saveHistoryPrefs();
  }

  toggleMenu(jobId: string, event: Event): void {
    event.stopPropagation();
    this.menuFor.update((open) => (open === jobId ? null : jobId));
  }

  startRename(job: RenderJob): void {
    this.menuFor.set(null);
    if (!isTerminal(job.status)) {
      this.status.notify(['Rename it once the render has finished.']);
      return;
    }
    this.editingId.set(job.jobId);
    this.editName.set(this.displayName(job));
  }

  cancelRename(): void {
    this.editingId.set(null);
    this.editName.set('');
  }

  saveRename(job: RenderJob): void {
    const name = this.editName().trim();
    if (!name || name === job.name) {
      this.cancelRename();
      return;
    }
    if (name.length > 120) {
      this.status.notify(['Keep the name under 120 characters.']);
      return;
    }

    this.renaming.set(true);
    this.api.renameJob(job.jobId, name).subscribe({
      next: (updated) => {
        const apply = (j: RenderJob) => (j.jobId === updated.jobId ? { ...j, name: updated.name } : j);
        this.jobs.update((list) => list.map(apply));
        this.job.update((current) => (current ? apply(current) : current));
        this.renaming.set(false);
        this.cancelRename();
      },
      error: (e: Error) => {
        this.renaming.set(false);
        this.status.notify([e.message]);
      },
    });
  }

  private readHistoryPrefs(): void {
    try {
      const prefs = JSON.parse(localStorage.getItem(HISTORY_PREFS_KEY) ?? '{}') as HistoryPrefs;
      const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
        allowed.includes(value as T) ? (value as T) : fallback;
      this.statusFilter.set(pick(prefs.statusFilter, ['all', 'active', 'completed', 'failed', 'cancelled'], 'all'));
      this.formatFilter.set(pick(prefs.formatFilter, ['all', 'Short', 'Video', 'Square'], 'all'));
      this.youtubeFilter.set(pick(prefs.youtubeFilter, ['all', 'published', 'unpublished', 'issues'], 'all'));
      this.sortKey.set(pick(prefs.sortKey, ['newest', 'oldest', 'name', 'length'], 'newest'));
      if ((PAGE_SIZES as readonly number[]).includes(Number(prefs.pageSize))) this.pageSize.set(Number(prefs.pageSize));
    } catch {
      // Storage blocked or unreadable: the defaults apply.
    }
  }

  private saveHistoryPrefs(): void {
    try {
      const prefs: HistoryPrefs = {
        statusFilter: this.statusFilter(),
        formatFilter: this.formatFilter(),
        youtubeFilter: this.youtubeFilter(),
        sortKey: this.sortKey(),
        pageSize: this.pageSize(),
      };
      localStorage.setItem(HISTORY_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Storage blocked: the choices just aren't remembered.
    }
  }

  /** Where Google sign-in returns to: this page, with the dialog reopened for the same render. */
  publishReturnPath(jobId: string): string {
    const path = this.router.url.split('?')[0];
    return `${path}?youtubePublish=${encodeURIComponent(jobId)}`;
  }

  private destroyed = false;

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopPolling();
  }

  render(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.render(projectId), (job) => {
      this.job.set(job);
      this.jobs.update((list) => [job, ...list]);
      this.startPolling(job.jobId);
      this.activity.trackRenderJob(
        job, job.name || this.store.project()?.name || 'Project render', ['/projects', projectId, 'render']);
    });
  }

  cancel(): void {
    const current = this.job();
    if (!current) return;

    this.status.run(this.api.cancelJob(current.jobId));
  }

  watch(job: RenderJob): void {
    this.job.set(job);
    if (!isTerminal(job.status)) {
      this.startPolling(job.jobId);
    } else {
      this.applyJobDiagnostics(job);
    }
  }

  previewUrl(jobId: string): string {
    return this.api.previewUrl(jobId);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
  }

  /** The project's dialogue as one .srt, timed exactly as it was burned into this render. */
  subtitlesUrl(): string | null {
    const projectId = this.store.projectId();
    const hasDialogue = this.store.scenes().some((s) => s.dialogueLines > 0);
    return projectId && hasDialogue ? this.api.subtitlesUrl(projectId) : null;
  }

  setPreviewFit(fit: 'contain' | 'cover'): void {
    this.previewFit.set(fit);
  }

  setPreviewZoom(zoom: number): void {
    this.previewZoom.set(zoom);
  }

  playerContainerStyle(job: RenderJob): { [key: string]: string } {
    const isShort = this.jobFormat(job) === 'Short' || Boolean(job.width && job.height && job.height > job.width);
    if (isShort) {
      return {
        'aspect-ratio': '9 / 16',
        'max-width': '340px',
        'margin': '0 auto',
      };
    }
    const isSquare = this.jobFormat(job) === 'Square' || Boolean(job.width && job.height && job.height === job.width);
    if (isSquare) {
      return {
        'aspect-ratio': '1 / 1',
        'max-width': '480px',
        'margin': '0 auto',
      };
    }
    return {
      'aspect-ratio': '16 / 9',
      'max-width': '760px',
      'margin': '0 auto',
    };
  }

  statusClass(jobStatus: string): string {
    if (jobStatus === 'Completed' || jobStatus === 'CompletedWithWarnings') return 'pill ok';
    if (jobStatus === 'Failed') return 'pill err';
    if (jobStatus === 'Cancelled') return 'pill warn';
    return 'pill';
  }

  private reload(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.stopPolling();
    this.jobs.set([]);
    this.job.set(null);

    this.status.run(this.api.listJobs(projectId), (list) => {
      if (this.store.projectId() !== projectId) return; // answered after a project switch
      this.jobs.set(list);

      // Reattach to whatever is still running, so leaving the page does not lose it.
      const active = list.find((j) => !isTerminal(j.status)) ?? list[0];
      if (!active) return;

      this.job.set(active);
      if (!isTerminal(active.status)) {
        this.startPolling(active.jobId);
      } else {
        this.applyJobDiagnostics(active);
      }
    });
  }

  private timerHandle: any = null;

  private startTimer(): void {
    this.stopTimer();
    this.elapsedSeconds.set(0);
    this.etaSeconds.set(null);
    this.stageDurations.set({});

    this.timerHandle = setInterval(() => {
      this.elapsedSeconds.update((s) => s + 1);

      const stage = this.job()?.currentStage || 'Preparing';
      const durations = { ...this.stageDurations() };
      durations[stage] = (durations[stage] ?? 0) + 1;
      this.stageDurations.set(durations);

      const progress = this.job()?.progress ?? 0;
      const elapsed = this.elapsedSeconds();
      if (progress >= 3 && progress < 100) {
        const totalEstimated = (elapsed / progress) * 100;
        const remaining = Math.max(0, Math.round(totalEstimated - elapsed));
        this.etaSeconds.set(remaining);

        const done = this.scenesDone();
        if (elapsed > 2 && done > 0) {
          const speed = (done * 4.0) / Math.max(1, elapsed);
          this.renderSpeed.set(`${Math.max(0.8, Number(speed.toFixed(1)))}x`);
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private startPolling(jobId: string): void {
    this.stopPolling();
    // A reply that lands after the page is gone must not start a poll nobody can stop.
    if (this.destroyed) return;
    this.startTimer();

    this.pollHandle = setInterval(() => {
      this.api.job(jobId).subscribe({
        next: (job) => {
          this.job.set(job);
          this.jobs.update((list) => list.map((j) => (j.jobId === job.jobId ? job : j)));

          if (isTerminal(job.status)) {
            this.stopPolling();
            this.stopTimer();
            this.etaSeconds.set(0);
            this.applyJobDiagnostics(job);
            this.status.notify(job.warnings);
          }
        },
        error: () => {
          this.stopPolling();
          this.stopTimer();
        },
      });
    }, 1500);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    this.stopTimer();
  }
}
