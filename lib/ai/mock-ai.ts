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

// ---------------------------------------------------------------------------------------------
// Farbe
// ---------------------------------------------------------------------------------------------

/**
 * Farbe aus Dateiname und Tags – nur wenn dort ein Farbname vorkommt (DE/EN/FR/ES/IT), sonst undefined.
 * Ganze Wörter statt Teilstrings: "Karotte" ist nicht Rot, "Bluse" nicht Blau.
 */
export function detectColorFromText(filename: string, tags: string[] = []): ItemColor | undefined {
  return colorFromLabel(`${filename.replace(/\.[a-z0-9]+$/i, "")} ${tags.join(" ")}`);
}

const COMMON_COLORS: ItemColor[] = ["black", "blue", "gray", "white"];

/** Wie detectColorFromText, liefert aber immer eine Farbe: ohne Hinweis eine der häufigen (Schwarz, Blau, Grau, Weiß). */
export function detectColor(filename: string, tags: string[] = []): ItemColor {
  return detectColorFromText(filename, tags) ?? pick(COMMON_COLORS);
}

// ---------------------------------------------------------------------------------------------
// Kategorie
// ---------------------------------------------------------------------------------------------

/** Schlüsselwörter je Kategorie (DE/EN). Reihenfolge = Gleichstand-Priorität (spezifischere zuerst). */
const CATEGORY_KEYWORDS: [ItemCategory, string[]][] = [
  ["lifestyle", ["pflanze", "plant", "monstera", "kamera", "camera", "buch", "book", "kerze", "candle", "poster", "bild", "art", "vase", "lampe", "vinyl", "skateboard"]],
  ["hijab", ["hijab", "kopftuch", "headscarf", "tuch"]],
  ["socks", ["socke", "socken", "socks"]],
  ["shoes", ["schuh", "shoe", "sneaker", "boot", "stiefel", "heels", "sandale", "sandalen", "sandals", "loafer", "pumps"]],
  ["bag", ["tasche", "bag", "handtasche", "rucksack", "backpack", "clutch"]],
  ["jewelry", ["schmuck", "jewelry", "jewellery", "kette", "necklace", "ring", "ohrring", "earring", "armband", "bracelet"]],
  ["hat", ["mütze", "hat", "cap", "beanie", "hut"]],
  ["dress", ["kleid", "dress", "jumpsuit", "overall", "overalls"]],
  ["outerwear", ["jacke", "jacket", "mantel", "coat", "blazer", "weste", "vest", "bomber", "puffer", "parka", "windbreaker"]],
  ["bottom", ["hose", "pants", "trousers", "jeans", "rock", "skirt", "shorts", "leggings", "cargo", "jogger", "jogginghose"]],
  ["top", ["shirt", "tshirt", "tee", "bluse", "blouse", "top", "hoodie", "sweatshirt", "sweater", "pullover", "pulli", "strick", "tank", "crop", "cardigan", "hemd", "longsleeve"]],
  ["accessory", ["gürtel", "belt", "schal", "scarf", "brille", "sunglasses", "uhr", "watch", "handschuh", "gloves"]],
];

// Deutsche Hauptwörter, die als Wortende zusammengesetzter Wörter vorkommen ("Cargohose", "Lederjacke", "Handtasche")
const COMPOUND_HEADS = new Set(["hose", "rock", "jacke", "mantel", "kleid", "schuh", "tasche", "kette", "mütze", "tuch", "weste", "bluse", "shirt", "buch", "bild", "lampe", "brille", "socke", "schal", "hut"]);

/**
 * Wie gut passt ein Wort zu einem Schlüsselwort?
 * 3 = exakt (auch einfache Mehrzahl: "sneakers", "hosen"), 2 = Wortende ("Jeansjacke" -> jacke), 1 = Wortanfang ("sneakerboot"), 0 = kein Treffer.
 * Teilstrings mitten im Wort zählen nie ("Laptop" ist kein Top, "Spring" kein Ring, "Party" keine Kunst).
 */
function keywordScore(word: string, kw: string): number {
  if (word === kw || word === kw + "s" || word === kw + "e" || word === kw + "n" || word === kw + "en") return 3;
  if ((kw.length >= 5 || COMPOUND_HEADS.has(kw)) && word.length > kw.length && word.endsWith(kw)) return 2;
  if (kw.length >= 5 && word.length > kw.length && word.startsWith(kw)) return 1;
  return 0;
}

const words = (text: string) => text.toLowerCase().split(/[^a-zäöüß]+/).filter(Boolean);

/** Kategorie aus Text, oder undefined, wenn nichts passt. Das beste Wort-Schlüsselwort-Paar gewinnt. */
export function matchCategory(text: string): ItemCategory | undefined {
  const ws = words(text);
  let best: { category: ItemCategory; score: number } | undefined;
  for (const [category, kws] of CATEGORY_KEYWORDS) {
    for (const w of ws) {
      for (const kw of kws) {
        const score = keywordScore(w, kw);
        if (score > (best?.score ?? 0)) best = { category, score };
      }
    }
  }
  return best?.category;
}

/** Kategorie aus Dateiname und Tags; ohne Treffer "top" (wie in deinem Entwurf). */
export function detectCategory(filename: string, tags: string[] = []): ItemCategory {
  return matchCategory(`${filename.replace(/\.[a-z0-9]+$/i, "")} ${tags.join(" ")}`) ?? "top";
}

const DEFAULT_MATERIAL: Partial<Record<ItemCategory, string>> = {
  top: "Baumwolle",
  bottom: "Baumwolle",
  outerwear: "Nylon",
  shoes: "Leder",
  bag: "Leder",
  jewelry: "Silber",
  hat: "Baumwolle",
  hijab: "Jersey",
  socks: "Baumwolle",
};

