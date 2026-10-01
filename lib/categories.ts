import { useMemo } from "react";
import { translate } from "@/lib/i18n/translate";
import type { TranslationKey } from "@/lib/i18n/translations";
import { useLangStore } from "@/lib/store/useLangStore";
import type { ItemCategory } from "@/types";

export const CATEGORIES: { id: ItemCategory; emoji: string }[] = [
  { id: "top", emoji: "👕" },
  { id: "bottom", emoji: "👖" },
  { id: "outerwear", emoji: "🧥" },
  { id: "dress", emoji: "👗" },
  { id: "shoes", emoji: "👟" },
  { id: "bag", emoji: "👜" },
  { id: "jewelry", emoji: "💍" },
  { id: "hat", emoji: "🧢" },
  { id: "hijab", emoji: "🧕" },
  { id: "socks", emoji: "🧦" },
  { id: "accessory", emoji: "🕶️" },
  { id: "lifestyle", emoji: "🪴" },
];

/** Übersetzter Kategoriename in der aktuellen Sprache. */
export const categoryLabel = (id: ItemCategory) => translate(`cat_${id}` as TranslationKey);

/** Chip-Optionen (Emoji + Name) in der aktuellen Sprache – bei Sprachwechsel neu berechnet. */
export function useCategoryOptions() {
  const lang = useLangStore((s) => s.lang);
  return useMemo(
    () => CATEGORIES.map((c) => ({ id: c.id, label: `${c.emoji} ${categoryLabel(c.id)}` })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );
}

/** Für Migration alter Items: Kategorie-Tag ("Hose", "Oberteil", …) -> ItemCategory. */
export function categoryFromLabel(label: string | undefined): ItemCategory {
  const l = (label ?? "").toLowerCase();
  if (/hijab/.test(l)) return "hijab";
  if (/vibe|lifestyle|decor/.test(l)) return "lifestyle";
  if (/hose|bottom|rock/.test(l)) return "bottom";
  if (/jacke|mantel|outer/.test(l)) return "outerwear";
  if (/kleid|dress/.test(l)) return "dress";
  if (/schuh|shoe/.test(l)) return "shoes";
  if (/tasche|bag/.test(l)) return "bag";
  if (/schmuck|jewel/.test(l)) return "jewelry";
  if (/cap|mütze|hut|hat/.test(l)) return "hat";
  if (/socke/.test(l)) return "socks";
  if (/access/.test(l)) return "accessory";
  return "top";
}
