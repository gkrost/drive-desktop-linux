import { ipcMain, dialog } from 'electron';
import { getFuseDriveState, startVirtualDrive, stopAndClearFuseApp, stopFuse, updateFuseApp } from '../drive';
import eventBus from './event-bus';
import { cleanupZombieMounts, getRootVirtualDrive } from './virtual-root-folder/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';

async function startVirtualDriveWithCleanup() {
  if (process.platform === 'linux') {
    try {
      const cleanupResult = await cleanupZombieMounts();

      if (cleanupResult) {
        if (cleanupResult.wasMounted && cleanupResult.unmounted) {
          logger.debug({ msg: '[ZOMBIE MOUNT] Detected and cleaned up zombie FUSE mount' });
          dialog.showMessageBox({
            type: 'info',
            title: 'Drive Cleanup',
            message: 'Internxt Drive',
            detail:
              'A previous instance of Internxt Drive was not closed properly. The drive has been cleaned up and is now ready to use.',
          });
        } else if (cleanupResult.wasMounted && cleanupResult.error) {
          logger.warn({ msg: `[ZOMBIE MOUNT] Detected zombie mount but could not unmount: ${cleanupResult.error}` });
          dialog.showMessageBox({
            type: 'warning',
            title: 'Drive Cleanup Required',
            message: 'Internxt Drive',
            detail: `A previous instance of Internxt Drive was not closed properly. Please manually run:\n\numount "${getRootVirtualDrive()}"\n\nThen restart the application.`,
          });
        }
      }
    } catch (error) {
      logger.error({ msg: '[ZOMBIE MOUNT] Error checking for zombie mounts:', error });
    }
  }

  await startVirtualDrive();
}

eventBus.on('USER_LOGGED_OUT', stopAndClearFuseApp);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearFuseApp);
eventBus.on('INITIAL_SYNC_READY', startVirtualDriveWithCleanup);
eventBus.on('REMOTE_CHANGES_SYNCHED', updateFuseApp);

ipcMain.handle('get-virtual-drive-status', () => {
  return getFuseDriveState();
});

ipcMain.handle('retry-virtual-drive-mount', async () => {
  await stopFuse();
  await startVirtualDrive();
});
