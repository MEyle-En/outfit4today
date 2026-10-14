"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

const DONE_KEY = "outfit4today-pwa-done"; // installiert oder weggeklickt -> nie wieder zeigen

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const readFlag = () => {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
};
const setFlag = () => {
  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch {
    /* ignorieren */
  }
};

/**
 * Hinweis "Zu Home-Bildschirm hinzufügen":
 *  - Android/Chrome: Button löst den echten Installationsdialog aus (beforeinstallprompt).
 *  - iOS Safari: kurze Anleitung (Teilen -> Zum Home-Bildschirm), iOS kennt keinen Installationsdialog.
 * Verschwindet nach der Installation oder beim Wegklicken (localStorage-Flag) und wird nie in der installierten App gezeigt.
 */
export function InstallBanner() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (readFlag() || isStandalone()) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    if (ios) setMode("ios");

    const onPrompt = (e: Event) => {
      e.preventDefault(); // eigenen Button statt der Mini-Infoleiste des Browsers
      setPromptEvent(e as InstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => {
      setFlag();
      setMode(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    setFlag();
    setMode(null);
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setFlag();
    setPromptEvent(null);
    setMode(null);
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
