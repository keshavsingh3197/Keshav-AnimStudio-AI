import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ApiResponse } from '../../core/models/api.models';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { readStoryFile, saveStoryFile } from './story-agent.utils';

@Component({
  selector: 'app-comedy-workspace',
  imports: [FormsModule, RouterLink],
  templateUrl: './comedy-workspace.component.html',
  styleUrl: './comedy-workspace.component.css',
})
export class ComedyWorkspaceComponent {
  private readonly http = inject(HttpClient);
  private readonly stories = inject(StoryAgentService);
  private readonly router = inject(Router);

  readonly title = signal('');
  readonly material = signal('');
  readonly reference = signal('');
  readonly language = signal<'hi' | 'en'>('hi');
  readonly style = signal<'2D' | '3D'>('3D');
  readonly prompt = signal('');
  readonly reply = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly ready = computed(() => this.title().trim().length >= 3 && this.material().trim().length >= 3
    && this.title().length <= 160 && this.material().length <= 20000 && this.reference().length <= 1000);

  private body() {
    return {
      title: this.title().trim(), material: this.material().trim(), reference: this.reference().trim() || null,
      language: this.language(), style: this.style(),
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
      this.reply.set(response.data.reply);
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
    const url = URL.createObjectURL(new Blob([this.prompt()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comedy-conversion-prompt.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  private async storyFile() {
    const text = this.reply().trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    if (!text) throw new Error('Paste the complete JSON response first.');
    return readStoryFile(new File([text], 'comedy.story.json', { type: 'application/json' }));
  }

  async downloadStory(): Promise<void> {
    try {
      const file = await this.storyFile();
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
      const file = await this.storyFile();
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
