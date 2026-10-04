import { STORAGE } from "@/lib/storage-keys";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { categoryFromLabel } from "@/lib/categories";
import { colorFromLabel } from "@/lib/colors";
import { applyVisibility, defaultVisibility, visibilityFromLegacy } from "@/lib/visibility";
import { placeholderPhoto } from "@/lib/mock-data";
import { MOCK_WARDROBE, uid } from "@/lib/mock/wardrobe";
import type { ItemCategory, ItemColor, ItemTag, Visibility, WardrobeItem } from "@/types";

export type NewItem = Pick<WardrobeItem, "name" | "image" | "tags" | "category"> & {
  color?: ItemColor;
  isPlaceholder?: boolean;
  hasTransparentBackground?: boolean;
  visibility?: Partial<Visibility>;
};

/** Lokales Datum als Schlüssel (JJJJ-MM-TT) – der Tagesfortschritt beginnt jeden Tag neu. */
export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface WardrobeState {
  items: WardrobeItem[];
  /** "Item des Tages": IDs der Teile, die heute schon bearbeitet wurden (getragen, übersprungen, gestylt, angeboten) */
  daily: { date: string; handled: string[] };
  markHandledToday: (id: string) => void;
  resetDaily: () => void;
  addItem: (item: NewItem) => void;
  /** Bulk: mehrere Items in einem Rutsch */
  addItems: (items: NewItem[]) => void;
  removeItem: (id: string) => void;
  updateTags: (id: string, tags: ItemTag[]) => void;
  setCategory: (id: string, category: ItemCategory) => void;
  /** Auge-Button: Privat <-> mit Crew teilen */
  togglePrivate: (id: string) => void;
  /** Sichtbarkeits-Kanäle ändern (Privat/Crew/Marketplace/Lab) */
  setVisibility: (id: string, patch: Partial<Visibility>) => void;
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
  hasTransparentBackground: n.hasTransparentBackground,
  isPlaceholder: n.isPlaceholder ?? false,
  // Privacy first: neue Items sind privat (aber im Lab nutzbar), bis der User sie freigibt
  visibility: applyVisibility(defaultVisibility(), n.visibility ?? {}),
  createdAt: Date.now(),
});

const patch = (items: WardrobeItem[], id: string, p: Partial<WardrobeItem>) =>
  items.map((i) => (i.id === id ? { ...i, ...p } : i));

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set) => ({
      items: MOCK_WARDROBE,
      daily: { date: todayKey(), handled: [] },
      markHandledToday: (id) =>
        set((s) => {
          const today = todayKey();
          const handled = s.daily.date === today ? s.daily.handled : []; // neuer Tag: von vorn
          return { daily: { date: today, handled: handled.includes(id) ? handled : [...handled, id] } };
        }),
      resetDaily: () => set({ daily: { date: todayKey(), handled: [] } }),
      addItem: (item) => set((s) => ({ items: [build(item), ...s.items] })),
      addItems: (items) => set((s) => ({ items: [...items.map(build), ...s.items] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateTags: (id, tags) => set((s) => ({ items: patch(s.items, id, { tags }) })),
      setCategory: (id, category) => set((s) => ({ items: patch(s.items, id, { category }) })),
      updateItem: (id, p) => set((s) => ({ items: patch(s.items, id, p) })),
      togglePrivate: (id) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            // Privat -> mit Crew teilen; sonst alles abschalten (Marketplace-Angebot endet dann ebenfalls)
            const visibility = i.visibility.isPrivate
              ? applyVisibility(i.visibility, { sharedWithCrew: true })
              : applyVisibility(i.visibility, { isPrivate: true });
            return visibility.onMarketplace ? { ...i, visibility } : { ...i, visibility, listing: undefined, price: undefined };
          }),
        })),
      setVisibility: (id, p) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const visibility = applyVisibility(i.visibility, p);
            return visibility.onMarketplace ? { ...i, visibility } : { ...i, visibility, listing: undefined, price: undefined };
          }),
        })),
      // Anbieten schaltet den Marketplace-Kanal ein (Crew-Freigabe bleibt, wie sie ist); Zurückziehen schaltet ihn aus
      setListing: (ids, listing, price) =>
        set((s) => ({
          items: s.items.map((i) =>
            ids.includes(i.id)
              ? {
                  ...i,
                  listing,
                  price: listing && listing !== "swap" ? price : undefined,
                  visibility: applyVisibility(i.visibility, { onMarketplace: !!listing }),
                }
              : i,
          ),
        })),
      markWorn: (ids) =>
        set((s) => ({
          items: s.items.map((i) =>
            ids.includes(i.id) ? { ...i, wearCount: i.wearCount + 1, lastWorn: new Date().toISOString() } : i,
          ),
        })),
      clearAll: () => set({ items: [], daily: { date: todayKey(), handled: [] } }),
    }),
    {
      name: STORAGE.wardrobe,
      version: 7,
      // v1 -> v2: bestehende Items bekommen category (aus dem Kategorie-Tag) und sharedWithCrew
      migrate: (persisted, version) => {
        const state = persisted as { items?: Partial<WardrobeItem>[] };
        // v7: neue Mock-Teile mit echten Fotos einmalig nachreichen (Vorhandenes bleibt unangetastet)
        const have = new Set((state.items ?? []).map((i) => i.id));
        const extra = version < 7 ? MOCK_WARDROBE.filter((m) => !have.has(m.id)) : [];
        return {
          ...state,
          items: [...(state.items ?? []), ...extra].map((i) => ({
            ...i,
            category: i.category ?? categoryFromLabel(i.tags?.find((t) => t.kind === "category")?.label),
            // v2 -> v3: Farbe aus dem Farb-Tag ableiten
            color: i.color ?? colorFromLabel(i.tags?.find((t) => t.kind === "color")?.label),
          })),
        } as unknown as WardrobeState;
      },
      // Bei JEDEM Laden: Items ohne Farbe nachziehen (Farbe aus dem Farb-Tag). Versionsunabhängig, damit
      // der Farbfilter auch bei bereits gespeicherten Items exakt auf das color-Feld prüfen kann.
      merge: (persisted, current) => {
        const p = persisted as Partial<WardrobeState> | undefined;
        // Alte Mock-/Platzhalterbilder (Picsum: Frösche, Städte …) durch passende Kleidungsfotos ersetzen
        const fresh = new Map(MOCK_WARDROBE.map((m) => [m.id, m]));
        const fixImage = (i: WardrobeItem): WardrobeItem => {
          if (!i.image?.includes("picsum.photos")) return i;
          const m = fresh.get(i.id);
          return m
            ? { ...m, wearCount: i.wearCount, lastWorn: i.lastWorn, visibility: i.visibility, listing: i.listing, price: i.price }
            : { ...i, image: placeholderPhoto(i.category, i.color) };
        };
        const items = (p?.items ?? current.items).map(fixImage).map((i) =>
          ({ ...i, wearCount: i.wearCount ?? 0, color: i.color ?? colorFromLabel(i.tags?.find((t) => t.kind === "color")?.label) }),
        ).map((i) => {
          // Alte Items (nur sharedWithCrew/listing) bekommen das neue visibility-Objekt; das Altfeld verschwindet
          const { sharedWithCrew: _legacy, ...rest } = i as typeof i & { sharedWithCrew?: boolean };
          void _legacy;
          return { ...rest, visibility: visibilityFromLegacy(i as Parameters<typeof visibilityFromLegacy>[0]) };
        });
        return { ...current, ...p, items };
      },
    },
  ),
);
