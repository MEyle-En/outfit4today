import { LogoSVG, LOGO_COLORS } from "@/components/brand/LogoSVG";

export const BRAND_NAME = "Outfit4Today";
export const BRAND_TAGLINE = "Digital Wardrobe & AI Stylist";

/**
 * App-Icon für PNG-Generierung (next/og) – Basis ist das SVG-Logo.
 * `maskable` = randlos mit Safe-Zone (Logo verkleinert, damit Android es beliebig zuschneiden kann).
 */
export function AppIcon({ size, maskable = false }: { size: number; maskable?: boolean }) {
  if (!maskable) return <LogoSVG size={size} />;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: LOGO_COLORS.bg,
      }}
    >
      <LogoSVG size={Math.round(size * 0.8)} />
    </div>
  );
}
