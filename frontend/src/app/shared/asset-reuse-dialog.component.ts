import { Component, DestroyRef, ElementRef, OnInit, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounce, firstValueFrom, of, switchMap, tap, timer } from 'rxjs';

import { ApiFailure } from '../core/interceptors/api-error.interceptor';
import {
  AssetSearchHit, AssetSearchProject, AssetSearchScope, AssetSearchSort, BrandChannel, DEFAULT_BRAND_CHANNEL,
} from '../core/models/api.models';
import { ApiService } from '../core/services/api.service';

type KindFilter = '' | 'video' | 'image' | 'audio' | 'subtitle';
type ViewMode = 'grid' | 'list';
type ThumbSize = 's' | 'm' | 'l';

interface SearchRequest {
  q: string; scope: AssetSearchScope; channel: string | null; project: string | null;
  kind: KindFilter; sort: AssetSearchSort; offset: number; limit: number;
}

/** Typing pauses this long before the search runs, so each keystroke is not a request. */
const SEARCH_DEBOUNCE_MS = 250;
/** Where the viewer's layout choices (view, size, page size) are remembered. */
const PREFS_KEY = 'animstudio.reuseDialog.prefs';
/** "Where to search" values that are not a channel id. */
const WHERE_THIS = '__this';
const WHERE_ALL = '__all';

/**
 * Search the user's other projects for files - uploads, downloads, exported cuts - and
 * bring the chosen ones into this project, so something made for an earlier video can be
 * reused without uploading it again. Looks in this project's channel by default; the
 * "Where" picker widens it to every channel or narrows it to another one, and the project
 * list narrows it to a single project.
 *
 * Adding copies the file (the server gives this project its own bytes), so deleting it in
 * either project never breaks the other.
 *
 *   @if (reuseOpen()) {
 *     <app-asset-reuse-dialog [projectId]="id" [folderId]="folder" (added)="refresh()" (closed)="..." />
 *   }
 */
