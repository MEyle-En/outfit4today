"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useHydrated } from "@/hooks/useHydrated";
import { startWardrobeSync } from "@/lib/supabase-wardrobe";
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
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authOnboarded = useAuthStore((s) => s.hasCompletedOnboarding);
  const styleOnboarded = useStyleStore((s) => s.hasOnboarded);

  // Beide müssen stimmen: Konto hat den Vibe Check gemacht UND ein Style-Profil ist vorhanden
  // (Profil zurücksetzen leert das Style-Profil -> Vibe Check läuft erneut).
  const onboarded = authOnboarded && styleOnboarded;

  let target: string | null = null;
  // Rechtstexte und die Passwort-Reset-Seite (Nutzer kommt mit Recovery-Sitzung aus der E-Mail) nie umleiten
  const isLegal = pathname === "/privacy" || pathname === "/imprint" || pathname === "/reset-password";
  if (hydrated && authReady && !isLegal) {
    if (!isAuthenticated) target = pathname === "/login" ? null : "/login";
    else if (pathname === "/login") target = onboarded ? "/" : "/vibe-check";
    else if (!onboarded && pathname !== "/vibe-check") target = "/vibe-check";
  }

  // Supabase-Sitzung laden und auf An-/Abmeldungen hören (auch bei Rückkehr vom Google-/Apple-Login)
  useEffect(() => {
    if (!hydrated) return;
    return useAuthStore.getState().init();
  }, [hydrated]);

  // Kleiderschrank: nach dem Login aus Supabase laden und Änderungen automatisch speichern
  const userId = useAuthStore((s) => s.user?.id);
  useEffect(() => {
    if (!userId) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void startWardrobeSync(userId).then((s) => {
      if (cancelled) s();
      else stop = s;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [userId]);

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (!hydrated || (!authReady && !isLegal) || target) return <PageSkeleton />;
  return <>{children}</>;
}
