import type { ItemCategory } from "@/types";

const CLOTHING = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOES = Array.from({ length: 13 }, (_, i) => String(35 + i)); // EU 35 bis 47

/** Auswahl je Kategorie: Schuhe in EU-Größen, alles andere XS–XXL. */
export const sizesFor = (category: ItemCategory | ""): string[] => (category === "shoes" ? SHOES : CLOTHING);

/** Gibt die Größe nur zurück, wenn sie zur Kategorie passt (beim Kategoriewechsel Schuh <-> Kleidung entfällt sie). */
export const validSize = (category: ItemCategory | "", size?: string): string | undefined =>
  size && sizesFor(category).includes(size) ? size : undefined;
