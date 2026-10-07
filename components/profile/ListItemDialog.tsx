"use client";

import { useState } from "react";
import { ArrowLeftRight, Repeat, Shirt, Tag } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PickTile } from "@/components/wardrobe/PickTile";
import { useTranslation } from "@/hooks/useTranslation";
import { simulateBuyerInquiry } from "@/lib/store/useChatStore";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { cn } from "@/lib/utils";

type Mode = "swap" | "sell" | "both";

/** Wardrobe-Items für Tausch und/oder Verkauf anbieten. Beim Verkauf ist ein Preis Pflicht. */
export function ListItemDialog({
  open,
  onOpenChange,
  initialSelected = [],
  initialMode = "sell",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Items, die beim Öffnen schon ausgewählt sind (z.B. aus "Vergessene Schätze" oder der Item-Karte) */
  initialSelected?: string[];
  /** Vorbelegter Modus (z.B. "swap" beim Tauschen-Button) */
  initialMode?: Mode;
}) {
  const { t } = useTranslation();
  const items = useWardrobeStore((s) => s.items);
  const setListing = useWardrobeStore((s) => s.setListing);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [price, setPrice] = useState("");

  const MODES: { id: Mode; label: string; icon: typeof Tag }[] = [
    { id: "swap", label: t("mode_swap"), icon: ArrowLeftRight },
    { id: "sell", label: t("mode_sell"), icon: Tag },
    { id: "both", label: t("mode_both"), icon: Repeat },
  ];

  const available = items.filter((i) => !i.visibility.onMarketplace);
  const needsPrice = mode !== "swap";
  const priceValue = Number(price);
  const priceValid = !needsPrice || (price !== "" && priceValue > 0);
  const canSubmit = selected.length > 0 && priceValid;

  const submit = () => {
    if (!canSubmit) return;
    setListing(selected, mode, needsPrice ? priceValue : undefined);
    items
      .filter((i) => selected.includes(i.id))
      .forEach((i) => simulateBuyerInquiry({ id: i.id, name: i.name, image: i.image, listing: mode, price: needsPrice ? priceValue : undefined }));
    toast(t("toast_listed"), t("toast_listedCount", { n: selected.length }));
    setSelected([]);
    setPrice("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("list_title")}</DialogTitle>
        <DialogDescription>{t("list_desc")}</DialogDescription>

        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                aria-pressed={mode === id}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-2xl border py-3 text-sm font-semibold transition-colors",
                  mode === id ? "border-accent/60 bg-accent/20" : "border-white/10 bg-white/5 text-zinc-400",
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {available.length === 0 ? (
            <EmptyState compact icon={Shirt} title={t("list_allListed")} description={t("list_allListedDesc")} />
          ) : (
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto pr-1">
              {available.map((i) => (
                <PickTile
                  key={i.id}
                  image={i.image}
                  transparent={i.hasTransparentBackground}
                  name={i.name}
                  selected={selected.includes(i.id)}
                  onClick={() => setSelected((s) => (s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id]))}
                />
              ))}
            </div>
          )}

          {needsPrice && (
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-sm font-semibold">
                {t("price_label")} <span className="text-accent-soft">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="price"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t("price_placeholder")}
                  value={price}
                  // nur Ziffern zulassen
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  aria-invalid={price !== "" && !priceValid}
                  aria-required
                  className={cn("h-11 w-32", price !== "" && !priceValid && "ring-2 ring-red-400/60")}
                />
                <span className="text-zinc-400">{t("price_perItem")}</span>
              </div>
              {price === "" ? (
                <p className="text-xs text-zinc-500">{t("price_required")}</p>
              ) : !priceValid ? (
                <p className="text-xs text-red-300">{t("price_invalid")}</p>
              ) : null}
            </div>
          )}

          <p className="text-xs text-zinc-500">{t("list_visibleNote")}</p>

          <Button size="lg" className="w-full" disabled={!canSubmit} onClick={submit}>
            {selected.length > 0 ? t("list_submit", { n: selected.length }) : t("list_pick")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
