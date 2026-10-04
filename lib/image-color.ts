import { colorFromLabel, colorLabel } from "@/lib/colors";
import type { ItemColor } from "@/types";

/** RGB (0–255) -> eine der App-Farben. Regeln nach Helligkeit, Sättigung und Farbton (HSL). */
export function classifyRgb(r: number, g: number, b: number): ItemColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h = (h * 60 + 360) % 360;
  }

  if (l < 0.14) return "black";
  if (l > 0.9 && s < 0.25) return "white";
  if (s < 0.12) return l < 0.3 ? "black" : l > 0.82 ? "white" : "gray";
  if (h >= 20 && h < 50 && l < 0.38) return "brown";
  if (h >= 20 && h < 55 && s < 0.4 && l > 0.6) return "beige";
  if (h < 15 || h >= 345) return l > 0.75 ? "pink" : "red";
  if (h < 40) return "orange";
  if (h < 65) return "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

/**
 * Dominante Farbe eines Bildes: Mitte (60 %) auf 48×48 verkleinern, jeden Pixel einer App-Farbe zuordnen,
 * häufigste gewinnt. Der Rand bleibt außen vor, weil dort meist Hintergrund ist. null, wenn das Bild nicht lesbar ist.
 */
export function detectDominantColor(src: string): Promise<ItemColor | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        // Mittelbereich ausschneiden
        const cw = img.width * 0.6;
        const ch = img.height * 0.6;
        ctx.drawImage(img, (img.width - cw) / 2, (img.height - ch) / 2, cw, ch, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const counts = new Map<ItemColor, number>();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; // transparent
          const c = classifyRgb(data[i], data[i + 1], data[i + 2]);
          counts.set(c, (counts.get(c) ?? 0) + 1);
        }
        const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
        resolve(top ? top[0] : null);
      } catch {
        resolve(null); // z.B. CORS blockiert das Auslesen
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Hängt die Farbe an den Titel, außer er nennt schon eine ("Schwarze Jeans" bleibt so). */
export function withColorName(name: string, color: ItemColor): string {
  return colorFromLabel(name) ? name : `${name} – ${colorLabel(color)}`;
}
