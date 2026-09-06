import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  CANVAS_PRESETS, DISTRIBUTION_INTENTS, Project,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/** Where a newly created project should land, decided before it exists. */
type StartingPoint = 'bundle' | 'import' | 'scenes';

/**
 * The way in.
 *
 * A list of projects answered "what have I made" and left "what do I do first" to the
 * reader. The three cards answer that instead: they are the three genuinely different ways
 * a video starts here, and picking one carries straight through to the screen that does it,
 * so making a project is a click and a name rather than a form to study.
 */
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

  /** The chosen starting point, and the signal that the form is showing. */
  readonly starting = signal<StartingPoint | null>(null);

  /** Two-step delete: the id whose confirmation is currently showing. */
  readonly confirming = signal<string | null>(null);

  /** The details are there for anyone who wants them, and folded away for everyone else. */
  readonly showDetails = signal(false);

  name = '';
  presetIndex = 0;
  fps = 30;
  intent: string = DISTRIBUTION_INTENTS[0];

  constructor() {
    this.reload();
  }

  start(point: StartingPoint): void {
    this.starting.set(point);

    if (!this.name.trim()) this.name = this.suggestedName();
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
      this.projects.update((list) => list.filter((p) => p.id !== projectId));
    });
  }

  /** A name nobody has to think about, and can overwrite in a second. */
  private suggestedName(): string {
    return `Video ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  }

  private reload(): void {
    this.status.run(this.api.listProjects(), (list) => this.projects.set(list));
  }
}
