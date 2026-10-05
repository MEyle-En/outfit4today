import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  email: string;
  username: string;
}

/**
 * Mock-Hash (cyrb53 + Salt = E-Mail). Das ist KEINE echte Sicherheit – nur damit im Mock kein Klartext-Passwort
 * im localStorage liegt. Mit Supabase übernimmt das Auth-Backend (bcrypt/argon2) das Hashing.
 */
export function mockHash(password: string, salt: string): string {
  const str = salt + "\u0000" + password;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export const MIN_PASSWORD = 6;

export type AuthResult = { ok: true } | { ok: false; error: "exists" | "notFound" | "wrongPassword" | "weakPassword" };

interface Account {
  username: string;
  /** Mock-Hash des Passworts (fehlt nur bei Konten aus einer älteren Version) */
  passwordHash?: string;
  /** Hat dieses Konto den Vibe Check schon einmal abgeschlossen? */
  onboarded: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  /** Gilt für das aktuell angemeldete Konto */
  hasCompletedOnboarding: boolean;
  /** Mock-"Datenbank": bekannte Konten pro E-Mail, damit ein erneutes Anmelden den Vibe Check überspringt */
  accounts: Record<string, Account>;
  /** Neues Konto anlegen und anmelden. Passwort: mind. 6 Zeichen. */
  register: (email: string, username: string, password: string) => AuthResult;
  /** Anmelden: das Passwort muss zum gespeicherten Hash passen. */
  login: (email: string, password: string) => AuthResult;
  logout: () => void;
  /** Prüft/repariert den gespeicherten Zustand und gibt zurück, ob jemand angemeldet ist. */
  checkAuth: () => boolean;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      hasCompletedOnboarding: false,
      accounts: {},

      register: (rawEmail, rawUsername, password) => {
        const email = rawEmail.trim().toLowerCase();
        if (password.length < MIN_PASSWORD) return { ok: false, error: "weakPassword" };
        if (get().accounts[email]) return { ok: false, error: "exists" };
        const username = rawUsername.trim() || email.split("@")[0];
        set((s) => ({
          isAuthenticated: true,
          user: { email, username },
          hasCompletedOnboarding: false,
          accounts: { ...s.accounts, [email]: { username, onboarded: false, passwordHash: mockHash(password, email) } },
        }));
        return { ok: true };
      },

      login: (rawEmail, password) => {
        const email = rawEmail.trim().toLowerCase();
        const existing = get().accounts[email];
        if (!existing) return { ok: false, error: "notFound" };
        const hash = mockHash(password, email);
        if (existing.passwordHash) {
          if (existing.passwordHash !== hash) return { ok: false, error: "wrongPassword" };
        } else {
          // Altes Konto ohne Passwort: das jetzt eingegebene Passwort wird einmalig als Passwort gesetzt
          if (password.length < MIN_PASSWORD) return { ok: false, error: "weakPassword" };
        }
        set((s) => ({
          isAuthenticated: true,
          user: { email, username: existing.username },
          hasCompletedOnboarding: existing.onboarded,
          accounts: { ...s.accounts, [email]: { ...existing, passwordHash: hash } },
        }));
        return { ok: true };
      },

      // Konten und ihr Onboarding-Status bleiben erhalten -> erneutes Anmelden überspringt den Vibe Check
      logout: () => set({ isAuthenticated: false, user: null, hasCompletedOnboarding: false }),

      checkAuth: () => {
        const { isAuthenticated, user } = get();
        if (isAuthenticated && !user) {
          set({ isAuthenticated: false, hasCompletedOnboarding: false }); // kaputter Zustand -> abmelden
          return false;
        }
        return isAuthenticated;
      },

      completeOnboarding: () => {
        const { user } = get();
        if (!user) return;
        set((s) => ({
          hasCompletedOnboarding: true,
          accounts: { ...s.accounts, [user.email]: { ...s.accounts[user.email], username: user.username, onboarded: true } },
        }));
      },
    }),
    { name: "outfit4today-auth" },
  ),
);
