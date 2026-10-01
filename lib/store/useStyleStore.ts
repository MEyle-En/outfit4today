import { STORAGE } from "@/lib/storage-keys";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StylePrefs } from "@/types";

interface StyleState extends StylePrefs {
  hasOnboarded: boolean;
  completeOnboarding: (prefs: StylePrefs) => void;
  reset: () => void;
}

export const useStyleStore = create<StyleState>()(
  persist(
    (set) => ({
      vibes: [],
      colors: [],
      icons: [],
      hasOnboarded: false,
      completeOnboarding: (prefs) => set({ ...prefs, hasOnboarded: true }),
      reset: () => set({ vibes: [], colors: [], icons: [], hasOnboarded: false }),
    }),
    { name: STORAGE.style },
  ),
);
