"use client";

import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { FitPreview } from "@/components/crew/FitPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { layoutLayers, type Suggestion } from "@/lib/suggest";
import { useLabStore } from "@/lib/store/useLabStore";

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const router = useRouter();
  const { t } = useTranslation();
  const layers = layoutLayers(suggestion.items);

  // Kombi ins Lab übernehmen: Canvas leeren, Teile setzen, hinwechseln
  const openInLab = () => {
    const { clearCanvas, addItemToCanvas, setKeepOnce } = useLabStore.getState();
    clearCanvas();
    setKeepOnce(true);
    layers.forEach((l) => addItemToCanvas(l.itemId, { x: l.x, y: l.y }));
    router.push("/lab");
  };

  return (
    <article className="w-64 shrink-0 space-y-3 rounded-2xl border border-white/10 bg-surface p-3">
      <FitPreview layers={layers} />
      <div>
        <p className="font-display text-lg font-semibold leading-tight">{suggestion.title}</p>
        <p className="text-xs text-zinc-500">{suggestion.items.map((i) => i.name).join(" · ")}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestion.reasons.map((r) => (
          <Badge key={r} variant="default" className="py-0.5 text-[10px]">
            {r}
          </Badge>
        ))}
      </div>
      <Button size="sm" variant="glass" className="w-full" onClick={openInLab}>
        <Wand2 className="h-4 w-4" /> {t("suggest_openLab")}
      </Button>
    </article>
  );
}
