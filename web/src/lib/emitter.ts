/**
 * Creates an event emitter with typed event handling capabilities.
 * @returns An object with subscribe and emit functions.
 */
export function createEmitter<T>() {
  const callbacks: ((data: T) => void)[] = [];

  /**
   * Subscribe to events from this emitter.
   * @param callback The function to call when an event is emitted.
   * @returns A function that, when called, will unsubscribe the callback.
   */
  function subscribe(callback: (data: T) => void): () => void {
    callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all subscribers.
   * @param data The data to pass to subscriber callbacks.
   */
  function emit(data: T): void {
    // Create a copy of the callbacks array to avoid issues if callbacks modify the array
    const currentCallbacks = [...callbacks];
    for (const callback of currentCallbacks) {
      callback(data);
    }
  }

  return {
    subscribe,
    emit
  };
}