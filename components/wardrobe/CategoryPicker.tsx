"use client";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  id: T;
  label: string;
}

/** Horizontal scrollbare Chip-Auswahl (Single-Select). */
export function CategoryPicker<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
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
