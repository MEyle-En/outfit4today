"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useHydrated } from "@/hooks/useHydrated";
import { warmupBackgroundRemoval } from "@/lib/utils/backgroundRemover";
import { translate } from "@/lib/i18n/translate";
import { toast } from "@/lib/store/useToastStore";
import { clearPendingJoin, getPendingJoin } from "@/lib/utils/pendingJoin";
import { ensureProfile } from "@/lib/supabase-social";
import { useCrewStore } from "@/lib/store/useCrewStore";
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
  const isLegal =
    pathname === "/privacy" || pathname === "/imprint" || pathname === "/reset-password" || pathname.startsWith("/join/");
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
    warmupBackgroundRemoval(); // Modell im Leerlauf vorladen
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

  // Crews aus Supabase laden; beim Abmelden/Kontowechsel zurücksetzen
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const me = useAuthStore.getState().user;
    // Erst das Profil sicherstellen (sonst fehlen Namen in Mitglieder- und Post-Listen), dann Crews laden
    void (me ? ensureProfile(me) : Promise.resolve())
      .then(() => useCrewStore.getState().loadCrews())
      .then(async () => {
        // Einladungslink vor dem Login geöffnet? Genau einmal beitreten, Eintrag sofort löschen (kein Re-Join bei Reload)
        const code = getPendingJoin();
        if (!code || cancelled) return;
        clearPendingJoin();
        const result = await useCrewStore.getState().joinCrew(code);
        if (!result.ok) {
          toast(translate(result.error === "invalid" ? "crew_errInvalidCode" : "crew_errJoin"), undefined, "error");
          return;
        }
        useCrewStore.getState().setWardrobeView("crew");
        useCrewStore.getState().setCrewTab("fits");
        // Neue Konten gehen erst durch den Vibe Check; die Crew ist trotzdem schon beigetreten
        if (useAuthStore.getState().hasCompletedOnboarding && useStyleStore.getState().hasOnboarded) router.replace("/wardrobe");
      });
    return () => {
      cancelled = true;
      useCrewStore.getState().resetCloud();
    };
  }, [userId, router]);

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (!hydrated || (!authReady && !isLegal) || target) return <PageSkeleton />;
  return <>{children}</>;
}
