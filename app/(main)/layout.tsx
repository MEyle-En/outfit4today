"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { useHydrated } from "@/hooks/useHydrated";
import { LANGS } from "@/lib/i18n/translations";
import { useLangStore } from "@/lib/store/useLangStore";
import { useStyleStore } from "@/lib/store/useStyleStore";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const hasOnboarded = useStyleStore((s) => s.hasOnboarded);
  const lang = useLangStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    // Arabisch läuft von rechts nach links
    document.documentElement.dir = LANGS.find((l) => l.id === lang)?.dir ?? "ltr";
  }, [lang]);

  if (!hydrated || !hasOnboarded) return <PageSkeleton />;

  return (
    <>
      {/* Eine Glocke für alle Main-Views: oben rechts, immer an derselben Stelle über dem Content */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto flex max-w-md justify-end px-4 pt-4">
        <NotificationBell className="pointer-events-auto" />
      </div>
      <div className="px-4 pb-28 pt-6">
        {pathname !== "/" && <Logo size={32} className="mb-5" />}
        {children}
      </div>
      <InstallBanner />
      <BottomNav />
    </>
  );
}
