export type LiveStreamOrientation = 'Landscape' | 'Portrait';
export type LiveStreamQuality = 'Hd720' | 'Hd1080';
export type LiveStreamItemKind = 'Video' | 'CoverAndAudio';
export type LiveStreamItemSource = 'Upload' | 'Render' | 'Asset' | 'Url' | 'ReleaseKit';
export type LiveStreamItemState = 'Waiting' | 'Fetching' | 'Preparing' | 'Ready' | 'Failed';
export type LiveStreamState =
  | 'Preparing' | 'Ready' | 'Connecting' | 'Live' | 'Reconnecting' | 'Ended' | 'Stopped' | 'Failed';
export type LiveStreamKeyState = 'Missing' | 'Saved' | 'Rejected' | 'Unreadable';

export interface LiveStreamSettings {
  /** An id from the server's own destination list; the server never takes a URL. */
  destination: string;
  orientation: LiveStreamOrientation;
  quality: LiveStreamQuality;
  /** Total plays of the whole playlist; 0 means until stopped. */
  loops: number;
  shuffle: boolean;
  autoReconnect: boolean;
  label?: string;
  rightsConfirmed: boolean;
}

/** One playlist entry as sent to the server. File fields name multipart parts, never paths. */
export interface LiveStreamItemRequest {
  source: LiveStreamItemSource;
  title?: string;
  fileField?: string;
  coverField?: string;
  renderJobId?: string;
  assetId?: string;
  coverAssetId?: string;
  url?: string;
  audioOnly?: boolean;
  releaseKitId?: string;
  useVisualizer?: boolean;
}

/** A playlist entry in the browser, before it is sent: files are still File objects. */
export interface PlaylistEntry {
  /** Stable id for the list's track-by and reordering. */
  key: string;
  source: LiveStreamItemSource;
  title: string;
  /** What the row shows under the title. */
  detail: string;
  file?: File;
  cover?: File;
  renderJobId?: string;
  assetId?: string;
  coverAssetId?: string;
  url?: string;
  audioOnly?: boolean;
  releaseKitId?: string;
  useVisualizer?: boolean;
  /** "Video", "Song", "Clip Studio export", ... */
  typeLabel: string;
  /** Known up front where the source says so; measured in the browser for uploads and on preview. */
  durationSeconds?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

/** Where the key comes from: a channel's saved key, or one pasted for this stream. Exactly one. */
export interface LiveStreamGoLive {
  channelId?: string;
  streamKey?: string;
}

export interface LiveStreamDestination {
  id: string;
  name: string;
  keyHelpUrl?: string | null;
}

export interface LiveStreamKeyStatus {
  channelId: string;
  destinationId: string;
  state: LiveStreamKeyState;
  masked: string;
  fingerprint?: string | null;
  createdAt?: string | null;
  rotatedAt?: string | null;
  lastUsedAt?: string | null;
  rejectedAt?: string | null;
}

export interface LiveStreamChannel {
  id: string;
  name: string;
  isDefault: boolean;
  keys: LiveStreamKeyStatus[];
}

export interface LiveStreamSetup {
  destinations: LiveStreamDestination[];
  channels: LiveStreamChannel[];
  canUseSavedKeys: boolean;
  canManageKeys: boolean;
  allowLinks: boolean;
  maxItems: number;
  maxStreamsPerUser: number;
}

export interface LiveStreamItemStatus {
  index: number;
  title: string;
  source: LiveStreamItemSource;
  kind: LiveStreamItemKind;
  state: LiveStreamItemState;
  progress: number;
  durationSeconds: number;
  message?: string | null;
}

export interface LiveStreamStatus {
  id: string;
  label: string;
  destinationId: string;
  destinationName: string;
  orientation: LiveStreamOrientation;
  quality: LiveStreamQuality;
  loops: number;
  shuffle: boolean;
  autoReconnect: boolean;
  state: LiveStreamState;
  canGoLive: boolean;
  channelId?: string | null;
  createdAt: string;
  liveSince?: string | null;
  endedAt?: string | null;
  playlistDurationSeconds: number;
  streamedSeconds: number;
  currentItem?: number | null;
  reconnects: number;
  speed?: number | null;
  message?: string | null;
  keyNeedsAttention: boolean;
  items: LiveStreamItemStatus[];
}

/** States in which a stream holds a worker on the server. */
export const BUSY_STATES: readonly LiveStreamState[] = ['Preparing', 'Connecting', 'Live', 'Reconnecting'];

/** States in which media is going out. */
export const SENDING_STATES: readonly LiveStreamState[] = ['Connecting', 'Live', 'Reconnecting'];
