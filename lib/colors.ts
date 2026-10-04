import { translate } from "@/lib/i18n/translate";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ItemColor } from "@/types";

export const COLORS: { id: ItemColor; /** CSS-Background */ swatch: string }[] = [
  { id: "black", swatch: "#000000" },
  { id: "white", swatch: "#FFFFFF" },
  { id: "gray", swatch: "#6B7280" },
  { id: "blue", swatch: "#3B82F6" },
  { id: "red", swatch: "#EF4444" },
  { id: "green", swatch: "#22C55E" },
  { id: "yellow", swatch: "#EAB308" },
  { id: "brown", swatch: "#78350F" },
  { id: "beige", swatch: "#D6C3A3" },
  { id: "pink", swatch: "#EC4899" },
  { id: "purple", swatch: "#A855F7" },
  { id: "orange", swatch: "#F97316" },
  {
    id: "multicolor",
    swatch: "conic-gradient(#EF4444, #EAB308, #22C55E, #3B82F6, #A855F7, #EF4444)",
  },
];

export const swatchOf = (id: ItemColor | undefined) => COLORS.find((c) => c.id === id)?.swatch;

/** Übersetzter Farbname in der aktuellen Sprache. */
export const colorLabel = (id: ItemColor) => translate(`color_${id}` as TranslationKey);

// Präfix-Match am Wortanfang: "schwarze", "Schwarzer", "hellblau" -> passende Farbe.
const RULES: [RegExp, ItemColor][] = [
  [/multi|bunt|rainbow/, "multicolor"],
  [/schwarz|black/, "black"],
  [/wei(ß|ss)|white|offwhite/, "white"],
  [/grau|grey|gray|silber|silver|anthrazit/, "gray"],
  [/blau|blue|navy|denim|türkis|petrol/, "blue"],
  [/rot|red|bordeaux|burgund/, "red"],
  [/gr(ü|ue)n|green|olive|mint/, "green"],
  [/gelb|yellow|senf/, "yellow"],
  [/braun|brown|cognac/, "brown"],
  [/beige|creme|cream|khaki/, "beige"],
  [/rosa|pink|rose/, "pink"],
  [/lila|violett|purple|lavendel/, "purple"],
  [/orange|apricot/, "orange"],
  // FR / ES / IT: nur exakte Wörter
  [/^(noir|negro|nero)$/, "black"],
  [/^(blanc|blanche|blanco|bianco)$/, "white"],
  [/^(gris|grigio)$/, "gray"],
  [/^(bleu|azul)$/, "blue"],
  [/^(rouge|rojo|rosso)$/, "red"],
  [/^(vert|verte|verde)$/, "green"],
  [/^(jaune|amarillo|giallo)$/, "yellow"],
  [/^(marron|marrone)$/, "brown"],
];

/** Freitext ("Hellblau", "Navy", "black", "Schwarze Jeans") -> ItemColor. Liefert das erste Wort, das passt. */
export function colorFromLabel(label: string | undefined): ItemColor | undefined {
  const words = (label ?? "").toLowerCase().split(/[^a-zäöüß]+/).filter(Boolean);
  for (const w of words) {
    for (const [re, color] of RULES) {
      const m = re.exec(w);
      // Treffer nur am Wortanfang ("schwarze") oder -ende ("hellblau", "dunkelgrün") – vermeidet "Sandalen" -> Beige
      if (m && (m.index === 0 || m.index + m[0].length === w.length)) return color;
    }
  }
  return undefined;
}
