import { Container } from 'diod';
import { basename } from 'path';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/create/FolderCreator';
import { SyncFolderMessenger } from '../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { NotifyFuseCallback } from './FuseCallback';

export class MakeDirectoryCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Make Directory');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(path: string, _mode: unknown) {
    // Mode parameter is unused as this is a no-op callback
    if (path.startsWith('/.Trash')) {
      return this.right();
    }

    try {
      await this.container.get(SyncFolderMessenger).creating(path);

      await this.container.get(FolderCreator).run(path);

      await this.container.get(SyncFolderMessenger).created(path);

      return this.right();
    } catch (throwed: unknown) {
      await this.container.get(SyncFolderMessenger).issue({
        error: 'FOLDER_CREATE_ERROR',
        cause: 'UNKNOWN',
        name: basename(path),
      });

      return this.left(throwed);
    }
  }
}
