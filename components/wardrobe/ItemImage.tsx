import { cn } from "@/lib/utils";

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
}: {
  src: string;
  alt?: string;
  transparent?: boolean;
  className?: string;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      draggable={draggable}
      className={cn(transparent ? "bg-transparent object-contain" : "object-cover", className)}
      style={transparent ? { filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))", ...style } : style}
    />
  );
}
