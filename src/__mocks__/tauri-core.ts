/**
 * Mock for @tauri-apps/api/core.
 * Tests register expected responses via mockInvokeResponses.
 */

type InvokeHandler = (cmd: string, args?: Record<string, unknown>) => unknown;

let _handler: InvokeHandler = () => {
  throw new Error("invoke() called without mock handler set");
};

/** Override the invoke handler for tests. */
export function __setInvokeHandler(handler: InvokeHandler) {
  _handler = handler;
}

/** Reset the invoke handler. */
export function __resetInvokeHandler() {
  _handler = () => {
    throw new Error("invoke() called without mock handler set");
  };
}

/** Tracks all invoke calls for assertions. */
export const __invokeCalls: Array<{ cmd: string; args?: Record<string, unknown> }> = [];

export function __clearInvokeCalls() {
  __invokeCalls.length = 0;
}

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  __invokeCalls.push({ cmd, args });
  return _handler(cmd, args) as T;
}
