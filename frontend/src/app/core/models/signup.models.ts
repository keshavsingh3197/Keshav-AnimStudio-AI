/** The sign-in dialog's "Request access" form. `website` is the hidden field only a script fills in. */
export interface SignupRequestPayload {
  email: string;
  displayName: string;
  password: string;
  reason?: string;
  website?: string;
}

export interface SignupReceipt {
  received: boolean;
  message: string;
}

export type SignupStatus = 'Pending' | 'Approved' | 'Rejected' | 'Unknown';

/** One access request as an administrator sees it. The password is never part of it. */
export interface AdminSignupItem {
  id: string;
  email: string;
  displayName: string;
  reason: string | null;
  status: SignupStatus;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  createdUserId: string | null;
}

export interface AdminSignupSummary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

/** An approved account that holds the AnimStudio-only role and no other. */
export interface AdminMember {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
