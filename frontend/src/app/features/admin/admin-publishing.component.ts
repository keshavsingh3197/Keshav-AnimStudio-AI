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

      <div class="pb-channel">
        <label>Brand channel
          <select [value]="channelId() ?? 'default'" (change)="switchChannel($any($event.target).value)">
            @for (c of brandChannels(); track c.id) { <option [value]="c.isDefault ? 'default' : c.id">{{ c.name }}</option> }
          </select>
        </label>
      </div>

      @if (error()) { <p class="err">{{ error() }}</p> }
      @if (saved()) { <p class="ok">✓ Saved. New publishes for this channel start with these details.</p> }

      @if (form(); as f) {
        <div class="pb-card">
          <h3>Upload to</h3>
          @if (yt(); as st) {
            @if (!st.configured) {
              <p class="notice">Publishing to YouTube isn't set up on this server yet: set the OAuth client in Application settings → YouTube, and the client secret in user-secrets.</p>
            }
            <div class="pb-row">
              <select [value]="f.youTubeChannelId ?? ''" (change)="pickYouTube($any($event.target).value)">
                <option value="">— Ask each time —</option>
                @for (c of st.channels; track c.channelId) {
                  <option [value]="c.channelId">{{ c.channelTitle }}{{ c.channelHandle ? ' (' + c.channelHandle + ')' : '' }}</option>
                }
                @if (f.youTubeChannelId && !connectedHere()) {
                  <option [value]="f.youTubeChannelId">{{ f.youTubeChannelTitle || f.youTubeChannelId }} (not connected by you)</option>
                }
              </select>
              @if (st.configured) {
                <button type="button" class="btn-outline" (click)="connect()" [disabled]="busy()">＋ Connect a YouTube channel</button>
              }
            </div>
            <p class="muted small">A channel is connected per user with Google sign-in. Whoever publishes must have connected the channel chosen here.</p>
          }
        </div>

        <div class="pb-card">
          <h3>Every upload starts with</h3>
          <div class="pb-grid">
            <label>Visibility
              <select [value]="f.privacy" (change)="patch({ privacy: $any($event.target).value })">
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label>Category
              <select [value]="f.categoryId" (change)="patch({ categoryId: $any($event.target).value })">
                @for (c of yt()?.categories ?? []; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
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
        </div>

        <div class="pb-actions">
          <button type="button" class="btn-primary-glow" (click)="save()" [disabled]="busy() || tagsLength() > 500 || footerBytes() > 2500">Save</button>
        </div>
      }
    </section>
  `,
  styles: [`
    header h2 { margin: 0 0 .25rem; }
    .pb-channel { margin: .75rem 0; }
    .pb-channel select { min-width: 240px; margin-left: .5rem; }
    .pb-card { border: 1px solid var(--border, rgba(148, 163, 184, .2)); border-radius: 12px; padding: .75rem 1rem; margin-bottom: 1rem; display: grid; gap: .5rem; }
    .pb-card h3 { margin: .25rem 0; font-size: 1rem; }
    .pb-card label { display: grid; gap: .25rem; }
    .pb-card label.inline { display: inline-flex; align-items: center; gap: .4rem; }
    .pb-row { display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: center; }
    .pb-row select { min-width: 260px; }
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

  switchChannel(id: string): void {
    this.channelId.set(id === 'default' ? null : id);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { channel: this.channelId() }, replaceUrl: true });
    this.load();
  }

  pickYouTube(id: string): void {
    const match = this.yt()?.channels.find((c) => c.channelId === id);
    this.patch({ youTubeChannelId: id || null, youTubeChannelTitle: match?.channelTitle ?? (id ? this.form()?.youTubeChannelTitle ?? null : null) });
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
      next: (s) => { this.apply(s); this.saved.set(true); this.busy.set(false); },
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
