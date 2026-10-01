"use client";

import { Check, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { colorLabel } from "@/lib/colors";
import { TEXT_COLORS, TEXT_FONTS } from "@/lib/text-styles";
import { useLabStore, type CanvasText } from "@/lib/store/useLabStore";
import { cn } from "@/lib/utils";

export const TOOLBAR_W = 300;
export const TOOLBAR_H = 44;

/** Kleine Toolbar unter dem Textfeld: Schriftart, Farbe, Löschen. */
export function TextToolbar({ text, left, top }: { text: CanvasText; left: number; top: number }) {
  const { t } = useTranslation();
  const { updateText, removeText } = useLabStore.getState();
  // Farbnamen der Text-Palette auf die übersetzten Farbnamen abbilden
  const colorName = (id: string) =>
    colorLabel(({ white: "white", black: "black", lavender: "purple", neon: "yellow", red: "red", pink: "pink" } as const)[id as "white"]);

  return (
    <div
      // Klicks hier dürfen weder Auswahl aufheben noch etwas ziehen
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="glass absolute z-[900] flex items-center gap-2 rounded-2xl bg-surface/90 px-2 shadow-2xl"
      style={{ left, top, width: TOOLBAR_W, height: TOOLBAR_H }}
    >
      <div className="flex gap-1" role="radiogroup" aria-label={t("text_font")}>
        {TEXT_FONTS.map((f) => (
          <button
            key={f.id}
            role="radio"
            aria-checked={text.font === f.id}
            aria-label={f.label}
            title={f.label}
            onClick={() => updateText(text.id, { font: f.id })}
            className={cn(
              "grid h-8 w-9 place-items-center rounded-lg text-base leading-none transition-colors",
              text.font === f.id ? "bg-accent/30 text-white ring-1 ring-accent/50" : "text-zinc-400 hover:text-white",
            )}
            style={{ fontFamily: f.css, fontWeight: f.weight }}
          >
            Aa
          </button>
        ))}
      </div>

      <span className="h-5 w-px bg-white/10" />

      <div className="flex flex-1 items-center justify-between" role="radiogroup" aria-label={t("color")}>
        {TEXT_COLORS.map((c) => {
          const active = text.color.toLowerCase() === c.hex;
          return (
            <button
              key={c.id}
              role="radio"
              aria-checked={active}
              aria-label={colorName(c.id)}
              title={colorName(c.id)}
              onClick={() => updateText(text.id, { color: c.hex })}
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full border border-white/25 transition active:scale-90",
                active && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
              )}
              style={{ background: c.hex }}
            >
              {active && <Check className={cn("h-3 w-3", c.id === "white" || c.id === "neon" ? "text-black" : "text-white")} strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      <span className="h-5 w-px bg-white/10" />

      <button
        aria-label={t("text_delete")}
        onClick={() => removeText(text.id)}
        className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
