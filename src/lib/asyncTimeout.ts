export class AsyncTimeoutError extends Error {
  readonly label: string;

  constructor(label: string, ms: number) {
    super(`Operation timed out after ${ms}ms: ${label}`);
    this.name = 'AsyncTimeoutError';
    this.label = label;
  }
}

/** Rejects when `promise` does not settle within `ms`. Does not cancel the underlying work. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (ms <= 0) return promise;
  const schedule = globalThis.setTimeout.bind(globalThis);
  const cancel = globalThis.clearTimeout.bind(globalThis);
  return new Promise<T>((resolve, reject) => {
    const timer = schedule(() => {
      reject(new AsyncTimeoutError(label, ms));
    }, ms);
    promise.then(
      (value) => {
        cancel(timer);
        resolve(value);
      },
      (err) => {
        cancel(timer);
        reject(err);
      },
    );
  });
}
