import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, forkJoin, map, of, switchMap, tap } from 'rxjs';

import {
  GoogleDriveStatus, MAX_RELATED_VIDEOS, MAX_THUMBNAIL_UPLOAD_BYTES, PhoneHandoff, PhoneUploadCandidate, YOUTUBE_MUSIC_CATEGORY_ID, YouTubeCheck, YouTubeThumbnailChoice, YouTubeDestination, YouTubeDraft, YouTubePrivacy, YouTubePublication, YouTubePublishSource,
  YouTubePublishStatus, YouTubeSuggestEngine, YouTubeUpload, YouTubeUploadRoute,
  isHandoffActive, isUploadFinished, isValidDriveFolderName, parseYouTubeTags, relatedVideosBlock, youTubeTagsLength,
} from '../core/models/youtube.models';
import { ContentPlanItem, ContentPlanStatus, ContentTopic } from '../core/models/calendar.models';
import { ActivityService } from '../core/services/activity.service';
import { ApiService } from '../core/services/api.service';
import { ContentCalendarService } from '../core/services/content-calendar.service';
import { ProjectStore } from '../core/services/project-store';
import { YouTubePublishService } from '../core/services/youtube-publish.service';
import { TopicPickerComponent } from './topic-picker.component';
import { AuthService } from '../core/services/auth.service';

/** Remembered per browser so the next publish starts where the last one left off. */
const PREFS_KEY = 'animstudio.youtube.publish';

type ThumbMode = 'auto' | 'frame' | 'library' | 'upload';

const THUMB_MODES: readonly { id: ThumbMode; label: string; hint: string }[] = [
  { id: 'auto', label: 'Auto', hint: 'Let YouTube pick a frame' },
  { id: 'frame', label: 'From video', hint: 'Pick a frame of this video' },
  { id: 'library', label: '♻️ Library', hint: "Use a picture from this project's media, or from your other projects" },
  { id: 'upload', label: 'Upload', hint: 'Use a JPG or PNG of your own' },
];

/** Where the library picker looks: this project's images, or every other project's. */
type LibScope = 'project' | 'other';

interface LibItem { id: string; name: string; from?: string; width?: number; height?: number }

/** Typing pauses this long before the other-projects search runs. */
const LIB_SEARCH_DEBOUNCE_MS = 250;
const LIB_SEARCH_LIMIT = 60;
/** A library picture that YouTube can't take as-is (WebP, too big) is re-encoded to fit this box. */
const LIB_MAX_EDGE = 1920;

/** Where the frame picker samples the video, as fractions of its length; "Other moments" shifts them. */
const FRAME_SPOTS = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9];

interface FrameOption { at: number; url: string | null; failed: boolean }

/** Visibility as picked in the dialog: a scheduled upload is sent as private with a publish time. */
type Visibility = YouTubePrivacy | 'scheduled';

/** YouTube refuses a publish time closer than this (the server checks the same). */
const MIN_SCHEDULE_LEAD_MS = 10 * 60 * 1000;
/** How far ahead a publish time may be; the server allows a day more for time-zone slack. */
const MAX_SCHEDULE_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;
/** How far ahead the calendar-post picker looks. */
const PLAN_LOOKAHEAD_DAYS = 60;
/** Posts still waiting for a video; Scheduled/Published/Skipped already have one or never will. */
const OPEN_PLAN_STATUSES: readonly ContentPlanStatus[] = ['Idea', 'InProgress', 'Ready'];

