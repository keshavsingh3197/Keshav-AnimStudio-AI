import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  CANVAS_PRESETS, DISTRIBUTION_INTENTS, Project, aspectRatioLabel, videoFormat,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

type StartingPoint = 'prompt' | 'bundle' | 'import' | 'scenes';

@Component({
  selector: 'app-project-list',
  imports: [DatePipe, FormsModule, RouterLink],
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

  name = '';
  presetIndex = 0;
  fps = 30;
  intent: string = DISTRIBUTION_INTENTS[0];

  searchTerm = '';
  statusFilter = 'All';
  aspectFilter = 'All';
  selectedProjectIds = new Set<string>();

  constructor() {
    this.reload();
  }

  get filteredProjects(): Project[] {
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

    return list;
  }

  toggleSelection(id: string): void {
    if (this.selectedProjectIds.has(id)) {
      this.selectedProjectIds.delete(id);
    } else {
      this.selectedProjectIds.add(id);
    }
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filteredProjects.forEach(p => this.selectedProjectIds.add(p.id));
    } else {
      this.selectedProjectIds.clear();
    }
  }

  isAllSelected(): boolean {
    const fp = this.filteredProjects;
    return fp.length > 0 && fp.every(p => this.selectedProjectIds.has(p.id));
  }

  start(point: StartingPoint): void {
    this.starting.set(point);
    if (!this.name.trim()) this.name = this.suggestedName();
  }

  format(width: number, height: number): string {
    return videoFormat(width, height);
  }

  aspect(width: number, height: number): string {
    return aspectRatioLabel(width, height);
  }

  formatClass(width: number, height: number): string {
    return videoFormat(width, height) === 'Short' ? 'pill ok' : 'pill';
  }

  cancelStart(): void {
    this.starting.set(null);
  }

  create(): void {
    const point = this.starting() ?? 'scenes';
    const preset = this.presets[this.presetIndex] ?? this.presets[0];

    this.status.run(
      this.api.createProject({
        name: this.name.trim(),
        width: preset.width,
        height: preset.height,
        fps: this.fps,
        distributionIntent: this.intent,
      }),
      (project) => {
        this.projects.update((list) => [project, ...list]);
        this.starting.set(null);
        void this.router.navigate(['/projects', project.id, point]);
      });
  }

  heading(point: StartingPoint): string {
    switch (point) {
      case 'prompt': return 'Name it, then describe your idea';
      case 'bundle': return 'Name it, then upload your file';
      case 'import': return 'Name it, then bring in your transcript';
      default: return 'Name it, then start adding scenes';
    }
  }

  confirmDelete(projectId: string): void {
    this.confirming.set(projectId);
  }

  cancelDelete(): void {
    this.confirming.set(null);
  }

  delete(projectId: string): void {
    this.status.run(this.api.deleteProject(projectId), () => {
      this.confirming.set(null);
      this.selectedProjectIds.delete(projectId);
      this.projects.update((list) => list.filter((p) => p.id !== projectId));
    });
  }

  private suggestedName(): string {
    return `Video ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  }

  private reload(): void {
    this.status.run(this.api.listProjects(), (list) => this.projects.set(list));
  }

  onUploadThumbnail(event: Event, p: Project) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const b64 = e.target?.result as string;
        this.status.run(
          this.api.updateProject(p.id, {
            name: p.name, width: p.width, height: p.height, fps: p.fps,
            customThumbnail: b64,
            distributionIntent: p.distributionIntent,
            acceptShareAlikeObligation: p.acceptShareAlikeObligation,
            backgroundMusicVolume: p.backgroundMusicVolume
          }),
          (updated) => {
            this.projects.update(list => list.map(x => x.id === p.id ? updated : x));
          }
        );
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
}

