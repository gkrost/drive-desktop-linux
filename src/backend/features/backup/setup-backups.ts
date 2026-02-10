import { ipcMain } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { userHasBackupsEnabled } from './utils/user-has-backups-enabled';
import { backupErrorsTracker, status, backupManager } from '.';
import { registerBackupConfigurationIpcHandlers } from './ipc/register-backup-configuration-ipc-handlers';
import { registerBackupFatalErrorsIpcHandler } from './ipc/register-backup-fatal-errors-ipc-handler';
import { registerBackupProcessStatusIpcHandler } from './ipc/register-backup-process-status-ipc-handler';
import { registerEventBusBackupHandlers } from './ipc/register-event-bus-backup-handlers';
import { registerBackupLifecycleIpcHandlers } from './ipc/register-backup-lifecycle-ipc-handlers';

/** Register stub IPC handlers that the renderer always expects,
 *  regardless of whether the backup feature is available. */
function registerBackupStubHandlers() {
  const stubHandlers: Record<string, () => unknown> = {
    'get-backup-fatal-errors': () => [],
    'user.get-has-discovered-backups': () => true,
  };

  for (const [channel, handler] of Object.entries(stubHandlers)) {
    // Only register if not already registered by full backup setup
    try {
      ipcMain.handle(channel, handler);
    } catch {
      // Already registered — ignore
    }
  }
}

export async function setUpBackups() {
  logger.debug({ tag: 'BACKUPS', msg: 'Setting up backups' });
  const userHasBackupFeatureAvailable = userHasBackupsEnabled();

  if (!userHasBackupFeatureAvailable) {
    logger.debug({ tag: 'BACKUPS', msg: 'User does not have the backup feature available' });
    registerBackupStubHandlers();
    return;
  }

  registerBackupFatalErrorsIpcHandler(backupErrorsTracker);
  registerBackupProcessStatusIpcHandler(status);
  registerBackupConfigurationIpcHandlers(backupManager);
  registerEventBusBackupHandlers(userHasBackupFeatureAvailable);
  registerBackupLifecycleIpcHandlers(userHasBackupFeatureAvailable);

  if (userHasBackupFeatureAvailable) {
    logger.debug({ tag: 'BACKUPS', msg: 'Start service' });
    await backupManager.startScheduler();

    if (backupManager.isScheduled()) {
      logger.debug({ tag: 'BACKUPS', msg: 'Backups schedule is set' });
    }

    logger.debug({ tag: 'BACKUPS', msg: 'Backups ready' });
  }
}
