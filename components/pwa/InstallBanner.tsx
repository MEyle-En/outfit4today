"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/lib/store/useAuthStore";

const DONE_KEY = "outfit4today-pwa-done"; // localStorage: installiert oder weggeklickt -> nie wieder
const SHOWN_KEY = "outfit4today-pwa-shown"; // sessionStorage: in dieser Browser-Session schon gezeigt
const AUTO_HIDE_MS = 15000;
// Nur auf den Hauptseiten zeigen (nicht beim Login, im Vibe Check oder auf Rechtsseiten)
const MAIN_ROUTES = ["/", "/wardrobe", "/lab", "/marketplace", "/profile"];

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const store = {
  get: (area: "local" | "session", key: string) => {
    try {
      return (area === "local" ? localStorage : sessionStorage).getItem(key) === "1";
    } catch {
      return false;
    }
  },
  set: (area: "local" | "session", key: string) => {
    try {
      (area === "local" ? localStorage : sessionStorage).setItem(key, "1");
    } catch {
      /* ignorieren */
    }
  },
};

/**
 * Hinweis "Zu Home-Bildschirm hinzufügen" – wird EINMAL im Root-Layout gemountet (kein Remount bei Routenwechsel).
 * Erscheint nur, wenn die App nicht installiert ist, das Dauer-Flag (localStorage) fehlt und in dieser Session noch
 * nichts gezeigt wurde (sessionStorage, wird beim ersten Anzeigen sofort gesetzt). Wegklicken oder Installieren setzt das Dauer-Flag.
 *  - Android/Chrome: Button löst den echten Installationsdialog aus (beforeinstallprompt).
 *  - iOS Safari: kurze Anleitung (Teilen -> Zum Home-Bildschirm).
 */
export function InstallBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [visible, setVisible] = useState(false);
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  // Einmalig: Umgebung erkennen und Listener registrieren (Cleanup beim Unmount)
  useEffect(() => {
    if (store.get("local", DONE_KEY) || isStandalone()) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    if (ios) setMode("ios");

    const onPrompt = (e: Event) => {
      e.preventDefault(); // eigener Button statt der Mini-Infoleiste des Browsers
      promptRef.current = e as InstallPromptEvent;
      setMode("android");
    };
    const onInstalled = () => {
      store.set("local", DONE_KEY);
      setVisible(false);
      setMode(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onMainRoute = MAIN_ROUTES.includes(pathname);

  // Erstes Anzeigen pro Session: Flag SOFORT setzen, damit nichts (Routenwechsel, Remount, Reload) es erneut auslöst
  useEffect(() => {
    if (!mode || !isAuthenticated || !onMainRoute || visible) return;
    if (store.get("session", SHOWN_KEY) || store.get("local", DONE_KEY)) return;
    store.set("session", SHOWN_KEY);
    setVisible(true);
    // Nicht aufdringlich: nach einer Weile von selbst ausblenden (ohne das Dauer-Flag zu setzen)
    hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
  }, [mode, isAuthenticated, onMainRoute, visible]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (!visible || !mode || !onMainRoute) return null;

  const dismiss = () => {
    clearTimeout(hideTimer.current);
    store.set("local", DONE_KEY);
    setVisible(false);
  };

  const install = async () => {
    const ev = promptRef.current;
    if (!ev) return;
    clearTimeout(hideTimer.current);
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === "accepted") store.set("local", DONE_KEY);
    promptRef.current = null;
    setVisible(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto max-w-md px-4">
      <div role="region" aria-label={t("pwa_title")} className="glass pointer-events-auto flex items-center gap-3 rounded-2xl border border-accent/30 p-3 shadow-2xl">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent-soft">
          {mode === "ios" ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("pwa_title")}</p>
          <p className="text-xs text-zinc-400">{mode === "ios" ? t("pwa_iosHint") : t("pwa_desc")}</p>
        </div>
        {mode === "android" && (
          <Button size="sm" onClick={() => void install()}>
            {t("pwa_install")}
          </Button>
        )}
        <button type="button" onClick={dismiss} aria-label={t("pwa_dismiss")} className="shrink-0 p-1 text-zinc-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
