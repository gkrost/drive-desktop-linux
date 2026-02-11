import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { Optional } from '../../../../shared/types/Optional';
import { TemporalFileChunkReader } from '../../../../context/storage/TemporalFiles/application/read/TemporalFileChunkReader';
import { StorageFileChunkReader } from '../../../../context/storage/StorageFiles/application/read/StorageFileChunkReader';
import { CacheStorageFile } from '../../../../context/storage/StorageFiles/application/offline/CacheStorageFile';
import { shouldDownload } from './open-flags-tracker';

import Fuse from 'fuse-native';

export class ReadCallback {
  constructor(private readonly container: Container) {}

  async execute(
    path: string,
    _fd: unknown,
    buf: Buffer,
    len: number,
    pos: number,
    cb: (err: number | null, bytesRead: number) => void,
  ) {
    try {
      if (!buf || len <= 0 || pos < 0) {
        logger.error({ msg: '[ReadCallback] Invalid buffer parameters', path, len, pos });
        cb(Fuse.EINVAL, 0);
        return;
      }

      const virtualFile = await this.container.get(FirstsFileSearcher).run({
        path,
      });

      if (!virtualFile) {
        const document = await this.container.get(TemporalFileByPathFinder).run(path);

        if (!document) {
          logger.error({ msg: 'READ FILE NOT FOUND', path });
          cb(Fuse.ENOENT, 0);
          return;
        }

        const chunk = await this.container.get(TemporalFileChunkReader).run(document.path.value, len, pos);

        if (chunk.isPresent()) {
          const data = chunk.get();
          if (data && data.length > 0) {
            const bytesToCopy = Math.min(data.length, len);
            data.copy(buf, 0, 0, bytesToCopy);
            cb(null, bytesToCopy);
          } else {
            cb(null, 0);
          }
        } else {
          cb(null, 0);
        }
        return;
      }

      const bytesRead = await this.read(path, virtualFile.contentsId, buf, len, pos);
      cb(null, bytesRead);
    } catch (err: unknown) {
      logger.error({ msg: '[ReadCallback] Error reading file:', error: err, path });
      cb(Fuse.EIO, 0);
    }
  }

  private async read(
    path: string,
    contentsId: string,
    buffer: Buffer,
    length: number,
    position: number,
  ): Promise<number> {
    try {
      const readResult = await this.container.get(StorageFileChunkReader).run(contentsId, length, position);

      if (readResult.isPresent()) {
        const chunk = readResult.get();
        if (chunk && chunk.length > 0) {
          const bytesToCopy = Math.min(chunk.length, length);
          chunk.copy(buffer, 0, 0, bytesToCopy);
          logger.debug({ msg: '[ReadCallback] Read from cache:', path, bytesRead: bytesToCopy });
          return bytesToCopy;
        }
        return 0;
      }
    } catch (error: unknown) {
      logger.debug({ msg: '[ReadCallback] File not in cache:', path });
    }

    if (!shouldDownload(path)) {
      logger.debug({ msg: '[ReadCallback] Download blocked - system open (thumbnail):', path });
      return 0;
    }

    logger.debug({ msg: '[ReadCallback] Downloading file on-demand:', path });
    await this.container.get(CacheStorageFile).run(path);

    const readResultAfterDownload = await this.container.get(StorageFileChunkReader).run(contentsId, length, position);

    if (!readResultAfterDownload.isPresent()) {
      logger.error({ msg: '[ReadCallback] File not available after download:', path });
      return 0;
    }

    const chunk = readResultAfterDownload.get();
    if (chunk && chunk.length > 0) {
      const bytesToCopy = Math.min(chunk.length, length);
      chunk.copy(buffer, 0, 0, bytesToCopy);
      logger.debug({ msg: '[ReadCallback] Read after download:', path, bytesRead: bytesToCopy });
      return bytesToCopy;
    }
    return 0;
  }
}
