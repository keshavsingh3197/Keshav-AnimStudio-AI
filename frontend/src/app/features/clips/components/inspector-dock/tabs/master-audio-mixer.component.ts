import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StudioStateService } from '../../../services/studio-state.service';
import { AudioEngineService } from '../../../../../core/services/audio-engine.service';

@Component({
  selector: 'app-master-audio-mixer',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './master-audio-mixer.component.html',
})
export class MasterAudioMixerComponent implements AfterViewInit, OnDestroy {
  readonly state = inject(StudioStateService);
  readonly audioEngine = inject(AudioEngineService);
  readonly Math = Math;

  @ViewChild('meterBarV1') meterBarV1?: ElementRef<HTMLElement>;
  @ViewChild('meterBarV2') meterBarV2?: ElementRef<HTMLElement>;
  @ViewChild('meterBarA1') meterBarA1?: ElementRef<HTMLElement>;
  @ViewChild('meterBarA2') meterBarA2?: ElementRef<HTMLElement>;
  @ViewChild('meterBarMaster') meterBarMaster?: ElementRef<HTMLElement>;

  private peakMeterRafId: number | null = null;

  constructor() {
    effect(() => {
      const playing = this.state.isPlaying();
      const isAudioTab = this.state.activeInspectorTab() === 'audio';
      if (playing && isAudioTab) {
        this.startPeakMeterLoop();
      } else {
        this.stopPeakMeterLoop();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.state.isPlaying() && this.state.activeInspectorTab() === 'audio') {
      this.startPeakMeterLoop();
    }
  }

  ngOnDestroy(): void {
    this.stopPeakMeterLoop();
  }

  private startPeakMeterLoop(): void {
    if (this.peakMeterRafId !== null) return;

    const loop = () => {
      if (!this.state.isPlaying() || this.state.activeInspectorTab() !== 'audio') {
        this.stopPeakMeterLoop();
        return;
      }

      const pV1 = this.audioEngine.getTrackPeak('V1');
      const pV2 = this.audioEngine.getTrackPeak('V2');
      const pA1 = this.audioEngine.getTrackPeak('A1');
      const pA2 = this.audioEngine.getTrackPeak('A2');
      const pMaster = this.audioEngine.getTrackPeak('Master');

      if (this.meterBarV1?.nativeElement) this.meterBarV1.nativeElement.style.width = `${(pV1 * 100).toFixed(1)}%`;
      if (this.meterBarV2?.nativeElement) this.meterBarV2.nativeElement.style.width = `${(pV2 * 100).toFixed(1)}%`;
      if (this.meterBarA1?.nativeElement) this.meterBarA1.nativeElement.style.width = `${(pA1 * 100).toFixed(1)}%`;
      if (this.meterBarA2?.nativeElement) this.meterBarA2.nativeElement.style.width = `${(pA2 * 100).toFixed(1)}%`;
      if (this.meterBarMaster?.nativeElement) this.meterBarMaster.nativeElement.style.width = `${(pMaster * 100).toFixed(1)}%`;

      this.peakMeterRafId = requestAnimationFrame(loop);
    };

    this.peakMeterRafId = requestAnimationFrame(loop);
  }

  private stopPeakMeterLoop(): void {
    if (this.peakMeterRafId !== null) {
      cancelAnimationFrame(this.peakMeterRafId);
      this.peakMeterRafId = null;
    }
    if (this.meterBarV1?.nativeElement) this.meterBarV1.nativeElement.style.width = '0%';
    if (this.meterBarV2?.nativeElement) this.meterBarV2.nativeElement.style.width = '0%';
    if (this.meterBarA1?.nativeElement) this.meterBarA1.nativeElement.style.width = '0%';
    if (this.meterBarA2?.nativeElement) this.meterBarA2.nativeElement.style.width = '0%';
    if (this.meterBarMaster?.nativeElement) this.meterBarMaster.nativeElement.style.width = '0%';
  }
}
