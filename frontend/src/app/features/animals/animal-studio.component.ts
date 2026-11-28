import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AutomationService } from '../../core/services/automation.service';
import { EffectsService } from '../../core/services/effects.service';
import { StatusService } from '../../core/services/status.service';

export type AnimalPresetId = 'duck-leopard' | 'honey-badger';
export type AnimalTab = 'scenes' | 'generate' | 'publish';
export type SceneSlotStatus = 'prompt-ready' | 'uploading' | 'ready' | 'failed';

export interface AnimalSceneSlot {
  index: number;
  title: string;
  timeRange: string;
  durationSeconds: number;
  positionsNote: string;
  emotionReaction: string;
  sfxId: string;
  googleFlowPrompt: string;
  status: SceneSlotStatus;
  errorMessage?: string;
  file?: File;
  previewUrl?: string;
}

const DUCK_LEOPARD_SCENES: AnimalSceneSlot[] = [
  {
    index: 1,
    title: 'Bushes Peek (Jhaad)',
    timeRange: '0:00–0:04',
    durationSeconds: 4,
    positionsNote: 'Foreground LEFT & CENTER: 2 white cartoon ducks peeking through green bushes. Background CENTER: spotted Leopard holding scared white Rabbit under front paw.',
    emotionReaction: 'Wide-eyed shock + gasp',
    sfxId: 'gasp_break',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, sunny jungle clearing. Foreground left and center: two expressive white cartoon ducks peeking out from behind dense green bushes with wide shocked eyes. Mid-background: a spotted leopard sitting on dirt ground holding a tiny frightened white rabbit under its front paw. Crisp lighting, exact character positions, no text.',
    status: 'prompt-ready',
  },
  {
    index: 2,
    title: '2 Ducks Sprint Charge',
    timeRange: '0:04–0:08',
    durationSeconds: 4,
    positionsNote: 'Center-to-Background: the exact 2 white ducks sprinting fast side-by-side out of the bushes straight toward the Leopard.',
    emotionReaction: 'Determined heroic eyebrows + action whoosh',
    sfxId: 'break_whoosh',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, same sunny jungle clearing. The same two white cartoon ducks sprinting fast side-by-side out of the green bushes toward the spotted leopard in the background, determined heroic expressions, small dust puffs behind webbed feet, dynamic motion, no text.',
    status: 'prompt-ready',
  },
  {
    index: 3,
    title: 'Shaktiman Dust Tornado',
    timeRange: '0:08–0:12',
    durationSeconds: 4,
    positionsNote: 'Center frame: both ducks spinning super fast in a vertical golden-white Shaktiman-style tornado around the Leopard, filling frame with thick dust cloud.',
    emotionReaction: 'Hyper-speed spin + comic chaos',
    sfxId: 'bandook_burst',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, same jungle clearing. Two white cartoon ducks spinning at super high speed like a glowing golden-white Shaktiman tornado vortex right around the spotted leopard, kicking up a massive swirling brown-gold dust cloud filling the frame, dramatic comic energy, no text.',
    status: 'prompt-ready',
  },
  {
    index: 4,
    title: 'Rabbit Snatch & Disappear',
    timeRange: '0:12–0:16',
    durationSeconds: 4,
    positionsNote: 'Center-to-Left exit: inside the dust cloud, the 2 ducks carry the white Rabbit together and dash out the left edge in speed blur.',
    emotionReaction: 'Fast snatch + comic pop',
    sfxId: 'punch_pop',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, swirling dust cloud in jungle clearing. The two white cartoon ducks swooping together carrying the happy tiny white rabbit safely between them, dashing out toward the left edge in fast motion blur, no text.',
    status: 'prompt-ready',
  },
  {
    index: 5,
    title: 'Leopard Shock Reaction',
    timeRange: '0:16–0:20',
    durationSeconds: 4,
    positionsNote: 'Center close-up: dust clears; Leopard sits alone staring at its empty front paw, jaw dropped, bulging eyes looking left & right.',
    emotionReaction: 'Deadpan disbelief + record scratch shock',
    sfxId: 'shock_sting',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, dust settling in the same sunny jungle clearing. Close-up of the spotted leopard sitting completely alone, staring down at its empty front paw with jaw dropped to the ground and huge bulging eyes in total comic shock ("where did it go?!"), hilarious expression, no text.',
    status: 'prompt-ready',
  },
  {
    index: 6,
    title: 'Victory Meme Outro',
    timeRange: '0:20–0:24',
    durationSeconds: 4,
    positionsNote: 'Center close-up: the 2 ducks wearing cool sunglasses high-fiving with the safe smiling white Rabbit in a bright sunny meadow.',
    emotionReaction: 'Smug victory + finale laugh',
    sfxId: 'laugh_break',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, bright sunny meadow. The two white cartoon ducks wearing cool black sunglasses high-fiving with the happy smiling white rabbit safely between them, celebratory heroic vibe, vibrant colors, no text.',
    status: 'prompt-ready',
  },
];

