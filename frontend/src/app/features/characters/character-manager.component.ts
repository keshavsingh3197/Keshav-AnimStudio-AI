import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Character } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/** The cast: who appears, what they look like, and what colour their subtitles are. */
@Component({
  selector: 'app-character-manager',
  imports: [FormsModule],
  templateUrl: './character-manager.component.html',
})
export class CharacterManagerComponent {
  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly editing = signal<string | null>(null);
  readonly confirming = signal<string | null>(null);

  form = {
    name: '',
    description: '',
    aliases: '',
    closedMouthAssetId: '',
    openMouthAssetId: '',
    subtitleColorHex: '#ffe164',
    age: null as number | null,
    gender: '',
    hair: '',
    clothes: '',
    additionalDetails: '',
  };

  edit(character: Character): void {
    this.editing.set(character.id);
    this.form = {
      name: character.name,
      description: character.description ?? '',
      aliases: character.aliases.join(', '),
      closedMouthAssetId: character.closedMouthAssetId ?? '',
      openMouthAssetId: character.openMouthAssetId ?? '',
      subtitleColorHex: character.subtitleColorHex ?? '#ffe164',
      age: character.appearance.age ?? null,
      gender: character.appearance.gender ?? '',
      hair: character.appearance.hair ?? '',
      clothes: character.appearance.clothes ?? '',
      additionalDetails: character.appearance.additionalDetails ?? '',
    };
  }

  cancel(): void {
    this.editing.set(null);
    this.form = {
      name: '',
      description: '',
      aliases: '',
      closedMouthAssetId: '',
      openMouthAssetId: '',
      subtitleColorHex: '#ffe164',
      age: null,
      gender: '',
      hair: '',
      clothes: '',
      additionalDetails: '',
    };
  }

  save(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    const body = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || null,
      // Aliases are how a transcript's speaker labels find their character, so every
      // spelling the transcript might use is worth listing.
      aliases: this.form.aliases.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
      closedMouthAssetId: this.form.closedMouthAssetId || null,
      openMouthAssetId: this.form.openMouthAssetId || null,
      subtitleColorHex: this.form.subtitleColorHex || null,
      // Not used by the renderer - the sprites are - but it is the design the sprites were
      // drawn from, and what an image generator would be given later.
      appearance: {
        age: this.form.age ?? undefined,
        gender: this.form.gender.trim() || undefined,
        hair: this.form.hair.trim() || undefined,
        clothes: this.form.clothes.trim() || undefined,
        additionalDetails: this.form.additionalDetails.trim() || undefined,
      },
    };

    const id = this.editing();
    const call = id === null
      ? this.api.createCharacter(projectId, body)
      : this.api.updateCharacter(id, body);

    this.status.run(call, () => {
      this.cancel();
      this.store.refreshCharacters();
    });
  }

  remove(characterId: string): void {
    this.status.run(this.api.deleteCharacter(characterId), (scenesTouched) => {
      this.confirming.set(null);
      this.store.refreshCharacters();
      this.store.refreshScenes();

      if (scenesTouched > 0) {
        this.status.notify([
          `Its lines in ${scenesTouched} scene(s) were handed to the narrator.`,
        ]);
      }
    });
  }

  /** A one-line summary of the recorded appearance, or null when nothing was recorded. */
  appearanceOf(character: Character): string | null {
    const look = character.appearance;
    const parts = [
      look.age === undefined || look.age === null ? null : `${look.age}`,
      look.gender,
      look.hair,
      look.clothes,
      look.additionalDetails,
    ].filter((part): part is string => !!part && part.length > 0);

    return parts.length > 0 ? parts.join(' · ') : null;
  }

  assetUrl(assetId: string): string {
    return this.api.assetUrl(assetId);
  }

  /** A sprite with no alpha composites as an opaque rectangle, which is worth warning about. */
  isFlatSprite(assetId: string | undefined): boolean {
    if (!assetId) return false;
    const asset = this.store.assets().find((a) => a.id === assetId);
    return asset !== undefined && !asset.hasAlpha;
  }
}
