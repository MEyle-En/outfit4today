"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, ShoppingBag, Tag } from "lucide-react";
import { MarketCard } from "@/components/market/MarketCard";
import { MyListings } from "@/components/market/MyListings";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { useCategoryOptions } from "@/lib/categories";
import { MARKET_LISTINGS, myBundleListings, myListings } from "@/lib/mock/market";
import { useBundleStore } from "@/lib/store/useBundleStore";
import { useStyleStore } from "@/lib/store/useStyleStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { hasPrefs, matchScore } from "@/lib/style-match";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/types";

type Mode = "all" | "swap" | "sell";
type PriceRange = "any" | "u20" | "20-50" | "o50";

const inRange = (price: number, r: PriceRange) =>
  r === "u20" ? price < 20 : r === "20-50" ? price >= 20 && price <= 50 : r === "o50" ? price > 50 : true;

/** Reiner Stöber-Feed: alle öffentlichen Tausch- und Verkaufsangebote, sortiert nach Match zum Vibe Check. */
export default function MarketplacePage() {
  const { t } = useTranslation();
  const categoryOptions = useCategoryOptions();
  const vibes = useStyleStore((s) => s.vibes);
  const colors = useStyleStore((s) => s.colors);
  const icons = useStyleStore((s) => s.icons);
  const wardrobe = useWardrobeStore((s) => s.items);
  const bundles = useBundleStore((s) => s.bundles);

  const [mode, setMode] = useState<Mode>("all");
  const [category, setCategory] = useState<ItemCategory | "all">("all");
  const [priceRange, setPriceRange] = useState<PriceRange>("any");
  const [onlyMyVibe, setOnlyMyVibe] = useState(false);

  const MODES: { id: Mode; label: string; icon?: typeof Tag }[] = [
    { id: "all", label: t("all") },
    { id: "swap", label: t("market_onlySwap"), icon: ArrowLeftRight },
    { id: "sell", label: t("market_onlySell"), icon: Tag },
  ];
  const PRICES: { id: PriceRange; label: string }[] = [
    { id: "any", label: t("price_any") },
    { id: "u20", label: t("price_under20") },
    { id: "20-50", label: t("price_20to50") },
    { id: "o50", label: t("price_over50") },
  ];
  const CATEGORY_FILTER = [{ id: "all" as const, label: t("all") }, ...categoryOptions];

  const prefs = useMemo(() => ({ vibes, colors, icons }), [vibes, colors, icons]);
  const personalized = hasPrefs(prefs);

  const all = useMemo(
    () =>
      [...myBundleListings(bundles, wardrobe), ...myListings(wardrobe), ...MARKET_LISTINGS].map((listing) => ({
        listing,
        match: matchScore(listing, prefs),
      })),
    [wardrobe, bundles, prefs],
  );

  const shown = useMemo(
    () =>
      all
        .filter(({ listing: l, match }) => {
          // "Verkauf & Tausch" zählt für beide Modi
          if (mode === "swap" && l.mode === "sell") return false;
          if (mode === "sell" && l.mode === "swap") return false;
          if (category !== "all" && l.category !== category) return false;
          // Preisfilter: nur Angebote mit Preis; reine Tausch-Angebote fallen heraus
          if (priceRange !== "any" && (l.mode === "swap" || l.price == null || !inRange(l.price, priceRange))) return false;
          if (onlyMyVibe && match === 0) return false;
          return true;
        })
        .sort((a, b) => b.match - a.match),
    [all, mode, category, priceRange, onlyMyVibe],
  );

  const reset = () => {
    setMode("all");
    setCategory("all");
    setPriceRange("any");
    setOnlyMyVibe(false);
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-zinc-500">{t("market_count", { n: shown.length })}</p>
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">{t("market_title")}</h1>
      </header>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">{t("market_browse")}</TabsTrigger>
          <TabsTrigger value="mine">{t("market_mine")}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-5">
          {/* Filter */}
          <div className="glass space-y-3 rounded-2xl p-3">
            <div className="grid grid-cols-3 gap-1.5">
              {MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  aria-pressed={mode === id}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors",
                    mode === id ? "bg-accent/25 text-white ring-1 ring-accent/40" : "text-zinc-400 hover:text-white",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />} {label}
                </button>
              ))}
            </div>

            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{t("category")}</p>
              <CategoryPicker value={category} options={CATEGORY_FILTER} onChange={setCategory} />
            </div>

            <div className={cn(mode === "swap" && "pointer-events-none opacity-40")}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{t("price")}</p>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as PriceRange)}
                aria-label={t("price")}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {PRICES.map((p) => (
                  <option key={p.id} value={p.id} className="bg-surface">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {personalized && (
              <button
                role="switch"
                aria-checked={onlyMyVibe}
                onClick={() => setOnlyMyVibe((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
              >
                <span>{t("market_onlyVibe")}</span>
                <span className={cn("h-6 w-10 rounded-full p-0.5 transition-colors", onlyMyVibe ? "bg-accent" : "bg-white/15")}>
                  <span className={cn("block h-5 w-5 rounded-full bg-white transition-transform", onlyMyVibe && "translate-x-4")} />
                </span>
              </button>
            )}
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={t("market_noMatchTitle")}
              description={t("market_noMatchDesc")}
              actionLabel={t("market_reset")}
              onAction={reset}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shown.map(({ listing, match }, i) => (
                <MarketCard key={listing.id} listing={listing} match={personalized ? match : undefined} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          <MyListings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
