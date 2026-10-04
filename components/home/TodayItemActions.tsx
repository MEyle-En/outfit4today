"use client";

import { ArrowLeftRight, ArrowRight, Check, Palette, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Die fünf Aktionen unter dem "Item des Tages". Eine horizontal scrollbare Reihe,
 * die Hauptaktion (Im Lab stylen) ist hervorgehoben, die anderen sind dunkel.
 */
export function TodayItemActions({
  onStyle,
  onSell,
  onSwap,
  onWorn,
  onSkip,
}: {
  onStyle: () => void;
  onSell: () => void;
  onSwap: () => void;
  onWorn: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="group" aria-label={t("today_title")}>
      <Button size="sm" className="shrink-0" onClick={onStyle}>
        <Palette className="h-4 w-4" /> {t("today_style")}
      </Button>
      <Button size="sm" variant="glass" className="shrink-0" onClick={onSell}>
        <Tag className="h-4 w-4" /> {t("today_sell")}
      </Button>
      <Button size="sm" variant="glass" className="shrink-0" onClick={onSwap}>
        <ArrowLeftRight className="h-4 w-4" /> {t("today_swap")}
      </Button>
      <Button size="sm" variant="glass" className="shrink-0" onClick={onWorn}>
        <Check className="h-4 w-4" /> {t("today_worn")}
      </Button>
      <Button size="sm" variant="glass" className="shrink-0" onClick={onSkip}>
        <ArrowRight className="h-4 w-4" /> {t("today_skip")}
      </Button>
    </div>
  );
}
