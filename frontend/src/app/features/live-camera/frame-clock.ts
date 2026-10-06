/**
 * Calls back at a steady frame rate, even while this tab is in the background.
 * <p>
 * The stream is drawn by this page, so if drawing stopped whenever the presenter switched
 * tabs, viewers would see a frozen picture. Browsers pause requestAnimationFrame and slow
 * timers to once a second in hidden tabs, but not timers inside a worker - so the ticks come
 * from a tiny worker, with a plain timer as the fallback where workers are unavailable.
 * <p>
 * The clock is self-paced: the next tick is only asked for once the current frame is done,
 * after whatever is left of the frame period. On a machine too slow for the frame rate the
 * picture simply runs slower; ticks never queue up and starve the page.
 */
export class FrameClock {
  private worker: Worker | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private readonly period: number;

  constructor(fps: number, private readonly tick: () => void) {
    this.period = 1000 / fps;
  }

  start(): void {
    this.stop();
    this.running = true;
    try {
      const source = 'onmessage=(e)=>{setTimeout(()=>postMessage(0),e.data);};';
      const url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
      try {
        this.worker = new Worker(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      this.worker.onmessage = () => this.run();
      this.worker.postMessage(0);
    } catch {
      this.worker = null;
      this.timer = setTimeout(() => this.run(), 0);
    }
  }

  stop(): void {
    this.running = false;
    this.worker?.terminate();
    this.worker = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private run(): void {
    if (!this.running) return;
    const started = performance.now();
    try {
      this.tick();
    } finally {
      const wait = Math.max(0, Math.round(this.period - (performance.now() - started)));
      if (this.worker) this.worker.postMessage(wait);
      else if (this.running) this.timer = setTimeout(() => this.run(), wait);
    }
  }
}
