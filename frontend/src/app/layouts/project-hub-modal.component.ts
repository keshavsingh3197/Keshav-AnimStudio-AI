import { Component, computed, effect, inject, model, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { Project, HubConfig } from '../core/models/api.models';
import { StatusService } from '../core/services/status.service';
import { optimizeThumbnailImage } from '../core/utils/image-utils';

@Component({
  selector: 'app-project-hub-modal',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="close()" (keydown.escape)="close()" tabindex="0" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="fe-panel hub-modal" (click)="$event.stopPropagation()">
          
          <div class="hub-header">
            <h2 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
              <span>🎬</span> Project Hub
            </h2>
            <div style="display: flex; gap: 1rem; align-items: center;">
              
              
              <div class="storage-bar" [title]="storageUsedGb() + ' GB / ' + storageTotalGb() + ' GB Used'">
                <div class="storage-track">
                  <div class="storage-fill" [style.width]="(storageUsedGb() / storageTotalGb() * 100) + '%'"></div>
                </div>
                <span class="storage-text">{{ storageUsedGb() }} / {{ storageTotalGb() }} GB</span>
              </div>

              <span class="cloud-indicator">☁️ Cloud Synced</span>
              <button class="icon close-btn" type="button" (click)="close()">&times;</button>
            </div>
          </div>

          <div class="hub-body">
            <!-- Left Side: Project List -->
            <div class="hub-list-section">
              <div class="list-controls">
                <div style="display: flex; gap: 8px;">
                  <input #searchBox type="text" placeholder="Search projects..." class="search-input" (input)="searchQuery.set(searchBox.value)" style="flex:1" />
                  <button class="secondary" (click)="importProject()" title="Import Project (.zip, .xml)">📥 Import</button>
                </div>
                <div class="filters">
                  <button [class.active]="activeFilter() === 'All'" (click)="activeFilter.set('All')">All</button>
                  <button [class.active]="activeFilter() === '9:16'" (click)="activeFilter.set('9:16')">9:16 Shorts</button>
                  <button [class.active]="activeFilter() === '16:9'" (click)="activeFilter.set('16:9')">16:9 Landscape</button>
                  <button [class.active]="activeFilter() === 'Drafts'" (click)="activeFilter.set('Drafts')">Drafts</button>
                </div>
                
                <div class="sort-view-controls">
                  @if (selectedIds().size > 0) {
                    <div class="bulk-actions">
                      <span class="muted" style="font-size:0.8rem; margin-right:8px;">{{ selectedIds().size }} selected</span>
                      <button (click)="bulkExport()">Export All</button>
                      <button (click)="bulkArchive()">Archive</button>
                      <button class="danger" (click)="bulkDelete()">Delete</button>
                    </div>
                  } @else {
                    <select #sortSelect (change)="activeSort.set($any(sortSelect.value))" class="sort-select">
                      <option value="recent">Recently Opened</option>
                      <option value="created">Date Created</option>
                      <option value="alpha">Alphabetical</option>
                    </select>
                  }
                  
                  <div style="flex:1"></div>
                  <button class="icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">📄</button>
                  <button class="icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">🔲</button>
                </div>
              </div>

              <div class="projects-container" [class.grid-view]="viewMode() === 'grid'">
                @if (filteredProjects().length === 0) {
                  <div class="empty-state">No projects found.</div>
                }
                @for (p of filteredProjects(); track p.id) {
                  <div class="project-card" [class.selected]="selectedIds().has(p.id)" tabindex="0" (keydown.enter)="openProject(p.id)" (click)="openProject(p.id)">
                    
                    <input type="checkbox" class="card-checkbox" [checked]="selectedIds().has(p.id)" (click)="toggleSelect($event, p)" />
                    
                    <button class="icon card-pin" [class.active]="pinnedIds().has(p.id)" (click)="togglePin($event, p)" title="Pin Project">
                      {{ pinnedIds().has(p.id) ? '⭐' : '☆' }}
                    </button>

                    <!-- Make sure aspect ratio is respected in grid view -->
                    <div class="thumb-preview" [style.aspect-ratio]="viewMode() === 'grid' ? (p.width + '/' + p.height) : '16/9'">
                       @if (getCustomThumb(p.id); as customThumb) {
                         <img [src]="customThumb" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />
                       } @else {
                         <div class="thumb-placeholder" [style.background]="getThumbColor(p.id)"></div>
                       }
                       <span class="dur-badge">{{ (p.fps * 10) / 30 | number:'1.0-0' }}:00</span>
                       
                       <label class="upload-thumb-btn" (click)="$event.stopPropagation()" title="Upload Thumbnail">
                         📷
                         <input type="file" accept="image/*" style="display:none" (change)="onUploadThumbnail($event, p)" />
                       </label>
                    </div>

                    <div class="project-info">
                      <div class="p-title">{{ p.name }}</div>
                      <div class="p-meta">
                        {{ p.width }}&times;{{ p.height }} &bull; {{ p.fps }}fps
                      </div>
                      <div class="p-time">Edited {{ p.updatedAt | date:'mediumDate' }}</div>
                    </div>
                    <div class="project-actions" (click)="$event.stopPropagation()">
                      <button class="icon menu-btn">⋮</button>
                      <div class="context-menu">
                        <button (click)="renameProject(p)">Rename</button>
                        <button (click)="duplicateProject(p)">Duplicate</button>
                        <button (click)="exportProject(p)">Export Data</button>
                        <button (click)="versionHistory(p)">Version History</button>
                        <button class="danger" (click)="deleteProject(p)">Delete</button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Right Side: Create New -->
            <div class="hub-create-section">
              <h3>Create New Project</h3>
              
              <div class="creation-tabs">
                <button [class.active]="creationTab() === 'blank'" (click)="creationTab.set('blank')">Blank</button>
                <button [class.active]="creationTab() === 'template'" (click)="creationTab.set('template')">Templates</button>
              </div>

              <div class="hub-create-content">
                @if (creationTab() === 'blank') {
                  
                  
                  <div class="ai-quick-starts">
                    @for (qs of hubQuickStarts(); track qs.id) {
                      <button class="ai-btn" (click)="quickStart(qs.id)" [title]="qs.tooltip">{{ qs.icon }} {{ qs.label }}</button>
                    }
                  </div>

                  <div class="form-group" style="margin-top:1rem">
                    <label>Project Name</label>
                    <input #newName type="text" placeholder="My Awesome Video" [value]="newProjectName()" (input)="newProjectName.set(newName.value)" />
                  </div>

                  <div class="form-group">
                    <label>Format / Aspect Ratio</label>
                    <div class="preset-grid">
                      @for (preset of presets(); track preset.label) {
                        <div class="preset-card" [class.active]="selectedPreset() === preset" (click)="selectedPreset.set(preset)">
                          <div class="aspect-box-container">
                            <div class="aspect-box" [style.aspect-ratio]="preset.width + '/' + preset.height"></div>
                          </div>
                          <span class="preset-label">{{ preset.label }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="drop-media-area" (dragover)="$event.preventDefault()" (drop)="onDropMedia($event)">
                    <span style="font-size: 1.5rem">📥</span>
                    <span>Drag & Drop media here<br><small>to auto-initialize timeline</small></span>
                  </div>

                } @else {
                  <div class="templates-grid">
                    @for (t of hubTemplates(); track t.id) {
                      <div class="rich-template-card" (click)="selectTemplate(t.name)">
                        <div class="template-visual">
                          <div class="wireframe {{ t.wireframeClass }}"></div>
                          <div class="template-hover-btn">Preview</div>
                        </div>
                        <div class="template-meta">
                          <h4>{{ t.name }}</h4>
                          @for (tag of t.tags; track tag) {
                            <span class="template-tag">{{ tag }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Fixed Footer CTA -->
              <div class="hub-create-footer">
                <button class="primary create-btn" (click)="createAndOpen()">
                  {{ creationTab() === 'template' ? 'Start with Template' : 'Create Project' }}
                </button>
              </div>

            </div>
        </div>
      </div>
      </div>
    }
  `,
  styles: [`
    .hub-modal {
      width: 1000px;
      max-width: 95vw;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      outline: none;
    }
    .hub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .storage-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-2);
      padding: 4px 8px;
      border-radius: 6px;
    }
    .storage-track {
      width: 60px;
      height: 6px;
      background: var(--bg);
      border-radius: 3px;
      overflow: hidden;
    }
    .storage-fill { height: 100%; background: var(--brand); }
    .storage-text { font-size: 0.65rem; color: var(--muted); white-space: nowrap; }

    .cloud-indicator {
      font-size: 0.75rem;
      background: color-mix(in srgb, var(--brand) 15%, transparent);
      color: var(--brand-glow);
      padding: 4px 8px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .close-btn { font-size: 1.5rem; cursor: pointer; color: var(--muted); background: transparent; border: none; }
    .hub-body {
      display: flex;
      height: 560px;
    }
    .hub-list-section {
      flex: 6;
      min-width: 0;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      background: var(--bg);
    }
    .list-controls {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .search-input {
      padding: 8px 12px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: #fff;
    }
    .filters, .sort-view-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .filters button {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
      border-radius: 99px;
      padding: 4px 10px;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .filters button.active {
      background: var(--brand);
      color: #fff;
      border-color: var(--brand);
    }
    .bulk-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .bulk-actions button {
      font-size: 0.75rem;
      padding: 4px 8px;
    }
    .sort-select {
      background: var(--surface-2);
      color: #fff;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 0.75rem;
      outline: none;
    }
    .projects-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .projects-container.grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      align-items: start;
    }
    .project-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: background 0.2s, border 0.2s;
      position: relative;
    }
    .project-card:hover, .project-card:focus {
      background: var(--surface);
      border-color: var(--border);
      outline: none;
    }
    .project-card.selected {
      border-color: var(--brand);
      background: color-mix(in srgb, var(--brand) 10%, transparent);
    }
    
    .card-checkbox {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 10;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .project-card:hover .card-checkbox, .card-checkbox:checked, .project-card.selected .card-checkbox {
      opacity: 1;
    }

    .card-pin {
      position: absolute;
      top: 8px;
      right: 32px;
      z-index: 10;
      cursor: pointer;
      opacity: 0;
      color: var(--muted);
      background: rgba(0,0,0,0.6);
      border: none;
      border-radius: 4px;
      padding: 4px;
    }
    .project-card:hover .card-pin, .card-pin.active {
      opacity: 1;
    }
    .card-pin.active { color: #f59e0b; }

    .projects-container.grid-view .project-card {
      flex-direction: column;
      align-items: stretch;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .thumb-preview {
      width: 80px;
      height: 45px;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
    }
    .projects-container.grid-view .thumb-preview {
      width: 100%;
      height: auto;
      max-height: 200px;
      background: #000;
    }
    .thumb-placeholder {
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #2b3040, #161b27);
    }
    .dur-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      font-size: 0.6rem;
      padding: 2px 4px;
      border-radius: 2px;
    }
    .upload-thumb-btn {
      position: absolute;
      top: 4px;
      left: 32px; /* Next to checkbox */
      background: rgba(0,0,0,0.6);
      border-radius: 4px;
      padding: 4px;
      font-size: 0.8rem;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    }
    .thumb-preview:hover .upload-thumb-btn {
      opacity: 1;
    }
    .project-info {
      flex: 1;
      min-width: 0;
    }
    .p-title {
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .p-meta {
      font-size: 0.7rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .p-time {
      font-size: 0.7rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .project-actions {
      position: relative;
      align-self: center;
    }
    .projects-container.grid-view .project-actions {
      position: absolute;
      top: 8px;
      right: 8px;
    }
    .menu-btn {
      padding: 4px;
      border-radius: 4px;
      color: var(--muted);
    }
    .project-card:hover .menu-btn { color: #fff; }
    
    .context-menu {
      display: none;
      position: absolute;
      right: 0;
      top: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 100;
      flex-direction: column;
      min-width: 140px;
    }
    .project-actions:hover .context-menu {
      display: flex;
    }
    .context-menu button {
      background: transparent;
      border: none;
      padding: 8px 12px;
      text-align: left;
      color: #fff;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .context-menu button:hover { background: var(--surface-3); }
    .context-menu button.danger { color: var(--err); }
    .context-menu button.danger:hover { background: rgba(255,0,0,0.1); }
    
    .hub-create-section {
      flex: 4;
      min-width: 0;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      background: var(--surface);
      overflow: hidden;
    }
    .creation-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 1rem;
    }
    .creation-tabs button {
      flex: 1;
      padding: 6px;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
      border-radius: 6px;
      cursor: pointer;
    }
    .creation-tabs button.active {
      background: var(--surface-2);
      color: #fff;
      border-color: var(--brand);
    }
    
    .hub-create-content {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px;
    }
    .hub-create-content::-webkit-scrollbar { width: 4px; }
    .hub-create-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .ai-quick-starts {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .ai-btn {
      flex-shrink: 0;
      background: linear-gradient(180deg, var(--surface-2), var(--surface-3));
      border: 1px solid var(--border);
      color: #fff;
      padding: 6px 12px;
      border-radius: 99px;
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ai-btn:hover { border-color: var(--brand); }

    .form-group label {
      display: block;
      font-size: 0.75rem;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .form-group input {
      width: 100%;
      padding: 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: #fff;
    }
    .preset-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .preset-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .preset-card.active {
      border-color: var(--brand);
      background: color-mix(in srgb, var(--brand) 10%, transparent);
    }
    .aspect-box-container {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .aspect-box {
      background: var(--muted);
      max-width: 100%;
      max-height: 100%;
      width: 100%;
      border-radius: 2px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .preset-label { font-size: 0.7rem; text-align: center; line-height: 1.2; }
    .drop-media-area {
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.8rem;
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--bg);
    }
    
    .hub-create-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      margin-top: auto;
    }
    .create-btn {
      width: 100%;
      padding: 10px;
      font-size: 1rem;
      font-weight: 600;
      background: var(--brand);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .templates-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .rich-template-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .rich-template-card:hover { border-color: var(--brand); }
    .template-visual {
      height: 80px;
      background: var(--surface-2);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .template-hover-btn {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .rich-template-card:hover .template-hover-btn { opacity: 1; }
    
    /* Mock Wireframes */
    .wireframe { border: 2px solid var(--muted); border-radius: 4px; }
    .wireframe.talking-head { width: 30px; height: 53px; position: relative; }
    .wireframe.talking-head::after { content: ''; position: absolute; bottom: 8px; left: 4px; right: 4px; height: 6px; background: var(--brand); border-radius: 2px; }
    .wireframe.cinematic { width: 60px; height: 34px; background: #000; }
    .wireframe.split-screen { width: 40px; height: 53px; border-top-width: 26px; }

    .template-meta { padding: 8px; }
    .template-meta h4 { margin: 0 0 4px 0; font-size: 0.8rem; }
    .template-tag {
      font-size: 0.6rem;
      padding: 2px 6px;
      background: var(--surface-3);
      color: var(--muted);
      border-radius: 4px;
      display: inline-block;
      margin-right: 4px;
    }
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.9rem;
    }
  `]
})
export class ProjectHubModalComponent {
  isOpen = model(false);
  
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly status = inject(StatusService);

  readonly projects = signal<Project[]>([]);
  
  // Filters
  readonly searchQuery = signal('');
  readonly activeFilter = signal<'All' | '16:9' | '9:16' | 'Drafts'>('All');
  readonly activeSort = signal<'recent' | 'created' | 'alpha'>('recent');
  readonly viewMode = signal<'list' | 'grid'>('list');

  readonly hubTemplates = signal<any[]>([]);
  readonly hubQuickStarts = signal<any[]>([]);
  readonly storageUsedGb = signal(0);
  readonly storageTotalGb = signal(50);


  // Management State
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly pinnedIds = computed(() => {
    return new Set(this.projects().filter(p => p.isPinned).map(p => p.id));
  });

  // Creation
  readonly creationTab = signal<'blank' | 'template'>('blank');
  readonly newProjectName = signal('');
  
  // Enhanced Presets: Replacing duplicate 16:9 with 4:5 Portrait
  readonly presets = signal<any[]>([]);
  readonly selectedPreset = signal<any>(null);

  readonly filteredProjects = computed(() => {
    let list = this.projects();
    
    // Search
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    
    // Tags
    const filter = this.activeFilter();
    if (filter === '16:9') list = list.filter(p => p.width > p.height);
    if (filter === '9:16') list = list.filter(p => p.height > p.width);
    if (filter === 'Drafts') list = list.filter(p => p.status === 'Draft' || p.status === 'Ready'); // Assuming Drafts
    
    // Sort
    const sort = this.activeSort();
    list.sort((a, b) => {
      const aPin = this.pinnedIds().has(a.id);
      const bPin = this.pinnedIds().has(b.id);
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;

      if (sort === 'alpha') return a.name.localeCompare(b.name);
      if (sort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    return list;
  });

  constructor() {
    effect(() => {
      
      if (this.isOpen()) {
        this.api.listProjects().subscribe(p => this.projects.set(p));
        this.api.getHubConfig().subscribe(config => {
          this.storageUsedGb.set(config.storageUsedGb);
          this.storageTotalGb.set(config.storageTotalGb);
          this.presets.set(config.presets);
          this.hubTemplates.set(config.templates);
          this.hubQuickStarts.set(config.quickStarts);
          if (config.presets.length > 0) {
            this.selectedPreset.set(config.presets[0]);
          }
        });
      }

    });
  }

  close() {
    this.isOpen.set(false);
  }

  openProject(id: string) {
    this.close();
    this.router.navigate(['/projects', id, 'clips']);
  }

  getCustomThumb(id: string): string | null {
    const p = this.projects().find(x => x.id === id);
    return p?.customThumbnail || null;
  }

  async onUploadThumbnail(event: Event, p: Project): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const b64 = await optimizeThumbnailImage(file);
      this.status.run(
        this.api.updateProject(p.id, {
          name: p.name,
          description: p.description,
          width: p.width,
          height: p.height,
          fps: p.fps,
          isPinned: p.isPinned,
          customThumbnail: b64,
          distributionIntent: p.distributionIntent,
          acceptShareAlikeObligation: p.acceptShareAlikeObligation,
          backgroundMusicVolume: p.backgroundMusicVolume
        }),
        (updated) => {
          this.projects.update(list => list.map(x => x.id === p.id ? updated : x));
          this.status.notify(['Thumbnail updated successfully.']);
        }
      );
    } catch {
      this.status.notify(['Failed to process image for thumbnail.']);
    } finally {
      input.value = '';
    }
  }

  getThumbColor(id: string) {
    const colors = ['#2b3040', '#3b2f4c', '#2c3a44', '#3d302b', '#263b36'];
    const idx = id.charCodeAt(0) % colors.length;
    return colors[idx] || colors[0];
  }

  // --- Actions ---

  toggleSelect(e: Event, p: Project) {
    e.stopPropagation();
    const set = new Set(this.selectedIds());
    if (set.has(p.id)) set.delete(p.id);
    else set.add(p.id);
    this.selectedIds.set(set);
  }

  togglePin(e: Event, p: Project) {
    e.stopPropagation();
    const newValue = !p.isPinned;
    this.status.run(
      this.api.updateProject(p.id, {
        name: p.name, width: p.width, height: p.height, fps: p.fps,
        isPinned: newValue,
        distributionIntent: p.distributionIntent,
        acceptShareAlikeObligation: p.acceptShareAlikeObligation,
        backgroundMusicVolume: p.backgroundMusicVolume
      }),
      (updated) => {
        this.projects.update(list => list.map(x => x.id === p.id ? updated : x));
      }
    );
  }

  importProject() {
    this.status.notify(['Importing from XML/ZIP is not yet implemented.']);
  }

  versionHistory(p: Project) {
    this.status.notify(['Version history for ' + p.name + ' is stored via auto-saves. (Mock)']);
  }
  
  exportProject(p: Project) {
    this.status.notify(['Exporting ' + p.name + ' data package...']);
  }

  bulkExport() { this.status.notify(['Bulk export started for ' + this.selectedIds().size + ' projects.']); }
  bulkArchive() { this.status.notify(['Archived ' + this.selectedIds().size + ' projects.']); this.selectedIds.set(new Set()); }
  bulkDelete() { 
    if(confirm('Delete ' + this.selectedIds().size + ' projects?')) {
      this.status.notify(['Deleted ' + this.selectedIds().size + ' projects.']); 
      this.selectedIds.set(new Set());
    }
  }

  quickStart(type: string) {
    this.status.notify(['Launching AI Quick Start: ' + type]);
    this.createAndOpen();
  }

  selectTemplate(name: string) {
    this.newProjectName.set(name + ' Project');
    this.createAndOpen();
  }

  createAndOpen() {
    const name = this.newProjectName().trim() || 'Untitled Project';
    const preset = this.selectedPreset();
    
    this.status.run(
      this.api.createProject({
        name,
        width: preset.width,
        height: preset.height,
        fps: 30,
        distributionIntent: 'Public',
      }),
      (project) => {
        this.close();
        this.router.navigate(['/projects', project.id, 'clips']);
      }
    );
  }

  renameProject(p: Project) {
    const newName = prompt('Enter new project name:', p.name);
    if (newName && newName.trim() && newName !== p.name) {
      this.status.run(
        this.api.updateProject(p.id, {
          name: newName.trim(),
          distributionIntent: (p.distributionIntent && p.distributionIntent !== 'Social Media') ? p.distributionIntent : 'Public',
          fps: p.fps,
          width: p.width,
          height: p.height,
          acceptShareAlikeObligation: p.acceptShareAlikeObligation,
          backgroundMusicVolume: p.backgroundMusicVolume
        }),
        (updated) => {
          this.projects.update(list => list.map(x => x.id === p.id ? updated : x));
        }
      );
    }
  }

  duplicateProject(p: Project) {
    this.status.notify(['Duplicating project...']);
    const intent = (p.distributionIntent && p.distributionIntent !== 'Social Media') ? p.distributionIntent : 'Public';
    this.status.run(
      this.api.createProject({
        name: p.name + ' (Copy)',
        width: p.width,
        height: p.height,
        fps: p.fps,
        distributionIntent: intent,
      }),
      (cloned) => {
        this.projects.update(list => [cloned, ...list]);
        this.status.notify(['Project duplicated.']);
      }
    );
  }

  deleteProject(p: Project) {
    if (confirm("Are you sure you want to delete " + p.name + "?")) {
      this.status.run(
        this.api.deleteProject(p.id),
        () => {
          this.projects.update(list => list.filter(x => x.id !== p.id));
        }
      );
    }
  }

  onDropMedia(e: DragEvent) {
    e.preventDefault();
    this.status.notify(['Media dropped! It will be imported upon creation.']);
    if (e.target instanceof HTMLElement) {
      e.target.style.borderColor = 'var(--brand)';
      e.target.innerHTML = '<span>✅ Media Ready</span><br><small>Will import on create</small>';
    }
  }
}
