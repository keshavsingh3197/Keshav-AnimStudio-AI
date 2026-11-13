/**
 * Who makes the studio and where else to find them. The footer, the contact page and the
 * legal pages all read from here, so a new channel or a changed handle is one edit.
 *
 * Only public profile links belong here - never an address that should not be scraped.
 */
export interface SiteLink {
  id: 'portfolio' | 'youtube' | 'github' | string;
  label: string;
  /** Shown under the label on the contact page. */
  handle: string;
  url: string;
  description: string;
}

/**
 * Fallback containers are neutral/empty; runtime ecosystem data is fetched from Central Admin
 * (`/api/config`) and Studio's `/api/system/ecosystem` via `EcosystemConfigService`.
 */
export const CREATOR = {
  name: '',
  role: 'Creator & lead contributor',
  portfolioUrl: '',
} as const;

export const SOCIAL_LINKS: readonly SiteLink[] = [];

export const LEGAL_UPDATED = '';
