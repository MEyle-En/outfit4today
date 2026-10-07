"use client";

import { useMemo, useState } from "react";
import { ItemImage } from "@/components/wardrobe/ItemImage";
import { useRouter } from "next/navigation";
import { CalendarCheck, Shirt, Sparkles } from "lucide-react";
import { TodayItemActions } from "@/components/home/TodayItemActions";
import { ListItemDialog } from "@/components/profile/ListItemDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { categoryLabel } from "@/lib/categories";
import { colorLabel } from "@/lib/colors";
import { playSound } from "@/lib/sound";
import { toast } from "@/lib/store/useToastStore";
import { todayKey, useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { haptic } from "@/lib/utils/haptic";
import { daysSince } from "@/lib/wear";
import type { WardrobeItem } from "@/types";

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

/**
 * "Item des Tages" mit direkten Aktionen. Jede Aktion markiert das Teil für heute als erledigt,
 * danach erscheint automatisch das nächste (kein Zähler-Index, sondern eine Liste erledigter IDs – das
 * bleibt stabil, wenn sich der Wardrobe zwischendurch ändert). Der Fortschritt liegt im Store und gilt pro Tag.
 *
 * Reihenfolge der Vorschläge: nie getragene Teile zuerst, danach das am längsten nicht getragene.
 */
export function TodayItem() {
  const { t } = useTranslation();
  const router = useRouter();
  const items = useWardrobeStore((s) => s.items);
  const daily = useWardrobeStore((s) => s.daily);
  const markWorn = useWardrobeStore((s) => s.markWorn);
  const markHandledToday = useWardrobeStore((s) => s.markHandledToday);
  const resetDaily = useWardrobeStore((s) => s.resetDaily);

  // Welches Teil ist gerade im Verkaufen-/Tauschen-Dialog (und mit welchem Modus)?
  const [offer, setOffer] = useState<{ id: string; mode: "sell" | "swap" } | null>(null);

  const clothes = useMemo(() => items.filter((i) => i.category !== "lifestyle"), [items]);
  const handled = daily.date === todayKey() ? daily.handled : []; // neuer Tag => Fortschritt beginnt von vorn

  const candidate: WardrobeItem | undefined = useMemo(
    () =>
      clothes
        .filter((i) => !handled.includes(i.id) && !isToday(i.lastWorn) && !i.visibility.onMarketplace)
        .sort((a, b) => {
          if ((a.wearCount === 0) !== (b.wearCount === 0)) return a.wearCount === 0 ? -1 : 1;
          return (a.lastWorn ? new Date(a.lastWorn).getTime() : 0) - (b.lastWorn ? new Date(b.lastWorn).getTime() : 0);
        })[0],
    // handled ist pro Render neu berechnet – die Inhalte (daily) sind die eigentliche Abhängigkeit
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clothes, daily],
  );

  const reason = !candidate
    ? ""
    : candidate.wearCount === 0
      ? t("reason_never")
      : t("today_lastWorn", { n: daysSince(candidate.lastWorn) });

  const wear = () => {
    if (!candidate) return;
    markWorn([candidate.id]);
    markHandledToday(candidate.id); // -> nächstes Teil erscheint sofort
    playSound("success");
    haptic("success");
    toast(t("today_wornToast"), t("today_wornToastDesc"));
  };

  const skip = () => candidate && markHandledToday(candidate.id);

  const styleInLab = () => {
    if (!candidate) return;
    markHandledToday(candidate.id); // nach der Rückkehr aus dem Lab ist schon das nächste Teil dran
    router.push(`/lab?prefill=${candidate.id}`);
  };

  const closeOffer = (open: boolean) => {
    if (open || !offer) return;
    const id = offer.id;
    setOffer(null);
    // Wurde das Teil tatsächlich angeboten, ist es für heute erledigt -> weiter zum nächsten
    const now = useWardrobeStore.getState().items.find((i) => i.id === id);
    if (now?.visibility.onMarketplace) markHandledToday(id);
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
      ) : !candidate ? (
        <EmptyState
          compact
          icon={CalendarCheck}
          title={t("today_allDoneTitle")}
          description={t("today_allDoneDesc")}
          actionLabel={t("today_restart")}
          onAction={resetDaily}
        />
      ) : (
        // key = Teil-ID: beim Weiterschalten wird die Karte neu eingeblendet
        <article
          key={candidate.id}
          className="animate-fade-in-up space-y-3 rounded-2xl border border-white/10 bg-surface p-3"
        >
          <div className="flex gap-4">
            <ItemImage src={candidate.image} alt={candidate.name} transparent={candidate.hasTransparentBackground} className="aspect-[4/5] w-32 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-display text-2xl font-bold leading-tight">{candidate.name}</p>
              <p className="text-sm text-zinc-400">
                {categoryLabel(candidate.category)}
                {candidate.color ? ` · ${colorLabel(candidate.color)}` : ""}
              </p>
              {/* Warum genau dieses Teil? */}
              <p className="inline-block rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-soft">{reason}</p>
            </div>
          </div>

          <TodayItemActions
            onStyle={styleInLab}
            onSell={() => setOffer({ id: candidate.id, mode: "sell" })}
            // "Tauschen" = als Tausch-Angebot in den Marketplace (die Crew-Swap-Vorschläge gibt es nur auf Posts anderer)
            onSwap={() => setOffer({ id: candidate.id, mode: "swap" })}
            onWorn={wear}
            onSkip={skip}
          />
        </article>
      )}

      {/* key: Dialog startet je Teil und Modus frisch mit dem richtigen Vorbelegen */}
      {offer && (
        <ListItemDialog
          key={`${offer.id}-${offer.mode}`}
          open
          onOpenChange={closeOffer}
          initialSelected={[offer.id]}
          initialMode={offer.mode}
        />
      )}

      <p className="text-xs text-zinc-500">{t("today_hint")}</p>
    </section>
  );
}
