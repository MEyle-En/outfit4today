"use client";

import { useMemo, useState } from "react";
import { EyeOff, MessageCircle, Package, Plus, ShoppingBag, X } from "lucide-react";
import { ChatDialog } from "@/components/market/ChatDialog";
import { ListItemDialog } from "@/components/profile/ListItemDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { useBundleStore } from "@/lib/store/useBundleStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import type { BundleListing, WardrobeItem } from "@/types";

function ListingRow({ item }: { item: WardrobeItem }) {
  const { t } = useTranslation();
  const setListing = useWardrobeStore((s) => s.setListing);
  const toggleShared = useWardrobeStore((s) => s.toggleShared);
  // Wichtig: Selektor liefert die stabile `threads`-Referenz; gefiltert wird erst danach.
  // (Ein `.filter()` im Selektor erzeugt bei jedem Aufruf ein neues Array -> "Maximum update depth exceeded".)
  const allThreads = useChatStore((s) => s.threads);
  const thread = useMemo(
    () => allThreads.find((x) => x.role === "seller" && x.listingId === `mine-${item.id}`),
    [allThreads, item.id],
  );
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <article className="flex gap-3 rounded-2xl border border-white/10 bg-surface p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image} alt={item.name} className="h-24 w-20 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display text-lg font-semibold leading-tight">{item.name}</p>
          <button
            onClick={() => setListing([item.id], undefined)}
            aria-label={t("mine_unlist", { name: item.name })}
            className="text-zinc-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default">
            {item.listing === "swap" ? t("mode_swap") : `💰 ${item.price ?? t("price_vb")} €${item.listing === "both" ? ` · ${t("mode_swap")}` : ""}`}
          </Badge>
          {item.sharedWithCrew ? (
            <Badge>{t("mine_public")}</Badge>
          ) : (
            <Badge className="border-amber-400/40 text-amber-300">
              <EyeOff className="h-3 w-3" /> {t("item_private")}
            </Badge>
          )}
        </div>

        {!item.sharedWithCrew && (
          <button
            onClick={() => {
              toggleShared(item.id);
              toast(t("toast_visibility"), t("toast_nowVisible"));
            }}
            className="text-xs text-accent-soft underline underline-offset-2"
          >
            {t("mine_makeVisible")}
          </button>
        )}

        {thread ? (
          <Button size="sm" variant="glass" onClick={() => setChatOpen(true)}>
            <MessageCircle className="h-4 w-4" /> {t("mine_inquiryFrom", { name: thread.counterpart })}
            {thread.messages.length > 0 && <span className="text-zinc-400">({thread.messages.length})</span>}
          </Button>
        ) : (
          <p className="text-xs text-zinc-500">{t("mine_noInquiries")}</p>
        )}
        {thread && <ChatDialog meta={thread} open={chatOpen} onOpenChange={setChatOpen} />}
      </div>
    </article>
  );
}

function BundleRow({ bundle }: { bundle: BundleListing }) {
  const { t } = useTranslation();
  const items = useWardrobeStore((s) => s.items);
  const removeBundle = useBundleStore((s) => s.removeBundle);
  const parts = bundle.items.map((id) => items.find((i) => i.id === id)).filter((i): i is WardrobeItem => !!i);

  return (
    <article className="flex gap-3 rounded-2xl border border-amber-300/30 bg-surface p-3">
      <div className="flex w-20 shrink-0 flex-wrap gap-0.5">
        {parts.slice(0, 4).map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.image} alt={p.name} className="h-11 w-[38px] rounded-md object-cover" />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-base font-semibold leading-tight">{bundle.description}</p>
          <button onClick={() => removeBundle(bundle.id)} aria-label={t("remove")} className="text-zinc-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge className="border-pink-400/40 bg-gradient-to-r from-orange-400/25 to-pink-500/25 text-pink-100">
            <Package className="h-3 w-3" /> 📦 {t("bundle_badge")} · 💰 {bundle.bundlePrice} €
          </Badge>
          <Badge>{bundle.onlyTogether ? t("bundle_onlyTogether") : t("bundle_alsoSingle")}</Badge>
        </div>
      </div>
    </article>
  );
}

/** "Meine Verkäufe": alle eigenen Teile und Bundles, die ich zum Verkauf/Tausch anbiete, mit Status. */
export function MyListings() {
  const { t } = useTranslation();
  const items = useWardrobeStore((s) => s.items);
  const bundles = useBundleStore((s) => s.bundles);
  const [listOpen, setListOpen] = useState(false);
  const listed = items.filter((i) => i.listing);
  const empty = listed.length === 0 && bundles.length === 0;

  return (
    <div className="space-y-3">
      {empty ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("mine_emptyTitle")}
          description={t("mine_emptyDesc")}
          actionLabel={t("mine_offer")}
          onAction={() => setListOpen(true)}
        />
      ) : (
        <>
          <Button variant="glass" size="sm" className="w-full" onClick={() => setListOpen(true)}>
            <Plus className="h-4 w-4" /> {t("mine_offerMore")}
          </Button>
          {bundles.map((b) => (
            <BundleRow key={b.id} bundle={b} />
          ))}
          {listed.map((item) => (
            <ListingRow key={item.id} item={item} />
          ))}
        </>
      )}
      <ListItemDialog open={listOpen} onOpenChange={setListOpen} />
    </div>
  );
}
