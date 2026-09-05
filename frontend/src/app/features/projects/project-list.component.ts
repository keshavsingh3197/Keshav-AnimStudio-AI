import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  CANVAS_PRESETS, DISTRIBUTION_INTENTS, Project,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/** The dashboard: every project, and the form that starts a new one. */
@Component({
  selector: 'app-project-list',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './project-list.component.html',
})
export class ProjectListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly status = inject(StatusService);
  readonly projects = signal<Project[]>([]);

  readonly presets = CANVAS_PRESETS;
  readonly intents = DISTRIBUTION_INTENTS;

  /** Two-step delete: the id whose confirmation is currently showing. */
  readonly confirming = signal<string | null>(null);

  name = 'My animation';
  presetIndex = 0;
  fps = 30;
  intent: string = DISTRIBUTION_INTENTS[0];

  constructor() {
    this.reload();
  }

  create(): void {
    const preset = this.presets[this.presetIndex] ?? this.presets[0];

    this.status.run(
      this.api.createProject({
        name: this.name,
        width: preset.width,
        height: preset.height,
        fps: this.fps,
        distributionIntent: this.intent,
      }),
      (project) => {
        this.projects.update((list) => [project, ...list]);
        void this.router.navigate(['/projects', project.id]);
      });
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
      this.projects.update((list) => list.filter((p) => p.id !== projectId));
    });
  }

  private reload(): void {
    this.status.run(this.api.listProjects(), (list) => this.projects.set(list));
  }
}
