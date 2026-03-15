import { useEffect } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauri } from "@/lib/tauri";

/**
 * Subscribe to a Tauri event for the lifetime of the component.
 * Automatically unsubscribes on unmount.
 * No-ops gracefully when the Tauri backend is unavailable (browser dev mode).
 */
export function useTauriEvent<T>(
  event: string,
  handler: (payload: T) => void,
) {
  useEffect(() => {
    if (!isTauri) return;

    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listen<T>(event, (e) => {
      if (!cancelled) handler(e.payload);
    }).then((fn) => {
      if (cancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [event, handler]);
}
