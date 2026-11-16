import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  FirstLivePlaybook,
  LiveQuizPublicView,
  LiveQuizService,
  StarterQuizQuestion,
} from '../../core/services/live-quiz.service';
import { LocaleService } from '../../core/services/locale.service';

@Component({
  selector: 'app-live-quiz-panel',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  template: `
    <section class="card lq-card">
      <div class="lq-head">
        <div>
          <h3 style="margin: 0">🏆 Live Stream Quiz &amp; First Live Playbook</h3>
          <p class="muted lq-sub">
            {{ isHindi() ? 'लाइव चैट + प्रतयोगिता जीरो-लॉग चैनल सत्यापन से रैंडम (CSPRNG) विजेता चुनें' : 'Pick cryptographically random verified winners across YouTube Live Chat + Pratiyogita Zero-Log verification' }}
          </p>
        </div>
        <div class="lq-tabs">
          <button type="button" class="secondary lq-btn-sm" [class.active]="tab() === 'quiz'" (click)="tab.set('quiz')">🎯 Quiz Host</button>
          <button type="button" class="secondary lq-btn-sm" [class.active]="tab() === 'playbook'" (click)="tab.set('playbook')">🚀 First Live Plan</button>
          <a routerLink="/live/quiz-overlay" target="_blank" rel="noopener" class="secondary lq-btn-sm lq-link-btn">📺 OBS Overlay ↗</a>
        </div>
      </div>

      @if (error(); as err) {
        <div class="lq-error" role="alert">{{ err }}</div>
      }
      @if (notice(); as msg) {
        <div class="lq-notice" role="status">{{ msg }}</div>
      }

      @if (tab() === 'playbook') {
        @if (playbook(); as pb) {
          <div class="lq-playbook">
            <div class="lq-pb-top">
              <div>
                <strong>{{ isHindi() ? pb.planTitleHi : pb.planTitle }}</strong>
                <div class="muted">{{ pb.totalMinutes }} min · Pratiyogita URL: <code>{{ pb.pratiyogitaWinnersUrl }}</code></div>
              </div>
              <button type="button" class="lq-primary-btn" (click)="applyPlaybookPreset()">
                ✨ Fill Launch Stream Title
              </button>
            </div>

            <div class="lq-segments">
              @for (seg of pb.segments; track seg.order) {
                <div class="lq-seg" [class.lq-seg-quiz]="seg.triggersQuizRound">
                  <div class="lq-seg-time">{{ seg.timeRange }} · {{ seg.channel }}</div>
                  <strong>{{ seg.order }}. {{ isHindi() ? seg.titleHi : seg.title }}</strong>
                  <p class="muted">{{ isHindi() ? seg.actionCueHi : seg.actionCue }}</p>
                </div>
              }
            </div>

            <div class="lq-starters">
              <strong>🎁 1-Click Starter Quiz Questions (Hindi + English)</strong>
              <div class="lq-starter-list">
                @for (sq of pb.starterQuestions; track sq.id) {
                  <button type="button" class="secondary lq-starter-btn" (click)="loadStarterQuestion(sq)">
                    <span>{{ isHindi() ? sq.questionHi : sq.question }}</span>
                    <span class="lq-pill">Load Round →</span>
                  </button>
                }
              </div>
            </div>

            <details class="lq-checklist">
              <summary>✅ Pre-Flight Checklist ({{ pb.preFlightChecklist.length }} steps)</summary>
              <ul>
                @for (step of pb.preFlightChecklist; track step) {
                  <li>{{ step }}</li>
                }
              </ul>
            </details>
          </div>
        } @else {
          <p class="muted">Loading Keshav First Live Playbook…</p>
        }
      } @else {
        <div class="lq-grid">
          <!-- Create / Launch Round -->
          <div class="lq-form">
            <div class="lq-form-row">
              <label>
                Question (English)
                <input type="text" [(ngModel)]="draft.question" placeholder="Ask viewers a live trivia question..." />
              </label>
              <label>
                प्रश्न (हिन्दी)
                <input type="text" [(ngModel)]="draft.questionHi" placeholder="दर्शकों के लिए हिंदी में प्रश्न..." />
              </label>
            </div>

            <div class="lq-options-grid">
              @for (opt of draft.options; track opt.key) {
                <div class="lq-opt-edit">
                  <span class="lq-opt-badge">{{ opt.key }}</span>
                  <input type="text" [(ngModel)]="opt.text" [placeholder]="'Option ' + opt.key + ' (EN)'" />
                  <input type="text" [(ngModel)]="opt.textHi" [placeholder]="'विकल्प ' + opt.key + ' (HI)'" />
                </div>
              }
            </div>

            <div class="lq-form-row lq-meta-row">
              <label>
                Correct Option
                <select [(ngModel)]="draft.correctOptionKey">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </label>
              <label>
                Channel Handle
                <input type="text" [(ngModel)]="draft.streamChannelHandle" placeholder="@keshavsinghworld" />
              </label>
              <label>
                Broadcast / Video ID
                <input type="text" [(ngModel)]="draft.broadcastId" placeholder="11-char YT Live Video ID" />
              </label>
              <label>
                Quiz UI Language
                <select [(ngModel)]="draft.language">
                  <option value="hi">Hindi + English (HI Default)</option>
                  <option value="en">English + Hindi (EN Default)</option>
                </select>
              </label>
            </div>

            <div class="lq-actions-bar">
              <button type="button" class="lq-primary-btn" (click)="launchRound()" [disabled]="busy() || !draft.question.trim()">
                {{ busy() ? 'Starting…' : '🚀 Launch Quiz Round Live' }}
              </button>
              @if (playbook(); as pb) {
                <button type="button" class="secondary" (click)="loadStarterQuestion(pb.starterQuestions[0])">
                  ⚡ Fill Sample Q1
                </button>
              }
            </div>
          </div>

          <!-- Active Round Control & Winner Reveal -->
          <div class="lq-live-panel">
            @if (activeQuiz(); as q) {
              <div class="lq-status-bar">
                <span class="lq-badge" [attr.data-state]="q.status">{{ q.status }}</span>
                <span>Entrants: <strong>{{ q.totalEntrants }}</strong> (Chat: {{ q.chatEntrantCount }} · Web: {{ q.webEntrantCount }})</span>
                <span>Correct: <strong>{{ q.eligibleEntrants }}</strong></span>
              </div>

              <div class="lq-active-q">
                <strong>{{ q.questionHi || q.question }}</strong>
                <div class="muted" style="font-size: 0.78rem">{{ q.question }}</div>
              </div>

              <div class="lq-controls">
                <button type="button" class="secondary" (click)="pollChat()" [disabled]="busy() || q.status !== 'Open'"
                        title="Reads active YouTube Live Chat messages for !ans A/B/C/D">
                  💬 Poll YT Live Chat
                </button>
                <button type="button" class="secondary" (click)="refreshActive()" [disabled]="busy()">↻ Refresh Web Entries</button>
                <button type="button" class="secondary" (click)="addTestEntrant()" [disabled]="busy() || q.status !== 'Open'"
                        title="Add a rehearsal entrant to dry-run winner draw offline">
                  🧪 Dry-Run Entry
                </button>
                <button type="button" class="lq-draw-btn" (click)="drawWinner()" [disabled]="busy() || q.eligibleEntrants === 0">
                  🎲 Draw Winner (CSPRNG)
                </button>
              </div>

              @if (q.winner; as w) {
                <div class="lq-winner-card">
                  <div class="lq-win-title">🏆 WINNER ANNOUNCED &amp; ARCHIVED TO PRATIYOGITA</div>
                  <div class="lq-win-name">{{ w.winnerChannelTitle }} {{ w.winnerChannelHandle ? '(' + w.winnerChannelHandle + ')' : '' }}</div>
                  <div class="muted" style="font-size: 0.8rem">
                    {{ w.prizeTitle }} · {{ w.eligibleEntrants }} eligible / {{ w.totalEntrants }} total · {{ w.selectedAtUtc | date: 'shortTime' }}
                  </div>
                </div>
              }

              @if (q.recentEntrants.length > 0) {
                <ul class="lq-entrants">
                  @for (e of q.recentEntrants; track e.channelTitle + e.submittedAtUtc) {
                    <li>
                      <span><strong>{{ e.channelTitle }}</strong> ({{ e.source === 'youtube_chat' ? 'Chat' : (e.source === 'pratiyogita_web' ? 'Pratiyogita' : 'Test') }})</span>
                      <span class="lq-opt-tag">Option {{ e.answerOption }}</span>
                    </li>
                  }
                </ul>
              }
            } @else {
              <div class="lq-empty">
                <p class="muted">No active quiz round right now. Launch one on the left or pick a starter from <strong>First Live Plan</strong>.</p>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .lq-card { display: grid; gap: 0.9rem; margin-top: 1.15rem; }
    .lq-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap; }
    .lq-sub { margin: 0.2rem 0 0; font-size: 0.82rem; }
    .lq-tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
    .lq-btn-sm { padding: 0.35rem 0.7rem; font-size: 0.8rem; }
    .lq-btn-sm.active { border-color: var(--brand); background: rgba(124, 156, 255, 0.18); }
    .lq-link-btn { text-decoration: none; border: 1px solid var(--border); border-radius: 8px; }
    .lq-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 1rem; align-items: start; }
    @media (max-width: 900px) { .lq-grid { grid-template-columns: 1fr; } }
    .lq-form, .lq-live-panel { display: grid; gap: 0.7rem; }
    .lq-form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
    .lq-meta-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    @media (max-width: 720px) { .lq-form-row, .lq-meta-row { grid-template-columns: 1fr; } }
    .lq-form-row label { display: grid; gap: 0.25rem; font-size: 0.8rem; font-weight: 600; }
    .lq-options-grid { display: grid; gap: 0.45rem; }
    .lq-opt-edit { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr); gap: 0.45rem; align-items: center; }
    .lq-opt-badge { width: 1.6rem; height: 1.6rem; border-radius: 6px; display: grid; place-items: center; background: var(--brand); color: #fff; font-weight: 800; font-size: 0.78rem; }
    .lq-actions-bar, .lq-controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .lq-primary-btn, .lq-draw-btn {
      background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; border: 0; border-radius: 8px;
      padding: 0.45rem 0.9rem; font-weight: 700; cursor: pointer; font-size: 0.84rem;
    }
    .lq-draw-btn { background: linear-gradient(135deg, #d97706, #f59e0b); color: #111827; }
    .lq-primary-btn:disabled, .lq-draw-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .lq-status-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; font-size: 0.82rem; }
    .lq-badge { padding: 0.15rem 0.55rem; border-radius: 999px; font-weight: 700; background: rgba(34, 197, 94, 0.2); color: #86efac; }
    .lq-badge[data-state='Drawn'] { background: rgba(245, 158, 11, 0.25); color: #fde047; }
    .lq-winner-card { padding: 0.85rem; border-radius: 10px; border: 1px solid #f59e0b; background: rgba(245, 158, 11, 0.12); display: grid; gap: 0.25rem; }
    .lq-win-title { font-size: 0.74rem; font-weight: 800; color: #fbbf24; }
    .lq-win-name { font-size: 1.05rem; font-weight: 800; }
    .lq-entrants { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.3rem; max-height: 180px; overflow: auto; font-size: 0.8rem; }
    .lq-entrants li { display: flex; justify-content: space-between; padding: 0.35rem 0.55rem; border-radius: 6px; background: rgba(255, 255, 255, 0.04); }
    .lq-opt-tag { font-weight: 700; color: var(--brand); }
    .lq-segments { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.65rem; }
    .lq-seg { padding: 0.65rem; border-radius: 10px; border: 1px solid var(--border); font-size: 0.82rem; display: grid; gap: 0.2rem; }
    .lq-seg-quiz { border-color: rgba(245, 158, 11, 0.55); }
    .lq-seg-time { font-size: 0.74rem; font-weight: 700; color: var(--brand); }
    .lq-playbook { display: grid; gap: 0.9rem; }
    .lq-pb-top { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .lq-starter-list { display: grid; gap: 0.4rem; margin-top: 0.4rem; }
    .lq-starter-btn { display: flex; justify-content: space-between; align-items: center; text-align: left; gap: 0.5rem; padding: 0.45rem 0.7rem; font-size: 0.82rem; }
    .lq-error { padding: 0.55rem 0.75rem; border-radius: 8px; background: rgba(239, 68, 68, 0.16); border: 1px solid #ef4444; color: #fca5a5; font-size: 0.84rem; }
    .lq-notice { padding: 0.55rem 0.75rem; border-radius: 8px; background: rgba(34, 197, 94, 0.14); border: 1px solid #22c55e; color: #bbf7d0; font-size: 0.84rem; }
  `],
})
export class LiveQuizPanelComponent {
  private readonly quizService = inject(LiveQuizService);
  private readonly i18n = inject(LocaleService);

