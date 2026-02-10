import { FuseCallback } from './FuseCallback';
import { VirtualDrive } from '../../virtual-drive/VirtualDrive';
import { FuseError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { FuseCodes } from './FuseCodes';

export class GetXAttributeCallback extends FuseCallback<Buffer> {
  constructor(private readonly drive: VirtualDrive) {
    super('Get X Attribute', {
      input: true,
      elapsedTime: false,
      output: false,
    });
  }

  private isRootFolder(path: string): boolean {
    return path === '/';
  }

  async execute(path: string, _name: unknown, _size: unknown) {
    // Name and size parameters are unused as this is a no-op callback
    if (this.isRootFolder(path)) {
      return this.left(new FuseError(FuseCodes.ENOSYS, 'Cannot get the status of root folder'));
    }

    try {
      const isAvailableLocally = await this.drive.isLocallyAvailable(path);

      if (isAvailableLocally) {
        return this.right(Buffer.from('on_local'));
      }

      const buff = Buffer.from('on_remote');
      return this.right(buff);
    } catch (err: unknown) {
      return this.left(new FuseNoSuchFileOrDirectoryError(path));
    }
  }
}
