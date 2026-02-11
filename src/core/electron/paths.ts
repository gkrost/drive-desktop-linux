import { app } from 'electron';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const HOME_FOLDER_PATH = app.getPath('home');
const LOGS = join(HOME_FOLDER_PATH, '.config', 'internxt', 'logs');

if (!existsSync(LOGS)) {
  mkdirSync(LOGS, { recursive: true });
}

export const PATHS = {
  HOME_FOLDER_PATH,
  LOGS,
};
