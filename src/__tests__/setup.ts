// Simulate Tauri runtime BEFORE any module loads, so isTauri evaluates to true.
// Must be at top level (not inside beforeAll) to run at file-parse time.
(globalThis as Record<string, unknown>).__TAURI_INTERNALS__ = { invoke: () => {} };
(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = { invoke: () => {} };

import { afterEach } from "vitest";
import { __resetInvokeHandler, __clearInvokeCalls } from "../__mocks__/tauri-core";
import { __clearListeners } from "../__mocks__/tauri-event";

afterEach(() => {
  __resetInvokeHandler();
  __clearInvokeCalls();
  __clearListeners();
});
