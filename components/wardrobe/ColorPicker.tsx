"use client";

import { Check } from "lucide-react";
import { COLORS, colorLabel } from "@/lib/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { ItemColor } from "@/types";

/** Farbpalette aus kleinen Kreisen. Mit `noneLabel` gibt es zusätzlich einen "kein Wert"-Chip (null). */
export function ColorPicker({
  value,
  onChange,
  noneLabel,
  className,
}: {
  value: ItemColor | null | undefined;
  onChange: (c: ItemColor | null) => void;
  noneLabel?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div role="radiogroup" aria-label={t("color")} className={cn("no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1", className)}>
      {noneLabel && (
        <button
          type="button"
          role="radio"
          aria-checked={value == null}
          onClick={() => onChange(null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            value == null ? "border-accent/60 bg-accent/20 text-white" : "border-white/10 bg-white/5 text-zinc-400",
          )}
        >
          {noneLabel}
        </button>
      )}
      {COLORS.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={colorLabel(c.id)}
            title={colorLabel(c.id)}
            onClick={() => onChange(c.id)}
            // 28px Kreis, 32px Touch-Fläche durch Ring-Abstand
            className={cn(
              "relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 transition-all duration-200 hover:scale-110 active:scale-90",
              active && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
            )}
            style={{ background: c.swatch }}
          >
            {active && (
              <Check
                className={cn("h-4 w-4", c.id === "white" || c.id === "yellow" || c.id === "beige" ? "text-black" : "text-white")}
                strokeWidth={3}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
