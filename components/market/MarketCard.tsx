"use client";

import { useState } from "react";
import { ArrowLeftRight, MessageCircle } from "lucide-react";
import { ChatDialog } from "@/components/market/ChatDialog";
import { LikeButton } from "@/components/ui/LikeButton";
import { useTranslation } from "@/hooks/useTranslation";
import { categoryLabel } from "@/lib/categories";
import { swatchOf } from "@/lib/colors";
import type { MarketListing } from "@/lib/mock/market";
import { stagger } from "@/lib/stagger";
import { likeKey } from "@/lib/store/useSocialStore";

export function MarketCard({
  listing,
  match,
  compact,
  index = 0,
}: {
  listing: MarketListing;
  match?: number;
  compact?: boolean;
  index?: number;
}) {
  const { t } = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);
  const swatch = swatchOf(listing.color);
  const canSwap = listing.mode !== "sell";
  const canBuy = listing.mode !== "swap";
  const bundle = listing.bundle;

  return (
    <article style={stagger(index)} className="animate-fade-in-up card-lift overflow-hidden rounded-2xl border border-white/10 bg-surface">
      <div className="relative aspect-[4/5] bg-gradient-to-br from-zinc-800 to-zinc-900">
        {bundle ? (
          // Bundle: Mosaik aus bis zu drei Teilen
          <div className="grid h-full w-full grid-cols-2 gap-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bundle.images[0]} alt="" className={`h-full w-full object-cover ${bundle.images.length > 1 ? "row-span-2" : "col-span-2 row-span-2"}`} />
            {bundle.images.slice(1, 3).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="h-full w-full object-cover" />
            ))}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.image} alt={listing.name} loading="lazy" className="h-full w-full object-cover" />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {canBuy && (
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-sm font-bold text-white backdrop-blur-md">
              💰 {listing.price != null ? `${listing.price} €` : t("price_vb")}
            </span>
          )}
          {canSwap && (
            <span className="flex items-center gap-1 rounded-full bg-accent/85 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <ArrowLeftRight className="h-3 w-3" /> {t("mode_swap")}
            </span>
          )}
          {bundle && (
            <span className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-2.5 py-1 text-xs font-bold text-white shadow-[0_0_16px_-4px_rgba(244,114,182,0.7)]">📦 {t("bundle_badge")}</span>
          )}
        </div>
        {match ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-accent-soft backdrop-blur-md">
            {t("match_percent", { n: match })}
          </span>
        ) : null}
        <LikeButton
          likeKey={likeKey.listing(listing.id)}
          mine={listing.mine}
          overlay
          traits={{ itemIds: [listing.id], categories: [listing.category], colors: [listing.color] }}
          className="absolute bottom-2 right-2"
        />
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate font-display text-base font-semibold leading-tight">{listing.name}</p>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          {swatch && <span className="h-3 w-3 shrink-0 rounded-full border border-white/20" style={{ background: swatch }} />}
          <span className="truncate">
            {bundle ? t("bundle_parts", { n: bundle.count }) : categoryLabel(listing.category)} ·{" "}
            {listing.mine ? t("market_yourListing") : listing.seller}
          </span>
        </div>
        {bundle && <p className="text-[11px] text-zinc-500">{bundle.onlyTogether ? t("bundle_onlyTogether") : t("bundle_alsoSingle")}</p>}
        {!compact && !listing.mine && (
          <>
            <button
              onClick={() => setChatOpen(true)}
              className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-accent/20 text-sm font-semibold text-accent-soft ring-1 ring-accent/30 transition active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" /> {t("chat_contact")}
            </button>
            <ChatDialog
              open={chatOpen}
              onOpenChange={setChatOpen}
              meta={{
                id: `t-${listing.id}`,
                listingId: listing.id,
                title: listing.name,
                image: listing.image,
                counterpart: listing.seller,
                role: "buyer",
              }}
            />
          </>
        )}
      </div>
    </article>
  );
}