@Component({
  selector: 'app-asset-reuse-dialog',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(document:keydown.arrowleft)': 'stepPreview(-1)',
    '(document:keydown.arrowright)': 'stepPreview(1)',
  },
  template: `
    <div class="ar-backdrop" (click)="close()">
      <div class="ar-dialog" role="dialog" aria-modal="true" aria-label="Reuse from other projects" (click)="$event.stopPropagation()">
        <header class="ar-head">
          <div class="ar-title">
            <strong>♻️ Reuse from other projects</strong>
            <span class="ar-sub">Pick files made for earlier videos and add a copy here.</span>
          </div>
          <button type="button" class="ar-x" (click)="close()" title="Close (Esc)" aria-label="Close" [disabled]="adding()">✕</button>
        </header>

        <div class="ar-toolbar">
          <button type="button" class="ar-btn ar-filters-toggle" (click)="filtersOpen.set(!filtersOpen())"
                  [attr.aria-expanded]="filtersOpen()">☰ Filters{{ activeFilterCount() ? ' (' + activeFilterCount() + ')' : '' }}</button>
          <div class="ar-searchbox">
            <span class="ar-search-ico" aria-hidden="true">🔍</span>
            <input class="ar-search" type="search" [ngModel]="query()" (ngModelChange)="setQuery($event)"
                   [attr.maxlength]="maxQuery" placeholder="Search file or project name…" aria-label="Search files" autofocus />
            @if (query()) {
              <button type="button" class="ar-clear" (click)="setQuery('')" title="Clear search" aria-label="Clear search">✕</button>
            }
          </div>
          <label class="ar-field">
            <span>Sort</span>
            <select [value]="sort()" (change)="setSort($any($event.target).value)" aria-label="Sort by">
              @for (s of sorts; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
            </select>
          </label>
          <div class="ar-seg" role="group" aria-label="View">
            <button type="button" [class.on]="view() === 'grid'" (click)="setView('grid')" title="Grid view" aria-label="Grid view">▦</button>
            <button type="button" [class.on]="view() === 'list'" (click)="setView('list')" title="List view" aria-label="List view">☰</button>
          </div>
          @if (view() === 'grid') {
            <div class="ar-seg" role="group" aria-label="Thumbnail size">
              @for (z of sizes; track z.value) {
                <button type="button" [class.on]="size() === z.value" (click)="setSize(z.value)" [title]="z.title">{{ z.label }}</button>
              }
            </div>
          }
        </div>

        <div class="ar-main">
          <aside class="ar-side" [class.open]="filtersOpen()" aria-label="Filters">
            <section>
              <h4>Where</h4>
              <select class="ar-where" [value]="whereValue()" (change)="setWhere($any($event.target).value)" aria-label="Where to search">
                <option [value]="whereThis">This channel · {{ channelName(ownChannelId()) }}</option>
                <option [value]="whereAll">All channels</option>
                @if (otherChannels().length) {
                  <optgroup label="Another channel">
                    @for (c of otherChannels(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
                  </optgroup>
                }
              </select>
            </section>

            <section>
              <h4>Type</h4>
              <div class="ar-kinds" role="group" aria-label="File type">
                @for (k of kinds; track k.value) {
                  <button type="button" class="ar-facet" [class.on]="kind() === k.value" (click)="setKind(k.value)"
                          [disabled]="k.value !== '' && kind() !== k.value && !kindCount(k.value)">
                    <span>{{ k.icon }} {{ k.label }}</span><span class="ar-count">{{ kindCount(k.value) }}</span>
                  </button>
                }
              </div>
            </section>

            <section class="ar-projects">
              <h4>Project <span class="ar-h-note">{{ projects().length }}</span></h4>
              @if (projects().length > 6) {
                <input class="ar-proj-filter" type="search" [ngModel]="projectFilter()" (ngModelChange)="projectFilter.set($event ?? '')"
                       maxlength="60" placeholder="Find a project…" aria-label="Find a project" />
              }
              <div class="ar-proj-list" role="group" aria-label="Source project">
                <button type="button" class="ar-facet" [class.on]="!project()" (click)="setProject(null)">
                  <span>All projects</span><span class="ar-count">{{ projectsTotal() }}</span>
                </button>
                @for (p of visibleProjects(); track p.id) {
                  <button type="button" class="ar-facet" [class.on]="project() === p.id" (click)="setProject(p.id)" [title]="p.name">
                    <span class="ar-facet-name">
                      {{ p.name }}
                      @if (!p.sameChannel) { <small>{{ channelName(p.channelId) }}</small> }
                    </span>
                    <span class="ar-count">{{ p.matches }}</span>
                  </button>
                } @empty {
                  @if (projectFilter()) { <p class="ar-note">No project matches “{{ projectFilter() }}”.</p> }
                }
                @if (selectedProjectMissing()) {
                  <button type="button" class="ar-facet on" (click)="setProject(null)" title="No matches with the other filters">
                    <span>Chosen project</span><span class="ar-count">0</span>
                  </button>
                }
              </div>
            </section>

            @if (activeFilterCount()) {
              <button type="button" class="ar-link" (click)="resetFilters()">Reset filters</button>
            }
          </aside>

          <section class="ar-results" aria-live="polite">
            <div class="ar-resultbar">
              <span class="ar-meta">
                @if (error()) { <span class="ar-err">{{ error() }}</span> }
                @else if (total() === 0 && loading()) { Searching… }
                @else {
                  @if (total() > 0) { <strong>{{ rangeStart() }}–{{ rangeEnd() }}</strong> of }
                  <strong>{{ total() }}</strong> file{{ total() === 1 ? '' : 's' }}
                  in {{ projectsSearched() }} project{{ projectsSearched() === 1 ? '' : 's' }}
                  @if (loading()) { <span class="ar-spin" aria-label="Searching"></span> }
                }
              </span>
              @if (selectableOnPage().length) {
                <button type="button" class="ar-link" (click)="allPageSelected() ? unselectPage() : selectPage()">
                  {{ allPageSelected() ? 'Unselect this page' : 'Select this page' }}
                </button>
              }
            </div>

            @if (preview(); as p) {
              <div class="ar-preview">
                <div class="ar-preview-media">
                  @switch (p.asset.kind) {
                    @case ('Video') { <video [src]="api.assetUrl(p.asset.id)" controls autoplay playsinline></video> }
                    @case ('Image') { <img [src]="api.assetUrl(p.asset.id)" [alt]="p.asset.name" /> }
                    @case ('Audio') { <audio [src]="api.assetUrl(p.asset.id)" controls autoplay></audio> }
                    @default { <div class="ar-noprev">No preview for this file type.</div> }
                  }
                  <button type="button" class="ar-nav prev" (click)="stepPreview(-1)" [disabled]="previewIndex() <= 0" title="Previous (←)" aria-label="Previous">‹</button>
                  <button type="button" class="ar-nav next" (click)="stepPreview(1)" [disabled]="previewIndex() >= hits().length - 1" title="Next (→)" aria-label="Next">›</button>
                </div>
                <div class="ar-preview-info">
                  <strong [title]="p.asset.name">{{ p.asset.name }}</strong>
                  <dl>
                    <dt>Project</dt><dd>{{ p.projectName }}</dd>
                    <dt>Channel</dt><dd>{{ channelName(p.channelId) }}</dd>
                    <dt>File</dt><dd>{{ describe(p) }}</dd>
                    <dt>Added</dt><dd>{{ formatDate(p.createdAt) }}</dd>
                  </dl>
                  @if (needsReview(p)) { <span class="ar-tag warn">Needs review before rendering</span> }
                  <span class="ar-note">{{ previewIndex() + 1 }} of {{ hits().length }} on this page · ← → to browse</span>
                  <div class="ar-preview-actions">
                    <button type="button" class="ar-btn" (click)="preview.set(null)">← Back to results</button>
                    @if (p.alreadyAdded) { <span class="ar-tag ok">✓ Already in this project</span> }
                    @else {
                      <button type="button" class="ar-btn" [class.primary]="!isSelected(p)" (click)="toggle(p)">
                        {{ isSelected(p) ? '✓ Selected' : 'Select' }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            } @else {
              <div class="ar-scroll" #scroller [class.dim]="loading() && hits().length > 0">
                @if (view() === 'grid') {
                  <ul class="ar-grid" [attr.data-size]="size()">
                    @for (h of hits(); track h.asset.id; let i = $index) {
                      <li class="ar-card" [class.selected]="isSelected(h)" [class.added]="h.alreadyAdded"
                          (click)="onItemClick(h, i, $event)" (dblclick)="preview.set(h)"
                          [attr.aria-selected]="isSelected(h)" [title]="h.alreadyAdded ? 'Already in this project' : (isSelected(h) ? 'Click to unselect' : 'Click to select · double-click to preview')">
                        <div class="ar-thumb">
                          @if (hasThumb(h)) {
                            <img [src]="api.assetThumbnailUrl(h.asset.id)" alt="" loading="lazy" (error)="thumbFailed(h.asset.id)" />
                          } @else {
                            <span class="ar-icon">{{ kindIcon(h.asset.kind) }}</span>
                          }
                          <span class="ar-kind">{{ kindIcon(h.asset.kind) }}</span>
                          @if (h.asset.durationSeconds) { <span class="ar-dur">{{ formatDuration(h.asset.durationSeconds) }}</span> }
                          @if (h.alreadyAdded) { <span class="ar-added">✓ Added</span> }
                          @else { <span class="ar-check" aria-hidden="true">{{ isSelected(h) ? '✓' : '' }}</span> }
                          <button type="button" class="ar-zoom" (click)="$event.stopPropagation(); preview.set(h)"
                                  [title]="'Preview ' + h.asset.name" aria-label="Preview">⤢</button>
                        </div>
                        <div class="ar-body">
                          <span class="ar-name">{{ h.asset.name }}</span>
                          <span class="ar-proj">{{ h.projectName }}</span>
                          @if (!h.sameChannel || h.isExport || needsReview(h)) {
                            <span class="ar-tags">
                              @if (!h.sameChannel) { <span class="ar-tag other">{{ channelName(h.channelId) }}</span> }
                              @if (h.isExport) { <span class="ar-tag">Export</span> }
                              @if (needsReview(h)) { <span class="ar-tag warn" title="Must be approved before it can be rendered">Review</span> }
                            </span>
                          }
                        </div>
                      </li>
                    } @empty { <li class="ar-empty">@if (!loading() && !error()) { <ng-container *ngTemplateOutlet="empty" /> }</li> }
                  </ul>
                } @else {
                  <table class="ar-table">
                    <thead>
                      <tr>
                        <th class="c-pick"><span class="sr">Select</span></th>
                        <th class="c-thumb"><span class="sr">Preview</span></th>
                        <th>Name</th><th class="c-proj">Project</th><th class="c-type">Type</th>
                        <th class="c-len">Length</th><th class="c-size">Size</th><th class="c-date">Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (h of hits(); track h.asset.id; let i = $index) {
                        <tr [class.selected]="isSelected(h)" [class.added]="h.alreadyAdded" (click)="onItemClick(h, i, $event)">
                          <td class="c-pick">
                            @if (h.alreadyAdded) { <span class="ar-tag ok" title="Already in this project">✓</span> }
                            @else { <span class="ar-check" aria-hidden="true">{{ isSelected(h) ? '✓' : '' }}</span> }
                          </td>
                          <td class="c-thumb">
                            <button type="button" class="ar-mini" (click)="$event.stopPropagation(); preview.set(h)" [title]="'Preview ' + h.asset.name">
                              @if (hasThumb(h)) { <img [src]="api.assetThumbnailUrl(h.asset.id)" alt="" loading="lazy" (error)="thumbFailed(h.asset.id)" /> }
                              @else { <span>{{ kindIcon(h.asset.kind) }}</span> }
                            </button>
                          </td>
                          <td class="c-name">
                            <span class="ar-name" [title]="h.asset.name">{{ h.asset.name }}</span>
                            <span class="ar-tags">
                              @if (!h.sameChannel) { <span class="ar-tag other">{{ channelName(h.channelId) }}</span> }
                              @if (h.isExport) { <span class="ar-tag">Export</span> }
                              @if (needsReview(h)) { <span class="ar-tag warn">Review</span> }
                            </span>
                          </td>
                          <td class="c-proj" [title]="h.projectName">{{ h.projectName }}</td>
                          <td class="c-type">{{ h.asset.kind }}</td>
                          <td class="c-len">{{ h.asset.durationSeconds ? formatDuration(h.asset.durationSeconds) : '—' }}</td>
                          <td class="c-size">{{ formatSize(h.asset.fileSizeBytes) }}</td>
                          <td class="c-date">{{ formatDate(h.createdAt) }}</td>
                        </tr>
                      } @empty {
                        <tr><td colspan="8" class="ar-empty">@if (!loading() && !error()) { <ng-container *ngTemplateOutlet="empty" /> }</td></tr>
                      }
                    </tbody>
                  </table>
                }
              </div>

              @if (pageCount() > 1 || total() > pageSizes[0]) {
                <nav class="ar-pager" aria-label="Pages">
                  <button type="button" class="ar-pg" (click)="goToPage(page() - 1)" [disabled]="page() === 0 || loading()" aria-label="Previous page">‹ Prev</button>
                  @for (n of pageButtons(); track $index) {
                    @if (n === null) { <span class="ar-gap">…</span> }
                    @else {
                      <button type="button" class="ar-pg" [class.on]="n === page()" (click)="goToPage(n)"
                              [attr.aria-current]="n === page() ? 'page' : null">{{ n + 1 }}</button>
                    }
                  }
                  <button type="button" class="ar-pg" (click)="goToPage(page() + 1)" [disabled]="page() >= pageCount() - 1 || loading()" aria-label="Next page">Next ›</button>
                  <label class="ar-field ar-pagesize">
                    <span>Per page</span>
                    <select [value]="pageSize()" (change)="setPageSize(+$any($event.target).value)" aria-label="Files per page">
                      @for (n of pageSizes; track n) { <option [value]="n">{{ n }}</option> }
                    </select>
                  </label>
                </nav>
              }
            }
          </section>
        </div>

        @if (addError()) { <p class="ar-err">{{ addError() }}</p> }

        <footer class="ar-foot">
          <span class="ar-note">
            @if (selected().size) {
              <strong class="ar-selcount">{{ selected().size }} selected</strong>
              @if (selectedElsewhere()) { ({{ selectedElsewhere() }} on other pages or searches) }
              · <button type="button" class="ar-link" (click)="clearSelection()">Clear</button> ·
            }
            A copy is added, so deleting it in either project never affects the other.
          </span>
          <button type="button" class="ar-btn" (click)="close()" [disabled]="adding()">Close</button>
          <button type="button" class="ar-btn primary" [disabled]="selected().size === 0 || adding()" (click)="add()">
            {{ adding() ? 'Adding…' : selected().size ? 'Add ' + selected().size + ' to project' : 'Select files to add' }}
          </button>
        </footer>
      </div>
    </div>

    <ng-template #empty>
      <div class="ar-empty-inner">
        <span class="ar-empty-ico">🗂️</span>
        Nothing found{{ query() ? ' for “' + query() + '”' : '' }}.
        <span class="ar-empty-actions">
          @if (query()) { <button type="button" class="ar-link" (click)="setQuery('')">Clear search</button> }
          @if (activeFilterCount()) { <button type="button" class="ar-link" (click)="resetFilters()">Reset filters</button> }
          @if (whereValue() !== whereAll) { <button type="button" class="ar-link" (click)="setWhere(whereAll)">Search all channels</button> }
        </span>
      </div>
    </ng-template>
  `,
  styles: [`
    .ar-backdrop { position: fixed; inset: 0; z-index: 2000; background: rgba(2, 6, 23, .72);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .ar-dialog { width: min(1180px, 100%); height: min(88vh, 900px); display: flex; flex-direction: column; gap: 10px;
      background: #0f1420; color: #e2e8f0; border: 1px solid #263044; border-radius: 12px; padding: 14px 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,.6); min-height: 0; }
    .ar-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .ar-title { display: flex; flex-direction: column; gap: 2px; }
    .ar-sub { font-size: .72rem; color: #94a3b8; }
    .ar-x { background: none; border: 0; color: #94a3b8; font-size: 1rem; cursor: pointer; padding: 4px 6px; border-radius: 6px; }
    .ar-x:hover { background: #1e293b; color: #e2e8f0; }

    .ar-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .ar-searchbox { position: relative; flex: 1 1 260px; min-width: 0; display: flex; align-items: center; }
    .ar-search-ico { position: absolute; left: 9px; font-size: .75rem; opacity: .6; pointer-events: none; }
    .ar-search { width: 100%; background: #0b1020; color: #e2e8f0; border: 1px solid #334155;
      border-radius: 8px; padding: 7px 30px; font-size: .85rem; }
    .ar-search:focus, .ar-proj-filter:focus, select:focus { outline: 2px solid #6366f1; outline-offset: -1px; }
    .ar-search::-webkit-search-cancel-button { display: none; }
    .ar-clear { position: absolute; right: 6px; background: none; border: 0; color: #94a3b8; cursor: pointer; font-size: .8rem; }
    .ar-field { display: inline-flex; align-items: center; gap: 6px; font-size: .72rem; color: #94a3b8; }
    select { background: #0b1020; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; padding: 5px 8px; font-size: .78rem; }
    .ar-seg { display: inline-flex; border: 1px solid #334155; border-radius: 6px; overflow: hidden; }
    .ar-seg button { background: #0b1020; color: #94a3b8; border: 0; padding: 5px 10px; font-size: .78rem; cursor: pointer; min-width: 30px; }
    .ar-seg button + button { border-left: 1px solid #334155; }
    .ar-seg button.on { background: #4f46e5; color: #fff; }
    .ar-filters-toggle { display: none; }

    .ar-main { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 14px; }
    .ar-side { display: flex; flex-direction: column; gap: 14px; overflow: auto; min-height: 0; padding-right: 4px; }
    .ar-side h4 { margin: 0 0 6px; font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: #64748b;
      display: flex; justify-content: space-between; }
    .ar-h-note { color: #475569; }
    .ar-where { width: 100%; }
    .ar-kinds, .ar-proj-list { display: flex; flex-direction: column; gap: 2px; }
    .ar-projects { min-height: 0; }
    .ar-proj-filter { width: 100%; box-sizing: border-box; background: #0b1020; color: #e2e8f0; border: 1px solid #334155;
      border-radius: 6px; padding: 5px 8px; font-size: .75rem; margin-bottom: 6px; }
    .ar-facet { display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%; text-align: left;
      background: none; color: #cbd5e1; border: 1px solid transparent; border-radius: 6px; padding: 5px 8px;
      font-size: .78rem; cursor: pointer; }
    .ar-facet:hover:not(:disabled) { background: #151c2c; }
    .ar-facet.on { background: #1e1b4b; border-color: #4f46e5; color: #fff; }
    .ar-facet:disabled { opacity: .4; cursor: default; }
    .ar-facet-name { display: flex; flex-direction: column; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ar-facet-name small { color: #93c5fd; font-size: .64rem; }
    .ar-count { font: .68rem ui-monospace, monospace; color: #94a3b8; background: #111827; border-radius: 999px; padding: 0 6px; flex: none; }
    .ar-facet.on .ar-count { background: #312e81; color: #e0e7ff; }

    .ar-results { display: flex; flex-direction: column; gap: 8px; min-height: 0; min-width: 0; }
    .ar-resultbar { display: flex; align-items: center; gap: 10px; min-height: 22px; }
    .ar-meta { font-size: .75rem; color: #94a3b8; margin-right: auto; display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .ar-meta strong { color: #e2e8f0; font-weight: 600; }
    .ar-spin { width: 10px; height: 10px; border: 2px solid #475569; border-top-color: #a5b4fc; border-radius: 50%;
      animation: ar-spin .7s linear infinite; display: inline-block; margin-left: 4px; }
    @keyframes ar-spin { to { transform: rotate(360deg); } }

    .ar-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; border-radius: 8px; transition: opacity .15s; }
    .ar-scroll.dim { opacity: .55; pointer-events: none; }
    .ar-grid { --ar-col: 190px; list-style: none; margin: 0; padding: 2px; display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--ar-col), 1fr)); grid-auto-rows: max-content; gap: 10px; }
    .ar-grid[data-size='s'] { --ar-col: 140px; }
    .ar-grid[data-size='l'] { --ar-col: 270px; }
    .ar-card { position: relative; display: flex; flex-direction: column; background: #111827; cursor: pointer;
      border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; transition: border-color .12s, transform .12s; user-select: none; }
    .ar-card:hover { border-color: #475569; }
    .ar-card.selected { border-color: #6366f1; box-shadow: 0 0 0 2px #6366f1; }
    .ar-card.added { opacity: .6; cursor: default; }
    .ar-thumb { position: relative; flex: none; aspect-ratio: 16 / 9; background: #0b1020;
      display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .ar-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ar-icon { font-size: 1.9rem; opacity: .8; }
    .ar-kind { position: absolute; left: 6px; bottom: 5px; font-size: .7rem; background: rgba(0,0,0,.65);
      border-radius: 3px; padding: 0 3px; }
    .ar-dur { position: absolute; right: 5px; bottom: 5px; background: rgba(0,0,0,.75); color: #fff;
      font: .65rem ui-monospace, monospace; padding: 1px 4px; border-radius: 3px; }
    .ar-check { width: 18px; height: 18px; border-radius: 5px; border: 2px solid rgba(255,255,255,.85);
      background: rgba(0,0,0,.45); color: #fff; font-size: .7rem; font-weight: 700;
      display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; }
    .ar-thumb .ar-check { position: absolute; top: 6px; left: 6px; opacity: .0; transition: opacity .12s; }
    .ar-card:hover .ar-check, .ar-card.selected .ar-check { opacity: 1; }
    .selected .ar-check { background: #4f46e5; border-color: #818cf8; }
    .ar-added { position: absolute; top: 6px; left: 6px; background: #14532d; color: #bbf7d0;
      font-size: .65rem; padding: 1px 6px; border-radius: 4px; }
    .ar-zoom { position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; border-radius: 6px; border: 0;
      background: rgba(0,0,0,.6); color: #fff; cursor: pointer; font-size: .8rem; opacity: 0; transition: opacity .12s; }
    .ar-card:hover .ar-zoom, .ar-zoom:focus-visible { opacity: 1; }
    .ar-body { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px 8px; min-width: 0; }
    .ar-name { font-size: .78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ar-proj { font-size: .68rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ar-grid[data-size='s'] .ar-body { padding: 4px 6px 6px; }
    .ar-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .ar-tag { font-size: .62rem; padding: 0 5px; border-radius: 3px; background: #1e293b; color: #cbd5e1; }
    .ar-tag.other { background: #172554; color: #93c5fd; }
    .ar-tag.warn { background: #422006; color: #fbbf24; }
    .ar-tag.ok { background: #14532d; color: #bbf7d0; }

    .ar-table { width: 100%; border-collapse: collapse; font-size: .76rem; table-layout: fixed; }
    .ar-table thead th { position: sticky; top: 0; z-index: 1; background: #0f1420; text-align: left; font-weight: 600;
      color: #64748b; font-size: .66rem; text-transform: uppercase; letter-spacing: .05em; padding: 6px; border-bottom: 1px solid #1f2937; }
    .ar-table td { padding: 5px 6px; border-bottom: 1px solid #161e2e; color: #cbd5e1; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
    .ar-table tbody tr { cursor: pointer; }
    .ar-table tbody tr:hover { background: #131a29; }
    .ar-table tr.selected { background: #1e1b4b; }
    .ar-table tr.added { opacity: .6; cursor: default; }
    .c-pick { width: 30px; } .c-thumb { width: 78px; } .c-proj { width: 22%; } .c-type { width: 64px; }
    .c-len { width: 58px; } .c-size { width: 70px; } .c-date { width: 92px; }
    .c-name { display: table-cell; }
    .c-name .ar-name { display: block; color: #e2e8f0; }
    .ar-mini { width: 68px; aspect-ratio: 16 / 9; border: 0; padding: 0; border-radius: 4px; overflow: hidden;
      background: #0b1020; cursor: zoom-in; display: flex; align-items: center; justify-content: center; }
    .ar-mini img { width: 100%; height: 100%; object-fit: cover; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

    .ar-empty { grid-column: 1 / -1; list-style: none; }
    .ar-empty-inner { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #94a3b8;
      font-size: .82rem; padding: 48px 0; white-space: normal; }
    .ar-empty-ico { font-size: 2rem; opacity: .7; }
    .ar-empty-actions { display: flex; gap: 12px; }
    .ar-link { background: none; border: 0; color: #a5b4fc; cursor: pointer; text-decoration: underline; font-size: .75rem; padding: 0; }

    .ar-pager { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center; padding-top: 2px; }
    .ar-pg { min-width: 30px; background: #111827; color: #cbd5e1; border: 1px solid #263044; border-radius: 6px;
      padding: 4px 8px; font-size: .75rem; cursor: pointer; }
    .ar-pg:hover:not(:disabled) { border-color: #475569; }
    .ar-pg.on { background: #4f46e5; border-color: #6366f1; color: #fff; }
    .ar-pg:disabled { opacity: .4; cursor: default; }
    .ar-gap { color: #64748b; padding: 0 2px; }
    .ar-pagesize { margin-left: 10px; }

    .ar-preview { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr); gap: 14px; }
    .ar-preview-media { position: relative; background: #000; border-radius: 8px; display: flex; align-items: center;
      justify-content: center; overflow: hidden; min-height: 200px; }
    .ar-preview-media video, .ar-preview-media img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .ar-preview-media audio { width: 80%; }
    .ar-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 48px; border: 0; border-radius: 8px;
      background: rgba(15,20,32,.75); color: #fff; font-size: 1.5rem; cursor: pointer; }
    .ar-nav.prev { left: 8px; } .ar-nav.next { right: 8px; }
    .ar-nav:disabled { opacity: .25; cursor: default; }
    .ar-noprev { color: #94a3b8; font-size: .8rem; padding: 40px; }
    .ar-preview-info { display: flex; flex-direction: column; gap: 8px; font-size: .78rem; color: #94a3b8; min-width: 0; overflow: auto; }
    .ar-preview-info strong { color: #e2e8f0; font-size: .95rem; overflow-wrap: anywhere; }
    .ar-preview-info dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; margin: 0; }
    .ar-preview-info dt { color: #64748b; }
    .ar-preview-info dd { margin: 0; color: #cbd5e1; overflow-wrap: anywhere; }
    .ar-preview-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: auto; }

    .ar-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap;
      border-top: 1px solid #1f2937; padding-top: 10px; }
    .ar-foot .ar-note { margin-right: auto; }
    .ar-selcount { color: #c7d2fe; }
    .ar-note { font-size: .7rem; color: #94a3b8; margin: 0; }
    .ar-err { color: #f87171; font-size: .75rem; margin: 0; }
    .ar-btn { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px;
      padding: 6px 12px; font-size: .8rem; cursor: pointer; }
    .ar-btn:hover:not(:disabled) { border-color: #475569; }
    .ar-btn.primary { background: #4f46e5; border-color: #6366f1; }
    .ar-btn:disabled { opacity: .5; cursor: not-allowed; }

    @media (max-width: 760px) {
      .ar-dialog { height: 94vh; padding: 12px; }
      .ar-filters-toggle { display: inline-block; }
      .ar-main { grid-template-columns: minmax(0, 1fr); }
      .ar-side { display: none; max-height: 40vh; border-bottom: 1px solid #1f2937; padding-bottom: 10px; }
      .ar-side.open { display: flex; }
      .ar-main:has(.ar-side.open) { grid-template-rows: auto minmax(0, 1fr); }
      .ar-preview { grid-template-columns: 1fr; grid-template-rows: minmax(180px, 1fr) auto; }
      .c-proj, .c-type, .c-size, .c-date { display: none; }
      .ar-grid { --ar-col: 140px; }
    }
  `],
})
export class AssetReuseDialogComponent implements OnInit {
  readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  readonly projectId = input.required<string>();
  /** This project's channel, for the "This channel" label. Null means the default channel. */
  readonly channelId = input<string | null | undefined>(null);
  /** A folder of this project to put the added files in; null or a virtual folder leaves them at the root. */
  readonly folderId = input<string | null>(null);
  /** Pre-selects a file type, e.g. 'video' when opened from a video timeline. */
  readonly initialKind = input<KindFilter>('');

