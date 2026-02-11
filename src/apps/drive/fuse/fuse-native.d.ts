declare module 'fuse-native' {
  export const ENOSYS: number;
  export const ENOENT: number;
  export const EEXIST: number;
  export const EIO: number;
  export const EINVAL: number;
  export const EACCES: number;
  export const ENETDOWN: number;
  export const ENODATA: number;

  export interface FuseOptions {
    displayFolder?: string;
    debug?: boolean;
    force?: boolean;
    maxRead?: number;
    umask?: number;
    killOnCtrlC?: boolean;
    autoUnmount?: boolean;
    allowOther?: boolean;
    timeout?: number | boolean | { [key: string]: number | boolean };
  }

  export type FuseCallback = (err: number | null) => void;

  export type FuseOperations = Record<string, unknown>;

  export interface FuseInstance {
    open(cb: (err: unknown) => void): void;
    close(cb: (err: unknown) => void): void;
    on(event: string, listener: (...args: unknown[]) => void): this;
    mount(cb: (err: unknown) => void): void;
    unmount(cb: (err: unknown) => void): void;
  }

  export interface FuseStatic {
    new (mnt: string, ops?: FuseOperations | null, opts?: FuseOptions): FuseInstance;
    unmount(mnt: string, cb: (err: unknown) => void): void;
  }

  export default FuseStatic;
}
