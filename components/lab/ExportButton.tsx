"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { useLabStore } from "@/lib/store/useLabStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";

/** Mock-Export. Später: Canvas zu Bild rendern und in die Crew posten. */
export function ExportButton({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation();
  const [rendering, setRendering] = useState(false);

  const exportFit = () => {
    setRendering(true);
    // Ein exportierter Fit gilt als getragen (füttert "Vergessene Schätze")
    useWardrobeStore.getState().markWorn(useLabStore.getState().items.map((i) => i.itemId));
    setTimeout(() => {
      setRendering(false);
      // kurz warten, damit der Button-State gerendert ist, bevor alert() blockiert
      setTimeout(() => window.alert(t("export_done")), 50);
    }, 1000);
  };

  return (
    <Button size="sm" className="flex-1" onClick={exportFit} disabled={disabled || rendering}>
      {rendering ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {t("export_rendering")}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" /> {t("export_fit")}
        </>
      )}
    </Button>
  );
}
