import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LiveQuizPublicView, LiveQuizService } from '../../core/services/live-quiz.service';

/**
 * Clean broadcast-ready OBS / screen-share overlay displaying the active Live Quiz round,
 * A/B/C/D options, Pratiyogita Zero-Log Verify link, live entrant pool, and CSPRNG Winner Reveal.
 * Open at /live/quiz-overlay?sessionId=...&transparent=1
 */
@Component({
  selector: 'app-live-quiz-overlay',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="ov-stage" [class.ov-transparent]="transparent()">
      @if (quiz(); as q) {
        <div class="ov-card" [class.ov-drawn]="q.status === 'Drawn'">
          <header class="ov-head">
            <span class="ov-live-pill">🔴 LIVE QUIZ · {{ q.streamChannelHandle || '@keshavsinghworld' }}</span>
            <span class="ov-status">{{ q.status === 'Drawn' ? '🏆 WINNER SELECTED' : (q.status === 'Closed' ? '⏳ DRAWING SOON' : '🟢 ACCEPTING ANSWERS') }}</span>
          </header>

          @if (q.winner; as w) {
            <section class="ov-winner-reveal" aria-live="polite">
              <div class="ov-confetti-label">🎉 CONGRATULATIONS · बधाई हो 🎉</div>
              <div class="ov-winner-row">
                @if (w.winnerThumbnailUrl) {
                  <img [src]="w.winnerThumbnailUrl" [alt]="w.winnerChannelTitle" class="ov-avatar" />
                } @else {
                  <div class="ov-avatar ov-avatar-fallback">{{ w.winnerChannelTitle.charAt(0).toUpperCase() }}</div>
                }
                <div class="ov-winner-meta">
                  <h2>{{ w.winnerChannelTitle }}</h2>
                  @if (w.winnerChannelHandle) { <div class="ov-handle">{{ w.winnerChannelHandle }}</div> }
                  <div class="ov-prize">🏅 {{ w.prizeTitle }}</div>
                </div>
              </div>
              <div class="ov-reveal-foot">
                @if (q.revealedCorrectOptionKey) {
                  <span>✅ Answer: <strong>Option {{ q.revealedCorrectOptionKey }}</strong></span>
                }
                <span>🎲 {{ w.drawAlgorithm }} · {{ w.eligibleEntrants }} correct / {{ w.totalEntrants }} verified</span>
                <span>📅 {{ w.selectedAtUtc | date: 'mediumTime' }}</span>
              </div>
            </section>
          } @else {
            <section class="ov-question-block">
              <h1 class="ov-q-primary">{{ q.language === 'hi' && q.questionHi ? q.questionHi : q.question }}</h1>
              @if (q.language === 'hi' && q.questionHi && q.question) {
                <p class="ov-q-sub">{{ q.question }}</p>
              } @else if (q.questionHi && q.language !== 'hi') {
                <p class="ov-q-sub">{{ q.questionHi }}</p>
              }

              <div class="ov-options">
                @for (opt of q.options; track opt.key) {
                  <div class="ov-opt" [class.ov-opt-correct]="q.revealedCorrectOptionKey === opt.key">
                    <span class="ov-opt-key">{{ opt.key }}</span>
                    <span class="ov-opt-text">
                      <strong>{{ q.language === 'hi' && opt.textHi ? opt.textHi : opt.text }}</strong>
                      @if (q.language === 'hi' && opt.textHi && opt.text && opt.textHi !== opt.text) {
                        <small>{{ opt.text }}</small>
                      }
                    </span>
                  </div>
                }
              </div>
            </section>
          }

          <footer class="ov-footer">
            <div class="ov-how">
              <span>💬 Live Chat: <code>!ans A / B / C / D</code></span>
              <span>🛡️ Verify Channel (Zero-Log): <strong>pratiyogita.keshavsingh.in/winners</strong></span>
            </div>
            <div class="ov-counts">
              <span>Chat: <strong>{{ q.chatEntrantCount }}</strong></span>
              <span>Web: <strong>{{ q.webEntrantCount }}</strong></span>
              <span>Total: <strong>{{ q.totalEntrants }}</strong></span>
            </div>
          </footer>
        </div>
      } @else {
        <div class="ov-card ov-idle">
          <span class="ov-live-pill">🏆 KESHAV NETWORK LIVE QUIZ</span>
          <h2>Waiting for host to launch the next quiz round…</h2>
          <p>Past &amp; live winners archive: <strong>https://pratiyogita.keshavsingh.in/winners</strong></p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .ov-stage {
      min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
      background: radial-gradient(circle at top, #172554 0%, #090d1a 70%);
      color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;
    }
    .ov-stage.ov-transparent { background: transparent; }
    .ov-card {
      width: min(880px, 100%); border-radius: 20px; padding: 1.5rem 1.75rem;
      background: rgba(15, 23, 42, 0.94); border: 2px solid rgba(99, 102, 241, 0.55);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65); display: grid; gap: 1rem;
    }
    .ov-card.ov-drawn { border-color: #f59e0b; box-shadow: 0 0 48px rgba(245, 158, 11, 0.35); }
    .ov-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .ov-live-pill {
      padding: 0.3rem 0.85rem; border-radius: 999px; font-weight: 800; font-size: 0.82rem;
      background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; letter-spacing: 0.03em;
    }
    .ov-status { font-size: 0.82rem; font-weight: 700; color: #fde68a; }
    .ov-q-primary { margin: 0; font-size: clamp(1.3rem, 2.5vw, 1.85rem); line-height: 1.3; }
    .ov-q-sub { margin: 0.3rem 0 0; color: #cbd5e1; font-size: 0.98rem; }
    .ov-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 1rem; }
    @media (max-width: 640px) { .ov-options { grid-template-columns: 1fr; } }
    .ov-opt {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.95rem;
      border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .ov-opt.ov-opt-correct { border-color: #22c55e; background: rgba(22, 163, 74, 0.25); }
    .ov-opt-key {
      width: 2rem; height: 2rem; border-radius: 8px; display: grid; place-items: center;
      font-weight: 800; background: #4f46e5; color: #fff; flex-shrink: 0;
    }
    .ov-opt-text { display: grid; gap: 0.1rem; }
    .ov-opt-text small { color: #94a3b8; font-size: 0.78rem; }
    .ov-winner-reveal {
      padding: 1.25rem; border-radius: 16px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(79, 70, 229, 0.22));
      border: 1px solid rgba(245, 158, 11, 0.65); display: grid; gap: 1rem;
    }
    .ov-confetti-label { text-align: center; font-weight: 800; color: #fde047; letter-spacing: 0.05em; }
    .ov-winner-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .ov-avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid #fbbf24; }
    .ov-avatar-fallback { display: grid; place-items: center; font-size: 1.9rem; font-weight: 800; background: #f59e0b; color: #111827; }
    .ov-winner-meta h2 { margin: 0; font-size: 1.6rem; color: #fff; }
    .ov-handle { color: #93c5fd; font-weight: 600; font-size: 0.95rem; }
    .ov-prize { margin-top: 0.25rem; color: #fde68a; font-weight: 700; }
    .ov-reveal-foot { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; font-size: 0.84rem; color: #e2e8f0; }
    .ov-footer {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;
      padding-top: 0.75rem; border-top: 1px solid rgba(148, 163, 184, 0.22); font-size: 0.84rem; color: #cbd5e1;
    }
    .ov-how { display: flex; flex-wrap: wrap; gap: 1rem; }
    .ov-counts { display: flex; gap: 0.9rem; font-variant-numeric: tabular-nums; }
    code { background: rgba(99, 102, 241, 0.25); padding: 0.1rem 0.4rem; border-radius: 6px; color: #e0e7ff; }
    .ov-idle { text-align: center; padding: 2.5rem 1.5rem; }
  `],
})
export class LiveQuizOverlayComponent {
  private readonly quizService = inject(LiveQuizService);
  private readonly route = inject(ActivatedRoute);

  readonly quiz = signal<LiveQuizPublicView | null>(null);
  readonly transparent = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string | null = null;

  constructor() {
    const qp = this.route.snapshot.queryParamMap;
    this.sessionId = qp.get('sessionId');
    this.transparent.set(qp.get('transparent') === '1');

    void this.poll();
    this.timer = setInterval(() => void this.poll(), 3000);
    inject(DestroyRef).onDestroy(() => {
      if (this.timer) clearInterval(this.timer);
    });
  }

  private async poll(): Promise<void> {
    try {
      const data = await firstValueFrom(this.quizService.getActive(this.sessionId, true));
      this.quiz.set(data);
    } catch {
      // Keep last overlay frame on temporary network blip.
    }
  }
}
