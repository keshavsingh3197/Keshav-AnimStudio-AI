import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, Injector, OnDestroy, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, TimeoutError, firstValueFrom, timeout } from 'rxjs';

import { LibraryBulk, LibraryItem, LibraryPage, LibraryQuery, LibraryView } from '../../core/models/shorts.models';
import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { MediaTicketService } from '../../core/services/media-ticket.service';
import { ShortsService } from '../../core/services/shorts.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { ContentTopic } from '../../core/models/calendar.models';
import { ContentCalendarService } from '../../core/services/content-calendar.service';
import { newTopicRequest } from '../../shared/topic-picker.component';

type Sort = NonNullable<LibraryQuery['sort']>;
type ViewMode = 'xl' | 'large' | 'medium' | 'small' | 'list' | 'details' | 'tiles' | 'content';
type FormatFilter = 'all' | NonNullable<LibraryQuery['format']>;

/** A running bulk action: with a total it fills by done/total, without one it is indeterminate. */
interface OpProgress {
  title: string;
  detail: string;
  done: number;
  total: number;
  failed: number;
  tone: 'brand' | 'danger';
  /** done/total count steps of a multi-stage task rather than videos. */
  steps?: boolean;
  cancellable?: boolean;
}

interface ConfirmSpec {
  title: string;
  lead: string;
  points: string[];
  confirmLabel: string;
  tone: 'warn' | 'danger';
  items?: string[];
  more?: number;
  /** A word the user types before a large destructive action goes ahead. */
  typeToConfirm?: string;
}

/** Bulk calls go in batches this size so the progress bar moves and Stop takes effect between them. */
const BATCH = 10;

/**
 * The shorts & exported videos on Drive (and topic-tagged renders) as a library:
 * search, filter by topic, format and status, sample/preview inline or in a modal,
 * download to this device with proper icons, mark used/unused per item or in bulk,
 * file under shared topics and archive the used.
 */
