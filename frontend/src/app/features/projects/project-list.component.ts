import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  BrandChannel, CANVAS_PRESETS, DEFAULT_BRAND_CHANNEL, DISTRIBUTION_INTENTS, Project, aspectRatioLabel, videoFormat,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { optimizeThumbnailImage } from '../../core/utils/image-utils';

export type StartingPoint = 'prompt' | 'bundle' | 'import' | 'clips' | 'scenes';

@Component({
  selector: 'app-project-list',
  imports: [DatePipe, FormsModule, RouterLink, FileDropDirective],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly status = inject(StatusService);
  readonly projects = signal<Project[]>([]);

  readonly presets = CANVAS_PRESETS;
  readonly intents = DISTRIBUTION_INTENTS;

  readonly starting = signal<StartingPoint | null>(null);
  readonly confirming = signal<string | null>(null);
  readonly showDetails = signal(false);

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
  selectedProjectIds = new Set<string>();
  pinnedProjectIds = new Set<string>();

  // Context Menu State
  activeMenuProjectId = signal<string | null>(null);

  constructor() {
    this.loadSavedPreferences();
    this.reload();
    this.api.listBrandChannels().subscribe({ next: (list) => this.channels.set(list), error: () => {} });
  }

  private loadSavedPreferences(): void {
    try {
      const savedMode = localStorage.getItem('animstudio_projects_view_mode');
      if (savedMode === 'grid' || savedMode === 'table') {
        this.viewMode.set(savedMode);
      }
      const savedPins = localStorage.getItem('animstudio_pinned_projects');
      if (savedPins) {
        const parsed = JSON.parse(savedPins);
        if (Array.isArray(parsed)) {
          this.pinnedProjectIds = new Set(parsed);
        }
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
    if (this.pinnedProjectIds.has(p.id)) {
      this.pinnedProjectIds.delete(p.id);
    } else {
      this.pinnedProjectIds.add(p.id);
    }
    try {
      localStorage.setItem('animstudio_pinned_projects', JSON.stringify([...this.pinnedProjectIds]));
    } catch {
      // Ignore storage write errors
    }
  }

  isPinned(id: string): boolean {
    return this.pinnedProjectIds.has(id);
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

  get filteredAndSortedProjects(): Project[] {
    let list = this.projects();

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
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
    } else {
      this.activeMenuProjectId.set(projectId);
    }
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
    this.status.notify(['Duplicating project...']);
    const intent = (p.distributionIntent && p.distributionIntent !== 'Social Media') ? p.distributionIntent : 'Public';
    this.status.run(
      this.api.createProject({
        name: p.name + ' (Copy)',
        width: p.width,
        height: p.height,
        fps: p.fps,
        distributionIntent: intent,
        brandChannelId: p.brandChannelId ?? null,
      }),
      (cloned) => {
        this.projects.update(list => [cloned, ...list]);
        this.status.notify(['Project duplicated successfully.']);
      }
    );
  }

  exportProject(p: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenus();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(p, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${p.name.replace(/[^a-z0-9_-]/gi, '_')}_project.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.status.notify(['Exported project metadata.']);
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
    this.status.run(this.api.deleteProject(projectId), () => {
      this.confirming.set(null);
      this.selectedProjectIds.delete(projectId);
      this.projects.update((list) => list.filter((p) => p.id !== projectId));
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
      case 'prompt': return '🪄 AI Prompt to Video — Describe your concept';
      case 'bundle': return '📊 Batch CSV Import — Bulk project creator';
      case 'import': return '🎙️ Script & Voiceover — Timed production';
      case 'clips': return '🎬 New Video Project — Multi-Track NLE Timeline';
      default: return '🎭 New Project — Scenes & Cast Creator';
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
