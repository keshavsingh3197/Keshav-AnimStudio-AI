import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';

@Component({
  selector: 'app-transform-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
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
    if (val === null) return '--';
    return val.toFixed(decimals);
  }

  /** Parse user input — returns NaN for '--' or invalid */
  parse(val: string): number {
    return parseFloat(val.replace(',', '.'));
  }

  /** Trigger AI Auto-Reframe (Req 5) */
  async triggerAiReframe(): Promise<void> {
    if (this.aiToolBusy() !== null) return;
    this.aiToolBusy.set('reframe');
    try {
      // Placeholder — wire to real endpoint when available
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
      // Placeholder — wire to real endpoint when available
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      this.aiToolBusy.set(null);
    }
  }
}

