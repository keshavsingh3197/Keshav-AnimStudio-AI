import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { Asset, Project, RenderJob } from '../../core/models/api.models';
import {
  BUSY_STATES,
  LiveStreamChannel,
  LiveStreamGoLive,
  LiveStreamItemSource,
  LiveStreamItemStatus,
  LiveStreamKeyStatus,
  LiveStreamOrientation,
  LiveStreamQuality,
  LiveStreamSetup,
  LiveStreamStatus,
  PlaylistEntry,
  SENDING_STATES,
} from '../../core/models/live-stream.models';
import { ApiService } from '../../core/services/api.service';
import { LiveStreamService } from '../../core/services/live-stream.service';
import { MediaToolsService } from '../../core/services/media-tools.service';
import { StatusService } from '../../core/services/status.service';
import { environment } from '../../../environments/environment';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { MediaPreview, MediaPreviewDialogComponent } from '../../shared/media-preview-dialog.component';

type AddMode = 'upload' | 'renders' | 'assets' | 'links';
type KeyMode = 'channel' | 'paste';

interface StreamError {
  message: string;
  hint?: string;
  /** Set when the problem is the channel's saved key, so the page can offer to fix it. */
  keyProblem?: boolean;
}

interface LinkCheck {
  url: string;
  state: 'checking' | 'ok' | 'failed';
  message?: string;
}

/** Per-viewer conveniences only. The stream key is never stored. */
interface Remembered {
  destination?: string;
  quality?: LiveStreamQuality;
  orientation?: LiveStreamOrientation;
  keyMode?: KeyMode;
  channelId?: string;
  autoReconnect?: boolean;
}

const MEDIA_ACCEPT = '.mp4,.wav,.wave,.flac,.aif,.aiff,.mp3,.m4a';
const COVER_ACCEPT = '.png,.jpg,.jpeg,.webp';
const AUDIO_EXT = /\.(wav|wave|flac|aif|aiff|mp3|m4a)$/i;
const VIDEO_EXT = /\.mp4$/i;
const POLL_MS = 2000;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const REMEMBER_KEY = 'animstudio.live.settings';
const MAX_LINKS_PER_PASTE = 50;

@Component({
  selector: 'app-live-stream',
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink, FileDropDirective, MediaPreviewDialogComponent],
  templateUrl: './live-stream.component.html',
  styleUrls: ['./live-stream.component.css'],
})
export class LiveStreamComponent {
  private readonly live = inject(LiveStreamService);
  private readonly api = inject(ApiService);
  private readonly media = inject(MediaToolsService);
  private readonly status = inject(StatusService);
  private readonly route = inject(ActivatedRoute);

  readonly mediaAccept = MEDIA_ACCEPT;
  readonly coverAccept = COVER_ACCEPT;

  readonly setup = signal<LiveStreamSetup | null>(null);
  readonly streams = signal<LiveStreamStatus[]>([]);
  readonly playlist = signal<PlaylistEntry[]>([]);
  readonly addMode = signal<AddMode>('upload');
  readonly error = signal<StreamError | null>(null);
  readonly submitting = signal<'prepare' | 'live' | null>(null);
  readonly busyStream = signal<string | null>(null);
  readonly showKey = signal(false);

  /** Which stream's items are expanded, and which item is in the preview player. */
  readonly expanded = signal<Record<string, boolean>>({});
  readonly previewing = signal<{ streamId: string; index: number; playAll: boolean } | null>(null);

  /** The centred preview of a source, before anything is prepared. */
  readonly sourcePreview = signal<{ preview: MediaPreview; entryKey?: string; add?: () => void } | null>(null);
  private previewObjectUrl: string | null = null;

