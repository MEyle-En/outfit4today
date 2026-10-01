"use client";

import { Heart } from "lucide-react";
import { playSound } from "@/lib/sound";
import { useTranslation } from "@/hooks/useTranslation";
import { usePreferencesStore, type LikeTraits } from "@/lib/store/usePreferencesStore";
import { useLikes } from "@/lib/store/useSocialStore";
import { cn } from "@/lib/utils";

/** Herz mit Zähler. `overlay` = kompakte Variante auf Bildern. */
export function LikeButton({
  likeKey,
  mine = false,
  overlay = false,
  traits,
  className,
}: {
  likeKey: string;
  mine?: boolean;
  overlay?: boolean;
  /** Was wurde geliket? Wird als Vorliebe gespeichert (Grundlage für spätere KI-Empfehlungen). */
  traits?: LikeTraits;
  className?: string;
}) {
  const { t } = useTranslation();
  const { liked, count, toggle } = useLikes(likeKey, mine);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
        if (!liked) playSound("notification"); // kleines Pop nur beim Liken, nicht beim Zurücknehmen
        if (traits) usePreferencesStore.getState().recordLike(traits, liked ? -1 : 1);
      }}
      aria-pressed={liked}
      aria-label={t("like_aria", { n: count })}
      className={cn(
        "flex items-center gap-1.5 rounded-full border text-sm transition active:scale-90",
        overlay ? "border-transparent bg-black/60 px-2.5 py-1 text-white backdrop-blur-md" : "px-3 py-1.5",
        !overlay && (liked ? "border-accent/60 bg-accent/20" : "border-white/10 bg-white/5"),
        className,
      )}
    >
      <Heart className={cn("h-4 w-4 transition-colors", liked && "fill-accent text-accent")} />
      <span className="text-xs tabular-nums">{count}</span>
    </button>
  );
}
