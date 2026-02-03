/* istanbul ignore file */
import { scheduler } from 'node:timers/promises';

export class TimeoutError extends Error {}

export const promiseTimeout = async <T>(ms: number, promise: Promise<T>): Promise<T> => {
  const timeout = scheduler.wait(ms).then(() => {
    throw new TimeoutError(`Timed out after ${ms} ms`);
  });

  return Promise.race([promise, timeout]);
};
