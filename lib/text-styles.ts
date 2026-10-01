export type TextFont = "clash" | "inter" | "hand";

export const TEXT_FONTS: { id: TextFont; label: string; css: string; weight: number; /** Skalierung, weil Handschrift optisch kleiner wirkt */ scale: number }[] = [
  { id: "clash", label: "Clash", css: "var(--font-clash), var(--font-inter), system-ui, sans-serif", weight: 700, scale: 1 },
  { id: "inter", label: "Inter", css: "var(--font-inter), system-ui, sans-serif", weight: 600, scale: 1 },
  { id: "hand", label: "Caveat", css: "var(--font-hand), cursive", weight: 700, scale: 1.25 },
];

export const TEXT_COLORS: { id: string; label: string; hex: string }[] = [
  { id: "white", label: "Weiß", hex: "#ffffff" },
  { id: "black", label: "Schwarz", hex: "#0a0a0a" },
  { id: "lavender", label: "Lavender", hex: "#a855f7" },
  { id: "neon", label: "Neon-Gelb", hex: "#f5ff3d" },
  { id: "red", label: "Rot", hex: "#ef4444" },
  { id: "pink", label: "Pink", hex: "#f472b6" },
];

export const fontById = (id: TextFont) => TEXT_FONTS.find((f) => f.id === id) ?? TEXT_FONTS[0];

/** Einzeiliger Text passt sich der Box an: begrenzt durch Höhe und Breite (Zeichenbreite ≈ 0,52 em). */
export function fitFontSize(content: string, width: number, height: number, scale: number) {
  const byHeight = height * 0.72;
  const byWidth = width / (Math.max(content.length, 3) * 0.52);
  return Math.max(10, Math.round(Math.min(byHeight, byWidth) * scale));
}
