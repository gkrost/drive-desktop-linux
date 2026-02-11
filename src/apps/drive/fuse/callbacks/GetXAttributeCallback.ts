import { FuseCallback } from './FuseCallback';
import { VirtualDrive } from '../../virtual-drive/VirtualDrive';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(path: string, name: unknown, _size: unknown) {
    const attrName = String(name);

    // Ignore certain system attributes that cause issues with FUSE on root
    if (this.isRootFolder(path)) {
      // Return empty buffer for ACL attributes on root folder
      // to avoid assertion failures in native FUSE bindings
      if (attrName.startsWith('system.posix_acl_')) {
        return this.right(Buffer.from(''));
      }
      // Return on_remote for other attributes on root
      return this.right(Buffer.from('on_remote'));
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
