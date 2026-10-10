import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../../services/studio-state.service';
import { TextStyleEditorComponent } from './text-style-editor.component';
import { FRAME_DESIGNS, FrameDesign, hexToRgba, resolveTextLook } from '../../../services/text-overlay-layout';
import { TimelineItemTextStyle } from '../../../../../core/models/api.models';

/**
 * The space around the clip. A wide clip in a Short leaves a bar above and below it; this
 * panel fills the bars with a colour (or a blur of the clip) and puts a headline on the top
 * one and a caption on the bottom one, for the whole video.
 */
@Component({
  selector: 'app-frame-layout-inspector',
  standalone: true,
  imports: [FormsModule, TextStyleEditorComponent],
  templateUrl: './frame-layout-inspector.component.html',
  styleUrls: ['./frame-layout-inspector.component.css'],
})
export class FrameLayoutInspectorComponent {
  readonly state = inject(StudioStateService);
  readonly designs = FRAME_DESIGNS;
  readonly slots = ['top', 'bottom'] as const;
  readonly barSwatches = ['#000000', '#ffffff', '#0f172a', '#1e1b4b', '#b91c1c', '#ea580c', '#facc15', '#16a34a', '#0ea5e9', '#db2777'];

  /** Which slot's style editor is open; one at a time keeps the panel short. */
  readonly openStyle = signal<'top' | 'bottom' | null>('top');

  toggleStyle(slot: 'top' | 'bottom'): void {
    this.openStyle.update((s) => (s === slot ? null : slot));
  }

  /** Thumbnail text, painted roughly the way the design paints it. */
  sampleText(style: Partial<TimelineItemTextStyle>): Record<string, string> {
    const look = resolveTextLook({ ...this.state.frameLayout().top.style, ...style });
    return {
      color: look.color,
      background: look.box === 'none' ? 'transparent' : hexToRgba(look.boxColor, look.boxOpacity),
      width: look.box === 'band' ? '100%' : 'auto',
    };
  }

  barsOf(design: FrameDesign): string {
    return design.bars === 'blur' ? 'linear-gradient(160deg, #475569, #1e293b)' : design.barColor;
  }
}
