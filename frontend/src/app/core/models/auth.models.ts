export interface AnonymousAccessPolicy {
  enabled: boolean;
  allowRender: boolean;
  maxRenderDurationSeconds: number;
  maxAiCallsPerDay: number;
  allowYouTubePublish: boolean;
  allowCloudSave: boolean;
  allowGoogleDrivePublish?: boolean;
  maxGuestProjects?: number;
  allowGuestProjectCreation?: boolean;
}

export interface UiNavigationItemConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
  visibleToAnonymous: boolean;
  visibleToMembers: boolean;
  requiresAuth: boolean;
  isSensitive: boolean;
  enabled: boolean;
  description?: string;
}

export interface UiNavigationSettings {
  enforceGuestRestrictions: boolean;
  tabs: UiNavigationItemConfig[];
}

export interface StudioUser {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  roles: string[];
}

export interface StudioSession {
  isAuthenticated: boolean;
  userId: string;
  displayName?: string | null;
  email?: string | null;
  isAdmin: boolean;
  roles: string[];
  anonymousPolicy: AnonymousAccessPolicy;
  uiNavigation?: UiNavigationSettings;
}

export interface AdminAccessControl {
  mode: string;
  anonymousPolicy: AnonymousAccessPolicy;
  uiNavigation?: UiNavigationSettings;
  availableRoles: string[];
}

export interface UpdateAccessControlRequest {
  anonymousPolicy?: AnonymousAccessPolicy;
  uiNavigation?: UiNavigationSettings;
}

export interface UserScopeItem {
  userId: string;
  isGuest: boolean;
  displayName: string;
  projectCount: number;
  lastActiveUtc?: string | null;
  storageEstimate: string;
}

export interface UserScopesOverview {
  totalUsers: number;
  registeredMembers: number;
  guestSessions: number;
  totalProjects: number;
  scopes: UserScopeItem[];
}

export interface PurgeGuestProjectsRequest {
  daysInactive?: number;
}

export interface PurgeGuestProjectsResponse {
  projectsPurged: number;
  guestScopesCleaned: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
  twoFactorToken?: string;
  recoveryCode?: string;
}

export interface TwoFactorVerifyCredentials {
  twoFactorToken: string;
  code: string;
  method?: number;
}

export interface LoginResult {
  success: boolean;
  twoFactorRequired?: boolean;
  twoFactorToken?: string;
  requiresSessionConfirmation?: boolean;
  sessionConfirmationTicket?: string | null;
  error?: string;
  user?: StudioUser;
}

export interface AdminYouTubeChannelItem {
  id: string;
  channelId: string;
  channelTitle: string;
  ownerUserId: string;
  thumbnailUrl?: string | null;
  status: string;
  connectedAt: string;
  lastUsedAt?: string | null;
}
