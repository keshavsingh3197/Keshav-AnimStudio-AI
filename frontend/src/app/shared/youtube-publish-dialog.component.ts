import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  YouTubeCheck, YouTubeDraft, YouTubePrivacy, YouTubePublishStatus, YouTubeUpload,
  isUploadFinished, parseYouTubeTags, youTubeTagsLength,
} from '../core/models/youtube.models';
import { YouTubePublishService } from '../core/services/youtube-publish.service';

/** Remembered per browser so the next publish starts where the last one left off. */
const PREFS_KEY = 'animstudio.youtube.publish';

interface PublishPrefs {
  channelId?: string;
  categoryId?: string;
  privacy?: YouTubePrivacy;
  madeForKids?: boolean;
}

/**
 * Publish a finished render to a connected YouTube channel: pick the channel, check the
 * details against YouTube's limits as they are typed, and upload in one click. The upload
 * runs on the server, so the dialog can be closed and reopened without stopping it.
 *
 *   @if (publishJobId(); as id) {
 *     <app-youtube-publish-dialog [jobId]="id" [previewSrc]="previewUrl(id)" [returnPath]="..." (closed)="publishJobId.set(null)" />
 *   }
 */
@Component({
  selector: 'app-youtube-publish-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="yt-backdrop" (click)="closed.emit()">
      <div class="yt-dialog" role="dialog" aria-modal="true" aria-label="Publish to YouTube" (click)="$event.stopPropagation()">
        <div class="yt-head">
          <h4>Publish to YouTube</h4>
          <button type="button" class="yt-x" aria-label="Close" (click)="closed.emit()">✕</button>
        </div>

        @if (loading()) {
          <p class="yt-muted">Loading…</p>
        } @else if (status(); as st) {
          @if (!st.configured) {
            <p class="yt-err">Publishing to YouTube isn't set up on this server. An admin needs to set
              <code>YouTube:Publish:ClientId</code>, <code>ClientSecret</code> and <code>RedirectUri</code>.</p>
          } @else {
            <div class="yt-grid">
              <div class="yt-form">
                <!-- Channel -->
                <div class="yt-channel">
                  @if (st.channels.length === 0) {
                    <span class="yt-muted">No channel connected yet.</span>
                    <button type="button" (click)="connect()" [disabled]="busy()">Connect a YouTube channel</button>
                  } @else {
                    @if (selectedChannel(); as ch) {
                      @if (ch.thumbnailUrl) { <img [src]="ch.thumbnailUrl" alt="" referrerpolicy="no-referrer" /> }
                    }
                    <select [ngModel]="channelId()" (ngModelChange)="channelId.set($event)" aria-label="Channel" [disabled]="uploading()">
                      @for (ch of st.channels; track ch.channelId) {
                        <option [value]="ch.channelId">{{ ch.channelTitle }}{{ ch.needsReconnect ? ' (reconnect needed)' : '' }}</option>
                      }
                    </select>
                    <button type="button" class="link" (click)="connect()" [disabled]="busy() || uploading()" title="Connect another channel or brand account">＋ Add</button>
                    @if (selectedChannel(); as ch) {
                      @if (ch.needsReconnect) {
                        <button type="button" class="link" (click)="connect()" [disabled]="busy()">Reconnect</button>
                      }
                      <button type="button" class="link" (click)="disconnect(ch.channelId)" [disabled]="busy() || uploading()">Disconnect</button>
                    }
                  }
                </div>

                @if (draft(); as d) {
                  @if (brandLinked()) {
                    <p class="yt-muted">Brand channel <strong>{{ d.brandChannelName }}</strong> publishes here; details below start from its defaults.</p>
                  } @else if (brandMissing()) {
                    <p class="yt-warn">Brand channel <strong>{{ d.brandChannelName }}</strong> publishes to a YouTube channel you haven't connected. Use ＋ Add to connect it.</p>
                  }
                }

                <label>Title
                  <input type="text" [ngModel]="title()" (ngModelChange)="title.set($event)" [disabled]="uploading()"
                         [class.invalid]="fieldError('title')" maxlength="200" />
                </label>
                <div class="yt-count" [class.over]="title().trim().length > st.limits.maxTitleLength">
                  {{ title().trim().length }} / {{ st.limits.maxTitleLength }}
                </div>

                <label>Description
                  <textarea rows="6" [ngModel]="description()" (ngModelChange)="description.set($event)" [disabled]="uploading()"
                            [class.invalid]="fieldError('description')"></textarea>
                </label>
                <div class="yt-count" [class.over]="descriptionBytes() > st.limits.maxDescriptionBytes">
                  {{ descriptionBytes() | number }} / {{ st.limits.maxDescriptionBytes | number }}
                </div>

                <label>Tags <span class="yt-muted">(comma-separated, # is optional)</span>
                  <input type="text" [ngModel]="tagsText()" (ngModelChange)="tagsText.set($event)" [disabled]="uploading()"
                         [class.invalid]="fieldError('tags')" placeholder="HoneyBadger, Wildlife, NatureComedy" />
                </label>
                <div class="yt-count" [class.over]="tagsLength() > st.limits.maxTagsLength">
                  {{ tags().length }} tags · {{ tagsLength() }} / {{ st.limits.maxTagsLength }}
                </div>

                <div class="yt-row">
                  <label>Category
                    <select [ngModel]="categoryId()" (ngModelChange)="categoryId.set($event)" [disabled]="uploading()">
                      @for (c of st.categories; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
                    </select>
                  </label>
                  <label>Visibility
                    <select [ngModel]="privacy()" (ngModelChange)="privacy.set($event)" [disabled]="uploading()">
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </label>
                </div>

                <fieldset class="yt-audience" [disabled]="uploading()">
                  <legend>Audience</legend>
                  <label class="inline"><input type="radio" name="kids" [checked]="madeForKids() === false" (change)="madeForKids.set(false)" /> Not made for kids</label>
                  <label class="inline"><input type="radio" name="kids" [checked]="madeForKids() === true" (change)="madeForKids.set(true)" /> Made for kids</label>
                </fieldset>
                <label class="inline"><input type="checkbox" [ngModel]="notify()" (ngModelChange)="notify.set($event)" [disabled]="uploading()" /> Notify subscribers</label>
                @if (privacy() === 'private') {
                  <p class="yt-muted">Private works as a draft: only you can see it until you change its visibility in YouTube Studio,
                    where you can also add a thumbnail, end screen and playlists.</p>
                }
              </div>

              <div class="yt-side">
                <div class="yt-stage" [class.vertical]="draft()?.video?.isVertical">
                  <video [src]="previewSrc()" controls playsinline preload="metadata"></video>
                </div>
                @if (draft(); as d) {
                  <dl class="yt-facts">
                    @if (d.video.durationSeconds != null) { <div><dt>Length</dt><dd>{{ clock(d.video.durationSeconds) }}</dd></div> }
                    @if (d.video.width && d.video.height) { <div><dt>Picture</dt><dd>{{ d.video.width }}×{{ d.video.height }}</dd></div> }
                    @if (d.video.sizeBytes) { <div><dt>Size</dt><dd>{{ d.video.sizeBytes / 1048576 | number: '1.0-1' }} MB</dd></div> }
                    <div><dt>Type</dt><dd>{{ d.video.isVertical && (d.video.durationSeconds ?? 0) <= 180 ? 'Short' : 'Video' }}</dd></div>
                  </dl>
                }

                <ul class="yt-checks">
                  @for (c of problems(); track c.code + c.field) { <li class="err">✕ {{ c.message }}</li> }
                  @for (c of warnings(); track c.code) { <li class="warn">⚠ {{ c.message }}</li> }
                  @if (problems().length === 0 && !upload()) { <li class="ok">✓ Ready to publish</li> }
                </ul>
              </div>
            </div>

            @if (upload(); as u) {
              <div class="yt-progress">
                @switch (u.state) {
                  @case ('Completed') {
                    <p class="ok">✓ Published to {{ u.channelTitle }} ({{ u.privacy }}).
                      <a [href]="u.videoUrl" target="_blank" rel="noopener noreferrer">Watch ↗</a> ·
                      <a [href]="u.studioUrl" target="_blank" rel="noopener noreferrer">Open in YouTube Studio ↗</a></p>
                    <p class="yt-muted">YouTube may still be processing HD versions for a few minutes.
                      @if (u.privacy === 'private') { Finish the details and publish it from YouTube Studio. }</p>
                  }
                  @case ('Failed') { <p class="yt-err">{{ u.error }}</p> }
                  @case ('Cancelled') { <p class="yt-muted">{{ u.error || 'Upload cancelled.' }}</p> }
                  @default {
                    <div class="bar"><div [style.width.%]="u.percent"></div></div>
                    <p class="yt-muted">{{ u.state === 'Queued' ? 'Waiting for a free upload slot…' : 'Uploading to ' + u.channelTitle + '…' }}
                      {{ u.bytesSent / 1048576 | number: '1.0-1' }} / {{ u.totalBytes / 1048576 | number: '1.0-1' }} MB ({{ u.percent }}%)
                      — you can close this window; the upload continues.</p>
                  }
                }
              </div>
            }

            @if (error()) { <p class="yt-err">{{ error() }}</p> }

            <div class="yt-actions">
              @if (uploading()) {
                <button type="button" class="secondary" (click)="cancelUpload()">Cancel upload</button>
                <button type="button" (click)="closed.emit()">Close</button>
              } @else {
                <button type="button" class="secondary" (click)="closed.emit()">{{ upload()?.state === 'Completed' ? 'Close' : 'Cancel' }}</button>
                <button type="button" (click)="publish()" [disabled]="!canPublish()">
                  {{ upload()?.state === 'Completed' ? 'Publish again' : privacy() === 'private' ? 'Upload as draft' : 'Publish' }}
                </button>
              }
            </div>
          }
        } @else if (error()) {
          <p class="yt-err">{{ error() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .yt-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(2, 6, 23, 0.78);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .yt-dialog { background: var(--surface, #0f172a); border: 1px solid var(--border, rgba(148, 163, 184, 0.2));
      border-radius: 12px; padding: 1rem 1.25rem; width: min(980px, 100%); max-height: calc(100vh - 32px);
      overflow: auto; color: var(--text, #e2e8f0); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
    .yt-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .yt-head h4 { margin: 0; font-size: 1.1rem; }
    .yt-x { background: transparent; border: 0; color: inherit; font-size: 1.1rem; cursor: pointer; }
    .yt-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1.25rem; }
    @media (max-width: 760px) { .yt-grid { grid-template-columns: 1fr; } }
    .yt-form { display: grid; gap: .35rem; align-content: start; }
    .yt-form label { display: grid; gap: .25rem; font-size: .85rem; color: var(--muted, #94a3b8); }
    .yt-form label.inline { display: flex; align-items: center; gap: .4rem; color: inherit; }
    .yt-form input[type=text], .yt-form textarea, .yt-form select { width: 100%; box-sizing: border-box; }
    .yt-form textarea { resize: vertical; min-height: 110px; }
    .invalid { outline: 1px solid #ef4444; }
    .yt-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-top: .35rem; }
    .yt-count { font-size: .75rem; text-align: right; color: var(--muted, #94a3b8); font-variant-numeric: tabular-nums; }
    .yt-count.over { color: #f87171; font-weight: 600; }
    .yt-channel { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; padding: .6rem .75rem;
      background: rgba(148, 163, 184, .08); border-radius: 8px; margin-bottom: .5rem; }
    .yt-channel img { width: 28px; height: 28px; border-radius: 50%; }
    .yt-channel select { flex: 1; min-width: 140px; width: auto; }
    .link { background: transparent; border: 0; color: var(--brand, #6c8cff); cursor: pointer; padding: .2rem .3rem; }
    .yt-audience { border: 0; padding: 0; margin: .35rem 0 0; display: flex; gap: 1rem; flex-wrap: wrap; }
    .yt-audience legend { font-size: .85rem; color: var(--muted, #94a3b8); padding: 0; margin-bottom: .25rem; }
    .yt-stage { background: #000; border-radius: 8px; overflow: hidden; }
    .yt-stage video { display: block; width: 100%; max-height: 42vh; background: #000; }
    .yt-stage.vertical video { max-height: 52vh; }
    .yt-facts { display: flex; flex-wrap: wrap; gap: .3rem 1rem; margin: .6rem 0 0; font-size: .82rem; }
    .yt-facts div { display: flex; gap: .3rem; }
    .yt-facts dt { color: var(--muted, #94a3b8); }
    .yt-facts dd { margin: 0; font-variant-numeric: tabular-nums; }
    .yt-checks { list-style: none; padding: 0; margin: .75rem 0 0; display: grid; gap: .3rem; font-size: .85rem; }
    .yt-checks .err { color: #fca5a5; }
    .yt-checks .warn { color: #fcd34d; }
    .ok { color: #86efac; }
    .yt-progress { margin-top: 1rem; }
    .yt-progress p { margin: .35rem 0 0; }
    .bar { height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
    .bar div { height: 100%; background: #ef4444; transition: width .4s ease; }
    .yt-muted { color: var(--muted, #94a3b8); font-size: .85rem; margin: 0; }
    .yt-err { color: #fca5a5; font-size: .9rem; }
    .yt-warn { color: #fcd34d; font-size: .85rem; margin: 0; }
    .yt-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
  `],
})
export class YouTubePublishDialogComponent implements OnInit {
  private readonly api = inject(YouTubePublishService);

  readonly jobId = input.required<string>();
  readonly previewSrc = input.required<string>();
  /** The in-app path to come back to after connecting a channel. */
  readonly returnPath = input.required<string>();
  /**
   * Upload as a draft: private and silent, to finish (thumbnail, end screens, playlists) in
   * YouTube Studio. The API has no real draft state, so private is the closest equivalent.
   */
  readonly asDraft = input(false);
  readonly closed = output<void>();

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal<YouTubePublishStatus | null>(null);
  readonly draft = signal<YouTubeDraft | null>(null);
  readonly upload = signal<YouTubeUpload | null>(null);
  readonly serverErrors = signal<YouTubeCheck[]>([]);
  /** The project's brand channel names a connected YouTube channel - preselected. */
  readonly brandLinked = signal(false);
  /** The brand channel names a YouTube channel this user hasn't connected. */
  readonly brandMissing = signal(false);

  readonly channelId = signal('');
  readonly title = signal('');
  readonly description = signal('');
  readonly tagsText = signal('');
  readonly categoryId = signal('1');
  readonly privacy = signal<YouTubePrivacy>('public');
  readonly madeForKids = signal<boolean | null>(false);
  readonly notify = signal(true);

  readonly selectedChannel = computed(() =>
    this.status()?.channels.find((c) => c.channelId === this.channelId()) ?? null);
  readonly tags = computed(() => parseYouTubeTags(this.tagsText()));
  readonly tagsLength = computed(() => youTubeTagsLength(this.tags()));
  readonly descriptionBytes = computed(() => new TextEncoder().encode(this.description().trim()).length);
  readonly uploading = computed(() => {
    const u = this.upload();
    return u !== null && !isUploadFinished(u);
  });
  readonly warnings = computed(() => this.draft()?.warnings ?? []);

  /** The same limits the server enforces, checked as the user types. */
  readonly problems = computed<YouTubeCheck[]>(() => {
    const st = this.status();
    if (!st) return [];
    const list: YouTubeCheck[] = [...(this.draft()?.errors ?? [])];
    const title = this.title().trim();
    if (!title) list.push({ field: 'title', code: 'title-missing', message: 'A title is required.' });
    if (title.length > st.limits.maxTitleLength) list.push({ field: 'title', code: 'title-too-long', message: `Title is over ${st.limits.maxTitleLength} characters.` });
    if (/[<>]/.test(title)) list.push({ field: 'title', code: 'title-invalid-character', message: "YouTube doesn't allow < or > in a title." });
    if (this.descriptionBytes() > st.limits.maxDescriptionBytes) list.push({ field: 'description', code: 'description-too-long', message: `Description is over ${st.limits.maxDescriptionBytes} bytes.` });
    if (/[<>]/.test(this.description())) list.push({ field: 'description', code: 'description-invalid-character', message: "YouTube doesn't allow < or > in a description." });
    if (this.tagsLength() > st.limits.maxTagsLength) list.push({ field: 'tags', code: 'tags-too-long', message: `Tags total more than ${st.limits.maxTagsLength} characters.` });
    if (this.tags().some((t) => /[<>"]/.test(t))) list.push({ field: 'tags', code: 'tag-invalid-character', message: "Tags can't contain <, > or quotes." });
    if (!this.channelId()) list.push({ field: 'channelId', code: 'channel-missing', message: 'Connect a channel to publish to.' });
    if (this.selectedChannel()?.needsReconnect) list.push({ field: 'channelId', code: 'youtube-reconnect', message: 'This channel needs to be connected again.' });
    if (this.madeForKids() === null) list.push({ field: 'madeForKids', code: 'audience-missing', message: 'Choose an audience.' });
    for (const e of this.serverErrors()) if (!list.some((x) => x.code === e.code)) list.push(e);
    return list;
  });

  readonly canPublish = computed(() => !this.busy() && !this.uploading() && this.problems().length === 0);

  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopPolling());
  }

  ngOnInit(): void {
    forkJoin({
      status: this.api.status(),
      draft: this.api.draft(this.jobId()),
      uploads: this.api.uploads(this.jobId()),
    }).subscribe({
      next: ({ status, draft, uploads }) => {
        const prefs = this.readPrefs();
        this.status.set(status);
        this.draft.set(draft);
        this.title.set(draft.title);
        this.description.set(draft.description);
        this.tagsText.set(draft.tags.join(', '));
        this.notify.set(draft.notifySubscribers);

        // A brand channel with a publishing setup decides; otherwise this browser's last choices.
        const brand = draft.channelId ? status.channels.find((c) => c.channelId === draft.channelId) : undefined;
        this.brandLinked.set(Boolean(brand));
        this.brandMissing.set(Boolean(draft.channelId) && !brand);
        if (brand) {
          this.categoryId.set(draft.categoryId);
          this.privacy.set(draft.privacy);
          this.madeForKids.set(draft.madeForKids);
          this.channelId.set(brand.channelId);
        } else {
          this.categoryId.set(status.categories.some((c) => c.id === prefs.categoryId) ? prefs.categoryId! : draft.categoryId);
          this.privacy.set(prefs.privacy ?? draft.privacy);
          this.madeForKids.set(prefs.madeForKids ?? draft.madeForKids);
          const remembered = status.channels.find((c) => c.channelId === prefs.channelId);
          this.channelId.set(remembered?.channelId ?? status.channels[0]?.channelId ?? '');
        }
        if (this.asDraft()) {
          this.privacy.set('private');
          this.notify.set(false);
        }

        // Reattach to an upload of this render that is still going (or just finished).
        const latest = uploads[0];
        if (latest) {
          this.upload.set(latest);
          if (!isUploadFinished(latest)) this.poll(latest.uploadId);
        }
        this.loading.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  connect(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.startConnect(this.returnPath()).subscribe({
      next: (url) => {
        // Only ever leave the app for Google's own sign-in page.
        if (!url.startsWith('https://accounts.google.com/')) {
          this.error.set('The server returned an unexpected sign-in address.');
          this.busy.set(false);
          return;
        }
        window.location.assign(url);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }

  disconnect(channelId: string): void {
    const ch = this.status()?.channels.find((c) => c.channelId === channelId);
    if (!ch || !confirm(`Disconnect ${ch.channelTitle}? AnimStudio will no longer be able to upload to it.`)) return;

    this.busy.set(true);
    this.api.disconnect(channelId).subscribe({
      next: () => {
        this.status.update((s) => s && { ...s, channels: s.channels.filter((c) => c.channelId !== channelId) });
        this.channelId.set(this.status()?.channels[0]?.channelId ?? '');
        this.busy.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }

  publish(): void {
    if (!this.canPublish()) return;
    this.busy.set(true);
    this.error.set(null);
    this.serverErrors.set([]);
    this.savePrefs();

    this.api.publish(this.jobId(), this.channelId(), {
      title: this.title().trim(),
      description: this.description().trim(),
      tags: this.tags(),
      categoryId: this.categoryId(),
      privacy: this.privacy(),
      madeForKids: this.madeForKids(),
      notifySubscribers: this.notify(),
    }).subscribe({
      next: (upload) => {
        this.upload.set(upload);
        this.busy.set(false);
        if (!isUploadFinished(upload)) this.poll(upload.uploadId);
      },
      error: (e: Error & { code?: string }) => {
        this.error.set(e.message);
        if (e.code === 'youtube-reconnect') this.markNeedsReconnect();
        this.busy.set(false);
      },
    });
  }

  cancelUpload(): void {
    const u = this.upload();
    if (!u) return;
    this.api.cancel(u.uploadId).subscribe({ error: (e: Error) => this.error.set(e.message) });
  }

  fieldError(field: string): boolean {
    return this.problems().some((p) => p.field === field);
  }

  clock(seconds: number): string {
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
  }

  private poll(uploadId: string): void {
    this.stopPolling();
    this.pollHandle = setTimeout(() => {
      this.api.upload(uploadId).subscribe({
        next: (u) => {
          this.upload.set(u);
          if (u.errorCode === 'youtube-reconnect') this.markNeedsReconnect();
          if (!isUploadFinished(u)) this.poll(uploadId);
        },
        // A blip while polling isn't the upload failing; try again a little later.
        error: () => this.poll(uploadId),
      });
    }, 1500);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) clearTimeout(this.pollHandle);
    this.pollHandle = null;
  }

  private markNeedsReconnect(): void {
    const id = this.channelId();
    this.status.update((s) => s && {
      ...s, channels: s.channels.map((c) => (c.channelId === id ? { ...c, needsReconnect: true } : c)),
    });
  }

  private readPrefs(): PublishPrefs {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as PublishPrefs;
    } catch {
      return {};
    }
  }

  private savePrefs(): void {
    try {
      const prefs: PublishPrefs = {
        channelId: this.channelId(),
        categoryId: this.categoryId(),
        privacy: this.privacy(),
        madeForKids: this.madeForKids() ?? undefined,
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Storage blocked: the next publish just starts from the defaults.
    }
  }
}
