import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  email: string;
  username: string;
}

interface Account {
  username: string;
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
  /** Anmelden oder (bei unbekannter E-Mail) Konto anlegen. Ohne username wird er aus der E-Mail abgeleitet. */
  login: (email: string, username?: string) => void;
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

      login: (rawEmail, rawUsername) => {
        const email = rawEmail.trim().toLowerCase();
        const existing = get().accounts[email];
        // Bestehendes Konto behält seinen Namen; neue Konten nehmen den angegebenen oder den E-Mail-Anfang
        const username = existing?.username ?? (rawUsername?.trim() || email.split("@")[0]);
        const onboarded = existing?.onboarded ?? false;
        set((s) => ({
          isAuthenticated: true,
          user: { email, username },
          hasCompletedOnboarding: onboarded,
          accounts: { ...s.accounts, [email]: { username, onboarded } },
        }));
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
          accounts: { ...s.accounts, [user.email]: { username: user.username, onboarded: true } },
        }));
      },
    }),
    { name: "outfit4today-auth" },
  ),
);
