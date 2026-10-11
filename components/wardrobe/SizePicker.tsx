"use client";

import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { FieldLabel } from "@/components/wardrobe/FieldLabel";
import { useTranslation } from "@/hooks/useTranslation";
import { sizesFor } from "@/lib/sizes";
import type { ItemCategory } from "@/types";

/** Optionale Größenwahl (gleiche Chips wie die Kategorie). Erneutes Antippen hebt die Auswahl auf. */
export function SizePicker({
  category,
  value,
  onChange,
}: {
  category: ItemCategory | "";
  value?: string;
  onChange: (size: string | undefined) => void;
}) {
  const { t } = useTranslation();
  if (!category) return null; // erst nach der Kategorie-Auswahl
  const options = sizesFor(category).map((s) => ({ id: s, label: s }));
  return (
    <div>
      <FieldLabel>{t("size_label")}</FieldLabel>
      <CategoryPicker
        value={value ?? ""}
        options={options}
        wrap
        onChange={(s) => onChange(s === value ? undefined : s)}
      />
    </div>
  );
}
