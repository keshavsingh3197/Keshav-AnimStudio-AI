import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Project, RenderJob, TimedMusicClipBody, TimelineItem, VoiceoverVoice } from '../../core/models/api.models';
import { EffectClip } from '../../core/models/effects.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { EffectsService } from '../../core/services/effects.service';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';

export type AnimalPresetId = 'duck-leopard' | 'honey-badger';
export type StudioTab = 'prompts' | 'media' | 'audio' | 'render';
export type SceneSlotStatus = 'prompt-ready' | 'uploading' | 'ready' | 'failed';
export type CheckSeverity = 'pass' | 'warn' | 'fail';

export interface PreflightCheckItem {
  id: string;
  label: string;
  detail: string;
  severity: CheckSeverity;
  fixTab?: StudioTab;
}

export interface AnimalSceneSlot {
  index: number;
  title: string;
  timeRange: string;
  durationSeconds: number;
  positionsNote: string;
  emotionReaction: string;
  sfxId: string;
  memeCaption?: string;
  voiceLine?: string;
  googleFlowPrompt: string;
  status: SceneSlotStatus;
  errorMessage?: string;
  file?: File;
  previewUrl?: string;
  isVideo?: boolean;
}

const USED_COMBOS_KEY = 'ks_animal_used_combos_v1';
const CREATED_IDS_KEY = 'ks_animal_created_ids_v1';

const NO_SPEECH_RULE =
  'no human speaking, no human voice, no talking, no dialogue, no subtitles, no text, no watermark, exact locked character positions, nothing extra';

const AGGRESSIVE_COMEDY_SHAYARIS = [
  'Sher banna aasan hai jab shikar chhota ho, par jab baari aaye asli hero ki, toh hawa bhi Shaktiman ho jaati hai!',
  'Dhamki dene walon ka yahi anjaam hota hai, haath khali reh jaata hai aur hero ka kaam tamaam hota hai!',
  'Jo dusron ko darate hain unka bharosa toot jaata hai, jab asli dost aate hain toh dushman muh chhupata hai!',
  'Taqat par ghamand karne walon sun lo — jab dimag aur himmat ek saath ghoome, toh toofan bhi rasta deta hai!',
];

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

