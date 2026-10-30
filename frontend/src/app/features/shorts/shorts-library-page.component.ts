import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';

import { LibraryBulk, LibraryItem, LibraryPage, LibraryQuery, LibraryView } from '../../core/models/shorts.models';
import { ShortsService } from '../../core/services/shorts.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { TopicPickerComponent } from '../../shared/topic-picker.component';

type Sort = NonNullable<LibraryQuery['sort']>;
type ViewMode = 'xl' | 'large' | 'medium' | 'small' | 'list' | 'details' | 'tiles' | 'content';
type FormatFilter = 'all' | 'short' | 'video';

/**
 * The shorts & exported videos on Drive (and topic-tagged renders) as a library:
 * search, filter by topic, format and status, sample/preview inline or in a modal,
 * download to this device with proper icons, mark used/unused per item or in bulk,
 * file under shared topics and archive the used.
 */
@Component({
  selector: 'app-shorts-library-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TopicPickerComponent, DatePipe, DecimalPipe],
  template: `
    <div class="lp studio-wide-page">
      <header class="lp-head">
        <div>
          <h2>Drive &amp; Topics Library</h2>
          <p class="muted">Shorts and exported videos filed under your topics and saved to Google Drive. Sample any video inline,
            download with one click, and mark items used so you never post the same video twice.</p>
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
            🗑 Delete {{ data()?.counts?.used ?? 0 }} used
          </button>
        </div>
      </header>

      <section class="lp-card">
        <div class="lp-filters">
          <input class="lp-input grow" type="search" maxlength="100" placeholder="Search by video title, project or topic…"
                 [ngModel]="search()" (ngModelChange)="onSearch($event)" />
          <select class="lp-input" [ngModel]="formatFilter()" (ngModelChange)="formatFilter.set($event)" aria-label="Format">
            <option value="all">All formats (Shorts &amp; Videos)</option>
            <option value="short">📱 Shorts (9:16)</option>
            <option value="video">🎬 Landscape Videos (16:9)</option>
          </select>
          <select class="lp-input" [ngModel]="mode()" (ngModelChange)="setMode($event)" aria-label="View">
            @for (m of modes; track m.id) { <option [value]="m.id">{{ m.icon }} {{ m.label }}</option> }
          </select>
          <select class="lp-input" [ngModel]="sort()" (ngModelChange)="setSort($event)" aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="used">Recently used</option>
          </select>
          <select class="lp-input" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)" aria-label="Per page">
            @for (n of pageSizes; track n) { <option [ngValue]="n">{{ n }} / page</option> }
          </select>
        </div>

        <div class="lp-chips">
          @for (v of views(); track v.id) {
            <button type="button" class="lp-chip" [class.on]="view() === v.id" (click)="setView(v.id)">
              {{ v.label }} <small>{{ v.count }}</small>
            </button>
          }
        </div>

        <div class="lp-chips">
          <button type="button" class="lp-chip" [class.on]="!topicId()" (click)="setTopic('')">
            📁 All topics <small>{{ data()?.counts?.active ?? 0 }}</small>
          </button>
          <button type="button" class="lp-chip" [class.on]="topicId() === 'none'" (click)="setTopic('none')">
            No topic <small>{{ data()?.counts?.noTopic ?? 0 }}</small>
          </button>
          @for (t of data()?.topics ?? []; track t.topicId) {
            <button type="button" class="lp-chip" [class.on]="topicId() === t.topicId" (click)="setTopic(t.topicId)"
                    [title]="t.unused + ' unused of ' + t.shorts + ' total in ' + t.name">
              <span class="lp-dot" [style.background]="t.color"></span>{{ t.name }} <small>{{ t.unused }}/{{ t.shorts }}</small>
            </button>
          }
        </div>
      </section>

      @if (message(); as m) { <p class="lp-msg" role="status">{{ m }}</p> }

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

      <section class="lp-card">
        <div class="lp-bar">
          <label class="lp-check"><input type="checkbox" [checked]="allOnPageSelected()" (change)="togglePage()" /> Page</label>
          <span class="muted">{{ selected().size }} selected</span>
          @if (allOnPageSelected() && (data()?.total ?? 0) > pageItems().length && selected().size < (data()?.total ?? 0)) {
            <button type="button" class="lp-link" (click)="selectAllMatching()" [disabled]="busy()">
              Select all {{ data()?.total }} matching
            </button>
          }
          @if (selected().size) {
            <button type="button" class="lp-link" (click)="selected.set(empty)">Clear</button>
          }
          <span class="lp-spacer"></span>
          <button type="button" class="lp-btn dl-btn" (click)="downloadSelected()" [disabled]="busy() || !selected().size">
            <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download @if (selected().size) { ({{ selected().size }}) }
          </button>
          <button type="button" class="lp-btn" (click)="setUsed(true)" [disabled]="busy() || !selected().size">
            ✓ Mark used
          </button>
          <button type="button" class="lp-btn" (click)="setUsed(false)" [disabled]="busy() || !selected().size">
            ↺ Mark unused
          </button>
          @if (view() === 'archived') {
            <button type="button" class="lp-btn" (click)="restoreSelected()" [disabled]="busy() || !selected().size">Restore</button>
          } @else {
            <button type="button" class="lp-btn" (click)="archiveSelected()" [disabled]="busy() || !selected().size">Archive</button>
          }
          <button type="button" class="lp-btn danger" (click)="deleteSelected()" [disabled]="busy() || !selected().size">🗑 Delete</button>
        </div>

        <div class="lp-move">
          <span class="lp-move-label">File selected under topic</span>
          <app-topic-picker [(value)]="moveTarget" emptyLabel="No topic" [refresh]="data()?.topics?.length" />
          <button type="button" class="lp-btn" (click)="moveSelected()" [disabled]="busy() || !selected().size">
            {{ moveTarget() ? 'Move to topic' : 'Remove from topic' }}
          </button>
          <span class="lp-spacer"></span>
          <label class="lp-check" title="Used shorts are deleted automatically (Drive file moves to the Drive trash)">
            <input type="checkbox" [ngModel]="autoArchive()" (ngModelChange)="autoArchive.set($event)" />
            Auto-delete when used
          </label>
        </div>

        @if (mode() === 'details') {
          <div class="lp-table-wrap" [class.loading]="loading()">
            <table class="lp-table">
              <thead>
                <tr>
                  <th class="c-sel"><input type="checkbox" [checked]="allOnPageSelected()" (change)="togglePage()" aria-label="Select page" /></th>
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
                        {{ i.format === 'video' ? '16:9 Video' : i.format === 'square' ? '1:1' : '9:16 Short' }}
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
                        @if (i.driveUrl) {
                          <a class="lp-btn sm icon-only" [href]="i.driveUrl" target="_blank" rel="noopener" title="Open in Google Drive">
                            <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M14 3h7v7m0-7L10 14M5 5h5M5 5v14h14v-5" />
                            </svg>
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="11" class="lp-empty muted">{{ emptyText() }}</td></tr>
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

                <div class="lp-thumb" [class.wide]="i.format === 'video'" [style.--tc]="i.topicColor || '#6c8cff'" (click)="onThumbClick(i)">
                  @if (playingInlineId() === i.handoffId) {
                    <video class="lp-inline-video" [src]="streamUrl(i)" controls autoplay playsinline (click)="$event.stopPropagation()"></video>
                    <button type="button" class="lp-thumb-close" (click)="stopInline($event)" title="Stop sample">✕</button>
                    <button type="button" class="lp-thumb-expand" (click)="openSample(i, $event)" title="Expand player">⤢</button>
                  } @else {
                    @if (showThumb(i)) {
                      <img class="lp-thumb-img" [src]="thumbUrl(i)" alt="" loading="lazy" (error)="onThumbError(i.handoffId)" />
                    }
                    <div class="lp-thumb-overlay">
                      <span class="lp-play-circle" title="Click to play video sample">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8,5 20,12 8,19" fill="currentColor" /></svg>
                      </span>
                    </div>
                    <span class="lp-fmt-pill">{{ i.format === 'video' ? '16:9' : i.format === 'square' ? '1:1' : '9:16' }}</span>
                    @if (i.durationSeconds) { <span class="lp-dur">{{ i.durationSeconds | number: '1.0-0' }}s</span> }
                    @if (i.usedAt) {
                      <span class="lp-badge used" [title]="'Marked used ' + (i.usedAt | date:'short')">✓ Used</span>
                    } @else {
                      <span class="lp-badge unused">Unused</span>
                    }
                  }
                </div>

                <div class="lp-main">
                  <span class="lp-title" [title]="i.title" (click)="openSample(i)">{{ i.title || 'Short' }}</span>
                  <span class="lp-meta muted">{{ i.projectName }} · {{ i.createdAt | date: 'mediumDate' }}@if (i.sizeBytes) { · {{ mb(i.sizeBytes) }} MB }</span>
                  @if (mode() === 'content') { <span class="lp-meta muted">📁 {{ i.drivePath }}</span> }
                  <span class="lp-tags">
                    @if (i.topicName) { <span class="lp-tag"><span class="lp-dot" [style.background]="i.topicColor"></span>{{ i.topicName }}</span> }
                    @if (i.archived) { <span class="lp-tag">Archived</span> }
                  </span>
                </div>

                <div class="lp-acts">
                  <button type="button" class="lp-btn sm icon-btn" (click)="openSample(i)" title="Play video sample">
                    <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none" /></svg>
                    <span class="act-lbl">Sample</span>
                  </button>
                  <button type="button" class="lp-btn sm dl-btn icon-btn" (click)="downloadOne(i)" [disabled]="busy()" title="Download MP4 (marks as used)">
                    <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                    <span class="act-lbl">Download</span>
                  </button>
                  <button type="button" class="lp-btn sm use-btn" [class.is-used]="!!i.usedAt"
                          (click)="toggleItemUsed(i)" [disabled]="busy()"
                          [title]="i.usedAt ? 'Mark as unused again' : 'Mark as used'">
                    <span class="act-ico">{{ i.usedAt ? '↺' : '✓' }}</span>
                    <span class="act-lbl">{{ i.usedAt ? 'Unused' : 'Mark used' }}</span>
                  </button>
                  @if (i.driveUrl) {
                    <a class="lp-btn sm icon-only" [href]="i.driveUrl" target="_blank" rel="noopener" title="Open in Google Drive">
                      <svg class="lp-ico" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M14 3h7v7m0-7L10 14M5 5h5M5 5v14h14v-5" />
                      </svg>
                    </a>
                  }
                </div>
              </li>
            } @empty {
              <li class="lp-empty muted">{{ emptyText() }}</li>
            }
          </ul>
        }

        <nav class="lp-pager" aria-label="Pagination">
          <span class="muted">{{ rangeText() }}</span>
          <span class="lp-spacer"></span>
          <button type="button" class="lp-btn" (click)="go(1)" [disabled]="page() <= 1">«</button>
          <button type="button" class="lp-btn" (click)="go(page() - 1)" [disabled]="page() <= 1">‹ Prev</button>
          <span>Page {{ page() }} of {{ data()?.pages ?? 1 }}</span>
          <button type="button" class="lp-btn" (click)="go(page() + 1)" [disabled]="page() >= (data()?.pages ?? 1)">Next ›</button>
          <button type="button" class="lp-btn" (click)="go(data()?.pages ?? 1)" [disabled]="page() >= (data()?.pages ?? 1)">»</button>
        </nav>
      </section>

      <!-- VIDEO SAMPLE & QUICK ACTIONS MODAL -->
      @if (sampleItem(); as s) {
        <div class="lp-modal-backdrop" (click)="closeSample()">
          <div class="lp-modal" role="dialog" aria-modal="true" [attr.aria-label]="s.title || 'Video Sample'" (click)="$event.stopPropagation()">
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
              <video class="lp-modal-video" [src]="streamUrl(s)" controls autoplay playsinline></video>
            </div>

            <div class="lp-modal-meta-bar">
              <span class="muted">📁 {{ s.drivePath || 'Local Topic Library' }}</span>
              <span class="lp-spacer"></span>
              @if (s.usedAt) {
                <span class="lp-tag used">✓ Used ({{ s.usedAt | date: 'short' }})</span>
              } @else {
                <span class="lp-tag unused">● Unused — ready to post</span>
              }
            </div>

            <footer class="lp-modal-foot">
              <div class="lp-modal-nav">
                <button type="button" class="lp-btn" (click)="stepSample(-1)" [disabled]="sampleIndex() <= 0">‹ Prev</button>
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
    </div>
  `,
  styles: [`
    .lp { max-width: 1360px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; }
    .lp-head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
    .lp-head h2 { margin: 0 0 4px; font-size: 1.35rem; font-weight: 800; }
    .lp-head p { margin: 0; max-width: 680px; font-size: 0.84rem; line-height: 1.45; }
    .lp-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .lp-card { background: var(--panel, #161b22); border: 1px solid var(--border, #30363d); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .lp-filters, .lp-chips, .lp-bar, .lp-move, .lp-pager { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .lp-move app-topic-picker { min-width: 240px; }
    .lp-move-label { font-size: 0.82rem; color: var(--muted, #8b949e); }
    .lp-spacer { flex: 1; }
    .lp-input { width: auto; background: transparent; color: inherit; border: 1px solid var(--border, #30363d); border-radius: 8px; padding: 7px 10px; font: inherit; font-size: 0.85rem; }
    .lp-input option { color: #000; }
    .lp-input.grow { flex: 1; min-width: 200px; width: auto; }
    .lp-btn, .lp-chip { background: transparent; color: inherit; border: 1px solid var(--border, #30363d); border-radius: 8px; padding: 6px 11px; cursor: pointer; font: inherit; font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s, border-color 0.15s; }
    .lp-btn:hover:not(:disabled), .lp-chip:hover { border-color: #6e7681; background: rgba(255, 255, 255, 0.04); }
    .lp-btn.primary, .lp-chip.on { background: var(--brand, #7c3aed); border-color: transparent; color: #fff; }
    .lp-btn.dl-btn { background: rgba(35, 134, 54, 0.18); border-color: rgba(46, 160, 67, 0.55); color: #7ee787; font-weight: 600; }
    .lp-btn.dl-btn:hover:not(:disabled) { background: rgba(46, 160, 67, 0.32); border-color: #3fb950; color: #fff; }
    .lp-btn.use-btn { border-color: rgba(124, 58, 237, 0.45); color: #d2a8ff; }
    .lp-btn.use-btn.is-used { border-color: rgba(139, 148, 158, 0.4); color: #8b949e; }
    .lp-ico { width: 15px; height: 15px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
    .lp-chip { border-radius: 999px; }
    .lp-chip small { opacity: 0.75; margin-left: 4px; }
    .lp-btn:disabled { opacity: 0.45; cursor: default; }
    .lp-link { background: none; border: none; color: var(--brand, #a78bfa); cursor: pointer; font: inherit; font-size: 0.82rem; padding: 0; }
    .lp-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
    .lp-msg { margin: 0; padding: 8px 12px; border: 1px solid var(--border, #30363d); border-radius: 8px; font-size: 0.85rem; background: rgba(56, 139, 253, 0.1); }
    .lp-connect { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-color: rgba(56, 139, 253, 0.5); }
    .lp-connect p { margin: 4px 0 0; }
    .lp-btn.danger { color: #ff7b72; border-color: rgba(248, 81, 73, 0.5); }
    .lp-check { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; }
    .lp-items { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; --w: 210px; grid-template-columns: repeat(auto-fill, minmax(var(--w), 1fr)); }
    .lp-items.loading, .lp-table-wrap.loading { opacity: 0.55; }
    .lp-item { position: relative; display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--border, #30363d); border-radius: 12px; cursor: default; background: rgba(13, 17, 23, 0.45); transition: border-color 0.15s, background 0.15s; }
    .lp-item:hover { background: rgba(124, 58, 237, 0.07); border-color: rgba(124, 58, 237, 0.35); }
    .lp-item.sel { border-color: var(--brand, #7c3aed); background: rgba(124, 58, 237, 0.14); }
    .lp-item.used .lp-title { opacity: 0.7; }
    .lp-item.used .lp-thumb-img { filter: saturate(0.55) brightness(0.8); }
    .lp-pick { position: absolute; top: 16px; left: 16px; z-index: 3; background: rgba(0, 0, 0, 0.55); border-radius: 6px; padding: 3px 5px; display: flex; cursor: pointer; }
    .lp-thumb { position: relative; aspect-ratio: 9 / 16; max-height: 100%; border-radius: 8px; overflow: hidden; display: grid; place-items: center; background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 55%, #000), #0d1117); cursor: pointer; }
    .lp-thumb.wide { aspect-ratio: 16 / 9; }
    .lp-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease; }
    .lp-thumb:hover .lp-thumb-img { transform: scale(1.03); }
    .lp-thumb-overlay { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0, 0, 0, 0.18); transition: background 0.15s; }
    .lp-thumb:hover .lp-thumb-overlay { background: rgba(0, 0, 0, 0.38); }
    .lp-play-circle { width: 42px; height: 42px; border-radius: 50%; background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; display: grid; place-items: center; box-shadow: 0 4px 14px rgba(0,0,0,0.45); transition: transform 0.15s, background 0.15s; }
    .lp-play-circle svg { width: 18px; height: 18px; }
    .lp-thumb:hover .lp-play-circle { transform: scale(1.1); background: var(--brand, #7c3aed); }
    .lp-inline-video { width: 100%; height: 100%; object-fit: contain; background: #000; display: block; }
    .lp-thumb-close, .lp-thumb-expand { position: absolute; top: 6px; right: 6px; z-index: 4; background: rgba(0,0,0,0.75); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; width: 26px; height: 26px; cursor: pointer; display: grid; place-items: center; font-size: 0.78rem; }
    .lp-thumb-expand { right: 36px; }
    .lp-fmt-pill { position: absolute; top: 6px; right: 6px; background: rgba(0, 0, 0, 0.65); color: #e6edf3; border-radius: 4px; padding: 1px 6px; font-size: 0.68rem; font-weight: 600; }
    .lp-dur { position: absolute; right: 6px; bottom: 6px; background: rgba(0, 0, 0, 0.72); color: #fff; border-radius: 4px; padding: 1px 6px; font-size: 0.72rem; font-weight: 600; }
    .lp-badge { position: absolute; left: 6px; bottom: 6px; border-radius: 4px; padding: 2px 7px; font-size: 0.7rem; font-weight: 600; color: #fff; }
    .lp-badge.used { background: #238636; }
    .lp-badge.unused { background: rgba(31, 111, 235, 0.85); }
    .lp-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .lp-acts { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: auto; padding-top: 4px; }
    .lp-btn.sm { padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; }
    .lp-btn.icon-only { padding: 4px 6px; }
    .lp-items.m-xl { --w: 300px; }
    .lp-items.m-large { --w: 230px; }
    .lp-items.m-medium { --w: 185px; }
    .lp-items.m-small { --w: 130px; gap: 8px; }
    .m-small .lp-meta, .m-small .lp-tags, .m-small .act-lbl { display: none; }
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
    .lp-row-thumb { position: relative; width: 38px; height: 54px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border, #30363d); background: #0d1117; cursor: pointer; padding: 0; display: grid; place-items: center; }
    .lp-row-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .lp-row-play { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.35); color: #fff; font-size: 0.75rem; }
    .lp-row-acts { display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end; }
    .lp-fmt-badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(124, 58, 237, 0.15); color: #d2a8ff; }
    .lp-fmt-badge.video { background: rgba(56, 139, 253, 0.15); color: #79c0ff; }
    .lp-th { background: none; border: none; color: inherit; font: inherit; cursor: pointer; padding: 0; }
    .lp-empty { list-style: none; grid-column: 1 / -1; text-align: center; padding: 28px 0 !important; }
    .lp-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .lp-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; cursor: pointer; }
    .lp-title:hover { color: #a78bfa; }
    .lp-meta { font-size: 0.76rem; }
    .lp-tag { font-size: 0.72rem; border: 1px solid var(--border, #30363d); border-radius: 999px; padding: 2px 9px; white-space: nowrap; display: inline-flex; align-items: center; }
    .lp-tag.used { background: rgba(46, 160, 67, 0.25); border-color: rgba(46, 160, 67, 0.5); color: #7ee787; }
    .lp-tag.unused { background: rgba(56, 139, 253, 0.18); border-color: rgba(56, 139, 253, 0.45); color: #79c0ff; }
    .lp-pager { font-size: 0.82rem; }

    /* Sample Modal */
    .lp-modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(4px); z-index: 1200; display: grid; place-items: center; padding: 16px; }
    .lp-modal { background: #161b22; border: 1px solid #30363d; border-radius: 16px; width: min(760px, 96vw); max-height: 92vh; display: flex; flex-direction: column; gap: 12px; padding: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.65); overflow: hidden; }
    .lp-modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .lp-modal-title-wrap h3 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 700; }
    .lp-modal-sub { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 0.78rem; color: #8b949e; }
    .lp-modal-close { background: transparent; border: 1px solid #30363d; color: #c9d1d9; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
    .lp-modal-player-box { background: #000; border-radius: 12px; overflow: hidden; display: grid; place-items: center; max-height: 62vh; }
    .lp-modal-video { max-height: 62vh; max-width: 100%; width: auto; height: auto; display: block; }
    .lp-modal-meta-bar { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; flex-wrap: wrap; }
    .lp-modal-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid #21262d; }
    .lp-modal-nav, .lp-modal-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    @media (max-width: 720px) { .m-tiles, .m-content { grid-template-columns: 1fr; } }
  `],
})
export class ShortsLibraryPageComponent implements OnDestroy {
  private readonly api = inject(ShortsService);
  private readonly route = inject(ActivatedRoute);
  private readonly youtube = inject(YouTubePublishService);

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

