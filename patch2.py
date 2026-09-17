with open('frontend/src/app/features/clips/clip-studio.component.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Quick Bar
old1 = '''            <div class="clip-quick-bar">
              <button class="secondary" type="button" (click)="splitClipAtPlayhead()"
                      title="Split clip at playhead needle (Hotkey: S or B)">
                ? Split at playhead
              </button>
              <button class="secondary" type="button" (click)="duplicateClip(clip.id)"
                      title="Duplicate this clip">
                ? Duplicate
              </button>
              <span style="flex: 1 1 auto"></span>
              <button class="icon" type="button" (click)="move(selectedClipIndexInCut(), -1)"
                      [disabled]="selectedClipIndexInCut() <= 0" title="Move earlier">&uarr;</button>
              <button class="icon" type="button" (click)="move(selectedClipIndexInCut(), 1)"
                      [disabled]="selectedClipIndexInCut() >= rows().length - 1" title="Move later">&darr;</button>
              <button class="secondary" type="button" style="font-size: .8rem; padding: .25rem .5rem"
                      (click)="toggle(selectedClipIndexInCut())">
                Untick
              </button>
            </div>'''
new1 = '''            <div class="clip-quick-bar" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center">
              <button class="secondary" type="button" (click)="splitClipAtPlayhead()"
                      title="Split clip at playhead needle (Hotkey: S or B)">
                ? Split at playhead
              </button>
              <button class="secondary" type="button" (click)="duplicateClip(clip.id)"
                      title="Duplicate this clip">
                ? Duplicate
              </button>
              <span style="flex: 1 1 auto"></span>
              <span style="font-size: .8rem">Order:</span>
              <input type="number" min="1" [max]="included().length"
                     [ngModel]="selectedClipIndexInCut() + 1"
                     (ngModelChange)="moveToExplicitIndex(selectedClipIndexInCut(), )"
                     style="width: 4rem; padding: .2rem .4rem" />
              <button class="secondary" type="button" style="font-size: .8rem; padding: .25rem .5rem"
                      (click)="toggle(selectedClipIndexInCut())">
                Untick
              </button>
            </div>'''
text = text.replace(old1, new1)

# 2. Voice-over
old2 = '''                <input type="range" min="0" [max]="maxGain" step="0.05"
                       [ngModel]="sound.audioVolume"
                       (ngModelChange)="setClipSoundVolume(clip.id, )" />

                <label class="muted" style="font-weight: 400; margin-top: .4rem">
                  <input type="checkbox" [checked]="sound.keepOriginalAudio"
                         (change)="setClipKeepOriginal(clip.id, !sound.keepOriginalAudio)" />
                  Keep original audio playing underneath
                </label>'''
new2 = '''                <input type="range" min="0" [max]="maxGain" step="0.05"
                       [ngModel]="sound.audioVolume"
                       (ngModelChange)="setClipSoundVolume(clip.id, )" />

                <div class="row" style="margin-top: .6rem; gap: .5rem">
                  <div style="flex: 1 1 45%">
                    <label style="font-size: .8rem">Start Trim (s)</label>
                    <input type="number" min="0" step="0.1"
                           [ngModel]="sound.audioTrimStartSeconds ?? 0"
                           (ngModelChange)="setClipSoundTrimStart(clip.id, )" />
                  </div>
                  <div style="flex: 1 1 45%">
                    <label style="font-size: .8rem">End Trim (s)</label>
                    <input type="number" min="0" step="0.1"
                           [ngModel]="sound.audioTrimEndSeconds ?? (clipSoundAsset(clip.id)?.durationSeconds ?? clip.durationSeconds)"
                           (ngModelChange)="setClipSoundTrimEnd(clip.id, )" />
                  </div>
                </div>

                @let voAsset = clipSoundAsset(clip.id);
                @let voDur = voAsset?.durationSeconds ?? clip.durationSeconds ?? 1;
                @let voStart = sound.audioTrimStartSeconds ?? 0;
                @let voEnd = sound.audioTrimEndSeconds ?? voDur;
                @let pLeft = (voDur > 0 ? (voStart / voDur) * 100 : 0);
                @let pWidth = (voDur > 0 ? ((voEnd - voStart) / voDur) * 100 : 100);

                <div style="height: 1rem; background: var(--surface-2); border-radius: 4px; margin-top: .8rem; position: relative; overflow: hidden; border: 1px solid var(--border)">
                  <div style="position: absolute; top: 0; bottom: 0; background: var(--brand); opacity: 0.8; border-radius: 2px; transition: all 0.2s"
                       [style.left.%]="pLeft" [style.width.%]="Math.max(pWidth, 2)">
                  </div>
                </div>

                <label class="muted" style="font-weight: 400; margin-top: .4rem">
                  <input type="checkbox" [checked]="sound.keepOriginalAudio"
                         (change)="setClipKeepOriginal(clip.id, !sound.keepOriginalAudio)" />
                  Keep clip's own audio underneath
                </label>'''
text = text.replace(old2, new2)

# 3. Timeline
old3 = '''              <span class="tl-clip-dur mono">
                {{ entry.row.clip.durationSeconds ?? 0 | number: '1.0-1' }}s
              </span>
            </div>'''
new3 = '''              <span class="tl-clip-dur mono">
                {{ entry.row.clip.durationSeconds ?? 0 | number: '1.0-1' }}s
              </span>

              @let cSound = clipSound(entry.row.clip.id);
              @if (cSound.audioAssetId) {
                @let cAssetDur = clipSoundAsset(entry.row.clip.id)?.durationSeconds ?? entry.row.clip.durationSeconds ?? 1;
                @let cStart = cSound.audioTrimStartSeconds ?? 0;
                @let cEnd = cSound.audioTrimEndSeconds ?? cAssetDur;
                @let cLeft = (cAssetDur > 0 ? (cStart / cAssetDur) * 100 : 0);
                @let cWidth = (cAssetDur > 0 ? ((cEnd - cStart) / cAssetDur) * 100 : 100);
                <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: rgba(0,0,0,0.5); overflow: hidden" title="Custom Voice-Over active">
                  <div style="position: absolute; top: 0; bottom: 0; background: var(--ok); opacity: 0.9; border-radius: 1px; transition: all 0.2s"
                       [style.left.%]="cLeft" [style.width.%]="Math.max(cWidth, 2)"></div>
                </div>
              }
            </div>'''
text = text.replace(old3, new3)

with open('frontend/src/app/features/clips/clip-studio.component.html', 'w', encoding='utf-8') as f:
    f.write(text)
