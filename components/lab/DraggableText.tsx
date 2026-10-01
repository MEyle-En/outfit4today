"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { RotateCw } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ROTATE_STEP } from "@/lib/lab";
import { fitFontSize, fontById } from "@/lib/text-styles";
import { useLabStore, type CanvasText } from "@/lib/store/useLabStore";
import { cn } from "@/lib/utils";

interface Props {
  text: CanvasText;
  zIndex: number;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onFinishEdit: (content: string) => void;
  onDragState: (dragging: boolean) => void;
}

// Touch-freundliche Griffe (Ecken 28px, Kanten 24px, je zur Hälfte außerhalb) – gleiche Logik wie bei den Bildern.
// Oben rechts sitzt der Rotate-Button, deshalb ist diese Ecke kein Resize-Griff.
const E = 24;
const C = 28;
const handleStyles = {
  top: { width: `calc(100% - ${C * 2}px)`, height: E, left: C, top: -E / 2 },
  bottom: { width: `calc(100% - ${C * 2}px)`, height: E, left: C, bottom: -E / 2 },
  left: { height: `calc(100% - ${C * 2}px)`, width: E, top: C, left: -E / 2 },
  right: { height: `calc(100% - ${C * 2}px)`, width: E, top: C, right: -E / 2 },
  topLeft: { width: C, height: C, left: -C / 2, top: -C / 2 },
  bottomLeft: { width: C, height: C, left: -C / 2, bottom: -C / 2 },
  bottomRight: { width: C, height: C, right: -C / 2, bottom: -C / 2 },
};
const RESIZE_ON = {
  top: true,
  right: true,
  bottom: true,
  left: true,
  topLeft: true,
  bottomLeft: true,
  bottomRight: true,
  topRight: false,
};
const Dot = () => (
  <span className="grid h-full w-full place-items-center">
    <span className="h-3.5 w-3.5 rounded-full border-2 border-accent bg-white shadow" />
  </span>
);

export function DraggableText({ text, zIndex, selected, editing, onSelect, onStartEdit, onFinishEdit, onDragState }: Props) {
  const { t } = useTranslation();
  const { updateText, bringTextToFront } = useLabStore.getState();
  const font = fontById(text.font);
  const rotation = text.rotation ?? 0; // ältere gespeicherte Texte haben noch keine Rotation
  const [draft, setDraft] = useState(text.content);
  const lastTap = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rotating = useRef<{ moved: boolean; startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(text.content);
      requestAnimationFrame(() => inputRef.current?.select());
    }
    // nur beim Wechsel in den Bearbeiten-Modus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Rotate-Handle wie bei den Bildern: Tippen = +15°, Ziehen = frei um die Mitte (rastet alle 15° ein)
  const onRotateDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    rotating.current = { moved: false, startX: e.clientX, startY: e.clientY };
    onDragState(true);
  };
  const onRotateMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = rotating.current;
    const el = contentRef.current;
    if (!r || !el) return;
    if (!r.moved && Math.hypot(e.clientX - r.startX, e.clientY - r.startY) < 4) return;
    r.moved = true;
    const box = el.getBoundingClientRect(); // Mittelpunkt bleibt bei Rotation gleich
    const angle = (Math.atan2(e.clientY - (box.top + box.height / 2), e.clientX - (box.left + box.width / 2)) * 180) / Math.PI;
    // Der Handle sitzt oben rechts: seine Ruhelage liegt bei -atan(h/w)
    const offset = (Math.atan2(text.height, text.width) * 180) / Math.PI;
    updateText(text.id, { rotation: (((Math.round((angle + offset) / ROTATE_STEP) * ROTATE_STEP) % 360) + 360) % 360 });
  };
  const onRotateUp = () => {
    if (rotating.current && !rotating.current.moved) updateText(text.id, { rotation: (rotation + ROTATE_STEP) % 360 });
    rotating.current = null;
    onDragState(false);
  };

  const shownContent = editing ? draft : text.content;
  const fontSize = fitFontSize(shownContent || "Text", text.width, text.height, font.scale);
  const style: React.CSSProperties = {
    fontFamily: font.css,
    fontWeight: font.weight,
    fontSize,
    color: text.color,
    lineHeight: 1,
    // Lesbarkeit auf dunklem und hellem Hintergrund
    textShadow: text.color === "#0a0a0a" ? "0 0 8px rgba(255,255,255,0.45)" : "0 1px 8px rgba(0,0,0,0.55)",
  };

  return (
    <Rnd
      size={{ width: text.width, height: text.height }}
      position={{ x: text.x, y: text.y }}
      bounds="parent"
      minWidth={60}
      minHeight={28}
      disableDragging={editing}
      cancel=".no-drag"
      enableResizing={selected && !editing ? RESIZE_ON : false}
      resizeHandleStyles={handleStyles}
      resizeHandleComponent={{ topLeft: <Dot />, bottomLeft: <Dot />, bottomRight: <Dot /> }}
      onDragStart={() => {
        onSelect();
        bringTextToFront(text.id);
        onDragState(true);
      }}
      onDragStop={(_e, d) => {
        updateText(text.id, { x: d.x, y: d.y });
        onDragState(false);
      }}
      onResizeStart={() => {
        onSelect();
        onDragState(true);
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        updateText(text.id, { width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y });
        onDragState(false);
      }}
      style={{ zIndex, touchAction: "none" }}
    >
      <div
        ref={contentRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          // Doppel-Klick / Doppel-Tipp -> bearbeiten (funktioniert auch auf Touch)
          const now = Date.now();
          if (now - lastTap.current < 350) onStartEdit();
          lastTap.current = now;
        }}
        className={cn(
          "relative flex h-full w-full select-none items-center justify-center rounded-lg border border-dashed px-1",
          editing ? "cursor-text" : "cursor-grab active:cursor-grabbing",
          selected ? "border-accent/80 bg-black/10" : "border-transparent",
        )}
        style={{ transform: `rotate(${rotation}deg)`, transition: "transform 150ms ease-out" }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onFinishEdit(draft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(text.content);
                onFinishEdit(text.content);
              }
            }}
            maxLength={40}
            placeholder={t("text_placeholder")}
            aria-label={t("text_edit")}
            className="no-drag w-full bg-transparent text-center outline-none placeholder:text-white/30"
            style={style}
          />
        ) : (
          <span className="whitespace-nowrap" style={style}>
            {text.content}
          </span>
        )}

        {selected && !editing && (
          <button
            aria-label={t("rotate")}
            className="no-drag absolute -right-3 -top-3 grid h-7 w-7 cursor-grab touch-none place-items-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-accent"
            onPointerDown={onRotateDown}
            onPointerMove={onRotateMove}
            onPointerUp={onRotateUp}
            onPointerCancel={onRotateUp}
            onClick={(e) => e.stopPropagation()}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Rnd>
  );
}
