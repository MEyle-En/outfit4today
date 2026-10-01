"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStyleStore } from "@/lib/store/useStyleStore";

/**
 * Einziger Ort für die Routing-Entscheidungen rund um Login und Onboarding:
 *   nicht angemeldet            -> /login
 *   angemeldet, Vibe Check offen -> /vibe-check
 *   angemeldet, fertig           -> App (von /login aus -> /)
 *
 * Gegen Endlosschleifen: `target` ist eine reine Funktion von (Zustand, Pfad). Es wird nur weitergeleitet,
 * wenn target !== null, und jedes Ziel liefert an seiner eigenen Adresse wieder null.
 * Der Inhalt wird erst gerendert, wenn nichts mehr umgeleitet werden muss (kein Aufblitzen geschützter Seiten).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authOnboarded = useAuthStore((s) => s.hasCompletedOnboarding);
  const styleOnboarded = useStyleStore((s) => s.hasOnboarded);

  // Beide müssen stimmen: Konto hat den Vibe Check gemacht UND ein Style-Profil ist vorhanden
  // (Profil zurücksetzen leert das Style-Profil -> Vibe Check läuft erneut).
  const onboarded = authOnboarded && styleOnboarded;

  let target: string | null = null;
  if (hydrated) {
    if (!isAuthenticated) target = pathname === "/login" ? null : "/login";
    else if (pathname === "/login") target = onboarded ? "/" : "/vibe-check";
    else if (!onboarded && pathname !== "/vibe-check") target = "/vibe-check";
  }

  useEffect(() => {
    if (hydrated) useAuthStore.getState().checkAuth(); // repariert inkonsistenten Zustand
  }, [hydrated]);

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (!hydrated || target) return <div className="min-h-dvh" aria-busy="true" />;
  return <>{children}</>;
}
