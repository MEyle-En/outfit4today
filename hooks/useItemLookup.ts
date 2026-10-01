"use client";

import { useCallback } from "react";
import { FRIEND_ITEMS } from "@/lib/mock/crew";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import type { WardrobeItem } from "@/types";

/** Findet ein Item in meinem Wardrobe oder in den Freundes-Wardrobes. */
export function useItemLookup() {
  const mine = useWardrobeStore((s) => s.items);
  return useCallback(
    (id: string): WardrobeItem | undefined => mine.find((i) => i.id === id) ?? FRIEND_ITEMS.find((i) => i.id === id),
    [mine],
  );
}
