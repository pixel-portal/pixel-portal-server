

export function aquireLock (sharedArray: Uint8Array): boolean {
  const startTime = performance.now();
  while (performance.now() < startTime + 5) {
    if (Atomics.compareExchange(sharedArray, 0, 0, 1) === 0) {
      return true;
    }
  }
  return false;
}

export function releaseLock (sharedArray: Uint8Array): boolean {
  return Atomics.compareExchange(sharedArray, 0, 1, 0) === 1;
}

export function publish (view: DataView, array: Uint8Array, size: number, maxBufferSize: number, bodyCallback: (offset: number) => number, doneCallback: ((offset: number, size: number) => void) | undefined) {
  if (aquireLock(array)) {
    try {
      const existingOffset = Math.max(3, view.getUint16(1));

      if (existingOffset + size >= maxBufferSize) {
        console.error("Out of worker buffer");
        setTimeout(() => publish(view, array, size, maxBufferSize, bodyCallback, doneCallback), 0);
      }
      else {
        const newOffset = bodyCallback(existingOffset);
        view.setUint16(1, newOffset);
        if (doneCallback) {
          doneCallback(existingOffset, newOffset - existingOffset);
        }
      }
    }
    finally {
      releaseLock(array);
    }
  }
  else {
    // TOOD: add a limit?
    setTimeout(() => publish(view, array, size, maxBufferSize, bodyCallback, doneCallback), 0);
  }
}


export const TYPE_STOP = 1;
export const TYPE_CONNECT = 2;
export const TYPE_DISCONNECT = 3;
export const TYPE_ACTIONS = 4;
