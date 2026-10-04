"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Shirt, SkipForward, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { categoryLabel } from "@/lib/categories";
import { colorLabel } from "@/lib/colors";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { daysSince } from "@/lib/wear";
import type { WardrobeItem } from "@/types";

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

/**
 * "Item des Tages": genau ein Teil aus dem eigenen Wardrobe, das heute dran wäre.
 * Auswahl-Regel (bewusst simpel): nie getragene Teile zuerst, danach das am längsten nicht getragene.
 * "Heute getragen" merkt sich das Datum, "Überspringen" zeigt das nächste Teil.
 */
export function TodayItem() {
  const { t } = useTranslation();
  const router = useRouter();
  const items = useWardrobeStore((s) => s.items);
  const markWorn = useWardrobeStore((s) => s.markWorn);
  const [skipped, setSkipped] = useState<string[]>([]);

  const clothes = useMemo(() => items.filter((i) => i.category !== "lifestyle"), [items]);
  const wornToday = clothes.filter((i) => isToday(i.lastWorn));

  const candidate: WardrobeItem | undefined = useMemo(
    () =>
      clothes
        .filter((i) => !isToday(i.lastWorn) && !skipped.includes(i.id))
        .sort((a, b) => {
          if ((a.wearCount === 0) !== (b.wearCount === 0)) return a.wearCount === 0 ? -1 : 1;
          return (a.lastWorn ? new Date(a.lastWorn).getTime() : 0) - (b.lastWorn ? new Date(b.lastWorn).getTime() : 0);
        })[0],
    [clothes, skipped],
  );

  const reason = !candidate
    ? ""
    : candidate.wearCount === 0
      ? t("reason_never")
      : t("today_lastWorn", { n: daysSince(candidate.lastWorn) });

  const wear = () => {
    if (!candidate) return;
    markWorn([candidate.id]);
    playSound("success");
    haptic("success");
    toast(t("today_wornToast"), t("today_wornToastDesc"));
  };

  return (
    <section className="space-y-3" aria-labelledby="today-item">
      <h2 id="today-item" className="flex items-center gap-2 font-display text-xl font-bold">
        <Sparkles className="h-5 w-5 text-accent-soft" /> {t("today_title")}
      </h2>

      {clothes.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title={t("today_emptyTitle")}
          description={t("today_emptyDesc")}
          actionLabel={t("emptyLooksAction")}
          onAction={() => router.push("/wardrobe")}
        />
      ) : wornToday.length > 0 ? (
        <EmptyState
          compact
          icon={Check}
          title={t("today_doneTitle")}
          description={t("today_doneDesc", { names: wornToday.map((i) => i.name).join(", ") })}
        />
      ) : !candidate ? (
        <EmptyState
          compact
          icon={SkipForward}
          title={t("today_allSkippedTitle")}
          description={t("today_allSkippedDesc")}
          actionLabel={t("today_restart")}
          onAction={() => setSkipped([])}
        />
      ) : (
        <article className="animate-fade-in-up card-lift flex gap-4 rounded-2xl border border-white/10 bg-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={candidate.image} alt={candidate.name} className="aspect-[4/5] w-36 shrink-0 rounded-xl object-cover" />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div className="space-y-1">
              <p className="font-display text-2xl font-bold leading-tight">{candidate.name}</p>
              <p className="text-sm text-zinc-400">
                {categoryLabel(candidate.category)}
                {candidate.color ? ` · ${colorLabel(candidate.color)}` : ""}
              </p>
              {/* Warum genau dieses Teil? */}
              <p className="inline-block rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-soft">{reason}</p>
            </div>
            <div className="space-y-2">
              <Button silent className="w-full" onClick={wear}>
                <Check className="h-5 w-5" /> {t("today_worn")}
              </Button>
              <Button variant="glass" className="w-full" onClick={() => setSkipped((s) => [...s, candidate.id])}>
                {t("today_skip")}
              </Button>
            </div>
          </div>
        </article>
      )}
      <p className="text-xs text-zinc-500">{t("today_hint")}</p>
    </section>
  );
}
