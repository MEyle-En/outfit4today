"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { categoryArt } from "@/lib/mock-data";
import type { ItemCategory, ItemColor } from "@/types";

/** Rahmen-Klassen für Kacheln: freigestellte Teile bekommen keinen Kasten (Rahmen bleibt unsichtbar, damit sich nichts verschiebt). */
export const frameClass = (transparent?: boolean, box = "border border-white/10 bg-surface") =>
  transparent ? "border border-transparent" : box;

/**
 * Einheitliches Bild für Kleidungsstücke. Freigestellte Teile (hasTransparentBackground) zeigen ihre echte Form:
 * object-contain, weicher Schatten, kein Hintergrund. Alle anderen füllen die Kachel wie bisher (object-cover).
 * Größe und Rundung bestimmt der Aufrufer über className.
 */
export function ItemImage({
  src,
  alt = "",
  transparent,
  className,
  loading,
  draggable,
  style,
  category,
  color,
}: {
  src: string;
  alt?: string;
  transparent?: boolean;
  className?: string;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  style?: React.CSSProperties;
  /** Für das Ersatzbild, falls das Foto nicht lädt */
  category?: ItemCategory;
  color?: ItemColor;
}) {
  // Lädt das Foto nicht (gelöscht, offline, kaputte URL), zeigen wir ein neutrales Symbolbild statt des Alt-Texts
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed || !src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={categoryArt(category ?? "top", color)} alt={alt} draggable={draggable} className={cn("object-cover", className)} style={style} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      draggable={draggable}
      onError={() => setFailed(true)}
      className={cn(transparent ? "bg-transparent object-contain" : "object-cover", className)}
      style={transparent ? { filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))", ...style } : style}
    />
  );
}
