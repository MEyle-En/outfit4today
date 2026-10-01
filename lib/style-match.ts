import type { ItemCategory, ItemColor, StylePrefs, VibeId } from "@/types";

/** Vibe-Check-Farbpaletten (siehe lib/mock/quiz.ts) -> konkrete Item-Farben. */
const PALETTE: Record<string, ItemColor[]> = {
  mono: ["black", "white", "gray"],
  earth: ["brown", "beige", "orange"],
  neon: ["purple", "pink", "green", "yellow"],
  pastel: ["pink", "blue", "purple", "white"],
  denim: ["blue", "gray", "white"],
  forest: ["green", "brown", "beige"],
};

/** Vibe-Check-"Icons" -> Kategorien, die der User liebt. */
const ICON_CATEGORIES: Record<string, ItemCategory[]> = {
  hoodie: ["top"],
  sneakers: ["shoes"],
  shades: ["accessory"],
  jewelry: ["jewelry"],
  watch: ["accessory"],
  cap: ["hat"],
};

export const preferredColors = (prefs: StylePrefs) => new Set(prefs.colors.flatMap((c) => PALETTE[c] ?? []));

export const hasPrefs = (prefs: StylePrefs) => prefs.vibes.length + prefs.colors.length + prefs.icons.length > 0;

/** 0–100: wie gut passt etwas zum Vibe Check? (Vibe zählt am meisten, dann Farbe, dann Kategorie) */
export function matchScore(x: { vibe?: VibeId; color?: ItemColor; category: ItemCategory }, prefs: StylePrefs): number {
  if (!hasPrefs(prefs)) return 0;
  const vibe = x.vibe && prefs.vibes.includes(x.vibe) ? 5 : 0;
  const color = x.color && preferredColors(prefs).has(x.color) ? 3 : 0;
  const cat = prefs.icons.some((i) => ICON_CATEGORIES[i]?.includes(x.category)) ? 2 : 0;
  return Math.round(((vibe + color + cat) / 10) * 100);
}
