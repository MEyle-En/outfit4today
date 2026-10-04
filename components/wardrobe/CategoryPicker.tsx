"use client";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  id: T;
  label: string;
}

/**
 * Single-Select aus Buttons (Icon + Text, KEINE Kreise – Kreise sind der Farbwahl vorbehalten).
 * Standard: horizontal scrollbare Chips für Filter. `wrap`: bricht in mehrere Zeilen um (Auswahl beim Anlegen/Bearbeiten).
 */
export function CategoryPicker<T extends string>({
  value,
  onChange,
  options,
  wrap = false,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  wrap?: boolean;
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn(
        wrap ? "flex flex-wrap gap-2" : "no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "shrink-0 border font-medium transition-all duration-200",
            wrap ? "rounded-xl px-3 py-2 text-sm" : "rounded-full px-3 py-1.5 text-xs",
            value === o.id
              ? "border-accent/60 bg-accent/20 text-white"
              : "border-white/10 bg-white/5 text-zinc-400 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
