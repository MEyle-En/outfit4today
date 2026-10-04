import { categoryLabel } from "@/lib/categories";
import { colorLabel } from "@/lib/colors";
import { MOCK_ITEMS, type MockItem } from "@/lib/mock-data";
import { daysAgoIso } from "@/lib/wear";
import type { ItemTag, TagKind, WardrobeItem } from "@/types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const tag = (kind: TagKind, label: string): ItemTag => ({ id: uid(), kind, label });

/** Katalog-Eintrag (lib/mock-data.ts) -> WardrobeItem. */
export function buildMockItem(m: MockItem, createdAt: number): WardrobeItem {
  const listed = !!m.listing;
  return {
    id: m.id,
    name: m.name,
    image: m.photo,
    isPlaceholder: false,
    category: m.category,
    color: m.color,
    // Teile sind für die Crew sichtbar; angebotene zusätzlich im Marketplace
    visibility: { isPrivate: false, sharedWithCrew: true, onMarketplace: listed, availableInLab: true },
    listing: m.listing,
    price: m.listing && m.listing !== "swap" ? m.price : undefined,
    wearCount: m.wear?.count ?? 0,
    lastWorn: m.wear?.daysAgo != null ? daysAgoIso(m.wear.daysAgo) : undefined,
    // kleine Zahlen = "alt" (kein 14-Tage-Neuheitsschutz bei Vergessene Schätze)
    createdAt,
    tags: [tag("category", categoryLabel(m.category)), tag("color", colorLabel(m.color)), tag("material", m.material)],
  };
}

/** Dein Wardrobe zu Beginn. */
export const MOCK_WARDROBE: WardrobeItem[] = MOCK_ITEMS.filter((m) => m.owner === "me").map((m, i) => buildMockItem(m, i + 1));
