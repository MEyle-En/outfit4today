"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KebabItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

/** Kleines ⋮-Menü ohne zusätzliche Bibliothek. Schließt beim Antippen außerhalb. */
export function KebabMenu({ items, label, className }: { items: KebabItem[]; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-9 z-50 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-surface p-1 shadow-2xl">
            {items.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10",
                  it.danger ? "text-red-300" : "text-zinc-200",
                )}
              >
                {it.icon} {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
