// Pro Vibe: Akzentfarbe, Verlauf (Tailwind-Klassen) und Header-Text.
// Die Klassen stehen hier in lib/ – tailwind.config.ts scannt deshalb auch ./lib.

export interface VibeTheme {
  name: string;
  accentColor: string;
  /** Tailwind-Gradient-Klassen, z.B. für Text (bg-clip-text) oder Flächen */
  gradient: string;
  headerText: string;
}

/** Schlüssel = Vibe-IDs aus dem Vibe Check (lib/mock/quiz.ts). */
export const vibeThemes: Record<string, VibeTheme> = {
  streetwear: {
    name: "Streetwear",
    accentColor: "#39FF14", // Neon-Grün
    gradient: "from-green-400 to-lime-600",
    headerText: "Fresh Streetwear Fits",
  },
  y2k: {
    name: "Y2K",
    accentColor: "#FF1493", // Hot Pink
    gradient: "from-pink-500 to-rose-600",
    headerText: "Y2K Vibes Only",
  },
  minimal: {
    name: "Minimalist",
    accentColor: "#D4C4B0", // Beige
    gradient: "from-stone-400 to-amber-600",
    headerText: "Less is More",
  },
  gorpcore: {
    name: "Gorpcore",
    accentColor: "#22D3EE", // Trail-Türkis
    gradient: "from-cyan-400 to-emerald-600",
    headerText: "Trail-Ready Fits",
  },
  vintage: {
    name: "Vintage",
    accentColor: "#F59E0B", // Bernstein
    gradient: "from-amber-400 to-orange-600",
    headerText: "Thrifted Treasures",
  },
  "dark-academia": {
    name: "Dark Academia",
    accentColor: "#C2A878", // Pergament-Gold
    gradient: "from-stone-500 to-yellow-800",
    headerText: "Books & Blazers",
  },
};

/** Standard, wenn (noch) kein Vibe gewählt ist: die Lavender-Marke. */
export const defaultVibeTheme: VibeTheme = {
  name: "Outfit4Today",
  accentColor: "#a855f7",
  gradient: "from-purple-400 to-fuchsia-500",
  headerText: "",
};

/** Theme des ersten gewählten Vibes (der Vibe Check erlaubt bis zu zwei). */
export function getVibeTheme(vibes: string[]): VibeTheme {
  const first = vibes.find((v) => vibeThemes[v]);
  return first ? vibeThemes[first] : defaultVibeTheme;
}
