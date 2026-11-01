import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  BrandChannel, CANVAS_PRESETS, DEFAULT_BRAND_CHANNEL, DISTRIBUTION_INTENTS, ParentAssetMode, Project, aspectRatioLabel, videoFormat,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { optimizeThumbnailImage } from '../../core/utils/image-utils';
import { AssetThumbnailPickerComponent } from '../../shared/asset-thumbnail-picker.component';
import { AuthService } from '../../core/services/auth.service';

export type StartingPoint = 'prompt' | 'bundle' | 'import' | 'clips' | 'scenes';

@Component({
  selector: 'app-project-list',
  imports: [DatePipe, FormsModule, RouterLink, FileDropDirective, AssetThumbnailPickerComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly status = inject(StatusService);
  readonly projects = signal<Project[]>([]);

  readonly presets = CANVAS_PRESETS;
  readonly intents = DISTRIBUTION_INTENTS;

  readonly starting = signal<StartingPoint | null>(null);
  readonly confirming = signal<string | null>(null);
  readonly showDetails = signal(false);

  // Sub-projects state
  readonly expandedProjectIds = signal<Set<string>>(new Set());
  readonly creatingSubProjectFor = signal<Project | null>(null);
  subProjectName = '';
  subProjectDescription = '';
  subProjectAssetMode: ParentAssetMode = 'share';

  // Move a project under another (or back out)
  readonly movingProjects = signal<Project[]>([]);
  moveParentId = '';
  readonly moveSearch = signal('');
  readonly moveBusy = signal(false);
  readonly dragProjectIds = signal<string[]>([]);
  readonly dropTargetId = signal<string | null>(null);
  moveAssetMode: ParentAssetMode = 'share';

  // View & Filter State
  readonly viewMode = signal<'grid' | 'table'>('grid');
  readonly sortBy = signal<'updated' | 'name' | 'newest'>('updated');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(12);

  name = '';
  presetIndex = 0;
  fps = 30;
  /** Brand channel (YouTube channel) the new project publishes under; its watermark is copied in. */
  channelId: string = DEFAULT_BRAND_CHANNEL;
  readonly channels = signal<BrandChannel[]>([]);
  intent: string = DISTRIBUTION_INTENTS[1] ?? 'Public'; // Default to Public

  searchTerm = '';
  statusFilter = 'All';
  aspectFilter = 'All';
  /** 'All', or a project content type: music projects publish to YouTube Music. */
  contentFilter = 'All';
  /** A channel id, or 'All'. */
  channelFilter = 'All';
  selectedProjectIds = new Set<string>();

  // Context Menu State
  activeMenuProjectId = signal<string | null>(null);
  readonly menuPos = signal<{ top: number | null; bottom: number | null; right: number }>(
    { top: 0, bottom: null, right: 0 });

/** The channel a project publishes under; no channel is the default one. */  channelName(p: Project): string {    const id = p.brandChannelId || DEFAULT_BRAND_CHANNEL;    return this.channels().find((c) => c.id === id)?.name ?? 'Default';  }
  constructor() {
    this.loadSavedPreferences();
    // Reactively load and reload projects & brand channels whenever user signs in or out
    effect(() => {
      this.auth.user();
      this.reload();
      this.api.listBrandChannels().subscribe({ next: (list) => this.channels.set(list), error: () => {} });
    });
  }

  private loadSavedPreferences(): void {
    try {
      const savedMode = localStorage.getItem('animstudio_projects_view_mode');
      if (savedMode === 'grid' || savedMode === 'table') {
        this.viewMode.set(savedMode);
      }
    } catch {
      // Ignore storage read errors
    }
  }

  saveViewMode(mode: 'grid' | 'table'): void {
    this.viewMode.set(mode);
    try {
      localStorage.setItem('animstudio_projects_view_mode', mode);
    } catch {
      // Ignore storage write errors
    }
  }

  togglePin(p: Project, event?: Event): void {
    if (event) event.stopPropagation();
    const nextPinned = !this.isPinned(p.id);

    const intent = (p.distributionIntent && p.distributionIntent !== 'Social Media') ? p.distributionIntent : 'Public';
    this.status.run(
      this.api.updateProject(p.id, {
        name: p.name,
        description: p.description,
        width: p.width,
        height: p.height,
        fps: p.fps,
        isPinned: nextPinned,
        distributionIntent: intent,
        acceptShareAlikeObligation: p.acceptShareAlikeObligation,
        backgroundMusicAssetId: p.backgroundMusicAssetId,
        backgroundMusicVolume: p.backgroundMusicVolume,
        customThumbnail: p.customThumbnail,
        brandChannelId: p.brandChannelId ?? null,
      }),
      (updated) => {
        this.projects.update(list => list.map(x => x.id === p.id ? updated : x));
      }
    );
  }

  isPinned(id: string): boolean {
    const found = this.projects().find(p => p.id === id);
    return !!found?.isPinned;
  }

  get totalCount(): number {
    return this.projects().length;
  }

  get totalRendered(): number {
    return this.projects().filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'rendered' || s === 'completed';
    }).length;
  }

  get totalDrafts(): number {
    return this.projects().filter(p => {
      const s = (p.status || '').toLowerCase();
      return s !== 'rendered' && s !== 'completed';
    }).length;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() ||
      this.statusFilter !== 'All' ||
      this.aspectFilter !== 'All' ||
      this.contentFilter !== 'All' ||
      this.channelFilter !== 'All';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'All';
    this.aspectFilter = 'All';
    this.contentFilter = 'All';
    this.channelFilter = 'All';
    this.currentPage.set(1);
  }

  toggleExpandSubProjects(projectId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const next = new Set(this.expandedProjectIds());
    if (next.has(projectId)) {
      next.delete(projectId);
    } else {
      next.add(projectId);
    }
    this.expandedProjectIds.set(next);
  }

  isExpanded(projectId: string): boolean {
    return this.expandedProjectIds().has(projectId);
  }

  getSubProjects(parentId: string): Project[] {
    return this.projects().filter(p => p.parentProjectId === parentId);
  }

  subProjectsCount(project: Project): number {
    return project.subProjectCount ?? this.getSubProjects(project.id).length;
  }

  openCreateSubProject(parent: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    this.creatingSubProjectFor.set(parent);
    const count = this.subProjectsCount(parent);
    this.subProjectName = `${parent.name} - Part ${count + 1}`;
    this.subProjectDescription = '';
    this.subProjectAssetMode = 'share';
  }

  cancelCreateSubProject(): void {
    this.creatingSubProjectFor.set(null);
  }

  submitCreateSubProject(): void {
    const parent = this.creatingSubProjectFor();
    if (!parent || !this.subProjectName.trim()) return;

    this.status.run(
      this.api.createSubProject(parent.id, {
        name: this.subProjectName.trim(),
        description: this.subProjectDescription.trim() || undefined,
        useSharedAssets: this.subProjectAssetMode === 'share',
        copyAssets: this.subProjectAssetMode === 'copy',
      }),
      (subProject) => {
        this.projects.update((list) => [
          subProject,
          ...list.map((p) => (p.id === parent.id ? { ...p, subProjectCount: (p.subProjectCount ?? 0) + 1 } : p)),
        ]);
        const set = new Set(this.expandedProjectIds());
        set.add(parent.id);
        this.expandedProjectIds.set(set);
        this.creatingSubProjectFor.set(null);
        void this.router.navigate(['/projects', subProject.id, 'clips']);
      }
    );
  }

  /** Top-level projects the given projects can be moved under: not themselves. */
  moveCandidates(moving: Project[]): Project[] {
    const ids = new Set(moving.map((m) => m.id));
    return this.projects().filter((p) => !p.parentProjectId && !ids.has(p.id));
  }

  /** Candidates narrowed by the search box (name or description). */
  filteredMoveCandidates(moving: Project[]): Project[] {
    const q = this.moveSearch().trim().toLowerCase();
    const list = this.moveCandidates(moving);
    return q ? list.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)) : list;
  }

  /** Projects that own sub-projects cannot be nested (one level only). */
  movable(list: Project[]): Project[] {
    return list.filter((p) => this.subProjectsCount(p) === 0);
  }

  openMoveProject(project: Project, event?: Event, targetId?: string): void {
    event?.stopPropagation();
    this.closeMenus();
    this.openMoveProjects([project], targetId);
  }

  openMoveSelected(): void {
    const list = this.projects().filter((p) => this.selectedProjectIds.has(p.id));
    this.openMoveProjects(list);
  }

  openMoveProjects(list: Project[], targetId?: string): void {
    const movable = this.movable(list);
    if (movable.length === 0) {
      this.status.showError('Projects that contain sub-projects cannot be moved. Move their sub-projects out first.');
      return;
    }
    if (movable.length < list.length) {
      this.status.showNotice(`${list.length - movable.length} project(s) with sub-projects were skipped.`);
    }
    this.movingProjects.set(movable);
    this.moveSearch.set('');
    const candidates = this.moveCandidates(movable);
    const first = movable[0];
    const preferred = targetId ?? (movable.length === 1 ? first.parentProjectId : null) ?? '';
    this.moveParentId = candidates.some((c) => c.id === preferred) ? preferred : '';
    this.moveAssetMode = movable.length === 1 && first.parentProjectId && first.useSharedAssets === false ? 'none' : 'share';
  }

  hasMovingChild(): boolean {
    return this.movingProjects().some((p) => !!p.parentProjectId);
  }

  cancelMoveProject(): void {
    if (this.moveBusy()) return;
    this.movingProjects.set([]);
  }

  // Drag & drop: dropping project card(s) on another project opens the move dialog.
  onProjectDragStart(project: Project, event: DragEvent): void {
    const ids = this.selectedProjectIds.has(project.id) ? [...this.selectedProjectIds] : [project.id];
    this.dragProjectIds.set(ids);
    event.dataTransfer?.setData('text/plain', ids.join(','));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onProjectDragEnd(): void {
    this.dragProjectIds.set([]);
    this.dropTargetId.set(null);
  }

  canDropOn(target: Project): boolean {
    const ids = this.dragProjectIds();
    return ids.length > 0 && !ids.includes(target.id) && !target.parentProjectId;
  }

  onProjectDragOver(target: Project, event: DragEvent): void {
    if (!this.canDropOn(target)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (this.dropTargetId() !== target.id) this.dropTargetId.set(target.id);
  }

  onProjectDragLeave(target: Project): void {
    if (this.dropTargetId() === target.id) this.dropTargetId.set(null);
  }

  onProjectDrop(target: Project, event: DragEvent): void {
    if (!this.canDropOn(target)) return;
    event.preventDefault();
    event.stopPropagation();
    const ids = new Set(this.dragProjectIds());
    this.onProjectDragEnd();
    this.openMoveProjects(this.projects().filter((p) => ids.has(p.id)), target.id);
  }

  /** Moves every project under the chosen parent; no parent (makeTopLevel) makes them top-level again. */
  async submitMoveProject(makeTopLevel = false): Promise<void> {
    const moving = this.movingProjects();
    if (moving.length === 0 || (!makeTopLevel && !this.moveParentId) || this.moveBusy()) return;

    this.moveBusy.set(true);
    let moved = 0;
    let lastParentId: string | null = null;
    try {
      for (const project of moving) {
        const updated = await firstValueFrom(this.api.setProjectParent(project.id, {
          parentProjectId: makeTopLevel ? null : this.moveParentId,
          assetMode: makeTopLevel ? 'none' : this.moveAssetMode,
        }));
        moved++;
        lastParentId = updated.parentProjectId ?? null;
        this.projects.update((list) => list.map((p) => {
          if (p.id === updated.id) return updated;
          if (p.id === project.parentProjectId && p.id !== updated.parentProjectId) return { ...p, subProjectCount: Math.max(0, (p.subProjectCount ?? 1) - 1) };
          if (p.id === updated.parentProjectId && p.id !== project.parentProjectId) return { ...p, subProjectCount: (p.subProjectCount ?? 0) + 1 };
          return p;
        }));
        this.selectedProjectIds.delete(project.id);
      }
      this.movingProjects.set([]);
    } catch (err) {
      this.status.showError(`Moved ${moved} of ${moving.length} project(s): ${(err as { message?: string })?.message ?? 'request failed'}`);
      this.movingProjects.set(moving.slice(moved));
    } finally {
      this.moveBusy.set(false);
    }

    if (lastParentId) {
      const set = new Set(this.expandedProjectIds());
      set.add(lastParentId);
      this.expandedProjectIds.set(set);
    }
    if (moved > 0) {
      const noun = moved === 1 ? `"${moving[0].name}"` : `${moved} projects`;
      this.status.notify([makeTopLevel ? `${noun} ${moved === 1 ? 'is' : 'are'} top-level again.` : `${noun} moved into the parent project.`]);
    }
  }

  get filteredAndSortedProjects(): Project[] {
    let list = this.projects().filter((p) => !p.parentProjectId);

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter((p) => {
        const selfMatch =
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q));
        const subMatch = this.getSubProjects(p.id).some(
          (sub) =>
            sub.name.toLowerCase().includes(q) ||
            (sub.description && sub.description.toLowerCase().includes(q))
        );
        return selfMatch || subMatch;
      });
    }

    if (this.statusFilter !== 'All') {
      list = list.filter(p => {
        const s = (p.status || '').toLowerCase();
        if (this.statusFilter === 'Drafts') return s !== 'rendered' && s !== 'completed';
        if (this.statusFilter === 'Rendered') return s === 'rendered' || s === 'completed';
        return true;
      });
    }

    if (this.aspectFilter !== 'All') {
      list = list.filter(p => {
        const fmt = this.format(p.width, p.height);
        if (this.aspectFilter === '9:16 Shorts') return fmt === 'Short';
        if (this.aspectFilter === '16:9 Video') return fmt === 'Video';
        return true;
      });
    }

    if (this.contentFilter !== 'All') {
      list = list.filter(p => (p.contentType ?? 'video') === this.contentFilter);
    }

    if (this.channelFilter !== 'All') {
      // A project with no channel is on the default one, so it shows under Default.
      list = list.filter(p => (p.brandChannelId || DEFAULT_BRAND_CHANNEL) === this.channelFilter);
    }

    // Sort: Pinned projects first, then according to sort option
    return [...list].sort((a, b) => {
      const pinA = this.isPinned(a.id) ? 1 : 0;
      const pinB = this.isPinned(b.id) ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;

      switch (this.sortBy()) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }

  get paginatedProjects(): Project[] {
    const list = this.filteredAndSortedProjects;
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSortedProjects.length / this.pageSize()) || 1;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update(p => p + 1);
    }
  }

  toggleSelection(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.selectedProjectIds.has(id)) {
      this.selectedProjectIds.delete(id);
    } else {
      this.selectedProjectIds.add(id);
    }
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filteredAndSortedProjects.forEach(p => this.selectedProjectIds.add(p.id));
    } else {
      this.selectedProjectIds.clear();
    }
  }

  clearSelection(): void {
    this.selectedProjectIds.clear();
  }

  isAllSelected(): boolean {
    const list = this.filteredAndSortedProjects;
    return list.length > 0 && list.every(p => this.selectedProjectIds.has(p.id));
  }

  start(point: StartingPoint): void {
    this.starting.set(point);
    if (!this.name.trim()) this.name = this.suggestedName();
  }

  @HostListener('window:keydown.escape')
  closeCreationDialogOnEscape(): void {
    if (this.starting()) this.cancelStart();
  }

  cancelStart(): void {
    this.starting.set(null);
  }

  format(width: number, height: number): string {
    return videoFormat(width, height);
  }

  aspect(width: number, height: number): string {
    return aspectRatioLabel(width, height);
  }

  formatClass(width: number, height: number): string {
    return videoFormat(width, height) === 'Short' ? 'pill-badge short' : 'pill-badge video';
  }

  create(): void {
    const point = this.starting() ?? 'clips';
    const preset = this.presets[this.presetIndex] ?? this.presets[0];
    const name = this.name.trim() || this.suggestedName();

    this.status.run(
      this.api.createProject({
        name,
        width: preset.width,
        height: preset.height,
        fps: this.fps,
        distributionIntent: this.intent || 'Public',
        brandChannelId: this.channelId,
      }),
      (project) => {
        this.projects.update((list) => [project, ...list]);
        this.starting.set(null);
        this.name = '';

        if (point === 'clips') {
          void this.router.navigate(['/projects', project.id, 'clips']);
        } else if (point === 'scenes') {
          void this.router.navigate(['/projects', project.id, 'scenes']);
        } else {
          void this.router.navigate(['/projects', project.id, point]);
        }
      });
  }

  openInClips(projectId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    void this.router.navigate(['/projects', projectId, 'clips']);
  }

  openInScenes(projectId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    void this.router.navigate(['/projects', projectId, 'scenes']);
  }

  toggleProjectMenu(projectId: string, event: Event): void {
    event.stopPropagation();
    if (this.activeMenuProjectId() === projectId) {
      this.activeMenuProjectId.set(null);
      return;
    }

    // The menu is position: fixed so neither a card's hover transform nor the table's
    // overflow can clip it; place it under the button, or above when there is no room.
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 300;
    const right = Math.max(8, window.innerWidth - rect.right);
    const openUp = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;
    this.menuPos.set(openUp
      ? { top: null, bottom: window.innerHeight - rect.top + 4, right }
      : { top: rect.bottom + 4, bottom: null, right });
    this.activeMenuProjectId.set(projectId);
  }

  /** A fixed menu would drift away from its button, so scrolling or resizing closes it. */
  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    if (this.activeMenuProjectId()) this.closeMenus();
  }

  closeMenus(): void {
    this.activeMenuProjectId.set(null);
  }

  renameProject(p: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    const newName = prompt('Enter new project name:', p.name);
    if (newName && newName.trim() && newName !== p.name) {
      this.status.run(
        this.api.updateProject(p.id, {
          name: newName.trim(),
          width: p.width,
          height: p.height,
          fps: p.fps,
          distributionIntent: (p.distributionIntent && p.distributionIntent !== 'Social Media') ? p.distributionIntent : 'Public',
          acceptShareAlikeObligation: p.acceptShareAlikeObligation,
          backgroundMusicVolume: p.backgroundMusicVolume,
          customThumbnail: p.customThumbnail
        }),
        (updated) => {
          this.projects.update(list => list.map(x => x.id === p.id ? updated : x));
          this.status.notify(['Project renamed to "' + newName.trim() + '".']);
        }
      );
    }
  }

  duplicateProject(p: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    this.status.notify(['Cloning project, scenes, characters, and assets...']);
    this.status.run(
      this.api.duplicateProject(p.id),
      (cloned) => {
        this.projects.update(list => [cloned, ...list]);
        this.status.notify([`Project "${cloned.name}" duplicated with all scenes and cast.`]);
      }
    );
  }

  exportProject(p: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    const url = this.api.bundleExportUrl(p.id, false);
    window.open(url, '_blank');
    this.status.notify([`Downloading bundle ZIP for "${p.name}"...`]);
  }

  confirmDelete(projectId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    this.confirming.set(projectId);
  }

  cancelDelete(event?: Event): void {
    if (event) event.stopPropagation();
    this.confirming.set(null);
  }

  delete(projectId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const target = this.projects().find(p => p.id === projectId);
    this.status.run(this.api.deleteProject(projectId), () => {
      this.confirming.set(null);
      this.selectedProjectIds.delete(projectId);
      this.projects.update((list) => {
        let updated = list.filter((p) => p.id !== projectId);
        if (target?.parentProjectId) {
          updated = updated.map(p => p.id === target.parentProjectId ? { ...p, subProjectCount: Math.max(0, (p.subProjectCount ?? 1) - 1) } : p);
        }
        return updated;
      });
      this.status.notify(['Project deleted.']);
    });
  }

  deleteSelected(): void {
    if (this.selectedProjectIds.size === 0) return;
    const count = this.selectedProjectIds.size;
    if (confirm(`Are you sure you want to delete ${count} selected project(s)?`)) {
      const ids = [...this.selectedProjectIds];
      ids.forEach(id => {
        this.status.run(this.api.deleteProject(id), () => {
          this.selectedProjectIds.delete(id);
          this.projects.update(list => list.filter(p => p.id !== id));
        });
      });
    }
  }

  heading(point: StartingPoint): string {
    switch (point) {
      case 'prompt': return 'AI Prompt to Video — Describe your concept';
      case 'bundle': return 'Batch CSV Import — Bulk project creator';
      case 'import': return 'Script & Voiceover — Timed production';
      case 'clips': return 'New Video Project — Multi-Track NLE Timeline';
      default: return 'New Project — Scenes & Cast Creator';
    }
  }

  getProjectGradient(p: Project): string {
    const gradients = [
      'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)', // Indigo
      'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #059669 100%)', // Emerald
      'linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)', // Slate
      'linear-gradient(135deg, #451a03 0%, #78350f 60%, #b45309 100%)', // Amber
      'linear-gradient(135deg, #581c87 0%, #6b21a8 60%, #9333ea 100%)', // Purple
      'linear-gradient(135deg, #164e63 0%, #155e75 60%, #0891b2 100%)', // Cyan
      'linear-gradient(135deg, #831843 0%, #9d174d 60%, #db2777 100%)', // Rose
    ];
    let hash = 0;
    const str = p.id + p.name;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  }

  getProjectInitials(name: string): string {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  private suggestedName(): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return `Video ${dateStr}`;
  }

  private reload(): void {
    this.status.run(this.api.listProjects(), (list) => this.projects.set(list));
  }

  onUploadThumbnail(event: Event, p: Project): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.setThumbnail(file, p);
  }

  async setThumbnail(file: File, p: Project): Promise<void> {
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
          distributionIntent: (p.distributionIntent && p.distributionIntent !== 'Social Media') ? p.distributionIntent : 'Public',
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
    }
  }

  /** Project whose thumbnail is currently being picked from its assets. */
  readonly thumbPickerProject = signal<Project | null>(null);

  openThumbnailPicker(p: Project, event?: Event): void {
    event?.stopPropagation();
    this.closeMenus();
    this.thumbPickerProject.set(p);
  }

  async setThumbnailFromAsset(assetId: string): Promise<void> {
    const p = this.thumbPickerProject();
    this.thumbPickerProject.set(null);
    if (!p) return;
    try {
      const blob = await firstValueFrom(this.api.assetContent(assetId));
      await this.setThumbnail(new File([blob], 'asset', { type: blob.type || 'image/png' }), p);
    } catch {
      this.status.notify(['Failed to use that asset as thumbnail.']);
    }
  }

  removeThumbnail(p: Project, event?: Event): void {
    event?.stopPropagation();
    this.closeMenus();
    this.status.run(
      this.api.updateProject(p.id, {
        name: p.name,
        description: p.description,
        width: p.width,
        height: p.height,
        fps: p.fps,
        isPinned: p.isPinned,
        customThumbnail: '',
        distributionIntent: (p.distributionIntent && p.distributionIntent !== 'Social Media') ? p.distributionIntent : 'Public',
        acceptShareAlikeObligation: p.acceptShareAlikeObligation,
        backgroundMusicVolume: p.backgroundMusicVolume
      }),
      (updated) => {
        this.projects.update(list => list.map(x => x.id === p.id ? updated : x));
        this.status.notify(['Thumbnail reset to default.']);
      }
    );
  }
}
