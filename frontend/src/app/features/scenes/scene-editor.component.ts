import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError } from 'rxjs';

import {
  ANCHORS, BACKGROUND_EFFECTS, CharacterPlacement, DialogueLine, EASINGS, ENTRANCES,
  SceneDetail, TRANSITIONS,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/**
 * Interactive Studio Workbench for a single scene.
 *
 * Provides a live interactive 16:9 canvas preview with direct character dragging,
 * staging presets, real-time playhead scrubbing, character presence visibility,
 * subtitle overlays, and camera motion preview.
 */
@Component({
  selector: 'app-scene-editor',
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './scene-editor.component.html',
})
export class SceneEditorComponent implements OnDestroy {
  readonly sceneId = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  readonly duration = computed(() => this.scene()?.durationSeconds ?? 5);

  // Playhead & live playback preview
  readonly isPlaying = signal<boolean>(false);
  readonly currentTime = signal<number>(0);
  private playbackTimer: ReturnType<typeof setInterval> | null = null;

  // Direct canvas drag-to-position state
  isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartOffsetX = 0;
  private dragStartOffsetY = 0;
  private stageRect: DOMRect | null = null;

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

  /** Currently spoken dialogue line at current playhead timestamp. */
  readonly activeDialogue = computed(() => {
    const time = this.currentTime();
    const detail = this.scene();
    if (!detail || detail.dialogue.length === 0) return null;
    return detail.dialogue.find((d) => time >= d.startSeconds && time <= d.endSeconds) ?? null;
  });

  constructor() {
    effect(() => {
      const id = this.sceneId();
      this.pause();
      this.currentTime.set(0);
      this.status.run(this.api.getScene(id), (detail) => this.apply(detail));
    });
  }

  ngOnDestroy(): void {
    this.pause();
  }

  // --- playback & preview transport ----------------------------------------------

  togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    this.pause();
    if (this.currentTime() >= this.duration()) {
      this.currentTime.set(0);
    }
    this.isPlaying.set(true);

    const stepMs = 50;
    this.playbackTimer = setInterval(() => {
      const nextTime = Math.round((this.currentTime() + (stepMs / 1000)) * 100) / 100;
      if (nextTime >= this.duration()) {
        this.currentTime.set(this.duration());
        this.pause();
      } else {
        this.currentTime.set(nextTime);
      }
    }, stepMs);
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.playbackTimer !== null) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  seek(seconds: number): void {
    const clamped = Math.max(0, Math.min(seconds, this.duration()));
    this.currentTime.set(Math.round(clamped * 100) / 100);
  }

  // --- interactive canvas & direct dragging --------------------------------------

  isCharacterPresent(placement: CharacterPlacement): boolean {
    const time = this.currentTime();
    return time >= placement.presenceStartSeconds && time <= placement.presenceEndSeconds;
  }

  getCharacterStyle(placement: CharacterPlacement): Record<string, string> {
    const isEditing = this.editingPlacement() === placement.characterId;
    const anchor = isEditing ? this.stage.anchor : placement.anchor;
    const height = isEditing ? this.stage.heightPercent : Math.round(placement.heightFraction * 100);
    const offsetX = isEditing ? this.stage.offsetXPercent : Math.round(placement.offsetXFraction * 100);
    const offsetY = isEditing ? this.stage.offsetYPercent : Math.round(placement.offsetYFraction * 100);
    const z = isEditing ? this.stage.zOrder : placement.zOrder;
    const flip = isEditing ? this.stage.flipHorizontal : placement.flipHorizontal;

    const style: Record<string, string> = {
      height: `${height}%`,
      'z-index': `${z + 2}`,
    };

    // Horizontal placement
    let transform = flip ? 'scaleX(-1)' : 'scaleX(1)';

    if (anchor.endsWith('Left')) {
      style['left'] = `calc(6% + ${offsetX}%)`;
    } else if (anchor.endsWith('Right')) {
      style['right'] = `calc(6% - ${offsetX}%)`;
    } else { // Center
      style['left'] = `calc(50% + ${offsetX}%)`;
      transform += ' translateX(-50%)';
    }

    // Vertical placement
    if (anchor.startsWith('Top')) {
      style['top'] = `calc(4% + ${offsetY}%)`;
    } else if (anchor.startsWith('Middle')) {
      style['top'] = `calc(50% + ${offsetY}%)`;
      transform += ' translateY(-50%)';
    } else { // Bottom
      style['bottom'] = `calc(4% - ${offsetY}%)`;
    }

    style['transform'] = transform;
    style['transform-origin'] = 'bottom center';
    return style;
  }

  getBackgroundMotionStyle(): Record<string, string> {
    const effect = this.form.backgroundEffect;
    const intensity = this.form.intensityPercent / 100;
    const dur = this.duration();
    const progress = dur > 0 ? this.currentTime() / dur : 0;
    const p = Math.min(Math.max(progress, 0), 1);

    if (effect === 'ZoomIn') {
      const scale = 1 + (intensity * 0.35 * p);
      return { transform: `scale(${scale.toFixed(3)})` };
    }
    if (effect === 'ZoomOut') {
      const scale = (1 + (intensity * 0.35)) - (intensity * 0.35 * p);
      return { transform: `scale(${scale.toFixed(3)})` };
    }
    if (effect === 'PanLeft') {
      const shift = -p * intensity * 15;
      return { transform: `scale(1.15) translateX(${shift.toFixed(2)}%)` };
    }
    if (effect === 'PanRight') {
      const shift = p * intensity * 15;
      return { transform: `scale(1.15) translateX(${shift.toFixed(2)}%)` };
    }
    if (effect === 'PanUp') {
      const shift = -p * intensity * 15;
      return { transform: `scale(1.15) translateY(${shift.toFixed(2)}%)` };
    }
    if (effect === 'PanDown') {
      const shift = p * intensity * 15;
      return { transform: `scale(1.15) translateY(${shift.toFixed(2)}%)` };
    }

    return { transform: 'scale(1)' };
  }

  startCharacterDrag(event: MouseEvent | TouchEvent, placement: CharacterPlacement, stageEl: HTMLElement): void {
    event.stopPropagation();
    this.editPlacement(placement);
    this.isDragging = true;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragStartOffsetX = this.stage.offsetXPercent;
    this.dragStartOffsetY = this.stage.offsetYPercent;
    this.stageRect = stageEl.getBoundingClientRect();

    const onPointerMove = (moveEvt: MouseEvent | TouchEvent) => {
      if (!this.isDragging || !this.stageRect) return;
      const curX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const curY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;

      const deltaXPx = curX - this.dragStartX;
      const deltaYPx = curY - this.dragStartY;

      const deltaXPercent = Math.round((deltaXPx / this.stageRect.width) * 100);
      const deltaYPercent = Math.round((deltaYPx / this.stageRect.height) * 100);

      this.stage.offsetXPercent = Math.min(Math.max(this.dragStartOffsetX + deltaXPercent, -50), 50);
      this.stage.offsetYPercent = Math.min(Math.max(this.dragStartOffsetY - deltaYPercent, -50), 50);
    };

    const onPointerUp = () => {
      this.isDragging = false;
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);
  }

  applyPreset(preset: 'left' | 'center' | 'right' | 'closeup' | 'twoshot-l' | 'twoshot-r'): void {
    if (preset === 'left') {
      this.stage.anchor = 'BottomLeft';
      this.stage.offsetXPercent = 8;
      this.stage.offsetYPercent = 0;
      this.stage.heightPercent = 70;
      this.stage.flipHorizontal = false;
    } else if (preset === 'center') {
      this.stage.anchor = 'BottomCenter';
      this.stage.offsetXPercent = 0;
      this.stage.offsetYPercent = 0;
      this.stage.heightPercent = 75;
      this.stage.flipHorizontal = false;
    } else if (preset === 'right') {
      this.stage.anchor = 'BottomRight';
      this.stage.offsetXPercent = -8;
      this.stage.offsetYPercent = 0;
      this.stage.heightPercent = 70;
      this.stage.flipHorizontal = false;
    } else if (preset === 'closeup') {
      this.stage.anchor = 'BottomCenter';
      this.stage.offsetXPercent = 0;
      this.stage.offsetYPercent = 4;
      this.stage.heightPercent = 105;
      this.stage.flipHorizontal = false;
    } else if (preset === 'twoshot-l') {
      this.stage.anchor = 'BottomCenter';
      this.stage.offsetXPercent = -22;
      this.stage.offsetYPercent = 0;
      this.stage.heightPercent = 72;
      this.stage.flipHorizontal = false;
    } else if (preset === 'twoshot-r') {
      this.stage.anchor = 'BottomCenter';
      this.stage.offsetXPercent = 22;
      this.stage.offsetYPercent = 0;
      this.stage.heightPercent = 72;
      this.stage.flipHorizontal = true;
    }
  }

  // --- duplicate scene feature ---------------------------------------------------

  duplicateScene(): void {
    const scene = this.scene();
    if (!scene) return;

    this.status.run(
      this.api.duplicateScene(scene.id).pipe(
        catchError(() => {
          return this.api.createScene(this.store.projectId()!, {
            title: scene.title ? `${scene.title} (Copy)` : 'Untitled scene (Copy)',
            durationSeconds: scene.durationSeconds,
            backgroundAssetId: scene.backgroundAssetId ?? undefined,
            afterSceneId: scene.id,
          });
        })
      ),
      (duplicated) => {
        this.store.refreshScenes();
        this.router.navigate(['../../scenes', duplicated.id], { relativeTo: this.route });
      }
    );
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
        this.apply(updated);
        this.store.refreshScenes();
      }
    );
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
      }
    );
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
      }
    );
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

  characterSpriteUrl(characterId: string): string | null {
    const char = this.store.characters().find((c) => c.id === characterId);
    if (!char || !char.closedMouthAssetId) return null;
    return this.api.assetUrl(char.closedMouthAssetId);
  }

  characterSubtitleColor(characterId: string | null | undefined): string {
    if (!characterId) return '#ffe164';
    const char = this.store.characters().find((c) => c.id === characterId);
    return char?.subtitleColorHex || '#ffe164';
  }

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

function round(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}
