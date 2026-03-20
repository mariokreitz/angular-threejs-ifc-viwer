import { isDevMode } from '@angular/core';

/**
 * Toggleable debug logger for the IFC scene.
 *
 * Enable in browser DevTools:  window.__ifcDebug = true
 * Disable in browser DevTools: window.__ifcDebug = false
 *
 * No rebuild or environment change is required — the flag is checked at call time.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __ifcDebug?: boolean;
  }
}

export function debugLog(tag: string, ...args: unknown[]): void {
  const debugEnabled = (window as unknown as Record<string, unknown>)['__ifcDebug'] === true;
  if (isDevMode() && debugEnabled) {
    console.log(`[${tag}]`, ...args);
  }
}
