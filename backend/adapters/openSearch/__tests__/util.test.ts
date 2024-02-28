import { isTooManyRequestsError, wrapRetryOnTooManyRequests } from '../util';

const MAX_WAIT = 400;
const INITIAL_WAIT = 50;

const ErrorResponse = {
  name: 'ResponseError',
  meta: {
    statusCode: 429,
  },
};
/**
 * Return function that rejects with status 429 the first retriesUntilSuccess it is called, then success
 *
 * Always reject if retriesUntilSuccess is negative
 */
function simulateTooManyRequestsError(
  retriesUntilSuccess: number,
): () => Promise<any> {
  if (retriesUntilSuccess < 0) {
    // continuously reject
    return () => {
      return Promise.reject(ErrorResponse);
    };
  }
  let count = retriesUntilSuccess;
  return () => {
    // reject count times, then resolve
    if (count > 0) {
      count -= 1;
      return Promise.reject(ErrorResponse);
    }
    return Promise.resolve({ status: 200 });
  };
}

describe('wrapRetryOnTooManyRequests', () => {
  test('success: no errors', async () => {
    const testResponse = { status: 200 };
    const operation = () => Promise.resolve(testResponse);
    const result = await wrapRetryOnTooManyRequests(
      operation,
      INITIAL_WAIT,
      MAX_WAIT,
    );
    expect(result).toEqual(testResponse);
  });
  test('error: continuous errors', async () => {
    expect(
      async () =>
        await wrapRetryOnTooManyRequests(
          simulateTooManyRequestsError(-1),
          INITIAL_WAIT,
          MAX_WAIT,
        ),
    ).rejects.toEqual(ErrorResponse);
  });
  test('success: 429 error and then success', async () => {
    const result = await wrapRetryOnTooManyRequests(
      simulateTooManyRequestsError(2),
      INITIAL_WAIT,
      MAX_WAIT,
    );
    expect(result).toEqual({ status: 200 });
  });
});

describe('isTooManyRequestsError', () => {
  test('success: TooManyRequests', async () => {
    const result = isTooManyRequestsError(ErrorResponse);
    expect(result).toEqual(true);
  });
  test('success: Malformed no server available JSON error', async () => {
    const testMessage = {
      name: 'DeserializationError',
      data: '{\n  "message": "No server available to handle the request",\n}\n',
    };
    const result = isTooManyRequestsError(testMessage);
    expect(result).toEqual(true);
  });
  test('failure: other', async () => {
    const testMessage = { status: 500 };
    const result = isTooManyRequestsError(testMessage);
    expect(result).toEqual(false);
  });
});
