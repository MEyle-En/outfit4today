// Zentrale Mock-Daten: ein Katalog aus 24 Kleidungsstücken mit echten Fotos von Unsplash.
// Jedes Foto wurde angesehen und passt zu Kategorie, Name und Farbe.
// Lizenz: Unsplash-Fotos sind kostenlos auch kommerziell nutzbar (Hotlinking über images.unsplash.com ist ausdrücklich erlaubt;
// eine Namensnennung der Fotografen ist nicht Pflicht, aber erwünscht).
import type { ItemCategory, ItemColor, VibeId } from "@/types";

/** Unsplash-Foto in passender Größe (w=400 reicht für Kacheln). */
export const unsplash = (photoId: string, w = 400) => `https://images.unsplash.com/${photoId}?w=${w}&auto=format&fit=crop&q=80`;

export type OwnerId = "me" | "f-mila" | "f-jonas" | "f-lea" | "f-ava";

export interface MockItem {
  id: string;
  owner: OwnerId;
  name: string;
  category: ItemCategory;
  color: ItemColor;
  material: string;
  photo: string;
  /** Realistischer Preis in € (15–150) */
  price: number;
  vibe?: VibeId;
  /** Gesetzt = der Besitzer bietet das Teil im Marketplace an */
  listing?: "swap" | "sell" | "both";
  wear?: { count: number; daysAgo?: number };
}

const p = (id: string) => unsplash(id);

