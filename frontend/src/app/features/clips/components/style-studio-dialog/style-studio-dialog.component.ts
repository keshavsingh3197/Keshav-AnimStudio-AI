import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoShortStyle, AutoShortTextMode, ImageCameraMotion, ImageLook } from '../../../../core/models/api.models';
import {
  ApplyTimelineStyleOptions,
  STUDIO_STYLE_PRESETS,
  StudioStateService,
  StudioStylePreset,
} from '../../services/studio-state.service';
import {
  IMAGE_LOOKS,
  IMAGE_MOTIONS,
  cameraTransform,
  lookFilter,
} from '../../services/cinematic-image';
import { CELEBRATIONS, CelebrationKind } from '../../services/celebration';

interface AccentSegment {
  text: string;
  accent: boolean;
}

function parseAccentSegments(line: string): AccentSegment[] {
  const segments: AccentSegment[] = [];
  const parts = line.split(/(\[[^\]]+\])/);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('[') && part.endsWith(']')) {
      segments.push({ text: part.slice(1, -1), accent: true });
    } else {
      segments.push({ text: part, accent: false });
    }
  }
  return segments;
}

@Component({
  selector: 'app-style-studio-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ss-backdrop" (click)="close()">
      <div class="ss-dialog" role="dialog" aria-modal="true" aria-label="Styles, Effects and Layouts Studio"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="ss-head">
          <div class="ss-head-left">
            <div class="ss-head-tags">
              <span class="ss-badge">✨ ANIMSTUDIO AI STYLE ENGINE</span>
              <span class="ss-scope-tag">
                Scope: {{ scope() === 'all' ? 'All ' + state.included().length + ' Clips' : state.getTargetClipIds().length + ' Selected Clips' }}
              </span>
            </div>
            <h2>Short-Form Styles, Camera FX &amp; Direct-Response Layouts</h2>
            <p>Apply viral hooks, dynamic split-screens, cosmic cards, Ken Burns motion, 1-word pop captions, or cinematic grades directly to your timeline.</p>
          </div>
          <button type="button" class="ss-close" (click)="close()" title="Close (Esc)" aria-label="Close styles studio">✕</button>
        </div>

        <!-- Top Navigation Segmented Tabs -->
        <div class="ss-nav-bar">
          <div class="ss-tabs">
            <button type="button" class="ss-tab" [class.on]="activeTab() === 'styles'" (click)="activeTab.set('styles')">
              <span class="ss-tab-icon">🎬</span>
              <span>Style Presets (10)</span>
            </button>
            <button type="button" class="ss-tab" [class.on]="activeTab() === 'layouts'" (click)="activeTab.set('layouts')">
              <span class="ss-tab-icon">📐</span>
              <span>Ad &amp; Split Layouts (5)</span>
            </button>
            <button type="button" class="ss-tab" [class.on]="activeTab() === 'captions'" (click)="activeTab.set('captions')">
              <span class="ss-tab-icon">💬</span>
              <span>Kinetic Captions &amp; Pop</span>
            </button>
            <button type="button" class="ss-tab" [class.on]="activeTab() === 'camera_fx'" (click)="activeTab.set('camera_fx')">
              <span class="ss-tab-icon">🎥</span>
              <span>Camera Moves &amp; Lens FX</span>
            </button>
          </div>

          <!-- Scope Switcher in Tab Bar -->
          <div class="ss-scope-switch">
            <span class="ss-scope-switch-lbl">Target:</span>
            <div class="ss-scope-pills">
              <button type="button" [class.on]="scope() === 'all'" (click)="scope.set('all')">
                Whole Timeline
              </button>
              <button type="button" [class.on]="scope() === 'selected'" (click)="scope.set('selected')"
                      [disabled]="state.getTargetClipIds().length === 0"
                      [title]="state.getTargetClipIds().length === 0 ? 'Select clips on the timeline first' : 'Apply only to currently selected clips'">
                Selected ({{ state.getTargetClipIds().length }})
              </button>
            </div>
          </div>
        </div>

        <!-- Main Body: Active Tab Panel (Left) + Interactive Live Preview Monitor (Right) -->
        <div class="ss-body">

          <!-- Left Column Content Area -->
          <div class="ss-left-panel">

            <!-- TAB 1: 10 AUTO-SHORT STYLES -->
            @if (activeTab() === 'styles') {
              <div class="ss-tab-pane">
                <div class="ss-pane-header">
                  <div>
                    <h3 class="ss-pane-title">Choose Visual Style &amp; Mood</h3>
                    <p class="ss-pane-desc">Click any style to preview its camera pacing, color look, transitions, atmosphere particles, and kinetic captions.</p>
                  </div>
                  <button type="button" class="ss-btn-batch" (click)="openBatchAutoShorts()" title="Open Auto-Shorts to generate multiple batch variants at once">
                    ⚡ Batch Auto-Shorts →
                  </button>
                </div>

                <div class="ss-cards-grid">
                  @for (p of presets; track p.id) {
                    <div class="ss-card" [class.selected]="selectedStyleId() === p.id"
                         role="button" tabindex="0" (click)="selectPreset(p)" (keydown.enter)="selectPreset(p)">
                      <div class="ss-card-header">
                        <div class="ss-card-title-group">
                          <span class="ss-card-icon">{{ p.icon }}</span>
                          <span class="ss-card-title">{{ p.label }}</span>
                        </div>
                        <span class="ss-card-tag">{{ p.tag }}</span>
                      </div>

                      <div class="ss-card-desc">{{ p.description }}</div>

                      <div class="ss-card-specs">
                        <div class="ss-spec-pill">
                          <span class="ss-spec-k">🎥</span>
                          <span>{{ p.motions.slice(0, 2).join(' + ') }}</span>
                        </div>
                        <div class="ss-spec-pill">
                          <span class="ss-spec-k">🎨</span>
                          <span>{{ p.look }}</span>
                        </div>
                        <div class="ss-spec-pill">
                          <span class="ss-spec-k">⚡</span>
                          <span>{{ p.transitions[0] }} ({{ p.transitionSeconds }}s)</span>
                        </div>
                        @if (p.defaultCelebration !== 'none') {
                          <div class="ss-spec-pill highlight">
                            <span class="ss-spec-k">✨</span>
                            <span>{{ p.defaultCelebration }}</span>
                          </div>
                        }
                      </div>

                      @if (selectedStyleId() === p.id) {
                        <div class="ss-card-check">✓ Active Style</div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- TAB 2: AD & SPLIT LAYOUT TEMPLATES -->
            @if (activeTab() === 'layouts') {
              <div class="ss-tab-pane">
                <div class="ss-pane-header">
                  <div>
                    <h3 class="ss-pane-title">Direct-Response Ad &amp; Multi-Clip Layouts</h3>
                    <p class="ss-pane-desc">Choose a multi-layer composition style. These layouts combine talking heads, product reports, PDF documents, and cards.</p>
                  </div>
                  <button class="ss-clear-layout-btn" type="button" (click)="clearLayout()" title="Remove all split-screen cards and revert to standard full-frame video">
                    🗑 Revert to Full Frame
                  </button>
                </div>

                <div class="ss-timing-control-strip">
                  <span class="ss-timing-label">⏱ Active Timing:</span>
                  <div class="ss-timing-chips">
                    <button class="ss-timing-chip" type="button" [class.active]="layoutScope() === 'intro'" (click)="layoutScope.set('intro')">
                      ⚡ Intro Hook (00:00–00:05)
                    </button>
                    <button class="ss-timing-chip" type="button" [class.active]="layoutScope() === 'selected'" (click)="layoutScope.set('selected')">
                      🎯 Selected Shot Only
                    </button>
                    <button class="ss-timing-chip" type="button" [class.active]="layoutScope() === 'all'" (click)="layoutScope.set('all')">
                      📺 Whole Video (00:00–End)
                    </button>
                  </div>
                </div>

                <div class="ss-layouts-list">
                  <!-- Layout 0: Full Frame -->
                  <div class="ss-layout-card" [class.selected]="adLayout() === 'none'"
                       role="button" tabindex="0" (click)="adLayout.set('none')">
                    <div class="ss-layout-icon-box">
                      <div class="ss-wireframe full"></div>
                    </div>
                    <div class="ss-layout-info">
                      <div class="ss-layout-name">Full-Frame Standard Cut</div>
                      <div class="ss-layout-sub">Standard edge-to-edge video layout without split-screen borders or container cards.</div>
                    </div>
                    <div class="ss-layout-radio" [class.checked]="adLayout() === 'none'"></div>
                  </div>

                  <!-- Layout 1: 3-Row Video Stack -->
                  <div class="ss-layout-card" [class.selected]="adLayout() === 'stack-3'"
                       role="button" tabindex="0" (click)="adLayout.set('stack-3')">
                    <div class="ss-layout-icon-box">
                      <div class="ss-wireframe stack">
                        <div class="ss-wf-bar"></div>
                        <div class="ss-wf-bar"></div>
                        <div class="ss-wf-bar"></div>
                      </div>
                    </div>
                    <div class="ss-layout-info">
                      <div class="ss-layout-name">▦ 3-Row Dynamic Video Stack (00:00–00:07)</div>
                      <div class="ss-layout-sub">Divides the 9:16 frame into three equal horizontal video bands with staggered slide-in layer reveals.</div>
                    </div>
                    <div class="ss-layout-radio" [class.checked]="adLayout() === 'stack-3'"></div>
                  </div>

                  <!-- Layout 2: 50/50 Video + Document -->
                  <div class="ss-layout-card" [class.selected]="adLayout() === 'doc-split'"
                       role="button" tabindex="0" (click)="adLayout.set('doc-split')">
                    <div class="ss-layout-icon-box">
                      <div class="ss-wireframe split">
                        <div class="ss-wf-half top"></div>
                        <div class="ss-wf-half bottom"></div>
                      </div>
                    </div>
                    <div class="ss-layout-info">
                      <div class="ss-layout-name">📄 50/50 Talking Head + Document Showcase (00:13–00:29)</div>
                      <div class="ss-layout-sub">Top half features the speaker video, while the bottom half displays a scrolling PDF/report preview with a decorative gold banner.</div>
                    </div>
                    <div class="ss-layout-radio" [class.checked]="adLayout() === 'doc-split'"></div>
                  </div>

                  <!-- Layout 3: Cosmic Glassmorphic Card -->
                  <div class="ss-layout-card" [class.selected]="adLayout() === 'cosmic-card'"
                       role="button" tabindex="0" (click)="adLayout.set('cosmic-card')">
                    <div class="ss-layout-icon-box">
                      <div class="ss-wireframe cosmic">
                        <div class="ss-wf-box"></div>
                      </div>
                    </div>
                    <div class="ss-layout-info">
                      <div class="ss-layout-name">🌌 Framed Cosmic Glassmorphic Container (00:03, 00:07)</div>
                      <div class="ss-layout-sub">Centered vertical card featuring a rounded neon/glass border, starry dark-blue gradient, and Jonath[a]n letter comparison strip.</div>
                    </div>
                    <div class="ss-layout-radio" [class.checked]="adLayout() === 'cosmic-card'"></div>
                  </div>

                  <!-- Layout 4: 3D Product Book + CTA -->
                  <div class="ss-layout-card" [class.selected]="adLayout() === 'book-mockup'"
                       role="button" tabindex="0" (click)="adLayout.set('book-mockup')">
                    <div class="ss-layout-icon-box">
                      <div class="ss-wireframe book">
                        <div class="ss-wf-badge"></div>
                        <div class="ss-wf-book"></div>
                        <div class="ss-wf-cta"></div>
                      </div>
                    </div>
                    <div class="ss-layout-info">
                      <div class="ss-layout-name">📘 Floating 3D Report Mockup + Social Proof Badge (00:18, 00:34)</div>
                      <div class="ss-layout-sub">Digital report displayed in angled 3D perspective over starry particles, paired with "10,000+ REPORTS SOLD" badge and Order Now CTA.</div>
                    </div>
                    <div class="ss-layout-radio" [class.checked]="adLayout() === 'book-mockup'"></div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 3: KINETIC CAPTIONS & WORD-POP -->
            @if (activeTab() === 'captions') {
              <div class="ss-tab-pane">
                <div class="ss-pane-header">
                  <div>
                    <h3 class="ss-pane-title">Kinetic Subtitles, Word-Pop &amp; CTA Buttons</h3>
                    <p class="ss-pane-desc">Generate word-by-word punchy captions with bracket-based emphatic text coloring on track TXT1.</p>
                  </div>
                  <label class="ss-cta-toggle-pill">
                    <input type="checkbox" [ngModel]="addCtaButton()" (ngModelChange)="addCtaButton.set($event)" />
                    <span>Pulsing "👆 ORDER NOW →" CTA</span>
                  </label>
                </div>

                <div class="ss-caption-modes-grid">
                  @for (tm of textModes; track tm.id) {
                    <div class="ss-mode-card" [class.selected]="textMode() === tm.id"
                         role="button" tabindex="0" (click)="textMode.set(tm.id)">
                      <div class="ss-mode-head">
                        <span class="ss-mode-title">{{ tm.label }}</span>
                        @if (textMode() === tm.id) {
                          <span class="ss-mode-check">✓</span>
                        }
                      </div>
                      <div class="ss-mode-desc">{{ tm.hint }}</div>
                    </div>
                  }
                </div>

                @if (textMode() !== 'None') {
                  <div class="ss-script-editor-card">
                    <div class="ss-editor-top">
                      <span class="ss-editor-lbl">Captions Script (One line per shot or hook):</span>
                      <button type="button" class="ss-btn-sample" (click)="resetLinesToPreset()">
                        ↺ Use Style Default Lines
                      </button>
                    </div>

                    <textarea class="ss-script-textarea" rows="4"
                              [ngModel]="linesText()" (ngModelChange)="linesText.set($event)"
                              placeholder="⚡ [3] SIGNS YOUR NAME VIBRATION MATTERS&#10;Original: Jonath[o]n vs Jonath[a]n&#10;10,000+ [REPORTS] SOLD WORLDWIDE"></textarea>

                    <div class="ss-editor-tip">
                      💡 <strong>Accent Color Tip:</strong> Wrap any word or letter inside <code>[brackets]</code> to highlight it in vibrant yellow/cyan (e.g. <code>⚡ [3] SIGNS</code> or <code>Jonath[a]n</code>).
                    </div>
                  </div>
                }
              </div>
            }

            <!-- TAB 4: CAMERA MOVES & LENS FX -->
            @if (activeTab() === 'camera_fx') {
              <div class="ss-tab-pane">
                <div class="ss-pane-header">
                  <div>
                    <h3 class="ss-pane-title">Fine-Tune Camera Motion, Color Look &amp; Atmosphere</h3>
                    <p class="ss-pane-desc">Manually customize the camera path, intensity, grading filter, lens finishes, and floating particle overlay.</p>
                  </div>
                </div>

                <!-- Toggles Strip -->
                <div class="ss-toggles-strip">
                  <label class="ss-toggle-card">
                    <input type="checkbox" [ngModel]="applyMotion()" (ngModelChange)="applyMotion.set($event)" />
                    <div>
                      <strong>Camera Motion (Ken Burns)</strong>
                      <span>Slow pan, zoom-in, drift, and handheld sway</span>
                    </div>
                  </label>
                  <label class="ss-toggle-card">
                    <input type="checkbox" [ngModel]="applyLook()" (ngModelChange)="applyLook.set($event)" />
                    <div>
                      <strong>Color Grading &amp; Filter</strong>
                      <span>Vivid, cinematic, warm, noir, or matte grade</span>
                    </div>
                  </label>
                  <label class="ss-toggle-card">
                    <input type="checkbox" [ngModel]="applyTransitions()" (ngModelChange)="applyTransitions.set($event)" />
                    <div>
                      <strong>Cut Transitions</strong>
                      <span>Seamless push, slide, wipe, and cross-dissolves</span>
                    </div>
                  </label>
                </div>

                <!-- Selectors Grid -->
                <div class="ss-fields-grid">
                  <div class="ss-field-card">
                    <label class="ss-field-lbl">Camera Move Motion</label>
                    <select class="ss-select" [ngModel]="overrideMotion()" (ngModelChange)="overrideMotion.set($event)" [disabled]="!applyMotion()">
                      <option value="preset">✨ Auto-Cycle Style Moves ({{ activePreset().motions.join(', ') }})</option>
                      @for (m of motions; track m.id) {
                        <option [value]="m.id">{{ m.icon }} {{ m.label }} ({{ m.hint }})</option>
                      }
                    </select>
                  </div>

                  <div class="ss-field-card">
                    <label class="ss-field-lbl">Color Look Grade</label>
                    <select class="ss-select" [ngModel]="overrideLook()" (ngModelChange)="overrideLook.set($event)" [disabled]="!applyLook()">
                      <option value="preset">✨ Style Default Look ({{ activePreset().look }})</option>
                      @for (l of looks; track l.id) {
                        <option [value]="l.id">{{ l.label }}</option>
                      }
                    </select>
                  </div>

                  <div class="ss-field-card">
                    <label class="ss-field-lbl">Atmosphere &amp; Particles (FX1)</label>
                    <select class="ss-select" [ngModel]="celebration()" (ngModelChange)="celebration.set($event)">
                      <option value="none">None (No particle layer)</option>
                      @for (c of celebrations; track c.id) {
                        <option [value]="c.id">{{ c.icon }} {{ c.label }} — {{ c.hint }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Lens Finishes -->
                @if (applyLook()) {
                  <div class="ss-lens-finishes">
                    <span class="ss-lens-title">Lens Finishes &amp; Cinema Aspect:</span>
                    <label class="ss-lens-chip">
                      <input type="checkbox" [ngModel]="vignette()" (ngModelChange)="vignette.set($event)" />
                      <span>Soft Edge Vignette</span>
                    </label>
                    <label class="ss-lens-chip">
                      <input type="checkbox" [ngModel]="grain()" (ngModelChange)="grain.set($event)" />
                      <span>35mm Film Grain</span>
                    </label>
                    <label class="ss-lens-chip">
                      <input type="checkbox" [ngModel]="cinemaBars()" (ngModelChange)="cinemaBars.set($event)" />
                      <span>2.39:1 Cinema Letterbox Bars</span>
                    </label>
                  </div>
                }
              </div>
            }

          </div>

          <!-- Right Column: Interactive Live Preview Monitor -->
          <div class="ss-right-monitor">
            <div class="ss-monitor-card">

              <!-- Monitor Top Bar -->
              <div class="ss-mon-header">
                <div class="ss-mon-status">
                  <span class="ss-pulse-dot"></span>
                  <strong>Live Preview</strong>
                </div>
                <div class="ss-shot-pills">
                  @for (s of previewClips().slice(0, 4); track $index) {
                    <button type="button" class="ss-shot-btn" [class.on]="previewShotIndex() === $index"
                            (click)="setManualShot($index)" [title]="'Preview Shot ' + ($index + 1)">
                      #{{ $index + 1 }}
                    </button>
                  }
                </div>
              </div>

              <!-- Phone-styled 9:16 Vertical Screen Bezel -->
              <div class="ss-phone-bezel">
                <div class="ss-phone-notch"></div>

                <div class="ss-viewport" [class.is-cosmic]="celebration() === 'cosmic' || adLayout() === 'cosmic-card' || adLayout() === 'book-mockup'">

                  <!-- Background Media Stream -->
                  <div class="ss-media-layer" [class]="'ss-trans-' + currentTransitionClass()" [attr.data-tick]="shotSwitchNonce()">
                    @if (currentPreviewClip(); as clip) {
                      @if (state.getClipType(clip) === 'video') {
                        <video class="ss-media-element" [src]="state.assetUrl(clip.id)"
                               [style.filter]="livePreviewFilter()"
                               [style.transform]="livePreviewTransform()"
                               muted autoplay loop playsinline></video>
                      } @else {
                        <img class="ss-media-element" [src]="state.assetUrl(clip.id)"
                             [style.filter]="livePreviewFilter()"
                             [style.transform]="livePreviewTransform()"
                             alt="" />
                      }
                    } @else {
                      <div class="ss-fallback-bg"
                           [style.filter]="livePreviewFilter()"
                           [style.transform]="livePreviewTransform()">
                        <div class="ss-fallback-grid"></div>
                      </div>
                    }
                  </div>

                  <!-- Ad Layout Templates Overlays -->
                  @if (adLayout() === 'stack-3') {
                    <div class="ss-layout-overlay stack-3">
                      <div class="ss-band b1"><span>Row 1 · Hook Clip</span></div>
                      <div class="ss-band b2"><span>Row 2 · Feature Clip</span></div>
                      <div class="ss-band b3"><span>Row 3 · Proof Clip</span></div>
                    </div>
                  } @else if (adLayout() === 'doc-split') {
                    <div class="ss-layout-overlay doc-split">
                      <div class="ss-doc-head"><span>Talking Head Speaker</span></div>
                      <div class="ss-doc-gold-banner">★ PERSONAL REPORT PREVIEW ★</div>
                      <div class="ss-doc-preview"><span>📄 Report PDF Preview</span></div>
                    </div>
                  } @else if (adLayout() === 'cosmic-card') {
                    <div class="ss-layout-overlay cosmic-card">
                      <div class="ss-glass-card">
                        <div class="ss-glass-header">✨ <span class="acc-gold">COSMIC</span> NAME ANALYSIS</div>
                        <div class="ss-glass-comp-strip">
                          <div>Original: Jonath<span class="acc-gold">o</span>n</div>
                          <div>Changed: Jonath<span class="acc-gold">a</span>n</div>
                        </div>
                        <div class="ss-glass-footer">✔ Vibrational <span class="acc-cyan">Alignment</span> Unlocked</div>
                      </div>
                    </div>
                  } @else if (adLayout() === 'book-mockup') {
                    <div class="ss-layout-overlay book-mockup">
                      <div class="ss-badge-sold">★ <span class="acc-gold">10,000+</span> REPORTS SOLD</div>
                      <div class="ss-book-perspective">
                        <div class="ss-book-inner">📘 3D REPORT</div>
                      </div>
                    </div>
                  }

                  <!-- Lens Finishes: Vignette, Grain, Cinema Bars -->
                  @if (applyLook() && vignette()) {
                    <div class="ss-lens-vignette"></div>
                  }
                  @if (applyLook() && grain()) {
                    <div class="ss-lens-grain"></div>
                  }
                  @if (applyLook() && cinemaBars()) {
                    <div class="ss-lens-bar bar-top"></div>
                    <div class="ss-lens-bar bar-bottom"></div>
                  }

                  <!-- Particles & Atmosphere Particles -->
                  @if (celebration() !== 'none') {
                    <div class="ss-particles-overlay">
                      @for (pt of particleDots; track pt.id) {
                        <span class="ss-particle-item" [style.left.%]="pt.x" [style.top.%]="pt.y" [style.animation-delay.s]="pt.delay">
                          {{ celebrationGlyph() }}
                        </span>
                      }
                    </div>
                  }

                  <!-- Kinetic Caption / Word-Pop Overlay -->
                  @if (livePreviewCaption(); as cap) {
                    <div class="ss-caption-box-layer" [class]="'pos-' + cap.position + (cap.isPop ? ' is-pop' : '')">
                      <div class="ss-caption-bubble"
                           [style.background]="cap.boxBg"
                           [style.border-color]="cap.borderColor"
                           [style.color]="cap.color">
                        @for (seg of cap.segments; track $index) {
                          <span [style.color]="seg.accent ? cap.accentColor : cap.color">{{ seg.text }}</span>
                        }
                      </div>
                    </div>
                  }

                  <!-- Pulsing CTA Button -->
                  @if (addCtaButton()) {
                    <div class="ss-cta-overlay">
                      <div class="ss-cta-pill">👆 <span>ORDER NOW</span> →</div>
                    </div>
                  }

                  <!-- Real-time HUD Telemetry Badges -->
                  <div class="ss-hud-bar">
                    @if (applyMotion()) {
                      <span class="ss-hud-badge">🎥 {{ currentPreviewMotion() }}</span>
                    }
                    @if (applyLook()) {
                      <span class="ss-hud-badge">🎨 {{ currentPreviewLook() }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Live Pacing & Playback Strip -->
              <div class="ss-mon-controls">
                <button type="button" class="ss-btn-play" (click)="togglePlayPause()">
                  {{ isPreviewPaused() ? '▶ Play' : '⏸ Pause' }}
                </button>
                <div class="ss-mon-summary">
                  <span>{{ activePreset().icon }} {{ activePreset().label }}</span>
                  <small>{{ adLayout() !== 'none' ? adLayout() : textMode() }}</small>
                </div>
              </div>

              <!-- Quick Apply Action Button -->
              <button type="button" class="ss-btn-apply-primary" (click)="applyToTimeline()">
                ✨ Apply Style to Timeline &amp; Preview
              </button>

            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="ss-foot">
          <div class="ss-foot-hint">
            ✓ Full timeline updates in 1 click &middot; Live playback in editor viewport &middot; Easily undoable with <code>Ctrl+Z</code>
          </div>
          <div class="ss-foot-buttons">
            <button type="button" class="ss-btn-cancel" (click)="close()">Close</button>
            <button type="button" class="ss-btn-submit" (click)="applyToTimeline()">
              ✨ Apply to Timeline &amp; Preview Live
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .ss-backdrop {
      position: fixed; inset: 0; z-index: 1200;
      background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      box-sizing: border-box;
    }
    .ss-dialog {
      width: min(1200px, 96vw); height: min(840px, 92vh);
      background: #090e17; border: 1px solid #1e293b; border-radius: 16px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06);
      display: flex; flex-direction: column; overflow: hidden; color: #e2e8f0;
      box-sizing: border-box;
    }

    /* Header */
    .ss-head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
      padding: 16px 24px; background: linear-gradient(135deg, #0f172a 0%, #171630 100%);
      border-bottom: 1px solid #1e293b; flex-shrink: 0;
    }
    .ss-head-tags { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .ss-badge {
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em;
      padding: 3px 9px; border-radius: 999px; background: rgba(250, 204, 21, 0.16);
      color: #facc15; border: 1px solid rgba(250, 204, 21, 0.35);
    }
    .ss-scope-tag {
      font-size: 0.66rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .ss-head h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #f8fafc; letter-spacing: -0.01em; }
    .ss-head p { margin: 4px 0 0; font-size: 0.78rem; color: #94a3b8; line-height: 1.4; }
    .ss-close {
      width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 0.95rem;
      background: rgba(255, 255, 255, 0.06); border: 1px solid #334155; color: #cbd5e1;
      display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
      flex-shrink: 0;
      padding: 0;
    }
    .ss-close:hover { background: rgba(239, 68, 68, 0.25); border-color: #ef4444; color: #fff; }

    /* Top Navigation Tabs */
    .ss-nav-bar {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 8px 24px; background: #070c14; border-bottom: 1px solid #1e293b; flex-shrink: 0;
      flex-wrap: wrap;
    }
    .ss-tabs { display: flex; gap: 6px; }
    .ss-tab {
      display: flex; align-items: center; gap: 6px; padding: 6px 14px;
      font-size: 0.76rem; font-weight: 700; color: #94a3b8; background: transparent;
      border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
    }
    .ss-tab:hover { color: #f8fafc; background: rgba(255, 255, 255, 0.05); }
    .ss-tab.on {
      color: #fef08a; background: rgba(250, 204, 21, 0.12);
      border-color: rgba(250, 204, 21, 0.35); box-shadow: 0 0 12px rgba(250, 204, 21, 0.1);
    }
    .ss-tab-icon { font-size: 0.88rem; }

    .ss-scope-switch { display: flex; align-items: center; gap: 8px; }
    .ss-scope-switch-lbl { font-size: 0.72rem; color: #64748b; font-weight: 600; }
    .ss-scope-pills { display: flex; gap: 3px; background: #030712; padding: 3px; border-radius: 8px; border: 1px solid #1e293b; }
    .ss-scope-pills button {
      padding: 4px 10px; font-size: 0.72rem; font-weight: 700; color: #94a3b8;
      background: transparent; border: none; border-radius: 6px; cursor: pointer; transition: all 0.12s ease;
    }
    .ss-scope-pills button.on { background: #3b82f6; color: #fff; }
    .ss-scope-pills button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Body Layout */
    .ss-body {
      display: grid; grid-template-columns: 1fr 340px; gap: 20px;
      padding: 18px 24px; overflow-y: auto; flex: 1; min-height: 0; box-sizing: border-box;
    }
    @media (max-width: 980px) {
      .ss-body { grid-template-columns: minmax(0, 1fr); }
    }
    .ss-left-panel { min-width: 0; display: flex; flex-direction: column; }
    .ss-tab-pane { display: flex; flex-direction: column; gap: 14px; }
    .ss-pane-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
    .ss-pane-title { margin: 0; font-size: 0.96rem; font-weight: 800; color: #f8fafc; }
    .ss-pane-desc { margin: 3px 0 0; font-size: 0.74rem; color: #94a3b8; line-height: 1.4; }
    .ss-btn-batch {
      padding: 5px 12px; font-size: 0.72rem; font-weight: 700; color: #38bdf8;
      background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 7px; cursor: pointer; flex-shrink: 0; transition: all 0.15s ease;
    }
    .ss-btn-batch:hover { background: rgba(56, 189, 248, 0.22); }

    /* TAB 1: Style Cards Grid */
    .ss-cards-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
    }
    @media (max-width: 680px) {
      .ss-cards-grid { grid-template-columns: minmax(0, 1fr); }
    }
    .ss-card {
      display: flex !important; flex-direction: column !important; align-items: stretch !important;
      text-align: left !important; box-sizing: border-box !important; position: relative;
      padding: 12px 14px; gap: 7px; border-radius: 12px;
      background: #0e1526; border: 1.5px solid #1e293b; cursor: pointer;
      transition: all 0.18s ease; outline: none;
    }
    .ss-card:hover {
      border-color: #475569; background: #131d33; transform: translateY(-1px);
    }
    .ss-card.selected {
      border-color: #facc15; background: linear-gradient(145deg, rgba(250, 204, 21, 0.14) 0%, rgba(14, 21, 38, 0.95) 100%);
      box-shadow: 0 4px 20px rgba(250, 204, 21, 0.15), 0 0 0 1px rgba(250, 204, 21, 0.4);
    }
    .ss-card-header {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .ss-card-title-group { display: flex; align-items: center; gap: 7px; min-width: 0; }
    .ss-card-icon { font-size: 1.1rem; flex-shrink: 0; }
    .ss-card-title { font-size: 0.86rem; font-weight: 800; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ss-card-tag {
      font-size: 0.62rem; font-weight: 700; padding: 2px 7px; border-radius: 999px;
      background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.28);
      white-space: nowrap; flex-shrink: 0;
    }
    .ss-card-desc {
      font-size: 0.73rem; color: #94a3b8; line-height: 1.45; min-height: 2.1rem;
    }
    .ss-card-specs {
      display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px;
    }
    .ss-spec-pill {
      display: flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 6px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.65rem; color: #cbd5e1; font-weight: 600;
    }
    .ss-spec-pill.highlight {
      background: rgba(250, 204, 21, 0.1); border-color: rgba(250, 204, 21, 0.25); color: #fde047;
    }
    .ss-spec-k { font-size: 0.72rem; }
    .ss-card-check {
      position: absolute; right: 10px; bottom: 10px;
      font-size: 0.62rem; font-weight: 800; color: #facc15;
      background: rgba(250, 204, 21, 0.18); padding: 1px 6px; border-radius: 4px;
    }

    /* TAB 2: Ad Layouts List */
    .ss-timing-control-strip {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 10px 14px; border-radius: 10px; background: #0c1220; border: 1px solid #1e293b;
      margin-bottom: 12px; flex-wrap: wrap;
    }
    .ss-timing-label { font-size: 0.76rem; font-weight: 700; color: #94a3b8; }
    .ss-timing-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .ss-timing-chip {
      background: #111827; border: 1px solid #334155; color: #cbd5e1; border-radius: 6px;
      padding: 4px 10px; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .ss-timing-chip:hover { border-color: #64748b; color: #fff; }
    .ss-timing-chip.active {
      background: rgba(56, 189, 248, 0.15); border-color: #38bdf8; color: #38bdf8;
    }
    .ss-clear-layout-btn {
      background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5; border-radius: 6px; padding: 5px 12px; font-size: 0.74rem;
      font-weight: 700; cursor: pointer; transition: all 0.15s;
    }
    .ss-clear-layout-btn:hover {
      background: rgba(239, 68, 68, 0.22); border-color: #ef4444; color: #fff;
    }
    .ss-layouts-list { display: flex; flex-direction: column; gap: 10px; }
    .ss-layout-card {
      display: flex !important; align-items: center !important; gap: 14px; padding: 12px 16px;
      border-radius: 12px; background: #0e1526; border: 1.5px solid #1e293b;
      cursor: pointer; transition: all 0.15s ease; box-sizing: border-box;
    }
    .ss-layout-card:hover { border-color: #475569; background: #131d33; }
    .ss-layout-card.selected {
      border-color: #38bdf8; background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(14, 21, 38, 0.95));
      box-shadow: 0 4px 18px rgba(56, 189, 248, 0.15);
    }
    .ss-layout-icon-box {
      width: 44px; height: 58px; border-radius: 8px; background: #060a12;
      border: 1px solid #334155; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; overflow: hidden; padding: 4px; box-sizing: border-box;
    }
    .ss-wireframe.full { width: 100%; height: 100%; border: 1.5px solid #64748b; border-radius: 4px; }
    .ss-wireframe.stack { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 2px; }
    .ss-wf-bar { flex: 1; border: 1px solid #38bdf8; border-radius: 2px; background: rgba(56, 189, 248, 0.2); }
    .ss-wireframe.split { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 3px; }
    .ss-wf-half.top { flex: 1; border: 1px solid #eab308; border-radius: 2px; background: rgba(234, 179, 8, 0.2); }
    .ss-wf-half.bottom { flex: 1; border: 1px solid #facc15; border-radius: 2px; background: rgba(250, 204, 21, 0.3); }
    .ss-wireframe.cosmic { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .ss-wf-box { width: 80%; height: 75%; border: 1.5px solid #818cf8; border-radius: 3px; background: rgba(129, 140, 248, 0.25); }
    .ss-wireframe.book { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-around; }
    .ss-wf-badge { width: 65%; height: 4px; background: #facc15; border-radius: 2px; }
    .ss-wf-book { width: 60%; height: 26px; border: 1.5px solid #facc15; border-radius: 2px; background: #1e1b4b; }
    .ss-wf-cta { width: 75%; height: 5px; background: #ef4444; border-radius: 2px; }

    .ss-layout-info { flex: 1; min-width: 0; }
    .ss-layout-name { font-size: 0.86rem; font-weight: 800; color: #f8fafc; }
    .ss-layout-sub { font-size: 0.72rem; color: #94a3b8; margin-top: 3px; line-height: 1.4; }
    .ss-layout-radio {
      width: 18px; height: 18px; border-radius: 50%; border: 2px solid #475569;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ss-layout-radio.checked {
      border-color: #38bdf8; background: #38bdf8;
      box-shadow: inset 0 0 0 3px #0e1526;
    }

    /* TAB 3: Captions & Word-Pop */
    .ss-cta-toggle-pill {
      display: flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 999px;
      background: rgba(250, 204, 21, 0.12); border: 1px solid rgba(250, 204, 21, 0.35);
      font-size: 0.72rem; font-weight: 700; color: #fef08a; cursor: pointer;
    }
    .ss-caption-modes-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
    }
    @media (max-width: 700px) {
      .ss-caption-modes-grid { grid-template-columns: 1fr; }
    }
    .ss-mode-card {
      padding: 10px 12px; border-radius: 10px; background: #0e1526; border: 1.5px solid #1e293b;
      cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.15s ease;
    }
    .ss-mode-card:hover { border-color: #475569; background: #131d33; }
    .ss-mode-card.selected {
      border-color: #facc15; background: rgba(250, 204, 21, 0.12);
    }
    .ss-mode-head { display: flex; align-items: center; justify-content: space-between; }
    .ss-mode-title { font-size: 0.8rem; font-weight: 800; color: #f8fafc; }
    .ss-mode-check { font-size: 0.75rem; font-weight: 800; color: #facc15; }
    .ss-mode-desc { font-size: 0.68rem; color: #94a3b8; line-height: 1.35; }

    .ss-script-editor-card {
      display: flex; flex-direction: column; gap: 8px; padding: 14px;
      border-radius: 12px; background: #0e1526; border: 1px solid #1e293b;
    }
    .ss-editor-top { display: flex; align-items: center; justify-content: space-between; }
    .ss-editor-lbl { font-size: 0.74rem; font-weight: 700; color: #e2e8f0; }
    .ss-btn-sample {
      background: none; border: 1px solid #334155; color: #cbd5e1; border-radius: 6px;
      padding: 3px 9px; font-size: 0.68rem; cursor: pointer;
    }
    .ss-btn-sample:hover { border-color: #64748b; color: #fff; }
    .ss-script-textarea {
      width: 100%; padding: 10px 12px; font-size: 0.78rem; color: #f8fafc;
      background: #060a12; border: 1px solid #334155; border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      line-height: 1.5; resize: vertical; box-sizing: border-box;
    }
    .ss-editor-tip { font-size: 0.72rem; color: #94a3b8; }
    .ss-editor-tip code { color: #facc15; font-weight: 700; }

    /* TAB 4: Camera & Lens FX */
    .ss-toggles-strip { display: flex; gap: 10px; }
    @media (max-width: 700px) {
      .ss-toggles-strip { flex-direction: column; }
    }
    .ss-toggle-card {
      flex: 1; display: flex; align-items: flex-start; gap: 9px; padding: 10px 12px;
      border-radius: 10px; background: #0e1526; border: 1px solid #1e293b; cursor: pointer;
    }
    .ss-toggle-card input { margin-top: 3px; }
    .ss-toggle-card strong { display: block; font-size: 0.78rem; color: #f8fafc; }
    .ss-toggle-card span { font-size: 0.67rem; color: #94a3b8; line-height: 1.35; margin-top: 2px; display: block; }

    .ss-fields-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    @media (max-width: 700px) {
      .ss-fields-grid { grid-template-columns: 1fr; }
    }
    .ss-field-card {
      display: flex; flex-direction: column; gap: 6px; padding: 10px 12px;
      border-radius: 10px; background: #0e1526; border: 1px solid #1e293b;
    }
    .ss-field-lbl { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
    .ss-select {
      width: 100%; padding: 7px 9px; font-size: 0.76rem; color: #f8fafc;
      background: #060a12; border: 1px solid #334155; border-radius: 7px;
    }
    .ss-lens-finishes {
      display: flex; align-items: center; gap: 14px; padding: 10px 14px;
      border-radius: 10px; background: #0e1526; border: 1px solid #1e293b; flex-wrap: wrap;
    }
    .ss-lens-title { font-size: 0.74rem; font-weight: 700; color: #94a3b8; }
    .ss-lens-chip {
      display: flex; align-items: center; gap: 6px; font-size: 0.74rem; color: #cbd5e1; cursor: pointer;
    }

    /* Right Monitor Column */
    .ss-right-monitor { display: flex; flex-direction: column; }
    .ss-monitor-card {
      background: #070c14; border: 1px solid #1e293b; border-radius: 14px;
      padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .ss-mon-header { display: flex; align-items: center; justify-content: space-between; }
    .ss-mon-status { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; color: #f8fafc; }
    .ss-pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #10b981;
      box-shadow: 0 0 10px #10b981; animation: ssGlow 1.4s infinite ease-in-out;
    }
    @keyframes ssGlow { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

    .ss-shot-pills { display: flex; gap: 4px; }
    .ss-shot-btn {
      padding: 3px 8px; font-size: 0.68rem; font-weight: 700; color: #94a3b8;
      background: #0d1527; border: 1px solid #334155; border-radius: 6px; cursor: pointer;
    }
    .ss-shot-btn.on {
      color: #38bdf8; background: rgba(56, 189, 248, 0.18); border-color: #38bdf8;
    }

    /* Phone Screen Bezel */
    .ss-phone-bezel {
      position: relative; width: 100%; aspect-ratio: 9 / 16; max-height: 440px;
      margin: 0 auto; border-radius: 18px; padding: 8px; background: #020617;
      border: 3px solid #1e293b; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85);
      box-sizing: border-box; overflow: hidden;
    }
    .ss-phone-notch {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      width: 44px; height: 4px; background: #1e293b; border-radius: 99px; z-index: 10;
    }
    .ss-viewport {
      position: relative; width: 100%; height: 100%; border-radius: 12px;
      overflow: hidden; background: #000;
    }
    .ss-viewport.is-cosmic {
      background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #090d16 70%, #020617 100%);
    }

    .ss-media-layer { position: absolute; inset: 0; overflow: hidden; }
    .ss-media-element {
      width: 100%; height: 100%; object-fit: cover; display: block;
      will-change: transform, filter;
    }
    .ss-fallback-bg {
      width: 100%; height: 100%;
      background: radial-gradient(circle at 50% 35%, #1e293b, #0f172a 65%, #020617);
    }
    .ss-fallback-grid {
      width: 100%; height: 100%;
      background-image: linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    /* Ad Layout Overlays */
    .ss-layout-overlay { position: absolute; inset: 8px; pointer-events: none; z-index: 3; display: flex; flex-direction: column; }
    .ss-layout-overlay.stack-3 { gap: 6px; justify-content: space-between; }
    .ss-band {
      flex: 1; border: 1.5px solid rgba(56, 189, 248, 0.7); border-radius: 7px;
      background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center;
      font-size: 0.66rem; font-weight: 700; color: #e0f2fe; text-shadow: 0 1px 3px #000;
      animation: ssSlideIn 0.4s ease both;
    }
    .ss-band.b2 { animation-delay: 0.15s; }
    .ss-band.b3 { animation-delay: 0.3s; }
    @keyframes ssSlideIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }

    .ss-layout-overlay.doc-split { gap: 4px; }
    .ss-doc-head, .ss-doc-preview {
      flex: 1; border: 1.5px solid #eab308; border-radius: 7px; background: rgba(12, 10, 9, 0.45);
      display: flex; align-items: center; justify-content: center; font-size: 0.66rem; font-weight: 700; color: #fef08a;
    }
    .ss-doc-gold-banner {
      padding: 3px 6px; background: #eab308; color: #090d16; font-size: 0.62rem;
      font-weight: 800; text-align: center; border-radius: 4px;
    }

    .ss-layout-overlay.cosmic-card { align-items: center; justify-content: center; }
    .ss-glass-card {
      width: 90%; padding: 12px 10px; border-radius: 12px;
      background: rgba(15, 23, 42, 0.85); border: 1.5px solid #38bdf8;
      box-shadow: 0 0 24px rgba(56, 189, 248, 0.35);
      display: flex; flex-direction: column; gap: 8px; text-align: center;
    }
    .ss-glass-header { font-size: 0.68rem; font-weight: 800; color: #f8fafc; }
    .ss-glass-comp-strip {
      padding: 6px; border-radius: 8px; background: rgba(2, 6, 23, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.4); font-size: 0.76rem; font-weight: 700; color: #fff;
    }
    .ss-glass-footer { font-size: 0.64rem; color: #cbd5e1; }
    .acc-gold { color: #facc15; font-weight: 800; }
    .acc-cyan { color: #38bdf8; font-weight: 700; }

    .ss-layout-overlay.book-mockup { align-items: center; justify-content: space-around; padding: 14px 0 36px; }
    .ss-badge-sold {
      padding: 4px 10px; border-radius: 99px; background: rgba(15, 23, 42, 0.9);
      border: 1.5px solid #eab308; font-size: 0.66rem; font-weight: 800; color: #fff;
    }
    .ss-book-perspective {
      width: 58%; aspect-ratio: 3 / 4; border-radius: 8px;
      background: linear-gradient(145deg, #1e1b4b, #0f172a);
      border: 2.5px solid #facc15; box-shadow: -8px 12px 24px rgba(0, 0, 0, 0.75), 0 0 18px rgba(250, 204, 21, 0.25);
      transform: perspective(400px) rotateY(-14deg) rotateX(4deg);
      display: flex; align-items: center; justify-content: center;
    }
    .ss-book-inner { font-size: 0.78rem; font-weight: 800; color: #facc15; text-align: center; }

    /* Lens Finishes */
    .ss-lens-vignette {
      position: absolute; inset: 0; pointer-events: none; z-index: 4;
      background: radial-gradient(ellipse at center, transparent 48%, rgba(0, 0, 0, 0.72) 100%);
    }
    .ss-lens-grain {
      position: absolute; inset: 0; pointer-events: none; z-index: 4; opacity: 0.18;
      background-image: radial-gradient(rgba(255,255,255,0.6) 1px, transparent 0);
      background-size: 3px 3px;
    }
    .ss-lens-bar {
      position: absolute; left: 0; right: 0; height: 9%; background: #000; z-index: 5; pointer-events: none;
    }
    .ss-lens-bar.bar-top { top: 0; }
    .ss-lens-bar.bar-bottom { bottom: 0; }

    /* Particles */
    .ss-particles-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 4; overflow: hidden; }
    .ss-particle-item {
      position: absolute; font-size: 0.75rem; opacity: 0.8;
      animation: ssFloat 3.2s ease-in-out infinite alternate;
    }
    @keyframes ssFloat {
      from { transform: translateY(6px) scale(0.85); opacity: 0.45; }
      to { transform: translateY(-10px) scale(1.15); opacity: 0.95; }
    }

    /* Captions & Word-Pop */
    .ss-caption-box-layer {
      position: absolute; left: 6%; right: 6%; z-index: 6; pointer-events: none;
      display: flex; justify-content: center;
    }
    .ss-caption-box-layer.pos-top { top: 12%; }
    .ss-caption-box-layer.pos-center { top: 48%; transform: translateY(-50%); }
    .ss-caption-box-layer.pos-bottom { bottom: 18%; }
    .ss-caption-bubble {
      padding: 6px 12px; border-radius: 8px; border: 1.5px solid transparent;
      font-size: 0.82rem; font-weight: 800; text-align: center; line-height: 1.3;
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.85);
    }
    .ss-caption-box-layer.is-pop .ss-caption-bubble {
      font-size: 1.05rem; padding: 7px 14px;
      animation: ssPopAnim 0.35s cubic-bezier(0.2, 1.3, 0.4, 1);
    }
    @keyframes ssPopAnim {
      from { transform: scale(0.65); opacity: 0.4; }
      to { transform: scale(1); opacity: 1; }
    }

    /* CTA Button */
    .ss-cta-overlay {
      position: absolute; left: 0; right: 0; bottom: 6%; z-index: 7;
      display: flex; justify-content: center; pointer-events: none;
    }
    .ss-cta-pill {
      padding: 5px 14px; border-radius: 999px; background: #facc15; color: #090d16;
      border: 2px solid #fff; font-size: 0.74rem; font-weight: 900;
      box-shadow: 0 4px 14px rgba(250, 204, 21, 0.5);
      animation: ssPulseCta 1.1s ease-in-out infinite alternate;
    }
    .ss-cta-pill span { color: #dc2626; }
    @keyframes ssPulseCta { from { transform: scale(0.96); } to { transform: scale(1.06); } }

    /* HUD Bar */
    .ss-hud-bar {
      position: absolute; left: 6px; bottom: 6px; z-index: 8;
      display: flex; flex-wrap: wrap; gap: 4px; pointer-events: none;
    }
    .ss-hud-badge {
      font-size: 0.58rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;
      background: rgba(2, 6, 23, 0.85); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.12);
    }

    /* Monitor Footer Controls */
    .ss-mon-controls {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 6px 8px; background: #0c1424; border-radius: 8px; border: 1px solid #1e293b;
    }
    .ss-btn-play {
      padding: 4px 10px; font-size: 0.7rem; font-weight: 700; color: #cbd5e1;
      background: #172238; border: 1px solid #334155; border-radius: 6px; cursor: pointer;
    }
    .ss-btn-play:hover { color: #fff; border-color: #64748b; }
    .ss-mon-summary { display: flex; flex-direction: column; text-align: right; }
    .ss-mon-summary span { font-size: 0.72rem; font-weight: 700; color: #f8fafc; }
    .ss-mon-summary small { font-size: 0.63rem; color: #64748b; }

    .ss-btn-apply-primary {
      width: 100%; padding: 10px 14px; border-radius: 9px; border: none;
      background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
      color: #090d16; font-size: 0.82rem; font-weight: 800; cursor: pointer;
      box-shadow: 0 4px 16px rgba(250, 204, 21, 0.35); transition: all 0.15s ease;
    }
    .ss-btn-apply-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }

    /* Dialog Footer */
    .ss-foot {
      display: flex; align-items: center; justify-content: space-between; gap: 14px;
      padding: 14px 24px; background: #070c14; border-top: 1px solid #1e293b; flex-shrink: 0;
      flex-wrap: wrap;
    }
    .ss-foot-hint { font-size: 0.74rem; color: #94a3b8; }
    .ss-foot-hint code { color: #facc15; font-weight: 700; }
    .ss-foot-buttons { display: flex; gap: 10px; }
    .ss-btn-cancel {
      padding: 8px 18px; border-radius: 8px; border: 1px solid #334155;
      background: transparent; color: #cbd5e1; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .ss-btn-cancel:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
    .ss-btn-submit {
      padding: 8px 22px; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
      color: #090d16; font-size: 0.82rem; font-weight: 800; cursor: pointer;
      box-shadow: 0 4px 16px rgba(250, 204, 21, 0.35); transition: all 0.15s ease;
    }
    .ss-btn-submit:hover { filter: brightness(1.08); }
    @media (max-width: 680px) {
      .ss-backdrop { padding: 12px; }
      .ss-dialog { width: 100%; height: auto; max-height: calc(100svh - 24px); overflow-y: auto; }
      .ss-head, .ss-nav-bar, .ss-body, .ss-foot { padding: 12px; }
      .ss-head > div { min-width: 0; }
      .ss-head-tags, .ss-tabs, .ss-scope-switch, .ss-scope-pills,
      .ss-pane-header, .ss-card-header, .ss-mon-header, .ss-shot-pills,
      .ss-mon-controls, .ss-foot-buttons { flex-wrap: wrap; }
      .ss-body { flex: none; overflow: visible; }
      .ss-tab, .ss-card, .ss-btn-apply-primary, .ss-btn-submit { white-space: normal; }
      .ss-card { min-width: 0; max-width: 100%; }
      .ss-right-monitor { min-width: 0; }
      .ss-foot-buttons { width: 100%; }
      .ss-foot-buttons button { flex: 1 1 auto; }
    }
  `],
})
export class StyleStudioDialogComponent implements OnInit, OnDestroy {
  readonly state = inject(StudioStateService);

  readonly presets = STUDIO_STYLE_PRESETS;
  readonly motions = IMAGE_MOTIONS;
  readonly looks = IMAGE_LOOKS;
  readonly celebrations = CELEBRATIONS;

  readonly textModes: { id: AutoShortTextMode; label: string; hint: string }[] = [
    { id: 'HookAndWordPop', label: '⚡ Hook + 1-Word Pop', hint: 'Opening hook + rapid word-by-word punch' },
    { id: 'WordPop', label: '💬 1-Word Kinetic Pop', hint: 'Single/double word pop synced across shots' },
    { id: 'HookAndPerShot', label: '🎬 Hook + Per-Shot Card', hint: 'Opening headline + caption on each cut' },
    { id: 'PerShot', label: '📝 Per-Shot Captions', hint: 'One styled caption card per timeline clip' },
    { id: 'Hook', label: '🔥 Opening Hook Only', hint: 'Bold attention hook on the first clip' },
    { id: 'None', label: '🚫 No New Captions', hint: 'Keep existing TXT1 text overlays unchanged' },
  ];

  readonly activeTab = signal<'styles' | 'layouts' | 'captions' | 'camera_fx'>('styles');
  readonly scope = signal<'all' | 'selected'>('all');
  readonly selectedStyleId = signal<AutoShortStyle>('DirectResponse');
  readonly adLayout = signal<'none' | 'stack-3' | 'doc-split' | 'cosmic-card' | 'book-mockup'>('none');
  readonly layoutScope = signal<'intro' | 'selected' | 'all'>('intro');

  readonly applyMotion = signal(true);
  readonly applyLook = signal(true);
  readonly applyTransitions = signal(true);

  readonly overrideMotion = signal<ImageCameraMotion | 'preset'>('preset');
  readonly overrideLook = signal<ImageLook | 'preset'>('preset');
  readonly vignette = signal(true);
  readonly grain = signal(false);
  readonly cinemaBars = signal(false);
  readonly celebration = signal<CelebrationKind | 'none'>('cosmic');

  readonly textMode = signal<AutoShortTextMode>('HookAndWordPop');
  readonly addCtaButton = signal(true);
  readonly linesText = signal(STUDIO_STYLE_PRESETS[0].defaultLines.join('\n'));

  readonly isPreviewPaused = signal(false);
  readonly manualShotIdx = signal<number | null>(null);

  readonly activePreset = computed<StudioStylePreset>(() =>
    this.presets.find((p) => p.id === this.selectedStyleId()) ?? this.presets[0]
  );

  // Live 60fps animation clock for the preview stage
  private rafId: number | null = null;
  private startMs = performance.now();
  readonly elapsedSec = signal(0);
  readonly shotSwitchNonce = signal(0);
  private lastShotIdx = 0;

  readonly particleDots = [
    { id: 1, x: 14, y: 18, delay: 0 },
    { id: 2, x: 82, y: 24, delay: 0.4 },
    { id: 3, x: 28, y: 68, delay: 0.9 },
    { id: 4, x: 74, y: 72, delay: 1.3 },
    { id: 5, x: 48, y: 36, delay: 0.7 },
    { id: 6, x: 18, y: 84, delay: 1.6 },
    { id: 7, x: 88, y: 52, delay: 1.1 },
  ];

  ngOnInit(): void {
    const tick = (now: number) => {
      if (!this.isPreviewPaused()) {
        const sec = (now - this.startMs) / 1000;
        this.elapsedSec.set(sec);
        const shotIdx = Math.floor(sec / 2.6);
        if (shotIdx !== this.lastShotIdx && this.manualShotIdx() === null) {
          this.lastShotIdx = shotIdx;
          this.shotSwitchNonce.update((n) => n + 1);
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  selectPreset(p: StudioStylePreset): void {
    this.selectedStyleId.set(p.id);
    this.overrideMotion.set('preset');
    this.overrideLook.set('preset');
    this.vignette.set(p.vignette);
    this.grain.set(p.grain);
    this.cinemaBars.set(p.cinemaBars);
    this.celebration.set(p.defaultCelebration);
    this.textMode.set(p.defaultTextMode);
    this.addCtaButton.set(p.defaultAddCta);
    this.linesText.set(p.defaultLines.join('\n'));
    this.manualShotIdx.set(null);
  }

  resetLinesToPreset(): void {
    this.linesText.set(this.activePreset().defaultLines.join('\n'));
  }

  togglePlayPause(): void {
    this.isPreviewPaused.update((p) => !p);
  }

  setManualShot(idx: number): void {
    this.manualShotIdx.set(idx);
    this.shotSwitchNonce.update((n) => n + 1);
  }

  readonly previewClips = computed(() => {
    const inc = this.state.included().map((r) => r.clip);
    if (inc.length > 0) return inc;
    return this.state.autoShortSources().slice(0, 4);
  });

  readonly previewShotsCount = computed(() => Math.max(1, Math.min(4, this.previewClips().length || 3)));

  readonly previewShotIndex = computed(() => {
    const manual = this.manualShotIdx();
    if (manual !== null) return manual % this.previewShotsCount();
    const count = this.previewShotsCount();
    return Math.floor(this.elapsedSec() / 2.6) % count;
  });

  readonly currentPreviewClip = computed(() => {
    const list = this.previewClips();
    if (list.length === 0) return null;
    return list[this.previewShotIndex() % list.length];
  });

  readonly currentPreviewMotion = computed<ImageCameraMotion>(() => {
    if (!this.applyMotion()) return 'none';
    const ov = this.overrideMotion();
    if (ov !== 'preset') return ov;
    const motions = this.activePreset().motions;
    return motions[this.previewShotIndex() % motions.length] ?? 'zoom-in';
  });

  readonly currentPreviewLook = computed<ImageLook>(() => {
    if (!this.applyLook()) return 'none';
    const ov = this.overrideLook();
    return ov !== 'preset' ? ov : this.activePreset().look;
  });

  readonly currentPreviewTransition = computed<string>(() => {
    const list = this.activePreset().transitions;
    return list[this.previewShotIndex() % list.length] ?? 'Fade';
  });

  readonly currentTransitionClass = computed<string>(() => {
    if (!this.applyTransitions()) return 'cut';
    return this.currentPreviewTransition().toLowerCase();
  });

  readonly livePreviewFilter = computed<string>(() => {
    return lookFilter(this.currentPreviewLook()) || 'none';
  });

  readonly livePreviewTransform = computed<string>(() => {
    const motion = this.currentPreviewMotion();
    if (motion === 'none') return 'none';
    const progress = (this.elapsedSec() % 2.6) / 2.6;
    const t = this.elapsedSec();
    const p = this.activePreset();
    return cameraTransform(
      {
        motion,
        intensity: p.intensity,
        focusX: 50,
        focusY: 50,
        easing: p.easing,
        look: this.currentPreviewLook(),
        vignette: this.vignette(),
        grain: this.grain(),
        cinemaBars: this.cinemaBars(),
      },
      progress,
      t
    );
  });

  readonly celebrationGlyph = computed<string>(() => {
    const c = this.celebration();
    if (c === 'none') return '';
    return this.celebrations.find((x) => x.id === c)?.icon ?? '✨';
  });

  readonly livePreviewCaption = computed<{
    segments: AccentSegment[];
    color: string;
    accentColor: string;
    boxBg: string;
    borderColor: string;
    position: string;
    isPop: boolean;
  } | null>(() => {
    const mode = this.textMode();
    if (mode === 'None') return null;
    const lines = this.linesText()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return null;

    const p = this.activePreset();
    const shotIdx = this.previewShotIndex();
    const shotProgress = (this.elapsedSec() % 2.6) / 2.6;

    const isHookShot = (mode === 'Hook' || mode === 'HookAndPerShot' || mode === 'HookAndWordPop') && shotIdx === 0;
    if (mode === 'Hook' && shotIdx > 0) return null;

    if (isHookShot) {
      const st = p.hookTextStyle;
      return {
        segments: parseAccentSegments(lines[0]),
        color: st.color ?? '#ffffff',
        accentColor: st.accentColor ?? '#facc15',
        boxBg: st.boxColor ? `${st.boxColor}ee` : 'rgba(15,23,42,0.92)',
        borderColor: st.outlineColor ?? '#38bdf8',
        position: st.position ?? 'top',
        isPop: false,
      };
    }

    const line = lines[shotIdx % lines.length];
    if (mode === 'WordPop' || mode === 'HookAndWordPop') {
      const words = line.split(/\s+/).filter(Boolean);
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += 2) {
        chunks.push(words.slice(i, i + 2).join(' '));
      }
      const cIdx = Math.min(chunks.length - 1, Math.floor(shotProgress * chunks.length));
      const raw = chunks[cIdx] ?? line;
      const text = cIdx % 2 === 1 && !raw.includes('[') ? `[${raw}]` : raw;
      return {
        segments: parseAccentSegments(text.toUpperCase()),
        color: '#ffffff',
        accentColor: '#facc15',
        boxBg: 'rgba(9, 13, 22, 0.9)',
        borderColor: '#38bdf8',
        position: 'center',
        isPop: true,
      };
    }

    const st = p.captionTextStyle;
    return {
      segments: parseAccentSegments(line),
      color: st.color ?? '#ffffff',
      accentColor: st.accentColor ?? '#facc15',
      boxBg: st.boxColor ? `${st.boxColor}ee` : 'rgba(15,23,42,0.88)',
      borderColor: st.outlineColor ?? 'transparent',
      position: st.position ?? 'bottom',
      isPop: false,
    };
  });

  clearLayout(): void {
    this.adLayout.set('none');
    this.state.clearAdLayout();
  }

  applyToTimeline(): void {
    const opts: ApplyTimelineStyleOptions = {
      styleId: this.selectedStyleId(),
      scope: this.scope(),
      applyTransitions: this.applyTransitions(),
      applyMotion: this.applyMotion(),
      applyLook: this.applyLook(),
      overrideMotion: this.overrideMotion(),
      overrideLook: this.overrideLook(),
      vignette: this.vignette(),
      grain: this.grain(),
      cinemaBars: this.cinemaBars(),
      textMode: this.textMode(),
      scriptLines: this.linesText().split(/\r?\n/),
      addCtaButton: this.addCtaButton(),
      celebration: this.celebration(),
      adLayout: this.adLayout(),
      layoutScope: this.layoutScope(),
    };
    this.state.applyAutoShortStyleToTimeline(opts);
  }

  openBatchAutoShorts(): void {
    this.state.styleStudioOpen.set(false);
    this.state.autoShortsOpen.set(true);
  }

  close(): void {
    this.state.styleStudioOpen.set(false);
  }
}
