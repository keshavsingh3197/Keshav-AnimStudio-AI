import {
  AfterViewInit,
  Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../services/studio-state.service';
import { TimelineItem } from '../../../../core/models/api.models';
import { ClipRow, JunctionView, MusicTrackRow } from '../../models/clip-studio.models';

@Component({
  selector: 'app-timeline-dock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timeline-dock.component.html',
  styleUrls: ['./timeline-dock.component.css'],
})
export class TimelineDockComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly state = inject(StudioStateService);

  /**
   * Where to draw the insert caret, in seconds. It sits on the START of the clip the caret
   * points at, or at the very end of the cut when the caret is past the last clip.
   */
  readonly insertCaretSeconds = computed<number>(() => {
    const schedule = this.state.clipSchedule();
    const at = this.state.effectiveInsertIndex();
    if (schedule.length === 0) return 0;
    if (at >= schedule.length) return schedule[schedule.length - 1].endSeconds;
    return schedule[at].startSeconds;
  });

  @ViewChild('playheadNeedle') playheadNeedleRef?: ElementRef<HTMLElement>;
  @ViewChild('timelineArea') timelineAreaRef?: ElementRef<HTMLElement>;
  @ViewChild('timelineInner') timelineInnerRef?: ElementRef<HTMLElement>;
  @ViewChild('scrollbarTrack') scrollbarTrackRef?: ElementRef<HTMLElement>;

  readonly trackHeaderWidth = 104;

  /** Voice and music get their own rows so a music bed never sits on top of the narration. */
  readonly audioLanes = [
    {
      id: 'A1', label: 'Voice', clipColor: 'var(--ok, #10b981)',
      placeholder: 'Drop voice-over audio here · Voiceover panel lines land here',
      desc: 'Voiceover narration and dialogue lines',
    },
    {
      id: 'A2', label: 'Music', clipColor: '#0ea5e9',
      placeholder: 'Drop music or sound effects here · Click to open Audio tab',
      desc: 'Background score and sound effects, mixed under the voice',
    },
  ] as const;

  // Custom Horizontal Scrollbar State
  readonly scrollThumbWidth = signal<number>(80);
  readonly scrollThumbLeft = signal<number>(0);
  readonly isCustomScrollDragging = signal<boolean>(false);
  private scrollbarDragStart: { clientX: number; scrollLeft: number } | null = null;
  private laneDownPos: { x: number; y: number } | null = null;

  // Scrubbing & Dragging Pointer State
  readonly isScrubbing = signal<boolean>(false);
  readonly addTrackDialogOpen = signal<boolean>(false);
  private rafId: number | null = null;
  private resizeObserver?: ResizeObserver;

  private itemDrag: { itemId: string; startClientX: number; origStartTime: number; duration: number; trackId: string } | null = null;
  private itemTrim: { itemId: string; edge: 'left' | 'right'; startClientX: number; origStartTime: number; origDuration: number; origTrimStart: number } | null = null;
  private musicDrag: { key: string; startClientX: number; startSeconds: number } | null = null;
  private musicTrim: { key: string; edge: 'start' | 'end'; startClientX: number; startValue: number } | null = null;

  private readonly syncScrollbarEffect = effect(() => {
    this.state.timelineSeconds();
    this.state.pxPerSecond();
    setTimeout(() => this.updateScrollbarMetrics(), 40);
  });

  ngOnInit(): void {
    this.startPlayheadRaf();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.fitTimeline();
      this.updateScrollbarMetrics();
    }, 150);

    const area = this.timelineAreaRef?.nativeElement;
    if (area && typeof ResizeObserver !== 'undefined') {
      let initialFitDone = false;
      this.resizeObserver = new ResizeObserver(() => {
        if (!initialFitDone) {
          initialFitDone = true;
          this.fitTimeline();
        }
        this.updateScrollbarMetrics();
      });
      this.resizeObserver.observe(area);
    }
  }

  openAddTrackDialog(event?: Event): void {
    event?.stopPropagation();
    this.addTrackDialogOpen.set(true);
  }

  closeAddTrackDialog(): void {
    this.addTrackDialogOpen.set(false);
  }

  toggleTrack(trackId: string): void {
    if (trackId === 'TXT1') {
      if (this.state.showTxtTrack()) {
        this.state.hideTrack('TXT1');
      } else {
        this.state.showTrackManually('TXT1');
      }
    } else if (trackId === 'IMG1') {
      if (this.state.showImgTrack()) {
        this.state.hideTrack('IMG1');
      } else {
        this.state.showTrackManually('IMG1');
      }
    } else if (trackId === 'V2') {
      if (this.state.showV2Track()) {
        this.state.hideTrack('V2');
      } else {
        this.state.showTrackManually('V2');
      }
    } else if (trackId === 'A1' || trackId === 'A2') {
      const shown = trackId === 'A1' ? this.state.showA1Track() : this.state.showA2Track();
      if (shown) {
        this.state.hideTrack(trackId);
      } else {
        this.state.showTrackManually(trackId);
      }
    }
  }

  addTrack(trackId: string): void {
    this.state.showTrackManually(trackId);
    this.closeAddTrackDialog();
  }

  addVideoClipsToTimeline(): void {
    this.state.activeCategory.set('video');
    this.closeAddTrackDialog();
    this.state.status.notify(['Select or drag video clips from the Media Library into V1 or V2.']);
  }

  onTextTrackClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.tl-clip') || target.closest('.tl-item-remove') || target.closest('.tl-trim-handle')) return;

    // Deselect any timeline selection and seek playhead to clicked spot
    this.state.clearAllSelections();
    const lane = event.currentTarget as HTMLElement;
    const rect = lane.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const time = Math.max(0, this.state.pxToSeconds(clickX));
    this.state.seekTo(time);
  }

  onRemoveItemClick(event: MouseEvent | PointerEvent, itemId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.removeTimelineItem(itemId);
  }

  onRemoveMusicClick(event: MouseEvent | PointerEvent, key: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.removeMusicTrack(key);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.addTrackDialogOpen()) {
      this.closeAddTrackDialog();
    } else if (this.state.hasAnySelection()) {
      this.state.clearAllSelections();
    }
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  // Guardrail 2: Isolated 60fps playhead translation RAF loop
  /**
   * Brings a clip into view when the selection is driven from the keyboard. Shift+Arrow can
   * walk the selection past the edge of the viewport, and a selection you cannot see is
   * indistinguishable from one that did not happen.
   */
  private readonly scrollToSelection = effect(() => {
    const request = this.state.timelineScrollRequest();
    if (!request) return;

    const area = this.timelineAreaRef?.nativeElement;
    if (!area) return;

    const px = this.trackHeaderWidth + this.state.secondsToPx(request.seconds);
    const margin = 120;
    if (px > area.scrollLeft + area.clientWidth - margin) {
      area.scrollLeft = px - area.clientWidth + margin;
    } else if (px < area.scrollLeft + this.trackHeaderWidth + margin) {
      area.scrollLeft = Math.max(0, px - this.trackHeaderWidth - margin);
    }
  });

  private startPlayheadRaf(): void {
    const loop = () => {
      const el = this.playheadNeedleRef?.nativeElement;
      if (el && !this.isScrubbing()) {
        const time = this.state.getCurrentTimeExact();
        const px = this.trackHeaderWidth + this.state.secondsToPx(time);
        el.style.left = `${px}px`;

        // Keep playhead within view during playback
        if (this.state.isPlaying()) {
          const area = this.timelineAreaRef?.nativeElement;
          if (area) {
            const scrollLeft = area.scrollLeft;
            const clientWidth = area.clientWidth;
            if (px > scrollLeft + clientWidth - 60) {
              area.scrollLeft = px - clientWidth + 120;
            } else if (px < scrollLeft + this.trackHeaderWidth) {
              area.scrollLeft = Math.max(0, px - this.trackHeaderWidth);
            }
          }
        }
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  fitTimeline(): void {
    const width = this.timelineAreaRef?.nativeElement.clientWidth ?? 800;
    this.state.fitTimelineToScreen(width);
    setTimeout(() => this.updateScrollbarMetrics(), 50);
  }

  // Guardrail 4: Dropzone for draggingAsset Contract
  onTrackDrop(trackId: string, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.snapLineLeftPx.set(null);

    const el = this.timelineInnerRef?.nativeElement;
    const rect = el ? el.getBoundingClientRect() : { left: 0 };
    const dropX = Math.max(0, event.clientX - rect.left - this.trackHeaderWidth);
    let dropTime = dropX / this.state.pxPerSecond();
    dropTime = this.state.applySnap(dropTime);

    const dragging = this.state.draggingAsset();
    if (dragging) {
      this.state.addAssetToTrack(trackId, dragging, dropTime);
      this.state.draggingAsset.set(null);
      return;
    }

    const clipId = event.dataTransfer?.getData('text/plain') || event.dataTransfer?.getData('application/json');
    if (clipId) {
      const row = this.state.rows().find((r) => r.clip.id === clipId) || this.state.allMediaRows().find((r) => r.clip.id === clipId);
      if (row) {
        this.state.addAssetToTrack(trackId, row, dropTime);
      }
    }
  }

  onTimelineWheel(event: WheelEvent): void {
    const area = this.timelineAreaRef?.nativeElement;
    if (!area) return;

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      // Zoom in / out with Ctrl+Wheel
      this.state.zoom(event.deltaY < 0 ? 8 : -8);
      setTimeout(() => this.updateScrollbarMetrics(), 40);
      return;
    }

    // Scroll horizontally with wheel (trackpad swipe or mouse wheel)
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) > 0) {
      event.preventDefault();
      area.scrollLeft += delta;
      this.updateScrollbarMetrics();
    }
  }

  // Scrubbing Handlers
  onRulerPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.tl-ruler-corner') || target.closest('.tl-ruler-add-track-btn')) return;
    this.state.clearAllSelections();
    event.preventDefault();
    this.isScrubbing.set(true);
    try {
      target.setPointerCapture?.(event.pointerId);
    } catch {}
    this.handleTimelineScrubEvent(event);
  }

  onPlayheadPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isScrubbing.set(true);
    const target = event.target as HTMLElement;
    try {
      target.setPointerCapture?.(event.pointerId);
    } catch {}
    this.handleTimelineScrubEvent(event);
  }

  onTimelineLanePointerDown(event: PointerEvent): void {
    this.laneDownPos = { x: event.clientX, y: event.clientY };
  }

  onTimelineLaneClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.closest('.tl-clip') ||
      target.closest('.tl-junction') ||
      target.closest('.tl-music-clip') ||
      target.closest('.tl-header-col') ||
      target.closest('.tl-header-76') ||
      target.closest('.tl-ruler-row') ||
      target.closest('.tl-footer-scrollbar')
    ) {
      return;
    }

    const area = this.timelineAreaRef?.nativeElement;
    if (!area) return;
    const areaRect = area.getBoundingClientRect();

    // Guard 1: Ignore clicks on or near the native horizontal scrollbar region
    if (event.clientY >= areaRect.bottom - 18) {
      return;
    }

    // Guard 2: If the pointer was dragged or scrolled (> 5px), do NOT seek timer
    if (this.laneDownPos) {
      const dist = Math.hypot(event.clientX - this.laneDownPos.x, event.clientY - this.laneDownPos.y);
      if (dist > 5) {
        return;
      }
    }

    // Guard 3: Only seek if clicking inside the track lane area (past the sticky track headers)
    const el = this.timelineInnerRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left - this.trackHeaderWidth;
    if (x < 0) return;

    this.state.clearAllSelections();
    const targetSeconds = Math.max(0, Math.min(x / this.state.pxPerSecond(), this.state.timelineSeconds()));
    this.state.seekTo(targetSeconds);
  }

  onTimelineScrubDown(event: PointerEvent): void {
    this.onRulerPointerDown(event);
  }

  onTimelineScrubMove(event: PointerEvent): void {
    if (!this.isScrubbing()) return;
    this.handleTimelineScrubEvent(event);
  }

  onTimelineScrubUp(event: PointerEvent): void {
    if (this.isScrubbing()) {
      this.isScrubbing.set(false);
      try {
        (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
      } catch {}
    }
  }

  private handleTimelineScrubEvent(event: PointerEvent): void {
    const el = this.timelineInnerRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, event.clientX - rect.left - this.trackHeaderWidth);
    let targetSeconds = Math.max(0, Math.min(x / this.state.pxPerSecond(), this.state.timelineSeconds()));

    if (this.state.snapEnabled()) {
      targetSeconds = Math.max(0, Math.min(this.state.applySnap(targetSeconds), this.state.timelineSeconds()));
    } else {
      this.state.snapLineLeftPx.set(null);
    }

    const needleEl = this.playheadNeedleRef?.nativeElement;
    if (needleEl) {
      needleEl.style.left = `${this.trackHeaderWidth + this.state.secondsToPx(targetSeconds)}px`;
    }

    this.state.seekTo(targetSeconds);
  }

  // Item & Music Dragging / Trimming Handlers
  onItemPointerDown(item: TimelineItem, event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('.tl-trim-handle') || (event.target as HTMLElement).closest('.tl-item-remove')) return;
    event.preventDefault();
    event.stopPropagation();
    this.state.selectTimelineItem(item.id, event);
    this.itemDrag = {
      itemId: item.id,
      startClientX: event.clientX,
      origStartTime: item.startTime,
      duration: item.duration,
      trackId: item.trackId,
    };
  }

  onItemTrimPointerDown(item: TimelineItem, edge: 'left' | 'right', event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.itemTrim = {
      itemId: item.id,
      edge,
      startClientX: event.clientX,
      origStartTime: item.startTime,
      origDuration: item.duration,
      origTrimStart: item.trimStartSeconds ?? 0,
    };
  }

  onMusicBlockPointerDown(track: MusicTrackRow, event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('.tl-trim-handle') || (event.target as HTMLElement).closest('.tl-music-remove')) return;
    event.preventDefault();
    event.stopPropagation();
    this.state.selectMusicTrack(track.key);
    this.musicDrag = { key: track.key, startClientX: event.clientX, startSeconds: track.startSeconds };
  }

  onMusicTrimPointerDown(track: MusicTrackRow, edge: 'start' | 'end', event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const total = this.state.musicTrackAsset(track)?.durationSeconds ?? this.state.musicTrackDurationSeconds(track);
    const startValue = edge === 'start' ? (track.trimStartSeconds ?? 0) : (track.trimEndSeconds ?? total);
    this.musicTrim = { key: track.key, edge, startClientX: event.clientX, startValue };
  }

  onTimelinePointerMove(event: PointerEvent): void {
    if (this.isCustomScrollDragging()) {
      this.onScrollbarThumbPointerMove(event);
      return;
    }

    if (this.isScrubbing()) {
      this.handleTimelineScrubEvent(event);
      return;
    }

    const perSecond = this.state.pxPerSecond();

    if (this.itemDrag) {
      const drag = this.itemDrag;
      const deltaSeconds = (event.clientX - drag.startClientX) / perSecond;
      const rawStart = Math.max(0, drag.origStartTime + deltaSeconds);
      const snappedStart = this.state.applySnap(rawStart);
      const clampedStart = this.state.clampItemCollision(drag.trackId, snappedStart, drag.duration, drag.itemId);

      this.state.timelineItems.update((items) =>
        items.map((it) => (it.id === drag.itemId ? { ...it, startTime: clampedStart } : it))
      );
      this.state.markDirty();
      return;
    }

    if (this.itemTrim) {
      const trim = this.itemTrim;
      const deltaSeconds = (event.clientX - trim.startClientX) / perSecond;

      if (trim.edge === 'left') {
        const origEnd = trim.origStartTime + trim.origDuration;
        const rawStart = Math.max(0, Math.min(trim.origStartTime + deltaSeconds, origEnd - 0.5));
        const snappedStart = Math.min(this.state.applySnap(rawStart), origEnd - 0.5);
        const newDuration = origEnd - snappedStart;
        const shift = snappedStart - trim.origStartTime;
        const newTrimStart = Math.max(0, trim.origTrimStart + shift);

        this.state.timelineItems.update((items) =>
          items.map((it) =>
            it.id === trim.itemId
              ? { ...it, startTime: snappedStart, duration: newDuration, trimStartSeconds: newTrimStart }
              : it
          )
        );
      } else {
        const rawEnd = trim.origStartTime + trim.origDuration + deltaSeconds;
        const snappedEnd = this.state.applySnap(rawEnd);
        const maxCeiling = this.state.timelineSeconds() + 30;
        const clampedEnd = Math.max(trim.origStartTime + 0.5, Math.min(snappedEnd, maxCeiling));
        const newDuration = clampedEnd - trim.origStartTime;
        const newTrimEnd = trim.origTrimStart + newDuration;

        this.state.timelineItems.update((items) =>
          items.map((it) =>
            it.id === trim.itemId
              ? { ...it, duration: newDuration, trimEndSeconds: newTrimEnd }
              : it
          )
        );
      }
      this.state.markDirty();
      return;
    }

    if (this.musicDrag) {
      const drag = this.musicDrag;
      const next = Math.max(0, drag.startSeconds + (event.clientX - drag.startClientX) / perSecond);
      this.state.musicTracks.update((tracks) =>
        tracks.map((t) => (t.key === drag.key ? { ...t, startSeconds: next } : t))
      );
      this.state.markDirty();
      return;
    }

    if (this.musicTrim) {
      const trim = this.musicTrim;
      const next = Math.max(0, trim.startValue + (event.clientX - trim.startClientX) / perSecond);

      this.state.musicTracks.update((tracks) =>
        tracks.map((t) => {
          if (t.key !== trim.key) return t;
          if (trim.edge === 'start') {
            const end = t.trimEndSeconds;
            return { ...t, trimStartSeconds: end != null ? Math.min(next, Math.max(end - 0.25, 0)) : next };
          }
          const start = t.trimStartSeconds ?? 0;
          return { ...t, trimEndSeconds: Math.max(next, start + 0.25) };
        })
      );
      this.state.markDirty();
      return;
    }
  }

  onTimelinePointerUp(): void {
    if (this.isCustomScrollDragging()) {
      this.onScrollbarThumbPointerUp();
    }
    if (this.itemDrag || this.itemTrim || this.musicDrag || this.musicTrim) {
      this.itemDrag = null;
      this.itemTrim = null;
      this.musicDrag = null;
      this.musicTrim = null;
      this.state.snapLineLeftPx.set(null);
    }
    if (this.isScrubbing()) {
      this.isScrubbing.set(false);
      this.state.snapLineLeftPx.set(null);
    }
  }

  // Horizontal Scrollbar Methods
  onTimelineScroll(): void {
    this.updateScrollbarMetrics();
  }

  updateScrollbarMetrics(): void {
    const area = this.timelineAreaRef?.nativeElement;
    const track = this.scrollbarTrackRef?.nativeElement;
    if (!area || !track) return;
    const total = area.scrollWidth;
    const client = area.clientWidth;
    const trackWidth = track.clientWidth;
    if (total <= client || trackWidth <= 0) {
      this.scrollThumbWidth.set(trackWidth);
      this.scrollThumbLeft.set(0);
      return;
    }
    const ratio = client / total;
    const thumbW = Math.max(36, Math.min(trackWidth, ratio * trackWidth));
    const maxScroll = total - client;
    const travel = Math.max(0, trackWidth - thumbW);
    const thumbL = maxScroll > 0 ? (area.scrollLeft / maxScroll) * travel : 0;
    this.scrollThumbWidth.set(thumbW);
    this.scrollThumbLeft.set(Math.min(travel, Math.max(0, thumbL)));
  }

  onScrollbarThumbPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    try {
      target.setPointerCapture?.(event.pointerId);
    } catch {}
    this.isCustomScrollDragging.set(true);
    this.scrollbarDragStart = {
      clientX: event.clientX,
      scrollLeft: this.timelineAreaRef?.nativeElement?.scrollLeft ?? 0,
    };
  }

  onScrollbarThumbPointerMove(event: PointerEvent): void {
    if (!this.isCustomScrollDragging() || !this.scrollbarDragStart) return;
    const area = this.timelineAreaRef?.nativeElement;
    const track = this.scrollbarTrackRef?.nativeElement;
    if (!area || !track) return;
    const maxScroll = area.scrollWidth - area.clientWidth;
    if (maxScroll <= 0) return;
    const trackWidth = track.clientWidth;
    const thumbWidth = this.scrollThumbWidth();
    const travel = Math.max(1, trackWidth - thumbWidth);
    const delta = event.clientX - this.scrollbarDragStart.clientX;
    const deltaScroll = (delta / travel) * maxScroll;
    area.scrollLeft = Math.max(0, Math.min(maxScroll, this.scrollbarDragStart.scrollLeft + deltaScroll));
    this.updateScrollbarMetrics();
  }

  onScrollbarThumbPointerUp(): void {
    if (this.isCustomScrollDragging()) {
      this.isCustomScrollDragging.set(false);
      this.scrollbarDragStart = null;
    }
  }

  onScrollbarTrackClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.tl-scroll-thumb')) return;
    const area = this.timelineAreaRef?.nativeElement;
    const track = this.scrollbarTrackRef?.nativeElement;
    if (!area || !track) return;
    const maxScroll = area.scrollWidth - area.clientWidth;
    if (maxScroll <= 0) return;
    const rect = track.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    area.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
    setTimeout(() => this.updateScrollbarMetrics(), 50);
  }

  scrollTimelineBy(deltaPx: number): void {
    const area = this.timelineAreaRef?.nativeElement;
    if (!area) return;
    area.scrollBy({ left: deltaPx, behavior: 'smooth' });
    setTimeout(() => this.updateScrollbarMetrics(), 80);
  }

  scrollTimelineToStart(): void {
    const area = this.timelineAreaRef?.nativeElement;
    if (!area) return;
    area.scrollTo({ left: 0, behavior: 'smooth' });
    setTimeout(() => this.updateScrollbarMetrics(), 80);
  }
}