const HONEY_BADGER_SCENES: AnimalSceneSlot[] = [
  {
    index: 1,
    title: 'Smug Savanna Stroll',
    timeRange: '0:00–0:04',
    durationSeconds: 4,
    positionsNote: 'Center: fearless Honey Badger strutting toward camera with a confident smirk.',
    emotionReaction: 'Smug confidence',
    sfxId: 'break_whoosh',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, golden savanna trail. A fearless cartoon honey badger strutting confidently toward the camera with a smug half-smirk, cinematic warm sunlight, no text.',
    status: 'prompt-ready',
  },
  {
    index: 2,
    title: 'Bandook / Bee Ambush',
    timeRange: '0:04–0:08',
    durationSeconds: 4,
    positionsNote: 'Surrounding Honey Badger: angry bees and dramatic comic gunfire / ambush dust.',
    emotionReaction: 'Explosive chaos + bandook impact',
    sfxId: 'bandook_shot',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, same savanna. A swarm of angry cartoon bees and dramatic comic dust puffs exploding around the fearless honey badger, action comedy energy, no text.',
    status: 'prompt-ready',
  },
  {
    index: 3,
    title: 'Unbothered Deadpan Stare',
    timeRange: '0:08–0:12',
    durationSeconds: 4,
    positionsNote: 'Extreme close-up: Honey Badger staring straight at camera completely unbothered, slow blink.',
    emotionReaction: 'Deadpan silence + cricket chirp',
    sfxId: 'cricket_chirp',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation. Extreme close-up of the honey badger staring straight at the camera with completely unbothered deadpan half-closed eyes while chaos blurs behind it, hilarious meme face, no text.',
    status: 'prompt-ready',
  },
  {
    index: 4,
    title: 'Dust Flick & Predator Shock',
    timeRange: '0:12–0:16',
    durationSeconds: 4,
    positionsNote: 'Center: Honey Badger casually brushes dust off shoulder; predators freeze in disbelief.',
    emotionReaction: 'Bruh bass drop + jaw drop',
    sfxId: 'bruh_boom',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation. The honey badger casually brushing dust off its shoulder while a startled jackal and cobra freeze in the background with dropped jaws, no text.',
    status: 'prompt-ready',
  },
  {
    index: 5,
    title: 'Sunglasses Meme Outro',
    timeRange: '0:16–0:20',
    durationSeconds: 4,
    positionsNote: 'Center: Honey Badger putting on dark sunglasses and walking away into sunset.',
    emotionReaction: 'Victory laugh sting',
    sfxId: 'laugh_break',
    googleFlowPrompt: 'Vertical 9:16 3D Pixar-style cartoon animation, golden sunset. The fearless honey badger wearing cool black sunglasses walking away calmly like an action hero, vibrant cinematic lighting, no text.',
    status: 'prompt-ready',
  },
];

