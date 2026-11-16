import { ICON_CATEGORIES, preferredColors } from "@/lib/style-match";
import type { ItemCategory, ItemColor, StylePrefs, WardrobeItem } from "@/types";

/** Farben, die zu praktisch allem passen. */
const NEUTRAL: ReadonlySet<ItemColor> = new Set<ItemColor>(["black", "white", "gray", "beige", "blue", "brown"]);

/**
 * Was ein Vibe konkret am Outfit ändert (Vibe Check, Schritt 1):
 *  - colors: Farben, die dieser Vibe bevorzugt
 *  - extra:  ein zusätzliches Teil, das zu diesem Vibe gehört (z.B. Cap bei Streetwear, Jacke bei Gorpcore)
 *  - loud:   wie viele kräftige Farben das Outfit haben darf (Minimal: keine, Y2K: zwei)
 */
export const VIBE_RULES: Record<string, { colors: ItemColor[]; extra: ItemCategory[]; loud: number }> = {
  streetwear: { colors: ["black", "gray", "white", "green"], extra: ["hat", "shoes"], loud: 1 },
  y2k: { colors: ["pink", "purple", "blue", "white"], extra: ["bag", "jewelry"], loud: 2 },
  minimal: { colors: ["black", "white", "gray", "beige"], extra: [], loud: 0 },
  gorpcore: { colors: ["green", "brown", "gray", "orange"], extra: ["outerwear", "hat"], loud: 1 },
  vintage: { colors: ["blue", "brown", "beige", "red"], extra: ["accessory", "bag"], loud: 1 },
  "dark-academia": { colors: ["brown", "beige", "black", "gray"], extra: ["outerwear", "accessory"], loud: 0 },
};

/** Welche Teile ein Outfit rund um die Kategorie des Ausgangsteils komplett machen. */
function slotsFor(category: ItemCategory): ItemCategory[] {
  switch (category) {
    case "top":
      return ["bottom", "shoes"];
    case "bottom":
      return ["top", "shoes"];
    case "dress":
      return ["shoes", "outerwear"];
    case "shoes":
      return ["top", "bottom"];
    case "outerwear":
      return ["top", "bottom", "shoes"];
    default:
      return ["top", "bottom", "shoes"]; // Accessoires, Taschen, Mützen …
  }
}

const lastWornTime = (i: WardrobeItem) => (i.lastWorn ? new Date(i.lastWorn).getTime() : 0);
const isLoud = (i: WardrobeItem) => !!i.color && !NEUTRAL.has(i.color);

export interface OutfitResult {
  items: WardrobeItem[];
  /** Begleiter, deren Farbe aus dem Vibe Check stammt (Palette oder Vibe) – für die Begründung auf der Karte */
  styleHits: number;
  /** Zusätzliches Teil, das wegen Vibe oder Lieblings-Piece dazukam */
  extra?: WardrobeItem;
}

/**
 * Ergänzt ein Ausgangsteil zu einem tragbaren Outfit (je ein Begleiter pro Kategorie, plus ggf. ein Vibe-Extra).
 * Bewusst einfache, nachvollziehbare Regeln statt Blackbox:
 *  - neutrale Farben passen immer; wie viele kräftige Farben erlaubt sind, bestimmt der Vibe
 *  - Farben aus dem Vibe Check (Paletten + Vibe) werden bevorzugt
 *  - Lieblings-Pieces und das Vibe-Extra kommen als zusätzliches Teil dazu
 *  - bei Gleichstand gewinnt das Teil, das am längsten nicht getragen wurde
 * Angebotene (Marketplace) und Vibe-Teile bleiben außen vor.
 */
export function completeOutfit(base: WardrobeItem, wardrobe: WardrobeItem[], prefs?: StylePrefs): OutfitResult {
  const pool = wardrobe.filter((i) => i.id !== base.id && i.category !== "lifestyle" && !i.visibility.onMarketplace);
  const rules = (prefs?.vibes ?? []).map((v) => VIBE_RULES[v]).filter(Boolean);
  const liked = new Set<ItemColor>([...(prefs ? Array.from(preferredColors(prefs)) : []), ...rules.flatMap((r) => r.colors)]);

  // Kräftige Farben im Outfit; ein kräftiges Ausgangsteil zählt mit und ist immer erlaubt
  const loud = new Set<ItemColor>();
  if (isLoud(base)) loud.add(base.color as ItemColor);
  const limit = Math.max(rules.length ? Math.max(...rules.map((r) => r.loud)) : 1, loud.size);
  const fits = (i: WardrobeItem) => !isLoud(i) || loud.has(i.color as ItemColor) || loud.size < limit;

  const picked: WardrobeItem[] = [];
  const score = (i: WardrobeItem) => (i.color && liked.has(i.color) ? 2 : 0) + (isLoud(i) ? 0 : 1);
  const pick = (cats: ItemCategory[]) =>
    pool
      .filter((i) => cats.includes(i.category) && fits(i) && !picked.includes(i))
      .sort((a, b) => score(b) - score(a) || lastWornTime(a) - lastWornTime(b))[0];
  const take = (i: WardrobeItem | undefined) => {
    if (!i) return undefined;
    picked.push(i);
    if (isLoud(i)) loud.add(i.color as ItemColor);
    return i;
  };

  for (const slot of slotsFor(base.category)) take(pick([slot]));

  // Vibe-Extra bzw. Lieblings-Piece: eine Kategorie, die noch nicht im Outfit ist
  const have = new Set<ItemCategory>([base.category, ...picked.map((p) => p.category)]);
  const wanted = [...rules.flatMap((r) => r.extra), ...(prefs?.icons ?? []).flatMap((id) => ICON_CATEGORIES[id] ?? [])].filter((c) => !have.has(c));
  const extra = wanted.length ? take(pick(wanted)) : undefined;

  return { items: picked, styleHits: picked.filter((i) => i.color && liked.has(i.color)).length, extra };
}
