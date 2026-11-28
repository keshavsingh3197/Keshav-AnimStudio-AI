import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Project, RenderJob, TimelineItem } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AutomationService } from '../../core/services/automation.service';
import { EffectsService } from '../../core/services/effects.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';

export type AnimalPresetId = 'duck-leopard' | 'honey-badger';
export type AnimalTab = 'scenes' | 'generate' | 'publish' | 'library';
export type SceneSlotStatus = 'prompt-ready' | 'uploading' | 'ready' | 'failed';

const USED_COMBOS_KEY = 'ks_animal_used_combos_v1';
const CREATED_IDS_KEY = 'ks_animal_created_ids_v1';

const ANIMAL_SETTINGS = [
  'bamboo forest riverbank with mossy rocks and sparkling water',
  'dusty rural village bazaar courtyard with clay pots and wooden carts',
  'misty Himalayan pine trail with morning sunbeams',
  'golden savanna waterhole under an acacia tree',
  'moonlit ancient banyan grove with glowing fireflies',
  'rocky canyon rope bridge over a rushing stream',
  'sunlit mango orchard with tall grass and fallen fruit',
  'golden desert oasis with palm trees and red sandstone',
] as const;

const ANIMAL_VARIATIONS: ReadonlyArray<{
  key: string;
  title: string;
  hero: string;
  villain: string;
  victim: string;
  twist: string;
  sfx: [string, string, string, string, string, string];
}> = [
  {
    key: 'duck-leopard-shaktiman',
    title: '2 Ducks vs Leopard — Shaktiman Dust Rescue',
    hero: 'two expressive white cartoon ducks',
    villain: 'spotted leopard',
    victim: 'tiny frightened white rabbit',
    twist: 'spin in a golden-white Shaktiman tornado filling the air with thick dust and snatch the rabbit away',
    sfx: ['gasp_break', 'break_whoosh', 'bandook_burst', 'punch_pop', 'shock_sting', 'laugh_break'],
  },
  {
    key: 'duck-fox-chick',
    title: '2 Ducks vs Sly Fox — Tornado Feather Escape',
    hero: 'two clever white cartoon ducks',
    villain: 'sly red fox',
    victim: 'fluffy yellow baby chick',
    twist: 'launch a spinning feather-dust whirlwind that blinds the fox while they rescue the chick',
    sfx: ['gasp_break', 'break_whoosh', 'record_scratch', 'punch_pop', 'sad_trombone', 'laugh_break'],
  },
  {
    key: 'badger-bandook-ambush',
    title: 'Honey Badger vs Bandook Hunter & Bees',
    hero: 'fearless cartoon honey badger',
    villain: 'panicked hunter with a comic pop-gun and angry bee swarm',
    victim: 'captured baby tortoise',
    twist: 'casually walk through the bandook smoke and dust unbothered, free the tortoise, and give a deadpan stare',
    sfx: ['break_whoosh', 'bandook_shot', 'cricket_chirp', 'bruh_boom', 'shock_sting', 'laugh_break'],
  },
  {
    key: 'ducks-croc-elephant',
    title: 'Duck Duo & Baby Elephant vs Crocodile',
    hero: 'two heroic white ducks and a cute baby elephant',
    villain: 'sneaky green crocodile',
    victim: 'lost baby deer',
    twist: 'splash a giant water-and-dust cyclone around the crocodile and whisk the baby deer to safety',
    sfx: ['gasp_break', 'break_whoosh', 'dramatic_thud', 'boing_spring', 'sad_trombone', 'laugh_break'],
  },
  {
    key: 'badger-cobra-jackal',
    title: 'Honey Badger vs Cobra & Jackal Gang',
    hero: 'unbothered cartoon honey badger',
    villain: 'dramatic king cobra and sneaky jackal',
    victim: 'stolen mango basket',
    twist: 'flick the dust cloud aside with one paw, leaving both predators frozen with dropped jaws',
    sfx: ['break_whoosh', 'bandook_burst', 'cricket_chirp', 'slap_impact', 'bruh_boom', 'laugh_break'],
  },
];

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
  isVideo?: boolean;
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
  imports: [CommonModule, FormsModule, RouterLink, FileDropDirective],
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
            🦆 Duck Duo vs Leopard (Example)
          </button>
          <button type="button" class="as-pill" [class.active]="preset() === 'honey-badger'" (click)="selectPreset('honey-badger')">
            🦡 Honey Badger (Example)
          </button>
          <button type="button" class="as-pill" style="border-color:var(--brand);background:var(--brand-subtle);" (click)="generateFreshStoryAndSetting()">
            🎲 New Story &amp; New Place (No Repeat)
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
        <button type="button" role="tab" [class.active]="activeTab() === 'library'" (click)="activeTab.set('library'); loadGeneratedReels()">
          📺 4. Generated Reels ({{ generatedReels().length }})
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
              <small class="muted">Target: 9:16 Vertical Reels · Place: <strong>{{ currentSetting() }}</strong> · Recommended Google Flow Model: <strong>Nano Banana 2.1 (Image, 0 credits)</strong>.</small>
            </div>
            <div class="as-actions">
              <button type="button" class="btn secondary" (click)="generateFreshStoryAndSetting()">
                🎲 Shuffle New Story + Place
              </button>
              <button type="button" class="btn secondary" (click)="copyAllPrompts()">
                {{ copiedId() === 'all' ? '✓ Copied All Prompts!' : '📋 Copy All Scene Prompts (Batch)' }}
              </button>
              <button type="button" class="btn primary" (click)="activeTab.set('publish')">
                Next: Assemble 9:16 Reel →
              </button>
            </div>
          </div>

          <div class="as-batch-box" [appFileDrop]="'image/*,video/*'" [fileDropMultiple]="true" (filesDropped)="onDropAllFiles($event)">
            <div class="as-batch-left">
              <strong>📥 Drag &amp; Drop All {{ scenes().length }} Scene Images / Clips Here</strong>
              <small class="muted">
                Drop all files at once — we auto-match by filename (<code>Scene 1..{{ scenes().length }}</code>) or order. Configure duration or reorder below, then click <strong>1-Click Auto-Build &amp; Render</strong>.
              </small>
            </div>
            <div class="as-actions">
              <label class="btn secondary">
                📂 Select All Files
                <input type="file" accept="image/*,video/*" multiple hidden (change)="onSelectAllFiles($event)" />
              </label>
              <button
                type="button"
                class="btn primary"
                [disabled]="readyCount() === 0 || busy() || rendering()"
                (click)="autoBuildAndRenderReel()"
              >
                {{ rendering() ? '⏳ Rendering MP4…' : '🚀 1-Click Auto-Build & Render ' + aspect + ' MP4 (' + readyCount() + '/' + scenes().length + ')' }}
              </button>
            </div>
          </div>

          @if (renderStatus() || renderJob()) {
            <div class="as-render-card">
              <div class="as-bar">
                <div>
                  <strong>{{ renderStatus() || 'Render Job' }}</strong>
                  @if (renderJob(); as job) {
                    <small class="muted" style="display:block;">
                      Status: <strong>{{ job.status }}</strong> · Progress: {{ job.progress }}%
                      @if (job.errorMessage) { · <span class="as-err">{{ job.errorMessage }}</span> }
                    </small>
                  }
                </div>
                @if (renderProjectId(); as pid) {
                  <div class="as-actions">
                    @if (renderJob()?.status === 'Succeeded' && renderJob(); as job) {
                      <a class="btn small primary" [href]="downloadUrl(job.jobId)" target="_blank" rel="noopener">⬇ Download MP4</a>
                    }
                    <a class="btn small secondary" [routerLink]="['/projects', pid, 'clips']">🎬 Open in Video Editor</a>
                    <a class="btn small secondary" [routerLink]="['/projects', pid, 'videos']">📺 Videos &amp; Shorts</a>
                  </div>
                }
              </div>
              @if (renderJob(); as job) {
                <div class="as-progress-track">
                  <div class="as-progress-fill" [style.width.%]="job.progress"></div>
                </div>
                @if (job.status === 'Succeeded') {
                  <video class="as-rendered-video" controls playsinline [src]="previewUrl(job.jobId)"></video>
                }
              }
            </div>
          }

          <div class="as-field-row">
            <label>Custom Animal Story Idea (optional — creates a fresh 6-scene pack)
              <input type="text" [(ngModel)]="customIdeaInput" placeholder="e.g. 2 Ducks rescue a baby monkey from a tiger in a bamboo river" />
            </label>
            <label>Format
              <select [(ngModel)]="aspect">
                <option value="9:16">9:16 Reels / Shorts (1080×1920)</option>
                <option value="16:9">16:9 Widescreen (1920×1080)</option>
              </select>
            </label>
            <div style="display:flex;align-items:flex-end;">
              <button type="button" class="btn secondary" [disabled]="!customIdeaInput.trim()" (click)="applyCustomIdea()">
                ✨ Build Custom 6-Scene Prompts
              </button>
            </div>
          </div>

          <div class="as-grid">
            @for (sc of scenes(); track sc.index; let idx = $index) {
              <article class="as-scene-card" [class.ready]="sc.status === 'ready'" [class.failed]="sc.status === 'failed'">
                <div class="as-scene-top">
                  <strong>Scene {{ sc.index }} · {{ sc.title }}</strong>
                  <span class="as-badge" [class]="sc.status">{{ sc.timeRange }} · {{ statusLabel(sc.status) }}</span>
                </div>

                @if (sc.previewUrl) {
                  @if (sc.isVideo) {
                    <video class="as-preview" controls muted playsinline [src]="sc.previewUrl"></video>
                  } @else {
                    <img class="as-preview" [src]="sc.previewUrl" [alt]="sc.title" />
                  }
                }

                <div class="as-scene-config">
                  <label class="as-dur-label">
                    Duration (s):
                    <input
                      type="number"
                      min="2"
                      max="10"
                      [ngModel]="sc.durationSeconds"
                      (ngModelChange)="updateDuration(sc.index, $event)"
                    />
                  </label>
                  <div class="as-actions">
                    <button type="button" class="btn small secondary" [disabled]="idx === 0" title="Move Earlier" (click)="moveScene(idx, -1)">◀</button>
                    <button type="button" class="btn small secondary" [disabled]="idx === scenes().length - 1" title="Move Later" (click)="moveScene(idx, 1)">▶</button>
                    @if (sc.file) {
                      <button type="button" class="btn small secondary" title="Clear Media" (click)="clearSceneMedia(sc.index)">✕</button>
                    }
                  </div>
                </div>

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
            <button
              type="button"
              class="btn primary"
              [disabled]="readyCount() === 0 || busy() || rendering()"
              (click)="autoBuildAndRenderReel()"
            >
              {{ rendering() ? '⏳ Rendering MP4…' : '🚀 1-Click Auto-Build & Render ' + aspect + ' MP4' }}
            </button>
            <button type="button" class="btn secondary" [disabled]="busy()" (click)="importComedySfx()">
              🔊 Import Comedy &amp; Bandook SFX Pack
            </button>
            <button type="button" class="btn secondary" [disabled]="busy() || rendering()" (click)="createReelProject()">
              {{ busy() ? 'Building Project…' : '🎬 Open in Video Editor (Manual Edit)' }}
            </button>
          </div>
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.86rem;">
            <input type="checkbox" [(ngModel)]="autoImportSfx" />
            Auto-import Comedy &amp; Bandook SFX Pack during 1-Click Build
          </label>
          <small class="muted">Uploaded scenes ready: {{ readyCount() }} of {{ scenes().length }}.</small>
        </section>
      }

      @if (activeTab() === 'library') {
        <section class="card as-panel">
          <div class="as-bar">
            <div>
              <h2>📺 All Generated Animal Reels</h2>
              <small class="muted">Every reel project created from Animal Studio appears here so you can open, render, or watch it anytime.</small>
            </div>
            <button type="button" class="btn secondary" (click)="loadGeneratedReels()">🔄 Refresh List</button>
          </div>
          @if (generatedReels().length === 0) {
            <p class="muted">No Animal Reels created yet. Generate or upload scenes in Tab 1, then click <strong>Create 9:16 Reel Project</strong> in Tab 3.</p>
          } @else {
            <div class="as-grid">
              @for (proj of generatedReels(); track proj.id) {
                <article class="as-scene-card">
                  <strong>{{ proj.name }}</strong>
                  <small class="muted">{{ proj.width }}×{{ proj.height }} · {{ proj.updatedAt | date:'medium' }}</small>
                  <div class="as-actions">
                    <a class="btn small primary" [routerLink]="['/projects', proj.id, 'clips']">🎬 Open Video Editor</a>
                    <a class="btn small secondary" [routerLink]="['/projects', proj.id, 'videos']">▶ Watch / Exported Videos</a>
                  </div>
                </article>
              }
            </div>
          }
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
    .as-batch-box { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1rem 1.1rem; border: 2px dashed var(--brand); border-radius: 12px; background: var(--surface-2); transition: background 0.15s, border-color 0.15s; }
    .as-batch-box.file-drop-active { background: var(--brand-subtle); border-color: #10b981; }
    .as-batch-left { display: grid; gap: 0.25rem; max-width: 620px; }
    .as-scene-config { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border-radius: 8px; background: var(--surface-1); border: 1px solid var(--border); }
    .as-dur-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--muted); }
    .as-dur-label input { width: 58px; padding: 0.2rem 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.82rem; }
    .as-render-card { border: 1px solid var(--brand); border-radius: 12px; padding: 0.9rem 1rem; background: var(--surface-2); display: grid; gap: 0.65rem; }
    .as-progress-track { height: 8px; border-radius: 999px; background: var(--surface-1); overflow: hidden; border: 1px solid var(--border); }
    .as-progress-fill { height: 100%; background: var(--brand); transition: width 0.25s ease; }
    .as-rendered-video { width: 100%; max-height: 420px; border-radius: 10px; background: #000; }
  `,
})
export class AnimalStudioComponent implements OnInit {
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
  readonly rendering = signal(false);
  readonly renderStatus = signal<string | null>(null);
  readonly renderJob = signal<RenderJob | null>(null);
  readonly renderProjectId = signal<string | null>(null);
  readonly currentSetting = signal<string>('sunny jungle clearing with green bushes');
  readonly customTitleOverride = signal<string | null>(null);
  readonly generatedReels = signal<Project[]>([]);

  customIdeaInput = '';
  customTitle = '2 Ducks vs Leopard — Shaktiman Dust Rescue 🦆🌪️🐇 | #Shorts';
  aspect: '9:16' | '16:9' = '9:16';
  autoImportSfx = true;

  readonly reelTitle = computed(() =>
    this.customTitleOverride()
      ?? (this.preset() === 'duck-leopard'
        ? '🦆 Duck Duo vs Leopard — Shaktiman Dust Tornado Rescue (6 Scenes)'
        : '🦡 Honey Badger International — Fearless Reaction Reel (5 Scenes)'),
  );

  readonly readyCount = computed(() => this.scenes().filter((s) => s.status === 'ready').length);

  ngOnInit(): void {
    this.loadGeneratedReels();
  }

  loadGeneratedReels(): void {
    if (!this.auth.isAuthenticated()) return;
    const savedIds = this.readSavedIds();
    this.api.listProjects().subscribe({
      next: (all) => {
        const filtered = (all ?? []).filter(
          (p) => savedIds.has(p.id) || /duck|leopard|badger|animal|shaktiman/i.test(p.name),
        );
        this.generatedReels.set(filtered);
      },
      error: () => { /* optional */ },
    });
  }

  private readSavedIds(): Set<string> {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(CREATED_IDS_KEY) || '[]'));
    } catch {
      return new Set<string>();
    }
  }

  private saveCreatedId(id: string): void {
    const ids = this.readSavedIds();
    ids.add(id);
    try {
      localStorage.setItem(CREATED_IDS_KEY, JSON.stringify([...ids]));
    } catch {
      // ignore storage quota errors
    }
  }

  generateFreshStoryAndSetting(): void {
    let used: string[] = [];
    try {
      used = JSON.parse(localStorage.getItem(USED_COMBOS_KEY) || '[]');
    } catch {
      used = [];
    }

    const candidates: Array<{ v: typeof ANIMAL_VARIATIONS[number]; place: string; comboKey: string }> = [];
    for (const v of ANIMAL_VARIATIONS) {
      for (const place of ANIMAL_SETTINGS) {
        candidates.push({ v, place, comboKey: `${v.key}::${place}` });
      }
    }
    const fresh = candidates.filter((c) => !used.includes(c.comboKey));
    const pool = fresh.length > 0 ? fresh : candidates;
    const pick = pool[Math.floor(Math.random() * pool.length)];

    const nextUsed = (fresh.length > 0 ? [...used, pick.comboKey] : [pick.comboKey]).slice(-30);
    try {
      localStorage.setItem(USED_COMBOS_KEY, JSON.stringify(nextUsed));
    } catch {
      // ignore
    }

    const { v, place } = pick;
    this.currentSetting.set(place);
    this.customTitleOverride.set(`🎲 ${v.title} (${place.split(' with ')[0]})`);
    this.customTitle = `${v.title} | #Shorts`;
    this.scenes.set([
      {
        index: 1,
        title: 'Bushes Peek & Tension',
        timeRange: '0:00–0:04',
        durationSeconds: 4,
        positionsNote: `Foreground LEFT: ${v.hero} peeking from bushes. Background CENTER: ${v.villain} trapping ${v.victim} in ${place}.`,
        emotionReaction: 'Wide-eyed shock + gasp',
        sfxId: v.sfx[0],
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation in a ${place}. Foreground left: ${v.hero} peeking out from foliage in wide-eyed shock. Background center: ${v.villain} trapping ${v.victim}. Exact positions, vibrant lighting, no text.`,
        status: 'prompt-ready',
      },
      {
        index: 2,
        title: 'Hero Charge',
        timeRange: '0:04–0:08',
        durationSeconds: 4,
        positionsNote: `Center: ${v.hero} charging fast toward ${v.villain} in ${place}.`,
        emotionReaction: 'Determined heroic charge',
        sfxId: v.sfx[1],
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, same ${place}. ${v.hero} sprinting straight toward ${v.villain} with fierce comic determination and small dust puffs, no text.`,
        status: 'prompt-ready',
      },
      {
        index: 3,
        title: 'Whirlwind / Twist Chaos',
        timeRange: '0:08–0:12',
        durationSeconds: 4,
        positionsNote: `Center full frame: ${v.hero} ${v.twist} right around ${v.villain}.`,
        emotionReaction: 'Explosive dust chaos + action SFX',
        sfxId: v.sfx[2],
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, same ${place}. ${v.hero} ${v.twist} around ${v.villain}, huge swirling dust cloud filling the frame, dramatic comic energy, no text.`,
        status: 'prompt-ready',
      },
      {
        index: 4,
        title: 'Rescue & Escape',
        timeRange: '0:12–0:16',
        durationSeconds: 4,
        positionsNote: `Left exit: ${v.hero} dashing away safely with ${v.victim}.`,
        emotionReaction: 'Fast escape pop',
        sfxId: v.sfx[3],
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, dust swirling in ${place}. ${v.hero} carrying ${v.victim} safely out toward the left edge in fast motion blur, no text.`,
        status: 'prompt-ready',
      },
      {
        index: 5,
        title: 'Villain Shock Reaction',
        timeRange: '0:16–0:20',
        durationSeconds: 4,
        positionsNote: `Center close-up: dust settles; ${v.villain} alone staring in total disbelief.`,
        emotionReaction: 'Deadpan disbelief + meme shock',
        sfxId: v.sfx[4],
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, dust settling in the same ${place}. Close-up of ${v.villain} sitting completely alone with jaw dropped and bulging eyes in hilarious shock, no text.`,
        status: 'prompt-ready',
      },
      {
        index: 6,
        title: 'Victory Meme Outro',
        timeRange: '0:20–0:24',
        durationSeconds: 4,
        positionsNote: `Center close-up: ${v.hero} wearing cool sunglasses celebrating with safe ${v.victim}.`,
        emotionReaction: 'Victory laugh sting',
        sfxId: v.sfx[5],
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation in a bright ${place}. ${v.hero} wearing cool black sunglasses high-fiving with happy safe ${v.victim}, vibrant colors, no text.`,
        status: 'prompt-ready',
      },
    ]);
    this.notice.set(`Generated a fresh non-repeating story in a new setting: "${place}"!`);
  }

  applyCustomIdea(): void {
    const idea = this.customIdeaInput.trim();
    if (!idea) return;
    this.customTitleOverride.set(`✨ ${idea}`);
    this.customTitle = `${idea.slice(0, 80)} | #Shorts`;
    this.currentSetting.set('custom scene setting');
    this.scenes.set([1, 2, 3, 4, 5, 6].map((idx) => {
      const beats = ['Setup & Spying', 'Fast Approach', 'Dust / Tornado Twist', 'Rescue & Escape', 'Villain Shock Reaction', 'Victory Meme Outro'];
      const sfx = ['gasp_break', 'break_whoosh', 'bandook_burst', 'punch_pop', 'shock_sting', 'laugh_break'];
      return {
        index: idx,
        title: beats[idx - 1],
        timeRange: `0:${String((idx - 1) * 4).padStart(2, '0')}–0:${String(idx * 4).padStart(2, '0')}`,
        durationSeconds: 4,
        positionsNote: `Beat ${idx} (${beats[idx - 1]}) for: ${idea}`,
        emotionReaction: beats[idx - 1],
        sfxId: sfx[idx - 1],
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation. Scene ${idx} (${beats[idx - 1]}) of story: ${idea}. Expressive animal emotions, consistent characters, dynamic camera, no text.`,
        status: 'prompt-ready' as SceneSlotStatus,
      };
    }));
    this.notice.set(`Built custom 6-scene prompt pack for "${idea}".`);
  }

  selectPreset(id: AnimalPresetId): void {
    this.preset.set(id);
    this.customTitleOverride.set(null);
    if (id === 'duck-leopard') {
      this.currentSetting.set('sunny jungle clearing with green bushes');
      this.scenes.set(DUCK_LEOPARD_SCENES.map((s) => ({ ...s })));
      this.customTitle = '2 Ducks vs Leopard — Shaktiman Dust Rescue 🦆🌪️🐇 | #Shorts';
    } else {
      this.currentSetting.set('golden savanna trail');
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
    const isVideo = file.type.startsWith('video/');
    this.scenes.update((list) =>
      list.map((s) => (s.index === index ? { ...s, file, previewUrl, isVideo, status: 'ready', errorMessage: undefined } : s)),
    );
    this.notice.set(`Attached "${file.name}" to Scene ${index}.`);
  }

  onDropAllFiles(files: File[]): void {
    this.assignBatchFiles(files);
  }

  onSelectAllFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length > 0) this.assignBatchFiles(files);
  }

  private assignBatchFiles(rawFiles: File[]): void {
    const files = rawFiles.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (files.length === 0) {
      this.notice.set('Please drop image or video files (.png, .jpg, .webp, .mp4, .mov).');
      return;
    }

    const current = this.scenes().map((s) => ({ ...s }));
    const usedSlots = new Set<number>();
    const leftovers: File[] = [];

    // First pass: match filenames containing "scene 1", "sc_2", "03", etc.
    for (const file of files) {
      const m = file.name.match(/(?:scene|sc|shot|clip)?[\s_-]*([1-9][0-9]?)/i);
      const num = m ? Number(m[1]) : NaN;
      const slot = Number.isFinite(num) ? current.find((s) => s.index === num && !usedSlots.has(s.index)) : undefined;
      if (slot) {
        usedSlots.add(slot.index);
        slot.file = file;
        slot.previewUrl = URL.createObjectURL(file);
        slot.isVideo = file.type.startsWith('video/');
        slot.status = 'ready';
        slot.errorMessage = undefined;
      } else {
        leftovers.push(file);
      }
    }

    // Second pass: sort leftovers naturally and fill remaining slots in order.
    leftovers.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (const file of leftovers) {
      const slot =
        current.find((s) => !usedSlots.has(s.index) && !s.file)
        ?? current.find((s) => !usedSlots.has(s.index));
      if (!slot) break;
      usedSlots.add(slot.index);
      slot.file = file;
      slot.previewUrl = URL.createObjectURL(file);
      slot.isVideo = file.type.startsWith('video/');
      slot.status = 'ready';
      slot.errorMessage = undefined;
    }

    this.scenes.set(current);
    this.notice.set(`Attached ${usedSlots.size} file(s) automatically! Adjust duration/order if needed, then click 🚀 1-Click Auto-Build & Render.`);
  }

  updateDuration(index: number, rawSeconds: number): void {
    const secs = Math.max(2, Math.min(10, Math.round(Number(rawSeconds) || 4)));
    this.scenes.update((list) => this.recalculateTimeRanges(list.map((s) => (s.index === index ? { ...s, durationSeconds: secs } : s))));
  }

  moveScene(idx: number, delta: -1 | 1): void {
    const list = [...this.scenes()];
    const target = idx + delta;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    this.scenes.set(this.recalculateTimeRanges(list.map((s, i) => ({ ...s, index: i + 1 }))));
  }

  clearSceneMedia(index: number): void {
    this.scenes.update((list) =>
      list.map((s) => (s.index === index ? { ...s, file: undefined, previewUrl: undefined, isVideo: false, status: 'prompt-ready', errorMessage: undefined } : s)),
    );
  }

  private recalculateTimeRanges(list: AnimalSceneSlot[]): AnimalSceneSlot[] {
    let t = 0;
    return list.map((s) => {
      const start = t;
      const end = t + s.durationSeconds;
      t = end;
      const fmt = (v: number) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
      return { ...s, timeRange: `${fmt(start)}–${fmt(end)}` };
    });
  }

  previewUrl(jobId: string): string {
    return this.api.previewUrl(jobId);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
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

  async autoBuildAndRenderReel(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.notice.set('Please sign in first to auto-build and render your MP4 reel.');
      return;
    }
    const withFiles = this.scenes().filter((s) => !!s.file);
    if (withFiles.length === 0) {
      this.notice.set('Drag and drop at least 1 scene image or video clip first.');
      return;
    }

    this.rendering.set(true);
    this.renderJob.set(null);
    this.renderProjectId.set(null);
    this.renderStatus.set('Creating 9:16 Reel project…');

    try {
      const outW = this.aspect === '9:16' ? 1080 : 1920;
      const outH = this.aspect === '9:16' ? 1920 : 1080;
      const proj = await firstValueFrom(
        this.api.createProject({
          name: this.customTitle,
          width: outW,
          height: outH,
          fps: 30,
          distributionIntent: this.aspect === '9:16' ? 'Short' : 'Video',
        }),
      );
      this.saveCreatedId(proj.id);
      this.renderProjectId.set(proj.id);

      const uploadedIds: string[] = [];
      const timelineItems: TimelineItem[] = [];
      let t = 0;

      for (let i = 0; i < withFiles.length; i++) {
        const sc = withFiles[i];
        this.renderStatus.set(`Uploading scene ${i + 1} of ${withFiles.length} (${sc.title})…`);
        this.scenes.update((list) => list.map((x) => (x.index === sc.index ? { ...x, status: 'uploading' } : x)));
        try {
          const asset = await firstValueFrom(this.api.uploadAsset(proj.id, sc.file!));
          uploadedIds.push(asset.id);
          timelineItems.push({
            id: `animal_sc_${sc.index}`,
            type: sc.isVideo ? 'video' : 'image',
            trackId: 'V1',
            startTime: t,
            duration: sc.durationSeconds,
            src: asset.id,
            name: sc.title,
          });
          t += sc.durationSeconds;
          this.scenes.update((list) => list.map((x) => (x.index === sc.index ? { ...x, status: 'ready' } : x)));
        } catch {
          this.scenes.update((list) =>
            list.map((x) => (x.index === sc.index ? { ...x, status: 'failed', errorMessage: 'Upload failed — click Rebuild Scene and retry.' } : x)),
          );
        }
      }

      if (uploadedIds.length === 0) {
        this.renderStatus.set('All scene uploads failed. Please retry.');
        return;
      }

      if (this.autoImportSfx) {
        this.renderStatus.set('Importing Comedy & Bandook SFX pack…');
        try {
          await firstValueFrom(this.effects.importSfxPack({ genre: 'comedy' }));
        } catch {
          // Non-blocking: continue rendering even if SFX pack import is skipped.
        }
      }

      this.renderStatus.set(`Rendering ${this.aspect} MP4 (${uploadedIds.length} scenes)…`);
      let job = await firstValueFrom(
        this.api.mergeClips(proj.id, {
          exportName: this.customTitle,
          assetIds: uploadedIds,
          fit: 'Cover',
          outputWidth: outW,
          outputHeight: outH,
          quality: 'High',
          transition: 'None',
          transitionSeconds: 0,
          muteClipAudio: false,
          backgroundMusicVolume: 0.6,
          musicTracks: [],
          timelineItems,
          watermark: {
            kind: 'None',
            position: 'BottomRight',
            opacity: 0.85,
            heightFraction: 0.05,
            marginFraction: 0.03,
            backplateOpacity: 0.4,
          },
          youTubeLoudness: true,
        }),
      );
      this.renderJob.set(job);

      while (job.status === 'Queued' || job.status === 'Running') {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        job = await firstValueFrom(this.api.job(job.jobId, { silent: true }));
        this.renderJob.set(job);
      }

      if (job.status === 'Succeeded') {
        this.renderStatus.set('✅ Reel MP4 Ready! Watch below, download, or open in Video Editor.');
        this.notice.set(`Rendered "${this.customTitle}" successfully!`);
        this.status.notify([`Rendered Animal Reel "${this.customTitle}" (${uploadedIds.length} scenes).`]);
        this.loadGeneratedReels();
      } else {
        this.renderStatus.set(`Render ${job.status}: ${job.errorMessage || 'Check job details in Video Editor.'}`);
      }
    } catch {
      this.renderStatus.set('Auto-build failed. Check backend connection or open Video Editor manually.');
    } finally {
      this.rendering.set(false);
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
      this.saveCreatedId(proj.id);
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
