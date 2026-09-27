import { Component, computed, inject, input } from '@angular/core';
import { StudioStateService } from '../../../services/studio-state.service';

/**
 * The one answer to "what am I about to change?", shared by every clip-scoped tab.
 *
 * It replaces four hand-rolled copies that each branched five ways on `targetScope` and
 * differed only in a noun and an emoji - and whose empty states told the user to "switch
 * target scope", which is something the panel itself has to offer rather than describe.
 *
 * Transitions does not use it: that tab edits cut seams, not clips.
 */
@Component({
  selector: 'app-scope-bar',
  standalone: true,
  template: `
    @if (targetCount() === 0) {
      <div class="scope-bar scope-bar-empty">
        <div class="scope-empty-title">Nothing to {{ verb() }} yet</div>
        <p class="scope-empty-hint">
          Pick clips on the timeline or in the media library, or choose a target here.
        </p>
        <div class="scope-empty-actions">
          @if (state.currentScheduledClip()) {
            <button type="button" class="scope-empty-btn"
                    (click)="state.selectScopeOption('current')">
              ▶ Clip under the playhead
            </button>
          }
          @if (state.clipsUnderMusic().length > 0) {
            <button type="button" class="scope-empty-btn"
                    (click)="state.selectScopeOption('under_music')">
              🎵 Clips under music ({{ state.clipsUnderMusic().length }})
            </button>
          }
          <button type="button" class="scope-empty-btn"
                  (click)="state.selectScopeOption('all')">
            ☰ All clips ({{ state.included().length }})
          </button>
        </div>
      </div>
    } @else {
      <div class="scope-bar" [class.scope-bar-batch]="targetCount() > 1">
        <span class="scope-bar-icon">{{ icon() }}</span>
        <span class="scope-bar-text">
          <strong>{{ what() }}</strong> applies to <strong>{{ summary() }}</strong>.
        </span>
      </div>
    }
  `,
})
export class ScopeBarComponent {
  readonly state = inject(StudioStateService);

  /** What this tab changes, as it reads at the start of a sentence: "Color grading". */
  readonly what = input.required<string>();

  /** The same thing as a verb for the empty state: "grade", "style", "frame". */
  readonly verb = input<string>('edit');

  readonly targetCount = computed(() => this.state.getTargetClipIds().length);

  readonly icon = computed(() => {
    const scope = this.state.targetScope();
    if (scope === 'all') return '☰';
    if (scope === 'current') return '▶';
    if (scope === 'under_music' || scope === 'under_selected_music') return '🎵';
    return this.targetCount() > 1 ? '🎯' : '🎬';
  });

  /** "all 89 clips", "12 clips under music", or the clip's own name when there is just one. */
  readonly summary = computed(() => {
    const scope = this.state.targetScope();
    const count = this.targetCount();

    if (scope === 'all') return `all ${count} clips`;
    if (scope === 'under_music') return `${count} clips under music`;
    if (scope === 'under_selected_music') return `${count} clips under this music track`;
    if (count > 1) return `${count} selected clips`;

    const ids = this.state.getTargetClipIds();
    const name = this.state.included().find((r) => r.clip.id === ids[0])?.clip.name;
    return name ?? 'this clip';
  });
}
