import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { ScopeBarComponent } from './scope-bar.component';
import { TextStyleEditorComponent } from './text-style-editor.component';
import { TEXT_CARD_EFFECTS } from '../../../services/text-overlay-layout';
import { TimelineItem } from '../../../../../core/models/api.models';

@Component({
  selector: 'app-text-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ScopeBarComponent, TextStyleEditorComponent],
  templateUrl: './text-inspector.component.html',
})
export class TextInspectorComponent {
  readonly state = inject(StudioStateService);
  readonly Math = Math;
  readonly cardEffects = TEXT_CARD_EFFECTS;

  /** How solid the card is: 0 when there is none, so the slider starts from the backdrop. */
  cardOpacity(item: TimelineItem): number {
    return item.textStyle?.cardColor ? item.textStyle.cardOpacity ?? 1 : 0;
  }
}

