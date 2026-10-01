import { STORAGE } from "@/lib/storage-keys";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { categoryFromLabel } from "@/lib/categories";
import { colorFromLabel } from "@/lib/colors";
import { MOCK_WARDROBE, uid } from "@/lib/mock/wardrobe";
import type { ItemCategory, ItemColor, ItemTag, WardrobeItem } from "@/types";

export type NewItem = Pick<WardrobeItem, "name" | "image" | "tags" | "category"> & {
  color?: ItemColor;
  isPlaceholder?: boolean;
  sharedWithCrew?: boolean;
};

interface WardrobeState {
  items: WardrobeItem[];
  addItem: (item: NewItem) => void;
  /** Bulk: mehrere Items in einem Rutsch */
  addItems: (items: NewItem[]) => void;
  removeItem: (id: string) => void;
  updateTags: (id: string, tags: ItemTag[]) => void;
  setCategory: (id: string, category: ItemCategory) => void;
  toggleShared: (id: string) => void;
  /** Mehrere Felder eines Items ändern (Bearbeiten-Dialog) */
  updateItem: (id: string, patch: Partial<Omit<WardrobeItem, "id">>) => void;
  /** Items für den Marktplatz listen (oder mit undefined wieder entfernen) */
  setListing: (ids: string[], listing: WardrobeItem["listing"], price?: number) => void;
  /** Teile als heute getragen markieren (wearCount + 1) */
  markWorn: (ids: string[]) => void;
  clearAll: () => void;
}

const build = (n: NewItem): WardrobeItem => ({
  id: uid(),
  name: n.name,
  image: n.image,
  tags: n.tags,
  category: n.category,
  color: n.color,
  wearCount: 0,
  isPlaceholder: n.isPlaceholder ?? false,
  // Privacy first: neue Items sind privat, bis der User sie freigibt
  sharedWithCrew: n.sharedWithCrew ?? false,
  createdAt: Date.now(),
});

const patch = (items: WardrobeItem[], id: string, p: Partial<WardrobeItem>) =>
  items.map((i) => (i.id === id ? { ...i, ...p } : i));

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set) => ({
      items: MOCK_WARDROBE,
      addItem: (item) => set((s) => ({ items: [build(item), ...s.items] })),
      addItems: (items) => set((s) => ({ items: [...items.map(build), ...s.items] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateTags: (id, tags) => set((s) => ({ items: patch(s.items, id, { tags }) })),
      setCategory: (id, category) => set((s) => ({ items: patch(s.items, id, { category }) })),
      updateItem: (id, p) => set((s) => ({ items: patch(s.items, id, p) })),
      toggleShared: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, sharedWithCrew: !i.sharedWithCrew } : i)),
        })),
      // Wer etwas anbietet, macht es damit sichtbar (sonst wäre das Angebot unsichtbar)
      setListing: (ids, listing, price) =>
        set((s) => ({
          items: s.items.map((i) =>
            ids.includes(i.id)
              ? { ...i, listing, price: listing && listing !== "swap" ? price : undefined, sharedWithCrew: listing ? true : i.sharedWithCrew }
              : i,
          ),
        })),
      markWorn: (ids) =>
        set((s) => ({
          items: s.items.map((i) =>
            ids.includes(i.id) ? { ...i, wearCount: i.wearCount + 1, lastWorn: new Date().toISOString() } : i,
          ),
        })),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: STORAGE.wardrobe,
      version: 5,
      // v1 -> v2: bestehende Items bekommen category (aus dem Kategorie-Tag) und sharedWithCrew
      migrate: (persisted) => {
        const state = persisted as { items?: Partial<WardrobeItem>[] };
        return {
          ...state,
          items: (state.items ?? []).map((i) => ({
            ...i,
            category: i.category ?? categoryFromLabel(i.tags?.find((t) => t.kind === "category")?.label),
            sharedWithCrew: i.sharedWithCrew ?? true,
            // v2 -> v3: Farbe aus dem Farb-Tag ableiten
            color: i.color ?? colorFromLabel(i.tags?.find((t) => t.kind === "color")?.label),
          })),
        } as unknown as WardrobeState;
      },
      // Bei JEDEM Laden: Items ohne Farbe nachziehen (Farbe aus dem Farb-Tag). Versionsunabhängig, damit
      // der Farbfilter auch bei bereits gespeicherten Items exakt auf das color-Feld prüfen kann.
      merge: (persisted, current) => {
        const p = persisted as Partial<WardrobeState> | undefined;
        const items = (p?.items ?? current.items).map((i) =>
          ({ ...i, wearCount: i.wearCount ?? 0, color: i.color ?? colorFromLabel(i.tags?.find((t) => t.kind === "color")?.label) }),
        );
        return { ...current, ...p, items };
      },
    },
  ),
);
