import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { TextStyleEditorComponent } from './text-style-editor.component';
import {
  FRAME_DESIGNS, FRAME_IMAGE_MAX_WIDTH, FRAME_IMAGE_MIN_WIDTH, FrameDesign, FrameTiming,
  MAX_FRAME_IMAGES, MAX_FRAME_TEXTS, MAX_SUBTITLE_CUES, hexToRgba, resolveTextLook,
} from '../../../services/text-overlay-layout';
import { TimelineItemTextStyle } from '../../../../../core/models/api.models';

type Section = 'texts' | 'images' | 'subtitles';

/**
 * Everything drawn on the frame for the video as a whole. The bars around a wide clip in a
 * Short get a colour (or a blur of the clip); on top go any number of text layers and
 * images, each placed anywhere and shown for the whole video or a stretch of it; and timed
 * subtitles share one style so a whole video's captions restyle in one go.
 */
@Component({
  selector: 'app-frame-layout-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgTemplateOutlet, TextStyleEditorComponent],
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
  readonly barSwatches = ['#000000', '#ffffff', '#0f172a', '#1e1b4b', '#b91c1c', '#ea580c', '#facc15', '#16a34a', '#0ea5e9', '#db2777'];

  readonly openSections = signal<Set<Section>>(new Set(['texts']));
  /** Which layer's style editor is open; one at a time keeps the panel short. */
  readonly openStyle = signal<string | null>(null);
  readonly pickedImage = signal('');
  readonly scriptOpen = signal(false);
  readonly script = signal('');
  readonly wordsPerCue = signal(4);

  readonly cueCount = computed(() => this.state.frameLayout().subtitles.cues.length);

  isOpen(section: Section): boolean {
    return this.openSections().has(section);
  }

  toggleSection(section: Section): void {
    this.openSections.update((s) => {
      const next = new Set(s);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
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

  // --- timing ---

  wholeVideo(timing: FrameTiming): boolean {
    return timing.start == null && timing.end == null;
  }

  setWhole(id: string, whole: boolean): void {
    if (whole) this.state.updateFrameLayerTiming(id, { start: null, end: null });
    else this.state.frameLayerFromPlayhead(id, 3);
  }

  /** An empty box means "from the start" / "to the end". */
  setTimingEdge(id: string, edge: 'start' | 'end', value: string | number | null): void {
    const text = value === null ? '' : String(value).trim();
    const n = text === '' ? null : Number(text);
    this.state.updateFrameLayerTiming(id, { [edge]: n !== null && Number.isFinite(n) ? n : null });
  }

  // --- images ---

  addPickedImage(): void {
    const id = this.pickedImage();
    if (!id) return;
    this.state.addFrameImage(id);
    this.pickedImage.set('');
    this.openSections.update((s) => new Set(s).add('images'));
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
    this.openSections.update((s) => new Set(s).add('subtitles'));
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
