import { categoryLabel } from "@/lib/categories";
import { colorFromLabel, colorLabel } from "@/lib/colors";
import { tag } from "@/lib/mock/wardrobe";
import type { ItemCategory, ItemColor, ItemTag } from "@/types";

// Mock-Logik. Die echte Bilderkennung (CLIP/BLIP) wird in ./open-source-ai.ts angebunden.

export interface AiResult {
  name: string;
  category: ItemCategory;
  color?: ItemColor;
  tags: ItemTag[];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const SAMPLES: { name: string; category: ItemCategory; material: string }[] = [
  { name: "Cargo Pants", category: "bottom", material: "Baumwolle" },
  { name: "Graphic Tee", category: "top", material: "Baumwolle" },
  { name: "Bomber Jacket", category: "outerwear", material: "Nylon" },
  { name: "Knit Sweater", category: "top", material: "Wolle" },
  { name: "Denim Jacket", category: "outerwear", material: "Denim" },
  { name: "Retro Runner", category: "shoes", material: "Mesh" },
  { name: "Mini Shoulder Bag", category: "bag", material: "Leder" },
  { name: "Chunky Ring", category: "jewelry", material: "Silber" },
  { name: "Bucket Hat", category: "hat", material: "Baumwolle" },
  { name: "Jersey Hijab", category: "hijab", material: "Jersey" },
  { name: "Skateboard Deck", category: "lifestyle", material: "Holz" },
  { name: "Wall Poster", category: "lifestyle", material: "Papier" },
];
const COLORS: ItemColor[] = ["black", "white", "beige", "gray", "blue", "purple", "green"];

/** Simuliert Bildanalyse (1,5 s). Kein echtes Computer Vision – liefert Zufallstags. */
export async function analyzeImage(): Promise<AiResult> {
  await wait(1500);
  const s = pick(SAMPLES);
  const color = pick(COLORS);
  return {
    name: s.name,
    category: s.category,
    color,
    tags: [tag("category", categoryLabel(s.category)), tag("color", colorLabel(color)), tag("material", s.material)],
  };
}

// Reihenfolge zählt: spezifischere Begriffe zuerst
const CATEGORIES: [RegExp, ItemCategory, string | null][] = [
  [/pflanze|plant|monstera|poster|kunst|\bart\b|bild|kamera|camera|skateboard|\bboard\b|buch|book|kerze|candle|vinyl|platte|lampe|vase/, "lifestyle", null],
  [/hijab|kopftuch/, "hijab", "Jersey"],
  [/socke|socks/, "socks", "Baumwolle"],
  [/jeans/, "bottom", "Denim"],
  [/hose|cargo|pants|jogger|rock|skirt|shorts/, "bottom", "Baumwolle"],
  [/jacke|jacket|mantel|coat|bomber|puffer|blazer/, "outerwear", "Nylon"],
  [/hoodie|pullover|sweater|sweatshirt|strick/, "top", "Baumwolle"],
  [/shirt|tee|top|bluse|hemd/, "top", "Baumwolle"],
  [/sneaker|schuh|boots|stiefel|loafer/, "shoes", "Leder"],
  [/kleid|dress/, "dress", null],
  [/tasche|bag|rucksack/, "bag", "Leder"],
  [/kette|ring|ohrring|armband|schmuck/, "jewelry", "Silber"],
  [/cap|beanie|mütze|\bhut\b|hat/, "hat", "Baumwolle"],
  [/gürtel|schal|brille|uhr|watch/, "accessory", null],
];
const MATERIALS: [RegExp, string][] = [
  [/leder|leather/, "Leder"],
  [/wolle|wool/, "Wolle"],
  [/denim|jeans/, "Denim"],
  [/leinen|linen/, "Leinen"],
  [/fleece/, "Fleece"],
];
const BRANDS = ["zara", "h&m", "nike", "adidas", "uniqlo", "weekday", "asos", "levi's", "carhartt", "stüssy", "mango"];

const titleCase = (s: string) => s.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1));

/** Simuliert Text -> Item (0,9 s). Regelbasiertes Parsing statt LLM. */
export async function parseQuickAdd(text: string): Promise<AiResult> {
  await wait(900);
  const t = text.toLowerCase();
  const tags: ItemTag[] = [];

  const cat = CATEGORIES.find(([re]) => re.test(t));
  const category: ItemCategory = cat?.[1] ?? "top";
  if (cat) tags.push(tag("category", categoryLabel(category)));
  // Farbwörter im Text: erstes Wort, das eine Farbe ergibt ("Schwarze" -> black)
  // Erstes erkanntes Farbwort; Jeans/Denim ohne Farbwort -> Blau
  const color = colorFromLabel(t) ?? (/jeans|denim/.test(t) ? ("blue" as ItemColor) : undefined);
  if (color) tags.push(tag("color", colorLabel(color)));
  const mat = MATERIALS.find(([re]) => re.test(t))?.[1] ?? cat?.[2];
  if (mat) tags.push(tag("material", mat));
  const brand = BRANDS.find((b) => t.includes(b));
  if (brand) tags.push(tag("brand", titleCase(brand)));
  if (!tags.length) tags.push(tag("custom", "Neu"));

  return { name: titleCase(text.trim()), category, color, tags };
}
