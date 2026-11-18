import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';

export interface EffectiveLocalizationPolicyDto {
  siteKey: string;
  defaultLocale: string;
  enabledLocales: string[];
  allowVisitorLanguageSwitch: boolean;
  showLanguagePicker: boolean;
  forceLocale: boolean;
  controlledBy: string;
  overrideCentralLocalization: boolean;
  uiOnlyNote: boolean;
}

export interface LocalizationBundleResponse {
  locale: string;
  version: string;
  policy: EffectiveLocalizationPolicyDto;
  entries: Record<string, string>;
  source: string;
}

export interface StudioLocalizationConfig {
  overrideCentralLocalization: boolean;
  defaultLocale: string;
  enabledLocales: string[];
  allowVisitorLanguageSwitch: boolean;
  showLanguagePicker: boolean;
  forceLocale: boolean;
}

export interface SiteLocalizationAdminStateResponse {
  centralAdminPolicy: EffectiveLocalizationPolicyDto;
  localSettings: StudioLocalizationConfig;
  effectivePolicy: EffectiveLocalizationPolicyDto;
}

export interface UpdateSiteLocalizationRequest {
  overrideCentralLocalization: boolean;
  defaultLocale: string;
  enabledLocales: string[];
  allowVisitorLanguageSwitch: boolean;
  showLanguagePicker: boolean;
  forceLocale: boolean;
}

const STORAGE_KEY = 'studio_locale';

const BUILTIN_EN: Record<string, string> = {
  'studio.nav.projects': 'Projects',
  'studio.nav.story-agent': 'Story Agent',
  'studio.nav.comedy': 'Comedy',
  'studio.nav.shorts': 'Shorts',
  'studio.nav.calendar': 'Calendar',
  'studio.nav.effects': 'Effects',
  'studio.nav.clips': 'Video Editor',
  'studio.nav.tools': 'Media Studio',
  'studio.nav.release': 'Music Release',
  'studio.nav.songs': 'Songs',
  'studio.nav.youtube': 'YouTube',
  'studio.nav.queue': 'Publishing',
  'studio.nav.automation': 'Auto Post',
  'studio.nav.details': 'Video Details',
  'studio.nav.live': 'Go Live',
  'studio.nav.camera': 'Camera Studio',
  'studio.nav.motion-copy': 'Motion Copy',
  'studio.nav.animate': 'Animate Image',
  'studio.nav.collab': 'Collab',
  'studio.nav.logs': 'Logs',
  'studio.nav.admin': 'Settings',
  'studio.nav.settings': 'Settings',
  'studio.ui.signIn': 'Sign in',
  'studio.ui.signOut': 'Sign out',
  'studio.ui.credits': 'Credits',
  'studio.ui.activity': 'Activity',
  'studio.ui.themeLight': 'Light',
  'studio.ui.themeDark': 'Dark',
  'studio.language.label': 'Studio UI Language',
  'studio.language.uiOnlyNote': 'UI labels only — video & song audio language is set per job',
  'ecosystem.language.label': 'Language',
};

