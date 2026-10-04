export type VibeId = "streetwear" | "y2k" | "minimal" | "gorpcore" | "vintage" | "dark-academia";

export interface StylePrefs {
  vibes: string[];
  colors: string[];
  icons: string[];
}

export interface InspoPost {
  id: string;
  user: { name: string; handle: string; gradient: string };
  image: string;
  vibe: VibeId;
  colors: string[];
  icons: string[];
  caption: string;
  likes: number;
  comments: number;
  tags: string[];
}

export type TagKind = "category" | "color" | "material" | "brand" | "custom";

export interface ItemTag {
  id: string;
  kind: TagKind;
  label: string;
}

export interface Visibility {
  /** Nur ich (schließt Crew und Marketplace aus) */
  isPrivate: boolean;
  /** Meine Crew kann es sehen */
  sharedWithCrew: boolean;
  /** Öffentlich zum Verkauf/Tausch (kombinierbar mit Crew) */
  onMarketplace: boolean;
  /** Im Fit Lab nutzbar (Standard: true) */
  availableInLab: boolean;
}

export interface WardrobeItem {
  id: string;
  name: string;
  /** URL, Data-URL (Upload) oder Platzhalter-Bild (Quick Add) */
  image: string;
  isPlaceholder: boolean;
  tags: ItemTag[];
  category: ItemCategory;
  color?: ItemColor;
  /** Wer sieht / nutzt das Teil? Kanäle sind kombinierbar (siehe lib/visibility.ts) */
  visibility: Visibility;
  /** Marktplatz: zum Tausch/Verkauf angeboten (fehlt = nicht gelistet) */
  listing?: "swap" | "sell" | "both";
  /** Verkaufspreis in € (bei listing = "sell" oder "both") */
  price?: number;
  /** Wie oft getragen (Standard 0) */
  wearCount: number;
  /** ISO-Datum des letzten Tragens */
  lastWorn?: string;
  createdAt: number;
}

// ---------- Kategorien ----------
export type ItemCategory =
  | "top"
  | "bottom"
  | "dress"
  | "shoes"
  | "accessory"
  | "outerwear"
  | "bag"
  | "jewelry"
  | "hat"
  | "socks"
  | "hijab"
  /** Keine Kleidung, sondern Vibe: Pflanzen, Poster, Kamera, Skateboard … */
  | "lifestyle";

export type ItemColor =
  | "black"
  | "white"
  | "gray"
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "brown"
  | "beige"
  | "multicolor"
  | "pink"
  | "purple"
  | "orange";

// ---------- Crew ----------
export type ReactionType = "fire" | "idea" | "want";

export interface Person {
  id: string;
  /** Porträtfoto (Unsplash); ohne Foto wird der Farbverlauf gezeigt */
  avatar?: string;
  name: string;
  handle: string;
  gradient: string;
}

export interface FriendItem extends WardrobeItem {
  ownerId: string;
}

/** Ein Teil in einem gesendeten Outfit (Position aus dem Fit Lab). */
export interface FitLayer {
  itemId: string;
  name: string;
  category: ItemCategory;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface SwapSuggestion {
  offeredItemId: string;
  offeredName: string;
  targetItemId: string;
  targetName: string;
}

export interface FitComment {
  id: string;
  authorId: string;
  kind: "comment" | "swap";
  text: string;
  swap?: SwapSuggestion;
  createdAt: number;
}

export interface FitPost {
  id: string;
  /** null = nur öffentlich gepostet (ohne Crew) */
  crewId: string | null;
  authorId: string;
  caption: string;
  /** Public Inspo: zusätzlich im öffentlichen Discovery-Feed sichtbar (fehlt = nur Crew) */
  isPublic?: boolean;
  layers: FitLayer[];
  reactions: Record<ReactionType, string[]>;
  comments: FitComment[];
  createdAt: number;
}

export interface Crew {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  createdAt: number;
}

// ---------- Bundles ----------
/** Ein Outfit aus dem Fit Lab, das als Set verkauft wird. */
export interface BundleListing {
  id: string;
  /** IDs der WardrobeItems im Bundle */
  items: string[];
  bundlePrice: number;
  description: string;
  /** true = nur zusammen, false = einzeln auch verfügbar */
  onlyTogether: boolean;
  createdAt: number;
}
