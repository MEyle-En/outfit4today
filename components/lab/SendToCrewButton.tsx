"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Package, Users } from "lucide-react";
import { FitPreview } from "@/components/crew/FitPreview";
import { BundleDialog } from "@/components/lab/BundleDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { useLabStore } from "@/lib/store/useLabStore";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { cn } from "@/lib/utils";
import type { FitLayer } from "@/types";

/**
 * Teilen aus dem Lab:
 *  - "An Crew senden": Post in der Crew; mit Toggle zusätzlich als Public Inspo.
 *  - "Nur Public posten": Post landet ohne Crew im öffentlichen Feed.
 *  - "Als Bundle verkaufen": das ganze Outfit als Set im Marketplace anbieten.
 */
export function SendToCrewButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const canvasItems = useLabStore((s) => s.items);
  const wardrobe = useWardrobeStore((s) => s.items);
  const crews = useCrewStore((s) => s.crews);
  const activeCrewId = useCrewStore((s) => s.activeCrewId);
  const sendFit = useCrewStore((s) => s.sendFit);
  const setActiveCrew = useCrewStore((s) => s.setActiveCrew);
  const setWardrobeView = useCrewStore((s) => s.setWardrobeView);
  const setCrewTab = useCrewStore((s) => s.setCrewTab);

  const [open, setOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [crewId, setCrewId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const layers: FitLayer[] = canvasItems.flatMap((ci) => {
    const item = wardrobe.find((w) => w.id === ci.itemId);
    return item
      ? [{ itemId: item.id, name: item.name, category: item.category, x: ci.x, y: ci.y, size: ci.size, rotation: ci.rotation }]
      : [];
  });

  const selected = crewId ?? activeCrewId ?? crews[0]?.id ?? null;

  const finish = () => {
    useWardrobeStore.getState().markWorn(layers.map((l) => l.itemId));
    setWardrobeView("crew");
    setOpen(false);
    setCaption("");
    setIsPublic(false);
    router.push("/wardrobe");
  };

  const sendToCrew = () => {
    if (!selected || !layers.length) return;
    sendFit({ crewId: selected, layers, caption, isPublic });
    setActiveCrew(selected);
    setCrewTab(isPublic ? "public" : "fits");
    toast(isPublic ? t("share_toastCrewPublic") : t("share_toastCrew"));
    finish();
  };

  const postPublicOnly = () => {
    if (!layers.length) return;
    sendFit({ crewId: null, layers, caption, isPublic: true });
    setCrewTab("public");
    toast(t("share_toastPublic"), t("share_toastPublicDesc"));
    finish();
  };

  return (
    <>
      <Button size="sm" variant="glass" className="flex-1" disabled={disabled} onClick={() => setOpen(true)}>
        <Users className="h-4 w-4" /> {t("share")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t("share_title")}</DialogTitle>
          <DialogDescription>{t("share_desc")}</DialogDescription>

          <div className="mt-5 space-y-4">
            <div className="mx-auto max-h-64 max-w-[220px] overflow-hidden">
              <FitPreview layers={layers} />
            </div>

            {crews.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {crews.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCrewId(c.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      c.id === selected ? "border-accent/60 bg-accent/20" : "border-white/10 bg-white/5 text-zinc-400",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {crews.length === 1 && <p className="text-center text-xs text-zinc-500">{t("share_to", { name: crews[0].name })}</p>}

            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t("share_caption")} aria-label="Caption" />

            {/* Public Inspo: zusätzlich zur Crew */}
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                isPublic ? "border-accent/60 bg-accent/15" : "border-white/10 bg-white/5",
              )}
            >
              <Globe className={cn("h-5 w-5 shrink-0", isPublic ? "text-accent-soft" : "text-zinc-500")} />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{t("share_publicToggle")}</span>
                <span className="block text-xs text-zinc-400">{isPublic ? t("share_publicOn") : t("share_publicOff")}</span>
              </span>
              <span className={cn("h-6 w-10 rounded-full p-0.5 transition-colors", isPublic ? "bg-accent" : "bg-white/15")}>
                <span className={cn("block h-5 w-5 rounded-full bg-white transition-transform", isPublic && "translate-x-4")} />
              </span>
            </button>

            {crews.length === 0 && <p className="text-center text-sm text-zinc-400">{t("share_noCrew")}</p>}

            <Button size="lg" className="w-full" onClick={sendToCrew} disabled={!selected || !layers.length}>
              <Users className="h-5 w-5" /> {isPublic ? t("share_sendCrewPublic") : t("share_sendCrew")}
            </Button>
            <Button size="lg" variant="glass" className="w-full" onClick={postPublicOnly} disabled={!layers.length}>
              <Globe className="h-5 w-5" /> {t("share_publicOnly")}
            </Button>
            <Button size="lg" variant="warm" className="w-full" onClick={() => setBundleOpen(true)} disabled={!layers.length}>
              <Package className="h-5 w-5" /> {t("share_sellBundle")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {bundleOpen && (
        <BundleDialog
          layers={layers}
          open
          onOpenChange={setBundleOpen}
          onCreated={() => {
            setOpen(false);
            router.push("/marketplace");
          }}
        />
      )}
    </>
  );
}
