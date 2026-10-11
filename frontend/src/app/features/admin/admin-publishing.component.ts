import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { BrandChannel } from '../../core/models/api.models';
import { YouTubePublishStatus, parseYouTubeTags, youTubeTagsLength } from '../../core/models/youtube.models';
import { AdminSettingsService, ChannelPublishSettings } from '../../core/services/admin-settings.service';
import { ApiService } from '../../core/services/api.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';

/**
 * Per brand channel: the YouTube channel its videos publish to and what every upload
 * starts with. The Publish dialog pre-fills from this for any project on the channel, so
 * once it is set up publishing is a single click.
 */
@Component({
  selector: 'app-admin-publishing',
  template: `
    <section class="pb">
      <header>
        <h2>YouTube publishing</h2>
        <p class="muted">Which YouTube channel each brand channel uploads to, and the details every upload starts with.</p>
      </header>

      <div class="pb-brands" role="radiogroup" aria-label="Brand channel">
        @for (c of brandChannels(); track c.id) {
          <button type="button" class="pb-brand" role="radio" [attr.aria-checked]="isCurrent(c)" [class.active]="isCurrent(c)"
                  (click)="switchChannel(c.isDefault ? 'default' : c.id)">
            <span class="pb-avatar">
              @if (safePicture(c.youTubeThumbnailUrl); as pic) { <img [src]="pic" alt="" referrerpolicy="no-referrer" /> }
              @else { {{ initial(c.name) }} }
            </span>
            <span class="pb-brand-text">
              <strong>{{ c.name }} @if (c.isDefault) { <span class="badge">Default</span> }</strong>
              @if (c.youTubeChannelId) {
                <span class="muted small">▶ {{ c.youTubeChannelHandle || c.youTubeChannelTitle || c.youTubeChannelId }}</span>
              } @else {
                <span class="muted small">Not linked to YouTube</span>
              }
            </span>
          </button>
        }
      </div>

      @if (error()) { <p class="err">{{ error() }}</p> }
      @if (saved()) { <p class="ok">✓ Saved. New publishes for this channel start with these details.</p> }

      @if (form(); as f) {
        <div class="pb-card">
          <h3>Upload to</h3>
          <p class="muted small">The YouTube channel videos from <strong>{{ currentBrand()?.name }}</strong> are uploaded to.</p>
          @if (yt(); as st) {
            @if (!st.configured) {
              <p class="notice">Publishing to YouTube isn't set up on this server yet: set the OAuth client in Application settings → YouTube, and the client secret in user-secrets.</p>
            }

            @if (f.youTubeChannelId) {
              <div class="pb-linked">
                <span class="pb-avatar lg">
                  @if (pickedPicture(); as picture) { <img [src]="picture" alt="" referrerpolicy="no-referrer" /> }
                  @else { {{ initial(f.youTubeChannelTitle || '?') }} }
                </span>
                <span class="pb-brand-text">
                  <strong>{{ f.youTubeChannelTitle || f.youTubeChannelId }}</strong>
                  <span class="muted small">{{ f.youTubeChannelHandle || f.youTubeChannelId }}</span>
                  @if (connectedHere()) { <span class="ok small">✓ Connected by you</span> }
                  @else { <span class="warn small">Not connected by you: whoever publishes must connect it</span> }
                </span>
                <button type="button" class="btn-outline" (click)="pickYouTube('')">Unlink</button>
              </div>
              @if (linkedElsewhere().get(f.youTubeChannelId); as owner) {
                <p class="err small">This YouTube channel is also linked to "{{ owner }}". Each YouTube channel can only feed one brand channel: unlink it here or there.</p>
              }
            } @else {
              <p class="notice small">Not linked: the Publish dialog asks which YouTube channel to use each time.</p>
            }

            <div class="pb-row">
              <label class="grow">{{ f.youTubeChannelId ? 'Change to' : 'Link a YouTube channel' }}
                <select (change)="pickYouTube($any($event.target).value)">
                  <option value="" [selected]="!f.youTubeChannelId">— Ask each time —</option>
                  @for (c of st.channels; track c.channelId) {
                    <option [value]="c.channelId" [selected]="c.channelId === f.youTubeChannelId"
                            [disabled]="linkedElsewhere().has(c.channelId) && c.channelId !== f.youTubeChannelId">
                      {{ c.channelTitle }}{{ c.channelHandle ? ' (' + c.channelHandle + ')' : '' }}{{ linkedElsewhere().has(c.channelId) ? ' — used by ' + linkedElsewhere().get(c.channelId) : '' }}
                    </option>
                  }
                  @if (f.youTubeChannelId && !connectedHere()) {
                    <option [value]="f.youTubeChannelId" selected>{{ f.youTubeChannelTitle || f.youTubeChannelId }} (not connected by you)</option>
                  }
                </select>
              </label>
              @if (st.configured) {
                <button type="button" class="btn-outline" (click)="connect()" [disabled]="busy()">＋ Connect another YouTube channel</button>
              }
            </div>
            @if (!st.channels.length) {
              <p class="muted small">You haven't connected any YouTube channel yet.</p>
            }
            <p class="muted small">
              Channels are connected per user with Google sign-in. A YouTube channel can feed only one brand channel,
              and the brand channel takes its name and picture when you save.
            </p>
          }
        </div>

        <div class="pb-card">
          <h3>Every upload starts with</h3>
          <div class="pb-grid">
            <label>Visibility
              <select (change)="patch({ privacy: $any($event.target).value })">
                <option value="public" [selected]="f.privacy === 'public'">Public</option>
                <option value="unlisted" [selected]="f.privacy === 'unlisted'">Unlisted</option>
                <option value="private" [selected]="f.privacy === 'private'">Private</option>
              </select>
            </label>
            <label>Category
              <select (change)="patch({ categoryId: $any($event.target).value })">
                @for (c of yt()?.categories ?? []; track c.id) { <option [value]="c.id" [selected]="c.id === f.categoryId">{{ c.name }}</option> }
              </select>
            </label>
          </div>
          <div class="pb-row">
            <label class="inline"><input type="radio" name="kids" [checked]="!f.madeForKids" (change)="patch({ madeForKids: false })" /> Not made for kids</label>
            <label class="inline"><input type="radio" name="kids" [checked]="f.madeForKids" (change)="patch({ madeForKids: true })" /> Made for kids</label>
            <label class="inline"><input type="checkbox" [checked]="f.notifySubscribers" (change)="patch({ notifySubscribers: $any($event.target).checked })" /> Notify subscribers</label>
          </div>
          <label>Channel tags <span class="muted small">(added to every video; comma-separated)</span>
            <input type="text" [value]="tagsText()" (input)="tagsText.set($any($event.target).value)" placeholder="AnimStudio, Animation" />
          </label>
          <div class="count" [class.over]="tagsLength() > 500">{{ tagsLength() }} / 500</div>
          <label>Description footer <span class="muted small">(added below every description: links, credits, support message)</span>
            <textarea rows="5" [value]="f.descriptionFooter ?? ''" (input)="patch({ descriptionFooter: $any($event.target).value })"></textarea>
          </label>
          <div class="count" [class.over]="footerBytes() > 2500">{{ footerBytes() }} / 2500 bytes</div>
          <label>First comment <span class="muted small">(posted on every video once it's uploaded; leave empty for none)</span>
            <textarea rows="3" [value]="f.firstComment ?? ''" (input)="patch({ firstComment: $any($event.target).value })"
                      placeholder="Thanks for watching! New videos every week 🔔"></textarea>
          </label>
          <div class="count" [class.over]="(f.firstComment ?? '').trim().length > 10000">{{ (f.firstComment ?? '').trim().length }} / 10000</div>
        </div>

        <div class="pb-actions">
          <button type="button" class="btn-primary-glow" (click)="save()" [disabled]="busy() || tagsLength() > 500 || footerBytes() > 2500">Save</button>
        </div>
      }
    </section>
  `,
  styles: [`
    header h2 { margin: 0 0 .25rem; }
    .pb-brands { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .5rem; margin: .75rem 0 1rem; }
    .pb-brand { display: flex; align-items: center; gap: .6rem; padding: .55rem .7rem; text-align: left; cursor: pointer;
      background: transparent; color: inherit; border: 1px solid var(--border, rgba(148, 163, 184, .2)); border-radius: 10px; }
    .pb-brand:hover { border-color: rgba(129, 140, 248, .6); }
    .pb-brand.active { border-color: #818cf8; background: rgba(99, 102, 241, .12); box-shadow: 0 0 0 1px #818cf8 inset; }
    .pb-brand-text { display: grid; gap: .1rem; min-width: 0; }
    .pb-brand-text > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { font-size: .65rem; font-weight: 600; padding: .05rem .4rem; border-radius: 999px; background: rgba(148, 163, 184, .2); margin-left: .25rem; }
    .pb-linked { display: flex; align-items: center; gap: .75rem; padding: .6rem .75rem; border-radius: 10px; background: rgba(148, 163, 184, .08); }
    .pb-linked .pb-brand-text { flex: 1; }
    .grow { flex: 1; min-width: 260px; }
    .warn { color: #fbbf24; }
    .pb-card { border: 1px solid var(--border, rgba(148, 163, 184, .2)); border-radius: 12px; padding: .75rem 1rem; margin-bottom: 1rem; display: grid; gap: .5rem; }
    .pb-card h3 { margin: .25rem 0; font-size: 1rem; }
    .pb-card label { display: grid; gap: .25rem; }
    .pb-card label.inline { display: inline-flex; align-items: center; gap: .4rem; }
    .pb-row { display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: center; }
    .pb-row select { min-width: 260px; }
    .pb-avatar { flex: none; width: 32px; height: 32px; border-radius: 50%; overflow: hidden; display: grid; place-items: center;
      background: rgba(99, 102, 241, .25); font-weight: 700; font-size: .85rem; }
    .pb-avatar.lg { width: 44px; height: 44px; font-size: 1.05rem; }
    .pb-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .pb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .75rem; }
    .count { font-size: .75rem; text-align: right; color: var(--muted, #94a3b8); }
    .count.over { color: #f87171; font-weight: 600; }
    .pb-actions { display: flex; justify-content: flex-end; }
    .small { font-size: .78rem; }
    .ok { color: #86efac; }
  `],
})
export class AdminPublishingComponent implements OnInit {
  private readonly admin = inject(AdminSettingsService);
  private readonly api = inject(ApiService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly brandChannels = signal<BrandChannel[]>([]);
  readonly yt = signal<YouTubePublishStatus | null>(null);
  readonly channelId = signal<string | null>(null);
  readonly form = signal<ChannelPublishSettings | null>(null);
  readonly tagsText = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  readonly tagsLength = computed(() => youTubeTagsLength(parseYouTubeTags(this.tagsText())));
  readonly footerBytes = computed(() => new TextEncoder().encode((this.form()?.descriptionFooter ?? '').trim()).length);
  readonly pickedPicture = computed(() => {
    const id = this.form()?.youTubeChannelId;
    const url = this.yt()?.channels.find((c) => c.channelId === id)?.thumbnailUrl;
    return this.safePicture(url ?? this.form()?.youTubeThumbnailUrl);
  });
  readonly currentBrand = computed(() => this.brandChannels().find((c) => this.isCurrent(c)) ?? null);
  /** YouTube channel id → name of the other brand channel already publishing to it. */
  readonly linkedElsewhere = computed(() => {
    const map = new Map<string, string>();
    for (const c of this.brandChannels()) {
      if (c.youTubeChannelId && !this.isCurrent(c)) map.set(c.youTubeChannelId, c.name);
    }
    return map;
  });
  readonly connectedHere = computed(() =>
    this.yt()?.channels.some((c) => c.channelId === this.form()?.youTubeChannelId) ?? false);

  ngOnInit(): void {
    const channel = this.route.snapshot.queryParamMap.get('channel');
    this.channelId.set(channel && channel !== 'default' ? channel : null);

    forkJoin({ channels: this.api.listBrandChannels(), yt: this.youtube.status() }).subscribe({
      next: ({ channels, yt }) => {
        this.brandChannels.set(channels);
        this.yt.set(yt);
        this.load();
      },
      error: (e: Error) => this.error.set(e.message),
    });
  }

  isCurrent(c: BrandChannel): boolean {
    const id = this.channelId();
    return id ? c.id === id : c.isDefault;
  }

  safePicture(url: string | null | undefined): string | null {
    return url?.startsWith('https://') ? url : null;
  }

  initial(name: string): string {
    return (name.trim()[0] ?? '?').toUpperCase();
  }

  switchChannel(id: string): void {
    if ((id === 'default' ? null : id) === this.channelId() && this.form()) return;
    this.error.set(null);
    this.channelId.set(id === 'default' ? null : id);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { channel: this.channelId() }, replaceUrl: true });
    this.load();
  }

  pickYouTube(id: string): void {
    const match = this.yt()?.channels.find((c) => c.channelId === id);
    const keep = id && id === this.form()?.youTubeChannelId;
    this.patch({
      youTubeChannelId: id || null,
      youTubeChannelTitle: match?.channelTitle ?? (keep ? this.form()?.youTubeChannelTitle ?? null : null),
      youTubeChannelHandle: match?.channelHandle ?? (keep ? this.form()?.youTubeChannelHandle ?? null : null),
      youTubeThumbnailUrl: match?.thumbnailUrl ?? (keep ? this.form()?.youTubeThumbnailUrl ?? null : null),
    });
  }

  patch(change: Partial<ChannelPublishSettings>): void {
    this.saved.set(false);
    this.form.update((f) => f && { ...f, ...change });
  }

  connect(): void {
    const channel = this.channelId();
    const returnPath = `/admin/branding/publishing${channel ? `?channel=${encodeURIComponent(channel)}` : ''}`;
    this.busy.set(true);
    this.youtube.startConnect(returnPath).subscribe({
      next: (url) => {
        if (url.startsWith('https://accounts.google.com/')) window.location.assign(url);
        else { this.error.set('The server returned an unexpected sign-in address.'); this.busy.set(false); }
      },
      error: (e: Error) => { this.error.set(e.message); this.busy.set(false); },
    });
  }

  save(): void {
    const f = this.form();
    if (!f) return;
    this.busy.set(true);
    this.error.set(null);
    this.admin.savePublishing(this.channelId(), { ...f, tags: parseYouTubeTags(this.tagsText()) }).subscribe({
      next: (s) => {
        this.apply(s);
        this.saved.set(true);
        this.busy.set(false);
        // Linking a YouTube channel renames the brand after it.
        this.api.listBrandChannels().subscribe({ next: (list) => this.brandChannels.set(list), error: () => {} });
      },
      error: (e: Error) => { this.error.set(e.message); this.busy.set(false); },
    });
  }

  private load(): void {
    this.saved.set(false);
    this.admin.publishing(this.channelId()).subscribe({
      next: (s) => this.apply(s),
      error: (e: Error) => this.error.set(e.message),
    });
  }

  private apply(s: ChannelPublishSettings): void {
    this.form.set({ ...s, tags: s.tags ?? [] });
    this.tagsText.set((s.tags ?? []).join(', '));
  }
}
