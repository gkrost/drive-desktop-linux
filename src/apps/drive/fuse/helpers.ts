import { exec } from 'child_process';
import Fuse from 'fuse-native';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export function unmountFusedDirectory(mountPoint: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`umount ${mountPoint}`, (error: unknown, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(new Error(stderr));
        return;
      }

      resolve(stdout);
    });
  });
}

export function mountPromise(fuse: InstanceType<typeof Fuse>): Promise<void> {
  return new Promise((resolve, reject) => {
    const fuseInstance = fuse as unknown as { open(cb: (err: unknown) => void): void };

    fuseInstance.open((err: unknown) => {
      if (err) {
        logger.error({ msg: '[FUSE] mountPromise error:', error: err });
        reject(err);
        return;
      }
      logger.debug({ msg: '[FUSE] mountPromise resolved successfully' });
      resolve();
    });
  });
}

export function unmountPromise(fuse: InstanceType<typeof Fuse>): Promise<void> {
  return new Promise((resolve, reject) => {
    const fuseInstance = fuse as unknown as { close(cb: (err: unknown) => void): void };

    fuseInstance.close((err: unknown) => {
      if (err) {
        logger.error({ msg: '[FUSE] unmountPromise error:', error: err });
        reject(err);
        return;
      }
      logger.debug({ msg: '[FUSE] unmountPromise resolved successfully' });
      resolve();
    });
  });
}