  readonly search = signal('');
  readonly topicId = signal('');
  readonly view = signal<LibraryView>('active');
  readonly sort = signal<Sort>('newest');
  readonly formatFilter = signal<FormatFilter>('all');
  readonly page = signal(1);
  readonly pageSize = signal(25);

  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly moveTarget = signal<string | null>(null);
  readonly autoArchive = signal(true);

  /** Inline video sample playing inside a card, or full modal sample item. */
  readonly playingInlineId = signal<string | null>(null);
  readonly sampleItem = signal<LibraryItem | null>(null);
  readonly failedThumbs = signal<ReadonlySet<string>>(new Set());

  readonly pageItems = computed(() => {
    const raw = this.data()?.items ?? [];
    const fmt = this.formatFilter();
    if (fmt === 'all') return raw;
    if (fmt === 'video') return raw.filter((i) => i.format === 'video');
    return raw.filter((i) => i.format !== 'video');
  });

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
    const initialTopic = this.route.snapshot.queryParamMap.get('topic');
    if (initialTopic) {
      this.topicId.set(initialTopic);
    }
    this.reload();
    this.checkDriveConnection();
    this.api.importFromDrive().subscribe({
      next: (imp) => {
        if (imp.added > 0 || imp.topicsAdded > 0) {
          this.message.set(`${imp.added} video(s) imported from Google Drive.`);
          this.reload(false);
        }
      },
      error: () => undefined,
    });
  }

  private checkDriveConnection(): void {
    this.youtube.driveConnections().subscribe({
      next: (list) => {
        if (list.some((d) => d.connected && !d.needsReconnect)) this.driveState.set('ok');
        else this.driveState.set(list.some((d) => d.connected && d.needsReconnect) ? 'reconnect' : 'missing');
      },
      error: () => this.driveState.set('unknown'),
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
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.sampleItem()) {
      this.closeSample();
    } else if (this.playingInlineId()) {
      this.playingInlineId.set(null);
    }
  }

  mb(bytes: number): string {
    return (bytes / 1_048_576).toFixed(1);
  }

  showThumb(item: LibraryItem): boolean {
    return (item.hasLocalPreview ?? true) && !this.failedThumbs().has(item.handoffId);
  }

  thumbUrl(item: LibraryItem): string {
    return this.api.frameUrl(item.jobId, 1.2, 360);
  }

  streamUrl(item: LibraryItem): string {
    return this.api.streamUrl(item.handoffId);
  }

  onThumbError(handoffId: string): void {
    this.failedThumbs.update((set) => {
      const next = new Set(set);
      next.add(handoffId);
      return next;
    });
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
    this.playingInlineId.set(null);
    this.sampleItem.set(item);
  }

  closeSample(): void {
    this.sampleItem.set(null);
  }

  stepSample(delta: -1 | 1): void {
    const idx = this.sampleIndex();
    const list = this.pageItems();
    const next = list[idx + delta];
    if (next) this.sampleItem.set(next);
  }

  private savedMode(): ViewMode {
    const v = localStorage.getItem('shorts.library.view');
    return (['xl', 'large', 'medium', 'small', 'list', 'details', 'tiles', 'content'] as string[]).includes(v ?? '') ? v as ViewMode : 'large';
  }

  setMode(m: ViewMode): void {
    this.mode.set(m);
    localStorage.setItem('shorts.library.view', m);
  }

  emptyText(): string {
    return this.loading() ? 'Loading…'
      : this.hasFilters() ? 'No videos or shorts match these filters.'
      : 'Nothing here yet. Videos and shorts appear once exported with a topic or saved to Google Drive.';
  }

  /** Details column headers sort the server-side list; a second click flips the direction. */
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
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.page.set(1); this.reload(); }, 300);
  }

  setView(v: LibraryView): void { this.view.set(v); this.page.set(1); this.reload(); }
  setTopic(id: string): void { this.topicId.set(id); this.page.set(1); this.reload(); }
  setSort(s: Sort): void { this.sort.set(s); this.page.set(1); this.reload(); }
  setPageSize(n: number): void { this.pageSize.set(Number(n)); this.page.set(1); this.reload(); }
  go(p: number): void { this.page.set(Math.max(1, p)); this.reload(false); }

  private query(): LibraryQuery {
    return {
      search: this.search().trim() || undefined,
      topicId: this.topicId() || undefined,
      view: this.view(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize(),
    };
  }

  /** Loads the current page; a filter change also drops the selection (it may no longer be visible). */
  reload(clearSelection = true): void {
    const id = ++this.requestId;
    this.loading.set(true);
    if (clearSelection) this.selected.set(new Set());
    this.api.libraryItems(this.query()).subscribe({
      next: (d) => {
        if (id !== this.requestId) return;
        this.data.set(d);
        this.page.set(d.page);
        this.loading.set(false);
        const curSample = this.sampleItem();
        if (curSample) {
          const updated = d.items.find((i) => i.handoffId === curSample.handoffId);
          if (updated) this.sampleItem.set(updated);
        }
      },
      error: () => {
        if (id !== this.requestId) return;
        this.loading.set(false);
        this.message.set('Could not load the Drive library.');
      },
    });
  }

  syncDrive(): void {
    this.busy.set(true);
    this.message.set('Reading your Google Drives and organizing topic folders…');
    this.api.importFromDrive().pipe(
      catchError(() => of(null)),
      switchMap((imp) => this.api.checkDrive(true).pipe(map((res) => ({ imp, res })))),
    ).subscribe({
      next: ({ imp, res }) => {
        this.busy.set(false);
        const found = imp ? ` ${imp.added} imported from ${imp.drives} Drive(s)${imp.topicsAdded ? `, ${imp.topicsAdded} new topic(s)` : ''}.` : '';
        this.message.set(`Drive synced: ${res.present} present, ${res.moved} organized into folders.${found}`);
        this.reload(false);
      },
      error: () => {
        this.busy.set(false);
        this.message.set('Could not sync Google Drive right now.');
      },
    });
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    if (!next.delete(id)) next.add(id);
    this.selected.set(next);
  }

  togglePage(): void {
    const next = new Set(this.selected());
    const ids = this.pageItems().map((i) => i.handoffId);
    if (this.allOnPageSelected()) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    this.selected.set(next);
  }

  selectAllMatching(): void {
    this.api.libraryIds(this.query()).subscribe({
      next: (ids) => this.selected.set(new Set(ids)),
      error: () => this.message.set('Could not select every match.'),
    });
  }

  moveSelected(): void {
    this.run(this.api.moveToTopic([...this.selected()], this.moveTarget()), (r) => this.report(r, 'moved'));
  }

  setUsed(used: boolean): void {
    this.run(this.api.markUsed([...this.selected()], used, this.autoArchive()), (r) => this.report(r, used ? (this.autoArchive() ? 'marked used and deleted' : 'marked used') : 'marked unused'));
  }

  /** Direct 1-click Used / Unused toggle on an individual card or row. */
  toggleItemUsed(item: LibraryItem): void {
    const nextUsed = !item.usedAt;
    this.run(
      this.api.markUsed([item.handoffId], nextUsed, this.autoArchive()),
      (r) => this.report(r, nextUsed ? (this.autoArchive() ? 'marked used and deleted' : 'marked used') : 'marked unused'),
    );
  }

  archiveSelected(): void {
    this.run(this.api.archive([...this.selected()]), (r) => this.report(r, 'archived'));
  }

  deleteUsed(): void {
    const n = this.data()?.counts.used ?? 0;
    if (!confirm(`Delete ${n} used items? Their Google Drive files move to the Drive trash.`)) return;
    this.run(this.api.deleteArchived(), (r) => this.report(r, 'deleted'));
  }

  restoreSelected(): void {
    this.run(this.api.restore([...this.selected()]), (r) => this.report(r, 'restored'));
  }

  deleteSelected(): void {
    const n = this.selected().size;
    if (!confirm(`Delete ${n} item${n === 1 ? '' : 's'}? Their Google Drive files move to the Drive trash.`)) return;
    this.run(this.api.deleteArchived([...this.selected()]), (r) => this.report(r, 'deleted'));
  }

  downloadOne(item: LibraryItem): void {
    if (!this.confirmReuse([item])) return;
    void this.downloadAll([item]);
  }

  downloadSelected(): void {
    const chosen = this.pageItems().filter((i) => this.selected().has(i.handoffId));
    if (chosen.length === 0) {
      this.message.set('Downloads run for the items on this page; select them here first.');
      return;
    }
    if (!this.confirmReuse(chosen)) return;
    void this.downloadAll(chosen);
  }

  /** A used short shouldn't be posted twice, so downloading one asks first. */
  private confirmReuse(items: LibraryItem[]): boolean {
    const used = items.filter((i) => i.usedAt).length;
    return used === 0 || confirm(`${used} of these ${used === 1 ? 'is' : 'are'} already marked used. Download anyway?`);
  }

  private async downloadAll(items: LibraryItem[]): Promise<void> {
    this.busy.set(true);
    let ok = 0;
    for (const i of items) {
      try {
        const blob = await new Promise<Blob>((resolve, reject) =>
          this.api.downloadCopy(i.handoffId, true, this.autoArchive()).subscribe({ next: resolve, error: reject }));
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(i.title || 'short').replace(/[\\/:*?"<>|]/g, ' ').trim()}.mp4`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        ok++;
      } catch {
        this.message.set(`Could not download "${i.title || 'short'}".`);
      }
    }
    this.busy.set(false);
    if (ok > 0) {
      this.message.set(`Downloaded ${ok} and marked ${ok === 1 ? 'it' : 'them'} used${this.autoArchive() ? ' - deleted from the library' : ''}.`);
      this.reload(false);
    }
  }

  private report(r: LibraryBulk, verb: string): void {
    this.message.set(r.failed > 0
      ? `${r.done} ${verb}, ${r.failed} failed${r.error ? `: ${r.error}` : '.'}`
      : `${r.done} ${verb}.`);
  }

  private run(call: Observable<LibraryBulk>, then: (r: LibraryBulk) => void): void {
    this.busy.set(true);
    this.message.set(null);
    call.subscribe({
      next: (r) => { this.busy.set(false); then(r); this.selected.set(new Set()); this.reload(false); },
      error: () => { this.busy.set(false); this.message.set('That did not work. Please try again.'); },
    });
  }
}
