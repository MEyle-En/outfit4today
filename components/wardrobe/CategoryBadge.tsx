import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/categories";
import type { ItemCategory } from "@/types";

/** Kleidung: normale Kategorie. Lifestyle-Items bekommen den eigenen "Vibe"-Look. */
export function CategoryBadge({ category }: { category: ItemCategory }) {
  if (category === "lifestyle") {
    return (
      <Badge className="border-fuchsia-400/50 bg-gradient-to-r from-accent/40 to-fuchsia-500/40 text-white">
        <Sparkles className="h-3 w-3" /> {categoryLabel("lifestyle")}
      </Badge>
    );
  }
  return <Badge variant="default">{categoryLabel(category)}</Badge>;
}
