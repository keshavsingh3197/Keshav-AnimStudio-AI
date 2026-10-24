import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { JunctionView } from '../../../models/clip-studio.models';

@Component({
  selector: 'app-transitions-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './transitions-inspector.component.html',
  styleUrl: './transitions-inspector.component.css',
})
export class TransitionsInspectorComponent {
  readonly state = inject(StudioStateService);

  /**
   * The cuts on either side of the clip the user has selected.
   *
   * This tab edits seams, not clips, so it cannot follow the selection directly - but
   * arriving here with a clip selected and being told only to "select a cut seam" leaves
   * the user to work out which of 88 cuts touches it. These are that answer.
   */
  readonly adjacentJunctions = computed<{ junction: JunctionView; side: 'before' | 'after' }[]>(() => {
    const clip = this.state.activeTargetClip();
    if (!clip) return [];

    const found: { junction: JunctionView; side: 'before' | 'after' }[] = [];
    for (const junction of this.state.junctionsList()) {
      if (junction.right.id === clip.id) found.push({ junction, side: 'before' });
      else if (junction.left.id === clip.id) found.push({ junction, side: 'after' });
    }
    return found;
  });

  readonly selectedClipName = computed<string>(
    () => this.state.activeTargetClip()?.name ?? ''
  );

  // --- Auto transitions ---------------------------------------------------------------

  readonly autoMode = signal<'fixed' | 'cycle' | 'random'>('cycle');

  readonly cutChoices: readonly string[] = this.state.transitions.filter((t) => t !== 'None');
  readonly imageChoices: readonly string[] = ['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom', 'zoom-in', 'zoom-out', 'pop'];
  readonly textChoices: readonly string[] = ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom', 'typewriter', 'wipe'];

  readonly cutPool = signal<string[]>(['Dissolve', 'Fade', 'WipeLeft', 'SlideLeft']);
  readonly imagePool = signal<string[]>(['fade', 'zoom-in']);
  readonly textPool = signal<string[]>(['fade', 'slide-up']);

  readonly cutSeconds = signal(0.5);
  readonly imageSeconds = signal(0.5);
  readonly textSeconds = signal(0.4);

  readonly autoMessage = signal<string | null>(null);

  readonly cutTargetCount = computed(() => this.state.autoTargetJunctions().length);
  readonly imageTargetCount = computed(() => { this.state.timelineItems(); this.state.selectedTimelineItemIds(); this.state.selectedTimelineItemId(); return this.state.autoTargetItems('image').length; });
  readonly textTargetCount = computed(() => { this.state.timelineItems(); this.state.selectedTimelineItemIds(); this.state.selectedTimelineItemId(); return this.state.autoTargetItems('text').length; });

  togglePool(pool: ReturnType<typeof signal<string[]>>, choice: string): void {
    pool.update((p) => p.includes(choice) ? (p.length > 1 ? p.filter((x) => x !== choice) : p) : [...p, choice]);
  }

  applyAuto(group: 'cuts' | 'images' | 'text' | 'all'): void {
    const mode = this.autoMode();
    let changed = 0;
    if (group === 'cuts' || group === 'all') {
      changed += this.state.applyAutoCutTransitions({ mode, pool: this.cutPool(), seconds: this.cutSeconds() });
    }
    if (group === 'images' || group === 'all') {
      changed += this.state.applyAutoItemMotions('image', { mode, pool: this.imagePool(), inSeconds: this.imageSeconds(), outSeconds: this.imageSeconds(), outMatchesIn: false });
    }
    if (group === 'text' || group === 'all') {
      changed += this.state.applyAutoItemMotions('text', { mode, pool: this.textPool(), inSeconds: this.textSeconds(), outSeconds: this.textSeconds(), outMatchesIn: false });
    }
    this.autoMessage.set(changed > 0
      ? `Auto-picked transitions for ${changed} item${changed === 1 ? '' : 's'}.`
      : 'Nothing of that kind matches the Apply to choice above - select some on the timeline or change it.');
  }

  label(value: string): string {
    return value.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
  }
}