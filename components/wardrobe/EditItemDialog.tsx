"use client";

import { useState } from "react";
import { ArrowLeftRight, Eye, EyeOff, Repeat, Store, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/wardrobe/ColorPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { colorLabel } from "@/lib/colors";
import { syncTag } from "@/lib/tags";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { cn } from "@/lib/utils";
import type { ItemCategory, ItemColor, WardrobeItem } from "@/types";

type Visibility = "private" | "crew" | "marketplace";
type Mode = "swap" | "sell" | "both";

const initialVisibility = (i: WardrobeItem): Visibility => (i.listing ? "marketplace" : i.sharedWithCrew ? "crew" : "private");

/** Item nachträglich bearbeiten: Name, Kategorie, Farbe und Sichtbarkeit (Privat / Crew / Marketplace). */
export function EditItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item: WardrobeItem;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const updateItem = useWardrobeStore((s) => s.updateItem);
  const setListing = useWardrobeStore((s) => s.setListing);

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [color, setColor] = useState<ItemColor | undefined>(item.color);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility(item));
  const [mode, setMode] = useState<Mode>(item.listing ?? "sell");
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "");

  const needsPrice = visibility === "marketplace" && mode !== "swap";
  const priceOk = !needsPrice || (price !== "" && Number(price) > 0);
  const canSave = name.trim().length > 0 && priceOk;

  const VIS: { id: Visibility; label: string; icon: typeof Eye }[] = [
    { id: "private", label: t("vis_private"), icon: EyeOff },
    { id: "crew", label: t("vis_crew"), icon: Users },
    { id: "marketplace", label: t("vis_market"), icon: Store },
  ];
  const MODES: { id: Mode; label: string; icon: typeof Tag }[] = [
    { id: "swap", label: t("mode_swap"), icon: ArrowLeftRight },
    { id: "sell", label: t("mode_sell"), icon: Tag },
    { id: "both", label: t("mode_both"), icon: Repeat },
  ];

  const save = () => {
    if (!canSave) return;
    // Kategorie- und Farb-Chip mitführen, damit Tags und Felder nicht auseinanderlaufen
    let tags = syncTag(item.tags, "category", categoryLabel(category));
    if (color) tags = syncTag(tags, "color", colorLabel(color));
    updateItem(item.id, {
      name: name.trim(),
      category,
      color,
      tags,
      sharedWithCrew: visibility !== "private",
    });
    if (visibility === "marketplace") setListing([item.id], mode, mode === "swap" ? undefined : Number(price));
    else if (item.listing) setListing([item.id], undefined);
    toast(t("toast_saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("edit_title")}</DialogTitle>
        <DialogDescription>{t("edit_desc")}</DialogDescription>

        <div className="mt-5 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="edit-name" className="text-sm font-semibold">
              {t("edit_name")}
            </label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-cat" className="text-sm font-semibold">
              {t("edit_category")}
            </label>
            <select
              id="edit-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface">
                  {c.emoji} {categoryLabel(c.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold">{t("color")}</p>
            <ColorPicker value={color} onChange={(c) => c && setColor(c)} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("edit_visibility")}</p>
            <div className="grid grid-cols-3 gap-2">
              {VIS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVisibility(id)}
                  aria-pressed={visibility === id}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border py-3 text-xs font-semibold transition-colors",
                    visibility === id ? "border-accent/60 bg-accent/20" : "border-white/10 bg-white/5 text-zinc-400",
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {visibility === "marketplace" && (
              <div className="space-y-3 rounded-2xl bg-white/5 p-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {MODES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMode(id)}
                      aria-pressed={mode === id}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold",
                        mode === id ? "bg-accent/30 text-white ring-1 ring-accent/50" : "text-zinc-400",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>
                {needsPrice && (
                  <div className="flex items-center gap-2">
                    <Input
                      inputMode="numeric"
                      placeholder={t("price_placeholder")}
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      aria-label={t("price_label")}
                      aria-invalid={price !== "" && !priceOk}
                      className="h-11 w-32"
                    />
                    <span className="text-zinc-400">€</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button size="lg" className="w-full" disabled={!canSave} onClick={save}>
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
