const DEBUG_STORAGE_KEY = 'time-traveler-hunter-debug';
const LOGGER_PREFIX = '[Time Traveler Hunter]';

function isDebugEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function debugLog(...args: unknown[]): void {
  if (!isDebugEnabled()) {
    return;
  }

  console.log(LOGGER_PREFIX, ...args);
}

export function consumeRuntimeLastError(context: string): void {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return;
  }

  const runtimeError = chrome.runtime.lastError;
  if (!runtimeError) {
    return;
  }

  debugLog(`${context}: ${runtimeError.message}`);
}
