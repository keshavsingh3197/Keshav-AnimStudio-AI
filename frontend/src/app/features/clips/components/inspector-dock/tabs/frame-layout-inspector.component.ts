import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { TextStyleEditorComponent } from './text-style-editor.component';
import { LayerTimingComponent } from './layer-timing.component';
import { LayerMotionValue, MotionPickerComponent } from './motion-picker.component';
import {
  FRAME_DESIGNS, FRAME_IMAGE_MAX_WIDTH, FRAME_IMAGE_MIN_WIDTH, FrameDesign, FrameImage,
  MAX_FRAME_IMAGES, MAX_FRAME_TEXTS, MAX_SUBTITLE_CUES, hexToRgba, resolveTextLook,
} from '../../../services/text-overlay-layout';
import { OverlayMotion, TimelineItemTextStyle } from '../../../../../core/models/api.models';
import { MEDIA_IN, MEDIA_OUT, MotionOption, SHAPES, TEXT_IN, TEXT_OUT } from '../../../services/frame-media';

type Section = 'texts' | 'images' | 'subtitles' | 'animations';

/**
 * Everything drawn on the frame for the video as a whole. The bars around a wide clip in a
 * Short get a colour (or a blur of the clip); on top go any number of text layers and
 * images, each placed anywhere and shown for the whole video or a stretch of it; and timed
 * subtitles share one style so a whole video's captions restyle in one go.
 * <p>
 * One section open at a time, and in it one layer expanded - the selected one - so the
 * panel stays a list you can scan rather than a wall of controls. Timing and animation are
 * the same two controls for every kind of layer.
 * </p>
 */
@Component({
  selector: 'app-frame-layout-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TextStyleEditorComponent, LayerTimingComponent, MotionPickerComponent],
  templateUrl: './frame-layout-inspector.component.html',
  styleUrls: ['./frame-layout-inspector.component.css'],
})
export class FrameLayoutInspectorComponent {
  readonly state = inject(StudioStateService);
  readonly designs = FRAME_DESIGNS;
  readonly maxTexts = MAX_FRAME_TEXTS;
  readonly maxImages = MAX_FRAME_IMAGES;
  readonly maxCues = MAX_SUBTITLE_CUES;
  readonly minImageWidth = FRAME_IMAGE_MIN_WIDTH;
  readonly maxImageWidth = FRAME_IMAGE_MAX_WIDTH;
  readonly mediaIn = MEDIA_IN;
  readonly mediaOut = MEDIA_OUT;
  readonly textIn = TEXT_IN;
  readonly textOut = TEXT_OUT;
  readonly shapes = SHAPES;
  readonly barSwatches = ['#000000','#ffffff', '#0f172a', '#1e1b4b', '#b91c1c', '#ea580c', '#facc15', '#16a34a', '#0ea5e9', '#db2777'];

  /** The one open section; opening another closes it. */
  readonly openSection = signal<Section | null>('texts');
  /** Which layer's style editor is open; one at a time keeps the panel short. */
  readonly openStyle = signal<string | null>(null);
  readonly pickedImage = signal('');
  readonly scriptOpen = signal(false);
  readonly script = signal('');
  readonly wordsPerCue = signal(4);
  /** The "apply to every subtitle too" switch in the Animations list. */
  readonly animateSubtitlesToo = signal(true);

  readonly cueCount = computed(() => this.state.frameLayout().subtitles.cues.length);

  constructor() {
    // A layer picked on the preview opens its own section, so its controls are on screen.
    effect(() => {
      const id = this.state.selectedFrameLayer();
      if (!id) return;
      untracked(() => {
        const layout = this.state.frameLayout();
        const section: Section | null = id === 'subtitles' ? 'subtitles'
          : layout.texts.some((t) => t.id === id) ? 'texts'
            : layout.images.some((i) => i.id === id) ? 'images' : null;
        if (section && this.openSection() !== 'animations') this.openSection.set(section);
      });
    });
  }

  isOpen(section: Section): boolean {
    return this.openSection() === section;
  }

  toggleSection(section: Section): void {
    this.openSection.update((s) => (s === section ? null : section));
  }

  /** A layer card shows its controls only while it is the selected layer. */
  isExpanded(id: string): boolean {
    return this.state.selectedFrameLayer() === id;
  }

  toggleLayer(id: string): void {
    this.state.selectFrameLayer(this.isExpanded(id) ? null : id);
  }

  toggleStyle(id: string): void {
    this.openStyle.update((s) => (s === id ? null : id));
    this.state.selectFrameLayer(id);
  }

  /** Thumbnail text, painted roughly the way the design paints it. */
  sampleText(style: Partial<TimelineItemTextStyle>): Record<string, string> {
    const base = this.state.frameLayout().texts[0]?.style;
    const look = resolveTextLook({ ...(base ?? ({} as TimelineItemTextStyle)), ...style });
    return {
      color: look.color,
      background: look.box === 'none' ? 'transparent' : hexToRgba(look.boxColor, look.boxOpacity),
      width: look.box === 'band' ? '100%' : 'auto',
    };
  }

