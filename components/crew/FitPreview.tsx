"use client";

import { useItemLookup } from "@/hooks/useItemLookup";
import { ItemImage } from "@/components/wardrobe/ItemImage";
import { GRID, itemHeight } from "@/lib/lab";
import type { FitLayer } from "@/types";

/** Rendert ein Outfit aus seinen Layern, zugeschnitten auf die belegte Fläche (alles in %). */
export function FitPreview({ layers }: { layers: FitLayer[] }) {
  const lookup = useItemLookup();
  if (!layers.length) return null;

  const pad = GRID;
  const minX = Math.min(...layers.map((l) => l.x)) - pad;
  const minY = Math.min(...layers.map((l) => l.y)) - pad;
  const maxX = Math.max(...layers.map((l) => l.x + l.size)) + pad;
  const maxY = Math.max(...layers.map((l) => l.y + itemHeight(l.size))) + pad;
  const w = maxX - minX;
  const h = maxY - minY;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-background/60"
      style={{
        aspectRatio: `${w} / ${h}`,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: `${GRID}px ${GRID}px`,
      }}
    >
      {layers.map((l, i) => {
        const item = lookup(l.itemId);
        return (
          <div
            key={`${l.itemId}-${i}`}
            className={
              item?.hasTransparentBackground
                ? "absolute"
                : "absolute overflow-hidden rounded-lg border border-white/15 bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-lg"
            }
            style={{
              left: `${((l.x - minX) / w) * 100}%`,
              top: `${((l.y - minY) / h) * 100}%`,
              width: `${(l.size / w) * 100}%`,
              aspectRatio: "4 / 5",
              transform: `rotate(${l.rotation}deg)`,
              zIndex: i + 1,
            }}
          >
            {item ? (
              // eslint-disable-next-line @next/next/no-img-element
              <ItemImage src={item.image} alt={l.name} transparent={item.hasTransparentBackground} className="h-full w-full" />
            ) : (
              <span className="grid h-full place-items-center p-1 text-center text-[9px] text-zinc-400">{l.name}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
