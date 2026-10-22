// Tests decide when an asynchronous operation finishes, without real sleeps.
export function deferredResult<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
