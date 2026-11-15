import type { ItemCategory, ItemColor, WardrobeItem } from "@/types";

/** Farben, die zu praktisch allem passen. */
const NEUTRAL: ReadonlySet<ItemColor> = new Set<ItemColor>(["black", "white", "gray", "beige", "blue", "brown"]);

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

/**
 * Ergänzt ein Ausgangsteil zu einem tragbaren Outfit (max. 3 Begleiter, je einer pro Kategorie).
 * Bewusst einfache, nachvollziehbare Regeln statt Blackbox:
 *  - neutrale Farben passen immer; ist das Ausgangsteil neutral, passt jede Farbe
 *  - zwei verschiedene kräftige Farben werden vermieden (höchstens eine "laute" Farbe pro Outfit)
 *  - bei Gleichstand gewinnt das Teil, das am längsten nicht getragen wurde
 * Angebotene (Marketplace) und Vibe-Teile bleiben außen vor.
 */
export function completeOutfit(base: WardrobeItem, wardrobe: WardrobeItem[]): WardrobeItem[] {
  const pool = wardrobe.filter((i) => i.id !== base.id && i.category !== "lifestyle" && !i.visibility.onMarketplace);
  const picked: WardrobeItem[] = [];
  // Die eine erlaubte kräftige Farbe des Outfits (falls schon vergeben)
  let loud: ItemColor | undefined = base.color && !NEUTRAL.has(base.color) ? base.color : undefined;

  const score = (i: WardrobeItem) => {
    if (!i.color || NEUTRAL.has(i.color)) return 2;
    if (!loud) return 1; // erste kräftige Farbe ist willkommen
    return i.color === loud ? 1 : -1; // zweite, andere kräftige Farbe: nur wenn es nichts Besseres gibt
  };

  for (const slot of slotsFor(base.category)) {
    const best = pool
      .filter((i) => i.category === slot)
      .sort((a, b) => score(b) - score(a) || lastWornTime(a) - lastWornTime(b))[0];
    if (!best || score(best) < 0) continue;
    picked.push(best);
    if (best.color && !NEUTRAL.has(best.color)) loud = loud ?? best.color;
  }
  return picked;
}
