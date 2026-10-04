"use client";

import { useState } from "react";
import { Loader2, Plus, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseQuickAdd } from "@/lib/ai/mock-ai";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { categoryLabel, useCategoryOptions } from "@/lib/categories";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { placeholderPhoto } from "@/lib/mock-data";
import { useTranslation } from "@/hooks/useTranslation";
import { ColorPicker } from "@/components/wardrobe/ColorPicker";
import { FieldLabel } from "@/components/wardrobe/FieldLabel";
import { colorLabel } from "@/lib/colors";
import { tag } from "@/lib/mock/wardrobe";
import type { ItemCategory, ItemColor } from "@/types";

/**
 * Schnell hinzufügen ohne Foto: Name, Kategorie und Farbe wählt der Nutzer selbst (Pflichtfelder).
 * Die Mock-KI läuft nur noch auf Wunsch über "Auto-Fill (Beta)" und füllt die Felder lediglich vor.
 */
export function QuickAdd({ onSaved }: { onSaved?: (count: number) => void }) {
  const { t } = useTranslation();
  const categoryOptions = useCategoryOptions();
  const addItem = useWardrobeStore((s) => s.addItem);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">(""); // "" = noch nichts gewählt
  const [color, setColor] = useState<ItemColor | null>(null);
  const [filling, setFilling] = useState(false);

  const valid = name.trim().length >= 2 && !!category && !!color;

  const submit = () => {
    if (!valid || !category || !color) return;
    addItem({
      name: name.trim(),
      category,
      color,
      tags: [tag("category", categoryLabel(category)), tag("color", colorLabel(color))],
      isPlaceholder: true,
      image: placeholderPhoto(category, color),
    });
    setName("");
    setCategory("");
    setColor(null);
    playSound("success");
    haptic("success");
    onSaved?.(1);
  };

  /** Optional: Vorschlag der Mock-KI aus dem getippten Text. Alles bleibt änderbar. */
  const autoFill = async () => {
    if (!name.trim() || filling) return;
    setFilling(true);
    const ai = await parseQuickAdd(name);
    setName(ai.name);
    setCategory(ai.category);
    if (ai.color) setColor(ai.color);
    setFilling(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      <div className="glass rounded-2xl p-4">
        <p className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
          <Sparkles className="h-4 w-4 text-accent-soft" />
          {t("quick_hint")}
        </p>

        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("quick_placeholder")} aria-label={t("quick_aria")} />
          <Button type="submit" silent size="icon" className="h-12 w-12 shrink-0" disabled={!valid} aria-label="Add">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => void autoFill()}
          disabled={!name.trim() || filling}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent-soft hover:text-white disabled:opacity-40"
        >
          {filling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} {t("autofill_beta")}
        </button>

        <div className="mt-3">
          <FieldLabel>{t("pick_category")}</FieldLabel>
          <CategoryPicker value={category} options={categoryOptions} onChange={setCategory} wrap />
        </div>
        <div className="mt-2">
          <FieldLabel>{t("pick_color")}</FieldLabel>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {!valid && (name.length > 0 || category || color) && (
          <p role="alert" className="mt-3 text-sm text-amber-300">
            {t("magic_fillAll")}
          </p>
        )}
      </div>
    </form>
  );
}
