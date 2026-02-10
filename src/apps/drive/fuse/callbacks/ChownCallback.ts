/*TODO: DELETE DEAD CODE */
import { NotifyFuseCallback } from './FuseCallback';

export class ChownCallback extends NotifyFuseCallback {
  constructor() {
    super('Chown', { input: true, output: true });
  }

  async execute(_path: unknown, _uid: unknown, _gid: unknown) {
    // Parameters are unused as this is a no-op callback
    return this.right();
  }
}
