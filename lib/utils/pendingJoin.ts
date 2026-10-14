/** Einladungscode, der einen Login überdauern soll (sessionStorage gilt pro Tab und übersteht auch den Google-/Apple-Redirect). */
const KEY = "pendingJoinCode";

/** Nur Buchstaben/Ziffern, 4–16 Zeichen, sonst null. */
export function sanitizeCode(raw: string | undefined | null): string | null {
  const code = decodeURIComponent(raw ?? "").trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null;
}

export function setPendingJoin(code: string) {
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    /* sessionStorage nicht verfügbar */
  }
}

export function getPendingJoin(): string | null {
  try {
    return sanitizeCode(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearPendingJoin() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignorieren */
  }
}

/** Vollständiger Einladungslink – immer mit der echten Origin (localhost lokal, die Vercel-Domain live). */
export const inviteUrl = (code: string) => `${window.location.origin}/join/${code}`;
