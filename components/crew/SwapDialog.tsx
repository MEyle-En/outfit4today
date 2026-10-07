"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { translate } from "@/lib/i18n/translate";
import { useTranslation } from "@/hooks/useTranslation";
import { PickTile } from "@/components/wardrobe/PickTile";
import { useItemLookup } from "@/hooks/useItemLookup";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import type { FitPost } from "@/types";

const TEMPLATES = {
  better: (name: string) => translate("swap_better", { name }),
  swap: () => translate("swap_letsSwap"),
};

/** Tauschvorschlag: ein Teil aus MEINEM Wardrobe für ein Teil aus dem Fit des Freundes. */
export function SwapDialog({
  post,
  open,
  onOpenChange,
}: {
  post: FitPost;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const addComment = useCrewStore((s) => s.addComment);
  const mine = useWardrobeStore((s) => s.items);
  const lookup = useItemLookup();

  const [targetId, setTargetId] = useState(post.layers[0]?.itemId ?? "");
  const [offeredId, setOfferedId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const target = post.layers.find((l) => l.itemId === targetId);
  const offered = mine.find((i) => i.id === offeredId);

  // Items der gleichen Kategorie zuerst
  const sorted = useMemo(
    () => [...mine].sort((a, b) => Number(b.category === target?.category) - Number(a.category === target?.category)),
    [mine, target?.category],
  );

  const reset = () => {
    setOfferedId(null);
    setMsg("");
  };

  const submit = () => {
    if (!target || !offered) return;
    addComment(post.id, {
      authorId: "me",
      kind: "swap",
      text: msg.trim() || TEMPLATES.better(offered.name),
      swap: {
        offeredItemId: offered.id,
        offeredName: offered.name,
        targetItemId: target.itemId,
        targetName: target.name,
      },
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("swap_suggestion")}</DialogTitle>
        <DialogDescription>{t("swap_desc")}</DialogDescription>

        <div className="mt-5 space-y-5">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("swap_replace")}</p>
            <div className="grid grid-cols-4 gap-2">
              {post.layers.map((l) => (
                <PickTile
                  key={l.itemId}
                  image={lookup(l.itemId)?.image}
                  transparent={lookup(l.itemId)?.hasTransparentBackground}
                  name={l.name}
                  selected={targetId === l.itemId}
                  onClick={() => setTargetId(l.itemId)}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("swap_withMine")}</p>
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto pr-1">
              {sorted.map((i) => (
                <PickTile
                  key={i.id}
                  image={i.image}
                  transparent={i.hasTransparentBackground}
                  name={i.name}
                  selected={offeredId === i.id}
                  onClick={() => {
                    setOfferedId(i.id);
                    setMsg(TEMPLATES.better(i.name));
                  }}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex gap-2">
              <button
                disabled={!offered}
                onClick={() => offered && setMsg(TEMPLATES.better(offered.name))}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
              >
                {t("swap_chipBetter")}
              </button>
              <button
                onClick={() => setMsg(TEMPLATES.swap())}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
              >
                {t("swap_chipSwap")}
              </button>
            </div>
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("swap_messagePh")} aria-label={t("swap_message")} />
          </section>

          <Button size="lg" className="w-full" disabled={!offered || !target} onClick={submit}>
            <ArrowLeftRight className="h-5 w-5" /> {t("swap_send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