  readonly broadcastId = input<string | null | undefined>(null);
  readonly youTubeChannelId = input<string | null | undefined>(null);
  readonly applyLaunchPreset = output<{ title: string; label: string }>();

  readonly tab = signal<'quiz' | 'playbook'>('quiz');
  readonly playbook = signal<FirstLivePlaybook | null>(null);
  readonly activeQuiz = signal<LiveQuizPublicView | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  draft = {
    question: 'Which sacred mantra did Devrishi Narada teach young Bhakta Dhruva?',
    questionHi: 'देवर्षि नारद ने बालक भक्त ध्रुव को किस महामंत्र की दीक्षा दी थी?',
    options: [
      { key: 'A', text: 'Om Namah Shivaya', textHi: 'ॐ नमः शिवाय' },
      { key: 'B', text: 'Om Namo Bhagavate Vasudevaya', textHi: 'ॐ नमो भगवते वासुदेवाय' },
      { key: 'C', text: 'Gayatri Mantra', textHi: 'गायत्री मंत्र' },
      { key: 'D', text: 'Om Namo Narayanaya', textHi: 'ॐ नमो नारायणाय' },
    ],
    correctOptionKey: 'B',
    streamChannelHandle: '@keshavsinghworld',
    broadcastId: '',
    prizeTitle: 'Pratiyogita Verified Winner Badge & Live Shoutout',
    language: 'hi',
  };

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    void this.loadInitial();
    this.pollTimer = setInterval(() => void this.refreshActive(), 6000);
    inject(DestroyRef).onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
    });
  }

  isHindi(): boolean {
    return this.i18n.locale() === 'hi';
  }

  private async loadInitial(): Promise<void> {
    try {
      const [pb, active] = await Promise.all([
        firstValueFrom(this.quizService.getPlaybook()),
        firstValueFrom(this.quizService.getActive(null, true)),
      ]);
      this.playbook.set(pb);
      this.activeQuiz.set(active);
    } catch {
      // Non-fatal on initial mount.
    }
  }

  async refreshActive(): Promise<void> {
    try {
      const active = await firstValueFrom(this.quizService.getActive(null, true));
      if (active) this.activeQuiz.set(active);
    } catch {
      // Keep UI quiet during background refresh.
    }
  }

  loadStarterQuestion(sq: StarterQuizQuestion): void {
    this.draft.question = sq.question;
    this.draft.questionHi = sq.questionHi;
    this.draft.options = sq.options.map((o) => ({ key: o.key, text: o.text, textHi: o.textHi ?? '' }));
    this.draft.correctOptionKey = sq.correctOptionKey;
    this.draft.prizeTitle = sq.prizeTitle;
    this.tab.set('quiz');
    this.notice.set('Loaded starter question into Quiz Host.');
  }

  applyPlaybookPreset(): void {
    const pb = this.playbook();
    if (!pb) return;
    this.applyLaunchPreset.emit({
      title: this.isHindi() ? pb.suggestedBroadcastTitleHi : pb.suggestedBroadcastTitle,
      label: 'Keshav Network Grand First Live',
    });
    this.notice.set('Applied Launch Live title to Step 2 stream label!');
  }

  async launchRound(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    try {
      const created = await firstValueFrom(
        this.quizService.create({
          question: this.draft.question,
          questionHi: this.draft.questionHi,
          options: this.draft.options,
          correctOptionKey: this.draft.correctOptionKey,
          prizeTitle: this.draft.prizeTitle,
          streamChannelHandle: this.draft.streamChannelHandle,
          broadcastId: this.draft.broadcastId.trim() || this.broadcastId() || null,
          youTubeConnectionChannelId: this.youTubeChannelId() || null,
          language: this.draft.language,
          closePreviousOpen: true,
        })
      );
      this.activeQuiz.set(created);
      this.notice.set('Quiz round is LIVE! Overlay and pratiyogita.keshavsingh.in/winners updated.');
    } catch (err: unknown) {
      this.error.set(this.readError(err, 'Could not launch quiz round.'));
    } finally {
      this.busy.set(false);
    }
  }

  async pollChat(): Promise<void> {
    const q = this.activeQuiz();
    if (!q) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.quizService.pollChat(
          q.id,
          this.draft.broadcastId.trim() || this.broadcastId() || q.broadcastId,
          this.youTubeChannelId()
        )
      );
      this.activeQuiz.set(res.session);
      this.notice.set(`Scanned ${res.messagesScanned} chat messages; added ${res.newEntriesAdded} new verified answer(s).`);
    } catch (err: unknown) {
      this.error.set(this.readError(err, 'Could not poll YouTube Live Chat. Check broadcast ID and connected channel.'));
    } finally {
      this.busy.set(false);
    }
  }

  async addTestEntrant(): Promise<void> {
    const q = this.activeQuiz();
    if (!q) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const n = q.totalEntrants + 1;
      const updated = await firstValueFrom(
        this.quizService.addRehearsalEntrant(q.id, {
          channelTitle: `Test Viewer #${n}`,
          channelHandle: `@testviewer${n}`,
          youTubeChannelId: `UC_REHEARSAL_${n}`,
          answerOption: this.draft.correctOptionKey,
        })
      );
      this.activeQuiz.set(updated);
    } catch (err: unknown) {
      this.error.set(this.readError(err, 'Could not add rehearsal entrant.'));
    } finally {
      this.busy.set(false);
    }
  }

  async drawWinner(): Promise<void> {
    const q = this.activeQuiz();
    if (!q) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const drawn = await firstValueFrom(this.quizService.drawWinner(q.id));
      this.activeQuiz.set(drawn);
      if (drawn.winner) {
        this.notice.set(`Winner picked: ${drawn.winner.winnerChannelTitle}! Revealed on overlay & archived to Pratiyogita.`);
      }
    } catch (err: unknown) {
      this.error.set(this.readError(err, 'No eligible correct entrants found yet.'));
    } finally {
      this.busy.set(false);
    }
  }

  private readError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const e = (err as { error?: { message?: string } }).error;
      if (e?.message) return e.message;
    }
    return fallback;
  }
}