  /** Ids of the files now in this project, once some were added. */
  readonly added = output<string[]>();
  readonly closed = output<void>();

  readonly maxQuery = 100;
  readonly whereThis = WHERE_THIS;
  readonly whereAll = WHERE_ALL;
  readonly pageSizes = [24, 48, 96] as const;
  readonly kinds: { value: KindFilter; label: string; icon: string }[] = [
    { value: '', label: 'All types', icon: '✳️' },
    { value: 'video', label: 'Videos', icon: '🎬' },
    { value: 'image', label: 'Images', icon: '🖼️' },
    { value: 'audio', label: 'Audio', icon: '🎵' },
    { value: 'subtitle', label: 'Subtitles', icon: '💬' },
  ];
  readonly sorts: { value: AssetSearchSort; label: string }[] = [
    { value: 'relevance', label: 'Best match' },
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'Name A–Z' },
    { value: 'largest', label: 'Largest first' },
  ];
  readonly sizes: { value: ThumbSize; label: string; title: string }[] = [
    { value: 's', label: 'S', title: 'Small thumbnails' },
    { value: 'm', label: 'M', title: 'Medium thumbnails' },
    { value: 'l', label: 'L', title: 'Large thumbnails' },
  ];

  readonly query = signal('');
  readonly scope = signal<AssetSearchScope>('channel');
  /** Another brand channel to look in instead of the scope; null when the scope decides. */
  readonly channel = signal<string | null>(null);
  readonly project = signal<string | null>(null);
  readonly kind = signal<KindFilter>('');
  readonly sort = signal<AssetSearchSort>('relevance');
  readonly page = signal(0);
  readonly pageSize = signal<number>(48);
  readonly view = signal<ViewMode>('grid');
  readonly size = signal<ThumbSize>('m');
  readonly filtersOpen = signal(false);
  readonly projectFilter = signal('');

  readonly hits = signal<AssetSearchHit[]>([]);
  readonly total = signal(0);
  readonly projectsSearched = signal(0);
  readonly kindCounts = signal<Record<string, number>>({});
  readonly projects = signal<AssetSearchProject[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private readonly failedThumbs = signal(new Set<string>());

  readonly preview = signal<AssetSearchHit | null>(null);
  /** Selected hits by asset id; kept across searches and pages so a pick survives refining the query. */
  readonly selected = signal(new Map<string, AssetSearchHit>());
  readonly adding = signal(false);
  readonly addError = signal<string | null>(null);
  /** The last clicked row, for shift-click range selection. */
  private anchorIndex: number | null = null;

  private readonly channels = signal<BrandChannel[]>([]);
  readonly ownChannelId = computed(() => this.channelId() || DEFAULT_BRAND_CHANNEL);
  readonly otherChannels = computed(() => this.channels().filter((c) =>
    c.id !== this.ownChannelId() && !(c.isDefault && this.ownChannelId() === DEFAULT_BRAND_CHANNEL)));

  readonly whereValue = computed(() => this.channel() ?? (this.scope() === 'all' ? WHERE_ALL : WHERE_THIS));
  readonly activeFilterCount = computed(() =>
    (this.whereValue() !== WHERE_THIS ? 1 : 0) + (this.project() ? 1 : 0) + (this.kind() ? 1 : 0));

  readonly projectsTotal = computed(() => this.projects().reduce((n, p) => n + p.matches, 0));
  readonly visibleProjects = computed(() => {
    const f = this.projectFilter().trim().toLowerCase();
    return f ? this.projects().filter((p) => p.name.toLowerCase().includes(f)) : this.projects();
  });
  /** The chosen project has no matches under the other filters, so the list no longer shows it. */
  readonly selectedProjectMissing = computed(() =>
    !!this.project() && !this.projects().some((p) => p.id === this.project()));

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly rangeStart = computed(() => (this.total() ? this.page() * this.pageSize() + 1 : 0));
  readonly rangeEnd = computed(() => this.page() * this.pageSize() + this.hits().length);
  /** Page numbers to show (0-based), null for an ellipsis. */
  readonly pageButtons = computed<(number | null)[]>(() => {
    const count = this.pageCount();
    const current = this.page();
    const keep = new Set([0, count - 1, current - 1, current, current + 1].filter((n) => n >= 0 && n < count));
    const sorted = [...keep].sort((a, b) => a - b);
    const out: (number | null)[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
      out.push(n);
    });
    return out;
  });

  readonly selectableOnPage = computed(() => this.hits().filter((h) => !h.alreadyAdded));
  readonly allPageSelected = computed(() =>
    this.selectableOnPage().length > 0 && this.selectableOnPage().every((h) => this.selected().has(h.asset.id)));
  readonly selectedElsewhere = computed(() => {
    const onPage = new Set(this.hits().map((h) => h.asset.id));
    return [...this.selected().keys()].filter((id) => !onPage.has(id)).length;
  });
  readonly previewIndex = computed(() => {
    const p = this.preview();
    return p ? this.hits().findIndex((h) => h.asset.id === p.asset.id) : -1;
  });

  private readonly searches = new Subject<{ request: SearchRequest; immediate: boolean }>();

  constructor() {
    this.searches.pipe(
      // Only typing waits; a click on a filter or a page searches straight away.
      debounce((s) => timer(s.immediate ? 0 : SEARCH_DEBOUNCE_MS)),
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap(({ request: r }) => this.api.searchReusableAssets(this.projectId(), {
        q: r.q || undefined, scope: r.scope, channel: r.channel ?? undefined, project: r.project ?? undefined,
        kind: r.kind || undefined, sort: r.sort, offset: r.offset, limit: r.limit,
      }).pipe(catchError((err: unknown) => {
        this.error.set(err instanceof ApiFailure && err.message ? err.message : 'Search failed.');
        return of(null);
      }))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.loading.set(false);
      this.anchorIndex = null;
      if (!result) { this.hits.set([]); this.total.set(0); return; }
      this.hits.set(result.items);
      this.total.set(result.total ?? result.items.length);
      this.projectsSearched.set(result.projectsSearched);
      this.kindCounts.set(result.kindCounts ?? {});
      this.projects.set(result.projects ?? []);
      this.scroller()?.nativeElement.scrollTo({ top: 0 });
      // A page past the end (e.g. after the results shrank) falls back to the last one.
      if (result.items.length === 0 && this.page() > 0 && this.total() > 0) this.goToPage(this.pageCount() - 1);
    });
  }

  ngOnInit(): void {
    this.loadPrefs();
    this.kind.set(this.initialKind());
    this.api.listBrandChannels().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (c) => this.channels.set(c), error: () => this.channels.set([]) });
    this.search(true);
  }

  setQuery(value: string): void {
    this.query.set((value ?? '').slice(0, this.maxQuery));
    this.page.set(0);
    this.search(false);
  }

  setWhere(value: string): void {
    if (value === this.whereValue()) return;
    if (value === WHERE_THIS) { this.scope.set('channel'); this.channel.set(null); }
    else if (value === WHERE_ALL) { this.scope.set('all'); this.channel.set(null); }
    else { this.scope.set('all'); this.channel.set(value); }
    // The chosen project may not be on the new channel.
    this.project.set(null);
    this.restart();
  }

  setProject(id: string | null): void {
    if (this.project() === id) return;
    this.project.set(id);
    this.restart();
  }

  setKind(kind: KindFilter): void {
    if (this.kind() === kind) return;
    this.kind.set(kind);
    this.restart();
  }

  setSort(sort: AssetSearchSort): void {
    if (this.sort() === sort || !this.sorts.some((s) => s.value === sort)) return;
    this.sort.set(sort);
    this.restart();
  }

  setPageSize(size: number): void {
    if (!(this.pageSizes as readonly number[]).includes(size) || this.pageSize() === size) return;
    // Keep the first file on screen in view.
    const firstIndex = this.page() * this.pageSize();
    this.pageSize.set(size);
    this.page.set(Math.floor(firstIndex / size));
    this.savePrefs();
    this.search(true);
  }

  setView(view: ViewMode): void { this.view.set(view); this.savePrefs(); }
  setSize(size: ThumbSize): void { this.size.set(size); this.savePrefs(); }

  goToPage(page: number): void {
    const next = Math.min(Math.max(page, 0), this.pageCount() - 1);
    if (next === this.page() && this.hits().length) return;
    this.page.set(next);
    this.preview.set(null);
    this.search(true);
  }

  resetFilters(): void {
    this.scope.set('channel');
    this.channel.set(null);
    this.project.set(null);
    this.kind.set('');
    this.projectFilter.set('');
    this.restart();
  }

  isSelected(h: AssetSearchHit): boolean {
    return this.selected().has(h.asset.id);
  }

  toggle(h: AssetSearchHit): void {
    if (h.alreadyAdded) return;
    this.selected.update((current) => {
      const next = new Map(current);
      if (next.has(h.asset.id)) next.delete(h.asset.id); else next.set(h.asset.id, h);
      return next;
    });
  }

  /** A click toggles one file; shift-click sets every file between it and the last click to match. */
  onItemClick(h: AssetSearchHit, index: number, event: MouseEvent): void {
    if (h.alreadyAdded) return;
    if (event.shiftKey && this.anchorIndex !== null) {
      const select = !this.isSelected(h);
      const [from, to] = [Math.min(this.anchorIndex, index), Math.max(this.anchorIndex, index)];
      const range = this.hits().slice(from, to + 1).filter((x) => !x.alreadyAdded);
      this.selected.update((current) => {
        const next = new Map(current);
        for (const x of range) { if (select) next.set(x.asset.id, x); else next.delete(x.asset.id); }
        return next;
      });
    } else {
      this.toggle(h);
    }
    this.anchorIndex = index;
  }

  selectPage(): void {
    this.selected.update((current) => {
      const next = new Map(current);
      for (const h of this.selectableOnPage()) next.set(h.asset.id, h);
      return next;
    });
  }

  unselectPage(): void {
    this.selected.update((current) => {
      const next = new Map(current);
      for (const h of this.hits()) next.delete(h.asset.id);
      return next;
    });
  }

  clearSelection(): void {
    this.selected.set(new Map());
  }

  stepPreview(delta: number): void {
    const i = this.previewIndex();
    if (i < 0) return;
    const next = this.hits()[i + delta];
    if (next) this.preview.set(next);
  }

  kindCount(kind: KindFilter): number {
    const counts = this.kindCounts();
    return kind ? counts[kind] ?? 0 : Object.values(counts).reduce((a, b) => a + b, 0);
  }

  hasThumb(h: AssetSearchHit): boolean {
    return (h.asset.kind === 'Video' || h.asset.kind === 'Image') && !this.failedThumbs().has(h.asset.id);
  }

  thumbFailed(id: string): void {
    this.failedThumbs.update((s) => new Set(s).add(id));
  }

  kindIcon(kind: string): string {
    switch (kind) {
      case 'Video': return '🎬';
      case 'Image': return '🖼️';
      case 'Audio': return '🎵';
      case 'Subtitle': return '💬';
      default: return '📄';
    }
  }

  channelName(id: string): string {
    const channel = this.channels().find((c) => c.id === id) ?? (id === DEFAULT_BRAND_CHANNEL ? this.channels().find((c) => c.isDefault) : undefined);
    return channel?.name ?? (id === DEFAULT_BRAND_CHANNEL ? 'Default channel' : 'Another channel');
  }

  needsReview(h: AssetSearchHit): boolean {
    return h.asset.reviewStatus !== 'NotRequired' && h.asset.reviewStatus !== 'Approved';
  }

  describe(h: AssetSearchHit): string {
    const a = h.asset;
    const parts: string[] = [a.kind];
    if (a.width && a.height) parts.push(`${a.width}×${a.height}`);
    if (a.durationSeconds) parts.push(this.formatDuration(a.durationSeconds));
    parts.push(this.formatSize(a.fileSizeBytes));
    if (h.isExport) parts.push('exported cut');
    return parts.join(' · ');
  }

  formatDuration(seconds: number): string {
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Copies the selection in, one request per source project (the copy endpoint takes one
   * source at a time), then files the copies into the chosen folder.
   */
  async add(): Promise<void> {
    const picks = [...this.selected().values()];
    if (picks.length === 0 || this.adding()) return;
    this.adding.set(true);
    this.addError.set(null);

    const bySource = new Map<string, string[]>();
    for (const h of picks) bySource.set(h.projectId, [...(bySource.get(h.projectId) ?? []), h.asset.id]);

    const addedIds: string[] = [];
    const copiedSources = new Set<string>();
    let failed = 0;

    for (const [sourceProjectId, ids] of bySource) {
      try {
        const mapping = await firstValueFrom(this.api.copyAssetsFromProject(this.projectId(), sourceProjectId, ids));
        for (const id of ids) {
          if (mapping[id]) { addedIds.push(mapping[id]); copiedSources.add(id); } else failed++;
        }
      } catch {
        failed += ids.length;
      }
    }

    // The files are in the project either way; a failed move only leaves one at the root.
    let unfiled = 0;
    const folder = this.folderId();
    if (folder) {
      for (const id of addedIds) {
        try { await firstValueFrom(this.api.moveAssetToFolder(this.projectId(), id, folder)); }
        catch { unfiled++; }
      }
    }

    this.hits.update((list) => list.map((h) => (copiedSources.has(h.asset.id) ? { ...h, alreadyAdded: true } : h)));
    this.preview.update((p) => (p && copiedSources.has(p.asset.id) ? { ...p, alreadyAdded: true } : p));
    this.selected.update((current) => {
      const next = new Map(current);
      for (const id of copiedSources) next.delete(id);
      return next;
    });
    const problems: string[] = [];
    if (failed > 0) problems.push(`${failed} file${failed === 1 ? '' : 's'} could not be added.`);
    if (unfiled > 0) problems.push(`${unfiled} added file${unfiled === 1 ? ' was' : 's were'} left at the library root.`);
    this.addError.set(problems.length > 0 ? problems.join(' ') : null);
    this.adding.set(false);
    if (addedIds.length > 0) this.added.emit(addedIds);
  }

  onEscape(): void {
    if (this.preview()) this.preview.set(null); else this.close();
  }

  close(): void {
    if (this.adding()) return;
    this.closed.emit();
  }

  /** A filter changed: back to the first page and search now. */
  private restart(): void {
    this.page.set(0);
    this.preview.set(null);
    this.search(true);
  }

  private search(immediate: boolean): void {
    this.searches.next({
      immediate,
      request: {
        q: this.query().trim(), scope: this.scope(), channel: this.channel(), project: this.project(),
        kind: this.kind(), sort: this.sort(), offset: this.page() * this.pageSize(), limit: this.pageSize(),
      },
    });
  }

  /** Layout choices are a per-viewer convenience; storage may be unavailable, and the defaults still work. */
  private loadPrefs(): void {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<{ view: string; size: string; pageSize: number }>;
      if (p.view === 'grid' || p.view === 'list') this.view.set(p.view);
      if (p.size === 's' || p.size === 'm' || p.size === 'l') this.size.set(p.size);
      if (typeof p.pageSize === 'number' && (this.pageSizes as readonly number[]).includes(p.pageSize)) this.pageSize.set(p.pageSize);
    } catch { /* unreadable or blocked storage: keep the defaults */ }
  }

  private savePrefs(): void {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ view: this.view(), size: this.size(), pageSize: this.pageSize() }));
    } catch { /* storage blocked: the choice just isn't remembered */ }
  }
}
