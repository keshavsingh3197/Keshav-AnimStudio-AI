export interface AnonymousAccessPolicy {
  enabled: boolean;
  allowRender: boolean;
  maxRenderDurationSeconds: number;
  maxAiCallsPerDay: number;
  allowYouTubePublish: boolean;
  allowCloudSave: boolean;
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
}

export interface AdminAccessControl {
  mode: string;
  anonymousPolicy: AnonymousAccessPolicy;
  availableRoles: string[];
}

export interface UpdateAccessControlRequest {
  anonymousPolicy?: AnonymousAccessPolicy;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
  recoveryCode?: string;
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

