"use client";

import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { playSound } from "@/lib/sound";
import { useLabStore } from "@/lib/store/useLabStore";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { haptic } from "@/lib/utils/haptic";

/** Alle Teile des aktuellen Fits als heute getragen merken (last_worn = jetzt, wear_count + 1). */
export function WearTodayButton() {
  const { t } = useTranslation();
  const count = useLabStore((s) => s.items.length);

  const wear = () => {
    const ids = useLabStore.getState().items.map((i) => i.itemId);
    const n = useWardrobeStore.getState().wearItems(ids);
    if (n === 0) return;
    playSound("success");
    haptic("success");
    toast(t("lab_wornToast", { n }));
  };

  return (
    <Button size="sm" variant="glass" className="w-full border-accent/40" onClick={wear} disabled={count === 0}>
      <CalendarCheck className="h-4 w-4" /> {t("lab_wearToday")}
    </Button>
  );
}
