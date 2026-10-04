"use client";

import { useState } from "react";
import { ArrowLeftRight, EyeOff, Repeat, RotateCw, ShoppingBag, Sparkles, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/wardrobe/ColorPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { rotateImage } from "@/lib/image";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { colorLabel } from "@/lib/colors";
import { syncTag } from "@/lib/tags";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { applyVisibility } from "@/lib/visibility";
import { cn } from "@/lib/utils";
import type { ItemCategory, ItemColor, Visibility, WardrobeItem } from "@/types";

type Mode = "swap" | "sell" | "both";

/** Item nachträglich bearbeiten: Bild drehen, Name, Kategorie, Farbe und Sichtbarkeit (Privat / Crew / Marketplace / Lab). */
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
  const setVisibility = useWardrobeStore((s) => s.setVisibility);
  const setListing = useWardrobeStore((s) => s.setListing);

  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0); // nur Vorschau, wird beim Speichern ins Bild eingerechnet
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [color, setColor] = useState<ItemColor | undefined>(item.color);
  const [vis, setVis] = useState<Visibility>(item.visibility);
  const [mode, setMode] = useState<Mode>(item.listing ?? "sell");
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "");

  const needsPrice = vis.onMarketplace && mode !== "swap";
  const priceOk = !needsPrice || (price !== "" && Number(price) > 0);
  const canSave = name.trim().length > 0 && priceOk;

  // Kanäle: Privat schließt Crew/Marketplace aus, Crew und Marketplace sind kombinierbar, Lab ist unabhängig
  const CHANNELS: { key: keyof Visibility; label: string; desc: string; icon: typeof Users }[] = [
    { key: "isPrivate", label: t("vis_private"), desc: t("vis_privateDesc"), icon: EyeOff },
    { key: "sharedWithCrew", label: t("vis_crew"), desc: t("vis_crewDesc"), icon: Users },
    { key: "onMarketplace", label: t("vis_market"), desc: t("vis_marketDesc"), icon: ShoppingBag },
    { key: "availableInLab", label: t("vis_lab"), desc: t("vis_labDesc"), icon: Sparkles },
  ];
  const MODES: { id: Mode; label: string; icon: typeof Tag }[] = [
    { id: "swap", label: t("mode_swap"), icon: ArrowLeftRight },
    { id: "sell", label: t("mode_sell"), icon: Tag },
    { id: "both", label: t("mode_both"), icon: Repeat },
  ];

  const toggle = (key: keyof Visibility) => {
    // Privat lässt sich nur einschalten (ausschalten = Crew oder Marketplace wählen)
    if (key === "isPrivate" && vis.isPrivate) return;
    setVis((v) => applyVisibility(v, { [key]: !v[key] }));
  };

  const save = async () => {
    if (!canSave || busy) return;
    let image = item.image;
    if (rotation !== 0) {
      setBusy(true);
      try {
        image = await rotateImage(item.image, rotation);
      } catch {
        // z.B. fremdes Bild ohne CORS-Freigabe: Rotation nicht möglich, restliche Änderungen werden trotzdem gespeichert
        toast(t("edit_rotateFailed"));
      }
      setBusy(false);
    }
    // Kategorie- und Farb-Chip mitführen, damit Tags und Felder nicht auseinanderlaufen
    let tags = syncTag(item.tags, "category", categoryLabel(category));
    if (color) tags = syncTag(tags, "color", colorLabel(color));
    updateItem(item.id, { image, name: name.trim(), category, color, tags });
    setVisibility(item.id, vis); // Marketplace aus => Angebot wird zurückgezogen
    if (vis.onMarketplace) setListing([item.id], mode, mode === "swap" ? undefined : Number(price));
    toast(t("toast_saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("edit_title")}</DialogTitle>
        <DialogDescription>{t("edit_desc")}</DialogDescription>

        <div className="mt-5 space-y-5">
          {/* Vorschau + Drehen */}
          <div className="flex items-center gap-4">
            <div className="grid h-32 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="max-h-full max-w-full object-contain transition-transform duration-200"
                style={{ transform: `rotate(${rotation}deg)`, ...(rotation % 180 !== 0 ? { maxHeight: "7rem", maxWidth: "7rem" } : {}) }}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <RotateCw className="h-4 w-4 text-accent-soft" /> {t("edit_rotation")}
              </p>
              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={t("edit_rotation")}>
                {([0, 90, 180, 270] as const).map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    role="radio"
                    aria-checked={rotation === deg}
                    onClick={() => setRotation(deg)}
                    className={cn(
                      "rounded-xl py-2 text-xs font-semibold transition-colors",
                      rotation === deg ? "bg-accent/30 text-white ring-1 ring-accent/50" : "bg-white/5 text-zinc-400",
                    )}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>

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
            <div>
              <p className="text-sm font-semibold">{t("edit_visibility")}</p>
              <p className="text-xs text-zinc-500">{t("edit_visibilityHint")}</p>
            </div>

            {/* Multi-Select: Kanäle sind NICHT exklusiv. Privat an => alle anderen aus; Crew/Marketplace an => Privat aus; Lab unabhängig. */}
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map(({ key, label, icon: Icon }) => {
                const on = vis[key];
                return (
                  <button
                    key={key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-sm font-semibold transition-colors",
                      on ? "border-accent bg-accent text-white shadow-glow" : "border-white/10 bg-white/5 text-zinc-400",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                );
              })}
            </div>

            {vis.onMarketplace && (
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

          <div className="flex gap-2">
            <Button size="lg" variant="glass" className="flex-1" onClick={() => onOpenChange(false)}>
              {t("crop_cancel")}
            </Button>
            <Button size="lg" className="flex-1" disabled={!canSave || busy} onClick={() => void save()}>
              {t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