@Component({
  selector: 'app-shorts-library-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="lp studio-wide-page">
      <div class="lp-content" [attr.inert]="sampleItem() || moveDialog() || confirmDialog() ? '' : null">
      <header class="lp-head" [attr.inert]="busy() ? '' : null">
        <div>
          <h2>Drive &amp; Topics Library</h2>
          <p class="muted">Your exported videos, organised by topic. Preview before posting, download MP4s, and track what you have already used.</p>
        </div>
        <div class="lp-head-actions">
          <a routerLink="/shorts" class="lp-btn">← Shorts Studio</a>
          <a routerLink="/videos" class="lp-btn">🎬 Videos &amp; Shorts</a>
          <a routerLink="/calendar" class="lp-btn">📅 Topics &amp; Calendar</a>
          <button type="button" class="lp-btn" (click)="syncDrive()" [disabled]="busy() || loading()" title="Check Google Drive &amp; organize topic folders">
            ☁ Sync Drive
          </button>
          <button type="button" class="lp-btn" (click)="reload()" [disabled]="busy() || loading()">↻ Refresh</button>
          <button type="button" class="lp-btn danger" (click)="deleteUsed()" [disabled]="busy() || !(data()?.counts?.used)">
            🗑 Delete {{ usedBatchCount() }} used
          </button>
        </div>
      </header>

      @if (op(); as o) {
        <section class="lp-progress" [class.danger]="o.tone === 'danger'" aria-label="Progress">
          <div class="lp-progress-head">
            <span class="lp-spinner" aria-hidden="true"></span>
            <strong>{{ o.title }}</strong>
            @if (o.detail) { <span class="muted">{{ o.detail }}</span> }
            <span class="lp-spacer"></span>
            @if (o.total) {
              <span class="lp-progress-count">{{ o.steps ? 'Step ' + stepNumber(o) + ' of ' + o.total : (o.done | number) + ' / ' + (o.total | number) }} · {{ opPercent() }}%</span>
            }
            @if (o.cancellable) {
              <button type="button" class="lp-btn sm" (click)="stopOp()" [disabled]="stopping()">{{ stopping() ? 'Stopping after this batch…' : 'Stop' }}</button>
            }
          </div>
          <div class="lp-progress-track" [class.indeterminate]="!o.total" role="progressbar" [attr.aria-label]="o.title"
               aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="o.total ? opPercent() : null">
            <div class="lp-progress-fill" [style.width.%]="o.total ? opWidth() : null"></div>
          </div>
          <p class="lp-sr" role="status" aria-live="polite">{{ o.title }} {{ o.total ? opPercent() + '%' : '' }}</p>
          @if (o.failed) { <small class="lp-progress-failed">{{ o.failed }} failed so far. The rest continue.</small> }
        </section>
      } @else if (importing()) {
        <section class="lp-progress slim" aria-label="Checking Google Drive">
          <div class="lp-progress-head"><span class="lp-spinner" aria-hidden="true"></span><span>Checking Google Drive for new videos…</span></div>
          <div class="lp-progress-track indeterminate" role="progressbar" aria-label="Checking Google Drive for new videos"><div class="lp-progress-fill"></div></div>
        </section>
      }

      <section class="lp-overview" aria-label="Library overview" [attr.inert]="busy() ? '' : null">
        @for (v of views(); track v.id) {
          <button type="button" class="lp-stat" [class.on]="view() === v.id" [attr.aria-pressed]="view() === v.id" (click)="setView(v.id)">
            <strong>{{ v.count | number }}</strong><span>{{ v.label }}</span>
          </button>
        }
      </section>

      <section class="lp-card" [attr.inert]="busy() ? '' : null">
        <div class="lp-filters">
          <label class="lp-field lp-search"><span>Search library</span>
          <input class="lp-input" type="search" maxlength="100" placeholder="Video title, project or topic…"
                 [ngModel]="search()" (ngModelChange)="onSearch($event)" />
          </label>
          <label class="lp-field"><span>Format</span>
          <select class="lp-input" [ngModel]="formatFilter()" (ngModelChange)="setFormat($event)">
            <option value="all">All formats</option>
            <option value="short">📱 Shorts (9:16)</option>
            <option value="video">🎬 Landscape Videos (16:9)</option>
            <option value="square">Square (1:1)</option>
            <option value="unknown">Unknown dimensions</option>
          </select>
          </label>
          <label class="lp-field"><span>Layout</span>
          <select class="lp-input" [ngModel]="mode()" (ngModelChange)="setMode($event)">
            @for (m of modes; track m.id) { <option [value]="m.id">{{ m.icon }} {{ m.label }}</option> }
          </select>
          </label>
          <label class="lp-field"><span>Sort by</span>
          <select class="lp-input" [ngModel]="sort()" (ngModelChange)="setSort($event)">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="used">Recently used</option>
          </select>
          </label>
          <label class="lp-field"><span>Items per page</span>
          <select class="lp-input" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
            @for (n of pageSizes; track n) { <option [ngValue]="n">{{ n }} / page</option> }
          </select>
          </label>
        </div>

        <div class="lp-filter-summary">
          <span class="muted">{{ loading() ? 'Updating results…' : rangeText() }} · {{ activeTopicName() }}</span>
          @if (hasFilters()) { <button type="button" class="lp-btn" (click)="resetFilters()">Reset filters</button> }
        </div>

        <div class="lp-chips" role="group" aria-label="Filter by topic">
          <button type="button" class="lp-chip" [class.on]="!topicId()" [attr.aria-pressed]="!topicId()" (click)="setTopic('')">
            📁 All topics <small>{{ data()?.counts?.active ?? 0 }}</small>
          </button>
          <button type="button" class="lp-chip" [class.on]="topicId() === 'none'" [attr.aria-pressed]="topicId() === 'none'" (click)="setTopic('none')">
            No topic <small>{{ data()?.counts?.noTopic ?? 0 }}</small>
          </button>
          @for (t of data()?.topics ?? []; track t.topicId) {
            <button type="button" class="lp-chip" [class.on]="topicId() === t.topicId" [attr.aria-pressed]="topicId() === t.topicId" (click)="setTopic(t.topicId)"
                    [title]="t.unused + ' unused of ' + t.shorts + ' total in ' + t.name">
              <span class="lp-dot" [style.background]="t.color"></span>{{ t.name }} <small>{{ t.unused }}/{{ t.shorts }}</small>
            </button>
          }
        </div>
      </section>

      @if (message(); as m) { <p class="lp-msg" role="status">{{ m }}</p> }
      @if (loadError()) {
        <div class="lp-msg lp-error" role="alert">{{ loadErrorMessage() }}
          @if (data()) { <span>Previous results are shown below; their actions are disabled until the library reloads.</span> }
          <button type="button" class="lp-btn" (click)="reload()" [disabled]="loading()">Retry</button>
        </div>
      }

      @if (driveState() === 'missing' || driveState() === 'reconnect') {
        <section class="lp-card lp-connect" role="alert">
          <div>
            <strong>{{ driveState() === 'reconnect' ? 'Reconnect Google Drive' : 'Connect Google Drive' }}</strong>
            <p class="muted">{{ driveState() === 'reconnect'
              ? 'Google needs you to sign in again before AnimStudio can reach your saved shorts.'
              : 'Connect your Google Drive once and your shorts and videos are saved, organised by topic, and available to fetch and download here.' }}</p>
          </div>
          <button type="button" class="lp-btn primary" (click)="connectDrive()" [disabled]="driveBusy()">
            {{ driveBusy() ? 'Opening Google…' : (driveState() === 'reconnect' ? 'Reconnect Google Drive' : 'Connect Google Drive') }}
          </button>
        </section>
      }

      <section class="lp-card" [attr.aria-busy]="loading() || busy()">
        <div class="lp-bar">
          <label class="lp-check"><input type="checkbox" [checked]="allOnPageSelected()" [indeterminate]="someOnPageSelected()" [disabled]="loading() || busy() || loadError() || !pageItems().length" (change)="togglePage()" /> Select page</label>
          <span class="muted" role="status">{{ selected().size }} selected</span>
          @if (allOnPageSelected() && (data()?.total ?? 0) > pageItems().length && selected().size < (data()?.total ?? 0)) {
            <button type="button" class="lp-link" (click)="selectAllMatching()" [disabled]="busy() || loading()">
              Select all {{ data()?.total }} matching
            </button>
          }
          @if (selected().size) {
            <button type="button" class="lp-link" (click)="selected.set(empty)" [disabled]="busy()">Clear selection</button>
          }
          <span class="lp-spacer"></span>
          <span class="muted">{{ loading() ? 'Loading library…' : rangeText() }}</span>
        </div>
        @if (selected().size) {
        <div class="lp-bulk" role="group" aria-label="Selected video actions" [attr.inert]="loading() || busy() || loadError() ? '' : null">
          <button type="button" class="lp-btn dl-btn" (click)="downloadSelected()" [disabled]="busy() || loading() || !selectedOnPage().length"
                  title="Downloads selected videos on this page. Other bulk actions apply to the full selection.">
            <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download page selection ({{ selectedOnPage().length }})
          </button>
          <button type="button" class="lp-btn" (click)="setUsed(true)" [disabled]="busy() || !selected().size">
            ✓ Mark used
          </button>
          <button type="button" class="lp-btn" (click)="setUsed(false)" [disabled]="busy() || !selected().size">
            ↺ Mark unused
          </button>
          <button type="button" class="lp-btn move-btn" (click)="openMove([...selected()])" [disabled]="busy() || !selected().size"
                  aria-haspopup="dialog" title="Choose a topic for the selected videos">
            <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M10 13h6m0 0l-2-2m2 2l-2 2" /></svg>
            Move to topic…
          </button>
          @if (view() === 'archived') {
            <button type="button" class="lp-btn" (click)="restoreSelected()" [disabled]="busy() || !selected().size">Restore</button>
          } @else {
            <button type="button" class="lp-btn" (click)="archiveSelected()" [disabled]="busy() || !selected().size">Archive</button>
          }
          <button type="button" class="lp-btn danger" (click)="deleteSelected()" [disabled]="busy() || !selected().size">🗑 Delete</button>
        </div>
        @if (selected().size > selectedOnPage().length) {
          <p class="lp-hint muted">Selection includes other pages. Mark, archive, restore, move and delete apply to all {{ selected().size }} selected items; downloads apply to {{ selectedOnPage().length }} on this page.</p>
        }
        }
        <details class="lp-download-settings">
          <summary>Download &amp; usage settings <span>{{ autoArchive() ? 'Auto-delete ON' : 'Keep used videos' }}</span></summary>
          <label class="lp-check" title="Used shorts are deleted automatically (Drive file moves to the Drive trash)">
            <input type="checkbox" [ngModel]="autoArchive()" (ngModelChange)="autoArchive.set($event)" [disabled]="busy()" />
            Auto-delete when used
          </label>
          <p class="lp-hint muted">Downloads mark videos used. With auto-delete enabled, downloading or marking used also moves the Drive copy to trash. You will be asked to confirm first. Archiving is a separate action.</p>
          <label class="lp-check" title="Sync Drive removes videos you deleted or trashed directly on Google Drive">
            <input type="checkbox" [ngModel]="removeMissingOnSync()" (ngModelChange)="setRemoveMissingOnSync($event)" [disabled]="busy()" />
            Remove videos deleted on Drive when syncing
          </label>
          <p class="lp-hint muted">When on, Sync Drive takes videos you deleted or trashed on Google Drive out of the library. Their renders stay in Shorts Studio, so you can save them to Drive again. When off, they are only flagged as missing.</p>
        </details>
        @if (busy() && !op()) { <p class="lp-hint" role="status">Applying your changes…</p> }

        <div class="lp-results" [class.unavailable]="loadError()" [attr.inert]="loading() || busy() || loadError() ? '' : null">
        @if (mode() === 'details') {
          <div class="lp-table-wrap" [class.loading]="loading()">
            <table class="lp-table">
              <thead>
                <tr>
                  <th class="c-sel"><input type="checkbox" [checked]="allOnPageSelected()" [indeterminate]="someOnPageSelected()" (change)="togglePage()" aria-label="Select page" /></th>
                  <th class="c-sample">Sample</th>
                  <th><button type="button" class="lp-th" (click)="sortBy('name')">Name {{ arrow('name') }}</button></th>
                  <th>Project</th>
                  <th>Topic</th>
                  <th>Format</th>
                  <th>Length</th>
                  <th>Size</th>
                  <th><button type="button" class="lp-th" (click)="sortBy('date')">Created {{ arrow('date') }}</button></th>
                  <th><button type="button" class="lp-th" (click)="sortBy('used')">Status {{ arrow('used') }}</button></th>
                  <th class="c-act">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (i of pageItems(); track i.handoffId) {
                  <tr [class.used]="!!i.usedAt" [class.sel]="selected().has(i.handoffId)" (dblclick)="openSample(i)">
                    <td class="c-sel"><input type="checkbox" [checked]="selected().has(i.handoffId)" (change)="toggle(i.handoffId)" [attr.aria-label]="'Select ' + i.title" /></td>
                    <td class="c-sample">
                      <button type="button" class="lp-row-thumb" (click)="openSample(i)" title="Play video sample">
                        @if (showThumb(i)) {
                          <img [src]="thumbUrl(i)" alt="" loading="lazy" (error)="onThumbError(i.handoffId)" />
                        }
                        <span class="lp-row-play">▶</span>
                      </button>
                    </td>
                    <td class="c-name" [title]="i.title">{{ i.title || 'Short' }}</td>
                    <td class="muted">{{ i.projectName }}</td>
                    <td>@if (i.topicName) { <span class="lp-tag"><span class="lp-dot" [style.background]="i.topicColor"></span>{{ i.topicName }}</span> } @else { <span class="muted">—</span> }</td>
                    <td>
                      <span class="lp-fmt-badge" [class.video]="i.format === 'video'">
                        {{ formatLabel(i) }}
                      </span>
                    </td>
                    <td class="muted">@if (i.durationSeconds) { {{ i.durationSeconds | number: '1.0-0' }}s }</td>
                    <td class="muted">@if (i.sizeBytes) { {{ mb(i.sizeBytes) }} MB }</td>
                    <td class="muted">{{ i.createdAt | date: 'mediumDate' }}</td>
                    <td>
                      @if (i.archived) { <span class="lp-tag">Archived</span> }
                      @else if (i.usedAt) { <span class="lp-tag used" [title]="'Used ' + (i.usedAt | date:'medium')">✓ Used</span> }
                      @else { <span class="lp-tag unused">Unused</span> }
                    </td>
                    <td class="c-act">
                      <div class="lp-row-acts">
                        <button type="button" class="lp-btn sm icon-btn" (click)="openSample(i)" title="Sample / Preview video">
                          <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none" /></svg>
                          Sample
                        </button>
                        <button type="button" class="lp-btn sm dl-btn icon-btn" (click)="downloadOne(i)" [disabled]="busy()" title="Download MP4 (marks as used)">
                          <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                          </svg>
                          Download
                        </button>
                        <button type="button" class="lp-btn sm use-btn" [class.is-used]="!!i.usedAt"
                                (click)="toggleItemUsed(i)" [disabled]="busy()"
                                [title]="i.usedAt ? 'Mark as unused again' : 'Mark as used'">
                          {{ i.usedAt ? '↺ Unused' : '✓ Use' }}
                        </button>
                        <button type="button" class="lp-btn sm icon-btn" (click)="openMove([i.handoffId])" [disabled]="busy()" aria-haspopup="dialog"
                                title="Move to a topic" [attr.aria-label]="'Move to topic: ' + i.title">
                          <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                          Move
                        </button>
                        @if (i.driveUrl) {
                          <a class="lp-btn sm icon-only" [href]="i.driveUrl" target="_blank" rel="noopener" title="Open in Google Drive" [attr.aria-label]="'Open ' + i.title + ' in Google Drive (new tab)'">
                            <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M14 3h7v7m0-7L10 14M5 5h5M5 5v14h14v-5" />
                            </svg>
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="11" class="lp-empty muted">{{ emptyText() }} @if (hasFilters() && !loading()) { <button type="button" class="lp-btn" (click)="resetFilters()">Reset filters</button> }</td></tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <ul class="lp-items" [class]="'lp-items m-' + mode()" [class.loading]="loading()">
            @for (i of pageItems(); track i.handoffId) {
              <li class="lp-item" [class.used]="!!i.usedAt" [class.sel]="selected().has(i.handoffId)" [class.wide]="i.format === 'video'">
                <label class="lp-pick" (click)="$event.stopPropagation()">
                  <input type="checkbox" [checked]="selected().has(i.handoffId)" (change)="toggle(i.handoffId)" [attr.aria-label]="'Select ' + i.title" />
                </label>

                <div class="lp-thumb" [class.wide]="i.format === 'video'" [class.square]="i.format === 'square'" [style.--tc]="i.topicColor || '#6c8cff'">
                  @if (playingInlineId() === i.handoffId) {
                    <video class="lp-inline-video" [src]="streamUrl(i)" controls autoplay playsinline preload="metadata" (error)="onPreviewError(i)"></video>
                    <button type="button" class="lp-thumb-close" (click)="stopInline($event)" aria-label="Stop sample" title="Stop sample">✕</button>
                    <button type="button" class="lp-thumb-expand" (click)="openSample(i, $event)" aria-label="Expand player" title="Expand player">⤢</button>
                  } @else {
                    @if (showThumb(i)) {
                      <img class="lp-thumb-img" [src]="thumbUrl(i)" alt="" loading="lazy" (error)="onThumbError(i.handoffId)" />
                    }
                    <button type="button" class="lp-thumb-overlay" (click)="onThumbClick(i)" [attr.aria-label]="'Preview ' + i.title">
                      <span class="lp-play-circle" title="Click to play video sample">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8,5 20,12 8,19" fill="currentColor" /></svg>
                      </span>
                    </button>
                    <span class="lp-fmt-pill">{{ formatLabel(i) }}</span>
                    @if (i.durationSeconds) { <span class="lp-dur">{{ i.durationSeconds | number: '1.0-0' }}s</span> }
                    @if (i.usedAt) {
                      <span class="lp-badge used" [title]="'Marked used ' + (i.usedAt | date:'short')">✓ Used</span>
                    } @else {
                      <span class="lp-badge unused">Unused</span>
                    }
                  }
                </div>

                <div class="lp-main">
                  <button type="button" class="lp-title" [title]="i.title" (click)="openSample(i)">{{ i.title || 'Short' }}</button>
                  <span class="lp-meta muted">{{ i.projectName }} · {{ i.createdAt | date: 'mediumDate' }}@if (i.sizeBytes) { · {{ mb(i.sizeBytes) }} MB }</span>
                  @if (mode() === 'content') { <span class="lp-meta muted">📁 {{ i.drivePath }}</span> }
                  <span class="lp-tags">
                    @if (i.topicName) { <span class="lp-tag"><span class="lp-dot" [style.background]="i.topicColor"></span>{{ i.topicName }}</span> }
                    @if (i.archived) { <span class="lp-tag">Archived</span> }
                  </span>
                </div>

                <div class="lp-acts">
                  <button type="button" class="lp-btn sm icon-btn grow act-sample" (click)="openSample(i)" title="Play video sample" [attr.aria-label]="'Sample ' + i.title">
                    <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none" /></svg>
                    <span class="act-lbl">Sample</span>
                  </button>
                  <button type="button" class="lp-btn sm dl-btn icon-btn grow" (click)="downloadOne(i)" [disabled]="busy()" title="Download MP4 (marks as used)" [attr.aria-label]="'Download ' + i.title + ' (marks as used)'">
                    <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                    <span class="act-lbl">Download</span>
                  </button>
                  <button type="button" class="lp-btn sm use-btn icon-btn grow" [class.is-used]="!!i.usedAt"
                          (click)="toggleItemUsed(i)" [disabled]="busy()"
                          [title]="i.usedAt ? 'Mark as unused again' : 'Mark as used'" [attr.aria-label]="(i.usedAt ? 'Mark unused: ' : 'Mark used: ') + i.title">
                    <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                      @if (i.usedAt) { <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5" /> } @else { <path d="M5 12.5l4.5 4.5L19 7.5" /> }
                    </svg>
                    <span class="act-lbl">{{ i.usedAt ? 'Unused' : 'Mark used' }}</span>
                  </button>
                  <button type="button" class="lp-btn sm icon-btn grow" (click)="openMove([i.handoffId])" [disabled]="busy()" aria-haspopup="dialog"
                          [title]="i.topicName ? 'Move from ' + i.topicName + ' to another topic' : 'Move to a topic'" [attr.aria-label]="'Move to topic: ' + i.title">
                    <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                    <span class="act-lbl">Move</span>
                  </button>
                  @if (i.driveUrl) {
                    <a class="lp-btn sm icon-btn grow act-drive" [href]="i.driveUrl" target="_blank" rel="noopener" title="Open in Google Drive" [attr.aria-label]="'Open ' + i.title + ' in Google Drive (new tab)'">
                      <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M14 3h7v7m0-7L10 14M5 5h5M5 5v14h14v-5" />
                      </svg>
                    </a>
                  }
                </div>
              </li>
            } @empty {
              <li class="lp-empty muted">{{ emptyText() }} @if (hasFilters() && !loading()) { <button type="button" class="lp-btn" (click)="resetFilters()">Reset filters</button> }</li>
            }
          </ul>
        }
        </div>

        <nav class="lp-pager" aria-label="Pagination">
          <span class="muted">{{ rangeText() }}</span>
          <span class="lp-spacer"></span>
          <button type="button" class="lp-btn" (click)="go(1)" [disabled]="loading() || busy() || page() <= 1" aria-label="First page">«</button>
          <button type="button" class="lp-btn" (click)="go(page() - 1)" [disabled]="loading() || busy() || page() <= 1">‹ Prev</button>
          <span>Page {{ page() }} of {{ data()?.pages ?? 1 }}</span>
          <button type="button" class="lp-btn" (click)="go(page() + 1)" [disabled]="loading() || busy() || page() >= (data()?.pages ?? 1)">Next ›</button>
          <button type="button" class="lp-btn" (click)="go(data()?.pages ?? 1)" [disabled]="loading() || busy() || page() >= (data()?.pages ?? 1)" aria-label="Last page">»</button>
        </nav>
      </section>
      </div>

      <!-- MOVE TO TOPIC DIALOG -->
      @if (moveDialog(); as mv) {
        <div class="lp-modal-backdrop lp-move-backdrop" (click)="closeMove()">
          <div #moveDialogEl class="lp-modal lp-move-modal" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="lp-move-title" (click)="$event.stopPropagation()">
            <header class="lp-modal-head">
              <div class="lp-modal-title-wrap">
                <h3 id="lp-move-title">Move {{ mv.ids.length === 1 ? '1 video' : mv.ids.length + ' videos' }} to a topic</h3>
                <p class="lp-modal-sub">The Google Drive {{ mv.ids.length === 1 ? 'file is' : 'files are' }} also moved into the chosen topic's folder.</p>
              </div>
              <button type="button" class="lp-modal-close" (click)="closeMove()" [disabled]="moveSaving()" aria-label="Close">✕</button>
            </header>

            <label class="lp-field">
              <span>Find a topic</span>
              <input #moveSearchEl class="lp-input" type="search" autocomplete="off" placeholder="Type to filter topics"
                     [ngModel]="moveSearch()" (ngModelChange)="moveSearch.set($event)" [disabled]="moveSaving()" />
            </label>

            @if (moveTopicsLoading()) {
              <p class="lp-hint muted" role="status">Loading topics…</p>
            } @else if (moveTopicsError()) {
              <p class="lp-msg lp-error" role="alert">
                {{ moveTopicsError() }}
                <button type="button" class="lp-link" (click)="loadMoveTopics()">Retry</button>
              </p>
            }

            <div class="lp-topic-list" role="group" aria-label="Topics">
              @if (moveShowsNone()) {
                <button type="button" class="lp-topic-opt" [class.on]="moveChoice() === null" [attr.aria-pressed]="moveChoice() === null"
                        (click)="moveChoice.set(null)" [disabled]="moveSaving()">
                  <span class="lp-dot none"></span>
                  <span class="lp-topic-name">No topic <small class="muted">— remove from its topic</small></span>
                  <span class="lp-topic-count">{{ data()?.counts?.noTopic ?? 0 }}</span>
                </button>
              }
              @for (t of moveList(); track t.id) {
                <button type="button" class="lp-topic-opt" [class.on]="moveChoice() === t.id" [attr.aria-pressed]="moveChoice() === t.id"
                        (click)="moveChoice.set(t.id)" [disabled]="moveSaving()">
                  <span class="lp-dot" [style.background]="t.color || '#6c8cff'"></span>
                  <span class="lp-topic-name">{{ t.name }} @if (mv.currentTopicId === t.id) { <small class="muted">— current</small> }</span>
                  <span class="lp-topic-count" [attr.aria-label]="moveCount(t.id) + ' videos'">{{ moveCount(t.id) }}</span>
                </button>
              } @empty {
                @if (!moveTopicsLoading() && !moveTopicsError()) {
                  <p class="lp-hint muted">{{ moveSearch().trim() ? 'No topic matches that search.' : 'No topics yet. Create one below.' }}</p>
                }
              }
            </div>

            <form class="lp-topic-new" (ngSubmit)="createMoveTopic()">
              <input class="lp-input" name="newTopic" maxlength="80" placeholder="Or create a new topic, e.g. Mahadev" aria-label="New topic name"
                     [ngModel]="newTopicName()" (ngModelChange)="newTopicName.set($event)" [disabled]="moveSaving() || creatingTopic()" />
              <button type="submit" class="lp-btn" [disabled]="moveSaving() || creatingTopic() || !newTopicName().trim()">
                {{ creatingTopic() ? 'Creating…' : '+ Create' }}
              </button>
            </form>
            @if (moveError()) { <p class="lp-msg lp-error" role="alert">{{ moveError() }}</p> }

            <footer class="lp-modal-foot">
              <button type="button" class="lp-btn" (click)="closeMove()" [disabled]="moveSaving()">Cancel</button>
              <button type="button" class="lp-btn primary" (click)="confirmMove()" [disabled]="moveSaving() || creatingTopic() || moveChoice() === undefined">
                {{ moveSaving() ? 'Moving…' : moveChoice() === undefined ? 'Choose a topic' : moveChoice() === null ? 'Remove from topic' : 'Move to ' + moveChoiceName() }}
              </button>
            </footer>
          </div>
        </div>
      }

      <!-- VIDEO SAMPLE & QUICK ACTIONS MODAL -->
      @if (sampleItem(); as s) {
        <div class="lp-modal-backdrop" (click)="closeSample()" [attr.inert]="confirmDialog() ? '' : null">
          <div #sampleDialog class="lp-modal" role="dialog" aria-modal="true" tabindex="-1" [attr.aria-label]="s.title || 'Video Sample'" (click)="$event.stopPropagation()">
            <header class="lp-modal-head">
              <div class="lp-modal-title-wrap">
                <h3>{{ s.title || 'Short' }}</h3>
                <div class="lp-modal-sub">
                  <span>{{ s.projectName }}</span>
                  @if (s.topicName) {
                    <span>·</span>
                    <span class="lp-tag"><span class="lp-dot" [style.background]="s.topicColor"></span>{{ s.topicName }}</span>
                  }
                  <span>·</span>
                  <span>{{ s.createdAt | date: 'medium' }}</span>
                  @if (s.sizeBytes) { <span>· {{ mb(s.sizeBytes) }} MB</span> }
                  @if (s.durationSeconds) { <span>· {{ s.durationSeconds | number: '1.0-1' }}s</span> }
                </div>
              </div>
              <button type="button" class="lp-modal-close" (click)="closeSample()" aria-label="Close">✕</button>
            </header>

            <div class="lp-modal-player-box" [class.wide]="s.format === 'video'">
              <video class="lp-modal-video" [src]="streamUrl(s)" controls autoplay playsinline preload="metadata" (error)="onPreviewError(s)"></video>
            </div>
            @if (previewError()) { <p class="lp-msg lp-error" role="alert">{{ previewError() }}</p> }

            <div class="lp-modal-meta-bar">
              <span class="muted">📁 {{ s.drivePath || 'Local Topic Library' }}</span>
              <span class="lp-spacer"></span>
              @if (s.archived) { <span class="lp-tag">Archived</span> }
              @else if (s.usedAt) {
                <span class="lp-tag used">✓ Used ({{ s.usedAt | date: 'short' }})</span>
              } @else {
                <span class="lp-tag unused">● Unused — ready to post</span>
              }
            </div>

            <footer class="lp-modal-foot">
              <div class="lp-modal-nav">
                <button type="button" class="lp-btn" (click)="stepSample(-1)" [disabled]="sampleIndex() <= 0">‹ Prev</button>
                <span class="muted">{{ sampleIndex() + 1 }} / {{ pageItems().length }}</span>
                <button type="button" class="lp-btn" (click)="stepSample(1)" [disabled]="sampleIndex() < 0 || sampleIndex() >= pageItems().length - 1">Next ›</button>
              </div>
              <div class="lp-modal-actions">
                @if (s.driveUrl) {
                  <a class="lp-btn icon-btn" [href]="s.driveUrl" target="_blank" rel="noopener">
                    <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3h7v7m0-7L10 14M5 5h5M5 5v14h14v-5" />
                    </svg>
                    Open in Drive
                  </a>
                }
                <button type="button" class="lp-btn use-btn" [class.is-used]="!!s.usedAt" (click)="toggleItemUsed(s)" [disabled]="busy()">
                  {{ s.usedAt ? '↺ Mark Unused' : '✓ Mark Used' }}
                </button>
                <button type="button" class="lp-btn primary dl-btn icon-btn" (click)="downloadOne(s)" [disabled]="busy()">
                  <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  Download MP4
                </button>
              </div>
            </footer>
          </div>
        </div>
      }

      <!-- WARNING / CONFIRM DIALOG -->
      @if (confirmDialog(); as c) {
        <div class="lp-modal-backdrop lp-confirm-backdrop" (click)="answerConfirm(false)">
          <div #confirmDialogEl class="lp-modal lp-confirm" [class.danger]="c.tone === 'danger'" role="alertdialog" aria-modal="true" tabindex="-1"
               aria-labelledby="lp-confirm-title" aria-describedby="lp-confirm-lead" (click)="$event.stopPropagation()">
            <div class="lp-confirm-top">
              <span class="lp-confirm-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 3l9.5 17h-19L12 3z" /><path d="M12 10v4.5M12 17.5v.01" /></svg>
              </span>
              <div class="lp-modal-title-wrap">
                <h3 id="lp-confirm-title">{{ c.title }}</h3>
                <p id="lp-confirm-lead" class="lp-confirm-lead">{{ c.lead }}</p>
              </div>
            </div>

            <ul class="lp-confirm-points">
              @for (p of c.points; track $index) { <li>{{ p }}</li> }
            </ul>

            @if (c.items?.length) {
              <div class="lp-confirm-items">
                <span class="muted">Includes</span>
                <ul>
                  @for (t of c.items; track $index) { <li [title]="t">{{ t }}</li> }
                  @if (c.more) { <li class="muted">+ {{ c.more | number }} more</li> }
                </ul>
              </div>
            }

            @if (c.typeToConfirm) {
              <label class="lp-field">
                <span>Type <strong>{{ c.typeToConfirm }}</strong> to confirm</span>
                <input class="lp-input lp-confirm-input" autocomplete="off" spellcheck="false" maxlength="20"
                       [ngModel]="confirmTyped()" (ngModelChange)="confirmTyped.set($event)"
                       (keydown.enter)="confirmReady() && answerConfirm(true)" />
              </label>
            }

            <footer class="lp-modal-foot">
              <button type="button" class="lp-btn lp-confirm-cancel" (click)="answerConfirm(false)">Cancel</button>
              <button type="button" class="lp-btn" [class.danger-solid]="c.tone === 'danger'" [class.primary]="c.tone !== 'danger'"
                      (click)="answerConfirm(true)" [disabled]="!confirmReady()">{{ c.confirmLabel }}</button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .lp { max-width: 1360px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; }
    .lp-head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
    .lp-head h2 { margin: 0 0 4px; font-size: 1.35rem; font-weight: 800; }
    .lp-head p { margin: 0; max-width: 680px; font-size: 0.84rem; line-height: 1.45; }
    .lp-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .lp-card { background: var(--panel, #161b22); border: 1px solid var(--border, #30363d); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .lp-filters, .lp-chips, .lp-bar, .lp-pager { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .lp-spacer { flex: 1; }
    .lp-input { width: auto; background: transparent; color: inherit; border: 1px solid var(--border, #30363d); border-radius: 8px; padding: 7px 10px; font: inherit; font-size: 0.85rem; }
    .lp-input option { color: var(--text); background: var(--surface-2); }
    .lp-input.grow { flex: 1; min-width: 200px; width: auto; }
    .lp-btn, .lp-chip { background: transparent; color: inherit; border: 1px solid var(--border, #30363d); border-radius: 8px; padding: 6px 11px; cursor: pointer; font: inherit; font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s, border-color 0.15s; }
    .lp-btn:hover:not(:disabled), .lp-chip:hover { border-color: #6e7681; background: var(--ov-1); }
    .lp-btn.primary, .lp-chip.on { background: var(--brand, #7c3aed); border-color: transparent; color: #fff; }
    .lp-btn.dl-btn { background: rgba(35, 134, 54, 0.18); border-color: rgba(46, 160, 67, 0.55); color: var(--c-green); font-weight: 600; }
    .lp-btn.dl-btn:hover:not(:disabled) { background: rgba(46, 160, 67, 0.32); border-color: #3fb950; color: var(--text); }
    .lp-btn.use-btn { border-color: rgba(124, 58, 237, 0.45); color: var(--text-dim); }
    .lp-btn.use-btn.is-used { border-color: rgba(139, 148, 158, 0.4); color: var(--muted); }
    .lp-ico { width: 15px; height: 15px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
    .lp-chip { border-radius: 999px; }
    .lp-chip small { opacity: 0.75; margin-left: 4px; }
    .lp-btn:disabled { opacity: 0.45; cursor: default; }
    .lp-link { background: none; border: none; color: var(--brand, #a78bfa); cursor: pointer; font: inherit; font-size: 0.82rem; padding: 0; }
    .lp-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
    .lp-msg { margin: 0; padding: 8px 12px; border: 1px solid var(--border, #30363d); border-radius: 8px; font-size: 0.85rem; background: rgba(56, 139, 253, 0.1); }
    .lp-connect { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-color: rgba(56, 139, 253, 0.5); }
    .lp-connect p { margin: 4px 0 0; }
    .lp-btn.danger { color: var(--c-red); border-color: rgba(248, 81, 73, 0.5); }
    .lp-check { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; }
    .lp-items { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; --w: 210px; grid-template-columns: repeat(auto-fill, minmax(var(--w), 1fr)); }
    .lp-items.loading, .lp-table-wrap.loading { opacity: 0.55; }
    .lp-item { position: relative; display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--border, #30363d); border-radius: 12px; cursor: default; background: color-mix(in srgb, var(--surface) 45%, transparent); transition: border-color 0.15s, background 0.15s; }
    .lp-item:hover { background: rgba(124, 58, 237, 0.07); border-color: rgba(124, 58, 237, 0.35); }
    .lp-item.sel { border-color: var(--brand, #7c3aed); background: rgba(124, 58, 237, 0.14); }
    .lp-item.used .lp-title { opacity: 0.7; }
    .lp-item.used .lp-thumb-img { filter: saturate(0.55) brightness(0.8); }
    .lp-pick { position: absolute; top: 16px; left: 16px; z-index: 3; background: rgba(0, 0, 0, 0.55); border-radius: 6px; padding: 3px 5px; display: flex; cursor: pointer; }
    .lp-thumb { position: relative; aspect-ratio: 9 / 16; max-height: 100%; border-radius: 8px; overflow: hidden; display: grid; place-items: center; background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 55%, #000), var(--surface)); cursor: pointer; }
    .lp-thumb.wide { aspect-ratio: 16 / 9; }
    .lp-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease; }
    .lp-thumb:hover .lp-thumb-img { transform: scale(1.03); }
    .lp-thumb-overlay { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0, 0, 0, 0.18); transition: background 0.15s; }
    .lp-thumb:hover .lp-thumb-overlay { background: rgba(0, 0, 0, 0.38); }
    .lp-play-circle { width: 42px; height: 42px; border-radius: 50%; background: color-mix(in srgb, var(--surface-2) 78%, transparent); border: 1px solid var(--ov-5); color: var(--text); display: grid; place-items: center; box-shadow: 0 4px 14px rgba(0,0,0,0.45); transition: transform 0.15s, background 0.15s; }
    .lp-play-circle svg { width: 18px; height: 18px; }
    .lp-thumb:hover .lp-play-circle { transform: scale(1.1); background: var(--brand, #7c3aed); }
    .lp-inline-video { width: 100%; height: 100%; object-fit: contain; background: #000; display: block; }
    .lp-thumb-close, .lp-thumb-expand { position: absolute; top: 6px; right: 6px; z-index: 4; background: rgba(0,0,0,0.75); color: #fff; border: 1px solid var(--ov-5); border-radius: 6px; width: 26px; height: 26px; cursor: pointer; display: grid; place-items: center; font-size: 0.78rem; }
    .lp-thumb-expand { right: 36px; }
    .lp-fmt-pill { position: absolute; top: 6px; right: 6px; background: rgba(0, 0, 0, 0.65); color: #e6edf3; border-radius: 4px; padding: 1px 6px; font-size: 0.68rem; font-weight: 600; }
    .lp-dur { position: absolute; right: 6px; bottom: 6px; background: rgba(0, 0, 0, 0.72); color: #fff; border-radius: 4px; padding: 1px 6px; font-size: 0.72rem; font-weight: 600; }
    .lp-badge { position: absolute; left: 6px; bottom: 6px; border-radius: 4px; padding: 2px 7px; font-size: 0.7rem; font-weight: 600; color: var(--text); }
    .lp-badge.used { background: #238636; }
    .lp-badge.unused { background: rgba(31, 111, 235, 0.85); }
    .lp-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .lp-acts { display: flex; gap: 4px; align-items: stretch; flex-wrap: wrap; margin-top: auto; padding-top: 2px; }
    .lp-acts .grow { flex: 1 1 0; min-width: 30px; padding-inline: 4px; justify-content: center; }
    .lp-acts .act-lbl { display: none; }
    .m-small .act-sample, .m-small .act-drive { display: none; }
    .lp-item { container-type: inline-size; }
    @container (min-width: 480px) { .lp-acts .act-lbl { display: inline; } }
    .lp-btn.sm { padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; }
    .lp-btn.icon-only { padding: 4px 6px; }
    .lp-items.m-xl { --w: 300px; }
    .lp-items.m-large { --w: 230px; }
    .lp-items.m-medium { --w: 185px; }
    .lp-items.m-small { --w: 130px; gap: 8px; }
    .m-small .lp-meta, .m-small .lp-tags, .m-small .act-lbl { display: none; }
    .m-small .lp-acts .act-lbl, .m-list .lp-acts .act-lbl { display: none; }
    .m-small .lp-title { font-size: 0.74rem; }
    .m-small .lp-acts { justify-content: space-between; gap: 4px; }
    .m-medium .lp-meta { font-size: 0.72rem; }
    .m-list, .m-tiles, .m-content { grid-template-columns: 1fr; gap: 6px; }
    .m-list { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
    .m-list .lp-item, .m-tiles .lp-item, .m-content .lp-item { flex-direction: row; align-items: center; border-radius: 8px; }
    .m-list .lp-thumb { width: 42px; aspect-ratio: 9 / 16; flex: none; }
    .m-list .lp-dur, .m-list .lp-badge, .m-list .lp-fmt-pill, .m-list .lp-meta, .m-list .lp-tags, .m-list .act-lbl { display: none; }
    .m-list .lp-pick { position: static; background: none; padding: 0; }
    .m-list .lp-acts { margin-top: 0; flex-wrap: nowrap; }
    .m-tiles { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 8px; }
    .m-tiles .lp-thumb { width: 72px; aspect-ratio: 9 / 16; flex: none; }
    .m-tiles .lp-pick { left: 8px; top: 8px; }
    .m-tiles .lp-main, .m-content .lp-main { flex: 1; }
    .m-content .lp-thumb { width: 92px; aspect-ratio: 9 / 16; flex: none; }
    .m-content .lp-pick { left: 8px; top: 8px; }
    .lp-table-wrap { overflow-x: auto; }
    .lp-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
    .lp-table th { text-align: left; font-weight: 600; font-size: 0.76rem; color: var(--muted, #8b949e); padding: 6px 8px; border-bottom: 1px solid var(--border, #30363d); white-space: nowrap; }
    .lp-table td { padding: 7px 8px; border-bottom: 1px solid var(--border, #30363d); white-space: nowrap; vertical-align: middle; }
    .lp-table tr.used .c-name { opacity: 0.65; }
    .lp-table tbody tr:hover { background: rgba(124, 58, 237, 0.07); }
    .lp-table tr.sel { background: rgba(124, 58, 237, 0.16); }
    .lp-table .c-name { max-width: 280px; overflow: hidden; text-overflow: ellipsis; font-weight: 600; cursor: pointer; }
    .lp-table .c-sel { width: 28px; }
    .lp-table .c-sample { width: 52px; }
    .lp-table .c-act { text-align: right; }
    .lp-row-thumb { position: relative; width: 38px; height: 54px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border, #30363d); background: var(--surface); cursor: pointer; padding: 0; display: grid; place-items: center; }
    .lp-row-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .lp-row-play { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.35); color: var(--text); font-size: 0.75rem; }
    .lp-row-acts { display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end; }
    .lp-fmt-badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(124, 58, 237, 0.15); color: var(--text-dim); }
    .lp-fmt-badge.video { background: rgba(56, 139, 253, 0.15); color: var(--c-sky); }
    .lp-th { background: none; border: none; color: inherit; font: inherit; cursor: pointer; padding: 0; }
    .lp-empty { list-style: none; grid-column: 1 / -1; text-align: center; padding: 28px 0 !important; }
    .lp-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .lp-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; cursor: pointer; }
    .lp-title:hover { color: var(--muted); }
    .lp-meta { font-size: 0.76rem; }
    .lp-tag { font-size: 0.72rem; border: 1px solid var(--border, #30363d); border-radius: 999px; padding: 2px 9px; white-space: nowrap; display: inline-flex; align-items: center; }
    .lp-tag.used { background: rgba(46, 160, 67, 0.25); border-color: rgba(46, 160, 67, 0.5); color: var(--c-green); }
    .lp-tag.unused { background: rgba(56, 139, 253, 0.18); border-color: rgba(56, 139, 253, 0.45); color: var(--c-sky); }
    .lp-pager { font-size: 0.82rem; }

    /* Sample Modal */
    .lp-modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(4px); z-index: 1200; display: grid; place-items: center; padding: 16px; }
    .lp-modal { background: var(--surface-2); border: 1px solid var(--border-bright); border-radius: 16px; width: min(760px, 96vw); max-height: 92vh; display: flex; flex-direction: column; gap: 12px; padding: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.65); overflow: hidden; }
    .lp-modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .lp-modal-title-wrap h3 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 700; }
    .lp-modal-sub { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 0.78rem; color: var(--muted); }
    .lp-modal-close { background: transparent; border: 1px solid var(--border-bright); color: var(--text-dim); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
    .lp-modal-player-box { background: #000; border-radius: 12px; overflow: hidden; display: grid; place-items: center; max-height: 62vh; }
    .lp-modal-video { max-height: 62vh; max-width: 100%; width: auto; height: auto; display: block; }
    .lp-modal-meta-bar { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; flex-wrap: wrap; }
    .lp-modal-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--border); }
    .lp-modal-nav, .lp-modal-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .lp { width: 100%; max-width: 1760px; padding: clamp(12px, 2vw, 24px); }
    .lp-content { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .lp-head { padding: 8px 0; }
    .lp-head h2 { font-size: clamp(1.35rem, 2vw, 1.8rem); }
    .lp-card { min-width: 0; padding: clamp(12px, 1.5vw, 20px); }
    .lp-overview { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .lp-stat { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; padding: 16px; text-align: left; color: inherit; background: var(--panel, #161b22); border: 1px solid var(--border, #30363d); border-radius: 12px; box-shadow: none; }
    .lp-stat strong { font-size: 1.6rem; line-height: 1.2; }
    .lp-stat span { font-size: 0.8rem; color: var(--muted, #8b949e); }
    .lp-stat.on { border-color: var(--brand, #7c3aed); background: color-mix(in srgb, var(--brand, #7c3aed) 12%, var(--panel, #161b22)); }
    .lp-stat.on span { color: inherit; }
    .lp-filters { display: grid; grid-template-columns: minmax(200px, 2fr) repeat(4, minmax(0, 1fr)); align-items: end; gap: 12px; }
    .lp-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; font-size: 0.78rem; color: var(--muted, #8b949e); }
    .lp-input { width: 100%; min-width: 0; min-height: 44px; box-sizing: border-box; color: var(--text, #e6edf3); background: var(--bg, #0d1117); }
    .lp-filter-summary { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 0.82rem; }
    .lp-btn, .lp-chip, .lp-link { min-height: 40px; box-sizing: border-box; justify-content: center; max-width: 100%; box-shadow: none; }
    .lp-btn.sm { min-height: 36px; }
    .lp-chip { white-space: normal; text-align: left; overflow-wrap: anywhere; }
    .lp-dot { flex-shrink: 0; }
    .lp-btn:focus-visible, .lp-chip:focus-visible, .lp-stat:focus-visible, .lp-title:focus-visible,
    .lp-thumb-overlay:focus-visible, .lp-modal-close:focus-visible, .lp-thumb-close:focus-visible,
    .lp-thumb-expand:focus-visible, .lp-link:focus-visible, summary:focus-visible { outline: 2px solid #a5b4fc; outline-offset: 3px; }
    .lp-thumb-overlay:focus-visible { outline-offset: -4px; }
    .lp-bulk { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; border: 1px solid var(--border, #30363d); border-radius: 10px; background: rgba(124, 58, 237, 0.08); }
    .lp-btn.move-btn { border-color: rgba(88, 166, 255, 0.5); color: var(--c-sky); }
    .lp-download-settings { border-top: 1px solid var(--border, #30363d); padding-top: 10px; }
    .lp-download-settings summary { cursor: pointer; font-size: 0.82rem; padding: 6px 0; }
    .lp-download-settings summary span { display: inline-block; margin-left: 8px; color: var(--c-yellow); font-size: 0.75rem; }
    .lp-download-settings .lp-check { margin-top: 8px; }
    .lp-hint { margin: 4px 0; font-size: 0.8rem; line-height: 1.5; overflow-wrap: anywhere; }
    .lp-check { min-height: 40px; }
    .lp-check input, .lp-pick input { flex-shrink: 0; }
    .lp-pick { padding: 7px; min-width: 32px; min-height: 32px; box-sizing: border-box; align-items: center; justify-content: center; }
    .lp-results, .lp-table-wrap, .lp-item { min-width: 0; max-width: 100%; }
    .lp-results.unavailable { opacity: 0.55; }
    .lp-table-wrap { overscroll-behavior-x: contain; }
    .lp-items { grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--w)), 1fr)); align-items: stretch; }
    .lp-thumb { width: 100%; }
    .lp-thumb.square { aspect-ratio: 1; }
    .lp-thumb-overlay { padding: 0; width: 100%; height: 100%; border: 0; border-radius: 0; color: #fff; box-shadow: none; }
    .lp-thumb-overlay:hover { transform: none; }
    .lp-fmt-pill, .lp-dur, .lp-badge { pointer-events: none; }
    .lp-thumb-close, .lp-thumb-expand { width: 36px; height: 36px; padding: 0; }
    .lp-thumb-expand { right: 48px; }
    .lp-title { display: block; width: 100%; min-width: 0; padding: 0; border: 0; border-radius: 0; background: none; box-shadow: none; color: inherit; text-align: left; font: inherit; font-weight: 600; }
    .lp-meta { overflow-wrap: anywhere; }
    .lp-tag { max-width: 100%; white-space: normal; overflow-wrap: anywhere; box-sizing: border-box; }
    .m-list { grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); }
    .m-tiles { grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); }
    .m-content { grid-template-columns: minmax(0, 1fr); }
    .m-list .lp-item, .m-tiles .lp-item, .m-content .lp-item { display: grid; grid-template-columns: auto minmax(0, 1fr); }
    .m-list .lp-item { grid-template-columns: auto auto minmax(0, 1fr); }
    .m-list .lp-acts, .m-tiles .lp-acts, .m-content .lp-acts { grid-column: 1 / -1; flex-wrap: wrap; justify-content: flex-end; }
    .m-list .lp-acts { padding-top: 0; }
    .m-list .lp-thumb.wide, .m-tiles .lp-thumb.wide, .m-content .lp-thumb.wide { aspect-ratio: 16 / 9; }
    .lp-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; line-height: 1.6; }
    td.lp-empty { display: table-cell; }
    td.lp-empty .lp-btn { display: flex; margin: 12px auto 0; }
    .lp-error { border-color: rgba(248, 81, 73, 0.5); background: rgba(248, 81, 73, 0.08); }
    .lp-msg { overflow-wrap: anywhere; }
    .lp-modal-backdrop { box-sizing: border-box; padding: 12px; }
    .lp-modal { box-sizing: border-box; width: min(900px, 100%); max-height: calc(100dvh - 24px); overflow-y: auto; overscroll-behavior: contain; }
    .lp-modal-title-wrap { min-width: 0; }
    .lp-modal-title-wrap h3, .lp-modal-meta-bar { overflow-wrap: anywhere; }
    .lp-modal-close { flex-shrink: 0; width: 44px; height: 44px; padding: 0; display: grid; place-items: center; }
    .lp-modal-player-box { flex-shrink: 0; min-height: 120px; max-height: 55dvh; }
    .lp-modal-video { max-height: 55dvh; }
    .lp-modal-nav { font-size: 0.8rem; }
    @media (min-width: 2400px) { .lp { max-width: 2800px; } }
    .lp-move-backdrop { z-index: 1300; }
    .lp-move-modal { width: min(560px, 100%); }
    .lp-move-modal .lp-modal-sub { margin: 0; }
    .lp-topic-list { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: min(44dvh, 360px); overscroll-behavior: contain; }
    .lp-topic-opt { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; box-sizing: border-box; padding: 8px 12px; text-align: left; color: inherit; background: transparent; border: 1px solid var(--border, #30363d); border-radius: 10px; cursor: pointer; font: inherit; font-size: 0.88rem; box-shadow: none; }
    .lp-topic-opt:hover:not(:disabled) { border-color: #6e7681; background: var(--ov-1); }
    .lp-topic-opt:focus-visible, .lp-topic-new .lp-input:focus-visible { outline: 2px solid #a5b4fc; outline-offset: 2px; }
    .lp-topic-opt.on { border-color: var(--brand, #7c3aed); background: color-mix(in srgb, var(--brand, #7c3aed) 16%, transparent); }
    .lp-topic-opt.on::after { content: '✓'; font-weight: 700; color: var(--text-dim); }
    .lp-topic-opt:disabled { opacity: 0.55; cursor: default; }
    .lp-topic-opt .lp-dot { margin: 0; }
    .lp-dot.none { background: transparent; border: 1px dashed #6e7681; box-sizing: border-box; }
    .lp-topic-name { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .lp-topic-count { font-size: 0.74rem; color: var(--muted, #8b949e); border: 1px solid var(--border, #30363d); border-radius: 999px; padding: 1px 8px; }
    .lp-topic-new { display: flex; gap: 8px; align-items: center; }
    .lp-topic-new .lp-input { flex: 1; }
    .lp-move-modal .lp-modal-foot { justify-content: flex-end; }
    @media (max-width: 1100px) {
      .lp-filters { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .lp-search { grid-column: 1 / -1; }
    }
    @media (max-width: 600px) {
      .lp-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .lp-stat { padding: 12px; }
      .lp-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .lp-input { font-size: 16px; }
      .lp-btn, .lp-btn.sm, .lp-chip, .lp-link { min-height: 44px; }
      .lp-acts .grow { min-width: 40px; }
      .lp-head-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
      .lp-head-actions .lp-btn { font-size: 0.76rem; padding: 8px; }
      .lp-bulk .lp-btn { flex: 1 1 110px; }
      .lp-pager .lp-spacer { display: none; }
      .lp-pager { justify-content: center; }
      .lp-pager > .muted { flex-basis: 100%; text-align: center; }
      .lp-modal { padding: 12px; border-radius: 12px; }
      .lp-modal-actions, .lp-modal-nav { width: 100%; }
      .lp-modal-actions > * { flex: 1 1 120px; }
      .lp-move-modal .lp-modal-foot > .lp-btn { flex: 1 1 120px; }
      .lp-topic-new { flex-wrap: wrap; }
      .lp-topic-new .lp-btn { flex: 1 1 100%; }
    }
    /* Progress panel */
    .lp-progress { position: sticky; top: 8px; z-index: 20; display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border: 1px solid rgba(124, 58, 237, 0.5); border-radius: 12px; background: color-mix(in srgb, var(--brand, #7c3aed) 10%, var(--panel, #161b22)); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
    .lp-progress.danger { border-color: rgba(248, 81, 73, 0.55); background: color-mix(in srgb, #f85149 8%, var(--panel, #161b22)); }
    .lp-progress.slim { position: static; padding: 8px 12px; gap: 6px; box-shadow: none; border-color: var(--border, #30363d); background: var(--panel, #161b22); }
    .lp-progress.slim .lp-progress-head { font-size: 0.8rem; color: var(--muted, #8b949e); }
    .lp-progress.slim .lp-progress-track { height: 4px; }
    .lp-progress-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.86rem; }
    .lp-progress-head .muted { font-size: 0.8rem; }
    .lp-progress-count { font-variant-numeric: tabular-nums; font-size: 0.8rem; color: var(--muted, #8b949e); }
    .lp-progress-track { position: relative; height: 8px; border-radius: 999px; background: var(--ov-1, rgba(255, 255, 255, 0.06)); overflow: hidden; }
    .lp-progress-fill { position: relative; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand, #7c3aed), #a78bfa); transition: width 0.35s ease; overflow: hidden; }
    .lp-progress-fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent); animation: lp-shimmer 1.4s linear infinite; }
    .lp-progress.danger .lp-progress-fill { background: linear-gradient(90deg, #da3633, #f85149); }
    .lp-progress-track.indeterminate .lp-progress-fill { position: absolute; top: 0; width: 35%; animation: lp-indeterminate 1.3s ease-in-out infinite; }
    .lp-progress-failed { color: var(--c-red, #f85149); font-size: 0.78rem; }
    .lp-spinner { width: 14px; height: 14px; flex-shrink: 0; box-sizing: border-box; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: lp-spin 0.8s linear infinite; opacity: 0.8; }
    .lp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
    @keyframes lp-shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
    @keyframes lp-indeterminate { 0% { left: -35%; } 100% { left: 100%; } }
    @keyframes lp-spin { to { transform: rotate(360deg); } }

    /* Warning dialog */
    .lp-confirm-backdrop { z-index: 1400; }
    .lp-confirm { width: min(540px, 100%); gap: 14px; border-color: rgba(210, 153, 34, 0.5); }
    .lp-confirm.danger { border-color: rgba(248, 81, 73, 0.55); }
    .lp-confirm-top { display: flex; gap: 14px; align-items: flex-start; }
    .lp-confirm-icon { flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: rgba(210, 153, 34, 0.15); color: var(--c-yellow, #d29922); }
    .lp-confirm.danger .lp-confirm-icon { background: rgba(248, 81, 73, 0.14); color: var(--c-red, #f85149); }
    .lp-confirm-icon svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .lp-confirm h3 { margin: 0 0 4px; font-size: 1.1rem; font-weight: 700; }
    .lp-confirm-lead { margin: 0; font-size: 0.86rem; line-height: 1.5; color: var(--text-dim, #c9d1d9); }
    .lp-confirm-points { margin: 0; padding: 10px 14px 10px 30px; border: 1px solid var(--border, #30363d); border-radius: 10px; background: var(--ov-1, rgba(255, 255, 255, 0.04)); font-size: 0.83rem; line-height: 1.55; display: flex; flex-direction: column; gap: 4px; }
    .lp-confirm-items { font-size: 0.8rem; }
    .lp-confirm-items ul { list-style: none; margin: 6px 0 0; padding: 8px 10px; max-height: 140px; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 3px; border: 1px solid var(--border, #30363d); border-radius: 8px; }
    .lp-confirm-items li { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lp-confirm-input { letter-spacing: 0.08em; }
    .lp-confirm .lp-modal-foot { justify-content: flex-end; }
    .lp-btn.danger-solid { background: #da3633; border-color: transparent; color: #fff; font-weight: 600; }
    .lp-btn.danger-solid:hover:not(:disabled) { background: #f85149; border-color: transparent; }
    @media (max-width: 600px) {
      .lp-confirm .lp-modal-foot > .lp-btn { flex: 1 1 120px; }
      .lp-progress { top: 4px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .lp-progress-fill, .lp-progress-fill::after, .lp-spinner { animation: none; transition: none; }
      .lp-progress-track.indeterminate .lp-progress-fill { left: 0; width: 100%; opacity: 0.6; }
      .lp-btn, .lp-chip, .lp-item, .lp-thumb-img, .lp-thumb-overlay, .lp-play-circle { transition: none; }
      .lp-thumb:hover .lp-thumb-img, .lp-thumb:hover .lp-play-circle { transform: none; }
    }
  `],
})
export class ShortsLibraryPageComponent implements OnDestroy {
  private readonly api = inject(ShortsService);
  private readonly media = inject(MediaTicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly youtube = inject(YouTubePublishService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly calendar = inject(ContentCalendarService);
  private readonly sampleDialog = viewChild<ElementRef<HTMLElement>>('sampleDialog');
  private readonly moveDialogEl = viewChild<ElementRef<HTMLElement>>('moveDialogEl');
  private readonly moveSearchEl = viewChild<ElementRef<HTMLInputElement>>('moveSearchEl');
  private readonly confirmDialogEl = viewChild<ElementRef<HTMLElement>>('confirmDialogEl');
  private sampleOrigin: HTMLElement | null = null;
  private confirmOrigin: HTMLElement | null = null;
  private confirmResolve: ((ok: boolean) => void) | null = null;
  private stopRequested = false;
  private destroyed = false;

  readonly driveState = signal<'unknown' | 'ok' | 'missing' | 'reconnect'>('unknown');
  readonly driveBusy = signal(false);

  readonly pageSizes = [10, 25, 50, 100];
  readonly modes: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'xl', label: 'Extra large icons', icon: '▣' },
    { id: 'large', label: 'Large icons', icon: '▢' },
    { id: 'medium', label: 'Medium icons', icon: '◫' },
    { id: 'small', label: 'Small icons', icon: '▦' },
    { id: 'list', label: 'List', icon: '☰' },
    { id: 'details', label: 'Details', icon: '▤' },
    { id: 'tiles', label: 'Tiles', icon: '◧' },
    { id: 'content', label: 'Content', icon: '≣' },
  ];
  readonly mode = signal<ViewMode>(this.savedMode());
  readonly empty: ReadonlySet<string> = new Set();

  readonly data = signal<LibraryPage | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly loadError = signal(false);
  readonly loadErrorMessage = signal('');
  readonly previewError = signal<string | null>(null);
  readonly op = signal<OpProgress | null>(null);
  readonly opPercent = computed(() => {
    const o = this.op();
    return o?.total ? Math.min(100, Math.round((o.done / o.total) * 100)) : 0;
  });
  /** A sliver stays visible at 0% so a started bar never looks empty. */
  readonly opWidth = computed(() => Math.max(3, this.opPercent()));
  readonly stopping = signal(false);
  readonly importing = signal(false);
  readonly confirmDialog = signal<ConfirmSpec | null>(null);
  readonly confirmTyped = signal('');
  readonly confirmReady = computed(() => {
    const word = this.confirmDialog()?.typeToConfirm;
    return !word || this.confirmTyped().trim().toUpperCase() === word;
  });

  readonly search = signal('');
  readonly topicId = signal('');
  readonly view = signal<LibraryView>('active');
  readonly sort = signal<Sort>('newest');
  readonly formatFilter = signal<FormatFilter>('all');
  readonly page = signal(1);
  readonly pageSize = signal(25);

  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly usedBatchCount = computed(() => Math.min(200, this.data()?.counts.used ?? 0));
  readonly moveDialog = signal<{ ids: string[]; currentTopicId: string | null } | null>(null);
  /** undefined: nothing chosen yet; null: file under no topic. */
  readonly moveChoice = signal<string | null | undefined>(undefined);
  readonly moveSearch = signal('');
  readonly moveTopics = signal<ContentTopic[]>([]);
  readonly moveTopicsLoading = signal(false);
  readonly moveTopicsError = signal<string | null>(null);
  readonly moveSaving = signal(false);
  readonly moveError = signal<string | null>(null);
  readonly newTopicName = signal('');
  readonly creatingTopic = signal(false);
  readonly moveList = computed(() => {
    const q = this.moveSearch().trim().toLowerCase();
    return this.moveTopics()
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  readonly moveShowsNone = computed(() => {
    const q = this.moveSearch().trim().toLowerCase();
    return !q || 'no topic'.includes(q);
  });
  readonly moveChoiceName = computed(() => this.moveTopics().find((t) => t.id === this.moveChoice())?.name ?? 'topic');
  private moveOrigin: HTMLElement | null = null;
  private moveRequest = 0;
  readonly autoArchive = signal(true);
  readonly removeMissingOnSync = signal(this.savedRemoveMissing());

  /** Inline video sample playing inside a card, or full modal sample item. */
  readonly playingInlineId = signal<string | null>(null);
  readonly sampleItem = signal<LibraryItem | null>(null);
  readonly failedThumbs = signal<ReadonlySet<string>>(new Set());

  readonly pageItems = computed(() => this.data()?.items ?? []);
  readonly selectedOnPage = computed(() => this.pageItems().filter(i => this.selected().has(i.handoffId)));
  readonly someOnPageSelected = computed(() => this.selectedOnPage().length > 0 && !this.allOnPageSelected());
  readonly activeTopicName = computed(() => this.topicId() === 'none' ? 'No topic'
    : this.topicId() ? this.data()?.topics.find(t => t.topicId === this.topicId())?.name ?? 'Selected topic' : 'All topics');

  readonly sampleIndex = computed(() => {
    const cur = this.sampleItem();
    if (!cur) return -1;
    return this.pageItems().findIndex((i) => i.handoffId === cur.handoffId);
  });

  readonly allOnPageSelected = computed(() => {
    const items = this.pageItems();
    return items.length > 0 && items.every((i) => this.selected().has(i.handoffId));
  });
  readonly hasFilters = computed(() => !!this.search().trim() || !!this.topicId() || this.view() !== 'active' || this.formatFilter() !== 'all');

  readonly views = computed(() => {
    const c = this.data()?.counts;
    return [
      { id: 'active' as LibraryView, label: 'All active', count: c?.active ?? 0 },
      { id: 'unused' as LibraryView, label: 'Unused', count: c?.unused ?? 0 },
      { id: 'used' as LibraryView, label: 'Used', count: c?.used ?? 0 },
      { id: 'archived' as LibraryView, label: 'Archive', count: c?.archived ?? 0 },
    ];
  });

  readonly rangeText = computed(() => {
    const d = this.data();
    if (!d || d.total === 0) return '0 items';
    const from = (d.page - 1) * d.pageSize + 1;
    return `${from}–${Math.min(d.total, from + d.items.length - 1)} of ${d.total}`;
  });

  private debounce: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;

  constructor() {
    effect(() => {
      const dialog = this.sampleDialog()?.nativeElement;
      if (dialog) dialog.querySelector<HTMLButtonElement>('.lp-modal-close')?.focus();
    });
    effect(() => { this.moveSearchEl()?.nativeElement.focus(); });
    effect(() => {
      // Cancel is the safe default; a type-to-confirm dialog starts in its input instead.
      const dialog = this.confirmDialogEl()?.nativeElement;
      if (dialog) (dialog.querySelector<HTMLElement>('.lp-confirm-input') ?? dialog.querySelector<HTMLElement>('.lp-confirm-cancel'))?.focus();
    });
    const initialTopic = this.route.snapshot.queryParamMap.get('topic');
    if (initialTopic) {
      this.topicId.set(initialTopic);
    }
    this.reload();
    this.checkDriveConnection();
    this.importing.set(true);
    this.api.importFromDrive().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (imp) => {
        this.importing.set(false);
        if (imp.added > 0 || imp.topicsAdded > 0) {
          this.message.set(`${imp.added} video(s) imported from Google Drive.`);
          this.reload(false);
        }
      },
      error: () => {
        this.importing.set(false);
        this.message.set('Could not import videos from Drive. Existing library items are still available; use Sync Drive to retry.');
      },
    });
  }

  private checkDriveConnection(): void {
    this.youtube.driveConnections().pipe(timeout(30_000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (list) => {
        if (list.some((d) => d.connected && !d.needsReconnect)) this.driveState.set('ok');
        else this.driveState.set(list.some((d) => d.connected && d.needsReconnect) ? 'reconnect' : 'missing');
      },
      error: () => {
        this.driveState.set('unknown');
        this.message.set('Could not check the Google Drive connection. Refresh to retry.');
      },
    });
  }

  connectDrive(): void {
    this.driveBusy.set(true);
    this.youtube.startDriveConnect('/shorts/library').subscribe({
      next: (url) => {
        if (!url.startsWith('https://accounts.google.com/')) {
          this.driveBusy.set(false);
          this.message.set('Unexpected Google sign-in URL.');
          return;
        }
        window.location.assign(url);
      },
      error: (e: Error) => {
        this.driveBusy.set(false);
        this.message.set(e.message || 'Could not connect Google Drive.');
      },
    });
  }

  ngOnDestroy(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.destroyed = true;
    this.stopRequested = true;
    this.confirmResolve?.(false);
    this.confirmResolve = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmDialog()) {
      this.answerConfirm(false);
    } else if (this.moveDialog()) {
      this.closeMove();
    } else if (this.sampleItem()) {
      this.closeSample();
    } else if (this.playingInlineId()) {
      this.playingInlineId.set(null);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDialogKey(event: KeyboardEvent): void {
    const dialog = (this.confirmDialogEl() ?? this.moveDialogEl() ?? this.sampleDialog())?.nativeElement;
    if (!dialog || event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], video[controls], [tabindex="0"]')];
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Opens the warning dialog; resolves true only when the user confirms. */
  private ask(spec: ConfirmSpec): Promise<boolean> {
    this.confirmResolve?.(false);
    this.confirmOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.confirmTyped.set('');
    this.confirmDialog.set(spec);
    return new Promise((resolve) => { this.confirmResolve = resolve; });
  }

  answerConfirm(ok: boolean): void {
    if (ok && !this.confirmReady()) return;
    const resolve = this.confirmResolve;
    this.confirmResolve = null;
    this.confirmDialog.set(null);
    const origin = this.confirmOrigin;
    this.confirmOrigin = null;
    afterNextRender(() => { if (origin?.isConnected) origin.focus(); }, { injector: this.injector });
    resolve?.(ok);
  }

  stepNumber(o: OpProgress): number {
    return Math.min(o.done + 1, o.total);
  }

  stopOp(): void {
    this.stopRequested = true;
    this.stopping.set(true);
  }

  /** Up to five known titles for the dialog, with how many more are not listed. */
  private preview(ids: string[]): { items: string[]; more: number } {
    const known = new Map(this.pageItems().map((i) => [i.handoffId, i.title || 'Short']));
    const items = ids.map((id) => known.get(id)).filter((t): t is string => !!t).slice(0, 5);
    return { items, more: ids.length - items.length };
  }

  private plural(n: number, word: string): string {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
  }

  formatLabel(item: LibraryItem): string {
    return item.format === 'video' ? '16:9 Video' : item.format === 'square' ? '1:1 Square'
      : item.format === 'short' ? '9:16 Short' : 'Unknown format';
  }

  onPreviewError(item: LibraryItem): void {
    // A media ticket voided by a server restart: renewing it re-signs the src and the player retries.
    this.media.recover().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((renewed) => {
      if (!renewed) this.showPreviewError(item);
    });
  }

  private showPreviewError(item: LibraryItem): void {
    const text = `Could not play "${item.title || 'short'}". Try opening it in Google Drive${item.driveUrl ? ' using the Drive link' : ' after syncing the library'}.`;
    if (this.sampleItem()?.handoffId === item.handoffId) this.previewError.set(text);
    else {
      this.playingInlineId.set(null);
      this.message.set(text);
    }
  }

  mb(bytes: number): string {
    return (bytes / 1_048_576).toFixed(1);
  }

  showThumb(item: LibraryItem): boolean {
    return ((item.hasLocalPreview ?? true) || !!item.driveUrl) && !this.failedThumbs().has(this.thumbKey(item.handoffId));
  }

  /** A failure counts for the ticket it was signed with, so a renewed ticket retries every thumbnail. */
  private thumbKey(handoffId: string): string {
    return `${handoffId}|${this.media.ticket() ?? ''}`;
  }

  thumbUrl(item: LibraryItem): string {
    return this.api.thumbnailUrl(item.handoffId, 360);
  }

  streamUrl(item: LibraryItem): string {
    return this.api.streamUrl(item.handoffId);
  }

  onThumbError(handoffId: string): void {
    const key = this.thumbKey(handoffId);
    this.failedThumbs.update((set) => {
      const next = new Set(set);
      next.add(key);
      return next;
    });
    this.media.recover().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onThumbClick(item: LibraryItem): void {
    const m = this.mode();
    if (m === 'xl' || m === 'large' || m === 'medium') {
      this.playingInlineId.set(this.playingInlineId() === item.handoffId ? null : item.handoffId);
    } else {
      this.openSample(item);
    }
  }

  stopInline(event: Event): void {
    event.stopPropagation();
    this.playingInlineId.set(null);
  }

  openSample(item: LibraryItem, event?: Event): void {
    event?.stopPropagation();
    this.sampleOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.previewError.set(null);
    this.playingInlineId.set(null);
    this.sampleItem.set(item);
  }

  closeSample(): void {
    this.sampleItem.set(null);
    this.previewError.set(null);
    const origin = this.sampleOrigin;
    afterNextRender(() => { if (origin?.isConnected) origin.focus(); }, { injector: this.injector });
  }

  stepSample(delta: -1 | 1): void {
    const idx = this.sampleIndex();
    const list = this.pageItems();
    const next = list[idx + delta];
    if (next) { this.previewError.set(null); this.sampleItem.set(next); }
  }

  private savedMode(): ViewMode {
    const v = localStorage.getItem('shorts.library.view');
    return (['xl', 'large', 'medium', 'small', 'list', 'details', 'tiles', 'content'] as string[]).includes(v ?? '') ? v as ViewMode : 'large';
  }

  private savedRemoveMissing(): boolean {
    try {
      return localStorage.getItem('shorts.library.removeMissing') !== 'false';
    } catch {
      return true;
    }
  }

  setRemoveMissingOnSync(on: boolean): void {
    this.removeMissingOnSync.set(on);
    try {
      localStorage.setItem('shorts.library.removeMissing', String(on));
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
  }

  setMode(m: ViewMode): void {
    this.playingInlineId.set(null);
    this.mode.set(m);
    localStorage.setItem('shorts.library.view', m);
  }

  emptyText(): string {
    return this.loadError() ? 'Library unavailable. Use Retry above.'
      : this.loading() ? 'Loading…'
      : this.hasFilters() ? 'No videos or shorts match these filters.'
      : 'Nothing here yet. Videos and shorts appear once exported with a topic or saved to Google Drive.';
  }

  /** Date switches direction; name sorts A-Z and status sorts recently used first. */
  sortBy(col: 'name' | 'date' | 'used'): void {
    const next: Sort = col === 'name' ? 'name' : col === 'used' ? 'used' : this.sort() === 'newest' ? 'oldest' : 'newest';
    this.setSort(next);
  }

  arrow(col: 'name' | 'date' | 'used'): string {
    const s = this.sort();
    if (col === 'name') return s === 'name' ? '▲' : '';
    if (col === 'used') return s === 'used' ? '▼' : '';
    return s === 'newest' ? '▼' : s === 'oldest' ? '▲' : '';
  }

  onSearch(value: string): void {
    this.search.set(value);
    ++this.requestId;
    this.loading.set(true);
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.page.set(1); this.reload(); }, 300);
  }

  setView(v: LibraryView): void { this.view.set(v); this.page.set(1); this.reload(); }
  setFormat(f: FormatFilter): void { this.formatFilter.set(f); this.page.set(1); this.reload(); }
  setTopic(id: string): void { this.topicId.set(id); this.page.set(1); this.reload(); }
  setSort(s: Sort): void { this.sort.set(s); this.page.set(1); this.reload(); }
  setPageSize(n: number): void { this.pageSize.set(Number(n)); this.page.set(1); this.reload(); }
  go(p: number): void { this.page.set(Math.max(1, p)); this.reload(false); }

  resetFilters(): void {
    this.search.set('');
    this.topicId.set('');
    this.view.set('active');
    this.formatFilter.set('all');
    this.page.set(1);
    this.reload();
  }

  private query(): LibraryQuery {
    const format = this.formatFilter();
    return {
      search: this.search().trim() || undefined,
      topicId: this.topicId() || undefined,
      view: this.view(),
      sort: this.sort(),
      format: format === 'all' ? undefined : format,
      page: this.page(),
      pageSize: this.pageSize(),
    };
  }

  /** Loads the current page; a filter change also drops the selection (it may no longer be visible). */
  reload(clearSelection = true): void {
    if (this.debounce) { clearTimeout(this.debounce); this.debounce = null; }
    const id = ++this.requestId;
    this.loading.set(true);
    this.loadError.set(false);
    this.playingInlineId.set(null);
    if (clearSelection) this.selected.set(new Set());
    this.api.libraryItems(this.query()).pipe(timeout(60_000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        if (id !== this.requestId) return;
        this.data.set(d);
        this.page.set(d.page);
        this.loading.set(false);
        const curSample = this.sampleItem();
        if (curSample) {
          const updated = d.items.find((i) => i.handoffId === curSample.handoffId);
          if (updated) this.sampleItem.set(updated);
          else this.closeSample();
        }
      },
      error: (error: unknown) => {
        if (id !== this.requestId) return;
        this.loading.set(false);
        this.loadError.set(true);
        this.loadErrorMessage.set(error instanceof TimeoutError
          ? 'The library took too long to respond. The backend may be restarting or busy. Try again shortly.'
          : error instanceof ApiFailure ? `${error.message}${error.hint ? ' ' + error.hint : ''}`
            : 'Could not update the library. Check your connection and try again.');
        this.selected.set(new Set());
      },
    });
  }

  async syncDrive(): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    let imported = '';
    const removeMissing = this.removeMissingOnSync();
    const step = (done: number, title: string, detail: string) =>
      this.op.set({ title, detail, done, total: 2, failed: 0, tone: 'brand', steps: true });
    try {
      step(0, 'Reading your Google Drives', 'Finding new videos and topic folders…');
      const imp = await firstValueFrom(this.api.importFromDrive().pipe(takeUntilDestroyed(this.destroyRef)));
      imported = `${imp.added} imported from ${imp.drives} Drive(s)${imp.topicsAdded ? `, ${imp.topicsAdded} new topic(s)` : ''}${imp.skippedDrives ? `; ${imp.skippedDrives} Drive(s) could not be checked` : ''}.`;
      step(1, 'Checking files & organizing topic folders', removeMissing ? 'Videos deleted on Drive are removed here too…' : 'Videos deleted on Drive are flagged as missing…');
      const res = await firstValueFrom(this.api.checkDrive(true, removeMissing).pipe(takeUntilDestroyed(this.destroyRef)));
      step(2, 'Drive sync complete', '');
      const gone = res.removed ? `${res.removed} deleted on Drive and removed from the library` : `${res.missing} missing`;
      this.message.set(`Drive checked: ${res.present} present, ${res.moved} organized, ${gone}, ${res.failed} failed${res.error ? `: ${res.error}` : '.'} ${imported}`);
    } catch {
      if (this.destroyed) return;
      this.message.set(`${imported ? imported + ' ' : ''}Could not complete Drive sync. Please try again.`);
    }
    this.busy.set(false);
    this.op.set(null);
    this.reload(false);
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    if (!next.delete(id)) next.add(id);
    if (!this.checkSelectionLimit(next.size)) return;
    this.selected.set(next);
  }

  togglePage(): void {
    const next = new Set(this.selected());
    const ids = this.pageItems().map((i) => i.handoffId);
    if (this.allOnPageSelected()) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    if (!this.checkSelectionLimit(next.size)) return;
    this.selected.set(next);
  }

  private checkSelectionLimit(count: number): boolean {
    if (count <= 200) return true;
    this.message.set('Bulk actions support up to 200 videos at a time. Narrow the filters or clear your selection before selecting more.');
    return false;
  }

  selectAllMatching(): void {
    const request = this.requestId;
    this.busy.set(true);
    this.api.libraryIds(this.query()).pipe(timeout(60_000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (ids) => {
        this.busy.set(false);
        if (request !== this.requestId) return;
        if (ids.length > 200) {
          this.message.set('Bulk actions support up to 200 videos at a time. Narrow the topic or format filters, or select individual pages.');
          return;
        }
        this.selected.set(new Set(ids));
      },
      error: () => { this.busy.set(false); this.message.set('Could not select every match.'); },
    });
  }

  openMove(ids: string[]): void {
    if (!ids.length || this.busy()) return;
    this.moveOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const only = ids.length === 1 ? this.pageItems().find((i) => i.handoffId === ids[0]) : undefined;
    this.playingInlineId.set(null);
    this.moveChoice.set(undefined);
    this.moveSearch.set('');
    this.newTopicName.set('');
    this.moveError.set(null);
    this.moveDialog.set({ ids: [...ids], currentTopicId: only?.topicId ?? null });
    this.loadMoveTopics();
  }

  closeMove(): void {
    if (this.moveSaving()) return;
    this.moveRequest++;
    this.moveTopicsLoading.set(false);
    this.moveDialog.set(null);
    const origin = this.moveOrigin;
    this.moveOrigin = null;
    afterNextRender(() => { if (origin?.isConnected) origin.focus(); }, { injector: this.injector });
  }

  loadMoveTopics(): void {
    const request = ++this.moveRequest;
    this.moveTopicsLoading.set(true);
    this.moveTopicsError.set(null);
    this.calendar.listTopics().pipe(timeout(30_000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (topics) => {
        if (request !== this.moveRequest) return;
        this.moveTopics.set(topics.filter((t) => !t.archived));
        this.moveTopicsLoading.set(false);
      },
      error: () => {
        if (request !== this.moveRequest) return;
        this.moveTopicsLoading.set(false);
        this.moveTopicsError.set('Could not load your topics. Check your connection and retry.');
      },
    });
  }

  moveCount(topicId: string): number {
    return this.data()?.topics.find((t) => t.topicId === topicId)?.shorts ?? 0;
  }

  createMoveTopic(): void {
    const name = this.newTopicName().trim();
    if (!name || this.creatingTopic() || this.moveSaving()) return;
    const existing = this.moveTopics().find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      this.moveChoice.set(existing.id);
      this.newTopicName.set('');
      this.moveSearch.set('');
      return;
    }
    this.creatingTopic.set(true);
    this.moveError.set(null);
    this.calendar.createTopic(newTopicRequest(name)).pipe(timeout(30_000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (topic) => {
        this.creatingTopic.set(false);
        this.moveTopics.update((list) => [...list, topic]);
        this.moveChoice.set(topic.id);
        this.newTopicName.set('');
        this.moveSearch.set('');
      },
      error: () => {
        this.creatingTopic.set(false);
        this.moveError.set('Could not create that topic. Try again.');
      },
    });
  }

  confirmMove(): void {
    const dialog = this.moveDialog();
    const choice = this.moveChoice();
    if (!dialog || choice === undefined || this.moveSaving() || this.creatingTopic()) return;
    const destination = choice === null ? 'their topic' : this.moveChoiceName();
    this.moveSaving.set(true);
    this.moveError.set(null);
    this.busy.set(true);
    this.api.moveToTopic(dialog.ids, choice).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.moveSaving.set(false);
        const moved = new Set(dialog.ids);
        this.selected.update((current) => new Set([...current].filter((id) => !moved.has(id))));
        this.report(result, choice === null ? 'removed from their topic' : `moved to ${destination}`);
        this.closeMove();
        this.reload(false);
      },
      error: () => {
        this.busy.set(false);
        this.moveSaving.set(false);
        this.moveError.set('Could not move the videos. Please try again.');
      },
    });
  }

  async setUsed(used: boolean): Promise<void> {
    const ids = [...this.selected()];
    if (used && !(await this.confirmAutoDelete(ids, 'Mark used'))) return;
    const autoDelete = used && this.autoArchive();
    await this.runBatches(ids, (chunk) => this.api.markUsed(chunk, used, this.autoArchive()), {
      title: used ? (autoDelete ? 'Marking used & deleting from Drive' : 'Marking used') : 'Marking unused',
      verb: used ? (autoDelete ? 'marked used and deleted' : 'marked used') : 'marked unused',
      tone: autoDelete ? 'danger' : 'brand',
    });
  }

  /** Direct 1-click Used / Unused toggle on an individual card or row. */
  async toggleItemUsed(item: LibraryItem): Promise<void> {
    const nextUsed = !item.usedAt;
    if (nextUsed && !(await this.confirmAutoDelete([item.handoffId], 'Mark used'))) return;
    const autoDelete = nextUsed && this.autoArchive();
    await this.runBatches([item.handoffId], (chunk) => this.api.markUsed(chunk, nextUsed, this.autoArchive()), {
      title: nextUsed ? (autoDelete ? 'Marking used & deleting from Drive' : 'Marking used') : 'Marking unused',
      verb: nextUsed ? (autoDelete ? 'marked used and deleted' : 'marked used') : 'marked unused',
      tone: autoDelete ? 'danger' : 'brand',
    });
  }

  archiveSelected(): void {
    void this.runBatches([...this.selected()], (chunk) => this.api.archive(chunk), { title: 'Archiving', verb: 'archived', tone: 'brand' });
  }

  restoreSelected(): void {
    void this.runBatches([...this.selected()], (chunk) => this.api.restore(chunk), { title: 'Restoring', verb: 'restored', tone: 'brand' });
  }

  /** Looks up exactly which used videos will go, warns with that number, then deletes them in batches. */
  async deleteUsed(): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    this.op.set({ title: 'Finding used videos', detail: '', done: 0, total: 0, failed: 0, tone: 'danger' });
    let ids: string[];
    try {
      ids = await firstValueFrom(this.api.libraryIds({ view: 'used', page: 1, pageSize: 200 }).pipe(timeout(60_000), takeUntilDestroyed(this.destroyRef)));
    } catch {
      if (this.destroyed) return;
      this.busy.set(false);
      this.op.set(null);
      this.message.set('Could not look up the used videos. Nothing was deleted. Please try again.');
      return;
    }
    this.busy.set(false);
    this.op.set(null);
    ids = ids.slice(0, 200);
    if (!ids.length) {
      this.message.set('There are no used videos to delete.');
      this.reload(false);
      return;
    }
    const ok = await this.ask({
      tone: 'danger',
      title: `Delete ${this.plural(ids.length, 'used video')}?`,
      lead: 'This removes them from the library and from Google Drive, so both stay in sync.',
      points: [
        'They leave the Drive & Topics Library (every topic) for good.',
        'Their Google Drive files go to the Drive trash, so your topic folders match this library.',
        'Google keeps trashed files for about 30 days; restore one from the Drive trash if needed.',
        'Unused and archived-only videos are not touched.',
      ],
      ...this.preview(ids),
      typeToConfirm: ids.length > 10 ? 'DELETE' : undefined,
      confirmLabel: `Delete ${this.plural(ids.length, 'video')}`,
    });
    if (!ok) return;
    await this.runBatches(ids, (chunk) => this.api.deleteArchived(chunk), { title: 'Deleting from library & Google Drive', verb: 'deleted', tone: 'danger' });
  }

  async deleteSelected(): Promise<void> {
    const ids = [...this.selected()];
    const unusedOnPage = this.selectedOnPage().filter((i) => !i.usedAt && !i.archived).length;
    const ok = await this.ask({
      tone: 'danger',
      title: `Delete ${this.plural(ids.length, 'video')}?`,
      lead: 'This removes them from the library and from Google Drive, so both stay in sync.',
      points: [
        'They leave the Drive & Topics Library for good.',
        'Their Google Drive files go to the Drive trash, so your topic folders match this library.',
        'Google keeps trashed files for about 30 days; restore one from the Drive trash if needed.',
        ...(unusedOnPage ? [`${this.plural(unusedOnPage, 'unused video')} in this selection will be skipped. Only used or archived videos can be deleted.`] : []),
      ],
      ...this.preview(ids),
      typeToConfirm: ids.length > 10 ? 'DELETE' : undefined,
      confirmLabel: `Delete ${this.plural(ids.length, 'video')}`,
    });
    if (!ok) return;
    await this.runBatches(ids, (chunk) => this.api.deleteArchived(chunk), { title: 'Deleting from library & Google Drive', verb: 'deleted', tone: 'danger' });
  }

  async downloadOne(item: LibraryItem): Promise<void> {
    if (!(await this.confirmReuse([item])) || !(await this.confirmAutoDelete([item.handoffId], 'Download'))) return;
    await this.downloadAll([item]);
  }

  async downloadSelected(): Promise<void> {
    const chosen = this.selectedOnPage();
    if (chosen.length === 0) {
      this.message.set('Downloads run for the items on this page; select them here first.');
      return;
    }
    if (!(await this.confirmReuse(chosen)) || !(await this.confirmAutoDelete(chosen.map((i) => i.handoffId), 'Download'))) return;
    await this.downloadAll(chosen);
  }

  /** A used short shouldn't be posted twice, so downloading one asks first. */
  private confirmReuse(items: LibraryItem[]): Promise<boolean> {
    const used = items.filter((i) => i.usedAt);
    if (!used.length) return Promise.resolve(true);
    return this.ask({
      tone: 'warn',
      title: used.length === 1 && items.length === 1 ? 'Already used. Download again?' : `${used.length} of ${items.length} already used`,
      lead: `${used.length === 1 ? 'This video was' : 'These videos were'} marked used earlier, so ${used.length === 1 ? 'it' : 'they'} may already be posted.`,
      points: ['Posting the same video twice can hurt reach on YouTube and Instagram.'],
      ...this.preview(used.map((i) => i.handoffId)),
      confirmLabel: 'Download anyway',
    });
  }

  private confirmAutoDelete(ids: string[], action: 'Download' | 'Mark used'): Promise<boolean> {
    if (!this.autoArchive()) return Promise.resolve(true);
    const n = ids.length;
    const them = n === 1 ? 'it' : 'them';
    return this.ask({
      tone: 'danger',
      title: `${action} ${this.plural(n, 'video')}?`,
      lead: `Auto-delete is ON, so this also deletes ${them} from the library and from Google Drive.`,
      points: [
        action === 'Download' ? `The MP4 ${n === 1 ? 'file is' : 'files are'} saved to this device first, then marked used.` : `${n === 1 ? 'It is' : 'They are'} marked used.`,
        `The Google Drive ${n === 1 ? 'copy goes' : 'copies go'} to the Drive trash and ${n === 1 ? 'leaves' : 'leave'} this library, so both stay in sync.`,
        'Want to keep used videos? Turn off "Auto-delete when used" under Download & usage settings.',
      ],
      ...this.preview(ids),
      confirmLabel: action === 'Download' ? 'Download & delete' : 'Mark used & delete',
    });
  }

  private async downloadAll(items: LibraryItem[]): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    this.resetStop();
    const autoDelete = this.autoArchive();
    let ok = 0;
    const failed: string[] = [];
    const set = (detail: string) => this.op.set({
      title: autoDelete ? 'Downloading & deleting from Drive' : 'Downloading',
      detail, done: ok + failed.length, total: items.length, failed: failed.length,
      tone: autoDelete ? 'danger' : 'brand', cancellable: items.length > 1,
    });
    for (const i of items) {
      if (this.stopRequested) break;
      set(i.title || 'Short');
      try {
        const blob = await firstValueFrom(this.api.downloadCopy(i.handoffId, true, autoDelete).pipe(takeUntilDestroyed(this.destroyRef)));
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(i.title || 'short').replace(/[\\/:*?"<>|]/g, ' ').trim()}.mp4`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        ok++;
      } catch {
        if (this.destroyed) return;
        failed.push(i.title || 'short');
      }
    }
    const skipped = items.length - ok - failed.length;
    this.busy.set(false);
    this.op.set(null);
    this.stopping.set(false);
    this.message.set(`${ok} download${ok === 1 ? '' : 's'} requested and marked used${autoDelete && ok ? '; auto-delete requested' : ''}.`
      + `${skipped ? ` Stopped: ${skipped} not downloaded.` : ''}`
      + `${failed.length ? ` ${failed.length} failed: ${failed.join(', ')}. Try again.` : ' Check your browser downloads; allow multiple downloads if prompted.'}`);
    this.selected.set(new Set());
    this.reload(false);
  }

  private resetStop(): void {
    this.stopRequested = false;
    this.stopping.set(false);
  }

  /**
   * Runs a bulk call in batches and fills the progress bar as each returns. A request that errors
   * stops the run (fail closed: nothing more is changed) and the summary says how far it got.
   */
  private async runBatches(ids: string[], call: (chunk: string[]) => Observable<LibraryBulk>,
                           o: { title: string; verb: string; tone: OpProgress['tone'] }): Promise<void> {
    if (!ids.length) return;
    this.busy.set(true);
    this.message.set(null);
    this.resetStop();
    const total = ids.length;
    const result: LibraryBulk = { done: 0, failed: 0, error: null };
    let processed = 0;
    let requestFailed: string | null = null;
    this.op.set({ title: o.title, detail: '', done: 0, total, failed: 0, tone: o.tone, cancellable: total > BATCH });
    for (let at = 0; at < total; at += BATCH) {
      if (this.stopRequested) break;
      const chunk = ids.slice(at, at + BATCH);
      this.op.update((p) => p && { ...p, detail: total > 1 ? `Videos ${processed + 1}–${processed + chunk.length}` : '' });
      try {
        const r = await firstValueFrom(call(chunk).pipe(takeUntilDestroyed(this.destroyRef)));
        result.done += r.done;
        result.failed += r.failed;
        result.error = r.error ?? result.error;
      } catch (error: unknown) {
        if (this.destroyed) return;
        requestFailed = error instanceof ApiFailure ? error.message : 'The server did not respond.';
        break;
      }
      processed += chunk.length;
      this.op.update((p) => p && { ...p, done: processed, failed: result.failed });
    }
    const stopped = processed < total;
    this.busy.set(false);
    this.op.set(null);
    this.stopping.set(false);
    this.report(result, o.verb);
    if (requestFailed) this.message.update((m) => `${m} ${requestFailed} ${total - processed} not processed; nothing more was changed. Please try again.`);
    else if (stopped) this.message.update((m) => `${m} Stopped: ${total - processed} left unchanged.`);
    this.selected.set(new Set());
    this.reload(false);
  }

  private report(r: LibraryBulk, verb: string): void {
    this.message.set(r.failed > 0
      ? `${r.done} ${verb}, ${r.failed} failed${r.error ? `: ${r.error}` : '.'}`
      : `${r.done} ${verb}.`);
  }
}
