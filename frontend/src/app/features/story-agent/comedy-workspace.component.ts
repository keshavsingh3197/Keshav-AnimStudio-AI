import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ApiResponse } from '../../core/models/api.models';
import { EffectClip } from '../../core/models/effects.models';
import { EffectsService } from '../../core/services/effects.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { StoryExportFile } from '../../core/models/story-agent.models';
import { COMEDY_TONE_OPTIONS, ComedyToneStyle } from './comedy-templates';
import { ComedyReview, reviewComedyStory } from './comedy-review';
import { parseComedyStory, readComedyStoryUpload } from './comedy-story-file';
import { comedyStoryTemplate } from './comedy-story-template';
import { saveBlob, saveStoryFile } from './story-agent.utils';

@Component({
  selector: 'app-comedy-workspace',
  imports: [FormsModule, RouterLink],
  templateUrl: './comedy-workspace.component.html',
  styleUrl: './comedy-workspace.component.css',
})
export class ComedyWorkspaceComponent {
  private readonly http = inject(HttpClient);
  private readonly stories = inject(StoryAgentService);
  private readonly effects = inject(EffectsService);
  private readonly router = inject(Router);

  readonly title = signal('');
  readonly material = signal('');
  readonly reference = signal('');
  readonly language = signal<'hi' | 'en'>('hi');
  readonly style = signal<'2D' | '3D'>('3D');
  readonly targetSeconds = signal(30);
  readonly voicing = signal<'CharactersOnly' | 'Narrated'>('CharactersOnly');
  readonly comedyStyle = signal<ComedyToneStyle>('Auto');
  readonly includeMidMemes = signal(true);
  readonly memeLibrary = signal<EffectClip[]>([]);
  readonly selectedMemeNames = signal<string[]>([]);
  readonly comedyToneOptions = COMEDY_TONE_OPTIONS;
  readonly prompt = signal('');
  readonly reply = signal('');
  readonly review = signal<ComedyReview | null>(null);
  readonly videoPrompt = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly ready = computed(() => this.title().trim().length >= 3 && this.material().trim().length >= 3
    && this.title().length <= 160 && this.material().length <= 20000 && this.reference().length <= 1000);

  constructor() {
    this.effects.list().subscribe({
      next: (list) => {
        const sorted = [...list].sort((a, b) => Number(b.category === 'Reaction') - Number(a.category === 'Reaction'));
        this.memeLibrary.set(sorted);
        const autoPick = sorted
          .filter((c) => c.category === 'Reaction')
          .slice(0, 6)
          .map((c) => c.name);
        if (autoPick.length) this.selectedMemeNames.set(autoPick);
      },
      error: () => { /* library optional */ },
    });
  }