const MATERIALS: [RegExp, string][] = [
  [/leder|leather/, "Leder"],
  [/wolle|wool/, "Wolle"],
  [/denim|jeans/, "Denim"],
  [/leinen|linen/, "Leinen"],
  [/fleece/, "Fleece"],
];
const BRANDS = ["zara", "h&m", "nike", "adidas", "uniqlo", "weekday", "asos", "levi's", "carhartt", "stüssy", "mango"];

const titleCase = (s: string) => s.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1));

const materialFor = (text: string, category: ItemCategory) =>
  MATERIALS.find(([re]) => re.test(text.toLowerCase()))?.[1] ?? DEFAULT_MATERIAL[category];

// ---------------------------------------------------------------------------------------------
// Bild- und Text-Analyse (simuliert)
// ---------------------------------------------------------------------------------------------

const CATEGORY_TITLES: Record<ItemCategory, string[]> = {
  top: ["Classic White Tee", "Oversized Hoodie", "Silk Blouse", "Crop Top"],
  bottom: ["Vintage Jeans", "Black Trousers", "Pleated Skirt", "Cargo Pants"],
  dress: ["Summer Dress", "Evening Gown", "Casual Midi Dress"],
  outerwear: ["Denim Jacket", "Leather Jacket", "Wool Coat", "Blazer"],
  shoes: ["White Sneakers", "Black Boots", "Classic Heels", "Running Shoes"],
  bag: ["Leather Bag", "Mini Shoulder Bag", "Canvas Tote", "Crossbody Bag"],
  jewelry: ["Gold Necklace", "Silver Ring", "Pearl Earrings", "Chunky Bracelet"],
  hat: ["Bucket Hat", "Wool Beanie", "Baseball Cap"],
  socks: ["Crew Socks", "Striped Socks", "Wool Socks"],
  accessory: ["Silk Scarf", "Leather Belt", "Round Sunglasses", "Vintage Watch"],
  hijab: ["Cotton Hijab", "Silk Headscarf", "Chiffon Hijab"],
  lifestyle: ["Monstera Plant", "Vintage Camera", "Art Poster", "Scented Candle"],
};

const GENERIC_NAME = /^(img|dsc|dscn|image|photo|foto|screenshot|whatsapp|pxl|bild|untitled|unbenannt|download|scan)?\s*$/i;

/**
 * Titel aus Dateiname und Kategorie. Ein aussagekräftiger Dateiname wird gesäubert und mit großen Anfangsbuchstaben
 * übernommen ("schwarze_jeans.jpg" -> "Schwarze Jeans"). Generische Namen (IMG_1234, photo, untitled …) bekommen
 * einen passenden Titel der Kategorie, z.B. "Denim Jacket".
 */
export function generateTitle(filename: string, category: ItemCategory): string {
  const name = filename
    .replace(/\.[^/.]+$/, "") // Endung weg
    .replace(/[_\-.]+/g, " ")
    .replace(/\b\d+\b/g, " ") // reine Zahlen (Zähler, Datum) weg
    .replace(/\s+/g, " ")
    .trim();
  if (GENERIC_NAME.test(name) || name.length < 3 || !/[a-zäöüß]{3,}/i.test(name)) return pick(CATEGORY_TITLES[category]);
  return titleCase(name.toLowerCase());
}

/**
 * Simuliert Bildanalyse (1,5 s). Kein echtes Computer Vision. Aus dem Dateinamen werden Kategorie, Farbe, Material
 * und Titel gelesen, wo er etwas hergibt; sonst gibt es einen Zufallsvorschlag mit passendem Titel.
 * Die Farbe wird anschließend aus den Pixeln bestimmt (lib/image-color.ts).
 */
export async function analyzeImage(fileName?: string): Promise<AiResult> {
  await wait(1500);

  const base = (fileName ?? "").replace(/\.[a-z0-9]+$/i, "").replace(/[_\-.]+/g, " ");
  const sample = pick(SAMPLES);
  // Kategorie aus dem Dateinamen, sonst zufällig
  const category = matchCategory(base) ?? sample.category;
  const name = generateTitle(fileName ?? "", category);
  const color = colorFromLabel(base) ?? pick(COLORS);
  const material = materialFor(base, category) ?? sample.material;

  return {
    name,
    category,
    color,
    tags: [tag("category", categoryLabel(category)), tag("color", colorLabel(color)), tag("material", material)],
  };
}

/** Simuliert Text -> Item (0,9 s). Regelbasiertes Parsing statt LLM. */
export async function parseQuickAdd(text: string): Promise<AiResult> {
  await wait(900);
  const t = text.toLowerCase();
  const tags: ItemTag[] = [];

  const matched = matchCategory(t);
  const category: ItemCategory = matched ?? "top";
  if (matched) tags.push(tag("category", categoryLabel(category)));
  // Erstes erkanntes Farbwort; Jeans/Denim ohne Farbwort -> Blau
  const color = colorFromLabel(t) ?? (/\b(jeans|denim)\b/.test(t) ? ("blue" as ItemColor) : undefined);
  if (color) tags.push(tag("color", colorLabel(color)));
  const mat = materialFor(t, category);
  if (mat && matched) tags.push(tag("material", mat));
  const brand = BRANDS.find((b) => t.includes(b));
  if (brand) tags.push(tag("brand", titleCase(brand)));
  if (!tags.length) tags.push(tag("custom", "Neu"));

  return { name: titleCase(text.trim()), category, color, tags };
}