const BUILTIN_HI: Record<string, string> = {
  'studio.nav.projects': 'प्रोजेक्ट्स',
  'studio.nav.story-agent': 'स्टोरी एजेंट',
  'studio.nav.comedy': 'कॉमेडी',
  'studio.nav.shorts': 'शॉर्ट्स',
  'studio.nav.calendar': 'कैलेंडर',
  'studio.nav.effects': 'इफेक्ट्स',
  'studio.nav.clips': 'वीडियो एडिटर',
  'studio.nav.tools': 'मीडिया स्टूडियो',
  'studio.nav.release': 'म्यूजिक रिलीज़',
  'studio.nav.songs': 'गीत स्टूडियो',
  'studio.nav.youtube': 'यूट्यूब',
  'studio.nav.queue': 'पब्लिशिंग',
  'studio.nav.automation': 'ऑटो पोस्ट',
  'studio.nav.details': 'वीडियो विवरण',
  'studio.nav.live': 'गो लाइव',
  'studio.nav.camera': 'कैमरा स्टूडियो',
  'studio.nav.motion-copy': 'मोशन कॉपी',
  'studio.nav.animate': 'एनिमेट इमेज',
  'studio.nav.collab': 'कोलैब',
  'studio.nav.logs': 'लॉग्स',
  'studio.nav.admin': 'सेटिंग्स',
  'studio.nav.settings': 'सेटिंग्स',
  'studio.ui.signIn': 'साइन इन',
  'studio.ui.signOut': 'साइन आउट',
  'studio.ui.credits': 'क्रेडिट्स',
  'studio.ui.activity': 'गतिविधि',
  'studio.ui.themeLight': 'लाइट',
  'studio.ui.themeDark': 'डार्क',
  'studio.language.label': 'स्टूडियो UI भाषा',
  'studio.language.uiOnlyNote': 'केवल स्टूडियो UI लेबल — वीडियो व गीत की ऑडियो भाषा प्रत्येक जॉब से अलग तय होती है',
  'ecosystem.language.label': 'भाषा',
};

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly http = inject(HttpClient);
  private readonly doc = inject(DOCUMENT);
  private readonly apiBase = `${environment.apiUrl}/api`;

  readonly locale = signal<string>(this.readStoredLocale());
  readonly policy = signal<EffectiveLocalizationPolicyDto>({
    siteKey: 'studio',
    defaultLocale: 'en',
    enabledLocales: ['en', 'hi'],
    allowVisitorLanguageSwitch: true,
    showLanguagePicker: true,
    forceLocale: false,
    controlledBy: 'admin',
    overrideCentralLocalization: false,
    uiOnlyNote: true,
  });
  readonly entries = signal<Record<string, string>>(this.fallbackMap(this.locale()));

  readonly canSwitch = computed(() => {
    const p = this.policy();
    return p.allowVisitorLanguageSwitch && !p.forceLocale && (p.enabledLocales?.length ?? 0) > 1;
  });

  readonly showPicker = computed(() => this.policy().showLanguagePicker && this.canSwitch());
  readonly availableLanguages = computed(() => this.policy().enabledLocales ?? ['en', 'hi']);

  constructor() {
    this.loadBundle(this.locale());
  }

  t(key: string, fallback = ''): string {
    const map = this.entries();
    const hit = map[key];
    if (hit) return hit;
    const base = this.fallbackMap(this.locale());
    return base[key] ?? fallback ?? key;
  }

  tabLabel(tabId: string, fallback: string): string {
    return this.t(`studio.nav.${tabId}`, fallback);
  }

  setLocale(code: string): void {
    const norm = this.normalize(code);
    if (!this.canSwitch()) return;
    if (!this.availableLanguages().includes(norm)) return;
    try {
      localStorage.setItem(STORAGE_KEY, norm);
    } catch {
      // ignore storage errors
    }
    this.locale.set(norm);
    this.entries.set(this.fallbackMap(norm));
    this.applyDocumentLang(norm);
    this.loadBundle(norm);
  }

  loadBundle(code?: string): void {
    const requested = this.normalize(code ?? this.locale());
    this.applyDocumentLang(requested);
    this.http
      .get<ApiResponse<LocalizationBundleResponse> | LocalizationBundleResponse>(
        `${this.apiBase}/i18n/bundle/${encodeURIComponent(requested)}`,
      )
      .pipe(
        map((res) => ('data' in res && res.data ? res.data : (res as LocalizationBundleResponse))),
        catchError(() => of(null)),
      )
      .subscribe((bundle) => {
        if (!bundle) return;
        const effective = this.normalize(bundle.locale || bundle.policy?.defaultLocale || 'en');
        if (bundle.policy) {
          this.policy.set(bundle.policy);
        }
        this.locale.set(effective);
        this.entries.set({
          ...this.fallbackMap(effective),
          ...(bundle.entries ?? {}),
        });
        this.applyDocumentLang(effective);
      });
  }

  getAdminState() {
    return this.http
      .get<ApiResponse<SiteLocalizationAdminStateResponse>>(`${this.apiBase}/settings/localization`)
      .pipe(map((r) => r.data!));
  }

  updateAdminState(req: UpdateSiteLocalizationRequest) {
    return this.http
      .put<ApiResponse<SiteLocalizationAdminStateResponse>>(`${this.apiBase}/settings/localization`, req)
      .pipe(
        map((r) => {
          const state = r.data!;
          this.applyPolicyUpdate(state.effectivePolicy);
          return state;
        }),
      );
  }

  applyPolicyUpdate(effectivePolicy: EffectiveLocalizationPolicyDto): void {
    this.policy.set(effectivePolicy);
    if (effectivePolicy.forceLocale) {
      this.locale.set(effectivePolicy.defaultLocale);
    }
    this.loadBundle(this.locale());
  }

  private applyDocumentLang(code: string): void {
    try {
      this.doc.documentElement.lang = code;
    } catch {
      // SSR/test safe
    }
  }

  private readStoredLocale(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return this.normalize(saved);
    } catch {
      // ignore
    }
    return 'en';
  }

  private normalize(code: string): string {
    const raw = (code || '').trim().toLowerCase();
    if (raw.startsWith('hi')) return 'hi';
    return 'en';
  }

  private fallbackMap(code: string): Record<string, string> {
    return code === 'hi' ? { ...BUILTIN_EN, ...BUILTIN_HI } : { ...BUILTIN_EN };
  }
}
