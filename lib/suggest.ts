import { translate } from "@/lib/i18n/translate";
import { QUIZ_STEPS } from "@/lib/mock/quiz";
import { DEFAULT_SIZE, GRID } from "@/lib/lab";
import { hasPrefs, preferredColors } from "@/lib/style-match";
import { colorLabel } from "@/lib/colors";
import type { FitLayer, ItemColor, StylePrefs, WardrobeItem } from "@/types";

export interface Suggestion {
  id: string;
  title: string;
  items: WardrobeItem[];
  score: number;
  reasons: string[];
}

const NEUTRAL: ItemColor[] = ["black", "white", "gray", "beige"];
const ACCENT_CATS = ["accessory", "bag", "jewelry", "hat", "hijab", "socks"] as const;

// Deterministischer Pseudo-Zufall, damit "Neu mischen" (seed) andere, aber stabile Ergebnisse liefert
const jitter = (id: string, seed: number) => {
  let h = seed * 2654435761;
  for (let i = 0; i < id.length; i++) h = (h ^ id.charCodeAt(i)) * 16777619;
  return ((h >>> 0) % 1000) / 1000; // 0..1
};

function harmony(items: WardrobeItem[]) {
  const colors = items.map((i) => i.color).filter((c): c is ItemColor => !!c);
  const loud = new Set(colors.filter((c) => !NEUTRAL.includes(c)));
  if (colors.includes("multicolor") && colors.length > 1) return -2;
  if (loud.size <= 1) return 2; // neutral oder ein Akzent
  if (loud.size === 2) return 0;
  return -2;
}

/**
 * Baut Outfit-Kombis NUR aus dem eigenen Wardrobe.
 * Basis = Kleid oder Top + Bottom; dazu je bestes Teil für Schuhe, Jacke, Accessoire und optional ein Vibe-Item.
 * Bewertung: Passt die Farbe zur Vibe-Check-Palette? Harmonieren die Farben? (+ Zufallsanteil per seed)
 */
export function suggestOutfits(wardrobe: WardrobeItem[], prefs: StylePrefs, seed = 0, count = 3): Suggestion[] {
  const by = (cat: WardrobeItem["category"]) => wardrobe.filter((i) => i.category === cat);
  const tops = by("top");
  const bottoms = by("bottom");
  const dresses = by("dress");
  const shoes = by("shoes");
  const outer = by("outerwear");
  const extras = wardrobe.filter((i) => (ACCENT_CATS as readonly string[]).includes(i.category));
  const vibes = by("lifestyle");

  const palette = preferredColors(prefs);
  const pieceScore = (i: WardrobeItem) => (i.color && palette.has(i.color) ? 1 : 0) + jitter(i.id, seed) * 0.6;

  const bases: WardrobeItem[][] = [
    ...dresses.map((d) => [d]),
    ...tops.flatMap((t) => bottoms.map((b) => [t, b])),
  ];

  const best = (pool: WardrobeItem[], base: WardrobeItem[]) =>
    [...pool].sort((a, b) => pieceScore(b) + harmony([...base, b]) - (pieceScore(a) + harmony([...base, a])))[0];

  const built = bases.map((base) => {
    let items = [...base];
    for (const pool of [shoes, outer, extras, vibes]) {
      if (!pool.length) continue;
      const pick = best(pool, items);
      // Vibe-Item und Jacke nur, wenn sie die Farbharmonie nicht zerstören
      if (pick && harmony([...items, pick]) >= 0) items = [...items, pick];
    }
    const score = items.reduce((s, i) => s + pieceScore(i), 0) + harmony(items) * 1.5 + items.length * 0.3;
    return { items, score };
  });

  // Vielfalt: jede Basis-Kombi nur einmal, Teile nicht mehr als zweimal wiederverwenden
  const used = new Map<string, number>();
  const picked: typeof built = [];
  for (const b of built.sort((a, z) => z.score - a.score)) {
    if (picked.length >= count) break;
    if (b.items.some((i) => (used.get(i.id) ?? 0) >= 2)) continue;
    b.items.forEach((i) => used.set(i.id, (used.get(i.id) ?? 0) + 1));
    picked.push(b);
  }

  const vibeName = prefs.vibes
    .map((v) => QUIZ_STEPS[0].options.find((o) => o.id === v)?.label)
    .filter(Boolean)[0];

  return picked.map((p, n) => {
    const reasons: string[] = [];
    const inPalette = p.items.filter((i) => i.color && palette.has(i.color));
    if (hasPrefs(prefs) && inPalette.length) reasons.push(translate("suggest_palette", { n: inPalette.length }));
    if (harmony(p.items) >= 2) reasons.push(translate("suggest_harmony"));
    const accent = p.items.find((i) => i.category === "lifestyle");
    if (accent) reasons.push(translate("suggest_accent", { name: accent.name }));
    const main = p.items.find((i) => i.color && !NEUTRAL.includes(i.color));
    if (main?.color && !reasons.length) reasons.push(translate("suggest_statement", { color: colorLabel(main.color) }));
    return {
      id: p.items.map((i) => i.id).join("-"),
      title: vibeName ? translate("suggest_vibeLook", { vibe: vibeName, n: n + 1 }) : translate("suggest_look", { n: n + 1 }),
      items: p.items,
      score: p.score,
      reasons,
    };
  });
}

/** Legt die Teile im 2-Spalten-Raster an (passt auf das Lab-Canvas, alles auf GRID gerastet). */
export function layoutLayers(items: WardrobeItem[]): FitLayer[] {
  const snap = (v: number) => Math.round(v / GRID) * GRID;
  return items.map((item, i) => ({
    itemId: item.id,
    name: item.name,
    category: item.category,
    x: snap(20 + (i % 2) * 160),
    y: snap(20 + Math.floor(i / 2) * 180),
    size: DEFAULT_SIZE,
    rotation: 0,
  }));
}