  // Pickers
  readonly projects = signal<Project[]>([]);
  readonly pickerProject = signal('');
  readonly renders = signal<RenderJob[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly pickerLoading = signal(false);
  readonly linkText = signal('');
  readonly linkAudioOnly = signal(false);
  readonly linkChecks = signal<LinkCheck[]>([]);

  /** Held only in this component's memory: never in storage, never sent anywhere but go-live. */
  streamKey = '';

  form = {
    destination: '',
    quality: 'Hd720' as LiveStreamQuality,
    orientation: 'Landscape' as LiveStreamOrientation,
    loopForever: true,
    loops: 1,
    shuffle: false,
    autoReconnect: true,
    label: '',
    rightsConfirmed: false,
    keyMode: 'paste' as KeyMode,
    channelId: '',
  };

  readonly totalSeconds = computed(() =>
    this.playlist().reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0));
  readonly unknownDurations = computed(() => this.playlist().some((e) => e.durationSeconds == null));
  readonly activeCount = computed(() => this.streams().filter((s) => BUSY_STATES.includes(s.state)).length);

  private poll: ReturnType<typeof setInterval> | null = null;
  private nextKey = 0;
  private readonly coverUrls = new Map<File, string>();

  constructor() {
    this.restore();
    inject(DestroyRef).onDestroy(() => {
      this.stopPolling();
      this.coverUrls.forEach((url) => URL.revokeObjectURL(url));
      if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    });

    void this.loadSetup();
    void this.refresh();
    void this.addFromQuery();
  }

  // ------------------------------------------------------------------ playlist

  onMediaPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  addFiles(files: File[]): void {
    const rejected: string[] = [];
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        rejected.push(`${file.name} (over 2 GB)`);
        continue;
      }
      if (VIDEO_EXT.test(file.name) || AUDIO_EXT.test(file.name)) {
        const isVideo = VIDEO_EXT.test(file.name);
        const key = this.push({
          source: 'Upload', title: this.stem(file.name), typeLabel: isVideo ? 'Video' : 'Song',
          detail: `${file.name.split('.').pop()!.toUpperCase()} · ${this.formatSize(file.size)}`, file,
        });
        if (key) this.measureFile(key, file, isVideo);
      } else {
        rejected.push(file.name);
      }
    }
    this.error.set(rejected.length ? { message: `Not added: ${rejected.join(', ')}. Use MP4 videos or WAV, FLAC, AIFF, MP3 or M4A songs.` } : null);
  }

  isSong(entry: PlaylistEntry): boolean {
    return entry.source === 'Upload' && !!entry.file && AUDIO_EXT.test(entry.file.name);
  }

  onCoverPicked(event: Event, entry: PlaylistEntry): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.setCover(entry, file);
  }

  setCover(entry: PlaylistEntry, cover: File | undefined): void {
    this.playlist.update((list) => list.map((e) => (e.key === entry.key ? { ...e, cover } : e)));
  }

  /** One cover for every song that doesn't have its own yet - the usual case for an album or a mix. */
  coverAllSongs(entry: PlaylistEntry): void {
    if (!entry.cover) return;
    this.playlist.update((list) => list.map((e) => (this.isSong(e) && !e.cover ? { ...e, cover: entry.cover } : e)));
  }

  songsWithoutCover(): number {
    return this.playlist().filter((e) => this.isSong(e) && !e.cover).length;
  }

  coverUrl(file: File): string {
    let url = this.coverUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.coverUrls.set(file, url);
    }
    return url;
  }

  move(entry: PlaylistEntry, delta: number): void {
    this.playlist.update((list) => {
      const from = list.findIndex((e) => e.key === entry.key);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= list.length) return list;
      const copy = [...list];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    });
  }

  remove(entry: PlaylistEntry): void {
    this.playlist.update((list) => list.filter((e) => e.key !== entry.key));
  }

  rename(entry: PlaylistEntry, title: string): void {
    this.playlist.update((list) => list.map((e) => (e.key === entry.key ? { ...e, title: title.slice(0, 200) } : e)));
  }

  clearPlaylist(): void {
    if (this.playlist().length > 1 && !confirm('Remove every item from the playlist?')) return;
    this.playlist.set([]);
  }

  sourceIcon(source: LiveStreamItemSource, kind?: string): string {
    switch (source) {
      case 'Render': return '🎞️';
      case 'Asset': return '🗂️';
      case 'Url': return '🔗';
      case 'ReleaseKit': return '💿';
      default: return kind === 'CoverAndAudio' ? '🎵' : '🎬';
    }
  }

  // ------------------------------------------------------------------ pickers

  setAddMode(mode: AddMode): void {
    this.addMode.set(mode);
    if ((mode === 'renders' || mode === 'assets') && this.projects().length === 0) void this.loadProjects();
    else if (mode === 'renders' || mode === 'assets') void this.loadPicker();
  }

  async pickProject(projectId: string): Promise<void> {
    this.pickerProject.set(projectId);
    await this.loadPicker();
  }

  addRender(job: RenderJob): void {
    this.push(this.renderEntry(job));
  }

  addAsset(asset: Asset): void {
    this.push(this.assetEntry(asset));
  }

  renderType(job: RenderJob): string {
    return job.kind === 'ClipMerge' ? 'Clip Studio export' : 'Project render';
  }

  private renderEntry(job: RenderJob, title?: string): Omit<PlaylistEntry, 'key'> {
    const project = this.projects().find((p) => p.id === job.projectId)?.name;
    return {
      source: 'Render',
      title: title || `${project ?? 'Project'} · ${this.renderType(job)}`,
      typeLabel: this.renderType(job),
      detail: `${project ? project + ' · ' : ''}${new Date(job.completedAt ?? job.createdAt).toLocaleString()}`,
      renderJobId: job.jobId,
      durationSeconds: job.outputDurationSeconds,
      width: job.width,
      height: job.height,
    };
  }

  private assetEntry(asset: Asset): Omit<PlaylistEntry, 'key'> {
    return {
      source: 'Asset',
      title: this.stem(asset.name),
      typeLabel: asset.kind === 'Audio' ? 'Song (project media)' : 'Video (project media)',
      detail: `${asset.mimeType} · ${this.formatSize(asset.fileSizeBytes)}`,
      assetId: asset.id,
      durationSeconds: asset.durationSeconds,
      width: asset.width,
      height: asset.height,
    };
  }

  isFinished(job: RenderJob): boolean {
    return job.hasOutput && (job.status === 'Completed' || job.status === 'CompletedWithWarnings');
  }

  streamableAssets(): Asset[] {
    return this.assets().filter((a) => a.kind === 'Video' || a.kind === 'Audio');
  }

  /** Checks each pasted link with the server (title, length, whether the site is supported) and adds the good ones. */
  async addLinks(): Promise<void> {
    const urls = Array.from(new Set(
      this.linkText().split(/\s+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u)),
    )).slice(0, MAX_LINKS_PER_PASTE);
    if (urls.length === 0) return;

    this.linkChecks.set(urls.map((url) => ({ url, state: 'checking' })));
    const failed: string[] = [];

    for (const url of urls) {
      try {
        const probe = await firstValueFrom(this.media.probeUrl(url));
        this.push({
          source: 'Url',
          title: probe.title || url,
          typeLabel: this.linkAudioOnly() ? 'Link · audio only' : `Link · ${probe.aspectLabel || 'video'}`,
          detail: `${probe.channel ? probe.channel + ' · ' : ''}${probe.platformId}`,
          url: probe.canonicalUrl || url,
          audioOnly: this.linkAudioOnly(),
          durationSeconds: probe.durationSeconds || undefined,
          width: probe.width,
          height: probe.height,
          thumbnailUrl: probe.thumbnailUrl || undefined,
        });
        this.markLink(url, 'ok');
      } catch (err: unknown) {
        failed.push(url);
        this.markLink(url, 'failed', err instanceof ApiFailure ? err.message : 'Could not check this link.');
      }
    }

    // Keep only what still needs attention in the box.
    this.linkText.set(failed.join('\n'));
  }

  // ------------------------------------------------------------------ settings and keys

  destinationName(id: string): string {
    return this.setup()?.destinations.find((d) => d.id === id)?.name ?? id;
  }

  keyHelpUrl(): string | null {
    return this.setup()?.destinations.find((d) => d.id === this.form.destination)?.keyHelpUrl ?? null;
  }

  selectedChannel(): LiveStreamChannel | undefined {
    return this.setup()?.channels.find((c) => c.id === this.form.channelId);
  }

  keyStatus(channel: LiveStreamChannel | undefined, destination = this.form.destination): LiveStreamKeyStatus | undefined {
    return channel?.keys.find((k) => k.destinationId === destination);
  }

  keyLabel(status: LiveStreamKeyStatus | undefined): string {
    switch (status?.state) {
      case 'Saved': return `✅ Saved ${status.masked}`;
      case 'Rejected': return '⚠️ Refused last time - needs to be set again';
      case 'Unreadable': return '⚠️ Can\'t be read - needs to be set again';
      default: return '— No key saved';
    }
  }

  /** The channel's saved key can't be used as it is: missing, refused, or unreadable. */
  channelKeyNeedsSetup(): boolean {
    return this.form.keyMode === 'channel' && this.keyStatus(this.selectedChannel())?.state !== 'Saved';
  }

  keyChoiceMissing(): string | null {
    if (this.form.keyMode === 'paste') return this.streamKey.trim() ? null : 'the stream key';
    if (!this.form.channelId) return 'a channel';
    return this.channelKeyNeedsSetup() ? 'a saved key for the channel' : null;
  }

  goLiveTarget(): LiveStreamGoLive {
    return this.form.keyMode === 'channel'
      ? { channelId: this.form.channelId }
      : { streamKey: this.streamKey.trim() };
  }

  keyChoiceLabel(): string {
    if (this.form.keyMode === 'paste') return 'the pasted key';
    return `${this.selectedChannel()?.name ?? 'the channel'}'s saved key`;
  }

  // ------------------------------------------------------------------ submit

  missing(withKey: boolean): string[] {
    const missing: string[] = [];
    if (this.playlist().length === 0) missing.push('something to stream');
    if (!this.form.destination) missing.push('a destination');
    if (withKey) {
      const key = this.keyChoiceMissing();
      if (key) missing.push(key);
    }
    if (!this.form.rightsConfirmed) missing.push('the rights confirmation');
    return missing;
  }

  /** Prepares the playlist; with `goLive` it goes out as soon as every item is ready. */
  async submit(goLive: boolean): Promise<void> {
    if (this.missing(goLive).length > 0 || this.submitting()) return;

    this.error.set(null);
    this.submitting.set(goLive ? 'live' : 'prepare');
    this.remember();
    try {
      const created = await firstValueFrom(this.live.create(this.playlist(), {
        destination: this.form.destination,
        quality: this.form.quality,
        orientation: this.form.orientation,
        loops: this.form.loopForever ? 0 : Math.min(1000, Math.max(1, Math.floor(this.form.loops || 1))),
        shuffle: this.form.shuffle,
        autoReconnect: this.form.autoReconnect,
        label: this.form.label.trim() || undefined,
        rightsConfirmed: this.form.rightsConfirmed,
      }, goLive ? this.goLiveTarget() : undefined));

      this.streams.update((list) => [created, ...list.filter((s) => s.id !== created.id)]);
      this.expanded.update((e) => ({ ...e, [created.id]: true }));
      this.status.notify([goLive ? `Preparing "${created.label}" - it goes live when ready` : `Preparing "${created.label}" for preview`]);
      this.playlist.set([]);
      this.form.label = '';
      this.ensurePolling();
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'The stream could not be prepared.'));
    } finally {
      this.submitting.set(null);
    }
  }

  async goLive(stream: LiveStreamStatus): Promise<void> {
    const key = this.keyChoiceMissing();
    if (key) {
      this.error.set({ message: `Choose ${key} under "Stream key" first.`, keyProblem: this.form.keyMode === 'channel' });
      return;
    }
    if (stream.state !== 'Ready' && !confirm(`Send "${stream.label}" again with ${this.keyChoiceLabel()}?`)) return;

    this.busyStream.set(stream.id);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.live.goLive(stream.id, this.goLiveTarget()));
      this.replace(updated);
      this.status.notify([`Going live: ${updated.label}`]);
      this.ensurePolling();
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'The stream could not be started.'));
    } finally {
      this.busyStream.set(null);
    }
  }

  async stop(stream: LiveStreamStatus): Promise<void> {
    const sending = SENDING_STATES.includes(stream.state);
    if (!confirm(sending ? `Stop "${stream.label}"? Viewers will see the stream end.` : `Stop preparing "${stream.label}"?`)) return;

    this.busyStream.set(stream.id);
    try {
      this.replace(await firstValueFrom(this.live.stop(stream.id)));
      await this.refresh();
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'The stream could not be stopped.'));
    } finally {
      this.busyStream.set(null);
    }
  }

  async discard(stream: LiveStreamStatus): Promise<void> {
    if (!confirm(`Delete "${stream.label}" and its prepared files?`)) return;

    this.busyStream.set(stream.id);
    try {
      await firstValueFrom(this.live.discard(stream.id));
      this.streams.update((list) => list.filter((s) => s.id !== stream.id));
      if (this.previewing()?.streamId === stream.id) this.previewing.set(null);
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'The stream could not be deleted.'));
    } finally {
      this.busyStream.set(null);
    }
  }

  // ------------------------------------------------------------------ source preview (before preparing)

  /** Opens the centred preview for a playlist row. */
  previewEntry(entry: PlaylistEntry): void {
    const facts = [entry.detail];
    const base: Omit<MediaPreview, 'type'> = {
      title: entry.title,
      durationSeconds: entry.durationSeconds,
      facts,
    };

    switch (entry.source) {
      case 'Upload': {
        const song = this.isSong(entry);
        this.openSourcePreview({
          ...base,
          type: entry.typeLabel,
          src: this.objectUrl(entry.file!),
          audio: song,
          coverSrc: entry.cover ? this.coverUrl(entry.cover) : undefined,
          note: song ? (entry.cover ? 'On air: this cover over a blurred copy of itself, with a live waveform.'
                                    : 'On air: a plain backdrop with a live waveform. Add a cover to show artwork.') : undefined,
        }, { entryKey: entry.key });
        break;
      }
      case 'Render':
        this.openSourcePreview({ ...base, type: entry.typeLabel, src: this.api.previewUrl(entry.renderJobId!) }, { entryKey: entry.key });
        break;
      case 'Asset':
        this.openSourcePreview({
          ...base, type: entry.typeLabel, src: this.api.assetUrl(entry.assetId!), audio: entry.typeLabel.startsWith('Song'),
          note: entry.typeLabel.startsWith('Song') ? 'On air: a plain backdrop with a live waveform.' : undefined,
        }, { entryKey: entry.key });
        break;
      case 'ReleaseKit': {
        const kit = `${environment.apiUrl}/api/releases/kits/${encodeURIComponent(entry.releaseKitId!)}/files`;
        this.openSourcePreview(entry.useVisualizer
          ? { ...base, type: entry.typeLabel, src: `${kit}/visualizer_1920x1080.mp4` }
          : { ...base, type: entry.typeLabel, src: `${kit}/master.wav`, audio: true, coverSrc: `${kit}/cover_3000x3000.jpg`,
              note: 'On air: the cover over a blurred copy of itself, with a live waveform.' },
          { entryKey: entry.key });
        break;
      }
      case 'Url':
        this.openSourcePreview({ ...base, type: entry.typeLabel, externalUrl: entry.url, thumbnailUrl: entry.thumbnailUrl });
        break;
    }
  }

  previewRender(job: RenderJob): void {
    const entry = this.renderEntry(job);
    this.openSourcePreview({
      title: entry.title, type: entry.typeLabel, src: this.api.previewUrl(job.jobId),
      durationSeconds: job.outputDurationSeconds, facts: [entry.detail],
    }, { add: () => this.addRender(job) });
  }

  previewAsset(asset: Asset): void {
    const entry = this.assetEntry(asset);
    const song = asset.kind === 'Audio';
    this.openSourcePreview({
      title: entry.title, type: entry.typeLabel, src: this.api.assetUrl(asset.id), audio: song,
      durationSeconds: asset.durationSeconds, facts: [entry.detail],
      note: song ? 'On air: a plain backdrop with a live waveform.' : undefined,
    }, { add: () => this.addAsset(asset) });
  }

  addFromPreview(): void {
    this.sourcePreview()?.add?.();
    this.closeSourcePreview();
  }

  /** Keeps what the player measured, so the row and the total show the real length. */
  onPreviewMeasured(m: { durationSeconds: number; width?: number; height?: number }): void {
    const key = this.sourcePreview()?.entryKey;
    if (!key) return;
    this.updateEntry(key, { durationSeconds: m.durationSeconds, width: m.width ?? undefined, height: m.height ?? undefined });
  }

  closeSourcePreview(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
    this.sourcePreview.set(null);
  }

  private openSourcePreview(preview: MediaPreview, options: { entryKey?: string; add?: () => void } = {}): void {
    if (this.previewObjectUrl && preview.src !== this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.sourcePreview.set({ preview, ...options });
  }

  private objectUrl(file: File): string {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = URL.createObjectURL(file);
    return this.previewObjectUrl;
  }

  // ------------------------------------------------------------------ prepared preview

  previewUrl(stream: LiveStreamStatus, index: number): string {
    return this.live.previewUrl(stream.id, index);
  }

  preview(stream: LiveStreamStatus, item: LiveStreamItemStatus, playAll = false): void {
    this.previewing.set({ streamId: stream.id, index: item.index, playAll });
  }

  /** Plays the whole program in order, the way viewers will see it. */
  playAll(stream: LiveStreamStatus): void {
    const first = stream.items.find((i) => i.state === 'Ready');
    if (!first) return;
    this.expanded.update((e) => ({ ...e, [stream.id]: true }));
    this.preview(stream, first, true);
  }

  onPreviewEnded(stream: LiveStreamStatus): void {
    const current = this.previewing();
    if (!current?.playAll) return;
    const next = stream.items.find((i) => i.index > current.index && i.state === 'Ready');
    this.previewing.set(next ? { ...current, index: next.index } : null);
  }

  isPreviewing(stream: LiveStreamStatus, index?: number): boolean {
    const current = this.previewing();
    return current?.streamId === stream.id && (index === undefined || current.index === index);
  }

  toggle(stream: LiveStreamStatus): void {
    this.expanded.update((e) => ({ ...e, [stream.id]: !this.isExpanded(stream) }));
  }

  isExpanded(stream: LiveStreamStatus): boolean {
    return this.expanded()[stream.id] ?? BUSY_STATES.includes(stream.state);
  }

  // ------------------------------------------------------------------ display helpers

  isBusy(stream: LiveStreamStatus): boolean {
    return BUSY_STATES.includes(stream.state);
  }

  isSending(stream: LiveStreamStatus): boolean {
    return SENDING_STATES.includes(stream.state);
  }

  /** Copying prepared files runs at 1.0×; below that, viewers buffer. */
  isSlow(stream: LiveStreamStatus): boolean {
    return stream.state === 'Live' && stream.streamedSeconds > 10 && (stream.speed ?? 1) < 0.95;
  }

  preparedCount(stream: LiveStreamStatus): number {
    return stream.items.filter((i) => i.state === 'Ready').length;
  }

  stateLabel(stream: LiveStreamStatus): string {
    switch (stream.state) {
      case 'Preparing': return `Preparing ${this.preparedCount(stream)}/${stream.items.length}`;
      case 'Ready': return 'Ready to go live';
      case 'Connecting': return 'Connecting…';
      case 'Live': return '● LIVE';
      case 'Reconnecting': return 'Reconnecting…';
      case 'Ended': return 'Ended';
      case 'Stopped': return 'Stopped';
      default: return 'Failed';
    }
  }

  itemStateLabel(item: LiveStreamItemStatus): string {
    switch (item.state) {
      case 'Waiting': return 'Waiting';
      case 'Fetching': return 'Downloading…';
      case 'Preparing': return `Converting ${Math.round(item.progress * 100)}%`;
      case 'Ready': return this.formatClock(item.durationSeconds);
      default: return 'Skipped';
    }
  }

  qualityLabel(stream: LiveStreamStatus): string {
    const vertical = stream.orientation === 'Portrait';
    return `${stream.quality === 'Hd1080' ? '1080p' : '720p'} ${vertical ? 'vertical' : 'landscape'}`;
  }

  loopsLabel(stream: LiveStreamStatus): string {
    const order = stream.shuffle ? ' · shuffled' : '';
    if (stream.loops === 0) return `loops until stopped${order}`;
    return (stream.loops === 1 ? 'plays once' : `plays ${stream.loops}×`) + order;
  }

  formatClock(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }

  /** "1920×1080 · vertical"-style label, when the size is known. */
  pictureLabel(width?: number, height?: number): string | null {
    if (!width || !height) return null;
    const shape = width === height ? 'square' : width > height ? 'landscape' : 'vertical';
    return `${width}×${height} ${shape}`;
  }

  /** A vertical source in a landscape stream (or the reverse) is letterboxed; worth saying before preparing. */
  letterboxed(entry: PlaylistEntry): boolean {
    if (!entry.width || !entry.height || this.isSong(entry)) return false;
    return (entry.height > entry.width) !== (this.form.orientation === 'Portrait');
  }

  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  // ------------------------------------------------------------------ private

  /** Adds a row and returns its key, or null when the playlist is full. */
  private push(entry: Omit<PlaylistEntry, 'key'>): string | null {
    const max = this.setup()?.maxItems ?? 50;
    if (this.playlist().length >= max) {
      this.error.set({ message: `A stream can have at most ${max} items.` });
      return null;
    }
    const key = `e${this.nextKey++}`;
    this.playlist.update((list) => [...list, { ...entry, key }]);
    return key;
  }

  private updateEntry(key: string, change: Partial<PlaylistEntry>): void {
    this.playlist.update((list) => list.map((e) => (e.key === key ? { ...e, ...change } : e)));
  }

  /** Reads an upload's length (and picture size) from its own header, without playing or uploading it. */
  private measureFile(key: string, file: File, isVideo: boolean): void {
    const url = URL.createObjectURL(file);
    const media = document.createElement(isVideo ? 'video' : 'audio');
    const done = () => {
      URL.revokeObjectURL(url);
      media.removeAttribute('src');
    };
    media.preload = 'metadata';
    media.onloadedmetadata = () => {
      const video = media as HTMLVideoElement;
      this.updateEntry(key, {
        durationSeconds: Number.isFinite(media.duration) ? media.duration : undefined,
        width: isVideo && video.videoWidth ? video.videoWidth : undefined,
        height: isVideo && video.videoHeight ? video.videoHeight : undefined,
      });
      done();
    };
    // Some formats (e.g. AIFF) don't play in browsers; the length is then known after preparing.
    media.onerror = done;
    media.src = url;
  }

  private replace(stream: LiveStreamStatus): void {
    this.streams.update((list) => list.map((s) => (s.id === stream.id ? stream : s)));
  }

  private markLink(url: string, state: LinkCheck['state'], message?: string): void {
    this.linkChecks.update((list) => list.map((c) => (c.url === url ? { ...c, state, message } : c)));
  }

  private stem(name: string): string {
    return name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim().slice(0, 200) || name;
  }

  private describe(err: unknown, fallback: string): StreamError {
    if (!(err instanceof ApiFailure)) return { message: fallback };
    const keyProblem = ['stream-key-missing', 'stream-key-rejected', 'saved-keys-admin-only'].includes(err.code);
    if (keyProblem) void this.loadSetup();
    return { message: err.message, hint: err.hint, keyProblem };
  }

  /** "Go live" buttons elsewhere in the app open this page with what to stream. */
  private async addFromQuery(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const renderJobId = query.get('renderJobId');
    const assetId = query.get('assetId');
    const kitId = query.get('kitId');
    const url = query.get('url');
    const title = query.get('title')?.slice(0, 200);

    if (renderJobId) {
      // The job's own details give the row its real type, length and size.
      try {
        this.push(this.renderEntry(await firstValueFrom(this.api.job(renderJobId)), title));
      } catch {
        this.push({ source: 'Render', title: title || 'Finished render', typeLabel: 'Render', detail: 'From the render page', renderJobId });
      }
    }
    if (assetId) {
      this.push({ source: 'Asset', title: title || 'Project media', typeLabel: 'Project media', detail: 'From Media Studio', assetId });
    }
    if (kitId) {
      const visualizer = query.get('visualizer') === '1';
      this.push({
        source: 'ReleaseKit',
        title: title || (visualizer ? 'Release visualizer' : 'Release master'),
        typeLabel: visualizer ? 'Release kit · visualizer' : 'Release kit · song + cover',
        detail: visualizer ? '1920×1080 visualizer video' : 'Mastered WAV with the 3000×3000 cover',
        releaseKitId: kitId,
        useVisualizer: visualizer,
      });
    }
    if (url) {
      this.addMode.set('links');
      this.linkText.set(url);
      await this.addLinks();
    }
  }

  private async loadSetup(): Promise<void> {
    try {
      const setup = await firstValueFrom(this.live.setup());
      this.setup.set(setup);
      if (!setup.destinations.some((d) => d.id === this.form.destination)) {
        this.form.destination = setup.destinations[0]?.id ?? '';
      }
      if (!setup.channels.some((c) => c.id === this.form.channelId)) {
        this.form.channelId = setup.channels[0]?.id ?? '';
      }
      if (!setup.canUseSavedKeys) this.form.keyMode = 'paste';
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'Could not load the stream settings.'));
    }
  }

  private async loadProjects(): Promise<void> {
    this.pickerLoading.set(true);
    try {
      const projects = await firstValueFrom(this.api.listProjects());
      this.projects.set(projects);
      if (!this.pickerProject() && projects.length > 0) this.pickerProject.set(projects[0].id);
      await this.loadPicker();
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'Could not load your projects.'));
    } finally {
      this.pickerLoading.set(false);
    }
  }

  private async loadPicker(): Promise<void> {
    const projectId = this.pickerProject();
    if (!projectId) return;
    this.pickerLoading.set(true);
    try {
      if (this.addMode() === 'renders') {
        const jobs = await firstValueFrom(this.api.listJobs(projectId));
        this.renders.set(jobs.filter((j) => this.isFinished(j)));
      } else if (this.addMode() === 'assets') {
        this.assets.set(await firstValueFrom(this.api.listAssets(projectId)));
      }
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'Could not load that project.'));
    } finally {
      this.pickerLoading.set(false);
    }
  }

  private async refresh(): Promise<void> {
    try {
      const list = await firstValueFrom(this.live.list());
      this.streams.set(list);
      if (list.some((s) => s.keyNeedsAttention)) void this.loadSetup();
    } catch {
      // A missed poll is not worth an error banner; the next one will try again.
    }
    if (this.activeCount() > 0) this.ensurePolling();
    else this.stopPolling();
  }

  private ensurePolling(): void {
    if (this.poll) return;
    this.poll = setInterval(() => void this.refresh(), POLL_MS);
  }

  private stopPolling(): void {
    if (this.poll) clearInterval(this.poll);
    this.poll = null;
  }

  private restore(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? '{}') as Remembered;
      if (saved.destination) this.form.destination = saved.destination;
      if (saved.quality === 'Hd720' || saved.quality === 'Hd1080') this.form.quality = saved.quality;
      if (saved.orientation === 'Landscape' || saved.orientation === 'Portrait') this.form.orientation = saved.orientation;
      if (saved.keyMode === 'channel' || saved.keyMode === 'paste') this.form.keyMode = saved.keyMode;
      if (typeof saved.channelId === 'string') this.form.channelId = saved.channelId;
      if (typeof saved.autoReconnect === 'boolean') this.form.autoReconnect = saved.autoReconnect;
    } catch {
      // Storage unavailable or unreadable: the defaults are fine.
    }
  }

  private remember(): void {
    const saved: Remembered = {
      destination: this.form.destination,
      quality: this.form.quality,
      orientation: this.form.orientation,
      keyMode: this.form.keyMode,
      channelId: this.form.channelId,
      autoReconnect: this.form.autoReconnect,
    };
    try {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(saved));
    } catch {
      // Not worth telling anyone about.
    }
  }
}
