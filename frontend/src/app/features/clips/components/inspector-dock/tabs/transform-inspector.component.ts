import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { ScopeBarComponent } from './scope-bar.component';

@Component({
  selector: 'app-transform-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ScopeBarComponent],
  templateUrl: './transform-inspector.component.html',
  styleUrl: './transform-inspector.component.css',
})
export class TransformInspectorComponent {
  readonly state = inject(StudioStateService);

  // Section collapse state (all open by default)
  readonly transformOpen = signal(true);
  readonly cropOpen = signal(true);
  readonly aiToolsOpen = signal(false);

  // AI tool execution state (Req 5)
  readonly aiToolBusy = signal<'reframe' | 'bgremove' | null>(null);

  toggleTransform(): void { this.transformOpen.update((v) => !v); }
  toggleCrop(): void { this.cropOpen.update((v) => !v); }
  toggleAiTools(): void { this.aiToolsOpen.update((v) => !v); }

  /** Format a nullable number as string or '--' for mixed-value display */
  fmt(val: number | null, decimals = 1): string {
    if (val === null || val === undefined) return '--';
    return val.toFixed(decimals);
  }

  // Clamped Scale: [5, 300] %
  onScaleSlider(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      this.state.setScopeTransformScale(val / 100);
    }
  }

  onScaleInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      const clamped = Math.max(5, Math.min(300, val));
      this.state.setScopeTransformScale(clamped / 100);
    }
  }

  onScaleBlur(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    const clamped = isNaN(val) ? 100 : Math.max(5, Math.min(300, val));
    el.value = clamped.toFixed(0);
    this.state.setScopeTransformScale(clamped / 100);
  }

  // Clamped X: [-50, 50] %
  onXInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      const clamped = Math.max(-50, Math.min(50, val));
      this.state.setScopeTransformPositionX(clamped);
    }
  }

  onXBlur(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    const clamped = isNaN(val) ? 0 : Math.max(-50, Math.min(50, val));
    el.value = clamped.toString();
    this.state.setScopeTransformPositionX(clamped);
  }

  // Clamped Y: [-50, 50] %
  onYInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      const clamped = Math.max(-50, Math.min(50, val));
      this.state.setScopeTransformPositionY(clamped);
    }
  }

  onYBlur(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    const clamped = isNaN(val) ? 0 : Math.max(-50, Math.min(50, val));
    el.value = clamped.toString();
    this.state.setScopeTransformPositionY(clamped);
  }

  // Clamped Rotation: [-360, 360] deg
  onRotateInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      const clamped = Math.max(-360, Math.min(360, val));
      this.state.setScopeTransformRotation(clamped);
    }
  }

  onRotateBlur(event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    const clamped = isNaN(val) ? 0 : Math.max(-360, Math.min(360, val));
    el.value = clamped.toString();
    this.state.setScopeTransformRotation(clamped);
  }

  // Clamped Crop: L+R < 99, T+B < 99, linked <= 49
  onCropInput(edge: 'left' | 'right' | 'top' | 'bottom', event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      this.state.setScopeCrop(edge, val);
    }
  }

  onCropBlur(edge: 'left' | 'right' | 'top' | 'bottom', event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = parseFloat(el.value);
    const parsed = isNaN(val) ? 0 : val;
    this.state.setScopeCrop(edge, parsed);
    const tx = this.state.activeScopeTransformSetting();
    const clampedVal = edge === 'left' ? tx.cropLeft
      : edge === 'right' ? tx.cropRight
      : edge === 'top' ? tx.cropTop
      : tx.cropBottom;
    if (clampedVal !== null && clampedVal !== undefined) {
      el.value = clampedVal.toString();
    }
  }

  /** Trigger AI Auto-Reframe (Req 5) */
  async triggerAiReframe(): Promise<void> {
    if (this.aiToolBusy() !== null) return;
    this.aiToolBusy.set('reframe');
    try {
      await new Promise((r) => setTimeout(r, 1500));
    } finally {
      this.aiToolBusy.set(null);
    }
  }

  /** Trigger AI Background Removal (Req 5) */
  async triggerAiBgRemoval(): Promise<void> {
    if (this.aiToolBusy() !== null) return;
    this.aiToolBusy.set('bgremove');
    try {
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      this.aiToolBusy.set(null);
    }
  }
}