  toggleMemeName(name: string): void {
    const cur = this.selectedMemeNames();
    this.selectedMemeNames.set(cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]);
  }

  applyAutoComedyPreset(track: 'desi' | 'international' | 'tank' = 'desi'): void {
    this.style.set('3D');
    this.targetSeconds.set(30);
    this.voicing.set('CharactersOnly');
    this.includeMidMemes.set(true);
    if (track === 'international') {
      this.language.set('en');
      this.comedyStyle.set('GlobalSlapstick');
      this.title.set('Sneaky Doorway Trophy Heist 😂 | #Shorts');
      this.material.set(
        'Woody Buddy tip-toes past a glowing doorway frame to snatch a golden trophy, but Cuppy Mascot swaps the door with a bouncy spring wall into a sky-bridge obstacle twist!',
      );
      this.notice.set('Applied International Zero-Dialogue 3D Slapstick preset (Doorway & Sky Gauntlet).');
    } else if (track === 'tank') {
      this.language.set('en');
      this.comedyStyle.set('TankSeries');
      this.title.set('KV-Mini vs Mega Cannon Trap | Cartoon Tank Series | EP 01');
      this.material.set(
        'Two googly-eyed cartoon tanks brag across the canyon arena before a colossal super-cannon misfires a single squeaky rubber duck!',
      );
      this.notice.set('Applied Cartoon Tank Series (| EP XX) preset.');
    } else {
      this.language.set('hi');
      this.comedyStyle.set('DesiKhadiSitcom');
      this.title.set('टपरी पर दोस्ती और उधार कांड 😂 | EP 01');
      this.material.set(
        'पप्पू भैया पूरे कॉन्फिडेंस के साथ बबलू यार को चाय-समोसे की पार्टी देने टपरी पर ले जाते हैं, बबलू उन्हें खड़ी भाषा में चिढ़ाता है, बीच में उधार वाली पुरानी डायरी खुल जाती है और दोनों में से किसी के पास पैसे नहीं निकलते!',
      );
      this.notice.set('Applied Desi Khadi-Bhasha MJO-Style Sitcom preset (Tu-Tadak + Auto Memes).');
    }
    const autoPick = this.memeLibrary().slice(0, 6).map((c) => c.name);
    if (autoPick.length) this.selectedMemeNames.set(autoPick);
  }

  private body() {
    return {
      title: this.title().trim(), material: this.material().trim(), reference: this.reference().trim() || null,
      language: this.language(), style: this.style(), targetSeconds: this.targetSeconds(), voicing: this.voicing(),
      comedyStyle: this.comedyStyle(), includeMidMemes: this.includeMidMemes(),
      memeNames: this.includeMidMemes() ? this.selectedMemeNames() : [],
    };
  }

  async preparePrompt(): Promise<void> {
    if (!this.ready() || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    try {
      const response = await firstValueFrom(this.http.post<ApiResponse<{ prompt: string }>>(
        `${environment.apiUrl}/api/comedy-workspace/prompt`, this.body()));
      if (!response.data?.prompt) throw new Error('The server returned an empty prompt.');
      this.prompt.set(response.data.prompt);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The prompt could not be prepared.'));
    } finally {
      this.busy.set(false);
    }
  }

  async convert(): Promise<void> {
    if (!this.ready() || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    try {
      const response = await firstValueFrom(this.http.post<ApiResponse<{ reply: string; provider: string }>>(
        `${environment.apiUrl}/api/comedy-workspace/convert`, this.body()));
      if (!response.data?.reply) throw new Error('The model returned an empty response.');
      this.updateReply(response.data.reply);
      this.notice.set(`Response from ${response.data.provider}. Review it before importing.`);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The script could not be converted.'));
    } finally {
      this.busy.set(false);
    }
  }

  async copyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.prompt());
      this.notice.set('Prompt copied.');
      this.error.set(null);
    } catch {
      this.error.set('Could not copy the prompt. Select and copy the text instead.');
    }
  }

  downloadPrompt(): void {
    saveBlob(new Blob([this.prompt()], { type: 'text/plain;charset=utf-8' }), 'comedy-conversion-prompt.txt');
  }

  downloadTemplate(): void {
    saveStoryFile(comedyStoryTemplate(this.language(), this.style(), this.targetSeconds(), this.voicing()), 'comedy-template');
    this.error.set(null);
    this.notice.set('Example template downloaded. Replace its two sample scenes before importing.');
  }

  async pickScript(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 80 * 1024) {
      this.error.set('The text file is too large. Use up to 20,000 characters.');
      return;
    }
    try {
      const text = await file.text();
      if (text.length > 20000) throw new Error('The text file is too long. Use up to 20,000 characters.');
      this.material.set(text);
      this.error.set(null);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The text file could not be read.'));
    }
  }

  private showStory(file: StoryExportFile, text: string): void {
    this.reply.set(text);
    this.review.set(reviewComedyStory(file));
    this.videoPrompt.set('');
    if (typeof file.story.title === 'string') this.title.set(file.story.title.slice(0, 160));
    if (file.story.language === 'hi' || file.story.language === 'en') this.language.set(file.story.language);
    if (file.story.options?.artStyle === 'Cartoon') this.style.set('2D');
    if (file.story.options?.artStyle === 'Cartoon3D') this.style.set('3D');
    if (file.story.targetSeconds === 30 || file.story.targetSeconds === 60) this.targetSeconds.set(file.story.targetSeconds);
    if (file.story.voicing === 'CharactersOnly' || file.story.voicing === 'Narrated') this.voicing.set(file.story.voicing);
    this.error.set(null);
    this.notice.set(`Loaded "${file.story.title || 'story'}" with ${file.script?.scenes.length ?? 0} scenes. Review the JSON before importing.`);
  }

  updateReply(value: string): void {
    this.reply.set(value);
    this.review.set(null);
    this.videoPrompt.set('');
  }

  prepareVideoPrompt(): void {
    const review = this.review();
    if (!review) return;
    this.videoPrompt.set(review.prompt);
    this.notice.set('Video prompt prepared from the reviewed JSON. Check it before sending it to a video tool.');
    this.error.set(null);
  }

  async copyVideoPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.videoPrompt());
      this.notice.set('Video prompt copied.');
      this.error.set(null);
    } catch {
      this.error.set('Could not copy the video prompt. Select and copy the text instead.');
    }
  }

  downloadVideoPrompt(): void {
    saveBlob(new Blob([this.videoPrompt()], { type: 'text/plain;charset=utf-8' }), 'comedy-video-prompt.txt');
  }

  async loadPastedStory(): Promise<void> {
    try {
      const file = await parseComedyStory(this.reply());
      this.showStory(file, this.reply());
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The story could not be read.'));
      this.notice.set(null);
    }
  }

  async pickStory(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    input.value = '';
    if (!picked) return;
    try {
      const { story, text } = await readComedyStoryUpload(picked);
      this.showStory(story, text);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The story file could not be read.'));
      this.notice.set(null);
    }
  }

  async downloadStory(): Promise<void> {
    try {
      const file = await parseComedyStory(this.reply());
      saveStoryFile(file, file.story.title || 'comedy');
      this.error.set(null);
      this.notice.set('Story file downloaded. The script is checked when imported.');
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The story file could not be prepared.'));
    }
  }

  async importStory(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const file = await parseComedyStory(this.reply());
      const run = await firstValueFrom(this.stories.importStory(file));
      await this.router.navigate(['/story-agent', run.id]);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'The story could not be imported.'));
    } finally {
      this.busy.set(false);
    }
  }

  private message(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure || failure instanceof Error ? failure.message : fallback;
  }
}