  barsOf(design: FrameDesign): string {
    return design.bars === 'blur' ? 'linear-gradient(160deg, #475569, #1e293b)' : design.barColor;
  }

  /** "0:03-0:08" for a collapsed layer; "whole video" when it has no window. */
  timingSummary(layer: { start?: number | null; end?: number | null }): string {
    if (layer.start == null && layer.end == null) return 'whole video';
    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
    return `${fmt(layer.start ?? 0)}–${layer.end == null ? 'end' : fmt(layer.end)}`;
  }

  // --- images ---

  addPickedImage(): void {
    const id = this.pickedImage();
    if (!id) return;
    const kind = this.state.frameMediaCandidates().find((c) => c.id === id)?.kind;
    if (kind === 'video') this.state.addFrameVideo(id);
    else this.state.addFrameImage(id);
    this.pickedImage.set('');
    this.openSection.set('images');
  }

  // --- animation ---

  /** A text layer's (or the subtitles') entrance and exit, as the motion picker edits them. */
  textMotionOf(style: TimelineItemTextStyle): LayerMotionValue {
    return {
      in: (style.transitionIn ?? 'none') as OverlayMotion,
      inSeconds: style.transitionInDuration ?? 0.5,
      out: (style.transitionOut ?? 'none') as OverlayMotion,
      outSeconds: style.transitionOutDuration ?? 0.5,
    };
  }

  setTextMotion(id: string, change: Partial<LayerMotionValue>): void {
    const patch: Partial<TimelineItemTextStyle> = {};
    if (change.in !== undefined) patch.transitionIn = change.in as TimelineItemTextStyle['transitionIn'];
    if (change.inSeconds !== undefined) patch.transitionInDuration = change.inSeconds;
    if (change.out !== undefined) patch.transitionOut = change.out as TimelineItemTextStyle['transitionOut'];
    if (change.outSeconds !== undefined) patch.transitionOutDuration = change.outSeconds;
    if (id === 'subtitles') this.state.updateSubtitleStyle(patch);
    else this.state.updateFrameTextStyle(id, patch);
  }

  imageMotionOf(im: FrameImage): LayerMotionValue {
    return { in: im.animIn, inSeconds: im.animInDuration, out: im.animOut, outSeconds: im.animOutDuration };
  }

  setImageMotion(id: string, change: Partial<LayerMotionValue>): void {
    const patch: Partial<FrameImage> = {};
    if (change.in !== undefined) patch.animIn = change.in;
    if (change.inSeconds !== undefined) patch.animInDuration = change.inSeconds;
    if (change.out !== undefined) patch.animOut = change.out;
    if (change.outSeconds !== undefined) patch.animOutDuration = change.outSeconds;
    this.state.updateFrameImage(id, patch);
  }

  /** "Apply to every text" in the Animations list: the subtitles too, unless asked not to. */
  applyToTexts(change: Partial<LayerMotionValue>, includeSubtitles: boolean): void {
    for (const t of this.state.frameLayout().texts) this.setTextMotion(t.id, change);
    if (includeSubtitles) this.setTextMotion('subtitles', change);
  }

  /** What "every text at once" shows: the first text layer's animation, or the subtitles' when there is none. */
  sharedTextStyle(): TimelineItemTextStyle {
    const layout = this.state.frameLayout();
    return layout.texts.length > 0 ? layout.texts[0].style : layout.subtitles.style;
  }

  applyToImages(change: Partial<LayerMotionValue>): void {
    for (const im of this.state.frameLayout().images) this.setImageMotion(im.id, change);
  }

  /** A one-word summary for a collapsed layer: "Typewriter in · Fade out". */
  motionSummary(value: LayerMotionValue, options: MotionOption[], outs: MotionOption[]): string {
    const label = (list: MotionOption[], id: OverlayMotion) => list.find((m) => m.id === id)?.label ?? id;
    if (value.in === 'none' && value.out === 'none') return 'No animation';
    return `${label(options, value.in)} in · ${label(outs, value.out)} out`;
  }

  onImageFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.state.uploadFrameImage(file);
  }

  // --- subtitles ---

  addCue(): void {
    this.state.addSubtitleCue();
    this.openSection.set('subtitles');
  }

  async onSubtitleFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const mode = this.cueCount() > 0 && !confirm('Replace the subtitles you have? Cancel adds the file\'s lines to them instead.')
      ? 'append'
      : 'replace';
    const n = await this.state.importSubtitleFile(file, mode);
    if (n > 0) this.state.status.notify([`Imported ${n} subtitle line${n === 1 ? '' : 's'}.`]);
  }

  generateFromScript(): void {
    if (!this.script().trim()) return;
    if (this.cueCount() > 0 && !confirm('Replace the subtitles you have with lines timed from this script?')) return;
    const n = this.state.subtitlesFromScript(this.script(), this.wordsPerCue());
    if (n > 0) {
      this.scriptOpen.set(false);
      this.state.status.notify([`Made ${n} subtitle line${n === 1 ? '' : 's'}, spread across the video. Fine-tune the times below.`]);
    }
  }

  clearCues(): void {
    if (confirm('Delete every subtitle line?')) this.state.clearSubtitles();
  }

  numberOr(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
}
