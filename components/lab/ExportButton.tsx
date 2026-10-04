"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { CANVAS_ID } from "@/lib/lab";
import { playSound } from "@/lib/sound";
import { toast } from "@/lib/store/useToastStore";
import { useLabStore } from "@/lib/store/useLabStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { haptic } from "@/lib/utils/haptic";

/** Rendert das Canvas als PNG mit transparentem Hintergrund (freigestellte Teile behalten ihre Form). */
export function ExportButton({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation();
  const [rendering, setRendering] = useState(false);

  const exportFit = async () => {
    const node = document.getElementById(CANVAS_ID);
    if (!node || rendering) return;
    setRendering(true);
    try {
      // Auswahlrahmen, Griffe und Toolbar vor dem Foto wegnehmen
      window.dispatchEvent(new Event("lab:deselect"));
      await new Promise((r) => setTimeout(r, 120));
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
        onclone: (doc) => {
          const el = doc.getElementById(CANVAS_ID);
          if (el) {
            el.style.background = "transparent";
            el.style.backgroundImage = "none";
            el.style.border = "none";
          }
          doc.querySelectorAll("[data-export-hide]").forEach((n) => n.remove());
        },
      });
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("toBlob failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `outfit4today-fit-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      // Ein exportierter Fit gilt als getragen (füttert "Vergessene Schätze")
      useWardrobeStore.getState().markWorn(useLabStore.getState().items.map((i) => i.itemId));
      playSound("success");
      haptic("success");
      toast(t("export_done"));
    } catch (error) {
      console.error("Export failed:", error);
      haptic("error");
      toast(t("export_failed"), undefined, "error");
    } finally {
      setRendering(false);
    }
  };

  return (
    <Button size="sm" className="flex-1" onClick={() => void exportFit()} disabled={disabled || rendering}>
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
