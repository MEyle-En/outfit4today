"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { TodayItem } from "@/components/home/TodayItem";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { MarketCard } from "@/components/market/MarketCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useVibeTheme } from "@/hooks/useVibeTheme";
import { MARKET_LISTINGS } from "@/lib/mock/market";
import { QUIZ_STEPS } from "@/lib/mock/quiz";
import { useStyleStore } from "@/lib/store/useStyleStore";
import { hasPrefs, matchScore } from "@/lib/style-match";

/** Dashboard: (1) Item des Tages aus dem eigenen Wardrobe, (2) passende Marketplace-Entdeckungen (folgen dem Vibe Check). */
export default function HomePage() {
  const { t } = useTranslation();
  const theme = useVibeTheme();
  const vibes = useStyleStore((s) => s.vibes);
  const colors = useStyleStore((s) => s.colors);
  const icons = useStyleStore((s) => s.icons);

  const prefs = useMemo(() => ({ vibes, colors, icons }), [vibes, colors, icons]);
  const vibeLabels = vibes.map((id) => QUIZ_STEPS[0].options.find((o) => o.id === id)?.label ?? id);

  // Sanfter Farb-Schein im Header aus den im Vibe Check gewählten Farbpaletten
  const glow = useMemo(() => {
    const sw = colors.flatMap((id) => QUIZ_STEPS[1].options.find((o) => o.id === id)?.swatches ?? []);
    return sw.length ? `linear-gradient(90deg, ${(sw.length === 1 ? [sw[0], sw[0]] : sw).join(", ")})` : null;
  }, [colors]);

  const picks = useMemo(
    () =>
      MARKET_LISTINGS.map((listing) => ({ listing, match: matchScore(listing, prefs) }))
        .sort((a, b) => b.match - a.match)
        .slice(0, 4),
    [prefs],
  );

  return (
    <div className="space-y-8">
      <header className="relative">
        {glow && (
          <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-10 h-44 opacity-25 blur-3xl" style={{ background: glow }} />
        )}
        <div className="relative mb-5 flex items-center justify-between">
          <Logo />
          <NotificationBell />
        </div>
        <p className="text-sm text-zinc-500">{t("homeGreeting")}</p>
        {theme.headerText ? (
          // Vibe-Header: Text im Verlauf des gewählten Vibes
          <h1
            className={`bg-gradient-to-r ${theme.gradient} bg-clip-text font-display text-4xl font-bold leading-[1.05] tracking-tight text-transparent`}
          >
            {theme.headerText}
          </h1>
        ) : (
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">
            {t("homeTitlePre")} <span className="text-accent-soft">{t("homeStyleFallback")}</span> {t("homeTitlePost")}
          </h1>
        )}
        {theme.headerText && vibeLabels.length > 0 && (
          <p className="mt-2 text-sm font-medium" style={{ color: theme.accentColor }}>
            {vibeLabels.join(" & ")}
          </p>
        )}
      </header>

      {/* Sektion 1: ein einzelnes Teil für heute (einfacher Flow statt Outfit-Kombinationen) */}
      <TodayItem />

      {/* Sektion 2: Marketplace-Entdeckungen */}
      <section className="space-y-3" aria-labelledby="market-picks">
        <div className="flex items-center justify-between">
          <h2 id="market-picks" className="flex items-center gap-2 font-display text-xl font-bold">
            <ShoppingBag className="h-5 w-5 text-accent-soft" /> {t("marketPicksTitle")}
          </h2>
          <Link href="/marketplace" className="flex items-center gap-1 text-xs text-accent-soft">
            {t("all")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-xs text-zinc-500">{hasPrefs(prefs) ? t("marketHintPersonal") : t("marketHintGeneric")}</p>
        <div className="grid grid-cols-2 gap-3">
          {picks.map(({ listing, match }, i) => (
            <MarketCard key={listing.id} listing={listing} match={match} compact index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
