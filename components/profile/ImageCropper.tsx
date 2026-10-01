"use client";

import { useState } from "react";
import Cropper from "react-easy-crop";
import { Check, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { cropToDataUrl, type CropArea } from "@/lib/image";

/**
 * Profilbild zuschneiden: Bild verschieben (Drag) und zoomen (Slider), bis es im runden Ausschnitt sitzt.
 * "Fertig" liefert ein quadratisches JPEG (256 px) als Data-URL.
 */
export function ImageCropper({
  image,
  onCancel,
  onDone,
}: {
  image: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);

  const done = async () => {
    if (!area || busy) return;
    setBusy(true);
    try {
      onDone(await cropToDataUrl(image, area, 256, 0.88));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="bg-black/95">
        <DialogTitle>{t("crop_title")}</DialogTitle>
        <DialogDescription>{t("crop_hint")}</DialogDescription>

        {/* Der Kreis bleibt fest in der Mitte, das Bild bewegt sich darunter */}
        <div className="relative mt-4 h-72 overflow-hidden rounded-2xl bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_a, pixels) => setArea(pixels)}
            style={{ cropAreaStyle: { border: "2px solid #fff", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" } }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-5 w-5 shrink-0 text-white" aria-hidden />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label={t("crop_zoom")}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="glass" size="lg" className="flex-1" onClick={onCancel}>
            {t("crop_cancel")}
          </Button>
          <Button size="lg" className="flex-1" onClick={done} disabled={!area || busy}>
            <Check className="h-5 w-5" /> {t("crop_done")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
