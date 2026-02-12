import { useEffect, useState } from "react";
import { SyncStatus } from "../../../context/desktop/sync/domain/SyncStatus";
import { RemoteSyncStatus } from "../../main/remote-sync/helpers";

const statusesMap: Record<RemoteSyncStatus, SyncStatus> = {
  SYNCING: "RUNNING",
  IDLE: "STANDBY",
  SYNCED: "STANDBY",
  SYNC_FAILED: "FAILED",
  WAITING: "STANDBY",
};

interface WaitStatus {
  waiting: boolean;
  remainingMs: number;
}

interface SyncProgress {
  totalFilesSynced: number;
  totalFoldersSynced: number;
  isSyncing: boolean;
}

export default function useSyncStatus(
  onChange?: (currentState: SyncStatus) => void,
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("RUNNING");
  const [waitStatus, setWaitStatus] = useState<WaitStatus>({
    waiting: false,
    remainingMs: 0,
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    totalFilesSynced: 0,
    totalFoldersSynced: 0,
    isSyncing: false,
  });

  const setSyncStatusFromRemote = (remote: RemoteSyncStatus): void => {
    const newStatus = statusesMap[remote];
    setSyncStatus(newStatus);

    // Update sync progress based on status
    setSyncProgress((prev) => ({
      ...prev,
      isSyncing: remote === "SYNCING",
    }));
  };

  const fetchSyncProgress = async () => {
    try {
      // Check if methods exist before calling them
      if (
        window.electron.getTotalFilesSynced &&
        window.electron.getTotalFoldersSynced
      ) {
        const [files, folders] = await Promise.all([
          window.electron.getTotalFilesSynced(),
          window.electron.getTotalFoldersSynced(),
        ]);

        setSyncProgress((prev) => ({
          ...prev,
          totalFilesSynced: files || 0,
          totalFoldersSynced: folders || 0,
        }));
      }
    } catch (error) {
      // Silently fail if methods don't exist yet
      console.debug("Sync progress not available:", error);
    }
  };

  useEffect(() => {
    window.electron.getRemoteSyncStatus().then(setSyncStatusFromRemote);

    const removeListener = window.electron.onRemoteSyncStatusChange(
      setSyncStatusFromRemote,
    );

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
    // Fetch sync progress periodically when syncing
    fetchSyncProgress();

    const interval = syncProgress.isSyncing
      ? setInterval(fetchSyncProgress, 2000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncProgress.isSyncing]);

  useEffect(() => {
    if (onChange) onChange(syncStatus);
  }, [syncStatus]);

  return { syncStatus, waitStatus, syncProgress };
}
