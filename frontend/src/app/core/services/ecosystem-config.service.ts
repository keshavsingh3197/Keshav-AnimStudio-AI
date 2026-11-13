import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { ChannelBranding } from './admin-settings.service';

export interface EcosystemWebsite {
  key: string;
  name: string;
  shortLabel: string;
  tagline?: string | null;
  url: string;
  description?: string | null;
  icon?: string | null;
  badgeText?: string | null;
  accentColor?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface EcosystemChannel {
  key: string;
  name: string;
  handle?: string | null;
  platform: string;
  channelId?: string | null;
  url: string;
  niche?: string | null;
  tagline?: string | null;
  description?: string | null;
  engineName?: string | null;
  visualsCredit?: string | null;
  hashtags: string[];
  tags: string[];
  retiredHandles: string[];
  retiredUrls: string[];
  isPrimary: boolean;
  sortOrder: number;
}

export interface EcosystemSocialLink {
  key: string;
  name: string;
  handle?: string | null;
  platform: string;
  url: string;
  description?: string | null;
}

export interface StudioEcosystemConfig {
  studioTitle: string;
  studioTagline: string;
  creatorName: string;
  creatorPortfolioUrl?: string | null;
  legalUpdatedDate?: string | null;
  copyrightNotice?: string | null;
  adminUrl: string;
  idpUrl: string;
  studioUrl: string;
  defaultChannelKey?: string | null;
  engineName: string;
  visualsCredit?: string | null;
  defaultBranding: ChannelBranding;
  websites: EcosystemWebsite[];
  channels: EcosystemChannel[];
  socialLinks: EcosystemSocialLink[];
  retiredChannelUrls: string[];
  retiredChannelNames: string[];
  syncedFromCentral: boolean;
  lastSyncedAt?: string | null;
}

export interface CentralChannelSyncSummary {
  syncedChannelsCount: number;
  createdBrandChannels: number;
  updatedBrandChannels: number;
  updatedStudioBranding: boolean;
  retiredChannelUrls: string[];
  retiredChannelNames: string[];
}

interface CentralConfigEnvelope {
  siteTitle?: string;
  values?: Record<string, string | null | undefined>;
  websites?: Array<{
    key?: string;
    name?: string;
    shortLabel?: string;
    tagline?: string;
    url?: string;
    description?: string;
    icon?: string;
    badgeText?: string;
    accentColor?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }>;
  channels?: Array<{
    key?: string;
    name?: string;
    handle?: string;
    platform?: string;
    channelId?: string;
    url?: string;
    niche?: string;
    tagline?: string;
    description?: string;
    engineName?: string;
    visualsCredit?: string;
    hashtags?: string[];
    tags?: string[];
    retiredHandles?: string[];
    retiredUrls?: string[];
    isPrimary?: boolean;
    isEnabled?: boolean;
    showInStudio?: boolean;
    showInFooter?: boolean;
    sortOrder?: number;
  }>;
}

const EMPTY_CONFIG: StudioEcosystemConfig = {
  studioTitle: 'AnimStudio',
  studioTagline: '',
  creatorName: '',
  creatorPortfolioUrl: null,
  legalUpdatedDate: null,
  copyrightNotice: null,
  adminUrl: environment.adminUrl,
  idpUrl: environment.idpUrl,
  studioUrl: '',
  defaultChannelKey: null,
  engineName: 'AnimStudio',
  visualsCredit: null,
  defaultBranding: {
    channelName: null,
    tagline: null,
    channelUrl: null,
    studioUrl: null,
    creatorUrl: null,
    creatorName: null,
    engineName: null,
    visualsCredit: null,
    hashtags: [],
    tags: [],
  },
  websites: [],
  channels: [],
  socialLinks: [],
  retiredChannelUrls: [],
  retiredChannelNames: [],
  syncedFromCentral: false,
  lastSyncedAt: null,
};

@Injectable({ providedIn: 'root' })
export class EcosystemConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl.replace(/\/$/, '')}/api`;

  readonly config = signal<StudioEcosystemConfig>(EMPTY_CONFIG);
  readonly loaded = signal(false);
  readonly syncing = signal(false);

  readonly websites = computed(() => this.config().websites);
  readonly channels = computed(() => this.config().channels);
  readonly socialLinks = computed(() => this.config().socialLinks);
  readonly creatorName = computed(() => this.config().creatorName);
  readonly creatorPortfolioUrl = computed(() => this.config().creatorPortfolioUrl ?? '');
  readonly legalUpdatedDate = computed(() => this.config().legalUpdatedDate ?? '');
  readonly copyrightNotice = computed(() => this.config().copyrightNotice ?? '');
  readonly retiredChannelUrls = computed(() => this.config().retiredChannelUrls);
  readonly retiredChannelNames = computed(() => this.config().retiredChannelNames);
  readonly studioBranding = computed<ChannelBranding>(() => this.config().defaultBranding ?? { hashtags: [], tags: [] });

  private inFlight = false;

  ensureLoaded(): void {
    if (this.loaded() || this.inFlight) return;
    this.inFlight = true;

    // Fetch both Studio API's merged ecosystem view and Central Admin config in parallel
    this.http
      .get<ApiResponse<StudioEcosystemConfig>>(`${this.apiBase}/system/ecosystem`)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.data) {
          this.config.set(res.data);
          this.loaded.set(true);
        }
        this.inFlight = false;
      });

    // Direct lightweight central fetch ensures top switcher bar renders immediately even during API cold start
    this.http
      .get<CentralConfigEnvelope>(`${environment.idpUrl.replace(/\/$/, '')}/config`)
      .pipe(catchError(() => of(null)))
      .subscribe((central) => {
        if (!central) return;
        this.mergeCentralEnvelope(central);
      });
  }

  refresh(): Observable<StudioEcosystemConfig | null> {
    this.syncing.set(true);
    return this.http
      .post<ApiResponse<StudioEcosystemConfig>>(`${this.apiBase}/system/ecosystem/refresh`, {})
      .pipe(
        map((res) => res?.data ?? null),
        tap((cfg) => {
          this.syncing.set(false);
          if (cfg) {
            this.config.set(cfg);
            this.loaded.set(true);
          }
        }),
        catchError(() => {
          this.syncing.set(false);
          return of(null);
        })
      );
  }

  syncToAiSettings(): Observable<CentralChannelSyncSummary | null> {
    this.syncing.set(true);
    return this.http
      .post<ApiResponse<CentralChannelSyncSummary>>(`${this.apiBase}/admin/ecosystem/sync`, {})
      .pipe(
        map((res) => res?.data ?? null),
        tap(() => {
          this.syncing.set(false);
          this.refresh().subscribe();
        }),
        catchError(() => {
          this.syncing.set(false);
          return of(null);
        })
      );
  }

  saveRetiredAliases(urls: string[], names: string[]): Observable<{ retiredChannelUrls: string[]; retiredChannelNames: string[] } | null> {
    return this.http
      .put<ApiResponse<{ retiredChannelUrls: string[]; retiredChannelNames: string[] }>>(
        `${this.apiBase}/admin/publishing/retired-aliases`,
        { retiredChannelUrls: urls, retiredChannelNames: names }
      )
      .pipe(
        map((res) => res?.data ?? null),
        tap(() => this.refresh().subscribe())
      );
  }

  private mergeCentralEnvelope(env: CentralConfigEnvelope): void {
    const vals = env.values ?? {};
    const current = this.config();
    const websites: EcosystemWebsite[] = (env.websites ?? [])
      .filter((w) => !!w.url && !!w.name)
      .map((w) => ({
        key: w.key ?? '',
        name: w.name ?? '',
        shortLabel: w.shortLabel || w.name || '',
        tagline: w.tagline ?? null,
        url: w.url ?? '',
        description: w.description ?? null,
        icon: w.icon ?? null,
        badgeText: w.badgeText ?? null,
        accentColor: w.accentColor ?? null,
        isPrimary: !!w.isPrimary,
        sortOrder: w.sortOrder ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const channels: EcosystemChannel[] = (env.channels ?? [])
      .filter((c) => c.isEnabled !== false && !!c.url && !!c.name)
      .map((c) => ({
        key: c.key ?? '',
        name: c.name ?? '',
        handle: c.handle ?? null,
        platform: c.platform ?? 'YouTube',
        channelId: c.channelId ?? null,
        url: c.url ?? '',
        niche: c.niche ?? null,
        tagline: c.tagline ?? null,
        description: c.description ?? null,
        engineName: c.engineName ?? null,
        visualsCredit: c.visualsCredit ?? null,
        hashtags: c.hashtags ?? [],
        tags: c.tags ?? [],
        retiredHandles: c.retiredHandles ?? [],
        retiredUrls: c.retiredUrls ?? [],
        isPrimary: !!c.isPrimary,
        sortOrder: c.sortOrder ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const primary = channels.find((c) => c.isPrimary) ?? channels[0];
    const socialLinks: EcosystemSocialLink[] = channels.map((c) => ({
      key: c.key,
      name: c.name,
      handle: c.handle ?? null,
      platform: c.platform,
      url: c.url,
      description: c.description ?? c.tagline ?? null,
    }));

    this.config.set({
      ...current,
      studioTitle: vals['studio.title'] || current.studioTitle,
      studioTagline: vals['studio.tagline'] || current.studioTagline,
      creatorName: vals['ecosystem.creatorName'] || current.creatorName,
      creatorPortfolioUrl: vals['ecosystem.creatorPortfolioUrl'] || current.creatorPortfolioUrl,
      legalUpdatedDate: vals['ecosystem.legalUpdatedDate'] || current.legalUpdatedDate,
      copyrightNotice: vals['ecosystem.copyrightNotice'] || current.copyrightNotice,
      adminUrl: vals['ecosystem.adminUrl'] || current.adminUrl,
      engineName: current.engineName || vals['studio.engineName'] || primary?.engineName || 'AnimStudio',
      visualsCredit: current.visualsCredit || vals['studio.visualsCredit'] || primary?.visualsCredit || null,
      websites: websites.length > 0 ? websites : current.websites,
      channels: channels.length > 0 ? channels : current.channels,
      socialLinks: socialLinks.length > 0 ? socialLinks : current.socialLinks,
      retiredChannelUrls:
        current.retiredChannelUrls.length > 0
          ? current.retiredChannelUrls
          : [...new Set(channels.flatMap((c) => c.retiredUrls ?? []))],
      retiredChannelNames:
        current.retiredChannelNames.length > 0
          ? current.retiredChannelNames
          : [...new Set(channels.flatMap((c) => c.retiredHandles ?? []))],
      syncedFromCentral: true,
    });
    this.loaded.set(true);
  }
}
