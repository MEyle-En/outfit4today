"use client";

import { useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListItemDialog } from "@/components/profile/ListItemDialog";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { useTranslation } from "@/hooks/useTranslation";
import { forgottenReason } from "@/lib/wear";

/** Schlägt Teile vor, die nie oder seit 60+ Tagen nicht getragen wurden – mit direktem Weg zum Anbieten. */
export function ForgottenTreasures() {
  const items = useWardrobeStore((s) => s.items);
  const { t } = useTranslation();
  const [offerId, setOfferId] = useState<string | null>(null);

  const forgotten = useMemo(
    () => items.flatMap((item) => {
      const reason = forgottenReason(item);
      return reason ? [{ item, reason }] : [];
    }),
    [items],
  );

  if (forgotten.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="forgotten">
      <div>
        <h2 id="forgotten" className="font-display text-xl font-bold">
          {t("forgottenTitle")}
        </h2>
        <p className="text-xs text-zinc-500">{t("forgottenHint")}</p>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {forgotten.map(({ item, reason }) => (
          <article key={item.id} className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-surface">
            <div className="relative aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
              <Badge variant="glass" className="absolute left-2 top-2 bg-black/60 py-0.5 text-[10px] text-white">
                {reason}
              </Badge>
            </div>
            <div className="space-y-2 p-2.5">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <Button size="sm" variant="warm" className="w-full" onClick={() => setOfferId(item.id)}>
                <Tag className="h-4 w-4" /> {t("offerNow")}
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* key = Item-ID: Dialog startet je Item mit genau diesem Teil vorausgewählt */}
      <ListItemDialog
        key={offerId ?? "closed"}
        open={offerId !== null}
        onOpenChange={(o) => !o && setOfferId(null)}
        initialSelected={offerId ? [offerId] : []}
      />
    </section>
  );
}
