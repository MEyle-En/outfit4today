"use client";

import { useMemo, useState } from "react";
import { ItemImage } from "@/components/wardrobe/ItemImage";
import { MessageCircle, Package, Plus, ShoppingBag, X } from "lucide-react";
import { ChatDialog } from "@/components/market/ChatDialog";
import { ListItemDialog } from "@/components/profile/ListItemDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { useBundleStore } from "@/lib/store/useBundleStore";
import { useChatStore, unreadOf, type ThreadMeta } from "@/lib/store/useChatStore";
import { useModerationStore } from "@/lib/store/useModerationStore";
import { notify } from "@/lib/store/useNotificationStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import type { BundleListing, WardrobeItem } from "@/types";

function ListingRow({ item }: { item: WardrobeItem }) {
  const { t } = useTranslation();
  const setListing = useWardrobeStore((s) => s.setListing);
  const removeItem = useWardrobeStore((s) => s.removeItem);
  // Selektor liefert die stabile `threads`-Referenz; gefiltert wird erst danach (sonst "Maximum update depth exceeded")
  const allThreads = useChatStore((s) => s.threads);
  const inquiries = useMemo(
    () => allThreads.filter((x) => x.role === "seller" && x.listingId === item.id).length,
    [allThreads, item.id],
  );

  return (
    <article className="animate-fade-in-up card-lift flex gap-3 rounded-2xl border border-white/10 bg-surface p-3">
      <ItemImage src={item.image} alt={item.name} transparent={item.hasTransparentBackground} className="h-24 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display text-lg font-semibold leading-tight">{item.name}</p>
          <button
            onClick={() => setListing([item.id], undefined)}
            aria-label={t("mine_unlist", { name: item.name })}
            className="icon-btn text-zinc-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default">
            {item.listing === "swap" ? t("mode_swap") : `💰 ${item.price ?? t("price_vb")} €${item.listing === "both" ? ` · ${t("mode_swap")}` : ""}`}
          </Badge>
          {item.size && <Badge>{item.size}</Badge>}
          <Badge>{t("mine_public")}</Badge>
          {item.visibility.sharedWithCrew && <Badge>{t("vis_crew")}</Badge>}
        </div>

        {item.listing !== "swap" && (
          <button
            onClick={() => {
              // Verkauf abgeschlossen: das Teil verlässt den Wardrobe, die Benachrichtigung löst das Geld-Rascheln aus
              notify("sale", t("notif_sale", { item: item.name, price: item.price ?? 0 }), "/marketplace");
              removeItem(item.id);
            }}
            className="text-xs text-accent-soft underline underline-offset-2"
          >
            {t("mine_markSold")}
          </button>
        )}

        <p className="text-xs text-zinc-500">{inquiries > 0 ? t("mine_inquiryCount", { n: inquiries }) : t("mine_noInquiries")}</p>
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
          <ItemImage key={p.id} src={p.image} alt={p.name} transparent={p.hasTransparentBackground} className="h-11 w-[38px] rounded-md" />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-base font-semibold leading-tight">{bundle.description}</p>
          <button onClick={() => removeBundle(bundle.id)} aria-label={t("remove")} className="icon-btn text-zinc-500 hover:text-white">
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

/** "Anfragen": Chats, in denen jemand zu einem meiner Angebote schreibt (ich bin der Verkäufer), mit Badge für Ungelesenes. */
function InquiriesSection() {
  const { t } = useTranslation();
  const threads = useChatStore((s) => s.threads);
  const readAt = useChatStore((s) => s.readAt);
  const blocked = useModerationStore((s) => s.blocked);
  const [open, setOpen] = useState<ThreadMeta | null>(null);
  const inquiries = useMemo(
    () => threads.filter((x) => x.role === "seller" && !blocked.includes(x.counterpartId)),
    [threads, blocked],
  );
  const total = inquiries.reduce((n, th) => n + unreadOf(th, readAt), 0);
  if (inquiries.length === 0) return null;

  return (
    <section className="space-y-2 rounded-2xl border border-accent/30 bg-accent/10 p-3" aria-label={t("inq_title")}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageCircle className="h-4 w-4 text-accent-soft" /> {t("inq_title")}
        {total > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{total}</span>}
      </h3>
      <ul className="space-y-1.5">
        {inquiries.map((th) => {
          const unread = unreadOf(th, readAt);
          return (
            <li key={th.id}>
              <button
                onClick={() => setOpen(th)}
                className="flex w-full items-center gap-3 rounded-xl bg-black/20 p-2 text-left hover:bg-black/30"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {th.counterpart || t("user_unknown")} · <span className="text-zinc-400">{th.title}</span>
                  </span>
                  <span className={`block truncate text-xs ${unread ? "text-white" : "text-zinc-500"}`}>{th.last?.text ?? t("chat_first")}</span>
                </span>
                {unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label={t("inq_unread")} />}
              </button>
            </li>
          );
        })}
      </ul>
      {open && <ChatDialog meta={open} open onOpenChange={(o) => !o && setOpen(null)} />}
    </section>
  );
}

/** "Meine Verkäufe": alle eigenen Teile und Bundles, die ich zum Verkauf/Tausch anbiete, mit Status. */
export function MyListings() {
  const { t } = useTranslation();
  const items = useWardrobeStore((s) => s.items);
  const bundles = useBundleStore((s) => s.bundles);
  const [listOpen, setListOpen] = useState(false);
  const listed = items.filter((i) => i.visibility.onMarketplace && i.listing);
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
          <InquiriesSection />
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
