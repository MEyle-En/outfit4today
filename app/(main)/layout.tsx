"use client";

import { useEffect } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useHydrated } from "@/hooks/useHydrated";
import { LANGS } from "@/lib/i18n/translations";
import { useLangStore } from "@/lib/store/useLangStore";
import { useStyleStore } from "@/lib/store/useStyleStore";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const hasOnboarded = useStyleStore((s) => s.hasOnboarded);
  const lang = useLangStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    // Arabisch läuft von rechts nach links
    document.documentElement.dir = LANGS.find((l) => l.id === lang)?.dir ?? "ltr";
  }, [lang]);

  if (!hydrated || !hasOnboarded) return <div className="min-h-dvh" />;

  return (
    <>
      <div className="px-4 pb-28 pt-6">{children}</div>
      <BottomNav />
    </>
  );
}
