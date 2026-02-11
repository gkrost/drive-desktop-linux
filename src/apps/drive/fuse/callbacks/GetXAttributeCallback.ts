import { FuseCallback } from './FuseCallback';
import { VirtualDrive } from '../../virtual-drive/VirtualDrive';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import Fuse from '@gcas/fuse';

export class GetXAttributeCallback extends FuseCallback<Buffer> {
  private static readonly ENODATA = Fuse.ENODATA;

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

  async execute(path: string, name: unknown, _size: unknown) {
    const attrName = String(name);

    // Return ENODATA for system ACL attributes on root folder
    // to avoid assertion failures in native FUSE bindings
    if (this.isRootFolder(path) && attrName.startsWith('system.posix_acl_')) {
      return this.left(
        new FuseErrorWithCode(GetXAttributeCallback.ENODATA, 'No data available for ACL attribute on root'),
      );
    }

    try {
      const isAvailableLocally = await this.drive.isLocallyAvailable(path);

      if (isAvailableLocally) {
        return this.right(Buffer.from('on_local'));
      }

      const buff = Buffer.from('on_remote');
      return this.right(buff);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      return this.left(new FuseNoSuchFileOrDirectoryError(path));
    }
  }
}

class FuseErrorWithCode extends Error {
  public readonly code: number;
  public readonly timestamp: Date;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.timestamp = new Date();
  }
}
