"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { tag as makeTag } from "@/lib/mock/wardrobe";
import { colorFromLabel, swatchOf } from "@/lib/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { ItemTag, TagKind } from "@/types";

const DOT: Record<TagKind, string> = {
  category: "bg-accent",
  color: "bg-zinc-400", // wird bei Farb-Tags durch die echte Farbe ersetzt
  material: "bg-sky-400",
  brand: "bg-pink-400",
  custom: "bg-zinc-400",
};

/** Editierbare Chips: Klick = Text ändern (Enter/Blur speichert), x = entfernen, + = neu. */
export function TagChips({ tags, onChange }: { tags: ItemTag[]; onChange: (tags: ItemTag[]) => void }) {
  const { t: tr } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.select();
  }, [editingId]);

  const startEdit = (t: ItemTag) => {
    setEditingId(t.id);
    setDraft(t.label);
  };

  const commit = () => {
    if (!editingId) return;
    const label = draft.trim();
    onChange(
      label
        ? tags.map((t) => (t.id === editingId ? { ...t, label } : t))
        : tags.filter((t) => t.id !== editingId), // leer = löschen
    );
    setEditingId(null);
  };

  const addNew = () => {
    const t = makeTag("custom", "");
    onChange([...tags, t]);
    setEditingId(t.id);
    setDraft("");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Badge key={t.id} className="h-8 pl-2.5 pr-1">
          {/* Farb-Tags zeigen die tatsächliche Farbe (vorher immer ein grüner Punkt) */}
          <span
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full border border-white/30", t.kind !== "color" && DOT[t.kind])}
            style={t.kind === "color" ? { background: swatchOf(colorFromLabel(t.label)) ?? "#71717A" } : undefined}
          />
          {editingId === t.id ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditingId(null);
              }}
              size={Math.max(4, draft.length)}
              className="bg-transparent text-xs text-white outline-none"
              aria-label={tr("tag_edit")}
            />
          ) : (
            <button type="button" onClick={() => startEdit(t)} className="text-xs">
              {t.label || "…"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x.id !== t.id))}
            aria-label={tr("tag_remove", { name: t.label })}
            className="grid h-5 w-5 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <button
        type="button"
        onClick={addNew}
        aria-label={tr("tag_add")}
        className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-white/20 text-zinc-400 hover:border-accent hover:text-accent-soft"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