const DUCK_LEOPARD_SCENES: AnimalSceneSlot[] = [
  {
    index: 1,
    title: 'Bushes Peek (Jhaad)',
    timeRange: '0:00–0:03',
    durationSeconds: 3,
    positionsNote: 'Foreground LEFT & CENTER: 2 white cartoon ducks peeking through green bushes. Background CENTER: spotted Leopard holding scared white Rabbit under front paw.',
    emotionReaction: 'Wide-eyed shock + gasp',
    sfxId: 'gasp_break',
    memeCaption: 'WAIT... LOOK THERE! 👀',
    voiceLine: 'Arre dekh bhai! Yeh junglee tendua akela samajh ke masoom khargosh par ghamand dikha raha hai!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, sunny jungle clearing. Foreground left and center: two expressive white cartoon ducks peeking out from behind dense green bushes with wide shocked eyes. Mid-background: a spotted leopard sitting on dirt ground holding a tiny frightened white rabbit under its front paw. Crisp lighting, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 2,
    title: '2 Ducks Sprint Charge',
    timeRange: '0:03–0:06',
    durationSeconds: 3,
    positionsNote: 'Center-to-Background: the exact 2 white ducks sprinting fast side-by-side out of the bushes straight toward the Leopard.',
    emotionReaction: 'Determined heroic eyebrows + action whoosh',
    sfxId: 'break_whoosh',
    memeCaption: 'RESCUE MODE ON! 🦆💨',
    voiceLine: 'Ab iska ghamand todne ka waqt aa gaya hai — chalo dikhate hain asli hero kaun hai!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, same sunny jungle clearing. The same two white cartoon ducks sprinting fast side-by-side out of the green bushes toward the spotted leopard in the background, determined heroic expressions, small dust puffs behind webbed feet, dynamic motion, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 3,
    title: 'Shaktiman Dust Tornado',
    timeRange: '0:06–0:11',
    durationSeconds: 5,
    positionsNote: 'Center frame: both ducks spinning super fast in a vertical golden-white Shaktiman-style tornado around the Leopard, filling frame with thick dust cloud.',
    emotionReaction: 'Hyper-speed spin + comic chaos',
    sfxId: 'bandook_burst',
    memeCaption: 'SHAKTIMAN TORNADO! 🌪️🔥',
    voiceLine: AGGRESSIVE_COMEDY_SHAYARIS[0],
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, same jungle clearing. Two white cartoon ducks spinning at super high speed like a glowing golden-white Shaktiman tornado vortex right around the spotted leopard, kicking up a massive swirling brown-gold dust cloud filling the frame, dramatic comic energy, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 4,
    title: 'Rabbit Snatch & Disappear',
    timeRange: '0:11–0:14',
    durationSeconds: 3,
    positionsNote: 'Center-to-Left exit: inside the dust cloud, the 2 ducks carry the white Rabbit together and dash out the left edge in speed blur.',
    emotionReaction: 'Fast snatch + comic pop',
    sfxId: 'punch_pop',
    memeCaption: 'YOINK!! GONE! 🐇💨',
    voiceLine: 'Naak ke neeche se khargosh gayab! Ab dhoondhta reh dhool mein!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, swirling dust cloud in jungle clearing. The two white cartoon ducks swooping together carrying the happy tiny white rabbit safely between them, dashing out toward the left edge in fast motion blur, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 5,
    title: 'Leopard Shock Reaction',
    timeRange: '0:14–0:18',
    durationSeconds: 4,
    positionsNote: 'Center close-up: dust clears; Leopard sits alone staring at its empty front paw, jaw dropped, bulging eyes looking left & right.',
    emotionReaction: 'Deadpan disbelief + record scratch shock',
    sfxId: 'shock_sting',
    memeCaption: 'BRO WHERE DID IT GO?! 😱',
    voiceLine: 'Kya hua tendue? Haath khali aur muh khula ka khula reh gaya na!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, dust settling in the same sunny jungle clearing. Close-up of the spotted leopard sitting completely alone, staring down at its empty front paw with jaw dropped to the ground and huge bulging eyes in total comic shock, hilarious expression, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 6,
    title: 'Victory Meme Outro',
    timeRange: '0:18–0:22',
    durationSeconds: 4,
    positionsNote: 'Center close-up: the 2 ducks wearing cool sunglasses high-fiving with the safe smiling white Rabbit in a bright sunny meadow.',
    emotionReaction: 'Smug victory + finale laugh',
    sfxId: 'laugh_break',
    memeCaption: 'MISSION COMPLETE 😎🎉',
    voiceLine: 'Asli boss wahi jo bina shor kiye kaam tamaam kar de! Like thoko!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, bright sunny meadow. The two white cartoon ducks wearing cool black sunglasses high-fiving with the happy smiling white rabbit safely between them, celebratory heroic vibe, vibrant colors, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
];

const HONEY_BADGER_SCENES: AnimalSceneSlot[] = [
  {
    index: 1,
    title: 'Smug Savanna Stroll',
    timeRange: '0:00–0:03',
    durationSeconds: 3,
    positionsNote: 'Center: fearless Honey Badger strutting toward camera with a confident smirk.',
    emotionReaction: 'Smug confidence',
    sfxId: 'break_whoosh',
    memeCaption: 'ZERO FEAR 😎',
    voiceLine: 'Yeh jungle ka woh boss hai jisko kisi ke baap ka dar nahi!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, golden savanna trail. A fearless cartoon honey badger strutting confidently toward the camera with a smug half-smirk, cinematic warm sunlight, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 2,
    title: 'Bandook / Bee Ambush',
    timeRange: '0:03–0:07',
    durationSeconds: 4,
    positionsNote: 'Surrounding Honey Badger: angry bees and dramatic comic gunfire / ambush dust.',
    emotionReaction: 'Explosive chaos + bandook impact',
    sfxId: 'bandook_shot',
    memeCaption: 'WAIT FOR IT... 💥🐝',
    voiceLine: 'Goli chale ya madhumakkhiyan — iska attitude hilaane ki kisi mein aukaat nahi!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, same savanna. A swarm of angry cartoon bees and dramatic comic dust puffs exploding around the fearless honey badger, action comedy energy, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 3,
    title: 'Unbothered Deadpan Stare',
    timeRange: '0:07–0:11',
    durationSeconds: 4,
    positionsNote: 'Extreme close-up: Honey Badger staring straight at camera completely unbothered, slow blink.',
    emotionReaction: 'Deadpan silence + cricket chirp',
    sfxId: 'cricket_chirp',
    memeCaption: 'NOT EVEN BLINKING 😐',
    voiceLine: 'Dekh raha hai na? Palkein bhi nahi jhapkayi — pura system hang kar diya!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation. Extreme close-up of the honey badger staring straight at the camera with completely unbothered deadpan half-closed eyes while chaos blurs behind it, hilarious meme face, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 4,
    title: 'Dust Flick & Predator Shock',
    timeRange: '0:11–0:15',
    durationSeconds: 4,
    positionsNote: 'Center: Honey Badger casually brushes dust off shoulder; predators freeze in disbelief.',
    emotionReaction: 'Bruh bass drop + jaw drop',
    sfxId: 'bruh_boom',
    memeCaption: 'BRUH MOMENT 💀',
    voiceLine: AGGRESSIVE_COMEDY_SHAYARIS[1],
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation. The honey badger casually brushing dust off its shoulder while a startled jackal and cobra freeze in the background with dropped jaws, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
  {
    index: 5,
    title: 'Sunglasses Meme Outro',
    timeRange: '0:15–0:19',
    durationSeconds: 4,
    positionsNote: 'Center: Honey Badger putting on dark sunglasses and walking away into sunset.',
    emotionReaction: 'Victory laugh sting',
    sfxId: 'laugh_break',
    memeCaption: 'DEAL WITH IT 😎🔥',
    voiceLine: 'Chasma laga ke nikal liya sher — ab comments mein aag laga do!',
    googleFlowPrompt: `Vertical 9:16 3D Pixar-style cartoon animation, golden sunset. The fearless honey badger wearing cool black sunglasses walking away calmly like an action hero, vibrant cinematic lighting, ${NO_SPEECH_RULE}.`,
    status: 'prompt-ready',
  },
];

@Component({
  selector: 'app-animal-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FileDropDirective],
  template: `
    <section class="as-page studio-wide-page">
      <!-- CLEAN WORKSPACE HEADER -->
      <header class="card as-head">
        <div class="as-top-links">
          <a routerLink="/comedy" class="as-pill-link">← 3D Comedy Studio</a>
          <a routerLink="/memes" class="as-pill-link">🎭 Memes &amp; SFX Library ↗</a>
          <a routerLink="/automation" class="as-pill-link as-devotional-link">🪷 Devotional / Bhakti Reels (Auto Post Hub) ↗</a>
          <a routerLink="/youtube" class="as-pill-link">📺 YouTube Connect ↗</a>
        </div>

        <div class="as-head-main">
          <div>
            <p class="as-eyebrow">ACTION &amp; ANIMAL COMEDY REELS STUDIO · GOOGLE FLOW + REALISTIC VOICEOVER</p>
            <h1>🦆 Action &amp; Animal Comedy Reels</h1>
            <p class="muted">
              4 clean steps: <strong>1) Copy low-credit, zero-speech prompts</strong> →
              <strong>2) Drop 1–10s clips/images</strong> →
              <strong>3) Aggressive Comedy voiceover, Shayari, memes &amp; sentence-end SFX</strong> →
              <strong>4) Checks &amp; Render MP4</strong>.
            </p>
          </div>
          <div class="as-preset-pills">
            <button type="button" class="as-pill" [class.active]="preset() === 'duck-leopard'" (click)="selectPreset('duck-leopard')">
              🦆 Duck Duo vs Leopard
            </button>
            <button type="button" class="as-pill" [class.active]="preset() === 'honey-badger'" (click)="selectPreset('honey-badger')">
              🦡 Honey Badger
            </button>
            <button type="button" class="as-pill as-accent-pill" (click)="generateFreshStoryAndSetting()">
              🎲 New Story &amp; Place
            </button>
          </div>
        </div>

        <!-- OVERALL READINESS PROGRESS BAR -->
        <div class="as-overall-bar">
          <div class="as-overall-meta">
            <span><strong>Pipeline Readiness:</strong> {{ overallProgress() }}% ({{ readyCount() }}/{{ scenes().length }} clips attached · {{ totalSeconds() }}s total)</span>
            <span class="muted">Place: {{ currentSetting() }}</span>
          </div>
          <div class="as-progress-track">
            <div class="as-progress-fill" [style.width.%]="overallProgress()"></div>
          </div>
        </div>
      </header>

      @if (notice()) {
        <div class="as-notice" role="status">{{ notice() }}</div>
      }

      <!-- 4 SINGLE-PURPOSE TABS (NOTHING CROWDED ON ONE PAGE) -->
      <nav class="as-tabs" role="tablist" aria-label="Animal Comedy Studio Workflow">
        <button type="button" role="tab" [class.active]="activeTab() === 'prompts'" (click)="activeTab.set('prompts')">
          <span>🎬 1. Prompts &amp; Action Clone</span>
          <span class="as-tab-badge">{{ scenes().length }} scenes</span>
        </button>
        <button type="button" role="tab" [class.active]="activeTab() === 'media'" (click)="activeTab.set('media')">
          <span>📥 2. Clips &amp; Timing (1–10s)</span>
          <span class="as-tab-badge" [class.ok]="readyCount() > 0">{{ readyCount() }}/{{ scenes().length }}</span>
        </button>
        <button type="button" role="tab" [class.active]="activeTab() === 'audio'" (click)="activeTab.set('audio')">
          <span>🗣️ 3. Voice, Shayari &amp; Memes</span>
          <span class="as-tab-badge" [class.ok]="voicedCount() === scenes().length">{{ voicedCount() }}/{{ scenes().length }}</span>
        </button>
        <button type="button" role="tab" [class.active]="activeTab() === 'render'" (click)="activeTab.set('render'); loadGeneratedReels()">
          <span>🚀 4. Checks, Render &amp; Reels</span>
          <span class="as-tab-badge" [class.ok]="failedChecksCount() === 0">{{ failedChecksCount() === 0 ? 'Ready' : failedChecksCount() + ' req' }}</span>
        </button>
      </nav>

      <!-- TAB 1: STORY, REFERENCE ACTION CLONE & GOOGLE FLOW PROMPTS -->
      @if (activeTab() === 'prompts') {
        <section class="card as-panel">
          <div class="as-bar">
            <div>
              <h2>1. Locked-Position Prompts &amp; Action Cloner</h2>
              <small class="muted">Every prompt locks exact left/center/right character positions and enforces <strong>strictly NO human speaking</strong> at lowest Google Flow credit cost.</small>
            </div>
            <div class="as-actions">
              <button type="button" class="btn secondary" (click)="addEmptyScene()">➕ Add Scene (1–10s)</button>
              <button type="button" class="btn primary" (click)="copyAllPrompts()">
                {{ copiedId() === 'all' ? '✓ Copied Batch Prompts!' : '📋 Copy All Low-Credit Prompts' }}
              </button>
            </div>
          </div>

          <div class="as-field-row as-subcard">
            <label>Clone Channel Actions or Custom Idea (use <code>-&gt;</code> between shots to lock every shot)
              <input type="text" [(ngModel)]="customIdeaInput" placeholder="e.g. 2 Ducks peek bushes -> Sprint fast -> Shaktiman dust tornado -> Snatch rabbit -> Leopard shock" />
            </label>
            <label>Google Flow Model (Credit Saver)
              <select [(ngModel)]="flowModel">
                <option value="nano-banana-0cr">Nano Banana 2.1 · Image (0 Credits · Lowest Cost)</option>
                <option value="veo-fast">Veo 3.1 Fast · 1–8s Video Clip (Lowest Video Credits)</option>
              </select>
            </label>
            <label>Aspect Ratio
              <select [(ngModel)]="aspect">
                <option value="9:16">9:16 Reels / Shorts (1080×1920)</option>
                <option value="16:9">16:9 Widescreen (1920×1080)</option>
              </select>
            </label>
            <div style="display:flex;align-items:flex-end;">
              <button type="button" class="btn secondary" [disabled]="!customIdeaInput.trim()" (click)="applyCustomIdea()">
                ✨ Build Position-Locked Prompts
              </button>
            </div>
          </div>

          <div class="as-grid">
            @for (sc of scenes(); track sc.index) {
              <article class="as-scene-card">
                <div class="as-scene-top">
                  <strong>Scene {{ sc.index }} · {{ sc.title }}</strong>
                  <span class="as-badge">{{ sc.timeRange }} · 🔇 No Speech</span>
                </div>
                <p class="as-pos"><strong>Exact Positions:</strong> {{ sc.positionsNote }}</p>
                <textarea rows="4" [ngModel]="sc.googleFlowPrompt" (ngModelChange)="updatePrompt(sc.index, $event)"></textarea>
                <div class="as-actions">
                  <button type="button" class="btn small" (click)="copyScenePrompt(sc)">
                    {{ copiedId() === 'sc_' + sc.index ? '✓ Copied!' : '📋 Copy Prompt' }}
                  </button>
                  <button type="button" class="btn small secondary" (click)="rebuildScene(sc.index)">🔄 Rebuild</button>
                  @if (scenes().length > 1) {
                    <button type="button" class="btn small secondary" (click)="removeScene(sc.index)">🗑 Remove</button>
                  }
                </div>
              </article>
            }
          </div>

          <div class="as-step-footer">
            <span class="muted">Done generating in Google Flow? Drop all clips/images on the next tab.</span>
            <button type="button" class="btn primary" (click)="activeTab.set('media')">Next: Upload Clips &amp; Timing →</button>
          </div>
        </section>
      }

      <!-- TAB 2: BATCH DRAG-DROP CLIPS/IMAGES & 1-10s TIMING -->
      @if (activeTab() === 'media') {
        <section class="card as-panel">
          <div class="as-bar">
            <div>
              <h2>2. Upload Google Flow Clips or Images (1–10s per scene)</h2>
              <small class="muted">Total duration: <strong>{{ totalSeconds() }}s</strong> · Ready: <strong>{{ readyCount() }}/{{ scenes().length }}</strong></small>
            </div>
            <div class="as-actions">
              <button type="button" class="btn secondary" (click)="optimizePacing()">⚡ Auto-Optimize Pacing</button>
              <button type="button" class="btn secondary" (click)="addEmptyScene()">➕ Add Scene Slot</button>
            </div>
          </div>

          <div class="as-batch-box" [appFileDrop]="'image/*,video/*'" [fileDropMultiple]="true" (filesDropped)="onDropAllFiles($event)">
            <div class="as-batch-left">
              <strong>📥 Drag &amp; Drop All {{ scenes().length }} Clips or Images Here</strong>
              <small class="muted">Supports 1–8s Google Flow MP4 clips or PNG/JPG images. Auto-matched by filename (<code>Scene 1..{{ scenes().length }}</code>) or order.</small>
            </div>
            <label class="btn primary">
              📂 Select All Files
              <input type="file" accept="image/*,video/*" multiple hidden (change)="onSelectAllFiles($event)" />
            </label>
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
                } @else {
                  <div class="as-empty-preview">No clip/image attached yet</div>
                }

                <div class="as-scene-config">
                  <label class="as-dur-label">
                    Duration (1–10s):
                    <input type="number" min="1" max="10" [ngModel]="sc.durationSeconds" (ngModelChange)="updateDuration(sc.index, $event)" />
                  </label>
                  <div class="as-actions">
                    <button type="button" class="btn small secondary" [disabled]="idx === 0" title="Move Earlier" (click)="moveScene(idx, -1)">◀</button>
                    <button type="button" class="btn small secondary" [disabled]="idx === scenes().length - 1" title="Move Later" (click)="moveScene(idx, 1)">▶</button>
                    @if (sc.file) {
                      <button type="button" class="btn small secondary" title="Clear Media" (click)="clearSceneMedia(sc.index)">✕</button>
                    }
                  </div>
                </div>

                @if (sc.errorMessage) {
                  <p class="as-err">{{ sc.errorMessage }}</p>
                }

                <div class="as-actions">
                  <label class="btn small secondary">
                    ⬆ {{ sc.file ? 'Replace Clip/Image' : 'Upload Clip/Image' }}
                    <input type="file" accept="image/*,video/*" hidden (change)="onUploadSceneFile(sc.index, $event)" />
                  </label>
                </div>
              </article>
            }
          </div>

          <div class="as-step-footer">
            <button type="button" class="btn secondary" (click)="activeTab.set('prompts')">← Back: Prompts</button>
            <button type="button" class="btn primary" (click)="activeTab.set('audio')">Next: Voice, Shayari &amp; Memes →</button>
          </div>
        </section>
      }

      <!-- TAB 3: OUR REALISTIC VOICEOVER, SHAYARI, FUNNY MEMES & SENTENCE-END SFX -->
      @if (activeTab() === 'audio') {
        <section class="card as-panel">
          <div class="as-bar">
            <div>
              <h2>3. Realistic Voiceover, Aggressive Shayari, Memes &amp; SFX</h2>
              <small class="muted">Replaces unrealistic Google Flow audio with our realistic TTS voiceover and triggers comedy SFX right after every sentence completes.</small>
            </div>
            <div class="as-actions">
              <button type="button" class="btn secondary" (click)="injectShayari()">🎤 + Shuffle Aggressive Shayari</button>
              <button type="button" class="btn secondary" [disabled]="busy()" (click)="importComedySfx()">🔊 Import Comedy SFX Pack</button>
            </div>
          </div>

          <div class="as-subcard">
            <div class="as-toggles">
              <label><input type="checkbox" [(ngModel)]="useOurVoiceover" /> 🗣️ Use Our Realistic Voiceover (Sentence + Shayari)</label>
              <label><input type="checkbox" [(ngModel)]="muteGoogleFlowAudio" /> 🔇 Mute Google Flow Clip Audio</label>
              <label><input type="checkbox" [(ngModel)]="autoAddSfx" /> 🔊 Sync Comedy SFX After Every Sentence</label>
              <label><input type="checkbox" [(ngModel)]="autoAddMemes" /> 😂 Add Funny Meme Captions &amp; Confetti Outro</label>
            </div>

            <div class="as-field-row" style="margin-top:0.75rem;">
              <label>Our Realistic Voiceover Model
                <select [(ngModel)]="selectedVoiceId">
                  @if (voices().length === 0) {
                    <option value="">{{ auth.isAuthenticated() ? 'Loading voices or default engine…' : 'Sign in to load server TTS voices' }}</option>
                  }
                  @for (v of voices(); track v.id) {
                    <option [value]="v.id">{{ v.name }} ({{ v.languageCode || v.gender || 'multi' }})</option>
                  }
                </select>
              </label>
              <label>Comedy Delivery Style
                <select [(ngModel)]="voiceTone">
                  <option value="aggressive-comedy">🔥 Aggressive Desi Comedy + Shayari</option>
                  <option value="slapstick">😂 Punchy Cartoon Slapstick</option>
                </select>
              </label>
            </div>
          </div>

          <div class="as-grid">
            @for (sc of scenes(); track sc.index) {
              <article class="as-scene-card">
                <div class="as-scene-top">
                  <strong>Scene {{ sc.index }} · {{ sc.title }}</strong>
                  <span class="as-badge">{{ sc.timeRange }} · [SFX: {{ sc.sfxId }}]</span>
                </div>
                <label class="as-meme-label">
                  <span>🗣️ Voiceover Sentence / Shayari (SFX fires right after sentence ends)</span>
                  <textarea rows="2" [ngModel]="sc.voiceLine || ''" (ngModelChange)="updateVoiceLine(sc.index, $event)" placeholder="Punchline or Shayari..."></textarea>
                </label>
                <label class="as-meme-label">
                  <span>😂 Funny Meme Caption Overlay (T1 Track)</span>
                  <input type="text" [ngModel]="sc.memeCaption || ''" (ngModelChange)="updateMemeCaption(sc.index, $event)" placeholder="e.g. SHAKTIMAN TORNADO! 🌪️🔥" />
                </label>
              </article>
            }
          </div>

          <div class="as-step-footer">
            <button type="button" class="btn secondary" (click)="activeTab.set('media')">← Back: Clips &amp; Timing</button>
            <button type="button" class="btn primary" (click)="activeTab.set('render')">Next: Pre-Flight Checks &amp; Render →</button>
          </div>
        </section>
      }

      <!-- TAB 4: PRE-FLIGHT CHECKS, LIVE RENDER PROGRESS BAR & REELS LIBRARY -->
      @if (activeTab() === 'render') {
        <section class="card as-panel">
          <div class="as-bar">
            <div>
              <h2>4. Pre-Flight Readiness Checks &amp; 1-Click Render</h2>
              <small class="muted">Verify every check below, then click Render to build your synced MP4 with realistic voiceover, Shayari, SFX &amp; memes.</small>
            </div>
            @if (!auth.isAuthenticated()) {
              <button type="button" class="btn primary" (click)="auth.openAuthModal()">Sign In to Render</button>
            }
          </div>

          <!-- PRE-FLIGHT CHECKS GRID -->
          <div class="as-checks-grid">
            @for (chk of preflightChecks(); track chk.id) {
              <div class="as-check-item" [class]="chk.severity">
                <div class="as-check-head">
                  <strong>
                    {{ chk.severity === 'pass' ? '✓' : chk.severity === 'warn' ? '⚠' : '✕' }}
                    {{ chk.label }}
                  </strong>
                  @if (chk.severity !== 'pass' && chk.fixTab) {
                    <button type="button" class="btn small secondary" (click)="activeTab.set(chk.fixTab!)">Fix →</button>
                  }
                </div>
                <small class="muted">{{ chk.detail }}</small>
              </div>
            }
          </div>

          <!-- RENDER SETTINGS + CTA -->
          <div class="as-subcard">
            <div class="as-field-row">
              <label>Reel Title (YouTube Shorts &amp; Library)
                <input type="text" [(ngModel)]="customTitle" />
              </label>
              <label>Output Format
                <select [(ngModel)]="aspect">
                  <option value="9:16">9:16 Vertical Shorts (1080×1920)</option>
                  <option value="16:9">16:9 Widescreen (1920×1080)</option>
                </select>
              </label>
              <div style="display:flex;align-items:flex-end;">
                <button
                  type="button"
                  class="btn primary"
                  style="width:100%;"
                  [disabled]="failedChecksCount() > 0 || busy() || rendering()"
                  (click)="autoBuildAndRenderReel()"
                >
                  {{ rendering() ? '⏳ Building & Rendering…' : '🚀 Build, Sync Audio/Memes & Render MP4' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 5-STAGE RENDER PROGRESS BAR + VIDEO RESULT -->
          @if (rendering() || renderStatus() || renderJob()) {
            <div class="as-render-card">
              <div class="as-bar">
                <div>
                  <strong>{{ renderStatus() || 'Preparing render pipeline…' }}</strong>
                  <small class="muted" style="display:block;">
                    Pipeline Progress: <strong>{{ renderProgressPercent() }}%</strong>
                    @if (renderJob(); as job) {
                      · Server Encoder: <strong>{{ job.status }}</strong> ({{ job.progress }}%)
                      @if (job.errorMessage) { · <span class="as-err">{{ job.errorMessage }}</span> }
                    }
                  </small>
                </div>
                @if (renderProjectId(); as pid) {
                  <div class="as-actions">
                    @if (renderJob()?.status === 'Succeeded' && renderJob(); as job) {
                      <a class="btn small primary" [href]="downloadUrl(job.jobId)" target="_blank" rel="noopener">⬇ Download MP4</a>
                    }
                    <a class="btn small secondary" [routerLink]="['/projects', pid, 'clips']">🎬 Open Video Editor</a>
                    <a class="btn small secondary" [routerLink]="['/projects', pid, 'videos']">📺 Videos &amp; Shorts</a>
                  </div>
                }
              </div>

              <div class="as-render-steps">
                @for (stepLabel of renderStages; track stepLabel; let sIdx = $index) {
                  <span class="as-stage-pill" [class.active]="renderStepIndex() === sIdx + 1" [class.done]="renderStepIndex() > sIdx + 1">
                    {{ renderStepIndex() > sIdx + 1 ? '✓' : (sIdx + 1) + '.' }} {{ stepLabel }}
                  </span>
                }
              </div>

              <div class="as-progress-track">
                <div class="as-progress-fill" [style.width.%]="renderProgressPercent()"></div>
              </div>

              @if (renderJob(); as job) {
                @if (job.status === 'Succeeded') {
                  <video class="as-rendered-video" controls playsinline [src]="previewUrl(job.jobId)"></video>
                }
              }
            </div>
          }

          <!-- GENERATED REELS LIBRARY -->
          <div class="as-bar" style="margin-top:0.5rem;">
            <h3>📺 Saved Action &amp; Animal Comedy Reels ({{ generatedReels().length }})</h3>
            <button type="button" class="btn small secondary" (click)="loadGeneratedReels()">🔄 Refresh Library</button>
          </div>
          @if (generatedReels().length === 0) {
            <p class="muted">No reels saved yet. Complete Checks above and click Render to create your first MP4!</p>
          } @else {
            <div class="as-grid">
              @for (proj of generatedReels(); track proj.id) {
                <article class="as-scene-card">
                  <strong>{{ proj.name }}</strong>
                  <small class="muted">{{ proj.width }}×{{ proj.height }} · {{ proj.updatedAt | date:'medium' }}</small>
                  <div class="as-actions">
                    <a class="btn small primary" [routerLink]="['/projects', proj.id, 'clips']">🎬 Video Editor</a>
                    <a class="btn small secondary" [routerLink]="['/projects', proj.id, 'videos']">▶ Watch / Shorts</a>
                  </div>
                </article>
              }
            </div>
          }

          <div class="as-step-footer">
            <button type="button" class="btn secondary" (click)="activeTab.set('audio')">← Back: Voice, Shayari &amp; Memes</button>
          </div>
        </section>
      }
    </section>
  `,
  styles: `
    .as-page { display: grid; gap: 1rem; padding: 1rem; max-width: 1280px; margin: 0 auto; }
    .as-head { display: grid; gap: 0.9rem; padding: 1.1rem; }
    .as-top-links { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .as-pill-link { font-size: 0.8rem; padding: 0.3rem 0.7rem; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); text-decoration: none; font-weight: 600; }
    .as-devotional-link { border-color: #f59e0b; color: #f59e0b; }
    .as-head-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .as-eyebrow { margin: 0 0 0.25rem; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.08em; color: var(--brand); }
    h1, h2, h3 { margin: 0 0 0.3rem; }
    .as-preset-pills, .as-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .as-tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.5rem; padding: 0.45rem; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-2); }
    .as-tabs button { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.65rem 0.9rem; border-radius: 9px; border: 1px solid var(--border); background: var(--surface-1); color: var(--text); font-weight: 600; cursor: pointer; text-align: left; }
    .as-tabs button.active { background: var(--brand-subtle); border-color: var(--brand); }
    .as-tab-badge { font-size: 0.74rem; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-2); }
    .as-tab-badge.ok { color: #10b981; border-color: #10b981; }
    .as-pill { padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-1); color: var(--text); font-weight: 600; cursor: pointer; }
    .as-pill.active, .as-accent-pill { background: var(--brand-subtle); border-color: var(--brand); }
    .as-overall-bar { display: grid; gap: 0.35rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
    .as-overall-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; font-size: 0.84rem; }
    .as-notice { padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--brand); background: var(--brand-subtle); }
    .as-panel { padding: 1.15rem; display: grid; gap: 1rem; }
    .as-bar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .as-subcard { padding: 0.9rem 1rem; border-radius: 10px; border: 1px solid var(--border); background: var(--surface-2); }
    .as-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 0.9rem; }
    .as-scene-card { border: 1px solid var(--border); border-radius: 10px; padding: 0.9rem; display: grid; gap: 0.55rem; background: var(--surface-2); }
    .as-scene-card.ready { border-color: #10b981; }
    .as-scene-card.failed { border-color: #ef4444; }
    .as-scene-top { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .as-badge { font-size: 0.74rem; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid var(--border); }
    .as-badge.ready { color: #10b981; border-color: #10b981; }
    .as-preview { width: 100%; max-height: 220px; object-fit: cover; border-radius: 8px; }
    .as-empty-preview { height: 110px; display: grid; place-items: center; border-radius: 8px; border: 1px dashed var(--border); color: var(--muted); font-size: 0.84rem; }
    .as-pos { margin: 0; font-size: 0.84rem; color: var(--muted); }
    textarea { width: 100%; font-size: 0.82rem; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); }
    .as-field-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
    .as-err { color: #ef4444; font-size: 0.82rem; margin: 0; }
    .as-batch-box { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1.05rem; border: 2px dashed var(--brand); border-radius: 12px; background: var(--surface-2); }
    .as-batch-box.file-drop-active { background: var(--brand-subtle); border-color: #10b981; }
    .as-batch-left { display: grid; gap: 0.25rem; max-width: 680px; }
    .as-scene-config { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.35rem 0.55rem; border-radius: 8px; background: var(--surface-1); border: 1px solid var(--border); }
    .as-dur-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--muted); }
    .as-dur-label input { width: 60px; padding: 0.2rem 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.82rem; }
    .as-toggles { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.84rem; }
    .as-toggles label { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
    .as-meme-label { display: grid; gap: 0.25rem; font-size: 0.8rem; color: var(--muted); }
    .as-meme-label input { padding: 0.35rem 0.55rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.82rem; }
    .as-checks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; }
    .as-check-item { border: 1px solid var(--border); border-radius: 10px; padding: 0.75rem 0.9rem; background: var(--surface-2); display: grid; gap: 0.25rem; }
    .as-check-item.pass { border-color: #10b981; }
    .as-check-item.warn { border-color: #f59e0b; }
    .as-check-item.fail { border-color: #ef4444; }
    .as-check-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .as-render-card { border: 1px solid var(--brand); border-radius: 12px; padding: 1rem; background: var(--surface-2); display: grid; gap: 0.75rem; }
    .as-render-steps { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .as-stage-pill { font-size: 0.76rem; padding: 0.25rem 0.6rem; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-1); color: var(--muted); }
    .as-stage-pill.active { border-color: var(--brand); color: var(--text); font-weight: 700; }
    .as-stage-pill.done { border-color: #10b981; color: #10b981; }
    .as-progress-track { height: 10px; border-radius: 999px; background: var(--surface-1); overflow: hidden; border: 1px solid var(--border); }
    .as-progress-fill { height: 100%; background: var(--brand); transition: width 0.25s ease; }
    .as-rendered-video { width: 100%; max-height: 440px; border-radius: 10px; background: #000; }
    .as-step-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border); flex-wrap: wrap; }
  `,
})
export class AnimalStudioComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly effects = inject(EffectsService);
  private readonly status = inject(StatusService);
  readonly auth = inject(AuthService);

  readonly preset = signal<AnimalPresetId>('duck-leopard');
  readonly activeTab = signal<StudioTab>('prompts');
  readonly scenes = signal<AnimalSceneSlot[]>(DUCK_LEOPARD_SCENES.map((s) => ({ ...s })));
  readonly copiedId = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly busy = signal(false);
  readonly rendering = signal(false);
  readonly renderStepIndex = signal(0);
  readonly renderProgressPercent = signal(0);
  readonly renderStatus = signal<string | null>(null);
  readonly renderJob = signal<RenderJob | null>(null);
  readonly renderProjectId = signal<string | null>(null);
  readonly currentSetting = signal<string>('sunny jungle clearing with green bushes');
  readonly customTitleOverride = signal<string | null>(null);
  readonly generatedReels = signal<Project[]>([]);
  readonly voices = signal<VoiceoverVoice[]>([]);

  readonly renderStages = ['Create Project', 'Upload Media', 'Generate Voiceover & Shayari', 'Sync SFX & Memes', 'Encode Final MP4'];

  customIdeaInput = '';
  customTitle = '2 Ducks vs Leopard — Shaktiman Dust Rescue 🦆🌪️🐇 | #Shorts';
  aspect: '9:16' | '16:9' = '9:16';
  flowModel: 'nano-banana-0cr' | 'veo-fast' = 'nano-banana-0cr';
  selectedVoiceId = '';
  useOurVoiceover = true;
  muteGoogleFlowAudio = true;
  voiceTone: 'aggressive-comedy' | 'slapstick' = 'aggressive-comedy';
  autoAddSfx = true;
  autoAddMemes = true;

  readonly readyCount = computed(() => this.scenes().filter((s) => s.status === 'ready').length);
  readonly voicedCount = computed(() => this.scenes().filter((s) => !!s.voiceLine?.trim()).length);
  readonly totalSeconds = computed(() => this.scenes().reduce((sum, s) => sum + s.durationSeconds, 0));

  readonly overallProgress = computed(() => {
    const total = this.scenes().length || 1;
    const promptScore = 25;
    const mediaScore = Math.round((this.readyCount() / total) * 35);
    const audioScore = Math.round((this.voicedCount() / total) * 20);
    const renderScore = this.renderJob()?.status === 'Succeeded' ? 20 : 0;
    return Math.min(100, promptScore + mediaScore + audioScore + renderScore);
  });

  readonly preflightChecks = computed<PreflightCheckItem[]>(() => {
    const authed = this.auth.isAuthenticated();
    const ready = this.readyCount();
    const total = this.scenes().length;
    const secs = this.totalSeconds();
    const voiced = this.voicedCount();
    const memes = this.scenes().filter((s) => !!s.memeCaption?.trim()).length;

    return [
      {
        id: 'auth',
        label: 'Account Authentication',
        detail: authed ? 'Signed in and ready to render.' : 'Sign in required before rendering.',
        severity: authed ? 'pass' : 'fail',
      },
      {
        id: 'media',
        label: 'Scene Clips / Images Uploaded',
        detail: ready === 0
          ? 'No images or video clips uploaded yet.'
          : ready === total
            ? `All ${total} scenes attached.`
            : `${ready} of ${total} scenes attached (remaining skipped cleanly).`,
        severity: ready === 0 ? 'fail' : ready === total ? 'pass' : 'warn',
        fixTab: 'media',
      },
      {
        id: 'timing',
        label: 'Pacing & Clip Length (1–10s)',
        detail: `${secs}s total across ${total} scenes (${secs >= 15 && secs <= 45 ? 'optimal Shorts length' : 'click Auto-Optimize Pacing for 19–24s'})`,
        severity: secs >= 12 && secs <= 60 ? 'pass' : 'warn',
        fixTab: 'media',
      },
      {
        id: 'voice',
        label: 'Our Realistic Voiceover & Shayari',
        detail: !this.useOurVoiceover
          ? 'Disabled — only SFX and clip audio will play.'
          : !this.selectedVoiceId && this.voices().length > 0
            ? 'Select a voice model in Tab 3.'
            : `${voiced}/${total} lines ready (with mute Flow audio ${this.muteGoogleFlowAudio ? 'ON' : 'OFF'}).`,
        severity: !this.useOurVoiceover ? 'warn' : voiced > 0 ? 'pass' : 'warn',
        fixTab: 'audio',
      },
      {
        id: 'sfx-memes',
        label: 'Sentence-End SFX & Funny Memes',
        detail: `SFX sync ${this.autoAddSfx ? 'ON' : 'OFF'} · Meme overlays (${memes}/${total}) ${this.autoAddMemes ? 'ON' : 'OFF'} · Zero human speaking in Flow prompts.`,
        severity: this.autoAddSfx && this.autoAddMemes ? 'pass' : 'warn',
        fixTab: 'audio',
      },
    ];
  });

  readonly failedChecksCount = computed(() => this.preflightChecks().filter((c) => c.severity === 'fail').length);

  ngOnInit(): void {
    this.loadGeneratedReels();
    this.loadVoices();
  }

  private loadVoices(): void {
    if (!this.auth.isAuthenticated()) return;
    this.api.voiceoverVoices().subscribe({
      next: (res) => {
        const list = res?.voices ?? [];
        this.voices.set(list);
        if (!this.selectedVoiceId && list.length > 0) {
          const preferred = list.find((v) => /hi|in|hindi|en-in/i.test(v.languageCode || v.name)) ?? list[0];
          this.selectedVoiceId = preferred.id;
        }
      },
      error: () => { /* optional */ },
    });
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

  generateFreshStoryAndSetting(): void {
    let used: string[] = [];
    try {
      used = JSON.parse(localStorage.getItem(USED_COMBOS_KEY) || '[]');
    } catch {
      used = [];
    }
    const candidates: { v: (typeof ANIMAL_VARIATIONS)[number]; place: string; key: string }[] = [];
    for (const v of ANIMAL_VARIATIONS) {
      for (const place of ANIMAL_SETTINGS) {
        candidates.push({ v, place, key: `${v.key}@@${place}` });
      }
    }
    const fresh = candidates.filter((c) => !used.includes(c.key));
    const pool = fresh.length > 0 ? fresh : candidates;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const nextUsed = fresh.length > 0 ? [...used, picked.key] : [picked.key];
    try {
      localStorage.setItem(USED_COMBOS_KEY, JSON.stringify(nextUsed.slice(-30)));
    } catch {
      // ignore storage quota errors
    }

    const { v, place } = picked;
    const shayari = AGGRESSIVE_COMEDY_SHAYARIS[Math.floor(Math.random() * AGGRESSIVE_COMEDY_SHAYARIS.length)];
    this.currentSetting.set(place);
    this.customTitleOverride.set(`🎲 ${v.title} (${place.split(' with ')[0]})`);
    this.customTitle = `${v.title} | #Shorts`;
    this.scenes.set(this.recalculateTimeRanges([
      {
        index: 1,
        title: 'Bushes Peek & Tension',
        timeRange: '',
        durationSeconds: 3,
        positionsNote: `Foreground LEFT: ${v.hero} peeking from bushes. Background CENTER: ${v.villain} trapping ${v.victim} in ${place}.`,
        emotionReaction: 'Wide-eyed shock + gasp',
        sfxId: v.sfx[0],
        memeCaption: 'WAIT... LOOK THERE! 👀',
        voiceLine: `Dekh bhai! Yeh ${v.villain} khud ko boss samajh kar ${v.victim} ko dara raha hai!`,
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation in a ${place}. Foreground left: ${v.hero} peeking out from foliage in wide-eyed shock. Background center: ${v.villain} trapping ${v.victim}. Exact positions, vibrant lighting, ${NO_SPEECH_RULE}.`,
        status: 'prompt-ready',
      },
      {
        index: 2,
        title: 'Hero Charge',
        timeRange: '',
        durationSeconds: 3,
        positionsNote: `Center: ${v.hero} charging fast toward ${v.villain} in ${place}.`,
        emotionReaction: 'Determined heroic charge',
        sfxId: v.sfx[1],
        memeCaption: 'HERO MODE ON! ⚡',
        voiceLine: 'Ab iska ghamand todne ka waqt aa gaya hai — entry dekho hero ki!',
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, same ${place}. ${v.hero} sprinting straight toward ${v.villain} with fierce comic determination and small dust puffs, ${NO_SPEECH_RULE}.`,
        status: 'prompt-ready',
      },
      {
        index: 3,
        title: 'Whirlwind / Twist Chaos',
        timeRange: '',
        durationSeconds: 5,
        positionsNote: `Center full frame: ${v.hero} ${v.twist} right around ${v.villain}.`,
        emotionReaction: 'Explosive dust chaos + action SFX',
        sfxId: v.sfx[2],
        memeCaption: 'TORNADO CHAOS! 🌪️🔥',
        voiceLine: shayari,
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, same ${place}. ${v.hero} ${v.twist} around ${v.villain}, huge swirling dust cloud filling the frame, dramatic comic energy, ${NO_SPEECH_RULE}.`,
        status: 'prompt-ready',
      },
      {
        index: 4,
        title: 'Rescue & Escape',
        timeRange: '',
        durationSeconds: 3,
        positionsNote: `Left exit: ${v.hero} dashing away safely with ${v.victim}.`,
        emotionReaction: 'Fast escape pop',
        sfxId: v.sfx[3],
        memeCaption: 'YOINK!! GONE! 💨',
        voiceLine: `Naak ke neeche se ${v.victim} gayab! Ab dhoondhta reh dhool mein!`,
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, dust swirling in ${place}. ${v.hero} carrying ${v.victim} safely out toward the left edge in fast motion blur, ${NO_SPEECH_RULE}.`,
        status: 'prompt-ready',
      },
      {
        index: 5,
        title: 'Villain Shock Reaction',
        timeRange: '',
        durationSeconds: 4,
        positionsNote: `Center close-up: dust settles; ${v.villain} alone staring in total disbelief.`,
        emotionReaction: 'Deadpan disbelief + meme shock',
        sfxId: v.sfx[4],
        memeCaption: 'BRO WHERE DID IT GO?! 😱',
        voiceLine: 'Kya hua boss? Haath khali aur muh khula ka khula reh gaya na!',
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, dust settling in the same ${place}. Close-up of ${v.villain} sitting completely alone with jaw dropped and bulging eyes in hilarious shock, ${NO_SPEECH_RULE}.`,
        status: 'prompt-ready',
      },
      {
        index: 6,
        title: 'Victory Meme Outro',
        timeRange: '',
        durationSeconds: 4,
        positionsNote: `Center close-up: ${v.hero} wearing cool sunglasses celebrating with safe ${v.victim}.`,
        emotionReaction: 'Victory laugh sting',
        sfxId: v.sfx[5],
        memeCaption: 'MISSION COMPLETE 😎🎉',
        voiceLine: 'Asli hero wahi jo bina shor kiye kaam tamaam kar de! Like thoko!',
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation in a bright ${place}. ${v.hero} wearing cool black sunglasses high-fiving with happy safe ${v.victim}, vibrant colors, ${NO_SPEECH_RULE}.`,
        status: 'prompt-ready',
      },
    ]));
    this.notice.set(`Generated fresh non-repeating story in "${place}" with aggressive comedy & Shayari!`);
  }

  applyCustomIdea(): void {
    const idea = this.customIdeaInput.trim();
    if (!idea) return;
    this.customTitleOverride.set(`🎬 ${idea.slice(0, 60)}`);
    this.customTitle = `${idea.slice(0, 75)} | #Shorts`;
    this.currentSetting.set('locked custom scene setting');
    const parts = idea.split(/\s*->\s*|\n+/).map((x) => x.trim()).filter(Boolean);
    const steps = parts.length >= 2
      ? parts.slice(0, 10)
      : ['Setup & Locked Positions', 'Fast Escalation', 'Shaktiman / Climax Twist', 'Rescue & Payoff', 'Shock Reaction', 'Victory Meme Outro'];
    const sfx = ['gasp_break', 'break_whoosh', 'bandook_burst', 'punch_pop', 'shock_sting', 'laugh_break'];
    const memes = ['WAIT... LOOK! 👀', 'HERO MODE ON! ⚡', 'TOTAL CHAOS! 🌪️🔥', 'YOINK!! 💨', 'BRO WHAT?! 😱', 'MISSION COMPLETE 😎🎉'];
    const shayari = AGGRESSIVE_COMEDY_SHAYARIS[Math.floor(Math.random() * AGGRESSIVE_COMEDY_SHAYARIS.length)];

    this.scenes.set(this.recalculateTimeRanges(steps.map((step, idx0) => {
      const idx = idx0 + 1;
      const isShayari = idx === Math.min(3, steps.length);
      return {
        index: idx,
        title: parts.length >= 2 ? step.slice(0, 32) : step,
        timeRange: '',
        durationSeconds: parts.length >= 2 ? 4 : ([3, 3, 5, 3, 4, 4][idx0] ?? 4),
        positionsNote: `Exact locked action (${idx}/${steps.length}): ${parts.length >= 2 ? step : `${step} for ${idea}`}`,
        emotionReaction: 'Aggressive comic punch',
        sfxId: sfx[idx0 % sfx.length],
        memeCaption: memes[idx0 % memes.length],
        voiceLine: isShayari ? shayari : `Dekh bhai ab kya hota hai — ${step}!`,
        googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation. Scene ${idx} of ${steps.length}: ${parts.length >= 2 ? step : `${step} — ${idea}`}. Consistent characters, exact foreground/background positions, ${NO_SPEECH_RULE}.`,
        status: 'prompt-ready' as SceneSlotStatus,
      };
    })));
    this.notice.set(`Built ${steps.length} position-locked prompts (zero human speaking) + aggressive comedy lines & Shayari!`);
  }

  addEmptyScene(): void {
    const nextIdx = this.scenes().length + 1;
    const slot: AnimalSceneSlot = {
      index: nextIdx,
      title: `Extra Scene ${nextIdx}`,
      timeRange: '',
      durationSeconds: 4,
      positionsNote: 'Center frame: locked continuation shot matching previous scene.',
      emotionReaction: 'Comic reaction punch',
      sfxId: 'punch_pop',
      memeCaption: 'WAIT FOR IT! 😂🔥',
      voiceLine: 'Abhi picture baaki hai mere dost!',
      googleFlowPrompt: `Vertical ${this.aspect} 3D Pixar-style cartoon animation, continuation scene ${nextIdx}. Consistent characters and lighting, ${NO_SPEECH_RULE}.`,
      status: 'prompt-ready',
    };
    this.scenes.update((list) => this.recalculateTimeRanges([...list, slot]));
    this.notice.set(`Added Scene ${nextIdx} (1–10s).`);
  }

  removeScene(index: number): void {
    if (this.scenes().length <= 1) return;
    this.scenes.update((list) =>
      this.recalculateTimeRanges(list.filter((s) => s.index !== index).map((s, i) => ({ ...s, index: i + 1 }))),
    );
  }

  statusLabel(s: SceneSlotStatus): string {
    if (s === 'ready') return 'Ready';
    if (s === 'uploading') return 'Uploading…';
    if (s === 'failed') return 'Retry';
    return 'Empty';
  }

  updatePrompt(index: number, value: string): void {
    this.scenes.update((list) => list.map((s) => (s.index === index ? { ...s, googleFlowPrompt: value } : s)));
  }

  updateVoiceLine(index: number, value: string): void {
    this.scenes.update((list) => list.map((s) => (s.index === index ? { ...s, voiceLine: value } : s)));
  }

  updateMemeCaption(index: number, value: string): void {
    this.scenes.update((list) => list.map((s) => (s.index === index ? { ...s, memeCaption: value } : s)));
  }

  injectShayari(): void {
    const shayari = AGGRESSIVE_COMEDY_SHAYARIS[Math.floor(Math.random() * AGGRESSIVE_COMEDY_SHAYARIS.length)];
    const list = this.scenes();
    const targetIdx = list.length >= 3 ? list[2].index : list[0].index;
    this.scenes.update((items) => items.map((s) => (s.index === targetIdx ? { ...s, voiceLine: shayari } : s)));
    this.notice.set(`Updated Scene ${targetIdx} with aggressive comedy Shayari: "${shayari}"`);
  }

  optimizePacing(): void {
    const ideal6 = [3, 3, 5, 3, 4, 4];
    const ideal5 = [3, 4, 4, 4, 4];
    this.scenes.update((list) =>
      this.recalculateTimeRanges(
        list.map((s, i) => ({
          ...s,
          durationSeconds: list.length === 6 ? ideal6[i] : list.length === 5 ? ideal5[i] : Math.max(2, Math.min(8, s.durationSeconds)),
        })),
      ),
    );
    this.notice.set('⚡ Auto-Optimized scene durations for snappy viral pacing!');
  }

  copyScenePrompt(sc: AnimalSceneSlot): void {
    void navigator.clipboard?.writeText(sc.googleFlowPrompt);
    this.copiedId.set(`sc_${sc.index}`);
    setTimeout(() => this.copiedId.set(null), 2000);
  }

  copyAllPrompts(): void {
    const modelLabel = this.flowModel === 'nano-banana-0cr'
      ? 'Nano Banana 2.1 · Image · 0 credits per scene'
      : 'Veo 3.1 Fast · 1–8s Video Clip (Lowest Video Credits)';
    const text = [
      `GOOGLE FLOW BATCH (${modelLabel} · Aspect: ${this.aspect} · STRICTLY NO HUMAN SPEAKING):`,
      '',
      ...this.scenes().map((s) => `Scene ${s.index} (${s.timeRange} - ${s.title}):\n${s.googleFlowPrompt}`),
    ].join('\n\n');
    void navigator.clipboard?.writeText(text);
    this.copiedId.set('all');
    this.notice.set(`Copied ${this.scenes().length} prompts (${modelLabel}, no human speech)! Go to Tab 2 once generated.`);
    setTimeout(() => this.copiedId.set(null), 2500);
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

    leftovers.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (const file of leftovers) {
      const slot = current.find((s) => !usedSlots.has(s.index) && !s.file) ?? current.find((s) => !usedSlots.has(s.index));
      if (!slot) break;
      usedSlots.add(slot.index);
      slot.file = file;
      slot.previewUrl = URL.createObjectURL(file);
      slot.isVideo = file.type.startsWith('video/');
      slot.status = 'ready';
      slot.errorMessage = undefined;
    }

    this.scenes.set(current);
    this.notice.set(`Attached ${usedSlots.size} clip/image file(s)! Adjust timing if needed, then proceed to Tab 3.`);
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

  updateDuration(index: number, rawSeconds: number): void {
    const secs = Math.max(1, Math.min(10, Math.round(Number(rawSeconds) || 4)));
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

  rebuildScene(index: number): void {
    this.scenes.update((list) =>
      list.map((s) => (s.index === index ? { ...s, status: s.file ? 'ready' : 'prompt-ready', errorMessage: undefined } : s)),
    );
    this.notice.set(`Scene ${index} reset.`);
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

  importComedySfx(): void {
    this.busy.set(true);
    this.effects.importSfxPack({ genre: 'comedy' }).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.notice.set(`Imported ${res.imported} Comedy/Bandook/Meme SFX (${res.skipped} already in library).`);
      },
      error: () => {
        this.busy.set(false);
        this.notice.set('Sign in to import SFX into your Effects Library.');
      },
    });
  }

  previewUrl(jobId: string): string {
    return this.api.previewUrl(jobId);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
  }

  async autoBuildAndRenderReel(): Promise<void> {
    if (this.failedChecksCount() > 0) {
      this.notice.set('Please resolve required Pre-Flight Checks before rendering.');
      return;
    }
    const withFiles = this.scenes().filter((s) => !!s.file);

    this.rendering.set(true);
    this.renderJob.set(null);
    this.renderProjectId.set(null);
    this.renderStepIndex.set(1);
    this.renderProgressPercent.set(10);
    this.renderStatus.set(`Stage 1/5: Creating ${this.aspect} project…`);

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

      // Stage 2: Upload Media
      this.renderStepIndex.set(2);
      const uploadedIds: string[] = [];
      const timelineItems: TimelineItem[] = [];
      const sceneStarts: { sc: AnimalSceneSlot; startTime: number }[] = [];
      let t = 0;

      for (let i = 0; i < withFiles.length; i++) {
        const sc = withFiles[i];
        this.renderStatus.set(`Stage 2/5: Uploading scene ${i + 1} of ${withFiles.length} (${sc.title})…`);
        this.renderProgressPercent.set(15 + Math.round(((i + 1) / withFiles.length) * 25));
        this.scenes.update((list) => list.map((x) => (x.index === sc.index ? { ...x, status: 'uploading' } : x)));
        try {
          const asset = await firstValueFrom(this.api.uploadAsset(proj.id, sc.file!));
          uploadedIds.push(asset.id);
          sceneStarts.push({ sc, startTime: t });
          timelineItems.push({
            id: `animal_sc_${sc.index}`,
            type: sc.isVideo ? 'video' : 'image',
            trackId: 'V1',
            startTime: t,
            duration: sc.durationSeconds,
            src: asset.id,
            name: sc.title,
          });
          if (this.autoAddMemes && sc.memeCaption?.trim()) {
            timelineItems.push({
              id: `animal_meme_${sc.index}`,
              type: 'text',
              trackId: 'T1',
              startTime: t + 0.15,
              duration: Math.max(1, sc.durationSeconds - 0.25),
              src: sc.memeCaption.trim(),
              name: `Meme: ${sc.title}`,
              overlay: true,
              textStyle: {
                fontSize: 22,
                color: '#FFE600',
                backgroundColor: '#000000',
                boxOpacity: 0.72,
                outlineColor: '#000000',
                outlineWidth: 2,
                shadow: true,
                position: 'top',
              },
            });
          }
          t += sc.durationSeconds;
          this.scenes.update((list) => list.map((x) => (x.index === sc.index ? { ...x, status: 'ready' } : x)));
        } catch {
          this.scenes.update((list) =>
            list.map((x) => (x.index === sc.index ? { ...x, status: 'failed', errorMessage: 'Upload failed — retry on Tab 2.' } : x)),
          );
        }
      }

      if (uploadedIds.length === 0) {
        this.renderStatus.set('All scene uploads failed. Please retry.');
        return;
      }

      // Stage 3: Generate Realistic Voiceover & Shayari
      this.renderStepIndex.set(3);
      this.renderProgressPercent.set(45);
      const musicTracks: TimedMusicClipBody[] = [];

      if (this.useOurVoiceover && this.selectedVoiceId) {
        for (let i = 0; i < sceneStarts.length; i++) {
          const { sc, startTime } = sceneStarts[i];
          const text = sc.voiceLine?.trim();
          if (!text) continue;
          this.renderStatus.set(`Stage 3/5: Generating realistic voiceover (${i + 1}/${sceneStarts.length})…`);
          this.renderProgressPercent.set(45 + Math.round(((i + 1) / sceneStarts.length) * 15));
          try {
            const voiceAsset = await firstValueFrom(
              this.api.generateVoiceover(proj.id, {
                text,
                voiceId: this.selectedVoiceId,
                rate: 1.08,
                name: `VO Scene ${sc.index}`,
                style: this.voiceTone === 'aggressive-comedy'
                  ? 'aggressive high-energy desi comedy punchline'
                  : 'punchy expressive cartoon comedy',
              }),
            );
            musicTracks.push({
              assetId: voiceAsset.id,
              startSeconds: startTime,
              volume: 1.0,
              isVoiceover: true,
            });
          } catch {
            // Non-blocking: continue even if TTS fails for one scene
          }
        }
      }

      // Stage 4: Sync Sentence-End SFX & Victory Confetti
      this.renderStepIndex.set(4);
      this.renderProgressPercent.set(65);
      this.renderStatus.set('Stage 4/5: Syncing sentence-end comedy SFX & confetti outro…');

      if (this.autoAddMemes && sceneStarts.length > 0) {
        const last = sceneStarts[sceneStarts.length - 1];
        timelineItems.push({
          id: 'animal_outro_confetti',
          type: 'celebration',
          trackId: 'FX1',
          startTime: last.startTime,
          duration: last.sc.durationSeconds,
          src: 'confetti',
          name: 'Victory Confetti',
          celebration: { mode: 'burst', density: 1.2, size: 1, speed: 1.1 },
        });
      }

      if (this.autoAddSfx) {
        try {
          const imported = await firstValueFrom(this.effects.importSfxPack({ genre: 'comedy' }));
          const library = await firstValueFrom(this.effects.list({ category: 'SoundEffect', kind: 'Audio' }, true));
          const pool: EffectClip[] = [...(imported?.items ?? []), ...(library ?? [])];

          if (pool.length > 0) {
            const cache = new Map<string, string>();
            for (let i = 0; i < sceneStarts.length; i++) {
              const { sc, startTime } = sceneStarts[i];
              const words = sc.sfxId.toLowerCase().replace(/[_-]+/g, ' ').split(' ').filter(Boolean);
              const matched =
                pool.find((e) => words.some((w) => `${e.name} ${(e.tags ?? []).join(' ')}`.toLowerCase().includes(w)))
                ?? pool[i % pool.length];

              let sfxAssetId = cache.get(matched.id);
              if (!sfxAssetId) {
                const used = await firstValueFrom(this.effects.use(matched.id, proj.id));
                sfxAssetId = used.asset.id;
                cache.set(matched.id, sfxAssetId);
              }
              const sentenceEndOffset = this.useOurVoiceover && sc.voiceLine?.trim()
                ? Math.min(Math.max(0.4, sc.durationSeconds - 0.7), Math.max(0.8, sc.voiceLine.trim().length / 18))
                : 0;

              musicTracks.push({
                assetId: sfxAssetId,
                startSeconds: Number((startTime + sentenceEndOffset).toFixed(2)),
                volume: 0.95,
              });
            }
          }
        } catch {
          // Non-blocking: continue even if SFX pack skipped
        }
      }

      // Stage 5: Server MP4 Render
      this.renderStepIndex.set(5);
      this.renderProgressPercent.set(75);
      this.renderStatus.set(`Stage 5/5: Rendering ${this.aspect} MP4 (${uploadedIds.length} scenes, ${musicTracks.length} audio tracks)…`);

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
          muteClipAudio: this.muteGoogleFlowAudio,
          backgroundMusicVolume: 0.75,
          musicTracks,
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
        this.renderProgressPercent.set(75 + Math.round((job.progress || 0) * 0.25));
      }

      if (job.status === 'Succeeded') {
        this.renderStepIndex.set(6);
        this.renderProgressPercent.set(100);
        this.renderStatus.set('✅ MP4 Ready! Watch below, download, or open in Video Editor.');
        this.notice.set(`Rendered "${this.customTitle}" successfully!`);
        this.status.notify([`Rendered Action Comedy Reel "${this.customTitle}" (${uploadedIds.length} scenes).`]);
        this.loadGeneratedReels();
      } else {
        this.renderStatus.set(`Render ${job.status}: ${job.errorMessage || 'Check Video Editor for details.'}`);
      }
    } catch {
      this.renderStatus.set('Render pipeline failed. Check backend connection and retry.');
    } finally {
      this.rendering.set(false);
    }
  }
}
