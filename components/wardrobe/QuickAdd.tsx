"use client";

import { useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseQuickAdd } from "@/lib/ai/mock-ai";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { categoryLabel, useCategoryOptions } from "@/lib/categories";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { useTranslation } from "@/hooks/useTranslation";
import { ColorPicker } from "@/components/wardrobe/ColorPicker";
import { FieldLabel } from "@/components/wardrobe/FieldLabel";
import { colorLabel } from "@/lib/colors";
import { syncTag } from "@/lib/tags";
import type { ItemCategory, ItemColor } from "@/types";


export function QuickAdd({ onSaved }: { onSaved?: (count: number) => void }) {
  const { t } = useTranslation();
  const categoryOptions = useCategoryOptions();
  const QUICK_OPTIONS = [{ id: "auto" as const, label: t("quick_auto") }, ...categoryOptions];
  const addItem = useWardrobeStore((s) => s.addItem);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<ItemCategory | "auto">("auto");
  const [color, setColor] = useState<ItemColor | null>(null); // null = Auto

  const submit = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    const ai = await parseQuickAdd(value);
    const chosen = category === "auto" ? ai.category : category;
    const chosenColor = color ?? ai.color;
    const withColor = chosenColor ? syncTag(ai.tags, "color", colorLabel(chosenColor)) : ai.tags;
    addItem({
      name: ai.name,
      category: chosen,
      // manuell gewählte Kategorie überschreibt den AI-Kategorie-Chip
      color: chosenColor,
      tags: withColor.map((tg) => (tg.kind === "category" ? { ...tg, label: categoryLabel(chosen) } : tg)),
      isPlaceholder: true,
      image: `https://picsum.photos/seed/${encodeURIComponent(value)}/480/600`,
    });
    setText("");
    setBusy(false);
    playSound("success");
    haptic("success");
    onSaved?.(1);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-3"
    >
      <div className="glass rounded-2xl p-4">
        <p className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
          <Sparkles className="h-4 w-4 text-accent-soft" />
          {t("quick_hint")}
        </p>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("quick_placeholder")}
            disabled={busy}
            aria-label={t("quick_aria")}
          />
          <Button type="submit" silent size="icon" className="h-12 w-12 shrink-0" disabled={!text.trim() || busy} aria-label="Add">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          </Button>
        </div>
        <div className="mt-3">
          <FieldLabel>{t("pick_category")}</FieldLabel>
          <CategoryPicker value={category} options={QUICK_OPTIONS} onChange={setCategory} wrap />
        </div>
        <div className="mt-2">
          <FieldLabel>{t("pick_color")}</FieldLabel>
          <ColorPicker value={color} onChange={setColor} noneLabel={t("quick_auto")} />
        </div>
        {busy && <p className="mt-3 text-sm text-accent-soft">{t("quick_building")}</p>}
      </div>
    </form>
  );
}
