import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LikeTraits {
  /** IDs der gelikten Items bzw. Listings */
  itemIds: string[];
  categories: string[];
  colors: string[];
}

interface PreferencesState {
  likedItems: string[];
  likedCategories: Record<string, number>;
  likedColors: Record<string, number>;
  /** delta = +1 beim Liken, -1 beim Zurücknehmen */
  recordLike: (traits: LikeTraits, delta: 1 | -1) => void;
  reset: () => void;
}

const bump = (map: Record<string, number>, keys: string[], delta: number) => {
  const next = { ...map };
  for (const k of keys) {
    const v = (next[k] ?? 0) + delta;
    if (v > 0) next[k] = v;
    else delete next[k];
  }
  return next;
};

/**
 * Gesammelte Vorlieben aus Likes. Grundlage für spätere KI-Empfehlungen
 * (siehe "Dein Style-Profil" im Profil).
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      likedItems: [],
      likedCategories: {},
      likedColors: {},
      recordLike: (traits, delta) =>
        set((s) => ({
          likedItems:
            delta > 0
              ? Array.from(new Set([...s.likedItems, ...traits.itemIds]))
              : s.likedItems.filter((id) => !traits.itemIds.includes(id)),
          likedCategories: bump(s.likedCategories, traits.categories, delta),
          likedColors: bump(s.likedColors, traits.colors, delta),
        })),
      reset: () => set({ likedItems: [], likedCategories: {}, likedColors: {} }),
    }),
    { name: "outfit4today-prefs" },
  ),
);
