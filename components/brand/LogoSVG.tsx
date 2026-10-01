// Outfit4Today Logo: ein Kleiderschrank mit drei Fächern – Hose (Lila), Kleid/Top (Orange), Jacke (Weiß)
// auf Dunkel, umrahmt von einem pinken Glow. Reines SVG ohne Filter, damit es auch in next/og (Icons) rendert.
// Die Komponente hat keine Hooks und läuft deshalb im Browser und auf dem Server.

export const LOGO_COLORS = {
  bg: "#09090b",
  pants: "#a855f7",
  dress: "#f97316",
  jacket: "#ffffff",
  glow: "#ec4899",
} as const;

export function LogoSVG({ size = 40, id = "o4t-logo", title }: { size?: number; id?: string; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 192 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* Pinker Schein außen herum: radialer Verlauf statt Blur-Filter */}
        <radialGradient id={`${id}-glow`} cx="96" cy="96" r="96" gradientUnits="userSpaceOnUse">
          <stop offset="0.62" stopColor={LOGO_COLORS.glow} stopOpacity="0.55" />
          <stop offset="0.82" stopColor={LOGO_COLORS.glow} stopOpacity="0.22" />
          <stop offset="1" stopColor={LOGO_COLORS.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="96" cy="96" r="96" fill={`url(#${id}-glow)`} />

      {/* Schrank */}
      <rect x="20" y="20" width="152" height="152" rx="34" fill={LOGO_COLORS.bg} stroke={LOGO_COLORS.glow} strokeOpacity="0.75" strokeWidth="2.5" />
      {/* Trennwände der drei Fächer */}
      <path d="M70.7 34 V158 M121.3 34 V158" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="2" strokeLinecap="round" />

      {/* Links: Hose (Lila) */}
      <path d="M30 56 H62 L65 142 H51 L46 84 L41 142 H27 Z" fill={LOGO_COLORS.pants} />
      <path d="M30 56 H62" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />

      {/* Mitte: Kleid (Orange) */}
      <path d="M84 50 L90 50 Q96 62 102 50 L108 50 L112 70 L104 86 L116 142 H76 L88 86 L80 70 Z" fill={LOGO_COLORS.dress} />

      {/* Rechts: Jacke (Weiß) mit Reißverschluss */}
      <path d="M134 56 L143 50 H151 L160 56 L167 92 L159 94 L157 78 V142 H137 V78 L135 94 L127 92 Z" fill={LOGO_COLORS.jacket} />
      <path d="M147 52 V142" stroke={LOGO_COLORS.bg} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
