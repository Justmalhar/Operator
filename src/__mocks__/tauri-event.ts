/** Mock for @tauri-apps/api/event */

export type UnlistenFn = () => void;

const listeners: Map<string, Array<(event: { payload: unknown }) => void>> = new Map();

export async function listen<T>(
  event: string,
  handler: (event: { payload: T }) => void,
): Promise<UnlistenFn> {
  const handlers = listeners.get(event) ?? [];
  handlers.push(handler as (event: { payload: unknown }) => void);
  listeners.set(event, handlers);

  return () => {
    const h = listeners.get(event);
    if (h) {
      const idx = h.indexOf(handler as (event: { payload: unknown }) => void);
      if (idx >= 0) h.splice(idx, 1);
    }
  };
}

/** Emit a mock event for testing. */
export function __emitMockEvent<T>(event: string, payload: T) {
  const handlers = listeners.get(event) ?? [];
  for (const h of handlers) {
    h({ payload });
  }
}

export function __clearListeners() {
  listeners.clear();
}
