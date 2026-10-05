/** window.localStorage, or null where it's blocked (some private modes throw on access). */
export function safeLocalStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
