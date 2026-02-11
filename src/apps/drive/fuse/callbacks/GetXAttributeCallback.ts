import { FuseCallback, CallbackWithData } from './FuseCallback';
import { VirtualDrive } from '../../virtual-drive/VirtualDrive';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import Fuse from '@gcas/fuse';

const XATTR_SYSTEM_POSIX_ACL_PREFIX = 'system.posix_acl_';

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

  private isSystemAclAttribute(name: string): boolean {
    return name.startsWith(XATTR_SYSTEM_POSIX_ACL_PREFIX);
  }

  async execute(path: string, name: unknown, _size: unknown) {
    const attrName = String(name);

    if (this.isRootFolder(path) && this.isSystemAclAttribute(attrName)) {
      return this.left(new FuseErrorWithCode(GetXAttributeCallback.ENODATA, `No data available for ${attrName}`));
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

  async handle(...params: unknown[]): Promise<void> {
    const callback = params.pop() as CallbackWithData<Buffer>;

    if (this.debug.input) {
      logger.debug({ msg: `${this.name}: `, params });
    }

    const result = await this.executeAndCatch(params);

    if (result.isLeft()) {
      const error = result.getLeft();
      // Always pass a valid buffer to prevent native assertion failures
      // when returning error codes from getxattr callbacks
      const emptyBuffer = Buffer.alloc(1);
      if (this.debug.output) {
        logger.debug({ msg: `${this.name}`, error });
      }
      return callback(error.code, emptyBuffer);
    }

    const data = result.getRight();
    callback(FuseCallback.OK, data);
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
