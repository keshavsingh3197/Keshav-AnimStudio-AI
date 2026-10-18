import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import {
  ERASE_DEFAULT_FEATHER, ERASE_DEFAULT_STRENGTH, EraseRegion, EraseSource, EraseStyle, MAX_ERASE_REGIONS,
} from '../../../../../core/models/api.models';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
type BoxField = 'x' | 'y' | 'width' | 'height';

/**
 * Wipes a logo or watermark that is already burned into the footage - blurred, patched
 * over with the footage beside it, painted out, or swapped for the project's own mark.
 * Kept apart from framing: it edits the source picture, not how the clip is placed.
 */
@Component({
  selector: 'app-erase-watermark-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './erase-watermark-panel.component.html',
  styleUrl: './erase-watermark-panel.component.css',
})
export class EraseWatermarkPanelComponent {
  readonly state = inject(StudioStateService);

  readonly open = signal(true);
  readonly showHelp = signal(false);
  readonly maxRegions = MAX_ERASE_REGIONS;
  readonly regions = this.state.activeEraseRegions;

  /** The box shown expanded: the selected one, or the only one. */
  readonly expanded = computed(() => {
    const sel = this.state.selectedEraseIndex();
    const count = this.regions().length;
    if (sel !== null && sel < count) return sel;
    return count === 1 ? 0 : null;
  });

  readonly hasMark = computed(() => {
    const wm = this.state.effectiveWatermark();
    return wm.kind === 'Logo' ? !!wm.logoAssetId : wm.kind === 'Text' ? !!wm.text?.trim() : false;
  });

  readonly modes: { style: EraseStyle; icon: string; label: string; hint: string }[] = [
    { style: 'Clean', icon: '✧', label: 'Clean', hint: 'Rebuilds the box from the colours around its edges - text on a plain band or gradient disappears completely, leaving room for your own titles' },
    { style: 'Patch', icon: '✦', label: 'Patch', hint: 'Covers the mark with the footage right beside it - best on sky, water, grass or other texture' },
    { style: 'Blur', icon: '◌', label: 'Blur', hint: 'Smears the mark into its surroundings' },
    { style: 'Brand', icon: '★', label: 'My mark', hint: 'Removes the mark and puts your own watermark in the same spot' },
    { style: 'Fill', icon: '■', label: 'Fill', hint: 'Paints a box over the mark in one colour' },
  ];

  readonly sources: { value: EraseSource; icon: string; title: string }[] = [
    { value: 'Auto', icon: 'Auto', title: 'Pick whichever side has room' },
    { value: 'Above', icon: '↑', title: 'Copy the footage above the box' },
    { value: 'Below', icon: '↓', title: 'Copy the footage below the box' },
    { value: 'Left', icon: '←', title: 'Copy the footage left of the box' },
    { value: 'Right', icon: '→', title: 'Copy the footage right of the box' },
  ];

  readonly corners: { value: Corner; icon: string; title: string }[] = [
    { value: 'top-left', icon: '◤', title: 'Top left' },
    { value: 'top-right', icon: '◥', title: 'Top right' },
    { value: 'center', icon: '◼', title: 'Centre' },
    { value: 'bottom-left', icon: '◣', title: 'Bottom left' },
    { value: 'bottom-right', icon: '◢', title: 'Bottom right' },
  ];

  readonly fillSwatches = ['#000000', '#ffffff', '#1f2937', '#7f6a4f'];

  readonly boxFields: { key: BoxField; label: string; title: string }[] = [
    { key: 'x', label: 'X', title: 'Left edge, % of the frame width' },
    { key: 'y', label: 'Y', title: 'Top edge, % of the frame height' },
    { key: 'width', label: 'W', title: 'Width, % of the frame width' },
    { key: 'height', label: 'H', title: 'Height, % of the frame height' },
  ];

  modeOf(style: EraseStyle) {
    return this.modes.find((m) => m.style === style) ?? this.modes[0];
  }

  strength(r: EraseRegion): number { return r.strength ?? ERASE_DEFAULT_STRENGTH; }
  feather(r: EraseRegion): number { return r.feather ?? ERASE_DEFAULT_FEATHER; }

  toggle(): void { this.open.update((v) => !v); }

  select(index: number): void {
    this.state.selectEraseRegion(this.expanded() === index ? null : index);
  }

  add(corner: Corner): void { this.state.addEraseRegion(corner); }

  /** Adds a box in the first corner no existing box sits in, so it never lands on top of one. */
  addNext(): void {
    const taken = (c: Corner) => this.regions().some((r) => {
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const col = cx < 33 ? 'left' : cx > 67 ? 'right' : 'mid';
      const row = cy < 33 ? 'top' : cy > 67 ? 'bottom' : 'mid';
      return c === 'center' ? col === 'mid' && row === 'mid' : c === `${row}-${col}`;
    });
    const order: Corner[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'];
    this.add(order.find((c) => !taken(c)) ?? 'center');
  }

  update(index: number, patch: Partial<EraseRegion>): void {
    this.state.updateEraseRegion(index, patch);
  }

  onRange(index: number, key: 'strength' | 'feather' | 'opacity', event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) this.update(index, { [key]: val });
  }

  onBoxInput(index: number, key: BoxField, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) this.update(index, { [key]: val });
  }

  /** Moves the box flush into a corner of the frame, keeping its size. */
  snap(index: number, r: EraseRegion, corner: Corner): void {
    const edge = 1;
    const x = corner.endsWith('left') ? edge : corner.endsWith('right') ? 100 - r.width - edge : (100 - r.width) / 2;
    const y = corner.startsWith('top') ? edge : corner.startsWith('bottom') ? 100 - r.height - edge : (100 - r.height) / 2;
    this.update(index, { x, y });
  }
}
