import { Footprints, Glasses, Gem, Shirt, Watch, Crown, type LucideIcon } from "lucide-react";

export interface QuizOption {
  id: string;
  label: string;
  gradient: string;
  emoji?: string;
  icon?: LucideIcon;
  swatches?: string[];
}

export interface QuizStep {
  id: "vibes" | "colors" | "icons";
  title: string;
  subtitle: string;
  max: number;
  options: QuizOption[];
}

export const QUIZ_STEPS: QuizStep[] = [
  {
    id: "vibes",
    title: "Wähle deinen Vibe",
    subtitle: "Bis zu 2 – was fühlt sich nach dir an?",
    max: 2,
    options: [
      { id: "streetwear", label: "Streetwear", emoji: "🛹", gradient: "from-purple-600/40 to-zinc-900" },
      { id: "y2k", label: "Y2K", emoji: "💿", gradient: "from-pink-500/40 to-violet-900/40" },
      { id: "minimal", label: "Minimal", emoji: "🤍", gradient: "from-zinc-400/30 to-zinc-900" },
      { id: "gorpcore", label: "Gorpcore", emoji: "🏔️", gradient: "from-emerald-600/30 to-zinc-900" },
      { id: "vintage", label: "Vintage", emoji: "📼", gradient: "from-amber-600/30 to-zinc-900" },
      { id: "dark-academia", label: "Dark Academia", emoji: "📚", gradient: "from-stone-500/30 to-zinc-900" },
    ],
  },
  {
    id: "colors",
    title: "Wähle deine Farben",
    subtitle: "Bis zu 3 Paletten, die du täglich tragen würdest",
    max: 3,
    options: [
      { id: "mono", label: "Monochrom", gradient: "from-zinc-700/40 to-zinc-900", swatches: ["#fafafa", "#71717a", "#09090b"] },
      { id: "earth", label: "Earth Tones", gradient: "from-amber-800/30 to-zinc-900", swatches: ["#a16207", "#78716c", "#d6d3d1"] },
      { id: "neon", label: "Neon Pop", gradient: "from-fuchsia-600/30 to-zinc-900", swatches: ["#a855f7", "#bef264", "#f472b6"] },
      { id: "pastel", label: "Pastell", gradient: "from-sky-400/25 to-zinc-900", swatches: ["#bae6fd", "#fbcfe8", "#ddd6fe"] },
      { id: "denim", label: "Denim & Navy", gradient: "from-blue-700/30 to-zinc-900", swatches: ["#1e3a8a", "#3b82f6", "#e2e8f0"] },
      { id: "forest", label: "Forest", gradient: "from-green-800/30 to-zinc-900", swatches: ["#14532d", "#4d7c0f", "#d9f99d"] },
    ],
  },
  {
    id: "icons",
    title: "Wähle deine Icons",
    subtitle: "Deine Must-have Pieces",
    max: 3,
    options: [
      { id: "hoodie", label: "Oversized Hoodie", icon: Shirt, gradient: "from-purple-600/30 to-zinc-900" },
      { id: "sneakers", label: "Sneakers", icon: Footprints, gradient: "from-violet-600/30 to-zinc-900" },
      { id: "shades", label: "Sonnenbrille", icon: Glasses, gradient: "from-fuchsia-600/30 to-zinc-900" },
      { id: "jewelry", label: "Statement Schmuck", icon: Gem, gradient: "from-indigo-600/30 to-zinc-900" },
      { id: "watch", label: "Vintage Watch", icon: Watch, gradient: "from-zinc-500/30 to-zinc-900" },
      { id: "cap", label: "Cap & Beanie", icon: Crown, gradient: "from-purple-500/30 to-zinc-900" },
    ],
  },
];
