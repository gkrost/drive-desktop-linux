export const SIX_HOURS_IN_MILLISECONDS = 6 * 60 * 60 * 1000;

export type RemoteSyncedFile = {
  id: number;
  uuid: string;
  fileId: string;
  type: string;
  size: number;
  bucket: string;
  folderId: number;
  folderUuid?: string;
  userId: number;
  modificationTime: string;
  createdAt: string;
  updatedAt: string;
  plainName: string;
  name?: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};

export type RemoteSyncedFolder = {
  type: string;
  id: number;
  parentId: number | null;
  bucket: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  uuid: string;
  plainName: string;
  name?: string;
  status: string;
};

export type RemoteSyncStatus = 'IDLE' | 'SYNCED' | 'SYNCING' | 'SYNC_FAILED' | 'WAITING';

export const NETWORK_ERROR_STATUSES = [429, 503, 504] as const;
export type NetworkErrorStatus = (typeof NETWORK_ERROR_STATUSES)[number];

export const isNetworkError = (status: number): status is NetworkErrorStatus => {
  return NETWORK_ERROR_STATUSES.includes(status as NetworkErrorStatus);
};
export type SyncConfig = {
  retry: number;
  maxRetries: number;
};

export const SYNC_OFFSET_MS = 0;

export const lastSyncedAtIsNewer = (itemUpdatedAt: Date, lastItemsSyncAt: Date, offset: number) => {
  return itemUpdatedAt.getTime() - offset > lastItemsSyncAt.getTime();
};

export function rewind(original: Date, milliseconds: number): Date {
  const shallowCopy = new Date(original.getTime());

  shallowCopy.setTime(shallowCopy.getTime() - milliseconds);

  return shallowCopy;
}
