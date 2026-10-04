"use client";

import { useRef } from "react";
import { Rnd } from "react-rnd";
import { RotateCw, X } from "lucide-react";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { ASPECT, GRID, MAX_SIZE, MIN_SIZE, ROTATE_STEP, itemHeight, snapToCanvas } from "@/lib/lab";
import { useLabStore, type CanvasItem } from "@/lib/store/useLabStore";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/types";

interface Props {
  canvasItem: CanvasItem;
  item: WardrobeItem;
  zIndex: number;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Touch-Ziele: Ecken 28x28, Kanten 24px breit (je zur Hälfte außerhalb) – deutlich über 20x20.
 * Oben links (Löschen) und oben rechts (Drehen) sind bewusst keine Resize-Ecken.
 */
const EDGE = 24;
const CORNER = 28;
const handleStyles = {
  top: { width: `calc(100% - ${CORNER * 2}px)`, height: EDGE, left: CORNER, top: -EDGE / 2 },
  bottom: { width: `calc(100% - ${CORNER * 2}px)`, height: EDGE, left: CORNER, bottom: -EDGE / 2 },
  left: { height: `calc(100% - ${CORNER * 2}px)`, width: EDGE, top: CORNER, left: -EDGE / 2 },
  right: { height: `calc(100% - ${CORNER * 2}px)`, width: EDGE, top: CORNER, right: -EDGE / 2 },
  bottomLeft: { width: CORNER, height: CORNER, left: -CORNER / 2, bottom: -CORNER / 2 },
  bottomRight: { width: CORNER, height: CORNER, right: -CORNER / 2, bottom: -CORNER / 2 },
};

const ENABLED = {
  top: true,
  right: true,
  bottom: true,
  left: true,
  bottomLeft: true,
  bottomRight: true,
  topLeft: false,
  topRight: false,
};

const Dot = () => (
  <span className="grid h-full w-full place-items-center">
    <span className="h-3.5 w-3.5 rounded-full border-2 border-accent bg-white shadow" />
  </span>
);

const toolBtn =
  "no-drag grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-accent";

export function DraggableItem({ canvasItem, item, zIndex, selected, onSelect }: Props) {
  const { t } = useTranslation();
  const { updateItemPosition, updateItemBox, rotateItem, setRotation, removeItemFromCanvas, bringToFront } =
    useLabStore.getState();
  const { id, x, y, rotation, size } = canvasItem;
  // Freigestellte Teile zeigen ihre echte Form: kein Kasten, nur das Bild mit weichem Schatten
  const cutout = !!item.hasTransparentBackground;
  const contentRef = useRef<HTMLDivElement>(null);
  const rotating = useRef<{ moved: boolean; startX: number; startY: number } | null>(null);

  const select = () => {
    onSelect();
    bringToFront(id);
  };

  // Rotate-Handle: Tippen = +15°, Ziehen = frei um die Mitte drehen (rastet alle 15° ein)
  const onRotateDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    rotating.current = { moved: false, startX: e.clientX, startY: e.clientY };
  };
  const onRotateMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = rotating.current;
    const el = contentRef.current;
    if (!r || !el) return;
    if (!r.moved && Math.hypot(e.clientX - r.startX, e.clientY - r.startY) < 4) return;
    r.moved = true;
    const box = el.getBoundingClientRect(); // Mittelpunkt bleibt bei Rotation gleich
    const angle = (Math.atan2(e.clientY - (box.top + box.height / 2), e.clientX - (box.left + box.width / 2)) * 180) / Math.PI;
    // Handle sitzt oben rechts: seine Ruhelage liegt bei -atan(h/w) relativ zur Mitte
    const offset = (Math.atan2(1, ASPECT) * 180) / Math.PI;
    setRotation(id, Math.round((angle + offset) / ROTATE_STEP) * ROTATE_STEP);
  };
  const onRotateUp = () => {
    if (rotating.current && !rotating.current.moved) rotateItem(id, ROTATE_STEP);
    rotating.current = null;
  };

  return (
    <Rnd
      size={{ width: size, height: itemHeight(size) }}
      position={{ x, y }}
      bounds="parent"
      lockAspectRatio={ASPECT}
      minWidth={MIN_SIZE}
      maxWidth={MAX_SIZE}
      dragGrid={[GRID, GRID]}
      cancel=".no-drag"
      enableResizing={selected ? ENABLED : false}
      resizeHandleStyles={handleStyles}
      resizeHandleComponent={{ bottomLeft: <Dot />, bottomRight: <Dot /> }}
      onDragStart={select}
      onResizeStart={select}
      onDragStop={(_e, d) => {
        updateItemPosition(id, { x: d.x, y: d.y });
        playSound("whoosh"); // Item rastet ins Raster ein
        haptic("light");
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        const parent = ref.parentElement;
        const w = Math.round(ref.offsetWidth / GRID) * GRID;
        const s = Math.min(MAX_SIZE, Math.max(MIN_SIZE, w));
        const snapped = snapToCanvas(pos.x, pos.y, s, parent?.offsetWidth ?? 9999, parent?.offsetHeight ?? 9999);
        updateItemBox(id, { size: s, ...snapped });
      }}
      className="group"
      style={{ zIndex, touchAction: "none" }}
    >
      <div
        ref={contentRef}
        onClick={(e) => {
          e.stopPropagation();
          select();
        }}
        className="relative h-full w-full cursor-grab select-none active:cursor-grabbing"
        style={{ transform: `rotate(${rotation}deg)`, transition: "transform 150ms ease-out" }}
      >
        <div
          className={cn(
            "absolute inset-0",
            cutout
              ? cn("rounded-lg border border-dashed", selected ? "border-accent/80" : "border-transparent")
              : cn("overflow-hidden rounded-xl border bg-surface shadow-xl", selected ? "border-accent ring-2 ring-accent/60" : "border-white/15"),
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.name}
            draggable={false}
            className={cn("pointer-events-none h-full w-full", cutout ? "object-contain" : "object-cover")}
            style={cutout ? { filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" } : undefined}
          />
          <div
            data-export-hide
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 space-y-1 p-1.5",
              !cutout && "bg-gradient-to-t from-black/85 to-transparent pt-7",
              cutout && !selected && "hidden",
            )}
          >
            <p className="truncate text-[11px] font-medium">{item.name}</p>
            <div
              className={cn(
                "hidden flex-wrap gap-1 group-hover:flex",
                selected && "flex",
              )}
            >
              {item.tags.map((t) => (
                <Badge key={t.id} className="px-1.5 py-0 text-[9px]">
                  {t.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "transition-opacity",
            // Touch: nur bei Auswahl (kein versehentliches Löschen); Desktop: auch bei Hover
            selected
              ? "opacity-100"
              : "pointer-events-none opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100",
          )}
        >
          <button
            aria-label={t("remove")}
            className={cn(toolBtn, "absolute left-1 top-1")}
            onClick={(e) => {
              e.stopPropagation();
              removeItemFromCanvas(id);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label={t("rotate")}
            className={cn(toolBtn, "absolute right-1 top-1 touch-none cursor-grab")}
            onPointerDown={onRotateDown}
            onPointerMove={onRotateMove}
            onPointerUp={onRotateUp}
            onPointerCancel={onRotateUp}
            onClick={(e) => e.stopPropagation()}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Rnd>
  );
}
