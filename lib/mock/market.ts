import { MOCK_ITEMS } from "@/lib/mock-data";
import type { BundleListing, ItemCategory, ItemColor, VibeId, WardrobeItem } from "@/types";

export interface MarketListing {
  id: string;
  seller: string;
  mine?: boolean;
  name: string;
  image: string;
  category: ItemCategory;
  color: ItemColor;
  vibe?: VibeId;
  mode: "swap" | "sell" | "both";
  /** bei Verkauf oder "both", in € */
  price?: number;
  /** Gesetzt, wenn das Angebot ein Outfit-Bundle ist */
  bundle?: { count: number; onlyTogether: boolean; images: string[] };
}

const SELLERS: Record<string, string> = { "f-mila": "Mila", "f-jonas": "Jonas", "f-lea": "Lea", "f-ava": "Ava" };

/** Öffentliche Listings der Community: alle angebotenen Katalog-Teile der Freunde. */
export const MARKET_LISTINGS: MarketListing[] = [
  ...MOCK_ITEMS.filter((m) => m.owner !== "me" && m.listing).map((m) => ({
    id: `m-${m.id}`,
    seller: SELLERS[m.owner],
    name: m.name,
    image: m.photo,
    category: m.category,
    color: m.color,
    vibe: m.vibe,
    mode: m.listing!,
    price: m.listing === "swap" ? undefined : m.price,
  })),
  // Bundles: mehrere Teile eines Freundes zum Set-Preis
  bundleOf("b1", "Mila", "3-Teil Set: Pink Tee + Red Dress + Gold Necklace", ["f-mila-1", "f-mila-2", "f-mila-3"], 120, "y2k", true),
  bundleOf("b2", "Ava", "2-Teil Set: Plaid Skirt + Little Black Dress", ["f-ava-1", "f-ava-2"], 65, "minimal", false),
];

function bundleOf(id: string, seller: string, name: string, itemIds: string[], price: number, vibe: VibeId, onlyTogether: boolean): MarketListing {
  const parts = itemIds.map((i) => MOCK_ITEMS.find((m) => m.id === i)!);
  return {
    id: `m-${id}`,
    seller,
    name,
    image: parts[0].photo,
    category: parts[0].category,
    color: parts[0].color,
    vibe,
    mode: "sell",
    price,
    bundle: { count: parts.length, onlyTogether, images: parts.map((p) => p.photo).slice(0, 3) },
  };
}

/** Meine Bundles als Marketplace-Einträge (Bild = erstes Teil, Vorschau = bis zu 3 Teile). */
export function myBundleListings(bundles: BundleListing[], items: WardrobeItem[]): MarketListing[] {
  return bundles.flatMap((b) => {
    const parts = b.items.map((id) => items.find((i) => i.id === id)).filter((i): i is WardrobeItem => !!i);
    if (!parts.length) return [];
    return [
      {
        id: `mine-bundle-${b.id}`,
        seller: "Du",
        mine: true,
        name: b.description,
        image: parts[0].image,
        category: parts[0].category,
        color: parts[0].color ?? "multicolor",
        mode: "sell" as const,
        price: b.bundlePrice,
        bundle: { count: parts.length, onlyTogether: b.onlyTogether, images: parts.slice(0, 3).map((p) => p.image) },
      },
    ];
  });
}

/** Eigene Items, die ich angeboten habe UND die sichtbar (nicht privat) sind. */
export function myListings(items: WardrobeItem[]): MarketListing[] {
  return items
    .filter((i) => i.listing && i.visibility.onMarketplace)
    .map((i) => ({
      id: `mine-${i.id}`,
      seller: "Du",
      mine: true,
      name: i.name,
      image: i.image,
      category: i.category,
      color: i.color ?? "multicolor",
      mode: i.listing!,
      price: i.listing !== "swap" ? i.price : undefined,
    }));
}
