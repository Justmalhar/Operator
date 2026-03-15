/** Mock for @tauri-apps/plugin-dialog */

let _openResult: string | null = null;

export function __setOpenResult(result: string | null) {
  _openResult = result;
}

export async function open(_options?: Record<string, unknown>): Promise<string | null> {
  return _openResult;
}
