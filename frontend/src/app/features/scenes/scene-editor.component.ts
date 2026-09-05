import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ANCHORS, BACKGROUND_EFFECTS, CharacterPlacement, DialogueLine, EASINGS, ENTRANCES,
  SceneDetail, TRANSITIONS,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/**
 * Everything inside one scene.
 *
 * Each section saves on its own endpoint rather than one big form: the shape of the scene,
 * its background, its audio, its lines and its staging are edited at different moments,
 * and a single save would make every one of them able to clobber the others.
 */
@Component({
  selector: 'app-scene-editor',
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './scene-editor.component.html',
})
export class SceneEditorComponent {
  readonly sceneId = input.required<string>();

  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly effects = BACKGROUND_EFFECTS;
  readonly easings = EASINGS;
  readonly transitions = TRANSITIONS;
  readonly anchors = ANCHORS;
  readonly entrances = ENTRANCES;

  readonly scene = signal<SceneDetail | null>(null);

  /** Which dialogue row the line form is editing; null while adding. */
  readonly editingLine = signal<number | null>(null);
  readonly editingPlacement = signal<string | null>(null);

  readonly duration = computed(() => this.scene()?.durationSeconds ?? 0);

  form = {
    title: '',
    description: '',
    durationSeconds: 5,
    backgroundEffect: 'None' as string,
    intensityPercent: 12,
    easing: 'Linear' as string,
    fadeInSeconds: 0,
    fadeOutSeconds: 0,
    transition: 'None' as string,
    transitionDurationSeconds: 0,
  };

  line = {
    speakerCharacterId: '',
    text: '',
    startSeconds: 0,
    endSeconds: 2,
  };

  stage = {
    characterId: '',
    anchor: 'BottomCenter' as string,
    heightPercent: 70,
    offsetXPercent: 0,
    offsetYPercent: 0,
    flipHorizontal: false,
    zOrder: 0,
    entrance: 'None' as string,
    entranceDurationSeconds: 0,
    presenceStartSeconds: 0,
    presenceEndSeconds: 0,
  };

  audio = {
    assetId: '',
    sliceStartSeconds: 0,
    sliceEndSeconds: 0,
  };

  constructor() {
    effect(() => {
      const id = this.sceneId();
      this.status.run(this.api.getScene(id), (detail) => this.apply(detail));
    });
  }

  // --- the scene's own shape -----------------------------------------------------

  save(): void {
    const scene = this.scene();
    if (!scene) return;

    this.status.run(
      this.api.updateScene(scene.id, {
        title: this.form.title.trim() || undefined,
        description: this.form.description.trim() || undefined,
        durationSeconds: this.form.durationSeconds,
        backgroundEffect: this.form.backgroundEffect,
        intensity: this.form.intensityPercent / 100,
        easing: this.form.easing,
        fadeInSeconds: this.form.fadeInSeconds,
        fadeOutSeconds: this.form.fadeOutSeconds,
        transition: this.form.transition,
        transitionDurationSeconds: this.form.transitionDurationSeconds,
      }),
      (updated) => {
        // The server may shorten a transition that no longer fits, so trust its answer.
        this.apply(updated);
        this.store.refreshScenes();
      });
  }

  setBackground(assetId: string): void {
    const scene = this.scene();
    if (!scene) return;

    this.status.run(this.api.setSceneBackground(scene.id, assetId), (updated) => {
      this.apply(updated);
      this.store.refreshScenes();
    });
  }

  // --- audio ---------------------------------------------------------------------

  saveAudio(): void {
    const scene = this.scene();
    if (!scene) return;

    this.status.run(
      this.api.setSceneAudio(scene.id, {
        assetId: this.audio.assetId || null,
        sliceStartSeconds: this.audio.assetId ? this.audio.sliceStartSeconds : null,
        sliceEndSeconds: this.audio.assetId ? this.audio.sliceEndSeconds : null,
      }),
      (updated) => {
        this.apply(updated);
        this.store.refreshScenes();
      });
  }

  clearAudio(): void {
    this.audio.assetId = '';
    this.saveAudio();
  }

  // --- dialogue ------------------------------------------------------------------

  editLine(line: DialogueLine): void {
    this.editingLine.set(line.index);
    this.line = {
      speakerCharacterId: line.speakerCharacterId ?? '',
      text: line.text,
      startSeconds: line.startSeconds,
      endSeconds: line.endSeconds,
    };
  }

  cancelLine(): void {
    this.editingLine.set(null);
    this.line = { speakerCharacterId: '', text: '', startSeconds: 0, endSeconds: 2 };
  }

