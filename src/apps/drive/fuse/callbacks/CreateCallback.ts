import { Container } from 'diod';
import { NotifyFuseCallback } from './FuseCallback';
import { TemporalFileCreator } from '../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';

export class CreateCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Create');
  }

  async execute(path: string, _mode: unknown) {
    // Mode parameter is unused as this is a no-op callback
    await this.container.get(TemporalFileCreator).run(path);

    return this.right();
  }
}