/** A Date as a datetime-local value (the viewer's own time zone), e.g. 2026-10-28T18:00. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local value back to a Date; a string without a zone is read as local time. */
function fromLocalInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Tue 28 Oct, 18:00" in the viewer's locale and time zone. */
function formatWhen(date: Date): string {
  return date.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

interface PublishPrefs {
  channelId?: string;
  categoryId?: string;
  privacy?: YouTubePrivacy;
  /** The last pick was Scheduled. Only the choice is remembered, never the time. */
  scheduled?: boolean;
  madeForKids?: boolean;
  /** Upload from here, or send to the phone for a Shorts sound. */
  route?: YouTubeUploadRoute;
  muteAudio?: boolean;
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
  imports: [FormsModule, DecimalPipe, RouterLink, TopicPickerComponent],
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
        @if (auth.isAnonymous()) {
          <div style="padding: 2.5rem 1.5rem; text-align: center">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem">🔒</div>
            <h4 style="color: #fca5a5; margin: 0 0 0.5rem">Authentication Required</h4>
            <p class="yt-muted" style="max-width: 480px; margin: 0 auto 1.5rem">
              Publishing renders to YouTube or Google Drive requires an authenticated member account.
              Anonymous visitors cannot connect or publish to external cloud services.
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center">
              <button type="button" class="btn-primary-glow" (click)="auth.openAuthModal(); closed.emit()">
                Sign In to Publish
              </button>
              <button type="button" class="btn-outline" (click)="closed.emit()">
                Cancel
              </button>
            </div>
          </div>
        } @else if (loading()) {
          <p class="yt-muted">Loading…</p>
        } @else if (status(); as st) {
          @if (!st.configured) {
            <p class="yt-err">Publishing to YouTube isn't set up on this server. An admin needs to set
              <code>YouTube:Publish:ClientId</code>, <code>ClientSecret</code> and <code>RedirectUri</code>.</p>
          } @else if (reviewing()) {
            <div class="yt-review">
              <p class="yt-muted">Check everything once more. Nothing is sent to YouTube until you confirm.</p>
              <div class="yt-review-grid">
                <!-- What goes up: the video itself, its shape and its thumbnail. -->
                <aside class="yt-review-media">
                  <div class="yt-stage" [class.vertical]="draft()?.video?.isVertical">
                    <video [src]="previewSrc()" controls playsinline preload="metadata"></video>
                  </div>
                  @if (draft(); as d) {
                    <dl class="yt-facts">
                      @if (d.video.durationSeconds != null) { <div><dt>Length</dt><dd>{{ clock(d.video.durationSeconds) }}</dd></div> }
                      @if (d.video.width && d.video.height) { <div><dt>Picture</dt><dd>{{ d.video.width }}×{{ d.video.height }}</dd></div> }
                      <div><dt>Type</dt><dd>{{ d.video.isVertical && (d.video.durationSeconds ?? 0) <= 180 ? 'Short' : 'Video' }}</dd></div>
                    </dl>
                  }
                  <div class="yt-review-thumb-box">
                    <span class="yt-label">Thumbnail</span>
                    @if (route() === 'phone') { <span class="yt-muted">Picked in the YouTube app</span> }
                    @else if (thumbPreview(); as src) {
                      <img class="yt-review-thumb" [class.vertical]="draft()?.video?.isVertical && (thumbMode() === 'auto' || thumbMode() === 'frame')"
                           [src]="src" alt="Chosen thumbnail" />
                    } @else { <span class="yt-muted">YouTube picks automatically</span> }
                  </div>
                </aside>

                <div class="yt-review-main">
                  <section class="yt-card yt-review-card" aria-labelledby="yt-review-where">
                    <span class="yt-label" id="yt-review-where">Where it goes</span>
                    <dl>
                      <div><dt>Destination</dt><dd>{{ isMusic() ? 'YouTube + YouTube Music (Music category)' : 'YouTube' }}</dd></div>
                      @if (route() === 'phone') {
                        <div><dt>Upload from</dt><dd>📱 Your phone - via Google Drive folder "{{ folderName().trim() }}"{{ muteAudio() ? ', without its own sound' : '' }}</dd></div>
                      }
                      <div><dt>Channel</dt><dd>{{ selectedChannel()?.channelTitle }}</dd></div>
                      <div><dt>Visibility</dt><dd>{{ privacyLabel() }}{{ notify() && privacy() === 'public' ? ' · subscribers notified' : '' }}</dd></div>
                      @if (route() !== 'phone' && selectedPlan(); as post) {
                        <div><dt>Calendar post</dt><dd><span class="yt-plan-dot" [style.background]="planTopic(post)?.color ?? null" aria-hidden="true"></span>
                          {{ post.title }}{{ planTopic(post) ? ' · ' + planTopic(post)!.name : '' }}</dd></div>
                      }
                      <div><dt>Audience</dt><dd>{{ madeForKids() ? 'Made for kids' : 'Not made for kids' }}</dd></div>
                      <div><dt>Category</dt><dd>{{ categoryName() }}</dd></div>
                      @if (relatedSelected().length) {
                        <div><dt>Related ({{ relatedSelected().length }})</dt><dd>{{ relatedTitles() }}</dd></div>
                      }
                    </dl>
                    @for (c of warnings(); track c.code) { <p class="yt-warn">⚠ {{ c.message }}</p> }
                    @if (route() === 'phone') {
                      <p class="yt-muted">Nothing goes to YouTube from here. The video goes to Google Drive; these details are put on
                        the Short once you upload it from the YouTube app.</p>
                    } @else if (privacy() === 'public') {
                      <p class="yt-warn">This goes live publicly as soon as YouTube finishes processing it.</p>
                    } @else if (scheduled() && scheduleDate(); as at) {
                      <p class="yt-muted">Uploads as private now. YouTube makes it public on {{ when(at) }} ({{ timeZone }}).</p>
                    }
                  </section>

                  <section class="yt-card yt-review-card yt-review-words" aria-labelledby="yt-review-what">
                    <span class="yt-label" id="yt-review-what">What viewers see</span>
                    <div class="yt-review-title">{{ title().trim() }}</div>
                    <div class="yt-review-block">
                      <span class="yt-review-key">Description</span>
                      <pre>{{ finalDescription() || '—' }}</pre>
                    </div>
                    <div class="yt-review-block">
                      <span class="yt-review-key">Tags ({{ tags().length }})</span>
                      @if (tags().length) {
                        <div class="yt-review-tags">@for (t of tags(); track t) { <span>{{ t }}</span> }</div>
                      } @else { <span class="yt-muted">—</span> }
                    </div>
                    @if (firstComment().trim()) {
                      <div class="yt-review-block">
                        <span class="yt-review-key">First comment</span>
                        <pre>{{ firstComment().trim() }}</pre>
                      </div>
                    }
                  </section>
                </div>
              </div>
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
            @if (!isRelease()) {
              <!-- How it goes up: straight from here, or via the phone for a licensed Shorts sound. -->
              <div class="yt-dest yt-route" role="radiogroup" aria-label="Upload from">
                <button type="button" role="radio" class="yt-dest-opt" [class.active]="route() === 'direct'" [attr.aria-checked]="route() === 'direct'"
                        (click)="setRoute('direct')" [disabled]="uploading() || sendingToDrive()">
                  <span class="yt-dest-icon" aria-hidden="true">⇪</span>
                  <span><strong>Upload from here</strong><small>One click, straight to the channel</small></span>
                </button>
                <button type="button" role="radio" class="yt-dest-opt" [class.active]="route() === 'phone'" [attr.aria-checked]="route() === 'phone'"
                        (click)="setRoute('phone')" [disabled]="uploading() || sendingToDrive()">
                  <span class="yt-dest-icon" aria-hidden="true">📱</span>
                  <span><strong>From my phone</strong><small>Add a Shorts sound in the YouTube app - no copyright claim</small></span>
                </button>
              </div>
              @if (route() === 'phone') {
                <section class="yt-card yt-phone" aria-label="Send to phone">
                  <p class="yt-dest-note">
                    <strong>How it works.</strong> AnimStudio puts the video in your Google Drive. On your phone, upload it as a
                    Short from the YouTube app and add a song with <em>Add sound</em> - a song added there is licensed for Shorts,
                    so it isn't claimed. Leave the title as anything: as soon as the Short appears on the channel, AnimStudio puts
                    the title, description, tags and settings below on it.
                  </p>
                  @if (drive(); as dr) {
                    @if (!dr.connected) {
                      <div class="yt-phone-row">
                        <span>Google Drive isn't connected. AnimStudio only gets access to the files it adds, not the rest of your Drive.</span>
                        <span class="yt-phone-actions">
                          <button type="button" (click)="connectDrive(false)" [disabled]="busy()">Connect my Google Drive</button>
                          @if (selectedChannel(); as ch) {
                            <button type="button" class="link" (click)="connectDrive(true)" [disabled]="busy()">or a Drive just for {{ ch.channelTitle }}</button>
                          }
                        </span>
                      </div>
                    } @else {
                      <div class="yt-phone-row">
                        <span>☁ <strong>{{ dr.accountName || 'Google Drive' }}</strong>{{ dr.accountEmail ? ' · ' + dr.accountEmail : '' }}
                          @if (dr.channelId) {
                            <small class="yt-muted"> - {{ dr.ownDrive ? 'the Drive just for ' + dr.channelTitle : 'your Drive, in the folder for ' + dr.channelTitle }}</small>
                          }
                          @if (dr.needsReconnect) { <span class="yt-err-inline"> - access expired</span> }</span>
                        <span class="yt-phone-actions">
                          @if (dr.needsReconnect) {
                            <button type="button" (click)="connectDrive(!!dr.ownDrive)" [disabled]="busy()">Reconnect</button>
                          } @else {
                            @if (dr.channelId && !dr.ownDrive) {
                              <button type="button" class="link" (click)="connectDrive(true)" [disabled]="busy()">Use a separate Drive for {{ dr.channelTitle }}</button>
                            }
                            <button type="button" class="link" (click)="disconnectDrive()" [disabled]="busy() || sendingToDrive()">Disconnect</button>
                          }
                        </span>
                      </div>
                      <label class="yt-phone-field">
                        <span class="yt-label">Drive folder <small class="yt-muted">- pick one AnimStudio made, or type a new name</small></span>
                        <input type="text" maxlength="100" list="yt-drive-folders" [ngModel]="folderName()" (ngModelChange)="folderName.set($event)"
                               [disabled]="sendingToDrive()" [class.invalid]="fieldError('folderName')" [placeholder]="dr.folderName" />
                        <datalist id="yt-drive-folders">
                          @for (f of driveFolders(); track f) { <option [value]="f"></option> }
                        </datalist>
                      </label>
                      @if (folderName().trim() !== dr.folderName && !fieldError('folderName')) {
                        <button type="button" class="link" (click)="saveDefaultFolder()" [disabled]="busy()">Use "{{ folderName().trim() }}" every time{{ dr.channelId ? ' for ' + dr.channelTitle : '' }}</button>
                      }
                      <app-topic-picker label="Topic (optional - files the copy in the Drive library)" [(value)]="topicId" [disabled]="savingCopy()" />
                      <div class="yt-phone-row">
                        <span class="yt-muted">Only want the file? Save a copy to Drive - nothing goes to YouTube.</span>
                        <button type="button" (click)="saveCopyToDrive()"
                                [disabled]="busy() || dr.needsReconnect || savingCopy() || !folderNameValid()">Save a copy to Drive</button>
                      </div>
                      @if (driveCopy(); as c) {
                        @switch (c.state) {
                          @case ('Sending') {
                            <div class="bar"><div [style.width.%]="c.percent"></div></div>
                            <p class="yt-muted">Saving to Google Drive… {{ c.percent }}% - you can close this window; it carries on.</p>
                          }
                          @case ('Saved') {
                            <p class="ok">✓ Saved: <strong>{{ c.folderName }}</strong> / {{ c.fileName }}
                              @if (c.driveUrl) { · <a [href]="c.driveUrl" target="_blank" rel="noopener noreferrer">Open in Drive ↗</a> }</p>
                          }
                          @case ('Failed') { <p class="yt-err">{{ c.error }}</p> }
                          @case ('Cancelled') { <p class="yt-muted">{{ c.error || 'Stopped.' }}</p> }
                        }
                      }
                    }
                  } @else {
                    <p class="yt-muted">Checking Google Drive…</p>
                  }
                  <label class="yt-check">
                    <input type="checkbox" [ngModel]="muteAudio()" (ngModelChange)="muteAudio.set($event)" [disabled]="sendingToDrive()" />
                    <span>Take out the video's own sound, so the Shorts sound replaces it
                      <small>Leave this off to keep a voice-over; you can still lower it under <em>Volume</em> in the YouTube app.</small></span>
                  </label>
                  @if (draft(); as d) {
                    @if (!d.video.isVertical || (d.video.durationSeconds ?? 0) > 180) {
                      <p class="yt-warn">⚠ Shorts sounds are only offered for vertical videos up to 3 minutes. This one would go up as an ordinary video.</p>
                    }
                  }
                  <p class="yt-muted">The thumbnail and "notify subscribers" are set in the YouTube app for a phone upload.</p>
                </section>
              }
            }
            <div class="yt-grid">
              <!-- Left: what is being published, where, and how. -->
              <aside class="yt-side">
                <div class="yt-stage" [class.vertical]="draft()?.video?.isVertical">
                  <video #player [src]="previewSrc()" controls playsinline preload="metadata"></video>
                </div>
                @if (draft(); as d) {
                  <dl class="yt-facts">
                    @if (d.video.durationSeconds != null) { <div><dt>Length</dt><dd>{{ clock(d.video.durationSeconds) }}</dd></div> }
                    @if (d.video.width && d.video.height) { <div><dt>Picture</dt><dd>{{ d.video.width }}×{{ d.video.height }}</dd></div> }
                    @if (d.video.sizeBytes) { <div><dt>Size</dt><dd>{{ d.video.sizeBytes / 1048576 | number: '1.0-1' }} MB</dd></div> }
                    <div><dt>Type</dt><dd>{{ d.video.isVertical && (d.video.durationSeconds ?? 0) <= 180 ? 'Short' : 'Video' }}</dd></div>
                  </dl>
                }
                <!-- Thumbnail: YouTube's own pick, a frame of this video, or a picture of the user's. -->
                <section class="yt-card yt-thumb" aria-labelledby="yt-thumb-label">
                  <div class="yt-thumb-head">
                    <span class="yt-label" id="yt-thumb-label">Thumbnail</span>
                    <div class="yt-seg" role="radiogroup" aria-label="Thumbnail source">
                      @for (m of thumbModes; track m.id) {
                        <button type="button" role="radio" [class.on]="thumbMode() === m.id" [attr.aria-checked]="thumbMode() === m.id"
                                [disabled]="uploading()" (click)="setThumbMode(m.id)" [title]="m.hint">{{ m.label }}</button>
                      }
                    </div>
                  </div>
                  <div class="yt-thumb-preview" [class.empty]="!thumbPreview()"
                       [class.vertical]="draft()?.video?.isVertical && (thumbMode() === 'auto' || thumbMode() === 'frame')"
                       (dragover)="onThumbDragOver($event)" (dragleave)="thumbDragOver.set(false)" (drop)="onThumbDrop($event)"
                       [class.over]="thumbDragOver()">
                    @if (thumbPreview(); as src) {
                      <img [src]="src" alt="Chosen thumbnail" />
                      @if (thumbMode() === 'frame' && thumbFrameAt() !== null) { <span class="yt-thumb-badge">Frame at {{ clock(thumbFrameAt()!) }}</span> }
                      @if (thumbMode() === 'upload') { <span class="yt-thumb-badge">Your picture</span> }
                      @if (thumbMode() === 'library' && libPicked(); as p) { <span class="yt-thumb-badge" [title]="p.name">♻️ {{ p.name }}</span> }
                    } @else if (thumbMode() === 'auto') {
                      <span>YouTube picks a frame on its own.<br />Drop a picture here to use your own instead.</span>
                    } @else if (thumbMode() === 'frame') {
                      <span>{{ grabbing() ? 'Taking frames…' : 'Pick a frame below, or pause the video and use that frame.' }}</span>
                    } @else if (thumbMode() === 'library') {
                      <span>{{ libPicking() ? 'Loading picture…' : 'Pick a picture below - from this project or another one.' }}</span>
                    } @else {
                      <span>Drop a JPG or PNG here, or choose one below.</span>
                    }
                  </div>
                  @if (thumbMode() === 'frame') {
                    <div class="yt-frames" [class.vertical]="draft()?.video?.isVertical" role="listbox" aria-label="Frames from the video">
                      @for (f of frames(); track f.at) {
                        <button type="button" role="option" class="yt-frame" [class.on]="thumbFrameAt() === f.at" [attr.aria-selected]="thumbFrameAt() === f.at"
                                [disabled]="uploading() || !f.url" (click)="pickFrame(f.at)" [attr.aria-label]="'Frame at ' + clock(f.at)">
                          @if (f.url) { <img [src]="f.url" alt="" /> } @else { <span class="yt-frame-wait" [class.failed]="f.failed">{{ f.failed ? '✕' : '' }}</span> }
                          <span class="yt-frame-time">{{ clock(f.at) }}</span>
                        </button>
                      }
                    </div>
                    <div class="yt-links">
                      <button type="button" class="link" (click)="useCurrentFrame()" [disabled]="uploading() || grabbing()"
                              title="Pause the video where you like it, then use that exact frame">📸 Use the paused frame</button>
                      <button type="button" class="link" (click)="loadFrames(true)" [disabled]="uploading() || grabbing()" title="Show other moments">🔄 Other moments</button>
                    </div>
                  } @else if (thumbMode() === 'library') {
                    <div class="yt-lib">
                      <div class="yt-lib-tools">
                        <div class="yt-seg yt-seg-sm" role="radiogroup" aria-label="Where to look">
                          <button type="button" role="radio" [class.on]="libScope() === 'project'" [attr.aria-checked]="libScope() === 'project'"
                                  (click)="setLibScope('project')" [disabled]="uploading()">This project</button>
                          <button type="button" role="radio" [class.on]="libScope() === 'other'" [attr.aria-checked]="libScope() === 'other'"
                                  (click)="setLibScope('other')" [disabled]="uploading()">♻️ Other projects</button>
                        </div>
                        <input type="search" class="yt-lib-search" [ngModel]="libQuery()" (ngModelChange)="setLibQuery($event)"
                               maxlength="80" placeholder="Search pictures…" aria-label="Search pictures" />
                        @if (libItems().length) { <span class="yt-lib-count">{{ libItems().length }} picture{{ libItems().length === 1 ? '' : 's' }}</span> }
                      </div>
                      <div class="yt-lib-grid" role="listbox" aria-label="Pictures">
                        @for (a of libItems(); track a.id) {
                          <button type="button" role="option" class="yt-lib-item" [class.on]="libPicked()?.id === a.id"
                                  [attr.aria-selected]="libPicked()?.id === a.id" [disabled]="uploading() || libPicking() === a.id"
                                  (click)="pickLibrary(a)" [title]="a.name + (a.from ? ' · ' + a.from : '')">
                            <img [src]="libThumb(a.id)" alt="" loading="lazy" decoding="async" />
                            @if (libPicking() === a.id) { <span class="yt-frame-wait"></span> }
                            @if (libPicked()?.id === a.id) { <span class="yt-lib-check" aria-hidden="true">✓</span> }
                            <span class="yt-lib-name">{{ a.name }}@if (a.from) {<small>{{ a.from }}</small>}</span>
                          </button>
                        } @empty {
                          <p class="yt-muted yt-lib-none">
                            @if (libLoading()) { Looking… }
                            @else if (!libProjectId()) { The library isn't available here. Use Upload instead. }
                            @else if (libQuery()) { No picture matches “{{ libQuery() }}”. }
                            @else if (libScope() === 'project') { This project has no pictures yet. Try Other projects. }
                            @else { No pictures in your other projects. }
                          </p>
                        }
                      </div>
                    </div>
                  } @else if (thumbMode() === 'upload') {
                    <input #thumbFile type="file" class="yt-sr" accept="image/jpeg,image/png" tabindex="-1" aria-hidden="true"
                           (change)="onThumbFile(thumbFile)" />
                    <button type="button" class="secondary yt-thumb-choose" (click)="thumbFile.click()" [disabled]="uploading()">
                      {{ thumbImage() ? '🔁 Replace picture' : '⬆ Choose a picture' }}</button>
                    <p class="yt-muted">JPG or PNG. 1280×720 (16:9) looks best; bigger photos are shrunk for you.</p>
                  }
                  @if (thumbError()) { <p class="yt-err">{{ thumbError() }}</p> }
                  @if (thumbMode() !== 'auto') {
                    <p class="yt-muted">Custom thumbnails need a verified YouTube channel.
                      @if (draft()?.video?.isVertical) { Shorts show it on the channel page and in search, not in the Shorts feed. }</p>
                  }
                </section>

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
                      <select [ngModel]="visibility()" (ngModelChange)="setVisibility($event)" [disabled]="uploading()">
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                        <option value="scheduled" [disabled]="route() === 'phone'">Scheduled</option>
                      </select>
                    </label>
                  </div>
                  @if (route() === 'phone') {
                    <p class="yt-muted">Scheduled is not available for a phone upload; set a time in the YouTube app instead.</p>
                  } @else if (scheduled()) {
                    <label class="yt-schedule">Goes public at
                      <input type="datetime-local" [ngModel]="publishAtLocal()" (ngModelChange)="publishAtLocal.set($event)"
                             [min]="scheduleMin()" [max]="scheduleMax()" [class.invalid]="fieldError('publishAt')" [disabled]="uploading()" />
                      <small class="yt-muted">Your time ({{ timeZone }}). Uploads as private now; YouTube makes it public then.</small>
                    </label>
                    @if (scheduleProblem(); as p) { <p class="yt-err">{{ p }}</p> }
                  }
                  @if (route() !== 'phone' && planOptions().length) {
                    <label class="yt-plan">Calendar post
                      <select [ngModel]="selectedPlan()?.id ?? ''" (ngModelChange)="choosePlan($event)" [disabled]="uploading()">
                        <option value="">None</option>
                        @for (p of planOptions(); track p.id) {
                          <option [value]="p.id">{{ when(p.publishAt) }} · {{ p.title }}{{ planTopic(p) ? ' (' + planTopic(p)!.name + ')' : '' }}</option>
                        }
                      </select>
                    </label>
                    @if (selectedPlan(); as post) {
                      <p class="yt-muted"><span class="yt-plan-dot" [style.background]="planTopic(post)?.color ?? null" aria-hidden="true"></span>
                        {{ planTopic(post)?.name ?? 'No topic' }} · planned for {{ when(post.publishAt) }}. The video is linked to this post once it is up.</p>
                    }
                  }
                  <fieldset class="yt-audience" [disabled]="uploading()">
                    <legend>Audience</legend>
                    <label class="inline"><input type="radio" name="kids" [checked]="madeForKids() === false" (change)="madeForKids.set(false)" /> Not made for kids</label>
                    <label class="inline"><input type="radio" name="kids" [checked]="madeForKids() === true" (change)="madeForKids.set(true)" /> Made for kids</label>
                  </fieldset>
                  <label class="inline"><input type="checkbox" [ngModel]="notify()" (ngModelChange)="notify.set($event)" [disabled]="uploading()" /> Notify subscribers</label>
                  @if (visibility() === 'private') {
                    <p class="yt-muted">Private works as a draft: only you can see it until you change its visibility in YouTube Studio,
                      where you can also add an end screen and playlists.</p>
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

                <!-- Two columns on very wide screens; one column (display: contents) everywhere else. -->
                <div class="yt-form-cols">
                <div class="yt-col">
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
                  @if (pinnedCommentIdea() || engagementCommentIdea()) {
                    <div class="yt-ideas" role="group" aria-label="AI Comment Suggestions">
                      <span class="yt-ideas-label">Comment ideas</span>
                      @if (pinnedCommentIdea(); as pc) {
                        <button type="button" class="yt-chip" [class.active]="firstComment() === pc" (click)="firstComment.set(pc)" [disabled]="uploading()" [title]="pc">
                          📌 Use Pinned Comment
                        </button>
                      }
                      @if (engagementCommentIdea(); as ec) {
                        <button type="button" class="yt-chip" [class.active]="firstComment() === ec" (click)="firstComment.set(ec)" [disabled]="uploading()" [title]="ec">
                          💬 Use Engagement Question
                        </button>
                      }
                    </div>
                  }
                  @if (firstComment().trim() && selectedChannel(); as ch) {
                    @if (!ch.canComment) {
                      <p class="yt-warn">{{ ch.channelTitle }} was connected before AnimStudio could post comments.
                        <button type="button" class="link" (click)="connect()" [disabled]="busy()">Reconnect it</button> or leave this empty.</p>
                    } @else if (privacy() === 'private' || madeForKids()) {
                      <p class="yt-muted">Not posted on {{ madeForKids() ? 'videos made for kids' : 'private videos' }} - YouTube has comments off there.</p>
                    }
                  }
                </section>

                </div>
                <div class="yt-col">
                <!-- Related videos: the user's own uploads from AnimStudio, linked at the end of the description. -->
                <section class="yt-field yt-related">
                  <div class="yt-field-head">
                    <span class="yt-label">Related videos <span class="yt-muted">(linked at the end of the description, in this order)</span></span>
                    <span class="yt-count">{{ relatedSelected().length }} / {{ maxRelated }}</span>
                  </div>
                  @if (relatedSelected().length) {
                    <ol class="yt-rel-chosen" aria-label="Chosen related videos">
                      @for (v of relatedSelected(); track v.videoId; let i = $index, first = $first, last = $last) {
                        <li class="yt-rel-row chosen">
                          <span class="yt-rel-num" aria-hidden="true">{{ i + 1 }}</span>
                          <img class="yt-rel-thumb" [src]="videoThumb(v)" alt="" loading="lazy" referrerpolicy="no-referrer" />
                          <span class="yt-rel-text"><strong [title]="v.title">{{ v.title }}</strong>
                            <small>{{ v.channelTitle }} · {{ ago(v.publishedAt) }}</small></span>
                          <span class="yt-rel-actions">
                            <button type="button" class="yt-icon" [disabled]="uploading() || first" (click)="moveRelated(v.videoId, -1)" [attr.aria-label]="'Move up: ' + v.title" title="Move up">↑</button>
                            <button type="button" class="yt-icon" [disabled]="uploading() || last" (click)="moveRelated(v.videoId, 1)" [attr.aria-label]="'Move down: ' + v.title" title="Move down">↓</button>
                            <button type="button" class="yt-icon danger" [disabled]="uploading()" (click)="removeRelated(v.videoId)" [attr.aria-label]="'Remove: ' + v.title" title="Remove">✕</button>
                          </span>
                        </li>
                      }
                    </ol>
                  }
                  @if (videosAvailable().length === 0) {
                    <p class="yt-muted">Videos you publish from AnimStudio will appear here to link.</p>
                  } @else {
                    <div class="yt-rel-picker">
                      <div class="yt-rel-tools">
                        <input type="search" [ngModel]="relatedQuery()" (ngModelChange)="relatedQuery.set($event)" [disabled]="uploading()"
                               [placeholder]="'Search your ' + videosAvailable().length + ' videos…'" aria-label="Search your videos" />
                        @if (selectedChannel(); as ch) {
                          <label class="inline yt-rel-only" [title]="'Only show videos on ' + ch.channelTitle">
                            <input type="checkbox" [ngModel]="relatedSameChannel()" (ngModelChange)="relatedSameChannel.set($event)" [disabled]="uploading()" />
                            This channel only</label>
                        }
                      </div>
                      @let full = relatedSelected().length >= maxRelated;
                      @if (full) { <p class="yt-muted">That's the most YouTube descriptions take nicely ({{ maxRelated }}). Remove one to add another.</p> }
                      <ul class="yt-rel-list" aria-label="Your videos">
                        @for (v of relatedOptions(); track v.videoId) {
                          <li>
                            <button type="button" class="yt-rel-row" [disabled]="uploading() || full" (click)="addRelated(v.videoId)"
                                    [attr.aria-label]="'Link: ' + v.title">
                              <img class="yt-rel-thumb" [src]="videoThumb(v)" alt="" loading="lazy" referrerpolicy="no-referrer" />
                              <span class="yt-rel-text"><strong [title]="v.title">{{ v.title }}</strong>
                                <small>{{ v.channelTitle }} · {{ ago(v.publishedAt) }}{{ v.health === 'Issue' ? ' · ⚠ has an issue' : '' }}</small></span>
                              <span class="yt-rel-add" aria-hidden="true">＋</span>
                            </button>
                          </li>
                        } @empty {
                          <li class="yt-muted yt-rel-none">{{ relatedQuery().trim() ? 'No video matches "' + relatedQuery().trim() + '".' : 'Every video here is already linked.' }}</li>
                        }
                      </ul>
                    </div>
                  }
                </section>
                </div>
                </div>
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
              @if (route() === 'phone' && handoff(); as h) {
                @switch (h.state) {
                  @case ('Sending') {
                    <div class="bar"><div [style.width.%]="h.percent"></div></div>
                    <p class="yt-muted">Copying to Google Drive{{ h.muted ? ' (without its sound)' : '' }}…
                      {{ h.bytesSent / 1048576 | number: '1.0-1' }} / {{ h.totalBytes / 1048576 | number: '1.0-1' }} MB ({{ h.percent }}%)
                      - you can close this window; it carries on.</p>
                  }
                  @case ('WaitingForPhone') {
                    <p class="ok">✓ In your Google Drive: <strong>{{ h.folderName }}</strong> / {{ h.fileName }}
                      @if (h.driveUrl) { · <a [href]="h.driveUrl" target="_blank" rel="noopener noreferrer">Open in Drive ↗</a> }</p>
                    <ol class="yt-steps">
                      <li>On your phone, open the <strong>YouTube</strong> app on <strong>{{ h.channelTitle }}</strong> and tap <strong>＋ → Create a Short</strong>.</li>
                      <li>Tap the gallery, open <strong>Drive</strong> (or Files → Google Drive) and pick <strong>{{ h.fileName }}</strong>.</li>
                      <li>Tap <strong>Add sound</strong>, choose the song{{ h.muted ? '' : ', and lower the video\\'s own sound under Volume if you like' }}.</li>
                      <li>Tap <strong>Next → Upload</strong>. Any title will do.</li>
                    </ol>
                    <p class="yt-muted">AnimStudio checks the channel every minute and puts these details on the Short by itself.
                      @if (h.lastCheckedAt) { Last checked {{ ago(h.lastCheckedAt) === 'today' ? timeOf(h.lastCheckedAt) : ago(h.lastCheckedAt) }}. }</p>
                  }
                  @case ('Applied') {
                    <p class="ok">✓ Details applied to your Short on {{ h.channelTitle }}.
                      @if (h.videoUrl) { <a [href]="h.videoUrl" target="_blank" rel="noopener noreferrer">Watch ↗</a> · }
                      @if (h.studioUrl) { <a [href]="h.studioUrl" target="_blank" rel="noopener noreferrer">Open in YouTube Studio ↗</a> }</p>
                    @if (h.commentPosted) { <p class="yt-muted">💬 First comment posted.</p> }
                  }
                  @case ('Expired') {
                    <p class="yt-warn">No matching Short turned up in time. If you did upload it, pick it below to apply the details.</p>
                  }
                  @case ('Failed') { <p class="yt-err">{{ h.error }}</p> }
                  @case ('Cancelled') { <p class="yt-muted">{{ h.error || 'Stopped. Nothing was changed on YouTube.' }}</p> }
                }
                @if (h.warning) { <p class="yt-warn">⚠ {{ h.warning }}</p> }
                @if (candidates(); as list) {
                  @if (h.state === 'WaitingForPhone' || h.state === 'Expired') {
                    @if (list.length) {
                      <p class="yt-muted">{{ someLikely() ?'More than one new video could be it - pick yours:' : 'New videos on the channel - pick the one you uploaded:' }}</p>
                      <ul class="yt-rel-list yt-candidates" aria-label="New videos on the channel">
                        @for (c of list; track c.videoId) {
                          <li>
                            <button type="button" class="yt-rel-row" [disabled]="busy()" (click)="applyHandoff(c)" [attr.aria-label]="'Apply the details to ' + c.title">
                              <img class="yt-rel-thumb" [src]="c.thumbnailUrl || 'https://i.ytimg.com/vi/' + c.videoId + '/mqdefault.jpg'" alt="" loading="lazy" referrerpolicy="no-referrer" />
                              <span class="yt-rel-text"><strong [title]="c.title">{{ c.title || '(no title)' }}</strong>
                                <small>{{ c.publishedAt ? timeOf(c.publishedAt) : '' }}{{ c.durationSeconds != null ? ' · ' + clock(c.durationSeconds) : '' }}{{ c.likely ? ' · ✓ same length' : '' }}</small></span>
                              <span class="yt-rel-add" aria-hidden="true">Use</span>
                            </button>
                          </li>
                        }
                      </ul>
                    } @else {
                      <p class="yt-muted">No new video on {{ h.channelTitle }} yet. YouTube can take a minute to list a fresh upload.</p>
                    }
                  }
                }
              } @else if (upload(); as u) {
                @switch (u.state) {
                  @case ('Completed') {
                    <p class="ok">@if (u.publishAt) { ✓ Uploaded to {{ u.channelTitle }} as private - goes public {{ when(u.publishAt) }} ({{ timeZone }}). }
                      @else { ✓ Published to {{ u.channelTitle }} ({{ u.privacy }}). }
                      <a [href]="u.videoUrl" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a> ·
                      @if (u.musicUrl) { <a [href]="u.musicUrl" target="_blank" rel="noopener noreferrer">Play on YouTube Music ↗</a> · }
                      <a [href]="u.studioUrl" target="_blank" rel="noopener noreferrer">Open in YouTube Studio ↗</a></p>
                    @if (u.musicUrl) {
                      <p class="yt-muted">Both links open the same video. YouTube Music may take a while to list it under the channel.</p>
                    }
                    <p class="yt-muted">YouTube may still be processing HD versions for a few minutes.
                      @if (u.privacy === 'private' && !u.publishAt) { Finish the details and publish it from YouTube Studio. }</p>
                    @if (u.linkedPlanItemId) {
                      <p class="yt-muted">📅 Linked to calendar post{{ linkedPlan() ? ' "' + linkedPlan()!.title + '"' : '' }}.
                        <a routerLink="/calendar" [queryParams]="{ post: u.linkedPlanItemId }" (click)="closed.emit()">Open in calendar</a></p>
                    }
                    @if (u.commentId) { <p class="yt-muted">💬 First comment posted. Pin it from YouTube Studio if you want it on top.</p> }
                    @if (u.thumbnailSet) { <p class="yt-muted">🖼 Custom thumbnail set.</p> }
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
                  {{ busy() ? 'Starting…' : route() === 'phone' ? 'Confirm & send to Drive' : scheduled() ? 'Confirm & schedule' : privacy() === 'private' ? 'Confirm & upload as draft' : 'Confirm & upload' }}
                </button>
              } @else if (route() === 'phone' && handoff() && sendingToDrive()) {
                <button type="button" class="secondary" (click)="cancelHandoff()">Stop copying</button>
                <button type="button" (click)="closed.emit()">Close</button>
              } @else if (route() === 'phone' && (handoff()?.state === 'WaitingForPhone' || handoff()?.state === 'Expired')) {
                @if (handoff()?.state === 'WaitingForPhone') {
                  <button type="button" class="secondary" (click)="cancelHandoff()" [disabled]="busy()" title="Stop looking for the phone upload">Stop waiting</button>
                }
                <button type="button" class="secondary" (click)="checkHandoff()" [disabled]="busy()">{{ checking() ? 'Checking…' : '🔄 Check now' }}</button>
                <button type="button" (click)="closed.emit()">Close</button>
              } @else if (uploading()) {
                <button type="button" class="secondary" (click)="cancelUpload()">Cancel upload</button>
                <button type="button" (click)="closed.emit()">Close</button>
              } @else {
                <button type="button" class="secondary" (click)="closed.emit()">{{ upload()?.state === 'Completed' ? 'Close' : 'Cancel' }}</button>
                <button type="button" (click)="review()" [disabled]="!canPublish()">
                  @if (route() === 'phone') { {{ handoff()?.state === 'Applied' ? 'Send another to phone…' : 'Review & send to phone…' }} }
                  @else { {{ upload()?.state === 'Completed' ? 'Publish again…' : scheduled() ? 'Review & schedule…' : privacy() === 'private' ? 'Review & upload as draft…' : 'Review & publish…' }} }
                </button>
              }
            </div>
          </footer>
        }
      </div>
    </div>
  `,
  styles: [`
    .yt-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(3, 6, 14, 0.82); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .yt-dialog {
      background: linear-gradient(180deg, rgba(19, 24, 38, 0.98) 0%, rgba(11, 15, 25, 0.99) 100%);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 16px; width: min(1240px, 100%); height: calc(100vh - 32px); max-height: 980px;
      display: flex; flex-direction: column; overflow: hidden;
      color: var(--text, #e2e8f0);
      box-shadow: 0 28px 80px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    }

    .yt-head {
      display: flex; justify-content: space-between; align-items: center; gap: 1rem;
      padding: .9rem 1.35rem; border-bottom: 1px solid rgba(148, 163, 184, .16);
      background: linear-gradient(180deg, rgba(255, 61, 61, 0.06), transparent); flex: none;
    }
    .yt-head h4 { margin: 0; font-size: 1.05rem; font-weight: 700; letter-spacing: -0.01em; display: flex; align-items: center; gap: .6rem; }
    .yt-logo {
      display: inline-grid; place-items: center; width: 1.75rem; height: 1.25rem; border-radius: 6px;
      background: linear-gradient(135deg, #ff4b4b, #dc2626); color: #fff; font-size: .65rem;
      box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
    }
    .yt-logo.music { border-radius: 50%; width: 1.4rem; height: 1.4rem; font-size: .8rem; }
    .yt-x {
      background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 8px; width: 30px; height: 30px; display: inline-grid; place-items: center;
      color: var(--muted); font-size: 0.95rem; cursor: pointer; transition: all 0.15s ease;
    }
    .yt-x:hover { color: #fff; background: rgba(255, 255, 255, 0.1); border-color: rgba(148, 163, 184, 0.3); }

    .yt-dest { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; margin-bottom: .85rem; }
    @media (max-width: 560px) { .yt-dest { grid-template-columns: 1fr; } }
    .yt-dest-opt {
      display: flex; align-items: center; gap: .75rem; text-align: left; padding: .7rem .9rem; border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, .18); background: rgba(19, 24, 38, .65); color: inherit; cursor: pointer;
      transition: all 0.16s ease;
    }
    .yt-dest-opt:hover:not(:disabled) { border-color: rgba(148, 163, 184, .4); background: rgba(25, 31, 48, .85); box-shadow: none; transform: translateY(-1px); }
    .yt-dest-opt:disabled { cursor: default; opacity: .55; }
    .yt-dest-opt.active {
      border-color: rgba(255, 61, 61, 0.65);
      background: linear-gradient(135deg, rgba(255, 61, 61, .14), rgba(255, 61, 61, .05));
      box-shadow: 0 4px 16px rgba(255, 61, 61, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      opacity: 1;
    }
    .yt-dest-opt span:last-child { display: grid; gap: .12rem; }
    .yt-dest-opt small { color: var(--muted, #94a3b8); font-size: .76rem; font-weight: 400; }
    .yt-dest-icon {
      display: inline-grid; place-items: center; flex: none; width: 2.1rem; height: 2.1rem; border-radius: 9px;
      background: linear-gradient(135deg, #ff4b4b, #dc2626); color: #fff; font-size: .85rem;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
    }
    .yt-dest-opt.music .yt-dest-icon { border-radius: 50%; font-size: 1rem; }
    .yt-dest-note {
      margin: 0 0 .9rem; padding: .65rem .9rem; border-radius: 10px; font-size: .84rem; line-height: 1.45;
      background: rgba(255, 61, 61, .07); border: 1px solid rgba(255, 61, 61, .22);
    }
    .yt-dest-note code { font-size: .8rem; }

    /* Send to phone */
    .yt-route .yt-dest-icon { font-size: 1rem; }
    .yt-phone { margin-bottom: .9rem; }
    /* Scheduled upload and calendar post */
    .yt-schedule, .yt-plan { display: flex; flex-direction: column; gap: .25rem; margin-top: .6rem; }
    .yt-schedule input.invalid { border-color: #f87171; }
    .yt-plan-dot { display: inline-block; width: .65rem; height: .65rem; border-radius: 50%; background: #64748b; vertical-align: middle; margin-right: .25rem; }
    .yt-phone .yt-dest-note { margin: 0; }
    .yt-phone-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap; font-size: .86rem; }
    .yt-phone-actions { display: inline-flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .yt-card label.yt-phone-field input { width: 100%; box-sizing: border-box; }
    .yt-phone-field input.invalid { border-color: #f87171; }
    .yt-card label.yt-check { display: flex; align-items: flex-start; gap: .5rem; color: inherit; font-size: .86rem; }
    .yt-check input { margin-top: .2rem; }
    .yt-check small { display: block; color: var(--muted, #94a3b8); font-size: .76rem; }
    .yt-err-inline { color: #fca5a5; }
    .yt-steps { margin: .1rem 0 .2rem; padding-left: 1.3rem; display: grid; gap: .15rem; font-size: .85rem; }
    .yt-candidates { max-height: 180px; }

    .yt-body { flex: 1 1 auto; overflow: auto; padding: 1.1rem 1.35rem; }
    .yt-foot {
      flex: none; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: .85rem 1.35rem; border-top: 1px solid rgba(148, 163, 184, .16);
      background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(10px);
    }
    .yt-foot-status { min-width: 0; flex: 1 1 auto; display: grid; gap: .25rem; }
    .yt-foot-status p { margin: 0; }
    .yt-foot-status { max-height: 40vh; overflow: auto; }
    .yt-actions { display: flex; gap: .55rem; flex: none; }

    .yt-grid { display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); gap: 1.4rem; align-items: start; }
    @media (max-width: 860px) { .yt-grid { grid-template-columns: 1fr; } }

    /* Left column */
    .yt-side { display: grid; gap: .8rem; align-content: start; }
    .yt-stage {
      background: #000; border-radius: 12px; overflow: hidden; display: grid; place-items: center;
      border: 1px solid rgba(148, 163, 184, 0.18); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    }
    .yt-stage video { display: block; width: 100%; max-height: 34vh; background: #000; }
    .yt-stage.vertical video { max-height: 44vh; }
    .yt-facts { display: flex; flex-wrap: wrap; gap: .35rem .8rem; margin: 0; font-size: .8rem; }
    .yt-facts div {
      display: inline-flex; gap: .35rem; padding: 3px 9px; border-radius: 999px;
      background: rgba(19, 24, 38, 0.75); border: 1px solid rgba(148, 163, 184, 0.14);
    }
    .yt-facts dt { color: var(--muted, #94a3b8); }
    .yt-facts dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 600; }
    .yt-checks { list-style: none; padding: 0; margin: 0; display: grid; gap: .3rem; font-size: .85rem; }
    .yt-checks .err { color: #fca5a5; }
    .yt-checks .warn { color: #fcd34d; }
    .yt-card {
      display: grid; gap: .55rem; padding: .85rem .95rem; border-radius: 12px;
      background: linear-gradient(180deg, rgba(25, 31, 48, 0.55), rgba(15, 19, 32, 0.72));
      border: 1px solid rgba(148, 163, 184, .15);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }
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
    /* Thumbnail picker */
    .yt-thumb-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
    .yt-seg { display: inline-flex; padding: 2px; border-radius: 999px; background: rgba(148, 163, 184, .1); border: 1px solid rgba(148, 163, 184, .18); }
    .yt-seg button { border: 0; background: transparent; color: var(--muted, #94a3b8); padding: .22rem .65rem; border-radius: 999px;
      font-size: .78rem; font-weight: 600; cursor: pointer; }
    .yt-seg button:hover:not(:disabled) { color: var(--text, #e2e8f0); box-shadow: none; }
    .yt-seg button.on { background: #ff3d3d; color: #fff; }
    .yt-thumb-preview { position: relative; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; background: #000;
      display: grid; place-items: center; border: 1px solid rgba(148, 163, 184, .18); transition: border-color .15s, box-shadow .15s; }
    .yt-thumb-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
    /* A Short's frame keeps its own shape; YouTube shows it upright on the channel page. */
    .yt-thumb-preview.vertical { aspect-ratio: 9 / 16; max-height: 300px; justify-self: center; width: auto; height: 300px; }
    .yt-frames.vertical { grid-template-columns: repeat(6, 1fr); }
    .yt-frames.vertical .yt-frame { aspect-ratio: 9 / 16; }
    .yt-thumb-preview.empty { background: repeating-linear-gradient(45deg, rgba(148, 163, 184, .06) 0 10px, transparent 10px 20px), #0b1220; }
    .yt-thumb-preview.empty span { padding: 0 1rem; text-align: center; font-size: .8rem; color: var(--muted, #94a3b8); line-height: 1.45; }
    .yt-thumb-preview.over { border-color: #ff3d3d; box-shadow: 0 0 0 3px rgba(255, 61, 61, .25); }
    .yt-thumb-badge { position: absolute; left: 6px; bottom: 6px; padding: .1rem .45rem; border-radius: 4px; font-size: .7rem;
      background: rgba(0, 0, 0, .72); color: #fff; }
    /* Tiles clip (overflow: hidden), which lets the grid shrink auto rows to nothing to fit a max-height,
       and the pictures end up stacked over each other. max-content rows keep each tile its full height. */
    .yt-frames { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: max-content; gap: .4rem; }
    .yt-frame { position: relative; padding: 0; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; cursor: pointer;
      border: 2px solid transparent; background: #0b1220; }
    .yt-frame:hover:not(:disabled) { border-color: rgba(255, 61, 61, .55); box-shadow: none; }
    .yt-frame.on { border-color: #ff3d3d; }
    .yt-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .yt-frame-wait { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted, #94a3b8);
      background: linear-gradient(90deg, #0b1220 25%, #1e293b 50%, #0b1220 75%); background-size: 200% 100%; animation: yt-shimmer 1.2s infinite; }
    .yt-frame-wait.failed { animation: none; background: #0b1220; }
    .yt-frame-time { position: absolute; right: 3px; bottom: 3px; padding: 0 .3rem; border-radius: 3px; font-size: .64rem;
      background: rgba(0, 0, 0, .7); color: #fff; font-variant-numeric: tabular-nums; }
    @keyframes yt-shimmer { to { background-position: -200% 0; } }
    .yt-thumb-choose { justify-self: start; }
    .yt-lib { display: grid; gap: .45rem; }
    .yt-lib-tools { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
    .yt-seg-sm button { padding: .18rem .55rem; font-size: .74rem; }
    .yt-lib-search { flex: 1 1 120px; min-width: 0; box-sizing: border-box; padding: .3rem .55rem; border-radius: 7px; font: inherit; font-size: .8rem;
      border: 1px solid rgba(148, 163, 184, .25); background: rgba(2, 6, 23, .55); color: inherit; }
    .yt-lib-search:focus { outline: none; border-color: #ff3d3d; box-shadow: 0 0 0 2px rgba(255, 61, 61, .2); }
    .yt-lib-count { flex: none; font-size: .72rem; color: var(--muted, #94a3b8); font-variant-numeric: tabular-nums; }
    .yt-lib-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); grid-auto-rows: max-content;
      align-content: start; gap: .45rem; max-height: 300px; overflow-y: auto; overflow-x: hidden; padding: 3px;
      border-radius: 8px; background: rgba(2, 6, 23, .35); scrollbar-width: thin; overscroll-behavior: contain; }
    .yt-lib-item { position: relative; padding: 0; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; cursor: pointer;
      border: 2px solid transparent; background: #0b1220; transition: border-color .12s, transform .12s; }
    .yt-lib-item:hover:not(:disabled) { border-color: rgba(255, 61, 61, .55); box-shadow: none; transform: translateY(-1px); }
    .yt-lib-item:focus-visible { outline: 2px solid #ff3d3d; outline-offset: 1px; }
    .yt-lib-item.on { border-color: #ff3d3d; box-shadow: 0 0 0 2px rgba(255, 61, 61, .3); }
    .yt-lib-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    /* Names only on hover / focus / the picked one, so the grid reads as pictures, not a wall of text. */
    .yt-lib-name { position: absolute; inset: auto 0 0 0; display: grid; padding: .6rem .35rem .2rem; text-align: left;
      font-size: .66rem; font-weight: 500; line-height: 1.25; color: #fff; background: linear-gradient(transparent, rgba(0, 0, 0, .88));
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; transition: opacity .12s; pointer-events: none; }
    .yt-lib-item:hover .yt-lib-name, .yt-lib-item:focus-visible .yt-lib-name, .yt-lib-item.on .yt-lib-name { opacity: 1; }
    @media (hover: none) { .yt-lib-name { opacity: 1; } }
    .yt-lib-name small { font-size: .6rem; opacity: .75; overflow: hidden; text-overflow: ellipsis; }
    .yt-lib-check { position: absolute; top: 4px; right: 4px; width: 1.15rem; height: 1.15rem; border-radius: 50%;
      display: grid; place-items: center; background: #ff3d3d; color: #fff; font-size: .68rem; font-weight: 700;
      box-shadow: 0 1px 4px rgba(0, 0, 0, .5); }
    .yt-lib-none { grid-column: 1 / -1; padding: .8rem .4rem; text-align: center; }
    .yt-thumb-badge { max-width: calc(100% - 12px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-sizing: border-box; }
    .yt-review-thumb { width: 220px; max-width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 6px; display: block; }
    .yt-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

    /* Related videos */
    .yt-rel-chosen { list-style: none; margin: 0; padding: 0; display: grid; gap: .3rem; }
    .yt-rel-picker { display: grid; gap: .4rem; border: 1px solid rgba(148, 163, 184, .15); border-radius: 10px; padding: .5rem; background: rgba(148, 163, 184, .04); }
    .yt-rel-tools { display: flex; gap: .6rem; align-items: center; }
    .yt-rel-tools input[type=search] { flex: 1; min-width: 0; box-sizing: border-box; padding: .45rem .7rem; border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, .25); background: rgba(2, 6, 23, .55); color: inherit; font: inherit; font-size: .85rem; }
    .yt-rel-tools input[type=search]:focus { outline: none; border-color: #6c8cff; box-shadow: 0 0 0 2px rgba(108, 140, 255, .25); }
    .yt-rel-only { display: flex; align-items: center; gap: .3rem; font-size: .8rem; white-space: nowrap; color: var(--muted, #94a3b8); }
    .yt-rel-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .2rem; max-height: 300px; overflow: auto; }
    .yt-rel-row { display: flex; align-items: center; gap: .6rem; width: 100%; padding: .3rem .45rem; border-radius: 8px; text-align: left;
      border: 1px solid transparent; background: transparent; color: inherit; cursor: pointer; font-weight: 400; }
    button.yt-rel-row:hover:not(:disabled) { background: rgba(108, 140, 255, .1); border-color: rgba(108, 140, 255, .3); box-shadow: none; }
    button.yt-rel-row:disabled { cursor: default; opacity: .5; }
    .yt-rel-row.chosen { background: rgba(108, 140, 255, .12); border-color: rgba(108, 140, 255, .28); cursor: default; }
    .yt-rel-num { flex: none; width: 1.3rem; text-align: center; font-size: .75rem; font-weight: 700; color: var(--muted, #94a3b8); }
    .yt-rel-thumb { flex: none; width: 96px; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 5px; background: #0b1220; }
    .yt-rel-text { min-width: 0; flex: 1; display: grid; gap: .1rem; }
    .yt-rel-text strong { font-size: .84rem; font-weight: 600; line-height: 1.3; overflow: hidden;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .yt-rel-text small { font-size: .74rem; color: var(--muted, #94a3b8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .yt-rel-add { flex: none; width: 1.7rem; height: 1.7rem; border-radius: 50%; display: grid; place-items: center;
      background: rgba(108, 140, 255, .2); color: #c7d2fe; font-weight: 700; }
    .yt-rel-actions { flex: none; display: flex; gap: .15rem; }
    .yt-icon { width: 1.75rem; height: 1.75rem; padding: 0; border-radius: 6px; border: 1px solid rgba(148, 163, 184, .2);
      background: transparent; color: inherit; cursor: pointer; font-size: .8rem; }
    .yt-icon:hover:not(:disabled) { background: rgba(148, 163, 184, .15); box-shadow: none; }
    .yt-icon:disabled { opacity: .35; cursor: default; }
    .yt-icon.danger:hover:not(:disabled) { background: rgba(239, 68, 68, .2); border-color: rgba(239, 68, 68, .45); }
    .yt-rel-none { padding: .6rem; text-align: center; }
    @media (max-width: 560px) { .yt-rel-thumb { width: 72px; } }
    @media (prefers-reduced-motion: reduce) { .yt-frame-wait { animation: none; } }

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

    /* Review: the video and its thumbnail on one side, where it goes and what viewers read on the
       other. One column on phones; the panes spread out as the screen widens. */
    .yt-review { max-width: 1180px; margin: 0 auto; display: grid; gap: .75rem; }
    .yt-review-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; align-items: start; }
    .yt-review-media { display: grid; gap: .65rem; align-content: start; min-width: 0; }
    .yt-review-main { display: grid; gap: .9rem; align-content: start; min-width: 0; }
    .yt-review-card { gap: .6rem; }
    .yt-review dl { display: grid; gap: .45rem; margin: 0; }
    .yt-review dl div { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: .75rem; }
    .yt-review dt { color: var(--muted, #94a3b8); font-size: .84rem; }
    .yt-review dd { margin: 0; overflow-wrap: anywhere; font-size: .9rem; }
    .yt-review .yt-facts { display: flex; gap: .3rem 1rem; }
    .yt-review .yt-facts div { display: flex; gap: .3rem; }
    .yt-review pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; font-size: .88rem; line-height: 1.5;
      max-height: 40vh; overflow: auto; background: rgba(2, 6, 23, .35); padding: .55rem .7rem; border-radius: 6px; }
    .yt-review-thumb-box { display: grid; gap: .35rem; }
    .yt-review-thumb { width: 100%; max-width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 6px; display: block; }
    .yt-review-thumb.vertical { aspect-ratio: 9 / 16; width: auto; max-height: 280px; justify-self: start; }
    .yt-review-title { font-size: 1.05rem; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere; }
    .yt-review-block { display: grid; gap: .3rem; min-width: 0; }
    .yt-review-key { font-size: .78rem; color: var(--muted, #94a3b8); font-weight: 600; }
    .yt-review-tags { display: flex; flex-wrap: wrap; gap: .3rem; }
    .yt-review-tags span { font-size: .78rem; padding: .12rem .55rem; border-radius: 999px; background: rgba(108, 140, 255, .16);
      overflow-wrap: anywhere; }
    .yt-review .yt-stage video { max-height: 46vh; }
    @media (min-width: 900px) {
      .yt-review-grid { grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); }
      .yt-review-media { position: sticky; top: 0; }
      .yt-review .yt-stage.vertical video { max-height: 52vh; }
    }
    @media (max-width: 560px) {
      .yt-review dl div { grid-template-columns: 1fr; gap: .1rem; }
      .yt-review .yt-stage.vertical video { max-height: 52vh; }
      .yt-review-thumb.vertical { max-height: 220px; }
    }

    /* Single column by default: the wrappers vanish and the sections sit in .yt-form's own grid. */
    .yt-form-cols, .yt-col { display: contents; }

    /* Wide and ultra-wide screens: use the room - a bigger dialog, a roomier left column, and the
       words split in two (title / description / tags / first comment | related videos). */
    @media (min-width: 1600px) {
      .yt-dialog { width: min(1560px, 100%); max-height: 1100px; }
      .yt-grid { grid-template-columns: minmax(340px, 420px) minmax(0, 1fr); gap: 1.75rem; }
      .yt-stage video { max-height: 38vh; }
      .yt-lib-grid { max-height: 340px; }
      .yt-review { max-width: 1480px; }
      .yt-review-grid { grid-template-columns: minmax(320px, 420px) minmax(0, 1fr); gap: 1.5rem; }
    }
    @media (min-width: 2000px) {
      .yt-dialog { width: min(2240px, calc(100vw - 96px)); max-height: 1240px; }
      .yt-body { padding: 1.25rem 1.75rem; }
      .yt-grid { grid-template-columns: minmax(420px, 540px) minmax(0, 1fr); }
      .yt-form-cols { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
      .yt-col { display: grid; gap: 1rem; align-content: start; min-width: 0; }
      .yt-field textarea { min-height: 300px; }
      .yt-rel-list { max-height: 460px; }
      .yt-lib-grid { max-height: 400px; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
      /* Review uses the whole width: video | where it goes | what viewers see. */
      .yt-review { max-width: none; }
      .yt-review-grid { grid-template-columns: minmax(400px, 520px) minmax(0, 1fr); gap: 1.75rem; }
      .yt-review-main { grid-template-columns: minmax(320px, .75fr) minmax(0, 1.5fr); gap: 1.25rem; align-items: start; }
      .yt-review pre { max-height: 62vh; }
      .yt-review-thumb.vertical { max-height: 360px; }
    }
    @media (min-width: 2000px) and (min-height: 1200px) {
      .yt-dialog { max-height: 1400px; }
      .yt-field textarea { min-height: 380px; }
    }
    /* 32:9 and wider (5120px+): don't stretch lines past reading width. */
    @media (min-width: 3200px) {
      .yt-dialog { width: min(2880px, calc(100vw - 160px)); }
      .yt-review-grid { grid-template-columns: minmax(480px, 640px) minmax(0, 1fr); }
    }

    /* Mobile browsers' toolbars eat into 100vh; dvh keeps the footer's buttons on screen. */
    .yt-dialog { height: calc(100dvh - 32px); }
    @media (max-width: 640px) {
      .yt-backdrop { padding: 0; }
      .yt-dialog { height: 100vh; height: 100dvh; max-height: none; border-radius: 0; border: 0; }
      .yt-head { padding: .7rem 1rem; }
      .yt-body { padding: .85rem 1rem; }
      .yt-foot { flex-direction: column; align-items: stretch; padding: .7rem 1rem max(.7rem, env(safe-area-inset-bottom)); }
      .yt-foot-status { max-height: 25vh; }
      .yt-actions { justify-content: stretch; }
      .yt-actions > * { flex: 1; min-height: 42px; }
      .yt-row { grid-template-columns: 1fr; }
      .yt-frames.vertical { grid-template-columns: repeat(3, 1fr); }
      .yt-thumb-preview.vertical { height: 240px; }
    }
  `],
})
export class YouTubePublishDialogComponent implements OnInit {
  private readonly api = inject(YouTubePublishService);
  private readonly activity = inject(ActivityService);
  private readonly calendar = inject(ContentCalendarService);
  readonly auth = inject(AuthService);

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
  /** Narrow the picker to videos on the channel this one is going to. */
  readonly relatedSameChannel = signal(false);

  // --- thumbnail ---

  readonly thumbModes = THUMB_MODES;
  readonly thumbMode = signal<ThumbMode>('auto');
  /** The picked frame's time; sent so the server grabs it again at full size. */
  readonly thumbFrameAt = signal<number | null>(null);
  /** The uploaded picture, as a data URL. */
  readonly thumbImage = signal<string | null>(null);
  readonly thumbError = signal<string | null>(null);
  readonly thumbDragOver = signal(false);
  readonly frames = signal<FrameOption[]>([]);
  readonly grabbing = signal(false);
  /** Object URLs of every frame fetched, keyed by time, revoked when the dialog closes. */
  private readonly frameUrls = new Map<number, string>();
  private frameRound = 0;
  private framesPending = 0;
  private readonly player = viewChild<ElementRef<HTMLVideoElement>>('player');

  // --- thumbnail from the library ---

  private readonly assets = inject(ApiService);
  /** Present inside a project (the editor provides it); the library needs a project to search from. */
  private readonly store = inject(ProjectStore, { optional: true });
  /** The project the library looks in; defaults to the open project. */
  readonly projectId = input<string | null>(null);
  readonly libProjectId = computed(() => this.projectId() ?? this.store?.project()?.id ?? null);
  readonly libScope = signal<LibScope>('project');
  readonly libQuery = signal('');
  /** This project's pictures, fetched once when the store isn't there to supply them. */
  private readonly ownImages = signal<LibItem[] | null>(null);
  private readonly otherImages = signal<LibItem[]>([]);
  readonly libLoading = signal(false);
  /** The id of the picture being fetched, so its tile shows it's working. */
  readonly libPicking = signal<string | null>(null);
  /** The chosen library picture: its data URL is what goes to YouTube. */
  readonly libPicked = signal<(LibItem & { dataUrl: string }) | null>(null);
  private readonly libSearch$ = new Subject<string>();

  readonly libItems = computed<LibItem[]>(() => {
    if (this.libScope() === 'other') return this.otherImages();
    const fromStore = this.store?.project()?.id === this.libProjectId()
      ? this.store?.imagesOnly().map((a) => ({ id: a.id, name: a.name, width: a.width, height: a.height }))
      : null;
    const list = fromStore ?? this.ownImages() ?? [];
    const q = this.libQuery().trim().toLowerCase();
    return q ? list.filter((a) => a.name.toLowerCase().includes(q)) : list;
  });

  readonly thumbPreview = computed(() => {
    const mode = this.thumbMode();
    if (mode === 'upload') return this.thumbImage();
    if (mode === 'library') return this.libPicked()?.dataUrl ?? null;
    const at = this.thumbFrameAt();
    if (mode !== 'frame' || at === null) return null;
    return this.frames().find((f) => f.at === at)?.url ?? this.frameUrls.get(at) ?? null;
  });
  /** What the publish request carries; null leaves YouTube to pick. */
  readonly thumbnailChoice = computed<YouTubeThumbnailChoice | null>(() => {
    const mode = this.thumbMode();
    if (mode === 'frame' && this.thumbFrameAt() !== null) return { frameAtSeconds: this.thumbFrameAt() };
    if (mode === 'upload' && this.thumbImage()) return { imageBase64: this.thumbImage() };
    if (mode === 'library' && this.libPicked()) return { imageBase64: this.libPicked()!.dataUrl };
    return null;
  });

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
  /** Private now, public at {@link publishAtLocal}: sent as privacy "private" plus publishAt. */
  readonly scheduled = signal(false);
  /** The datetime-local value, in the viewer's time zone. Never restored from an earlier publish. */
  readonly publishAtLocal = signal('');
  readonly visibility = computed<Visibility>(() => (this.scheduled() ? 'scheduled' : this.privacy()));
  readonly timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
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
  readonly pinnedCommentIdea = signal<string | null>(null);
  readonly engagementCommentIdea = signal<string | null>(null);
  /** Ideas not already among the tags. */
  readonly tagIdeasLeft = computed(() => {
    const have = new Set(this.tags().map((t) => t.toLowerCase()));
    return this.tagIdeas().filter((t) => !have.has(t.toLowerCase()));
  });

  private static readonly ToneLabels: Record<string, string> = {
    auto: '🎯 Any tone', 'devotional-omkr': '🕉️ OMKR 3D Devotional (Brand Rules)',
    funny: '😂 Funny', devotional: '🙏 Devotional', emotional: '🥹 Emotional',
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
  readonly privacyLabel = computed(() => {
    const at = this.scheduleDate();
    if (this.scheduled()) return at ? `Scheduled - goes public ${formatWhen(at)} (${this.timeZone})` : 'Scheduled';
    return ({ public: 'Public', unlisted: 'Unlisted', private: 'Private (draft)' })[this.privacy()];
  });

  // --- scheduled upload ---

  readonly scheduleDate = computed(() => (this.scheduled() ? fromLocalInput(this.publishAtLocal()) : null));
  /** Bounds for the picker; the real check is {@link scheduleProblem}, and the server checks again. */
  readonly scheduleMin = computed(() => (this.scheduled() ? toLocalInput(new Date(Date.now() + MIN_SCHEDULE_LEAD_MS)) : ''));
  readonly scheduleMax = computed(() => (this.scheduled() ? toLocalInput(new Date(Date.now() + MAX_SCHEDULE_AHEAD_MS)) : ''));
  readonly scheduleProblem = computed(() => (this.scheduled() ? this.checkSchedule(this.scheduleDate(), Date.now()) : null));

  // --- calendar post ---

  private readonly planTopics = signal<ContentTopic[]>([]);
  private readonly planItems = signal<ContentPlanItem[]>([]);
  readonly planItemId = signal<string | null>(null);
  private readonly topicsById = computed(() => new Map(this.planTopics().map((t) => [t.id, t] as const)));
  /** Upcoming posts still waiting for a video, on the chosen channel or on no channel yet. */
  readonly planOptions = computed(() => {
    const channel = this.channelId();
    const topics = this.topicsById();
    const now = Date.now();
    return this.planItems()
      .filter((p) => OPEN_PLAN_STATUSES.includes(p.status) && !p.videoId && Date.parse(p.publishAt) > now)
      .filter((p) => {
        const postChannel = p.channelId ?? topics.get(p.topicId)?.channelId ?? null;
        return !postChannel || postChannel === channel;
      })
      .sort((a, b) => Date.parse(a.publishAt) - Date.parse(b.publishAt));
  });
  /** Null once the post no longer fits (another channel picked), so it is never sent by mistake. */
  readonly selectedPlan = computed(() => this.planOptions().find((p) => p.id === this.planItemId()) ?? null);
  /** The post the finished upload was linked to, for the success message. */
  readonly linkedPlan = computed(() => {
    const id = this.upload()?.linkedPlanItemId;
    return id ? this.planItems().find((p) => p.id === id) ?? null : null;
  });
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
    // Every word must appear somewhere, so "shiv bhajan" finds "Shiv Shiv Shankara … Bhajan".
    const words = this.relatedQuery().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const channel = this.relatedSameChannel() ? this.channelId() : null;
    return this.videosAvailable().filter((v) => {
      if (chosen.has(v.videoId) || (channel && v.channelId !== channel)) return false;
      const hay = `${v.title} ${v.channelTitle}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
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
    if (this.route() === 'phone') {
      const drive = this.drive();
      if (!drive?.connected) list.push({ field: 'drive', code: 'drive-not-connected', message: 'Connect Google Drive to send the video to your phone.' });
      else if (drive.needsReconnect) list.push({ field: 'drive', code: 'drive-reconnect', message: 'Google Drive needs to be connected again.' });
      if (!isValidDriveFolderName(this.folderName().trim())) list.push({ field: 'folderName', code: 'drive-folder-invalid', message: 'Use a Drive folder name of letters, digits, spaces and - _ . ( ) &.' });
      // Putting the details on the phone upload needs the same permission as comments.
      if (this.selectedChannel() && !this.selectedChannel()!.canComment) list.push({ field: 'channelId', code: 'youtube-edit-scope', message: 'Reconnect the channel so AnimStudio can fill in the phone upload\'s details.' });
    }
    if (this.scheduled()) {
      if (this.route() === 'phone') list.push({ field: 'publishAt', code: 'schedule-not-on-phone', message: 'Scheduling is not available for a phone upload. Pick another visibility.' });
      else if (this.scheduleProblem()) list.push({ field: 'publishAt', code: 'schedule-invalid', message: this.scheduleProblem()! });
    }
    for (const e of this.serverErrors()) if (!list.some((x) => x.code === e.code)) list.push(e);
    return list;
  });

  readonly canPublish = computed(() => !this.busy() && !this.suggesting() && !this.uploading() && !this.sendingToDrive()
    && this.problems().length === 0);

  // --- send to phone ---

  /** Upload from here, or send to Drive for the YouTube app, where a Shorts sound is licensed. */
  readonly route = signal<YouTubeUploadRoute>('direct');
  readonly drive = signal<GoogleDriveStatus | null>(null);
  /** The Drive folder for this send; starts as the Drive's default. */
  readonly folderName = signal('');
  readonly topicId = signal<string | null>(null);
  readonly muteAudio = signal(false);
  readonly handoff = signal<PhoneHandoff | null>(null);
  /** The channel's new uploads from the last "Check now"; null until one has run. */
  readonly candidates = signal<PhoneUploadCandidate[] | null>(null);
  readonly checking = signal(false);
  readonly sendingToDrive = computed(() => this.handoff()?.state === 'Sending');
  /** Folders AnimStudio made on the Drive the chosen channel uses, for the folder picker. */
  readonly driveFolders = signal<string[]>([]);
  /** A plain "save a copy to Drive" of this render, apart from any phone send. */
  readonly driveCopy = signal<PhoneHandoff | null>(null);
  readonly savingCopy = computed(() => this.driveCopy()?.state === 'Sending');
  readonly folderNameValid = computed(() => isValidDriveFolderName(this.folderName().trim()));
  private copyPoll: ReturnType<typeof setTimeout> | null = null;

  /**
   * The Drive follows the channel picked: a channel can have a Drive of its own, and on the
   * personal Drive each channel has its own folder.
   */
  private readonly driveFollowsChannel = effect(() => {
    const channelId = this.channelId();
    if (this.loading() || this.isRelease()) return;
    untracked(() => this.refreshDrive(channelId || null));
  });
  readonly someLikely = computed(() => (this.candidates() ?? []).some((c) => c.likely));
  private handoffPoll: ReturnType<typeof setTimeout> | null = null;

  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopPolling();
      this.stopHandoffPoll();
      if (this.copyPoll !== null) clearTimeout(this.copyPoll);
      for (const url of this.frameUrls.values()) URL.revokeObjectURL(url);
    });
    // Other projects are searched on the server; a newer query cancels the one in flight.
    this.libSearch$.pipe(
      debounceTime(LIB_SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      tap(() => this.libLoading.set(true)),
      switchMap((q) => {
        const projectId = this.libProjectId();
        if (!projectId) return of([] as LibItem[]);
        return this.assets.searchReusableAssets(projectId, { q: q || undefined, scope: 'all', kind: 'image', sort: q ? 'relevance' : 'newest', limit: LIB_SEARCH_LIMIT }).pipe(
          map((r) => r.items.map((h) => ({ id: h.asset.id, name: h.asset.name, from: h.projectName, width: h.asset.width, height: h.asset.height }))),
          catchError(() => {
            this.thumbError.set("Your other projects couldn't be searched just now. Try again.");
            return of([] as LibItem[]);
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe((items) => {
      this.otherImages.set(items);
      this.libLoading.set(false);
    });
  }

  ngOnInit(): void {
    // Optional: without the calendar the dialog simply offers no post to link.
    const from = new Date();
    const to = new Date(from.getTime() + PLAN_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
    forkJoin({ topics: this.calendar.listTopics(), items: this.calendar.listItems(from, to) })
      .pipe(catchError(() => of(null)))
      .subscribe((r) => {
        if (!r) return;
        this.planTopics.set(r.topics);
        this.planItems.set(r.items);
      });
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
      // Send to phone is optional too: without these the dialog still uploads directly.
      drive: this.isRelease() ? of(null) : this.api.driveStatus().pipe(catchError(() => of(null))),
      handoffs: this.isRelease() ? of([] as PhoneHandoff[]) : this.api.handoffs(this.jobId()).pipe(catchError(() => of([] as PhoneHandoff[]))),
    }).subscribe({
      next: ({ status, draft, uploads, videos, drive, handoffs }) => {
        const prefs = this.readPrefs();
        this.drive.set(drive ?? { connected: false, accountName: null, accountEmail: null, folderName: 'AnimStudio Shorts', connectedAt: null, needsReconnect: false });
        this.folderName.set(this.drive()!.folderName);
        this.muteAudio.set(prefs.muteAudio ?? false);
        if (!this.isRelease() && prefs.route === 'phone') this.route.set('phone');
        // Reattach to a send of this render that is still copying or waiting for the phone upload.
        const pending = handoffs.find((h) => !h.saveOnly && (isHandoffActive(h) || h.state === 'Expired'));
        const copy = handoffs.find((h) => h.saveOnly && h.state === 'Sending');
        if (copy) {
          this.driveCopy.set(copy);
          this.pollCopy(copy.id);
        }
        if (pending) {
          this.route.set('phone');
          this.handoff.set(pending);
          this.pollHandoff(pending.id);
        }
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
          // The choice comes back, the time does not: an old time would be in the past or wrong.
          if (prefs.scheduled && this.route() !== 'phone') this.setVisibility('scheduled');
          this.madeForKids.set(prefs.madeForKids ?? draft.madeForKids);
          const remembered = status.channels.find((c) => c.channelId === prefs.channelId);
          this.channelId.set(remembered?.channelId ?? status.channels[0]?.channelId ?? '');
        }
        // A song or a music project goes to YouTube Music, whatever was last picked for a video.
        if (this.isRelease() || draft.isMusic) this.setDestination('music');
        if (this.asDraft()) {
          this.scheduled.set(false);
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
        this.pinnedCommentIdea.set(s.pinnedComment ?? null);
        this.engagementCommentIdea.set(s.engagementComment ?? null);
        if (!this.firstComment().trim() && s.pinnedComment) {
          this.firstComment.set(s.pinnedComment);
        }
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

  /** The description lists related videos in this order, so it can be changed. */
  moveRelated(videoId: string, by: -1 | 1): void {
    this.relatedIds.update((ids) => {
      const at = ids.indexOf(videoId);
      const to = at + by;
      if (at < 0 || to < 0 || to >= ids.length) return ids;
      const next = [...ids];
      [next[at], next[to]] = [next[to], next[at]];
      return next;
    });
  }

  /** YouTube's own still for a video; the stored one when the status check saved it. */
  videoThumb(v: YouTubePublication): string {
    return v.thumbnailUrl || `https://i.ytimg.com/vi/${encodeURIComponent(v.videoId)}/mqdefault.jpg`;
  }

  /** "3 days ago", for telling apart videos with similar titles. */
  ago(iso: string): string {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return '';
    const days = Math.floor((Date.now() - t) / 86_400_000);
    if (days < 1) return 'today';
    if (days < 2) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} mo ago`;
    return `${Math.floor(days / 365)} yr ago`;
  }

  // --- thumbnail ---

  setThumbMode(mode: ThumbMode): void {
    if (this.uploading()) return;
    this.thumbMode.set(mode);
    this.thumbError.set(null);
    if (mode === 'frame' && this.frames().length === 0) this.loadFrames(false);
    if (mode === 'library') this.setLibScope(this.libScope());
  }

  setLibScope(scope: LibScope): void {
    this.libScope.set(scope);
    const projectId = this.libProjectId();
    if (!projectId) return;
    if (scope === 'other') {
      this.libSearch$.next(this.libQuery().trim());
    } else if (this.store?.project()?.id !== projectId && this.ownImages() === null) {
      this.libLoading.set(true);
      this.assets.listAssets(projectId).subscribe({
        next: (list) => {
          this.ownImages.set(list.filter((a) => a.kind === 'Image').map((a) => ({ id: a.id, name: a.name, width: a.width, height: a.height })));
          this.libLoading.set(false);
        },
        error: () => {
          this.ownImages.set([]);
          this.libLoading.set(false);
          this.thumbError.set("This project's pictures couldn't be loaded. Try again.");
        },
      });
    }
  }

  setLibQuery(value: string | null): void {
    const q = (value ?? '').slice(0, 80);
    this.libQuery.set(q);
    if (this.libScope() === 'other') this.libSearch$.next(q.trim());
  }

  libThumb(assetId: string): string {
    return this.assets.assetThumbnailUrl(assetId);
  }

  /** Fetches the picture's full bytes; nothing is copied into this project. */
  pickLibrary(item: LibItem): void {
    if (this.uploading() || this.libPicking()) return;
    this.thumbError.set(null);
    this.libPicking.set(item.id);
    this.assets.assetContent(item.id).subscribe({
      next: async (blob) => {
        try {
          const dataUrl = await this.libraryDataUrl(blob);
          if (this.libPicking() === item.id) this.libPicked.set({ ...item, dataUrl });
        } catch {
          this.thumbError.set("That picture couldn't be used as a thumbnail. Pick another.");
        } finally {
          if (this.libPicking() === item.id) this.libPicking.set(null);
        }
      },
      error: () => {
        this.thumbError.set("That picture couldn't be loaded. Pick another.");
        this.libPicking.set(null);
      },
    });
  }

  /**
   * A JPG or PNG within YouTube's limit goes as-is; anything else (WebP, GIF, a huge photo)
   * is redrawn as a JPG no bigger than {@link LIB_MAX_EDGE}. The server re-checks either way.
   */
  private async libraryDataUrl(blob: Blob): Promise<string> {
    if (/^image\/(jpeg|png)$/.test(blob.type) && blob.size <= MAX_THUMBNAIL_UPLOAD_BYTES) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('unreadable')));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    }
    const bitmap = await createImageBitmap(blob);
    try {
      const scale = Math.min(1, LIB_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no canvas');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.9);
    } finally {
      bitmap.close();
    }
  }

  /** A row of frames spread over the video; `another` moves them to other moments. */
  loadFrames(another: boolean): void {
    const length = this.draft()?.video.durationSeconds ?? 0;
    if (length <= 0) {
      this.thumbError.set("The video's length isn't known, so frames can't be offered. Pause the video and use that frame.");
      return;
    }
    if (another) this.frameRound++;
    const shift = (this.frameRound * 0.07) % 0.14;
    const spots = FRAME_SPOTS.map((p) => Math.round(Math.min(length - 0.1, Math.max(0, (p + shift) * length)) * 10) / 10);
    const unique = [...new Set(spots)];
    this.frames.set(unique.map((at) => ({ at, url: this.frameUrls.get(at) ?? null, failed: false })));
    for (const at of unique) if (!this.frameUrls.has(at)) this.fetchFrame(at);
  }

  pickFrame(at: number): void {
    this.thumbFrameAt.set(at);
    this.thumbError.set(null);
  }

  /** The exact frame the player is paused on. */
  useCurrentFrame(): void {
    const video = this.player()?.nativeElement;
    if (!video) return;
    video.pause();
    const at = Math.round(video.currentTime * 10) / 10;
    if (!this.frames().some((f) => f.at === at)) {
      this.frames.update((list) => [{ at, url: this.frameUrls.get(at) ?? null, failed: false }, ...list].slice(0, 6));
    }
    this.thumbFrameAt.set(at);
    if (!this.frameUrls.has(at)) this.fetchFrame(at);
  }

  private fetchFrame(at: number): void {
    this.grabbing.set(++this.framesPending > 0);
    this.api.frame(this.jobId(), at, this.source()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.frameUrls.set(at, url);
        this.frames.update((list) => list.map((f) => (f.at === at ? { ...f, url } : f)));
        this.grabbing.set(--this.framesPending > 0);
      },
      error: () => {
        this.frames.update((list) => list.map((f) => (f.at === at ? { ...f, failed: true } : f)));
        if (this.thumbFrameAt() === at) this.thumbError.set("That frame couldn't be taken from the video. Pick another.");
        this.grabbing.set(--this.framesPending > 0);
      },
    });
  }

  onThumbFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (file) this.readThumb(file);
  }

  onThumbDragOver(event: DragEvent): void {
    if (this.uploading() || !Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
    event.preventDefault();
    this.thumbDragOver.set(true);
  }

  onThumbDrop(event: DragEvent): void {
    event.preventDefault();
    this.thumbDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && !this.uploading()) this.readThumb(file);
  }

  /** The server checks the bytes and re-encodes anyway; this only catches the obvious early. */
  private readThumb(file: File): void {
    this.thumbError.set(null);
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      this.thumbError.set('A thumbnail must be a JPG or PNG picture.');
      return;
    }
    if (file.size > MAX_THUMBNAIL_UPLOAD_BYTES) {
      this.thumbError.set(`That picture is over ${MAX_THUMBNAIL_UPLOAD_BYTES / 1048576} MB. Use a smaller one.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.thumbImage.set(typeof reader.result === 'string' ? reader.result : null);
      this.thumbMode.set('upload');
    };
    reader.onerror = () => this.thumbError.set("That picture couldn't be read. Choose another.");
    reader.readAsDataURL(file);
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
    if (this.route() === 'phone') {
      this.sendToPhone();
      return;
    }

    // Checked again now: the time may have slipped under the 10-minute lead while reviewing.
    const publishAt = this.scheduled() ? this.scheduleDate() : null;
    const late = this.scheduled() ? this.checkSchedule(publishAt, Date.now()) : null;
    if (late) {
      this.error.set(late);
      this.busy.set(false);
      return;
    }

    this.api.publish(this.jobId(), this.channelId(), {
      title: this.title().trim(),
      description: this.description().trim(),
      tags: this.tags(),
      categoryId: this.categoryId(),
      privacy: this.scheduled() ? 'private' : this.privacy(),
      madeForKids: this.madeForKids(),
      notifySubscribers: this.notify(),
      publishAt: publishAt ? publishAt.toISOString() : null,
    }, this.relatedSelected().map((v) => v.videoId), this.firstComment().trim(), this.source(), this.thumbnailChoice(),
    this.selectedPlan()?.id ?? null).subscribe({
      next: (upload) => {
        this.upload.set(upload);
        this.noteLinked(upload);
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

  // --- send to phone ---

  setRoute(route: YouTubeUploadRoute): void {
    if (this.uploading() || this.sendingToDrive() || this.isRelease()) return;
    this.route.set(route);
    // The phone upload can't carry a publish time; it stays private rather than going public.
    if (route === 'phone' && this.scheduled()) this.scheduled.set(false);
    this.error.set(null);
    this.serverErrors.set([]);
  }

  /** Connects the personal Drive, or (`forChannel`) one used only by the chosen channel. */
  connectDrive(forChannel = false): void {
    this.busy.set(true);
    this.error.set(null);
    // Coming back lands on the same page, which reopens this dialog; remember to show the phone route.
    this.route.set('phone');
    this.savePrefs();
    this.api.startDriveConnect(this.returnPath(), forChannel ? this.channelId() || null : null).subscribe({
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

  disconnectDrive(): void {
    const dr = this.drive();
    const own = !!dr?.ownDrive;
    const message = own
      ? `Disconnect ${dr?.channelTitle}'s own Drive? It will use your Drive again. Videos already there stay.`
      : 'Disconnect your Google Drive? Channels without a Drive of their own lose it too. Videos already there stay.';
    if (!confirm(message)) return;
    this.busy.set(true);
    this.api.disconnectDrive(own ? this.channelId() || null : null).subscribe({
      next: () => {
        this.busy.set(false);
        this.refreshDrive(this.channelId() || null);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }

  /** Makes the folder typed here the Drive's default for later sends. */
  saveDefaultFolder(): void {
    const name = this.folderName().trim();
    if (!isValidDriveFolderName(name)) return;
    this.busy.set(true);
    this.api.setDriveFolder(name, this.channelId() || null).subscribe({
      next: (d) => {
        this.drive.set(d);
        this.busy.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }

  /** What the chosen channel's Drive is now, its folder as the starting choice, and its folders to pick from. */
  private refreshDrive(channelId: string | null): void {
    this.api.driveStatus(channelId).pipe(catchError(() => of(null))).subscribe((d) => {
      if (!d) return;
      this.drive.set(d);
      if (!this.sendingToDrive()) this.folderName.set(d.folderName);
      this.driveFolders.set([]);
      if (d.connected && !d.needsReconnect) {
        this.api.driveFolders(channelId).pipe(catchError(() => of([] as string[]))).subscribe((f) => this.driveFolders.set(f));
      }
    });
  }

  /** Copies this render to the folder above, on the chosen channel's Drive. Nothing goes to YouTube. */
  saveCopyToDrive(): void {
    if (this.savingCopy() || !this.folderNameValid()) return;
    this.error.set(null);
    this.api.saveToDrive(this.jobId(), { channelId: this.channelId() || null, folderName: this.folderName().trim(), topicId: this.topicId() }).subscribe({
      next: (c) => {
        this.driveCopy.set(c);
        this.pollCopy(c.id);
      },
      error: (e: Error & { code?: string }) => {
        this.error.set(e.message);
        if (e.code === 'drive-reconnect') this.drive.update((d) => d && { ...d, needsReconnect: true });
      },
    });
  }

  private pollCopy(id: string): void {
    if (this.copyPoll !== null) clearTimeout(this.copyPoll);
    this.copyPoll = null;
    if (this.driveCopy()?.state !== 'Sending') return;
    this.copyPoll = setTimeout(() => {
      this.api.handoff(id).subscribe({
        next: (c) => {
          this.driveCopy.set(c);
          this.pollCopy(id);
        },
        error: () => this.pollCopy(id),
      });
    }, 1500);
  }

  private sendToPhone(): void {
    this.candidates.set(null);
    this.api.sendToPhone(this.jobId(), {
      channelId: this.channelId(),
      metadata: {
        title: this.title().trim(),
        description: this.description().trim(),
        tags: this.tags(),
        categoryId: this.categoryId(),
        privacy: this.privacy(),
        madeForKids: this.madeForKids(),
        // The phone upload has already notified subscribers (or not); this can't change it.
        notifySubscribers: false,
      },
      relatedVideoIds: this.relatedSelected().map((v) => v.videoId),
      firstComment: this.firstComment().trim() || null,
      folderName: this.folderName().trim() || null,
      muteAudio: this.muteAudio(),
    }).subscribe({
      next: (h) => {
        this.handoff.set(h);
        this.reviewing.set(false);
        this.busy.set(false);
        this.pollHandoff(h.id);
      },
      error: (e: Error & { code?: string }) => {
        this.error.set(e.message);
        if (e.code === 'drive-reconnect') this.drive.update((d) => d && { ...d, needsReconnect: true });
        if (e.code === 'youtube-reconnect') this.markNeedsReconnect();
        this.busy.set(false);
      },
    });
  }

  /** Asks the channel now; applies the details if exactly one new video fits, else lists them to pick. */
  checkHandoff(): void {
    const h = this.handoff();
    if (!h || this.checking()) return;
    this.checking.set(true);
    this.busy.set(true);
    this.error.set(null);
    this.api.checkHandoff(h.id).subscribe({
      next: ({ handoff, candidates }) => {
        this.handoff.set(handoff);
        this.candidates.set(candidates);
        this.checking.set(false);
        this.busy.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.checking.set(false);
        this.busy.set(false);
      },
    });
  }

  applyHandoff(candidate: PhoneUploadCandidate): void {
    const h = this.handoff();
    if (!h || this.busy()) return;
    if (!candidate.likely && !confirm(`Put this video's details on "${candidate.title || candidate.videoId}"? Its title, description and settings will be replaced.`)) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.applyHandoff(h.id, candidate.videoId).subscribe({
      next: (applied) => {
        this.handoff.set(applied);
        this.candidates.set(null);
        this.busy.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }

  cancelHandoff(): void {
    const h = this.handoff();
    if (!h) return;
    this.api.cancelHandoff(h.id).subscribe({
      next: (updated) => this.handoff.set(updated),
      error: (e: Error) => this.error.set(e.message),
    });
  }

  /** "14:32", for when a check ran or a video went up today. */
  timeOf(iso: string): string {
    const t = new Date(iso);
    return Number.isFinite(t.getTime()) ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  }

  /** Quick while copying; while waiting, the server does the checking, so this only reads the saved state. */
  private pollHandoff(id: string): void {
    this.stopHandoffPoll();
    const h = this.handoff();
    if (!h || !isHandoffActive(h)) return;
    this.handoffPoll = setTimeout(() => {
      this.api.handoff(id).subscribe({
        next: (updated) => {
          this.handoff.set(updated);
          if (updated.state !== 'WaitingForPhone') this.candidates.set(null);
          this.pollHandoff(id);
        },
        // A blip while polling isn't the send failing; try again a little later.
        error: () => this.pollHandoff(id),
      });
    }, h.state === 'Sending' ? 1500 : 15000);
  }

  private stopHandoffPoll(): void {
    if (this.handoffPoll !== null) clearTimeout(this.handoffPoll);
    this.handoffPoll = null;
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
          this.noteLinked(u);
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

  setVisibility(value: Visibility): void {
    if (value === 'scheduled') {
      if (this.route() === 'phone') return;
      this.privacy.set('private');
      this.scheduled.set(true);
      return;
    }
    this.scheduled.set(false);
    this.privacy.set(value);
  }

  /** Links the upload to a calendar post; the post's time becomes the schedule (still editable). */
  choosePlan(id: string): void {
    const post = this.planOptions().find((p) => p.id === id) ?? null;
    this.planItemId.set(post?.id ?? null);
    if (!post) return;
    this.setVisibility('scheduled');
    this.publishAtLocal.set(toLocalInput(new Date(post.publishAt)));
    if (!this.title().trim()) this.title.set(post.title);
  }

  planTopic(post: ContentPlanItem): ContentTopic | null {
    return this.topicsById().get(post.topicId) ?? null;
  }

  when(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    return Number.isNaN(date.getTime()) ? '' : formatWhen(date);
  }

  private checkSchedule(at: Date | null, now: number): string | null {
    if (!at) return 'Pick the date and time it goes public.';
    if (at.getTime() - now < MIN_SCHEDULE_LEAD_MS) return 'Pick a time at least 10 minutes from now.';
    if (at.getTime() - now > MAX_SCHEDULE_AHEAD_MS) return 'Pick a time at most a year ahead.';
    return null;
  }

  /** A post that now has its video drops out of the picker. */
  private noteLinked(upload: YouTubeUpload): void {
    const id = upload.linkedPlanItemId;
    if (!id || !upload.videoId) return;
    this.planItems.update((list) => list.map((p) => (p.id === id && !p.videoId ? { ...p, videoId: upload.videoId } : p)));
    if (this.planItemId() === id) this.planItemId.set(null);
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
        scheduled: this.scheduled(),
        madeForKids: this.madeForKids() ?? undefined,
        route: this.route(),
        muteAudio: this.muteAudio(),
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Storage blocked: the next publish just starts from the defaults.
    }
  }
}
