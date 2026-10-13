import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import {
  MAX_RELATED_VIDEOS, YOUTUBE_MUSIC_CATEGORY_ID, YouTubeCheck, YouTubeDestination, YouTubeDraft, YouTubePrivacy, YouTubePublication, YouTubePublishSource,
  YouTubePublishStatus, YouTubeSuggestEngine, YouTubeUpload,
  isUploadFinished, parseYouTubeTags, relatedVideosBlock, youTubeTagsLength,
} from '../core/models/youtube.models';
import { ActivityService } from '../core/services/activity.service';
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
 *
 * With `source="release"`, `jobId` is a release kit's id and its visualizer goes up as a
 * Music video - the same dialog and uploader, so a song reaches YouTube Music the same way.
 */
@Component({
  selector: 'app-youtube-publish-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="yt-backdrop" (click)="closed.emit()">
      <div class="yt-dialog" role="dialog" aria-modal="true" aria-label="Publish to YouTube" (click)="$event.stopPropagation()">
        <header class="yt-head">
          <h4><span class="yt-logo" [class.music]="isMusic()" aria-hidden="true">{{ isMusic() ? '♪' : '▶' }}</span>
            {{ reviewing() ? 'Review before uploading' : isMusic() ? 'Publish to YouTube Music' : 'Publish to YouTube' }}</h4>
          <button type="button" class="yt-x" aria-label="Close" (click)="closed.emit()">✕</button>
        </header>

        <div class="yt-body">
        @if (loading()) {
          <p class="yt-muted">Loading…</p>
        } @else if (status(); as st) {
          @if (!st.configured) {
            <p class="yt-err">Publishing to YouTube isn't set up on this server. An admin needs to set
              <code>YouTube:Publish:ClientId</code>, <code>ClientSecret</code> and <code>RedirectUri</code>.</p>
          } @else if (reviewing()) {
            <div class="yt-review">
              <p class="yt-muted">Check everything once more. Nothing is sent to YouTube until you confirm.</p>
              <dl>
                <div><dt>Destination</dt><dd>{{ isMusic() ? 'YouTube + YouTube Music (Music category)' : 'YouTube' }}</dd></div>
                <div><dt>Channel</dt><dd>{{ selectedChannel()?.channelTitle }}</dd></div>
                <div><dt>Visibility</dt><dd>{{ privacyLabel() }}{{ notify() && privacy() === 'public' ? ' · subscribers notified' : '' }}</dd></div>
                <div><dt>Audience</dt><dd>{{ madeForKids() ? 'Made for kids' : 'Not made for kids' }}</dd></div>
                <div><dt>Category</dt><dd>{{ categoryName() }}</dd></div>
                <div><dt>Title</dt><dd><strong>{{ title().trim() }}</strong></dd></div>
                <div><dt>Tags ({{ tags().length }})</dt><dd>{{ tags().join(', ') || '—' }}</dd></div>
                <div><dt>Description</dt><dd><pre>{{ finalDescription() || '—' }}</pre></dd></div>
                @if (firstComment().trim()) {
                  <div><dt>First comment</dt><dd><pre>{{ firstComment().trim() }}</pre></dd></div>
                }
                @if (relatedSelected().length) {
                  <div><dt>Related ({{ relatedSelected().length }})</dt><dd>{{ relatedTitles() }}</dd></div>
                }
              </dl>
              @for (c of warnings(); track c.code) { <p class="yt-warn">⚠ {{ c.message }}</p> }
              @if (privacy() === 'public') {
                <p class="yt-warn">This goes live publicly as soon as YouTube finishes processing it.</p>
              }
            </div>
          } @else {
            <!-- Where it should be found. Either way it is one upload with one video id. -->
            <div class="yt-dest" role="radiogroup" aria-label="Publish to">
              <button type="button" role="radio" class="yt-dest-opt" [class.active]="!isMusic()" [attr.aria-checked]="!isMusic()"
                      (click)="setDestination('youtube')" [disabled]="uploading() || isRelease()"
                      [title]="isRelease() ? 'A song always goes up as Music' : 'An ordinary video, in the category you pick'">
                <span class="yt-dest-icon" aria-hidden="true">▶</span>
                <span><strong>YouTube</strong><small>A video, in the category you pick</small></span>
              </button>
              <button type="button" role="radio" class="yt-dest-opt music" [class.active]="isMusic()" [attr.aria-checked]="isMusic()"
                      (click)="setDestination('music')" [disabled]="uploading()">
                <span class="yt-dest-icon" aria-hidden="true">♪</span>
                <span><strong>YouTube Music</strong><small>Music category · also listed in the YouTube Music app</small></span>
              </button>
            </div>
            @if (isMusic()) {
              <p class="yt-dest-note">
                <strong>One upload, two places.</strong> The video goes up on YouTube as usual and, being in the Music
                category, is listed on YouTube Music under the channel too - same video, same views, likes and comments,
                two links: <code>youtube.com</code> and <code>music.youtube.com</code>. Official audio-only songs
                ("Art Tracks") on YouTube Music still only come from a music distributor.
              </p>
            }
            <div class="yt-grid">
              <!-- Left: what is being published, where, and how. -->
              <aside class="yt-side">
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

                <section class="yt-card">
                  <span class="yt-label">Channel</span>
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
                    }
                  </div>
                  @if (st.channels.length > 0) {
                    <div class="yt-links">
                      <button type="button" class="link" (click)="connect()" [disabled]="busy() || uploading()" title="Connect another channel or brand account">＋ Add channel</button>
                      @if (selectedChannel(); as ch) {
                        @if (ch.needsReconnect) {
                          <button type="button" class="link" (click)="connect()" [disabled]="busy()">Reconnect</button>
                        }
                        <button type="button" class="link" (click)="disconnect(ch.channelId)" [disabled]="busy() || uploading()">Disconnect</button>
                      }
                    </div>
                  }
                  @if (draft(); as d) {
                    @if (brandLinked()) {
                      <p class="yt-muted">Brand channel <strong>{{ d.brandChannelName }}</strong> publishes here; details start from its defaults.</p>
                    } @else if (brandMissing()) {
                      <p class="yt-warn">Brand channel <strong>{{ d.brandChannelName }}</strong> publishes to a YouTube channel you haven't connected. Use ＋ Add channel.</p>
                    }
                  }
                </section>

                <section class="yt-card">
                  <div class="yt-row">
                    <label>Category
                      <select [ngModel]="categoryId()" (ngModelChange)="categoryId.set($event)" [disabled]="uploading() || isMusic()"
                              [title]="isMusic() ? 'YouTube Music needs the Music category. Switch to YouTube above to pick another.' : ''">
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
                </section>
              </aside>

              <!-- Right: the words. -->
              <div class="yt-form">
                <!-- AI suggestions read a project's script; a song's details come from its release sheet instead. -->
                @if (!isRelease()) {
                <section class="yt-ai">
                  <div class="yt-suggest">
                    <button type="button" class="yt-ai-go" (click)="suggest()" [disabled]="suggesting() || uploading()"
                            title="Write titles, descriptions and tags from the project, its clips, captions and your notes">
                      {{ suggesting() ? 'Writing…' : suggestedOnce() ? '✨ Suggest again' : '✨ Suggest with AI' }}
                    </button>
                    <select [ngModel]="tone()" (ngModelChange)="tone.set($event)" aria-label="Tone" title="Tone" [disabled]="suggesting() || uploading()">
                      @for (t of tones(); track t) { <option [value]="t">{{ toneLabel(t) }}</option> }
                    </select>
                    <select [ngModel]="language()" (ngModelChange)="language.set($event)" aria-label="Suggestion language" [disabled]="suggesting() || uploading()">
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                    <select [ngModel]="engine()" (ngModelChange)="engine.set($event)" aria-label="AI engine"
                            title="Auto tries your providers in order. Local engines use the Claude Code / Copilot CLI signed in on this machine - no API key."
                            [disabled]="suggesting() || uploading()">
                      <option value="">Auto (provider chain)</option>
                      @for (e of engines(); track e.id) {
                        <option [value]="e.id">{{ e.runsLocally ? '💻 ' : '🔑 ' }}{{ e.name }}</option>
                      }
                    </select>
                  </div>
                  <input type="text" class="yt-brief" maxlength="1000" [ngModel]="brief()" (ngModelChange)="brief.set($event)"
                         [disabled]="suggesting() || uploading()" aria-label="What's it about? (optional, helps the AI)"
                         placeholder="Optional notes for the AI - e.g. Day 1 of Navratri, for devotees, keep it short" />
                  @if (suggestNote()) { <p class="yt-muted">{{ suggestNote() }}</p> }
                </section>
                }

                <section class="yt-field">
                  <div class="yt-field-head">
                    <label for="yt-title">Title</label>
                    <span class="yt-count" [class.over]="title().trim().length > st.limits.maxTitleLength">
                      {{ title().trim().length }} / {{ st.limits.maxTitleLength }}</span>
                  </div>
                  <input id="yt-title" type="text" [ngModel]="title()" (ngModelChange)="title.set($event)" [disabled]="uploading()"
                         [class.invalid]="fieldError('title')" maxlength="200" />
                  @if (titleOptions().length) {
                    <div class="yt-ideas" role="group" aria-label="Title ideas">
                      <span class="yt-ideas-label">Title ideas</span>
                      @for (t of titleOptions(); track t) {
                        <button type="button" class="yt-chip" [class.active]="t === title()" (click)="title.set(t)"
                                [disabled]="uploading()">{{ t }}</button>
                      }
                    </div>
                  }
                </section>

                <section class="yt-field">
                  <div class="yt-field-head">
                    <label for="yt-description">Description</label>
                    <span class="yt-count" [class.over]="descriptionBytes() > st.limits.maxDescriptionBytes">
                      {{ descriptionBytes() | number }} / {{ st.limits.maxDescriptionBytes | number }}{{ relatedSelected().length ? ' incl. related videos' : '' }}</span>
                  </div>
                  @if (descriptionOptions().length > 1) {
                    <div class="yt-tabs" role="tablist" aria-label="Description versions">
                      @for (d of descriptionOptions(); track $index) {
                        <button type="button" role="tab" class="yt-tab" [class.active]="d === description()"
                                [attr.aria-selected]="d === description()" [title]="preview(d)"
                                (click)="description.set(d)" [disabled]="uploading()">
                          {{ descriptionLabel($index) }}
                        </button>
                      }
                      @if (!descriptionOptions().includes(description())) { <span class="yt-tab-edited">✎ Edited</span> }
                    </div>
                  }
                  <textarea id="yt-description" rows="11" [ngModel]="description()" (ngModelChange)="description.set($event)" [disabled]="uploading()"
                            [class.invalid]="fieldError('description')"></textarea>
                </section>

                <section class="yt-field">
                  <div class="yt-field-head">
                    <label for="yt-tags">{{ draft()?.channelTags?.length ? 'More tags for this video' : 'Tags' }} <span class="yt-muted">(comma-separated)</span></label>
                    <span class="yt-count" [class.over]="tagsLength() > st.limits.maxTagsLength">
                      {{ tags().length }} tags · {{ tagsLength() }} / {{ st.limits.maxTagsLength }}</span>
                  </div>
                  <input id="yt-tags" type="text" [ngModel]="tagsText()" (ngModelChange)="tagsText.set($event)" [disabled]="uploading()"
                         [class.invalid]="fieldError('tags')" placeholder="HoneyBadger, Wildlife, NatureComedy" />
                  @if (tagIdeasLeft().length) {
                    <div class="yt-ideas" role="group" aria-label="Tag ideas">
                      <span class="yt-ideas-label">Tag ideas</span>
                      @for (t of tagIdeasLeft(); track t) {
                        <button type="button" class="yt-chip yt-chip-add" (click)="addTag(t)" [disabled]="uploading()"
                                [attr.aria-label]="'Add tag ' + t">＋ {{ t }}</button>
                      }
                      <button type="button" class="link" (click)="addAllTagIdeas()" [disabled]="uploading()">Add all that fit</button>
                    </div>
                  }
                  @if (draft()?.channelTags?.length) {
                    <div class="yt-chips" aria-label="Channel default tags">
                      <span class="yt-ideas-label">From channel settings</span>
                      @for (t of draft()!.channelTags; track t) {
                        <span class="chip" [class.off]="excludedChannelTags().has(t)">
                          {{ t }}
                          <button type="button" [disabled]="uploading()" (click)="toggleChannelTag(t)"
                                  [attr.aria-label]="(excludedChannelTags().has(t) ? 'Add back ' : 'Leave out ') + t">
                            {{ excludedChannelTags().has(t) ? '＋' : '✕' }}</button>
                        </span>
                      }
                    </div>
                  }
                </section>

                <!-- First comment: posted on the video as soon as the upload finishes. -->
                <section class="yt-field">
                  <div class="yt-field-head">
                    <label for="yt-first-comment">First comment <span class="yt-muted">(posted automatically once the video is up)</span></label>
                    <span class="yt-muted">{{ firstComment().trim().length }}/{{ maxCommentLength }}</span>
                  </div>
                  <textarea id="yt-first-comment" rows="3" [ngModel]="firstComment()" (ngModelChange)="firstComment.set($event)"
                            [disabled]="uploading()" [class.invalid]="fieldError('firstComment')"
                            placeholder="Thanks for watching! Which part was your favourite? 👇"></textarea>
                  @if (firstComment().trim() && selectedChannel(); as ch) {
                    @if (!ch.canComment) {
                      <p class="yt-warn">{{ ch.channelTitle }} was connected before AnimStudio could post comments.
                        <button type="button" class="link" (click)="connect()" [disabled]="busy()">Reconnect it</button> or leave this empty.</p>
                    } @else if (privacy() === 'private' || madeForKids()) {
                      <p class="yt-muted">Not posted on {{ madeForKids() ? 'videos made for kids' : 'private videos' }} - YouTube has comments off there.</p>
                    }
                  }
                </section>

                <!-- Related videos: the user's own uploads from AnimStudio, linked at the end of the description. -->
                <section class="yt-field yt-related">
                  <span class="yt-label">Related videos <span class="yt-muted">(linked at the end of the description)</span></span>
                  @if (relatedSelected().length) {
                    <div class="yt-chips" aria-label="Selected related videos">
                      @for (v of relatedSelected(); track v.videoId) {
                        <span class="chip">
                          {{ v.title }}
                          <button type="button" [disabled]="uploading()" (click)="removeRelated(v.videoId)" [attr.aria-label]="'Remove ' + v.title">✕</button>
                        </span>
                      }
                    </div>
                  }
                  @if (videosAvailable().length === 0) {
                    <p class="yt-muted">Videos you publish from AnimStudio will appear here to link.</p>
                  } @else if (relatedSelected().length < maxRelated) {
                    <div class="yt-related-pick">
                      @if (videosAvailable().length > 8) {
                        <input type="search" [ngModel]="relatedQuery()" (ngModelChange)="relatedQuery.set($event)" [disabled]="uploading()"
                               placeholder="Filter your videos…" aria-label="Filter related videos" />
                      }
                      <select #relatedPick (change)="addRelated(relatedPick.value); relatedPick.value = ''" [disabled]="uploading()" aria-label="Add a related video">
                        <option value="">＋ Add a related video ({{ relatedOptions().length }})…</option>
                        @for (v of relatedOptions(); track v.videoId) {
                          <option [value]="v.videoId">{{ v.title }} — {{ v.channelTitle }}{{ v.health === 'Issue' ? ' (has an issue)' : '' }}</option>
                        }
                      </select>
                    </div>
                  } @else {
                    <p class="yt-muted">Up to {{ maxRelated }} related videos.</p>
                  }
                </section>
              </div>
            </div>
          }
        } @else if (error()) {
          <p class="yt-err">{{ error() }}</p>
        }
        </div>

        <!-- Always visible: progress, errors and the buttons. -->
        @if (!loading() && status()?.configured) {
          <footer class="yt-foot">
            <div class="yt-foot-status">
              @if (upload(); as u) {
                @switch (u.state) {
                  @case ('Completed') {
                    <p class="ok">✓ Published to {{ u.channelTitle }} ({{ u.privacy }}).
                      <a [href]="u.videoUrl" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a> ·
                      @if (u.musicUrl) { <a [href]="u.musicUrl" target="_blank" rel="noopener noreferrer">Play on YouTube Music ↗</a> · }
                      <a [href]="u.studioUrl" target="_blank" rel="noopener noreferrer">Open in YouTube Studio ↗</a></p>
                    @if (u.musicUrl) {
                      <p class="yt-muted">Both links open the same video. YouTube Music may take a while to list it under the channel.</p>
                    }
                    <p class="yt-muted">YouTube may still be processing HD versions for a few minutes.
                      @if (u.privacy === 'private') { Finish the details and publish it from YouTube Studio. }</p>
                    @if (u.commentId) { <p class="yt-muted">💬 First comment posted. Pin it from YouTube Studio if you want it on top.</p> }
                    @if (u.warning) { <p class="yt-warn">⚠ {{ u.warning }}</p> }
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
              }
              @if (error()) { <p class="yt-err">{{ error() }}</p> }
              @if (!upload() && !error() && !reviewing() && problems().length) {
                <p class="yt-muted">{{ problems().length }} thing{{ problems().length === 1 ? '' : 's' }} to fix before publishing (see the left).</p>
              }
            </div>
            <div class="yt-actions">
              @if (reviewing()) {
                <button type="button" class="secondary" (click)="reviewing.set(false)" [disabled]="busy()">Back to edit</button>
                <button type="button" (click)="publish()" [disabled]="!canPublish()">
                  {{ busy() ? 'Starting…' : privacy() === 'private' ? 'Confirm & upload as draft' : 'Confirm & upload' }}
                </button>
              } @else if (uploading()) {
                <button type="button" class="secondary" (click)="cancelUpload()">Cancel upload</button>
                <button type="button" (click)="closed.emit()">Close</button>
              } @else {
                <button type="button" class="secondary" (click)="closed.emit()">{{ upload()?.state === 'Completed' ? 'Close' : 'Cancel' }}</button>
                <button type="button" (click)="review()" [disabled]="!canPublish()">
                  {{ upload()?.state === 'Completed' ? 'Publish again…' : privacy() === 'private' ? 'Review & upload as draft…' : 'Review & publish…' }}
                </button>
              }
            </div>
          </footer>
        }
      </div>
    </div>
  `,
  styles: [`
    .yt-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(2, 6, 23, 0.78);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .yt-dialog { background: var(--surface, #0f172a); border: 1px solid var(--border, rgba(148, 163, 184, 0.2));
      border-radius: 14px; width: min(1240px, 100%); height: calc(100vh - 32px); max-height: 980px;
      display: flex; flex-direction: column; overflow: hidden;
      color: var(--text, #e2e8f0); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }

    .yt-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
      padding: .8rem 1.25rem; border-bottom: 1px solid var(--border, rgba(148, 163, 184, .2)); flex: none; }
    .yt-head h4 { margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: .55rem; }
    .yt-logo { display: inline-grid; place-items: center; width: 1.6rem; height: 1.1rem; border-radius: 5px;
      background: #ff3d3d; color: #fff; font-size: .6rem; }
    .yt-logo.music { border-radius: 50%; width: 1.25rem; height: 1.25rem; font-size: .75rem; }
    .yt-x { background: transparent; border: 0; color: inherit; font-size: 1.1rem; cursor: pointer; }

    .yt-dest { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-bottom: .75rem; }
    @media (max-width: 560px) { .yt-dest { grid-template-columns: 1fr; } }
    .yt-dest-opt { display: flex; align-items: center; gap: .65rem; text-align: left; padding: .6rem .8rem; border-radius: 10px;
      border: 1px solid rgba(148, 163, 184, .2); background: rgba(148, 163, 184, .06); color: inherit; cursor: pointer; }
    .yt-dest-opt:hover:not(:disabled) { border-color: rgba(148, 163, 184, .45); box-shadow: none; }
    .yt-dest-opt:disabled { cursor: default; opacity: .55; }
    .yt-dest-opt.active { border-color: #ff3d3d; background: rgba(255, 61, 61, .1); opacity: 1; }
    .yt-dest-opt span:last-child { display: grid; gap: .1rem; }
    .yt-dest-opt small { color: var(--muted, #94a3b8); font-size: .76rem; font-weight: 400; }
    .yt-dest-icon { display: inline-grid; place-items: center; flex: none; width: 2rem; height: 2rem; border-radius: 8px;
      background: #ff3d3d; color: #fff; font-size: .8rem; }
    .yt-dest-opt.music .yt-dest-icon { border-radius: 50%; font-size: 1rem; }
    .yt-dest-note { margin: 0 0 .9rem; padding: .6rem .8rem; border-radius: 10px; font-size: .84rem; line-height: 1.45;
      background: rgba(255, 61, 61, .07); border: 1px solid rgba(255, 61, 61, .2); }
    .yt-dest-note code { font-size: .8rem; }

    .yt-body { flex: 1 1 auto; overflow: auto; padding: 1rem 1.25rem; }
    .yt-foot { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: .75rem 1.25rem; border-top: 1px solid var(--border, rgba(148, 163, 184, .2));
      background: color-mix(in srgb, var(--surface-2, #1e293b) 55%, var(--surface, #0f172a)); }
    .yt-foot-status { min-width: 0; flex: 1 1 auto; display: grid; gap: .25rem; }
    .yt-foot-status p { margin: 0; }
    .yt-actions { display: flex; gap: .5rem; flex: none; }

    .yt-grid { display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); gap: 1.4rem; align-items: start; }
    @media (max-width: 860px) { .yt-grid { grid-template-columns: 1fr; } }

    /* Left column */
    .yt-side { display: grid; gap: .75rem; align-content: start; }
    .yt-stage { background: #000; border-radius: 10px; overflow: hidden; display: grid; place-items: center; }
    .yt-stage video { display: block; width: 100%; max-height: 34vh; background: #000; }
    .yt-stage.vertical video { max-height: 44vh; }
    .yt-facts { display: flex; flex-wrap: wrap; gap: .3rem 1rem; margin: 0; font-size: .82rem; }
    .yt-facts div { display: flex; gap: .3rem; }
    .yt-facts dt { color: var(--muted, #94a3b8); }
    .yt-facts dd { margin: 0; font-variant-numeric: tabular-nums; }
    .yt-checks { list-style: none; padding: 0; margin: 0; display: grid; gap: .3rem; font-size: .85rem; }
    .yt-checks .err { color: #fca5a5; }
    .yt-checks .warn { color: #fcd34d; }
    .yt-card { display: grid; gap: .5rem; padding: .75rem .85rem; border-radius: 10px;
      background: rgba(148, 163, 184, .07); border: 1px solid rgba(148, 163, 184, .12); }
    .yt-card label { display: grid; gap: .25rem; font-size: .82rem; color: var(--muted, #94a3b8); margin: 0; }
    .yt-card label.inline { display: flex; align-items: center; gap: .4rem; color: inherit; font-size: .88rem; }
    .yt-card select { width: 100%; box-sizing: border-box; }
    .yt-channel { display: flex; align-items: center; gap: .5rem; }
    .yt-channel img { width: 30px; height: 30px; border-radius: 50%; flex: none; }
    .yt-channel select { flex: 1; min-width: 0; }
    .yt-links { display: flex; flex-wrap: wrap; gap: .25rem; margin: -.2rem 0 0 -.3rem; }
    .yt-row { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
    .yt-audience { border: 0; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
    .yt-audience legend { font-size: .82rem; color: var(--muted, #94a3b8); padding: 0; margin-bottom: .25rem; }

    /* Right column */
    .yt-form { display: grid; gap: 1rem; align-content: start; min-width: 0; }
    .yt-ai { display: grid; gap: .5rem; padding: .75rem .85rem; border-radius: 10px;
      background: linear-gradient(135deg, rgba(108, 140, 255, .12), rgba(168, 85, 247, .08));
      border: 1px solid rgba(108, 140, 255, .25); }
    .yt-suggest { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }
    .yt-suggest select { width: auto; flex: 0 1 auto; }
    .yt-ai-go { font-weight: 700; }
    input.yt-brief { width: 100%; box-sizing: border-box; }
    .yt-field { display: grid; gap: .4rem; }
    .yt-field-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
    .yt-field-head label { margin: 0; font-weight: 700; font-size: .9rem; }
    .yt-field input[type=text], .yt-field textarea, .yt-field select { width: 100%; box-sizing: border-box; }
    .yt-field textarea { resize: vertical; min-height: 180px; line-height: 1.45; }
    .invalid { outline: 1px solid #ef4444; }
    .yt-count { font-size: .75rem; color: var(--muted, #94a3b8); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .yt-count.over { color: #f87171; font-weight: 600; }

    .yt-ideas { display: flex; flex-wrap: wrap; gap: .35rem; align-items: center; max-height: 8.5rem; overflow: auto; padding: .1rem 0; }
    .yt-ideas-label { font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      color: var(--muted, #94a3b8); margin-right: .15rem; }
    .yt-chip { font-size: .8rem; padding: .25rem .6rem; border-radius: 999px; border: 1px solid #334155;
      background: #111827; color: inherit; cursor: pointer; text-align: left; font-weight: 500; line-height: 1.3; }
    .yt-chip:hover:not(:disabled) { border-color: #6366f1; box-shadow: none; }
    .yt-chip.active { border-color: #6366f1; background: #1e1b4b; }
    .yt-chip-add { color: var(--text-dim, #cbd5e1); }

    .yt-tabs { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; padding: .2rem; border-radius: 999px;
      background: rgba(148, 163, 184, .08); border: 1px solid rgba(148, 163, 184, .15); width: fit-content; max-width: 100%; }
    .yt-tab { padding: .3rem .8rem; border-radius: 999px; border: 0; background: transparent; color: var(--muted, #94a3b8);
      font-size: .82rem; font-weight: 600; cursor: pointer; }
    .yt-tab:hover:not(:disabled) { color: var(--text, #e2e8f0); box-shadow: none; }
    .yt-tab.active { background: rgba(108, 140, 255, .25); color: var(--text, #e2e8f0); }
    .yt-tab-edited { font-size: .78rem; color: var(--muted, #94a3b8); padding: 0 .5rem; }

    .yt-chips { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; font-size: .8rem; }
    .chip { display: inline-flex; align-items: center; gap: .15rem; padding: .1rem .2rem .1rem .5rem; border-radius: 999px;
      background: rgba(108, 140, 255, .18); }
    .chip.off { opacity: .45; text-decoration: line-through; }
    .chip button { background: transparent; border: 0; color: inherit; cursor: pointer; padding: 0 .25rem; font-size: .75rem; }
    .yt-related-pick { display: grid; gap: .35rem; }
    .yt-related-pick input, .yt-related-pick select { width: 100%; box-sizing: border-box; }

    .link { background: transparent; border: 0; color: var(--brand, #6c8cff); cursor: pointer; padding: .2rem .3rem; font-size: .84rem; }
    .link:hover:not(:disabled) { box-shadow: none; text-decoration: underline; }
    .ok { color: #86efac; }
    .bar { height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
    .bar div { height: 100%; background: #ef4444; transition: width .4s ease; }
    .yt-label { font-size: .82rem; color: var(--muted, #94a3b8); font-weight: 600; }
    .yt-related .yt-label { color: var(--text, #e2e8f0); font-weight: 700; font-size: .9rem; }
    .yt-muted { color: var(--muted, #94a3b8); font-size: .84rem; margin: 0; }
    .yt-err { color: #fca5a5; font-size: .9rem; margin: 0; }
    .yt-warn { color: #fcd34d; font-size: .85rem; margin: 0; }

    .yt-review { max-width: 860px; margin: 0 auto; }
    .yt-review dl { display: grid; gap: .5rem; margin: .75rem 0; }
    .yt-review dl div { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: .75rem; }
    @media (max-width: 560px) { .yt-review dl div { grid-template-columns: 1fr; gap: .1rem; } }
    .yt-review dt { color: var(--muted, #94a3b8); font-size: .85rem; }
    .yt-review dd { margin: 0; overflow-wrap: anywhere; }
    .yt-review pre { margin: 0; white-space: pre-wrap; font: inherit; max-height: 40vh; overflow: auto;
      background: rgba(148, 163, 184, .08); padding: .5rem .6rem; border-radius: 6px; }

    @media (max-width: 640px) {
      .yt-backdrop { padding: 0; }
      .yt-dialog { height: 100vh; max-height: none; border-radius: 0; }
      .yt-foot { flex-direction: column; align-items: stretch; }
      .yt-actions { justify-content: flex-end; }
    }
  `],
})
export class YouTubePublishDialogComponent implements OnInit {
  private readonly api = inject(YouTubePublishService);
  private readonly activity = inject(ActivityService);

  readonly jobId = input.required<string>();
  /** A render (the default) or a release kit's visualizer. */
  readonly source = input<YouTubePublishSource>('render');
  readonly isRelease = computed(() => this.source() === 'release');
  /** YouTube, or YouTube Music (the Music category). A song, or a music project's render, starts on Music. */
  readonly destination = signal<YouTubeDestination>('youtube');
  readonly isMusic = computed(() => this.destination() === 'music');
  /** The category picked before switching to Music, to give back when switching away again. */
  private categoryBeforeMusic: string | null = null;
  readonly previewSrc = input.required<string>();
  /** The in-app path to come back to after connecting a channel. */
  readonly returnPath = input.required<string>();
  /**
   * Upload as a draft: private and silent, to finish (thumbnail, end screens, playlists) in
   * YouTube Studio. The API has no real draft state, so private is the closest equivalent.
   */
  readonly asDraft = input(false);
  readonly closed = output<void>();
  /** An upload of this render finished; the link is now saved with it. */
  readonly published = output<YouTubeUpload>();

  readonly maxRelated = MAX_RELATED_VIDEOS;
  /** The user's videos uploaded from the app, for the related-videos picker. */
  readonly videos = signal<YouTubePublication[]>([]);
  readonly relatedIds = signal<string[]>([]);
  readonly relatedQuery = signal('');

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
  readonly firstComment = signal('');
  readonly maxCommentLength = 10000;

  /** Channel default tags left out of this one video. */
  readonly excludedChannelTags = signal<ReadonlySet<string>>(new Set());
  /** Showing the final summary; the upload only starts from there. */
  readonly reviewing = signal(false);
  readonly suggesting = signal(false);
  readonly suggestedOnce = signal(false);
  readonly suggestNote = signal<string | null>(null);
  readonly language = signal<'en' | 'hi'>('en');
  readonly tone = signal('auto');
  readonly tones = signal<string[]>(['auto']);
  /** '' is the provider chain; otherwise one engine, pinned for this request. */
  readonly engine = signal('');
  readonly engines = signal<YouTubeSuggestEngine[]>([]);
  readonly brief = signal('');
  /** Every title the last suggestion offered, the chosen one included, so it can be switched back. */
  readonly titleOptions = signal<string[]>([]);
  /** Every description the last suggestion offered: the main one first, then short and detailed. */
  readonly descriptionOptions = signal<string[]>([]);
  /** Extra tags the last suggestion offered, to add with a click. */
  readonly tagIdeas = signal<string[]>([]);
  /** Ideas not already among the tags. */
  readonly tagIdeasLeft = computed(() => {
    const have = new Set(this.tags().map((t) => t.toLowerCase()));
    return this.tagIdeas().filter((t) => !have.has(t.toLowerCase()));
  });

  private static readonly ToneLabels: Record<string, string> = {
    auto: '🎯 Any tone', funny: '😂 Funny', devotional: '🙏 Devotional', emotional: '🥹 Emotional',
    dramatic: '🎭 Dramatic', informative: '📘 Informative', energetic: '⚡ Energetic', kids: '🧸 For kids',
    motivational: '💪 Motivational', 'clickbait-free': '✅ Honest / no clickbait',
  };

  toneLabel(id: string): string {
    return YouTubePublishDialogComponent.ToneLabels[id] ?? id;
  }

  readonly selectedChannel = computed(() =>
    this.status()?.channels.find((c) => c.channelId === this.channelId()) ?? null);
  /** The video's own tags first, then the channel's defaults that weren't left out. */
  readonly tags = computed(() => {
    const channel = (this.draft()?.channelTags ?? []).filter((t) => !this.excludedChannelTags().has(t));
    return parseYouTubeTags([this.tagsText(), ...channel].join(','));
  });
  readonly categoryName = computed(() =>
    this.status()?.categories.find((c) => c.id === this.categoryId())?.name ?? this.categoryId());
  readonly privacyLabel = computed(() =>
    ({ public: 'Public', unlisted: 'Unlisted', private: 'Private (draft)' })[this.privacy()]);
  readonly tagsLength = computed(() => youTubeTagsLength(this.tags()));
  /** Not removed from YouTube; one entry per video even if it was recorded twice. */
  readonly videosAvailable = computed(() => {
    const seen = new Set<string>();
    return this.videos().filter((v) => v.health !== 'Removed' && !seen.has(v.videoId) && seen.add(v.videoId));
  });
  readonly relatedSelected = computed(() => {
    const byId = new Map(this.videosAvailable().map((v) => [v.videoId, v] as const));
    return this.relatedIds().map((id) => byId.get(id)).filter((v): v is YouTubePublication => v !== undefined);
  });
  readonly relatedOptions = computed(() => {
    const chosen = new Set(this.relatedIds());
    const q = this.relatedQuery().trim().toLowerCase();
    return this.videosAvailable().filter((v) => !chosen.has(v.videoId)
      && (!q || v.title.toLowerCase().includes(q) || v.channelTitle.toLowerCase().includes(q)));
  });
  readonly relatedTitles = computed(() => this.relatedSelected().map((v) => v.title).join(', '));
  /** Exactly what YouTube receives: the typed description plus the related-videos block. */
  readonly finalDescription = computed(() => {
    const body = this.description().trim();
    const block = relatedVideosBlock(this.relatedSelected());
    return !block ? body : body ? `${body}\n\n${block}` : block;
  });
  readonly descriptionBytes = computed(() => new TextEncoder().encode(this.finalDescription()).length);
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
    const comment = this.firstComment().trim();
    if (comment.length > this.maxCommentLength) list.push({ field: 'firstComment', code: 'comment-too-long', message: `The first comment is over ${this.maxCommentLength} characters.` });
    if (comment && this.selectedChannel() && !this.selectedChannel()!.canComment) list.push({ field: 'firstComment', code: 'youtube-comment-scope', message: 'Reconnect the channel to post the first comment, or leave it empty.' });
    for (const e of this.serverErrors()) if (!list.some((x) => x.code === e.code)) list.push(e);
    return list;
  });

  readonly canPublish = computed(() => !this.busy() && !this.suggesting() && !this.uploading() && this.problems().length === 0);

  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopPolling());
  }

  ngOnInit(): void {
    // Optional: without it the pickers just offer Auto and "any tone".
    this.api.suggestOptions().pipe(catchError(() => of(null))).subscribe((o) => {
      if (!o) return;
      this.engines.set(o.engines);
      if (o.tones.length) this.tones.set(o.tones);
    });
    forkJoin({
      status: this.api.status(),
      draft: this.api.draft(this.jobId(), this.source()),
      uploads: this.api.uploads(this.jobId()),
      // The picker is optional: a failure here leaves it empty rather than blocking publishing.
      videos: this.api.videos().pipe(catchError(() => of([] as YouTubePublication[]))),
    }).subscribe({
      next: ({ status, draft, uploads, videos }) => {
        const prefs = this.readPrefs();
        this.status.set(status);
        this.videos.set(videos);
        this.draft.set(draft);
        this.title.set(draft.title);
        this.description.set(draft.description);
        this.tagsText.set(draft.tags.join(', '));
        this.notify.set(draft.notifySubscribers);
        this.firstComment.set(draft.firstComment ?? '');

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
        // A song or a music project goes to YouTube Music, whatever was last picked for a video.
        if (this.isRelease() || draft.isMusic) this.setDestination('music');
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

  /**
   * Music sends the upload in the Music category, which is all that lists it on YouTube Music;
   * switching back restores the category picked before. A song can't leave Music.
   */
  setDestination(destination: YouTubeDestination): void {
    if (this.uploading() || (this.isRelease() && destination !== 'music')) return;
    if (destination === 'music') {
      if (!this.isMusic()) this.categoryBeforeMusic = this.categoryId();
      this.categoryId.set(YOUTUBE_MUSIC_CATEGORY_ID);
    } else if (this.isMusic()) {
      this.categoryId.set(this.videoCategory() ?? '1');
    }
    this.destination.set(destination);
  }

  /** The non-Music category this upload would have as an ordinary video, if one is known. */
  private videoCategory(): string | undefined {
    const known = new Set(this.status()?.categories.map((c) => c.id));
    return [this.categoryBeforeMusic, this.readPrefs().categoryId, this.draft()?.categoryId]
      .find((id): id is string => !!id && id !== YOUTUBE_MUSIC_CATEGORY_ID && known.has(id));
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

  suggest(): void {
    this.suggesting.set(true);
    this.suggestNote.set(null);
    this.error.set(null);
    this.api.suggest(this.jobId(), {
      language: this.language(),
      fresh: this.suggestedOnce(),
      tone: this.tone(),
      brief: this.brief().trim() || undefined,
      providerId: this.engine() || undefined,
    }).subscribe({
      next: (s) => {
        this.title.set(s.title);
        this.titleOptions.set(s.titleOptions?.length ? [s.title, ...s.titleOptions] : []);
        this.description.set(s.description);
        this.descriptionOptions.set(s.descriptionOptions?.length ? [s.description, ...s.descriptionOptions] : []);
        this.tagsText.set(s.tags.join(', '));
        this.tagIdeas.set(s.tagIdeas ?? []);
        this.suggestedOnce.set(true);
        const by = this.engines().find((e) => e.id === s.providerId)?.name ?? s.providerId;
        this.suggestNote.set(`Filled in by ${by}. Read it through and edit before publishing.`);
        this.suggesting.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.suggesting.set(false);
      },
    });
  }

  addRelated(videoId: string): void {
    if (!videoId || this.relatedIds().includes(videoId) || this.relatedIds().length >= this.maxRelated) return;
    if (!this.videosAvailable().some((v) => v.videoId === videoId)) return;
    this.relatedIds.update((ids) => [...ids, videoId]);
  }

  removeRelated(videoId: string): void {
    this.relatedIds.update((ids) => ids.filter((id) => id !== videoId));
  }

  /** The main suggestion, then the short and detailed versions the prompt asks for. */
  descriptionLabel(index: number): string {
    return ['✨ Suggested', '⚡ Short', '📖 Detailed'][index] ?? `Version ${index + 1}`;
  }

  /** The start of a version, for its tab's tooltip. */
  preview(text: string): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat;
  }

  addTag(tag: string): void {
    const current = this.tagsText().trim().replace(/,\s*$/, '');
    this.tagsText.set(current ? `${current}, ${tag}` : tag);
  }

  /** Adds ideas in order while the tags stay within YouTube's length limit. */
  addAllTagIdeas(): void {
    const limit = this.status()?.limits.maxTagsLength ?? 500;
    for (const tag of this.tagIdeasLeft()) {
      const before = this.tagsText();
      this.addTag(tag);
      if (this.tagsLength() > limit) {
        this.tagsText.set(before);
        break;
      }
    }
  }

  toggleChannelTag(tag: string): void {
    this.excludedChannelTags.update((set) => {
      const next = new Set(set);
      if (!next.delete(tag)) next.add(tag);
      return next;
    });
  }

  /** The last look before anything is sent. */
  review(): void {
    if (!this.canPublish()) return;
    this.error.set(null);
    this.reviewing.set(true);
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
    }, this.relatedSelected().map((v) => v.videoId), this.firstComment().trim(), this.source()).subscribe({
      next: (upload) => {
        this.upload.set(upload);
        // The dialog can be closed mid-upload; the activity panel keeps following it.
        this.activity.trackYouTubeUpload(upload);
        this.reviewing.set(false);
        this.busy.set(false);
        if (!isUploadFinished(upload)) this.poll(upload.uploadId);
        else if (upload.state === 'Completed') this.published.emit(upload);
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
          else if (u.state === 'Completed') this.published.emit(u);
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
        // Music is decided per upload, so the next ordinary video keeps the category picked for videos.
        categoryId: this.isMusic() ? this.videoCategory() : this.categoryId(),
        privacy: this.privacy(),
        madeForKids: this.madeForKids() ?? undefined,
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Storage blocked: the next publish just starts from the defaults.
    }
  }
}
