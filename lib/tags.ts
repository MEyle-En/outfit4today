import { tag } from "@/lib/mock/wardrobe";
import type { ItemTag, TagKind } from "@/types";

/** Ersetzt den Tag einer Art (z.B. "color") oder hängt ihn an, falls er fehlt. */
export function syncTag(tags: ItemTag[], kind: TagKind, label: string): ItemTag[] {
  return tags.some((t) => t.kind === kind)
    ? tags.map((t) => (t.kind === kind ? { ...t, label } : t))
    : [...tags, tag(kind, label)];
}
