import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/mock/wardrobe";
import type { BundleListing } from "@/types";

interface BundleState {
  bundles: BundleListing[];
  addBundle: (b: Omit<BundleListing, "id" | "createdAt">) => string;
  removeBundle: (id: string) => void;
  clearAll: () => void;
}

/** Outfits aus dem Fit Lab, die als Set verkauft werden. */
export const useBundleStore = create<BundleState>()(
  persist(
    (set) => ({
      bundles: [],
      addBundle: (b) => {
        const id = uid();
        set((s) => ({ bundles: [{ ...b, id, createdAt: Date.now() }, ...s.bundles] }));
        return id;
      },
      removeBundle: (id) => set((s) => ({ bundles: s.bundles.filter((b) => b.id !== id) })),
      clearAll: () => set({ bundles: [] }),
    }),
    { name: "outfit4today-bundles" },
  ),
);
