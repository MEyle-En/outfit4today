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

const img = (seed: string) => `https://picsum.photos/seed/market-${seed}/480/600`;

const l = (
  id: string,
  seller: string,
  name: string,
  category: ItemCategory,
  color: ItemColor,
  vibe: VibeId,
  mode: "swap" | "sell" | "both",
  price?: number,
): MarketListing => ({ id: `m-${id}`, seller, name, image: img(id), category, color, vibe, mode, price });

/** Öffentliche Listings der Community (Mock). */
export const MARKET_LISTINGS: MarketListing[] = [
  l("1", "Mila", "Baggy Cargo Pants", "bottom", "black", "streetwear", "sell", 35),
  l("2", "Jonas", "Oversized Hoodie", "top", "gray", "streetwear", "swap"),
  l("3", "Lea", "Y2K Baby Tee", "top", "pink", "y2k", "sell", 12),
  l("4", "Ava", "Low Rise Jeans", "bottom", "blue", "y2k", "sell", 28),
  l("5", "Noah", "Wool Trench Coat", "outerwear", "beige", "minimal", "sell", 85),
  l("6", "Zoe", "Minimal Leather Bag", "bag", "black", "minimal", "swap"),
  l("7", "Jonas", "Shell Jacket", "outerwear", "green", "gorpcore", "sell", 60),
  l("8", "Elias", "Trail Runner", "shoes", "gray", "gorpcore", "swap"),
  l("9", "Ava", "Vintage Denim Jacket", "outerwear", "blue", "vintage", "sell", 40),
  l("10", "Mila", "Retro Wristwatch", "accessory", "brown", "vintage", "swap"),
  l("11", "Elias", "Tweed Blazer", "outerwear", "brown", "dark-academia", "sell", 55),
  l("12", "Lea", "Knit Vest", "top", "beige", "dark-academia", "swap"),
  l("13", "Zoe", "Platform Sneakers", "shoes", "white", "streetwear", "sell", 45),
  l("14", "Lea", "Silver Chain", "jewelry", "gray", "y2k", "sell", 15),
  l("15", "Noah", "Bucket Hat", "hat", "black", "streetwear", "sell", 18),
  l("16", "Ava", "Slip Dress", "dress", "purple", "y2k", "swap"),
  l("17", "Mila", "Jersey Hijab Set", "hijab", "beige", "minimal", "sell", 22),
  l("18", "Jonas", "Skateboard Deck", "lifestyle", "multicolor", "streetwear", "sell", 30),
  l("19", "Zoe", "Vintage Band Tee", "top", "black", "vintage", "both", 25),
  l("20", "Elias", "Corduroy Pants", "bottom", "brown", "dark-academia", "sell", 19),
  {
    ...l("b1", "Mila", "3-Teil Set: Cargo + Tee + Bomber", "bottom", "black", "streetwear", "sell", 70),
    bundle: { count: 3, onlyTogether: true, images: [img("b1a"), img("b1b"), img("b1c")] },
  },
  {
    ...l("b2", "Lea", "2-Teil Set: Slip Dress + Cardigan", "dress", "purple", "y2k", "sell", 45),
    bundle: { count: 2, onlyTogether: false, images: [img("b2a"), img("b2b")] },
  },
];

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
