import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../core/interceptors/api-error.interceptor';
import {
  YouTubeCategory, YouTubeChannel, YouTubeLiveBroadcast, YouTubeLiveKind, YouTubeLiveSetup, YouTubePrivacy, YouTubeSuggestEngine,
  parseYouTubeTags, youTubeTagsLength,
} from '../core/models/youtube.models';
import { YouTubePublishService } from '../core/services/youtube-publish.service';

/** The broadcast Go Live will stream to. */
export interface SelectedYouTubeBroadcast {
  channelId: string;
  channelTitle: string;
  broadcast: YouTubeLiveBroadcast;
}

/** Per-viewer conveniences only. */
interface Prefs {
  channelId?: string;
  tone?: string;
  language?: string;
  engine?: string;
}

const PREFS_KEY = 'animstudio.youtube.live';

/**
 * Sets up a YouTube live stream from inside the app: describe the stream in a few words, let
 * the AI write the title, description and tags, then create the broadcast and its stream key
 * on a connected channel - or pick a broadcast made earlier. The key itself never reaches the
 * browser; Go Live names the broadcast and the server looks the key up on YouTube.
 *
 *   <app-youtube-live-setup kind="camera" (broadcastChange)="broadcast.set($event)" />
 */
@Component({
  selector: 'app-youtube-live-setup',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    @if (loading()) {
      <p class="yl-muted">Loading your YouTube channels…</p>
    } @else if (!configured()) {
      <p class="yl-err">Connecting YouTube isn't set up on this server. An admin needs to set
        <code>YouTube:Publish:ClientId</code>, <code>ClientSecret</code> and <code>RedirectUri</code>.</p>
    } @else if (channels().length === 0) {
      <div class="yl-box">
        <p>Connect a YouTube channel once, and broadcasts - title, description, tags and stream key - are created here for you.</p>
        <button type="button" (click)="connect()" [disabled]="busy()">▶ Connect a YouTube channel</button>
      </div>
    } @else {
      <div class="yl-row">
        <label class="yl-grow">Channel
          <select [ngModel]="channelId()" (ngModelChange)="pickChannel($event)" [disabled]="!!selected() || disabled()">
            @for (c of channels(); track c.channelId) {
              <option [value]="c.channelId">{{ c.channelTitle }}{{ c.channelHandle ? ' (' + c.channelHandle + ')' : '' }}</option>
            }
          </select>
        </label>
      </div>

      @if (error(); as e) { <p class="yl-err" role="alert">{{ e }}</p> }

      @if (selectedChannel()?.needsReconnect || setup()?.canManageLive === false) {
        <div class="yl-box yl-warnbox">
          <p>{{ selectedChannel()?.needsReconnect
                ? 'YouTube access for this channel has expired.'
                : 'This channel was connected before live-stream permission was asked for.' }}
            Reconnect it once to create broadcasts from here.</p>
          <button type="button" (click)="connect()" [disabled]="busy()">↻ Reconnect {{ selectedChannel()?.channelTitle }}</button>
        </div>
      } @else if (selected(); as s) {
        <div class="yl-box yl-ready">
          <div>
            <strong>✅ Ready to stream: {{ s.broadcast.title }}</strong>
            <p class="yl-muted">
              {{ privacyLabel(s.broadcast.privacy) }} on {{ s.channelTitle }} ·
              starts automatically when you go live and ends when you stop.
              The stream key is created on YouTube and stays on the server.
            </p>
            <p class="yl-links">
              <a [href]="s.broadcast.watchUrl" target="_blank" rel="noopener noreferrer">Watch page ↗</a>
              <a [href]="s.broadcast.studioUrl" target="_blank" rel="noopener noreferrer">YouTube Studio ↗</a>
            </p>
          </div>
          <button type="button" class="secondary" (click)="clear()" [disabled]="disabled()">Change</button>
        </div>
      } @else if (setup()) {
        <div class="yl-tabs" role="tablist">
          <button type="button" role="tab" [class.active]="tab() === 'new'" (click)="tab.set('new')">✨ New broadcast</button>
          <button type="button" role="tab" [class.active]="tab() === 'existing'" (click)="tab.set('existing')">
            📅 Upcoming ({{ setup()!.upcoming.length }})
          </button>
        </div>

        @if (tab() === 'existing') {
          @if (setup()!.warning; as w) { <p class="yl-warn">{{ w }}</p> }
          @for (b of setup()!.upcoming; track b.broadcastId) {
            <div class="yl-item">
              <div>
                <strong>{{ b.title || '(untitled)' }}</strong>
                <span class="yl-muted">
                  {{ privacyLabel(b.privacy) }}
                  @if (b.scheduledStartTime) { · {{ b.scheduledStartTime | date: 'medium' }} }
                </span>
              </div>
              <button type="button" class="secondary" (click)="choose(b)">Use this</button>
            </div>
          } @empty {
            <p class="yl-muted">No upcoming broadcasts on this channel. Create one under "New broadcast".</p>
          }
        } @else {
          <fieldset class="yl-ai">
            <legend>Describe the stream - AI writes the rest</legend>
            <label>What is it about?
              <input type="text" [(ngModel)]="topic" maxlength="300" placeholder="Sunday bhajan session, taking requests in chat" />
            </label>
            <label>Anything else? <span class="yl-muted">(optional)</span>
              <textarea rows="2" [(ngModel)]="brief" maxlength="1000"
                        placeholder="Who it's for, what you'll cover, links to mention…"></textarea>
            </label>
            <div class="yl-row">
              <label>Tone
                <select [(ngModel)]="tone">
                  @for (t of tones(); track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </label>
              <label>Language
                <select [(ngModel)]="language">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </label>
              @if (engines().length > 1) {
                <label>Engine
                  <select [(ngModel)]="engine">
                    <option value="">Auto</option>
                    @for (e of engines(); track e.id) { <option [value]="e.id">{{ e.name }}{{ e.runsLocally ? ' (local)' : '' }}</option> }
                  </select>
                </label>
              }
            </div>
            <button type="button" (click)="suggest()" [disabled]="suggesting() || !topic.trim() || disabled()">
              {{ suggesting() ? 'Writing…' : (title.trim() ? '✨ Write again' : '✨ Write title, description & tags') }}
            </button>
          </fieldset>

          <label>Title <span class="yl-muted">{{ title.trim().length }}/{{ maxTitle }}</span>
            <input type="text" [(ngModel)]="title" [maxlength]="maxTitle" placeholder="🔴 LIVE: …" />
          </label>
          @if (titleOptions().length) {
            <div class="yl-chips" aria-label="Other titles">
              @for (t of titleOptions(); track t) { <button type="button" class="yl-chip" (click)="title = t">{{ t }}</button> }
            </div>
          }

          <label>Description
            <textarea rows="5" [(ngModel)]="description"></textarea>
          </label>
          @if (descriptionOptions().length) {
            <div class="yl-chips" aria-label="Other descriptions">
              @for (d of descriptionOptions(); track $index) {
                <button type="button" class="yl-chip" (click)="description = d">{{ $index === 0 ? 'Short version' : 'Detailed version' }}</button>
              }
            </div>
          }

          <label>Tags <span class="yl-muted">{{ tagsLength() }}/500 · separate with commas</span>
            <input type="text" [(ngModel)]="tagsText" placeholder="live, bhajan, devotional music" />
          </label>
          @if (unusedTagIdeas().length) {
            <div class="yl-chips" aria-label="More tag ideas">
              @for (t of unusedTagIdeas(); track t) { <button type="button" class="yl-chip" (click)="addTag(t)">+ {{ t }}</button> }
            </div>
          }

          <div class="yl-row">
            <label>Visibility
              <select [(ngModel)]="privacy">
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label>Category
              <select [(ngModel)]="categoryId">
                @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
            </label>
            <label>Audience
              <select [(ngModel)]="madeForKids">
                <option [ngValue]="false">Not made for kids</option>
                <option [ngValue]="true">Made for kids</option>
              </select>
            </label>
          </div>

          <div class="yl-row">
            <label>Starts
              <select [(ngModel)]="startMode">
                <option value="now">When I go live</option>
                <option value="later">At a set time (shows as upcoming)</option>
              </select>
            </label>
            @if (startMode === 'later') {
              <label>Date &amp; time
                <input type="datetime-local" [(ngModel)]="startAt" />
              </label>
            }
            <label class="yl-check"><input type="checkbox" [(ngModel)]="enableDvr" /> Viewers can rewind</label>
          </div>

          @if (createProblem(); as p) { <p class="yl-muted">To create it: {{ p }}.</p> }
          <button type="button" (click)="create()" [disabled]="!!createProblem() || creating() || disabled()">
            {{ creating() ? 'Creating on YouTube…' : '▶ Create broadcast on YouTube' }}
          </button>
        }
      }
    }
  `,
  styles: [`
    :host { display: grid; gap: 12px; }
    label { display: grid; gap: 5px; font-size: .88rem; font-weight: 500; }
    .yl-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
    .yl-row > label { flex: 1 1 140px; }
    .yl-grow { flex: 1 1 auto; }
    .yl-check { display: flex; gap: 7px; align-items: center; flex: 0 0 auto; cursor: pointer; }
    .yl-muted { color: var(--muted); font-size: .82rem; font-weight: normal; }
    .yl-err { color: #fca5a5; margin: 0; font-size: 0.85rem; }
    .yl-warn { color: #fde68a; margin: 0; font-size: 0.85rem; }
    .yl-box {
      display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center;
      padding: 12px 14px; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px;
      background: linear-gradient(180deg, rgba(25, 31, 48, 0.72), rgba(15, 19, 32, 0.85));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }
    .yl-box p { margin: 0; }
    .yl-warnbox { border-color: rgba(245, 158, 11, 0.35); background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04)); }
    .yl-ready { border-color: rgba(52, 211, 153, 0.38); background: linear-gradient(135deg, rgba(52, 211, 153, 0.14), rgba(52, 211, 153, 0.04)); }
    .yl-links { display: flex; gap: 12px; margin-top: 6px !important; font-size: 0.82rem; }
    .yl-tabs {
      display: inline-flex; gap: 4px; padding: 3px; border-radius: 10px;
      background: rgba(11, 15, 25, 0.65); border: 1px solid rgba(148, 163, 184, 0.16); width: fit-content;
    }
    .yl-tabs button {
      background: transparent; color: var(--muted); border: 1px solid transparent;
      border-radius: 7px; padding: 6px 12px; font-size: 0.82rem; font-weight: 600; box-shadow: none;
    }
    .yl-tabs button:hover:not(.active) { color: var(--text); background: rgba(255, 255, 255, 0.04); transform: none; }
    .yl-tabs button.active {
      background: linear-gradient(135deg, rgba(108, 140, 255, 0.24), rgba(168, 85, 247, 0.18));
      color: #fff; border-color: rgba(108, 140, 255, 0.38);
      box-shadow: 0 2px 8px rgba(108, 140, 255, 0.18);
    }
    .yl-item {
      display: flex; justify-content: space-between; align-items: center; gap: 10px;
      padding: 10px 12px; border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 10px;
      background: rgba(19, 24, 38, 0.55); transition: border-color 0.15s ease, background 0.15s ease;
    }
    .yl-item:hover { border-color: rgba(108, 140, 255, 0.35); background: rgba(25, 31, 48, 0.75); }
    .yl-item div { display: grid; gap: 2px; min-width: 0; }
    .yl-ai {
      display: grid; gap: 10px; border: 1px solid rgba(108, 140, 255, 0.28);
      background: linear-gradient(135deg, rgba(108, 140, 255, 0.09), rgba(168, 85, 247, 0.05));
      border-radius: 12px; padding: 12px 14px; margin: 0;
    }
    .yl-ai legend { padding: 0 6px; font-size: .86rem; font-weight: 700; color: #a5b8ff; }
    .yl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .yl-chip {
      background: rgba(25, 31, 48, 0.78); color: var(--text); border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 999px; padding: 4px 11px; font-size: .78rem; max-width: 100%;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: all 0.14s ease;
    }
    .yl-chip:hover { border-color: var(--brand); background: rgba(108, 140, 255, 0.16); color: #fff; transform: translateY(-1px); }
  `],
})
export class YouTubeLiveSetupComponent implements OnInit {
  private readonly youtube = inject(YouTubePublishService);
  private readonly router = inject(Router);

  /** What kind of stream it is, so the AI writes for it. */
  readonly kind = input<YouTubeLiveKind>('camera');
  /** A broadcast already chosen, so switching away and back keeps it. */
  readonly initial = input<SelectedYouTubeBroadcast | null>(null);
  /** While on air the choice is locked. */
  readonly disabled = input(false);
  readonly broadcastChange = output<SelectedYouTubeBroadcast | null>();

  readonly maxTitle = 100;

  readonly loading = signal(true);
  readonly configured = signal(false);
  readonly channels = signal<YouTubeChannel[]>([]);
  readonly categories = signal<YouTubeCategory[]>([]);
  readonly channelId = signal('');
  readonly setup = signal<YouTubeLiveSetup | null>(null);
  readonly tab = signal<'new' | 'existing'>('new');
  readonly selected = signal<SelectedYouTubeBroadcast | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly suggesting = signal(false);
  readonly creating = signal(false);
  readonly engines = signal<YouTubeSuggestEngine[]>([]);
  readonly tones = signal<string[]>(['auto']);
  readonly titleOptions = signal<string[]>([]);
  readonly descriptionOptions = signal<string[]>([]);
  readonly tagIdeas = signal<string[]>([]);
  /** Bumped when tags change, so computed values over the plain tags field refresh. */
  private readonly tagsVersion = signal(0);

  readonly selectedChannel = computed(() => this.channels().find((c) => c.channelId === this.channelId()));

  topic = '';
  brief = '';
  tone = 'auto';
  language = 'en';
  engine = '';
  title = '';
  description = '';
  private _tagsText = '';
  privacy: YouTubePrivacy = 'public';
  categoryId = '24';
  madeForKids = false;
  startMode: 'now' | 'later' = 'now';
  startAt = '';
  enableDvr = true;

  get tagsText(): string { return this._tagsText; }
  set tagsText(value: string) { this._tagsText = value; this.tagsVersion.update((v) => v + 1); }

  readonly tagsLength = computed(() => { this.tagsVersion(); return youTubeTagsLength(parseYouTubeTags(this._tagsText)); });
  readonly unusedTagIdeas = computed(() => {
    this.tagsVersion();
    const used = new Set(parseYouTubeTags(this._tagsText).map((t) => t.toLowerCase()));
    return this.tagIdeas().filter((t) => !used.has(t.toLowerCase())).slice(0, 15);
  });

  async ngOnInit(): Promise<void> {
    if (this.initial()) this.selected.set(this.initial());
    const prefs = this.readPrefs();
    if (prefs.tone) this.tone = prefs.tone;
    if (prefs.language === 'en' || prefs.language === 'hi') this.language = prefs.language;
    if (prefs.engine) this.engine = prefs.engine;

    try {
      const status = await firstValueFrom(this.youtube.status());
      this.configured.set(status.configured);
      this.channels.set(status.channels);
      this.categories.set(status.categories);
      const first = status.channels.find((c) => c.channelId === prefs.channelId) ?? status.channels[0];
      if (first) await this.pickChannel(first.channelId);
    } catch (err: unknown) {
      this.error.set(this.message(err, 'Could not load your YouTube channels.'));
    } finally {
      this.loading.set(false);
    }

    // Engines and tones are a nicety; the panel works with Auto without them.
    try {
      const options = await firstValueFrom(this.youtube.suggestOptions());
      this.engines.set(options.engines);
      if (options.tones.length) this.tones.set(options.tones);
      if (this.engine && !options.engines.some((e) => e.id === this.engine)) this.engine = '';
    } catch {
      this.engines.set([]);
    }
  }

  async pickChannel(channelId: string): Promise<void> {
    this.channelId.set(channelId);
    this.setup.set(null);
    this.error.set(null);
    this.writePrefs();
    if (!channelId || this.selectedChannel()?.needsReconnect) return;
    try {
      const setup = await firstValueFrom(this.youtube.liveSetup(channelId));
      if (this.channelId() !== channelId) return;
      this.setup.set(setup);
      this.privacy = setup.privacy;
      this.categoryId = setup.categoryId;
      this.madeForKids = setup.madeForKids;
      if (!this.tagsText.trim() && setup.tags.length) this.tagsText = setup.tags.join(', ');
      if (!this.description.trim() && setup.descriptionFooter) this.description = setup.descriptionFooter;
    } catch (err: unknown) {
      this.error.set(this.message(err, 'Could not load this channel\'s live settings.'));
    }
  }

  async connect(): Promise<void> {
    this.busy.set(true);
    try {
      const url = await firstValueFrom(this.youtube.startConnect(this.router.url));
      window.location.assign(url);
    } catch (err: unknown) {
      this.error.set(this.message(err, 'Could not start connecting the channel.'));
      this.busy.set(false);
    }
  }

  async suggest(): Promise<void> {
    if (!this.topic.trim() || this.suggesting()) return;
    this.suggesting.set(true);
    this.error.set(null);
    this.writePrefs();
    try {
      const s = await firstValueFrom(this.youtube.liveSuggest({
        topic: this.topic.trim(),
        brief: this.brief.trim() || undefined,
        tone: this.tone,
        language: this.language,
        kind: this.kind(),
        channelId: this.channelId() || undefined,
        providerId: this.engine || undefined,
        fresh: !!this.title.trim(),
      }));
      this.title = s.title;
      this.description = s.description;
      // The channel's default tags stay; the AI's are added after them.
      const tags = parseYouTubeTags([...(this.setup()?.tags ?? []), ...s.tags].join(','));
      this.tagsText = tags.join(', ');
      this.titleOptions.set(s.titleOptions ?? []);
      this.descriptionOptions.set(s.descriptionOptions ?? []);
      this.tagIdeas.set(s.tagIdeas ?? []);
    } catch (err: unknown) {
      this.error.set(this.message(err, 'The AI couldn\'t write suggestions just now.'));
    } finally {
      this.suggesting.set(false);
    }
  }

  addTag(tag: string): void {
    const tags = parseYouTubeTags(`${this.tagsText},${tag}`);
    if (youTubeTagsLength(tags) <= 500) this.tagsText = tags.join(', ');
  }

  createProblem(): string | null {
    if (!this.title.trim()) return 'add a title';
    if (/[<>]/.test(this.title) || /[<>]/.test(this.description)) return 'remove < and > (YouTube doesn\'t allow them)';
    if (this.tagsLength() > 500) return 'shorten the tags to 500 characters';
    if (this.startMode === 'later') {
      const at = this.startAt ? new Date(this.startAt) : null;
      if (!at || Number.isNaN(at.getTime()) || at.getTime() < Date.now()) return 'choose a start time in the future';
    }
    return null;
  }

  async create(): Promise<void> {
    if (this.createProblem() || this.creating()) return;
    const channel = this.selectedChannel();
    if (!channel) return;
    this.creating.set(true);
    this.error.set(null);
    try {
      const broadcast = await firstValueFrom(this.youtube.createBroadcast(channel.channelId, {
        title: this.title.trim(),
        description: this.description.trim(),
        tags: parseYouTubeTags(this.tagsText),
        categoryId: this.categoryId,
        privacy: this.privacy,
        madeForKids: this.madeForKids,
        notifySubscribers: true,
      }, this.startMode === 'later' ? new Date(this.startAt).toISOString() : null, this.enableDvr));
      this.select({ channelId: channel.channelId, channelTitle: channel.channelTitle, broadcast });
    } catch (err: unknown) {
      this.error.set(this.message(err, 'The broadcast couldn\'t be created on YouTube.'));
    } finally {
      this.creating.set(false);
    }
  }

  choose(broadcast: YouTubeLiveBroadcast): void {
    const channel = this.selectedChannel();
    if (channel) this.select({ channelId: channel.channelId, channelTitle: channel.channelTitle, broadcast });
  }

  clear(): void {
    this.selected.set(null);
    this.broadcastChange.emit(null);
    // A fresh list, so a broadcast just created shows under "Upcoming".
    void this.pickChannel(this.channelId());
  }

  privacyLabel(privacy: string): string {
    return privacy === 'public' ? 'Public' : privacy === 'unlisted' ? 'Unlisted' : 'Private';
  }

  private select(selection: SelectedYouTubeBroadcast): void {
    this.selected.set(selection);
    this.broadcastChange.emit(selection);
  }

  private message(err: unknown, fallback: string): string {
    return err instanceof ApiFailure ? err.message : fallback;
  }

  private readPrefs(): Prefs {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== 'object') return {};
      const p = parsed as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === 'string' && v.length <= 128 ? v : undefined);
      return { channelId: str(p['channelId']), tone: str(p['tone']), language: str(p['language']), engine: str(p['engine']) };
    } catch {
      return {};
    }
  }

  private writePrefs(): void {
    try {
      const prefs: Prefs = { channelId: this.channelId(), tone: this.tone, language: this.language, engine: this.engine };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Storage unavailable (private window); remembering is only a convenience.
    }
  }
}
