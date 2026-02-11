import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import eventBus from '../../event-bus';
import { setCredentials } from '../service';
import { setIsLoggedIn } from '../handlers';
import { setupRootFolder } from '../../virtual-root-folder/service';
import { processDeeplink } from './proccess-deeplink';
import { initializeCurrentUser } from './initialize_current_user';

type Props = {
  url: string;
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleDeeplink({ url }: Props): Promise<boolean> {
  try {
    const deeplinkParams = await processDeeplink({ url });

    if (!deeplinkParams) {
      logger.error({ tag: 'AUTH', msg: 'Invalid deeplink parameters', url });
      return false;
    }

    await setCredentials(deeplinkParams.mnemonic, deeplinkParams.token, deeplinkParams.newToken);

    logger.debug({ tag: 'AUTH', msg: 'Auth details stored successfully from deeplink' });

    let retries = 0;
    let initialized = false;

    while (!initialized && retries < MAX_RETRIES) {
      try {
        await initializeCurrentUser();
        initialized = true;
      } catch (error) {
        retries++;
        logger.warn({ tag: 'AUTH', msg: `initializeCurrentUser attempt ${retries}/${MAX_RETRIES} failed`, error });

        if (retries < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * retries);
        }
      }
    }

    if (!initialized) {
      logger.error({ tag: 'AUTH', msg: 'Failed to initialize current user after retries' });
      return false;
    }

    await setupRootFolder();

    setIsLoggedIn(true);

    app.focus();

    eventBus.emit('USER_LOGGED_IN');

    logger.debug({ tag: 'AUTH', msg: 'Deeplink login completed successfully' });

    return true;
  } catch (error) {
    logger.error({ tag: 'AUTH', msg: 'Error processing deeplink', error });
    return false;
  }
}
