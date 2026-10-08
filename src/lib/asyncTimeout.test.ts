import { describe, expect, it } from 'vitest';
import { AsyncTimeoutError, withTimeout } from './asyncTimeout';

describe('withTimeout', () => {
  it('resolves when promise finishes in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 500, 'fast')).resolves.toBe(42);
  });

  it('rejects when promise is slow', async () => {
    const slow = new Promise<number>((resolve) => {
      globalThis.setTimeout(() => resolve(1), 200);
    });
    await expect(withTimeout(slow, 20, 'slow-op')).rejects.toBeInstanceOf(AsyncTimeoutError);
  });
});
