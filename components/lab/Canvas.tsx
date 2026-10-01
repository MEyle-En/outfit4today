"use client";

import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { MousePointerClick } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { DraggableItem } from "@/components/lab/DraggableItem";
import { DraggableText } from "@/components/lab/DraggableText";
import { TOOLBAR_H, TOOLBAR_W, TextToolbar } from "@/components/lab/TextToolbar";
import { CANVAS_ID, GRID } from "@/lib/lab";
import { useLabStore } from "@/lib/store/useLabStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { cn } from "@/lib/utils";

const TEXT_Z = 500; // Texte liegen über allen Bildern

export function Canvas() {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_ID });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasItems = useLabStore((s) => s.items);
  const texts = useLabStore((s) => s.texts);
  const bringToFront = useLabStore((s) => s.bringToFront);
  const wardrobe = useWardrobeStore((s) => s.items);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [textDragging, setTextDragging] = useState(false);
  const prevTextCount = useRef(texts.length);

  const byId = new Map(wardrobe.map((w) => [w.id, w]));

  // Neuer (leerer) Text -> sofort auswählen und Tippen erlauben
  useEffect(() => {
    if (texts.length > prevTextCount.current) {
      const t = texts[texts.length - 1];
      if (t.content === "") {
        setSelectedTextId(t.id);
        setSelectedId(null);
        setEditingId(t.id);
      }
    }
    prevTextCount.current = texts.length;
  }, [texts]);

  const finishEdit = (id: string, content: string) => {
    setEditingId(null);
    const { updateText, removeText } = useLabStore.getState();
    // Leerer Text ergibt keinen Sinn -> entfernen
    if (content.trim() === "") {
      removeText(id);
      setSelectedTextId(null);
    } else {
      updateText(id, { content: content.trim() });
    }
  };

  const selectedText = texts.find((t) => t.id === selectedTextId);
  const canvasW = canvasRef.current?.offsetWidth ?? 352;
  const canvasH = canvasRef.current?.offsetHeight ?? 600;

  // Toolbar unter dem Textfeld; passt sie nicht (unten/seitlich), rutscht sie nach oben bzw. in die Fläche
  let toolbar: { left: number; top: number } | null = null;
  if (selectedText && !textDragging) {
    const below = selectedText.y + selectedText.height + 12;
    const top = below + TOOLBAR_H > canvasH ? Math.max(4, selectedText.y - TOOLBAR_H - 12) : below;
    const centered = selectedText.x + selectedText.width / 2 - TOOLBAR_W / 2;
    const left = Math.min(Math.max(centered, 4), Math.max(4, canvasW - TOOLBAR_W - 4));
    toolbar = { left, top };
  }

  const deselectAll = () => {
    setSelectedId(null);
    setSelectedTextId(null);
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        canvasRef.current = el;
      }}
      onClick={deselectAll}
      // relative + overflow-hidden: react-rnd nutzt das Canvas als Positions- und Bounds-Parent
      className={cn(
        "relative min-h-[600px] overflow-hidden rounded-2xl border bg-surface/60 transition-colors",
        isOver ? "border-accent/60" : "border-white/10",
      )}
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
        backgroundSize: `${GRID}px ${GRID}px`,
      }}
    >
      {isOver && <div className="pointer-events-none absolute inset-0 bg-accent/5" />}

      {canvasItems.length === 0 && texts.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-8 text-center">
          <div className="space-y-2 text-zinc-500">
            <MousePointerClick className="mx-auto h-8 w-8" />
            <p className="font-display text-xl font-semibold text-zinc-300">{t("canvas_title")}</p>
            <p className="text-sm">{t("canvas_hint")}</p>
          </div>
        </div>
      )}

      {canvasItems.map((ci, index) => {
        const item = byId.get(ci.itemId);
        if (!item) return null; // Wardrobe-Item wurde gelöscht
        return (
          <DraggableItem
            key={ci.id}
            canvasItem={ci}
            item={item}
            zIndex={index + 1}
            selected={selectedId === ci.id}
            onSelect={() => {
              setSelectedId(ci.id);
              setSelectedTextId(null);
              bringToFront(ci.id);
            }}
          />
        );
      })}

      {texts.map((t, index) => (
        <DraggableText
          key={t.id}
          text={t}
          zIndex={TEXT_Z + index}
          selected={selectedTextId === t.id}
          editing={editingId === t.id}
          onSelect={() => {
            setSelectedTextId(t.id);
            setSelectedId(null);
          }}
          onStartEdit={() => setEditingId(t.id)}
          onFinishEdit={(content) => finishEdit(t.id, content)}
          onDragState={setTextDragging}
        />
      ))}

      {selectedText && toolbar && <TextToolbar text={selectedText} left={toolbar.left} top={toolbar.top} />}
    </div>
  );
}
