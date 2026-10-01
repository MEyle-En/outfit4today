import { categoryLabel } from "@/lib/categories";
import { colorFromLabel } from "@/lib/colors";
import { daysAgoIso } from "@/lib/wear";
import type { ItemCategory, ItemTag, TagKind, WardrobeItem } from "@/types";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/480/600`;

export const uid = () => Math.random().toString(36).slice(2, 10);

export const tag = (kind: TagKind, label: string): ItemTag => ({ id: uid(), kind, label });

const mock = (
  id: string,
  name: string,
  seed: string,
  category: ItemCategory,
  color: string,
  material: string,
  createdAt: number,
  wear: { count: number; daysAgo?: number } = { count: 0 },
): WardrobeItem => ({
  id,
  name,
  image: img(seed),
  isPlaceholder: false,
  category,
  color: colorFromLabel(color),
  sharedWithCrew: true,
  wearCount: wear.count,
  lastWorn: wear.daysAgo != null ? daysAgoIso(wear.daysAgo) : undefined,
  createdAt,
  tags: [tag("category", categoryLabel(category)), tag("color", color), tag("material", material)],
});

export const MOCK_WARDROBE: WardrobeItem[] = [
  mock("w1", "Vintage Jeans", "wardrobe-jeans", "bottom", "Hellblau", "Denim", 1, { count: 12, daysAgo: 3 }),
  mock("w2", "Oversized Hoodie", "wardrobe-hoodie", "top", "Schwarz", "Baumwolle", 2, { count: 30, daysAgo: 1 }),
  mock("w3", "Chunky Sneakers", "wardrobe-sneakers", "shoes", "Weiß", "Leder", 3, { count: 5, daysAgo: 95 }),
  mock("w4", "Puffer Jacket", "wardrobe-puffer", "outerwear", "Lila", "Nylon", 4),
  mock("w5", "Monstera Plant", "wardrobe-monstera", "lifestyle", "Grün", "Natur", 5),
  mock("w6", "Retro Camera", "wardrobe-camera", "lifestyle", "Schwarz", "Metall", 6),
];

/** Wird auch vom Crew-Mock genutzt. */
export { mock as buildMockItem };