export const MOCK_ITEMS: MockItem[] = [
  // ---------- Du (12 Teile) ----------
  { id: "w1", owner: "me", name: "Vintage Levi's 501 Jeans", category: "bottom", color: "blue", material: "Denim", photo: p("photo-1542272604-787c3835535d"), price: 65, vibe: "vintage", wear: { count: 24, daysAgo: 3 } },
  { id: "w2", owner: "me", name: "Black Graphic Hoodie", category: "top", color: "black", material: "Baumwolle", photo: p("photo-1680292783974-a9a336c10366"), price: 45, vibe: "streetwear", wear: { count: 31, daysAgo: 1 } },
  { id: "w3", owner: "me", name: "White Air Force 1", category: "shoes", color: "white", material: "Leder", photo: p("photo-1600269452121-4f2416e55c28"), price: 90, vibe: "streetwear", wear: { count: 5, daysAgo: 95 } },
  { id: "w4", owner: "me", name: "Oversized Denim Jacket", category: "outerwear", color: "blue", material: "Denim", photo: p("photo-1543076447-215ad9ba6923"), price: 70, vibe: "vintage", wear: { count: 9, daysAgo: 12 } },
  { id: "w5", owner: "me", name: "Monstera Plant", category: "lifestyle", color: "green", material: "Natur", photo: p("photo-1614594975525-e45190c55d0b"), price: 20, vibe: "dark-academia" },
  { id: "w6", owner: "me", name: "Vintage Twin-Lens Camera", category: "lifestyle", color: "black", material: "Metall", photo: p("photo-1495121553079-4c61bcce1894"), price: 140, vibe: "vintage" },
  { id: "w7", owner: "me", name: "Classic White Tee", category: "top", color: "white", material: "Baumwolle", photo: p("photo-1521572163474-6864f9cf17ab"), price: 18, vibe: "minimal", wear: { count: 40, daysAgo: 2 } },
  { id: "w8", owner: "me", name: "Chunky Knit Sweater", category: "top", color: "beige", material: "Wolle", photo: p("photo-1588271968087-4c51abe05afc"), price: 38, vibe: "dark-academia", wear: { count: 3, daysAgo: 70 } },
  { id: "w9", owner: "me", name: "Black Baggy Cargo Pants", category: "bottom", color: "black", material: "Baumwolle", photo: p("photo-1584302052153-623ee529b70c"), price: 40, vibe: "streetwear", wear: { count: 14, daysAgo: 6 } },
  { id: "w10", owner: "me", name: "Camel Wrap Coat", category: "outerwear", color: "beige", material: "Wolle", photo: p("photo-1539533018447-63fcce2678e3"), price: 120, vibe: "minimal" },
  { id: "w12", owner: "me", name: "Black Wayfarer Sunglasses", category: "accessory", color: "black", material: "Acetat", photo: p("photo-1572635196237-14b3f281503f"), price: 25, vibe: "vintage", wear: { count: 18, daysAgo: 8 } },
  { id: "w13", owner: "me", name: "Light Denim Shorts", category: "bottom", color: "blue", material: "Denim", photo: p("photo-1591195853828-11db59a44f6b"), price: 22, vibe: "y2k", wear: { count: 2, daysAgo: 150 } },

  // ---------- Mila ----------
  { id: "f-mila-1", owner: "f-mila", name: "Pink Oversized Tee", category: "top", color: "pink", material: "Baumwolle", photo: p("photo-1529635457390-aa69ba54d77d"), price: 16, vibe: "y2k", listing: "sell" },
  { id: "f-mila-2", owner: "f-mila", name: "Red Maxi Dress", category: "dress", color: "red", material: "Chiffon", photo: p("photo-1595777457583-95e059d581b8"), price: 85, vibe: "y2k", listing: "both" },
  { id: "f-mila-3", owner: "f-mila", name: "Gold Layered Necklace", category: "jewelry", color: "yellow", material: "Vergoldet", photo: p("photo-1599643478518-a784e5dc4c8f"), price: 35, vibe: "y2k", listing: "sell" },

  // ---------- Jonas ----------
  { id: "f-jonas-1", owner: "f-jonas", name: "Blue Striped Shirt", category: "top", color: "blue", material: "Baumwolle", photo: p("photo-1589810635657-232948472d98"), price: 28, vibe: "vintage", listing: "swap" },
  { id: "f-jonas-2", owner: "f-jonas", name: "Black Leather Biker Jacket", category: "outerwear", color: "black", material: "Leder", photo: p("photo-1551028719-00167b16eac5"), price: 150, vibe: "streetwear", listing: "sell" },
  { id: "f-jonas-3", owner: "f-jonas", name: "Brown Leather Chelsea Boots", category: "shoes", color: "brown", material: "Leder", photo: p("photo-1777987601677-3059be0e1388"), price: 110, vibe: "dark-academia", listing: "sell" },

  // ---------- Lea ----------
  { id: "f-lea-1", owner: "f-lea", name: "Floral Wrap Dress", category: "dress", color: "multicolor", material: "Viskose", photo: p("photo-1602010069450-0a62034f235c"), price: 48, vibe: "vintage", listing: "sell" },
  { id: "f-lea-2", owner: "f-lea", name: "Red Leather Handbag", category: "bag", color: "red", material: "Leder", photo: p("photo-1584917865442-de89df76afd3"), price: 95, vibe: "y2k", listing: "both" },
  { id: "f-lea-3", owner: "f-lea", name: "Soft White Hijab", category: "hijab", color: "white", material: "Jersey", photo: p("photo-1585728748176-455ac5eed962"), price: 15, vibe: "minimal", listing: "sell" },

  // ---------- Ava ----------
  { id: "f-ava-1", owner: "f-ava", name: "Plaid Mini Skirt", category: "bottom", color: "beige", material: "Wolle", photo: p("photo-1590626448480-04a69cb0dbf6"), price: 24, vibe: "dark-academia", listing: "swap" },
  { id: "f-ava-2", owner: "f-ava", name: "Little Black Dress", category: "dress", color: "black", material: "Jersey", photo: p("photo-1718251556871-bcda6766024f"), price: 55, vibe: "minimal", listing: "sell" },
  { id: "f-ava-3", owner: "f-ava", name: "Retro Running Sneakers", category: "shoes", color: "gray", material: "Mesh", photo: p("photo-1746206673199-5b75dcec1018"), price: 75, vibe: "gorpcore", listing: "sell" },
];

/** Porträts der Crew-Mitglieder (quadratisch, auf das Gesicht zugeschnitten). */
export const PORTRAITS: Record<Exclude<OwnerId, "me">, string> = {
  "f-mila": unsplash("photo-1494790108377-be9c29b29330", 160) + "&crop=faces&h=160",
  "f-jonas": unsplash("photo-1500648767791-00dcc994a43e", 160) + "&crop=faces&h=160",
  "f-lea": unsplash("photo-1604072366595-e75dc92d6bdc", 160) + "&crop=faces&h=160",
  "f-ava": unsplash("photo-1580489944761-15a19d654956", 160) + "&crop=faces&h=160",
};

/**
 * Passendes Foto für Quick-Add-Items ohne eigenes Bild: ein Katalog-Teil derselben Kategorie,
 * möglichst in derselben Farbe. So zeigt "Schwarze Jeans" eine Hose statt eines Zufallsbilds.
 */
export function placeholderPhoto(category: ItemCategory, color?: ItemColor): string {
  const sameCat = MOCK_ITEMS.filter((i) => i.category === category);
  const best = sameCat.find((i) => i.color === color) ?? sameCat[0] ?? MOCK_ITEMS[0];
  return best.photo;
}
