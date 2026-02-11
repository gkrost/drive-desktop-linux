import { useEffect, useState } from 'react';
import { SyncStatus } from '../../../context/desktop/sync/domain/SyncStatus';
import { RemoteSyncStatus } from '../../main/remote-sync/helpers';

const statusesMap: Record<RemoteSyncStatus, SyncStatus> = {
  SYNCING: 'RUNNING',
  IDLE: 'STANDBY',
  SYNCED: 'STANDBY',
  SYNC_FAILED: 'FAILED',
  WAITING: 'STANDBY',
};

interface WaitStatus {
  waiting: boolean;
  remainingMs: number;
}

export default function useSyncStatus(onChange?: (currentState: SyncStatus) => void) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('RUNNING');
  const [waitStatus, setWaitStatus] = useState<WaitStatus>({ waiting: false, remainingMs: 0 });

  const setSyncStatusFromRemote = (remote: RemoteSyncStatus): void => {
    setSyncStatus(statusesMap[remote]);
  };

  useEffect(() => {
    window.electron.getRemoteSyncStatus().then(setSyncStatusFromRemote);

    const removeListener = window.electron.onRemoteSyncStatusChange(setSyncStatusFromRemote);

    return removeListener;
  }, []);

  useEffect(() => {
    const fetchWaitStatus = async () => {
      const status = await window.electron.getRemoteSyncWaitStatus();
      setWaitStatus(status);
    };

    fetchWaitStatus();

    const interval = setInterval(fetchWaitStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (onChange) onChange(syncStatus);
  }, [syncStatus]);

  return { syncStatus, waitStatus };
}
