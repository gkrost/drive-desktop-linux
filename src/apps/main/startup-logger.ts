import { app } from 'electron';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '../../core/utils/utils';
import { PATHS } from '../../core/electron/paths';
import { version as osVersion, release as osRelease, arch, platform, hostname } from 'os';

const SEPARATOR = '='.repeat(72);
const SECTION = '-'.repeat(40);

function mask(value: string | undefined): string {
  if (!value) return '[NOT SET]';
  if (value.length <= 4) return '****';
  return value.substring(0, 4) + '***';
}

function maskLong(value: string | undefined): string {
  if (!value) return '[NOT SET]';
  if (value.length > 20) return `[SET, ${value.length} chars]`;
  return mask(value);
}

function formatUrl(value: string | undefined): string {
  if (!value) return '[NOT SET]';
  return value;
}

function buildLogLines(lines: string[]): string {
  return lines.join('\n');
}

function writeToLogFile(content: string) {
  try {
    const logsDir = PATHS.LOGS;
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    const logFile = join(logsDir, 'startup-config.log');
    const timestamp = new Date().toISOString();
    writeFileSync(logFile, `[${timestamp}]\n${content}\n`, { flag: 'w' });
  } catch (err) {
    logger.warn({ msg: 'Failed to write startup config log file', err });
  }
}

export function logPreStartupConfig(): void {
  const lines: string[] = [
    SEPARATOR,
    '  INTERNXT DRIVE DESKTOP - PRE-STARTUP CONFIGURATION',
    SEPARATOR,
    '',
    `${SECTION} App Metadata ${SECTION}`,
    `  client:           ${INTERNXT_CLIENT}`,
    `  version:          ${INTERNXT_VERSION}`,
    `  electron:         ${process.versions.electron ?? 'unknown'}`,
    `  node:             ${process.versions.node}`,
    `  chrome:           ${process.versions.chrome ?? 'unknown'}`,
    `  v8:               ${process.versions.v8 ?? 'unknown'}`,
    `  platform:         ${platform()}`,
    `  arch:             ${arch()}`,
    `  os:               ${osVersion()} (${osRelease()})`,
    `  hostname:         ${hostname()}`,
    `  pid:              ${process.pid}`,
    `  isPackaged:       ${app.isPackaged}`,
    `  NODE_ENV:         ${process.env.NODE_ENV ?? '[NOT SET]'}`,
    `  userData:         ${app.getPath('userData')}`,
    `  logsPath:         ${PATHS.LOGS}`,
    '',
    `${SECTION} Server URLs / Endpoints ${SECTION}`,
    `  NEW_DRIVE_URL:              ${formatUrl(process.env.NEW_DRIVE_URL)}`,
    `  DRIVE_API_URL:              ${formatUrl(process.env.DRIVE_API_URL)}`,
    `  PAYMENTS_URL:               ${formatUrl(process.env.PAYMENTS_URL)}`,
    `  BRIDGE_URL:                 ${formatUrl(process.env.BRIDGE_URL)}`,
    `  NOTIFICATIONS_URL:          ${formatUrl(process.env.NOTIFICATIONS_URL)}`,
    `  BUG_REPORTING_URL:          ${formatUrl(process.env.BUG_REPORTING_URL)}`,
    `  RUDDERSTACK_DATA_PLANE_URL: ${formatUrl(process.env.RUDDERSTACK_DATA_PLANE_URL)}`,
    '',
    `${SECTION} Secrets (presence check) ${SECTION}`,
    `  CRYPTO_KEY:                 ${mask(process.env.CRYPTO_KEY)}`,
    `  MAGIC_IV:                   ${mask(process.env.MAGIC_IV)}`,
    `  MAGIC_SALT:                 ${mask(process.env.MAGIC_SALT)}`,
    `  NEW_CRYPTO_KEY:             ${mask(process.env.NEW_CRYPTO_KEY)}`,
    `  INTERNXT_DESKTOP_HEADER_KEY: ${mask(process.env.INTERNXT_DESKTOP_HEADER_KEY)}`,
    '',
    `${SECTION} Analytics ${SECTION}`,
    `  APP_SEGMENT_KEY:            ${mask(process.env.APP_SEGMENT_KEY)}`,
    `  APP_SEGMENT_KEY_TEST:       ${mask(process.env.APP_SEGMENT_KEY_TEST)}`,
    `  RUDDERSTACK_KEY:            ${mask(process.env.RUDDERSTACK_KEY)}`,
    '',
    `${SECTION} Runtime Parameters ${SECTION}`,
    `  LOCK_REFRESH_INTERVAL:      ${process.env.LOCK_REFRESH_INTERVAL ?? '[NOT SET]'}`,
    '',
    `${SECTION} Hardcoded URLs ${SECTION}`,
    '  Web app:       https://drive.internxt.com',
    '  Login:         https://drive.internxt.com/login?universalLink=true',
    '  Signup:        https://drive.internxt.com/new',
    '  Plans:         https://drive.internxt.com/preferences?tab=plans',
    '  Help:          https://help.internxt.com',
    '',
    `${SECTION} HTTP Headers (template) ${SECTION}`,
    `  internxt-client:             ${INTERNXT_CLIENT}`,
    `  internxt-version:            ${INTERNXT_VERSION}`,
    `  x-internxt-desktop-header:   ${mask(process.env.INTERNXT_DESKTOP_HEADER_KEY)}`,
    '  content-type:                application/json; charset=utf-8',
    '',
    SEPARATOR,
  ];

  const content = buildLogLines(lines);
  logger.debug({ msg: '\n' + content });
  writeToLogFile(content);
}

