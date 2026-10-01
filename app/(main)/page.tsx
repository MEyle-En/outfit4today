"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Shirt, ShoppingBag, Sparkles } from "lucide-react";
import { SuggestionCard } from "@/components/home/SuggestionCard";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { MarketCard } from "@/components/market/MarketCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { MARKET_LISTINGS } from "@/lib/mock/market";
import { QUIZ_STEPS } from "@/lib/mock/quiz";
import { useStyleStore } from "@/lib/store/useStyleStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { hasPrefs, matchScore } from "@/lib/style-match";
import { suggestOutfits } from "@/lib/suggest";

/** Smart Dashboard: (1) Looks aus dem eigenen Wardrobe, (2) passende Marketplace-Entdeckungen. Beides folgt dem Vibe Check. */
export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const vibes = useStyleStore((s) => s.vibes);
  const colors = useStyleStore((s) => s.colors);
  const icons = useStyleStore((s) => s.icons);
  const wardrobe = useWardrobeStore((s) => s.items);
  const [seed, setSeed] = useState(0);

  const prefs = useMemo(() => ({ vibes, colors, icons }), [vibes, colors, icons]);
  const vibeLabels = vibes.map((id) => QUIZ_STEPS[0].options.find((o) => o.id === id)?.label ?? id);

  // Sanfter Farb-Schein im Header aus den im Vibe Check gewählten Farbpaletten
  const glow = useMemo(() => {
    const sw = colors.flatMap((id) => QUIZ_STEPS[1].options.find((o) => o.id === id)?.swatches ?? []);
    return sw.length ? `linear-gradient(90deg, ${(sw.length === 1 ? [sw[0], sw[0]] : sw).join(", ")})` : null;
  }, [colors]);

  const suggestions = useMemo(() => suggestOutfits(wardrobe, prefs, seed), [wardrobe, prefs, seed]);

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
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">
          {t("homeTitlePre")}{" "}
          <span className="text-accent-soft">{vibeLabels.length ? vibeLabels.join(" & ") : t("homeStyleFallback")}</span>{" "}
          {t("homeTitlePost")}
        </h1>
      </header>

      {/* Sektion 1: AI Vorschläge aus dem eigenen Wardrobe */}
      <section className="space-y-3" aria-labelledby="ai-picks">
        <div className="flex items-center justify-between">
          <h2 id="ai-picks" className="flex items-center gap-2 font-display text-xl font-bold">
            <Sparkles className="h-5 w-5 text-accent-soft" /> {t("aiPicksTitle")}
          </h2>
          {suggestions.length > 0 && (
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              aria-label={t("shuffle")}
            >
              <RefreshCw className="h-3.5 w-3.5" /> {t("shuffle")}
            </button>
          )}
        </div>
        {suggestions.length === 0 ? (
          <EmptyState
            icon={Shirt}
            title={t("emptyLooksTitle")}
            description={t("emptyLooksDesc")}
            actionLabel={t("emptyLooksAction")}
            onAction={() => router.push("/wardrobe")}
          />
        ) : (
          <>
            <p className="text-xs text-zinc-500">{hasPrefs(prefs) ? t("aiPicksHintPersonal") : t("aiPicksHint")}</p>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {suggestions.map((s) => (
                <div key={s.id} className="snap-start">
                  <SuggestionCard suggestion={s} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

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
          {picks.map(({ listing, match }) => (
            <MarketCard key={listing.id} listing={listing} match={match} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
