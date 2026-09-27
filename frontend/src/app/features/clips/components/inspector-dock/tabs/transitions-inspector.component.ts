import { Component, computed, inject } from '@angular/core';
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
}
