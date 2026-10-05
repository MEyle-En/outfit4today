import { categoryLabel } from "@/lib/categories";
import { colorLabel } from "@/lib/colors";
import type { ItemCategory, ItemColor } from "@/types";

/** Eigener Name oder, wenn leer, "Farbe Kategorie" (z.B. "Blau Top"). */
export function finalItemName(name: string, category: ItemCategory, color: ItemColor): string {
  return name.trim() || `${colorLabel(color)} ${categoryLabel(category)}`;
}
