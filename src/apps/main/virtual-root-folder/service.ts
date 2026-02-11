import { app, dialog, shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import configStore from '../config';
import eventBus from '../event-bus';

const execAsync = promisify(exec);

const ROOT_FOLDER_NAME = 'Internxt Drive';
const HOME_FOLDER_PATH = app.getPath('home');

const VIRTUAL_DRIVE_FOLDER = path.join(HOME_FOLDER_PATH, ROOT_FOLDER_NAME);

async function existsFolder(pathname: string): Promise<boolean> {
  try {
    await fs.access(pathname);

    return true;
  } catch {
    return false;
  }
}

export async function clearDirectory(pathname: string): Promise<boolean> {
  try {
    await fs.rm(pathname, { recursive: true });
    await fs.mkdir(pathname);

    return true;
  } catch {
    return false;
  }
}

async function isEmptyFolder(pathname: string): Promise<boolean> {
  const filesInFolder = await fs.readdir(pathname);

  return filesInFolder.length === 0;
}

function setSyncRoot(pathname: string): void {
  const pathNameWithSepInTheEnd = pathname[pathname.length - 1] === path.sep ? pathname : pathname + path.sep;
  const logEnginePath = path.join(app.getPath('appData'), 'internxt-drive', 'logs', 'node-win.txt');
  configStore.set('logEnginePath', logEnginePath);
  configStore.set('syncRoot', pathNameWithSepInTheEnd);
  configStore.set('lastSavedListing', '');
}

export async function setupRootFolder(n = 0): Promise<void> {
  setSyncRoot(VIRTUAL_DRIVE_FOLDER);
  return;
  const folderName = ROOT_FOLDER_NAME;

  const rootFolderName = folderName + (n ? ` (${n})` : '');
  const rootFolderPath = path.join(HOME_FOLDER_PATH, rootFolderName);

  const notExistsOrIsEmpty = !(await existsFolder(rootFolderPath)) || (await isEmptyFolder(rootFolderPath));

  if (notExistsOrIsEmpty) {
    await fs.mkdir(rootFolderPath, { recursive: true });
    setSyncRoot(rootFolderPath);
  } else {
    return setupRootFolder(n + 1);
  }
}

export function getRootVirtualDrive() {
  const syncFolderPath = configStore.get('syncRoot') || '';

  return syncFolderPath;
}

export async function chooseSyncRootWithDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const chosenPath = result.filePaths[0];

    setSyncRoot(chosenPath);
    eventBus.emit('SYNC_ROOT_CHANGED', chosenPath);

    return chosenPath;
  }

  return null;
}

export async function openVirtualDriveRootFolder() {
  const syncFolderPath = configStore.get('syncRoot') || '';

  if (process.platform === 'linux') {
    // shell.openPath is not working as intended with the mounted directory
    // this is only a workaround to fix it
    return new Promise<void>((resolve, reject) => {
      exec(`xdg-open "${syncFolderPath}"`, (error) => {
        if (error) {
          reject(error);
        }

        resolve();
      });
    });
  }

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}

export interface ZombieMountCleanupResult {
  wasMounted: boolean;
  unmounted: boolean;
  error?: string;
}

export async function checkAndCleanupZombieMount(mountPath: string): Promise<ZombieMountCleanupResult> {
  const result: ZombieMountCleanupResult = {
    wasMounted: false,
    unmounted: false,
  };

  if (process.platform !== 'linux') {
    return result;
  }

  try {
    const mountPathNormalized = path.normalize(mountPath);

    const mountsContent = await fs.readFile('/proc/mounts', 'utf-8');
    const isMounted = mountsContent.split('\n').some((line) => {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        const mountedPath = path.normalize(parts[1]);
        return mountedPath === mountPathNormalized;
      }
      return false;
    });

    if (!isMounted) {
      const folderExists = await existsFolder(mountPath);
      if (folderExists) {
        result.wasMounted = true;
        result.error = 'Mount not in /proc/mounts but folder exists - may be orphaned';
      }
      return result;
    }

    result.wasMounted = true;

    try {
      await execAsync(`umount "${mountPath}"`);
      result.unmounted = true;
    } catch (unmountError) {
      try {
        await execAsync(`fusermount -u "${mountPath}"`);
        result.unmounted = true;
      } catch (fusermountError) {
        result.error = `umount failed: ${unmountError instanceof Error ? unmountError.message : String(unmountError)}; fusermount also failed: ${fusermountError instanceof Error ? fusermountError.message : String(fusermountError)}`;
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

export async function cleanupZombieMounts(): Promise<ZombieMountCleanupResult | null> {
  const mountPath = getRootVirtualDrive() || VIRTUAL_DRIVE_FOLDER;

  return checkAndCleanupZombieMount(mountPath);
}
