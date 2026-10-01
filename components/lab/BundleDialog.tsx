"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useBundleStore } from "@/lib/store/useBundleStore";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import type { FitLayer } from "@/types";

/** Ganzes Outfit aus dem Lab als Bundle verkaufen: Gesamtpreis, Beschreibung, "nur zusammen" oder "auch einzeln". */
export function BundleDialog({
  layers,
  open,
  onOpenChange,
  onCreated,
}: {
  layers: FitLayer[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const addBundle = useBundleStore((s) => s.addBundle);
  const itemIds = Array.from(new Set(layers.map((l) => l.itemId)));
  const defaultDesc = t("bundle_defaultDesc", {
    n: itemIds.length,
    names: Array.from(new Set(layers.map((l) => l.name))).join(" + "),
  });

  const [price, setPrice] = useState("");
  const [description, setDescription] = useState(defaultDesc);
  const [onlyTogether, setOnlyTogether] = useState(true);

  const priceOk = price !== "" && Number(price) > 0;
  const canCreate = priceOk && description.trim().length > 0 && itemIds.length > 0;

  const create = () => {
    if (!canCreate) return;
    addBundle({ items: itemIds, bundlePrice: Number(price), description: description.trim(), onlyTogether });
    toast(t("bundle_created"), t("bundle_createdDesc"));
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-6 w-6 text-accent-soft" /> {t("bundle_title")}
        </DialogTitle>
        <DialogDescription>{t("bundle_desc")}</DialogDescription>

        <div className="mt-5 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="bundle-price" className="text-sm font-semibold">
              {t("bundle_price")} <span className="text-accent-soft">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="bundle-price"
                inputMode="numeric"
                placeholder={t("price_placeholder")}
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 5))}
                aria-required
                aria-invalid={price !== "" && !priceOk}
                className="h-11 w-32"
              />
              <span className="text-zinc-400">€</span>
            </div>
            {price !== "" && !priceOk && <p className="text-xs text-red-300">{t("price_invalid")}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bundle-desc" className="text-sm font-semibold">
              {t("bundle_description")}
            </label>
            <Input id="bundle-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} />
          </div>

          <div className="space-y-1.5" role="radiogroup" aria-label={t("bundle_mode")}>
            {[
              { v: true, label: t("bundle_onlyTogether"), hint: t("bundle_onlyTogetherHint") },
              { v: false, label: t("bundle_alsoSingle"), hint: t("bundle_alsoSingleHint") },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                role="radio"
                aria-checked={onlyTogether === o.v}
                onClick={() => setOnlyTogether(o.v)}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition-colors",
                  onlyTogether === o.v ? "border-accent/60 bg-accent/15" : "border-white/10 bg-white/5",
                )}
              >
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="block text-xs text-zinc-400">{o.hint}</span>
              </button>
            ))}
          </div>

          <Button size="lg" className="w-full" disabled={!canCreate} onClick={create}>
            <Package className="h-5 w-5" /> {t("bundle_create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