  saveLine(): void {
    const scene = this.scene();
    if (!scene) return;

    const body = {
      speakerCharacterId: this.line.speakerCharacterId || null,
      text: this.line.text,
      startSeconds: this.line.startSeconds,
      endSeconds: this.line.endSeconds,
    };

    const index = this.editingLine();
    const call = index === null
      ? this.api.addDialogue(scene.id, body)
      : this.api.updateDialogue(scene.id, index, body);

    this.status.run(call, (updated) => {
      this.apply(updated);
      this.cancelLine();
      this.store.refreshScenes();
    });
  }

  removeLine(index: number): void {
    const scene = this.scene();
    if (!scene) return;

    this.status.run(this.api.removeDialogue(scene.id, index), (updated) => {
      this.apply(updated);
      this.cancelLine();
      this.store.refreshScenes();
    });
  }

  // --- staging -------------------------------------------------------------------

  editPlacement(placement: CharacterPlacement): void {
    this.editingPlacement.set(placement.characterId);
    this.stage = {
      characterId: placement.characterId,
      anchor: placement.anchor,
      heightPercent: Math.round(placement.heightFraction * 100),
      offsetXPercent: Math.round(placement.offsetXFraction * 100),
      offsetYPercent: Math.round(placement.offsetYFraction * 100),
      flipHorizontal: placement.flipHorizontal,
      zOrder: placement.zOrder,
      entrance: placement.entrance,
      entranceDurationSeconds: placement.entranceDurationSeconds,
      presenceStartSeconds: placement.presenceStartSeconds,
      presenceEndSeconds: placement.presenceEndSeconds,
    };
  }

  cancelPlacement(): void {
    this.editingPlacement.set(null);
    this.stage = {
      characterId: '',
      anchor: 'BottomCenter',
      heightPercent: 70,
      offsetXPercent: 0,
      offsetYPercent: 0,
      flipHorizontal: false,
      zOrder: this.scene()?.characters.length ?? 0,
      entrance: 'None',
      entranceDurationSeconds: 0,
      presenceStartSeconds: 0,
      presenceEndSeconds: this.duration(),
    };
  }

  savePlacement(): void {
    const scene = this.scene();
    if (!scene || !this.stage.characterId) return;

    this.status.run(
      this.api.upsertPlacement(scene.id, {
        characterId: this.stage.characterId,
        anchor: this.stage.anchor,
        heightFraction: this.stage.heightPercent / 100,
        offsetXFraction: this.stage.offsetXPercent / 100,
        offsetYFraction: this.stage.offsetYPercent / 100,
        flipHorizontal: this.stage.flipHorizontal,
        zOrder: this.stage.zOrder,
        entrance: this.stage.entrance,
        entranceDurationSeconds: this.stage.entranceDurationSeconds,
        presenceStartSeconds: this.stage.presenceStartSeconds,
        presenceEndSeconds: this.stage.presenceEndSeconds,
      }),
      (updated) => {
        this.apply(updated);
        this.cancelPlacement();
        this.store.refreshScenes();
      });
  }

  removePlacement(characterId: string): void {
    const scene = this.scene();
    if (!scene) return;

    this.status.run(this.api.removePlacement(scene.id, characterId), (updated) => {
      this.apply(updated);
      this.cancelPlacement();
      this.store.refreshScenes();
    });
  }

  // --- helpers -------------------------------------------------------------------

  assetUrl(assetId: string): string {
    return this.api.assetUrl(assetId);
  }

  characterName(characterId: string | undefined): string {
    return this.store.characterName(characterId);
  }

  /** Characters with a sprite are the only ones worth staging. */
  stageable() {
    return this.store.cast();
  }

  private apply(detail: SceneDetail): void {
    this.scene.set(detail);

    this.form = {
      title: detail.title ?? '',
      description: detail.description ?? '',
      durationSeconds: round(detail.durationSeconds),
      backgroundEffect: detail.backgroundEffect,
      intensityPercent: Math.round(detail.intensity * 100),
      easing: detail.easing,
      fadeInSeconds: round(detail.fadeInSeconds),
      fadeOutSeconds: round(detail.fadeOutSeconds),
      transition: detail.transition,
      transitionDurationSeconds: round(detail.transitionDurationSeconds),
    };

    this.audio = {
      assetId: detail.audioAssetId ?? '',
      sliceStartSeconds: round(detail.audioSliceStartSeconds ?? 0),
      sliceEndSeconds: round(detail.audioSliceEndSeconds ?? 0),
    };

    if (this.editingLine() === null) this.cancelLine();
    if (this.editingPlacement() === null) this.cancelPlacement();
  }
}

/** Two decimals: enough for a frame at 60fps, without showing floating-point noise. */
function round(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}
