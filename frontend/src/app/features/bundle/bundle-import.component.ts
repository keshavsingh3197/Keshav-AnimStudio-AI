import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { BundleImportResult, BundlePreview, ImportSheetPlan } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/**
 * Build a whole video from one file, with no AI configured at all.
 *
 * The screen is deliberately two steps. One upload can rewrite sixty scenes and there is no
 * undo afterwards, so the preview IS the undo: nothing is written until the diff has been
 * looked at and accepted.
 */
@Component({
  selector: 'app-bundle-import',
  imports: [FormsModule],
  templateUrl: './bundle-import.component.html',
})
export class BundleImportComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly preview = signal<BundlePreview | null>(null);
  readonly result = signal<BundleImportResult | null>(null);
  readonly fileName = signal<string | null>(null);

  /** Both default to the safe answer, matching the server. */
  overwriteUserEdits = false;
  removeMissingScenes = false;

  readonly templateUrl = this.api.bundleTemplateUrl();
  readonly promptPackUrl = this.api.aiPromptPackUrl();

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const projectId = this.store.projectId();
    const file = input.files?.[0];

    // Cleared immediately so picking the same file twice still fires a change event -
    // which is exactly what someone does after fixing a row and re-zipping.
    input.value = '';

    if (!projectId || !file) return;

    this.result.set(null);
    this.preview.set(null);
    this.fileName.set(file.name);

    this.status.run(this.api.previewBundle(projectId, file), (preview) => {
      this.preview.set(preview);
      this.status.notify(preview.warnings);
    });
  }

  apply(): void {
    const projectId = this.store.projectId();
    const preview = this.preview();

    if (!projectId || !preview?.canApply) return;

    this.status.run(
      this.api.applyBundle(projectId, {
        previewToken: preview.previewToken,
        overwriteUserEdits: this.overwriteUserEdits,
        removeMissingScenes: this.removeMissingScenes,
      }),
      (result) => {
        this.result.set(result);
        this.preview.set(null);
        this.status.notify(result.warnings);

        this.store.refreshScenes();
        this.store.refreshCharacters();
        this.store.refreshAssets();
      },
    );
  }

  discard(): void {
    this.preview.set(null);
    this.fileName.set(null);
  }

  openScenes(): void {
    const projectId = this.store.projectId();
    if (projectId) void this.router.navigate(['/projects', projectId, 'scenes']);
  }

  /** A sheet with nothing to do is noise on the diff. */
  hasChanges(sheet: ImportSheetPlan): boolean {
    return sheet.create + sheet.update + sheet.conflict > 0;
  }

  totalConflicts(): number {
    return this.preview()?.sheets.reduce((sum, s) => sum + s.conflict, 0) ?? 0;
  }
}
