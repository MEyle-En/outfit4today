import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { resetLocalWardrobe } from "@/lib/supabase-wardrobe";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export const MIN_PASSWORD = 6;

export type AuthErrorCode =
  | "exists"
  | "credentials"
  | "weakPassword"
  | "confirmEmail" // Konto angelegt, E-Mail muss erst bestätigt werden
  | "unavailable"; // Netzwerk/Server/Provider nicht erreichbar oder nicht aktiviert

export type AuthResult = { ok: true } | { ok: false; error: AuthErrorCode };

interface AuthState {
  /** true, sobald die Supabase-Sitzung geprüft wurde (verhindert Aufblitzen der Login-Seite) */
  authReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  /** Gilt für das aktuell angemeldete Konto (aus `onboarded` abgeleitet) */
  hasCompletedOnboarding: boolean;
  /** Pro Konto (user.id): Vibe Check erledigt? Nur lokal gemerkt. */
  onboarded: Record<string, boolean>;
  register: (email: string, username: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  loginWithApple: () => Promise<AuthResult>;
  /** Schickt eine E-Mail mit Link zum Zurücksetzen. Antwortet immer gleich, egal ob die Adresse existiert. */
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  /** Setzt das neue Passwort (nur mit der Sitzung aus dem Reset-Link möglich). */
  updatePassword: (password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  /** Einmal beim Start: Sitzung laden und auf An-/Abmeldungen hören (auch OAuth-Rückkehr). */
  init: () => () => void;
  completeOnboarding: () => void;
}

const toAuthUser = (u: User): AuthUser => {
  const meta = (u.user_metadata ?? {}) as { username?: string; full_name?: string; name?: string };
  const email = u.email ?? "";
  return { id: u.id, email, username: meta.username || meta.full_name || meta.name || email.split("@")[0] || "user" };
};

/** Supabase-Fehlertext -> unser Fehlercode. Bewusst grob: kein Hinweis, ob eine E-Mail existiert. */
function mapError(error: { message?: string; status?: number; code?: string }): AuthErrorCode {
  const m = (error.message ?? "").toLowerCase();
  const c = error.code ?? "";
  if (c === "user_already_exists" || m.includes("already registered")) return "exists";
  if (c === "weak_password" || m.includes("password should be")) return "weakPassword";
  if (c === "email_not_confirmed" || m.includes("not confirmed")) return "confirmEmail";
  if (c === "invalid_credentials" || m.includes("invalid login")) return "credentials";
  return "unavailable";
}

/** Profil-Zeile sicherstellen (idempotent). Fehler sind nicht kritisch: ein DB-Trigger kann sie ebenfalls anlegen. */
async function ensureProfile(user: AuthUser) {
  try {
    await supabase.from("profiles").upsert({ id: user.id, username: user.username }, { onConflict: "id", ignoreDuplicates: true });
  } catch {
    /* ignorieren */
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const applySession = (session: Session | null) => {
        if (!session?.user) {
          set({ isAuthenticated: false, user: null, hasCompletedOnboarding: false, authReady: true });
          return;
        }
        const user = toAuthUser(session.user);
        set({ isAuthenticated: true, user, hasCompletedOnboarding: !!get().onboarded[user.id], authReady: true });
      };

      return {
        authReady: false,
        isAuthenticated: false,
        user: null,
        hasCompletedOnboarding: false,
        onboarded: {},

        register: async (rawEmail, rawUsername, password) => {
          const email = rawEmail.trim().toLowerCase();
          const username = rawUsername.trim() || email.split("@")[0];
          if (password.length < MIN_PASSWORD) return { ok: false, error: "weakPassword" };
          try {
            const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
            if (error) return { ok: false, error: mapError(error) };
            // Bei aktivierter E-Mail-Bestätigung meldet Supabase für bekannte Adressen ein User-Objekt ohne identities
            if (data.user && data.user.identities?.length === 0) return { ok: false, error: "exists" };
            if (!data.session || !data.user) return { ok: false, error: "confirmEmail" };
            await ensureProfile({ id: data.user.id, email, username });
            applySession(data.session);
            return { ok: true };
          } catch {
            return { ok: false, error: "unavailable" };
          }
        },

        login: async (rawEmail, password) => {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: rawEmail.trim().toLowerCase(), password });
            if (error) return { ok: false, error: mapError(error) };
            await ensureProfile(toAuthUser(data.user));
            applySession(data.session);
            return { ok: true };
          } catch {
            return { ok: false, error: "unavailable" };
          }
        },

        loginWithGoogle: async () => {
          try {
            const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
            return error ? { ok: false, error: "unavailable" } : { ok: true };
          } catch {
            return { ok: false, error: "unavailable" };
          }
        },

        requestPasswordReset: async (rawEmail) => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(rawEmail.trim().toLowerCase(), {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            // Nur echte Ausfälle melden; "unbekannte Adresse" bleibt unsichtbar (kein Konten-Ausspähen)
            if (error && (error.status === 0 || (error.status ?? 500) >= 500)) return { ok: false, error: "unavailable" };
            return { ok: true };
          } catch {
            return { ok: false, error: "unavailable" };
          }
        },

        updatePassword: async (password) => {
          if (password.length < MIN_PASSWORD) return { ok: false, error: "weakPassword" };
          try {
            const { error } = await supabase.auth.updateUser({ password });
            return error ? { ok: false, error: mapError(error) } : { ok: true };
          } catch {
            return { ok: false, error: "unavailable" };
          }
        },

        loginWithApple: async () => {
          try {
            const { error } = await supabase.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: window.location.origin } });
            return error ? { ok: false, error: "unavailable" } : { ok: true };
          } catch {
            return { ok: false, error: "unavailable" };
          }
        },

        // Der Vibe-Check-Status bleibt erhalten -> erneutes Anmelden überspringt ihn
        logout: async () => {
          try {
            await supabase.auth.signOut();
          } finally {
            set({ isAuthenticated: false, user: null, hasCompletedOnboarding: false });
            resetLocalWardrobe();
          }
        },

        init: () => {
          void supabase.auth
            .getSession()
            .then(({ data }) => applySession(data.session))
            .catch(() => applySession(null));
          const { data } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
          return () => data.subscription.unsubscribe();
        },

        completeOnboarding: () => {
          const { user } = get();
          if (!user) return;
          set((s) => ({ hasCompletedOnboarding: true, onboarded: { ...s.onboarded, [user.id]: true } }));
        },
      };
    },
    {
      name: "outfit4today-auth",
      version: 2,
      // Nur der Vibe-Check-Status wird lokal gespeichert – die Sitzung selbst verwaltet Supabase.
      partialize: (s) => ({ onboarded: s.onboarded }),
      // Alter Mock-Zustand (Konten mit Passwort-Hash, isAuthenticated) wird verworfen
      migrate: () => ({ onboarded: {} }),
    },
  ),
);
