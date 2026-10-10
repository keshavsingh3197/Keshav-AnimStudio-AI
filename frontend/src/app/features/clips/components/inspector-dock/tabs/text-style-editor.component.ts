import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TextBoxStyle, TimelineItemTextStyle } from '../../../../../core/models/api.models';
import {
  TEXT_DESIGNS, TEXT_MAX_OUTLINE, TextDesign, hexToRgba, resolveTextLook,
} from '../../../services/text-overlay-layout';

/**
 * Everything about how a block of text looks: a design to start from, then size, colour,
 * plate, outline and position. Emits partial changes; the owner decides what they apply to
 * (a TXT1 overlay, or the frame's headline or caption).
 */
@Component({
  selector: 'app-text-style-editor',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './text-style-editor.component.html',
  styleUrls: ['./text-style-editor.component.css'],
})
export class TextStyleEditorComponent {
  readonly textStyle = input.required<TimelineItemTextStyle | undefined>();
  /** Show the Top / Center / Bottom row; the frame's slots only need the height slider. */
  readonly showPresets = input(true);
  readonly styleChange = output<Partial<TimelineItemTextStyle>>();

  readonly designs = TEXT_DESIGNS;
  readonly maxOutline = TEXT_MAX_OUTLINE;
  readonly textSwatches = ['#ffffff', '#000000', '#ffd400', '#22d3ee', '#4ade80', '#f472b6', '#ef4444'];
  readonly plateSwatches = ['#000000', '#ffffff', '#e11d48', '#1d4ed8', '#7c3aed', '#16a34a', '#f59e0b'];

  readonly look = computed(() => resolveTextLook(this.textStyle()));

  set(change: Partial<TimelineItemTextStyle>): void {
    this.styleChange.emit(change);
  }

  setBox(box: TextBoxStyle): void {
    const look = this.look();
    // Turning a plate on from "none" should show something - an opacity of 0 is invisible.
    this.set({ boxStyle: box, boxOpacity: box !== 'none' && look.boxOpacity === 0 ? 0.6 : look.boxOpacity });
  }

  setHeight(y: number): void {
    this.set({ position: 'custom', x: this.look().x, y });
  }

  /** A small sample of the design, painted the way the monitor paints text. */
  sample(design: TextDesign): Record<string, string> {
    const look = resolveTextLook({ ...(this.textStyle() ?? ({} as TimelineItemTextStyle)), ...design.style });
    const stroke = look.outlineWidth > 0 ? `${Math.min(3, look.outlineWidth)}px ${look.outlineColor}` : '';
    return {
      color: look.color,
      background: look.box === 'none' ? 'transparent' : hexToRgba(look.boxColor, look.boxOpacity),
      '-webkit-text-stroke': stroke,
      'text-shadow': look.shadow ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none',
      'text-transform': look.uppercase ? 'uppercase' : 'none',
    };
  }
}
