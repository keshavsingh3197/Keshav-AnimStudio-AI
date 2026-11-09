/**
 * Who makes the studio and where else to find them. The footer, the contact page and the
 * legal pages all read from here, so a new channel or a changed handle is one edit.
 *
 * Only public profile links belong here - never an address that should not be scraped.
 */
export interface SiteLink {
  id: 'portfolio' | 'youtube' | 'github';
  label: string;
  /** Shown under the label on the contact page. */
  handle: string;
  url: string;
  description: string;
}

export const CREATOR = {
  name: 'Keshav Singh',
  role: 'Creator & lead contributor',
  portfolioUrl: 'https://keshavsingh.in/',
} as const;

export const SOCIAL_LINKS: readonly SiteLink[] = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    handle: 'keshavsingh.in',
    url: 'https://keshavsingh.in/',
    description: 'Projects, background and the quickest way to get in touch with the creator.',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    handle: '@OmkarShivBhakti',
    url: 'https://youtube.com/@OmkarShivBhakti',
    description: 'Omkar Shiv Bhakti devotional 3D animations, made end to end in AnimStudio.',
  },
  {
    id: 'github',
    label: 'GitHub',
    handle: 'keshavsingh3197',
    url: 'https://github.com/keshavsingh3197',
    description: 'Open source work and the shared packages behind the keshavsingh.in apps.',
  },
];

/** Bump when the Terms or Privacy text changes in substance. */
export const LEGAL_UPDATED = '1 November 2026';
