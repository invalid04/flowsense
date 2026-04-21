const SESSION_STORAGE_KEY = "sequence_session_key";

function createSessionKey() {
  return crypto.randomUUID();
}

export function getOrCreateSessionKey() {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateSessionKey must be called in the browser");
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const next = createSessionKey();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}