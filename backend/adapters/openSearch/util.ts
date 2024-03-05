import { log } from '../../utils/logger';
/**
 * Wrap a request with retry logic
 *
 * On receiving error with statusCode 429, retry with doubling wait time until maxWait is reached
 */
export function wrapRetryOnTooManyRequests<T>(
  operation: () => Promise<T>,
  initialWait: number,
  maxWait: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const doRequest = async (waitUntilRetry: number): Promise<any> => {
      try {
        const response = await operation();
        return resolve(response);
      } catch (error) {
        if (isTooManyRequestsError(error)) {
          if (waitUntilRetry >= maxWait) {
            return reject(error);
          }
          log.warn(`Retry request with wait ${waitUntilRetry}`);
          return setTimeout(
            () => doRequest(waitUntilRetry * 2),
            waitUntilRetry,
          );
        }
        return reject(error);
      }
    };
    doRequest(initialWait);
  });
}

export function isTooManyRequestsError(error: any): boolean {
  const tooManyRequestsError =
    error &&
    error.name &&
    error.name === 'ResponseError' &&
    error.meta &&
    error.meta.statusCode &&
    error.meta.statusCode === 429;
  const malformedServerNotAvailableError =
    error &&
    error.name &&
    error.name === 'DeserializationError' &&
    error.data &&
    error.data.includes('No server available to handle the request');
  return Boolean(tooManyRequestsError || malformedServerNotAvailableError);
}