@Component({
  selector: 'app-animal-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="as-page studio-wide-page">
      <header class="card as-head">
        <div>
          <p class="as-eyebrow">ANIMAL REELS STUDIO · 9:16 · LOWEST-CREDIT GOOGLE FLOW + IN-APP FALLBACK</p>
          <h1>🦆 Animal Comedy &amp; Reaction Reels Studio</h1>
          <p class="muted">
            Exact scene positions, Shaktiman dust-tornado rescue &amp; Honey Badger emotional reactions. Use Google Flow
            (<code>Nano Banana 2.1 · 9:16 · 0 credits</code>) or in-app generation—if any scene fails, rebuild only that scene.
          </p>
        </div>
        <div class="as-preset-pills">
          <button type="button" class="as-pill" [class.active]="preset() === 'duck-leopard'" (click)="selectPreset('duck-leopard')">
            🦆 Duck Duo vs Leopard (Shaktiman Rescue · 6 Scenes)
          </button>
          <button type="button" class="as-pill" [class.active]="preset() === 'honey-badger'" (click)="selectPreset('honey-badger')">
            🦡 Honey Badger International (5 Scenes)
          </button>
        </div>
      </header>

      <nav class="as-tabs" role="tablist">
        <button type="button" role="tab" [class.active]="activeTab() === 'scenes'" (click)="activeTab.set('scenes')">
          🎬 1. Scenes, Exact Positions &amp; Google Flow Prompts ({{ readyCount() }}/{{ scenes().length }})
        </button>
        <button type="button" role="tab" [class.active]="activeTab() === 'generate'" (click)="activeTab.set('generate')">
          ⚡ 2. In-App Generate &amp; Safe Fallback
        </button>
        <button type="button" role="tab" [class.active]="activeTab() === 'publish'" (click)="activeTab.set('publish')">
          📤 3. Reactions, SFX &amp; Assemble 9:16 Reel
        </button>
      </nav>

      @if (notice()) {
        <div class="as-notice" role="status">{{ notice() }}</div>
      }

      @if (activeTab() === 'scenes') {
        <section class="card as-panel">
          <div class="as-bar">
            <div>
              <h2>{{ reelTitle() }}</h2>
              <small class="muted">Target: 9:16 Vertical Reels · Recommended Google Flow Model: <strong>Nano Banana 2.1 (Image, 0 credits)</strong> or Veo Fast for motion.</small>
            </div>
            <div class="as-actions">
              <button type="button" class="btn secondary" (click)="copyAllPrompts()">
                {{ copiedId() === 'all' ? '✓ Copied All Prompts!' : '📋 Copy All Scene Prompts (Batch)' }}
              </button>
              <button type="button" class="btn primary" (click)="activeTab.set('publish')">
                Next: Assemble 9:16 Reel →
              </button>
            </div>
          </div>

          <div class="as-grid">
            @for (sc of scenes(); track sc.index) {
              <article class="as-scene-card" [class.ready]="sc.status === 'ready'" [class.failed]="sc.status === 'failed'">
                <div class="as-scene-top">
                  <strong>Scene {{ sc.index }} · {{ sc.title }}</strong>
                  <span class="as-badge" [class]="sc.status">{{ sc.timeRange }} · {{ statusLabel(sc.status) }}</span>
                </div>

                @if (sc.previewUrl) {
                  <img class="as-preview" [src]="sc.previewUrl" [alt]="sc.title" />
                }

                <p class="as-pos"><strong>Exact Positions:</strong> {{ sc.positionsNote }}</p>
                <p class="as-meta"><strong>Emotion &amp; SFX:</strong> {{ sc.emotionReaction }} · <code>[SFX: {{ sc.sfxId }}]</code></p>

                <textarea rows="4" [ngModel]="sc.googleFlowPrompt" (ngModelChange)="updatePrompt(sc.index, $event)"></textarea>

                @if (sc.errorMessage) {
                  <p class="as-err">{{ sc.errorMessage }}</p>
                }

                <div class="as-actions">
                  <button type="button" class="btn small" (click)="copyScenePrompt(sc)">
                    {{ copiedId() === 'sc_' + sc.index ? '✓ Copied!' : '📋 Copy Flow Prompt' }}
                  </button>
                  <label class="btn small secondary">
                    ⬆ Upload Image/Clip
                    <input type="file" accept="image/*,video/*" hidden (change)="onUploadSceneFile(sc.index, $event)" />
                  </label>
                  <button type="button" class="btn small secondary" (click)="rebuildScene(sc.index)">
                    🔄 Rebuild Scene
                  </button>
                </div>
              </article>
            }
          </div>
        </section>
      }

      @if (activeTab() === 'generate') {
        <section class="card as-panel">
          <h2>⚡ In-App Generation with Automatic Prompt Fallback</h2>
          <p class="muted">
            Tries creating a Comedy 3D Reel draft in AnimStudio AI. If your AI image/credit limit is reached or any scene fails,
            existing scenes are preserved and each failed slot lets you copy its lowest-credit Google Flow prompt or click <strong>🔄 Rebuild Scene</strong>.
          </p>
          <div class="as-field-row">
            <label>Episode Title
              <input type="text" [(ngModel)]="customTitle" />
            </label>
            <label>Format
              <select [(ngModel)]="aspect">
                <option value="9:16">9:16 Reels / Shorts</option>
                <option value="16:9">16:9 Widescreen</option>
              </select>
            </label>
          </div>
          <div class="as-actions">
            <button type="button" class="btn primary" [disabled]="busy()" (click)="sendScriptToComedyStudio()">
              {{ busy() ? 'Creating Draft…' : '🚀 Create 3D Comedy Draft in Studio (With Fallback)' }}
            </button>
            <a routerLink="/comedy" class="btn secondary">Open Comedy Workspace ↗</a>
          </div>
        </section>
      }

      @if (activeTab() === 'publish') {
        <section class="card as-panel">
          <h2>📤 Reactions, Copyright-Safe SFX &amp; Assemble 9:16 Reel</h2>
          <p class="muted">
            1) Import our copyright-safe Comedy &amp; Bandook SFX pack into your Effects Library, then 2) create a Video Editor project with all uploaded scene images/clips in exact order ready to export &amp; post.
          </p>
          <div class="as-actions">
            <button type="button" class="btn secondary" [disabled]="busy()" (click)="importComedySfx()">
              🔊 Import Comedy &amp; Bandook SFX Pack
            </button>
            <button type="button" class="btn primary" [disabled]="busy()" (click)="createReelProject()">
              {{ busy() ? 'Building Project…' : '🎬 Create 9:16 Reel Project & Open Video Editor' }}
            </button>
          </div>
          <small class="muted">Uploaded scenes ready: {{ readyCount() }} of {{ scenes().length }}.</small>
        </section>
      }
    </section>
  `,
  styles: `
    .as-page { display: grid; gap: 1rem; padding: 1rem; max-width: 1280px; margin: 0 auto; }
    .as-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; padding: 1.1rem; }
    .as-eyebrow { margin: 0 0 0.25rem; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.08em; color: var(--brand); }
    h1, h2 { margin: 0 0 0.35rem; }
    .as-preset-pills, .as-tabs, .as-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .as-tabs { padding: 0.4rem; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-2); }
    .as-pill, .as-tabs button { padding: 0.55rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-1); color: var(--text); font-weight: 600; cursor: pointer; }
    .as-pill.active, .as-tabs button.active { background: var(--brand-subtle); border-color: var(--brand); }
    .as-notice { padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--brand); background: var(--brand-subtle); }
    .as-panel { padding: 1.1rem; display: grid; gap: 1rem; }
    .as-bar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .as-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 0.9rem; }
    .as-scene-card { border: 1px solid var(--border); border-radius: 10px; padding: 0.9rem; display: grid; gap: 0.55rem; background: var(--surface-2); }
    .as-scene-card.ready { border-color: #10b981; }
    .as-scene-card.failed { border-color: #ef4444; }
    .as-scene-top { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .as-badge { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid var(--border); }
    .as-badge.ready { color: #10b981; border-color: #10b981; }
    .as-preview { width: 100%; max-height: 220px; object-fit: cover; border-radius: 8px; }
    .as-pos, .as-meta { margin: 0; font-size: 0.84rem; color: var(--muted); }
    textarea { width: 100%; font-size: 0.82rem; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); }
    .as-field-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
    .as-err { color: #ef4444; font-size: 0.82rem; margin: 0; }
  `,
})
export class AnimalStudioComponent {
  private readonly api = inject(ApiService);
  private readonly automation = inject(AutomationService);
  private readonly effects = inject(EffectsService);
  private readonly status = inject(StatusService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly preset = signal<AnimalPresetId>('duck-leopard');
  readonly activeTab = signal<AnimalTab>('scenes');
  readonly scenes = signal<AnimalSceneSlot[]>(DUCK_LEOPARD_SCENES.map((s) => ({ ...s })));
  readonly copiedId = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly busy = signal(false);

  customTitle = '2 Ducks vs Leopard — Shaktiman Dust Rescue 🦆🌪️🐇 | #Shorts';
  aspect: '9:16' | '16:9' = '9:16';

  readonly reelTitle = computed(() =>
    this.preset() === 'duck-leopard'
      ? '🦆 Duck Duo vs Leopard — Shaktiman Dust Tornado Rescue (6 Scenes)'
      : '🦡 Honey Badger International — Fearless Reaction Reel (5 Scenes)',
  );

  readonly readyCount = computed(() => this.scenes().filter((s) => s.status === 'ready').length);

  selectPreset(id: AnimalPresetId): void {
    this.preset.set(id);
    if (id === 'duck-leopard') {
      this.scenes.set(DUCK_LEOPARD_SCENES.map((s) => ({ ...s })));
      this.customTitle = '2 Ducks vs Leopard — Shaktiman Dust Rescue 🦆🌪️🐇 | #Shorts';
    } else {
      this.scenes.set(HONEY_BADGER_SCENES.map((s) => ({ ...s })));
      this.customTitle = 'Honey Badger Does Not Care 🦡😎 | International Reaction #Shorts';
    }
    this.notice.set(null);
  }

  statusLabel(s: SceneSlotStatus): string {
    if (s === 'ready') return 'Media Ready';
    if (s === 'uploading') return 'Uploading…';
    if (s === 'failed') return 'Rebuild / Use Flow Prompt';
    return 'Flow Prompt Ready';
  }

  updatePrompt(index: number, value: string): void {
    this.scenes.update((list) => list.map((s) => (s.index === index ? { ...s, googleFlowPrompt: value } : s)));
  }

  copyScenePrompt(sc: AnimalSceneSlot): void {
    void navigator.clipboard?.writeText(sc.googleFlowPrompt);
    this.copiedId.set(`sc_${sc.index}`);
    setTimeout(() => this.copiedId.set(null), 2000);
  }

  copyAllPrompts(): void {
    const text = [
      `GOOGLE FLOW BATCH (Use Nano Banana 2.1 · Image · ${this.aspect} · 0 credits per image):`,
      '',
      ...this.scenes().map(
        (s) => `Scene ${s.index} (${s.timeRange} - ${s.title}) [SFX: ${s.sfxId}]:\n${s.googleFlowPrompt}`,
      ),
    ].join('\n\n');
    void navigator.clipboard?.writeText(text);
    this.copiedId.set('all');
    this.notice.set('Copied all scene prompts! Paste into Google Flow (Nano Banana 2.1, 9:16, 0 credits) and upload the generated files back to each scene card.');
    setTimeout(() => this.copiedId.set(null), 2500);
  }

  onUploadSceneFile(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    this.scenes.update((list) =>
      list.map((s) => (s.index === index ? { ...s, file, previewUrl, status: 'ready', errorMessage: undefined } : s)),
    );
    this.notice.set(`Attached "${file.name}" to Scene ${index}.`);
  }

  rebuildScene(index: number): void {
    this.scenes.update((list) =>
      list.map((s) => (s.index === index ? { ...s, status: s.file ? 'ready' : 'prompt-ready', errorMessage: undefined } : s)),
    );
    this.notice.set(`Scene ${index} reset and ready to regenerate or upload.`);
  }

  importComedySfx(): void {
    this.busy.set(true);
    this.effects.importSfxPack({ genre: 'comedy' }).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.notice.set(`Imported ${res.imported} Comedy/Bandook/Meme SFX (${res.skipped} already in library).`);
      },
      error: () => {
        this.busy.set(false);
        this.notice.set('Sign in to import SFX into your personal Effects Library.');
      },
    });
  }

  async sendScriptToComedyStudio(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.notice.set('Please sign in first, or use Tab 1 to copy all Google Flow prompts for free.');
      return;
    }
    this.busy.set(true);
    try {
      const script = this.scenes()
        .map((s) => `[SCENE]: ${s.title} | ${s.emotionReaction} | IMAGE: ${s.googleFlowPrompt}`)
        .join('\n');
      await firstValueFrom(
        this.automation.createComedyPost({
          title: this.customTitle,
          scriptOrIdeas: script,
          audienceTrack: 'international',
          comedyStyle: this.preset() === 'honey-badger' ? 'HoneyBadgerInternational' : 'GlobalSlapstick',
          format: this.aspect === '9:16' ? 'Vertical' : 'Wide',
          narrativeMode: this.aspect === '9:16' ? 'ShortReel' : 'FullStory',
          visualEngine: 'AiRealisticStory',
          targetSeconds: this.scenes().reduce((sum, s) => sum + s.durationSeconds, 0),
          language: 'en',
          includeMidMemes: true,
          includeBackgroundMusic: true,
        }),
      );
      this.notice.set('Created Comedy Studio draft! Open Comedy Workspace → Tab 3 (Queue & Publish) to render or review.');
    } catch {
      this.notice.set('In-app AI draft failed (quota/network). No data lost—use the copied Google Flow prompts in Tab 1 and upload images directly.');
    } finally {
      this.busy.set(false);
    }
  }

  async createReelProject(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.notice.set('Please sign in to create a project and open the Video Editor.');
      return;
    }
    this.busy.set(true);
    try {
      const proj = await firstValueFrom(
        this.api.createProject({
          name: this.customTitle,
          width: this.aspect === '9:16' ? 1080 : 1920,
          height: this.aspect === '9:16' ? 1920 : 1080,
          fps: 30,
          distributionIntent: this.aspect === '9:16' ? 'Short' : 'Video',
        }),
      );
      const withFiles = this.scenes().filter((s) => !!s.file);
      for (const sc of withFiles) {
        this.scenes.update((list) => list.map((x) => (x.index === sc.index ? { ...x, status: 'uploading' } : x)));
        try {
          await firstValueFrom(this.api.uploadAsset(proj.id, sc.file!));
          this.scenes.update((list) => list.map((x) => (x.index === sc.index ? { ...x, status: 'ready' } : x)));
        } catch {
          this.scenes.update((list) =>
            list.map((x) => (x.index === sc.index ? { ...x, status: 'failed', errorMessage: 'Upload failed — click Rebuild Scene and retry.' } : x)),
          );
        }
      }
      this.status.notify([`Created "${this.customTitle}" with ${withFiles.length} uploaded scenes.`]);
      await this.router.navigate(['/projects', proj.id, 'clips']);
    } catch {
      this.notice.set('Could not create project. Check backend connection and try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