export function logPostStartupConfig(configStore: { get: (key: string) => unknown }): void {
  const syncRoot = configStore.get('syncRoot') as string | undefined;
  const preferedTheme = configStore.get('preferedTheme') as string | undefined;
  const preferedLanguage = configStore.get('preferedLanguage') as string | undefined;
  const bearerToken = configStore.get('bearerToken') as string | undefined;
  const newToken = configStore.get('newToken') as string | undefined;
  const mnemonic = configStore.get('mnemonic') as string | undefined;
  const userData = configStore.get('userData') as Record<string, unknown> | undefined;
  const backupsEnabled = configStore.get('backupsEnabled');
  const backupInterval = configStore.get('backupInterval');
  const lastBackup = configStore.get('lastBackup');
  const deviceUUID = configStore.get('deviceUUID') as string | undefined;
  const clientId = configStore.get('clientId') as string | undefined;
  const nautilusExtensionVersion = configStore.get('nautilusExtensionVersion');
  const shouldFixDanglingFiles = configStore.get('shouldFixDanglingFiles');
  const availableUserProducts = configStore.get('availableUserProducts');
  const storageMigrationDate = configStore.get('storageMigrationDate') as string | undefined;
  const fixDeploymentDate = configStore.get('fixDeploymentDate') as string | undefined;

  const userEmail =
    userData && typeof userData === 'object' && 'email' in userData ? String(userData.email) : undefined;

  const lines: string[] = [
    SEPARATOR,
    '  INTERNXT DRIVE DESKTOP - POST-LOGIN CONFIGURATION',
    SEPARATOR,
    '',
    `${SECTION} Authentication ${SECTION}`,
    `  bearerToken:       ${maskLong(bearerToken)}`,
    `  newToken:          ${maskLong(newToken)}`,
    `  mnemonic:          ${maskLong(mnemonic)}`,
    `  user email:        ${userEmail ? mask(userEmail) : '[NOT SET]'}`,
    '',
    `${SECTION} Device & Client ${SECTION}`,
    `  deviceUUID:        ${deviceUUID || '[NOT SET]'}`,
    `  clientId:          ${clientId || '[NOT SET]'}`,
    '',
    `${SECTION} Sync & Virtual Drive ${SECTION}`,
    `  syncRoot:          ${syncRoot || '[NOT SET]'}`,
    '',
    `${SECTION} Backup Configuration ${SECTION}`,
    `  backupsEnabled:    ${backupsEnabled}`,
    `  backupInterval:    ${backupInterval} ms`,
    `  lastBackup:        ${lastBackup === -1 ? 'never' : new Date(lastBackup as number).toISOString()}`,
    '',
    `${SECTION} UI Preferences ${SECTION}`,
    `  theme:             ${preferedTheme || 'system'}`,
    `  language:          ${preferedLanguage || '[default]'}`,
    '',
    `${SECTION} Feature Flags ${SECTION}`,
    `  nautilusExtVer:    ${nautilusExtensionVersion}`,
    `  fixDanglingFiles:  ${shouldFixDanglingFiles}`,
    `  userProducts:      ${availableUserProducts ? '[SET]' : '[NOT SET]'}`,
    `  storageMigration:  ${storageMigrationDate || '[NOT SET]'}`,
    `  fixDeployment:     ${fixDeploymentDate || '[NOT SET]'}`,
    '',
    SEPARATOR,
  ];

  const content = buildLogLines(lines);
  logger.debug({ msg: '\n' + content });

  // Append to the same log file
  try {
    const logFile = join(PATHS.LOGS, 'startup-config.log');
    const timestamp = new Date().toISOString();
    writeFileSync(logFile, `\n[${timestamp}]\n${content}\n`, { flag: 'a' });
  } catch (err) {
    logger.warn({ msg: 'Failed to append post-login config to log file', err });
  }
}
