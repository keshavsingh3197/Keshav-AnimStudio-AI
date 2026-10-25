import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { UiNavigationItemConfig, UiNavigationSettings } from '../models/auth.models';
import { AuthService } from './auth.service';

export const DEFAULT_UI_NAVIGATION_TABS: UiNavigationItemConfig[] = [
  { id: 'projects', label: 'Projects', path: '/projects', icon: 'projects', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'Personal video projects and timeline workspace' },
  { id: 'shorts', label: 'Shorts', path: '/shorts', icon: 'shorts', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'Vertical video clips and batch shorts generator' },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: 'calendar', visibleToAnonymous: false, visibleToMembers: true, requiresAuth: true, isSensitive: false, enabled: true, description: 'Social media scheduling and release planning' },
  { id: 'effects', label: 'Effects', path: '/effects', icon: 'effects', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'Stingers, overlays, sound effects and visual elements' },
  { id: 'clips', label: 'Video Editor', path: '/clips', icon: 'video-editor', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'Scene sequence and clip editor' },
  { id: 'tools', label: 'Media Studio', path: '/tools', icon: 'media-studio', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'Audio/video chunking, extraction, and format conversions' },
  { id: 'release', label: 'Music Release', path: '/release', icon: 'music-release', visibleToAnonymous: false, visibleToMembers: true, requiresAuth: true, isSensitive: true, enabled: true, description: 'Music master distribution and visualizer publishing' },
  { id: 'youtube', label: 'YouTube', path: '/youtube', icon: 'youtube', visibleToAnonymous: false, visibleToMembers: true, requiresAuth: true, isSensitive: true, enabled: true, description: 'Direct YouTube channel integration and video analytics' },
  { id: 'details', label: 'Video Details', path: '/youtube/details', icon: 'details', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'SEO audit and video metadata generator' },
  { id: 'live', label: 'Go Live', path: '/live', icon: 'live', visibleToAnonymous: false, visibleToMembers: true, requiresAuth: true, isSensitive: true, enabled: true, description: 'YouTube live stream broadcaster' },
  { id: 'camera', label: 'Camera Studio', path: '/live/camera', icon: 'camera', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'Local camera feed capture and background removal' },
  { id: 'motion-copy', label: 'Motion Copy', path: '/motion-copy', icon: 'motion-copy', visibleToAnonymous: true, visibleToMembers: true, requiresAuth: false, isSensitive: false, enabled: true, description: 'Pose estimation and motion transfer to avatars' },
  { id: 'collab', label: 'Collab', path: '/collab', icon: 'collab', visibleToAnonymous: false, visibleToMembers: true, requiresAuth: true, isSensitive: false, enabled: true, description: 'Multi-creator collaboration and workspace sharing' },
  { id: 'logs', label: 'Logs', path: '/logs', icon: 'logs', visibleToAnonymous: false, visibleToMembers: false, requiresAuth: true, isSensitive: true, enabled: true, description: 'System diagnosis and server operational logs (Admins only)' },
  { id: 'admin', label: 'Settings', path: '/admin', icon: 'settings', visibleToAnonymous: false, visibleToMembers: false, requiresAuth: true, isSensitive: true, enabled: true, description: 'Platform administration and UI control matrix' },
];

@Injectable({ providedIn: 'root' })
export class UiNavigationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = environment.apiUrl;

  readonly settings = signal<UiNavigationSettings>({
    enforceGuestRestrictions: true,
    tabs: DEFAULT_UI_NAVIGATION_TABS,
  });

  /**
   * Dynamically filters which navigation items are visible based on the current user's role
   * (Guest vs Authenticated Member vs Admin) and platform administrative policies.
   */
  readonly visibleNavItems = computed<UiNavigationItemConfig[]>(() => {
    const isAuthed = this.auth.isAuthenticated();
    const isAdmin = this.auth.isAdmin();
    const tabs = this.settings()?.tabs || DEFAULT_UI_NAVIGATION_TABS;

    return tabs.filter((item) => {
      if (!item.enabled) return false;

      // Admin-only system tools
      if (item.id === 'admin') {
        return isAdmin;
      }
      if (item.id === 'logs') {
        return isAdmin;
      }

      // Anonymous guest logic: enforce visibility and sensitive feature suppression
      if (!isAuthed) {
        if (!item.visibleToAnonymous) return false;
        if (item.isSensitive && !this.auth.anonymousPolicy().allowYouTubePublish) {
          return false;
        }
        return true;
      }

      // Authenticated members
      return item.visibleToMembers;
    });
  });

  constructor() {
    this.fetchNavigationConfig().subscribe();
  }

  fetchNavigationConfig(): Observable<UiNavigationSettings> {
    return this.http
      .get<ApiResponse<UiNavigationSettings>>(`${this.base}/api/system/ui-navigation`)
      .pipe(
        map((r) => r.data ?? { enforceGuestRestrictions: true, tabs: DEFAULT_UI_NAVIGATION_TABS }),
        tap((cfg) => {
          if (cfg && cfg.tabs && cfg.tabs.length > 0) {
            this.settings.set(cfg);
          }
        }),
        catchError(() => {
          return of({ enforceGuestRestrictions: true, tabs: DEFAULT_UI_NAVIGATION_TABS });
        })
      );
  }

  canAccess(path: string): boolean {
    const isAuthed = this.auth.isAuthenticated();
    const isAdmin = this.auth.isAdmin();

    if (isAdmin) return true;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const tabs = this.settings()?.tabs || DEFAULT_UI_NAVIGATION_TABS;
    const item = tabs.find((t) => normalizedPath.startsWith(t.path));

    if (!item) return true;

    if (item.id === 'admin' || item.id === 'logs') {
      return isAdmin;
    }

    if (!isAuthed && (item.requiresAuth || item.isSensitive)) {
      return false;
    }

    return true;
  }
}

