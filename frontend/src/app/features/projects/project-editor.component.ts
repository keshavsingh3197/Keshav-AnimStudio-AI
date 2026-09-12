import { Component, effect, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { aspectRatioLabel, videoFormat } from '../../core/models/api.models';
import { ProjectStore } from '../../core/services/project-store';

/**
 * The frame around one project: its header, its tabs and the outlet the feature screens
 * render into. Loading happens here so a child screen can assume the cast, the files and
 * the scene list are already in hand.
 */
@Component({
  selector: 'app-project-editor',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './project-editor.component.html',
})
export class ProjectEditorComponent {
  /** Bound from the route by withComponentInputBinding(). */
  readonly projectId = input.required<string>();

  readonly store = inject(ProjectStore);

  constructor() {
    // Re-runs if the route swaps to another project without destroying the component.
    effect(() => this.store.load(this.projectId()));
  }

  /**
   * Draft until every scene has a background, then Ready; Rendered once a video has come
   * out of it, which stays true even after later edits.
   */
  /** Short / Video / Square, derived from the canvas so it can never be out of date. */
  format(width: number, height: number): string {
    return videoFormat(width, height);
  }

  formatClass(width: number, height: number): string {
    return videoFormat(width, height) === 'Short' ? 'pill ok' : 'pill';
  }

  aspect(width: number, height: number): string {
    return aspectRatioLabel(width, height);
  }

  statusClass(status: string): string {
    if (status === 'Rendered') return 'pill ok';
    if (status === 'Rendering') return 'pill warn';
    if (status === 'Ready') return 'pill ok';
    return 'pill';
  }
}
