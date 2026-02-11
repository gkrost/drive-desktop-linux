import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { Result } from '../../../context/shared/domain/Result';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type UsageAndLimit = { usageInBytes: number; limitInBytes: number };

async function withRetry<T>(fn: () => Promise<T>, operationName: string, maxRetries = 5): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const axiosError = err as { response?: { status?: number }; code?: string };

      if (axiosError.response?.status === 429) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
        logger.debug({
          msg: `Rate limited (429) during ${operationName}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`,
        });
        lastError = err as Error;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

export async function getUsageAndLimit(): Promise<Result<UsageAndLimit, Error>> {
  const [getUsageResult, getLimitResult] = await Promise.all([
    withRetry(() => driveServerModule.user.getUsage(), 'getUsage'),
    withRetry(() => driveServerModule.user.getLimit(), 'getLimit'),
  ]);
  if (getUsageResult.isLeft() || getLimitResult.isLeft()) {
    const error = getUsageResult.isLeft() ? getUsageResult.getLeft() : getLimitResult.getLeft();
    logger.error({
      msg: 'getUsageAndLimit request was not succesfull',
      error: error.message || error,
    });

    return { error };
  }
  return {
    data: {
      usageInBytes: getUsageResult.getRight().total,
      limitInBytes: getLimitResult.getRight().maxSpaceBytes,
    },
  };
}
