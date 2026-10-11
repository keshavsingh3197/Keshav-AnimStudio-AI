import { Asset } from './api.models';

/** Mirrors the API's music picker contracts (api/music, api/projects/{id}/music). */

export interface MusicFilterOption {
  id: string;
  label: string;
}

export type MusicSort = 'Trending' | 'PopularMonth' | 'Top' | 'Newest' | 'BestMatch';

export interface MusicOptions {
  /** False until an admin sets Music:JamendoClientId. */
  configured: boolean;
  provider: string;
  genres: MusicFilterOption[];
  moods: MusicFilterOption[];
  tempos: MusicFilterOption[];
  lengths: MusicFilterOption[];
  sorts: MusicSort[];
}

export interface MusicSearchParams {
  q?: string;
  genre?: string;
  mood?: string;
  tempo?: string;
  length?: string;
  instrumental?: boolean;
  sort?: MusicSort;
  page?: number;
}

export interface MusicTrack {
  provider: string;
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  imageUrl?: string;
  /** An MP3 stream on the provider's own host, for previewing. */
  previewUrl?: string;
  pageUrl?: string;
  licenseCode: string;
  licenseVersion?: string;
  licenseUrl?: string;
  licenseClass: string;
  genres: string[];
  moods: string[];
  instruments: string[];
  instrumental: boolean;
  tempo?: string;
  releaseDate?: string;
  /** Whether this project may use it, decided by the server from the project's settings. */
  usable: boolean;
  blockedReason?: string;
  /** The library asset this track was added as, if it already was. */
  assetId?: string;
}

export interface MusicSearchResult {
  tracks: MusicTrack[];
  page: number;
  hasMore: boolean;
  sort: MusicSort;
}

export interface MusicImportResult {
  asset: Asset;
  alreadyAdded: boolean;
  usedAsBackground: boolean;
}
