import type { InspoPost, StylePrefs } from "@/types";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/800`;

export const INSPO_POSTS: InspoPost[] = [
  { id: "1", user: { name: "Mila", handle: "mila.wears", gradient: "from-purple-500 to-pink-500" }, image: img("fit-street-1"), vibe: "streetwear", colors: ["mono", "neon"], icons: ["hoodie", "sneakers"], caption: "Cargo + Oversized Hoodie. Nie wieder was anderes 🖤", likes: 2431, comments: 87, tags: ["Cargo", "Hoodie", "AF1"] },
  { id: "2", user: { name: "Jonas", handle: "jonas.fits", gradient: "from-emerald-400 to-cyan-500" }, image: img("fit-gorp-2"), vibe: "gorpcore", colors: ["forest", "earth"], icons: ["cap", "sneakers"], caption: "Shell Jacket auch bei 20°C. Don't ask.", likes: 1287, comments: 42, tags: ["Shell", "Trail Runner"] },
  { id: "3", user: { name: "Lea", handle: "lea.y2k", gradient: "from-pink-500 to-fuchsia-600" }, image: img("fit-y2k-3"), vibe: "y2k", colors: ["pastel", "neon"], icons: ["shades", "jewelry"], caption: "Baby Tee + Low Rise = 2003 reborn 💿", likes: 3902, comments: 214, tags: ["Baby Tee", "Low Rise", "Shades"] },
  { id: "4", user: { name: "Noah", handle: "noah.minimal", gradient: "from-zinc-300 to-zinc-500" }, image: img("fit-minimal-4"), vibe: "minimal", colors: ["mono"], icons: ["watch"], caption: "Drei Farben. Ein Fit. Fertig.", likes: 987, comments: 19, tags: ["Trench", "Wide Leg"] },
  { id: "5", user: { name: "Ava", handle: "ava.vintage", gradient: "from-amber-400 to-orange-600" }, image: img("fit-vintage-5"), vibe: "vintage", colors: ["earth", "denim"], icons: ["watch", "jewelry"], caption: "Thrift Haul Fit – alles unter 30€ 📼", likes: 1764, comments: 63, tags: ["Thrift", "Denim Jacket"] },
  { id: "6", user: { name: "Elias", handle: "elias.acad", gradient: "from-stone-400 to-stone-700" }, image: img("fit-acad-6"), vibe: "dark-academia", colors: ["earth", "forest"], icons: ["watch"], caption: "Blazer, Strickweste, Bibliothek. Mood.", likes: 1120, comments: 31, tags: ["Blazer", "Knit Vest"] },
  { id: "7", user: { name: "Zoe", handle: "zoe.drip", gradient: "from-violet-500 to-indigo-600" }, image: img("fit-street-7"), vibe: "streetwear", colors: ["neon", "denim"], icons: ["hoodie", "cap"], caption: "Baggy Denim + Cap. Simple, aber clean.", likes: 2210, comments: 96, tags: ["Baggy Jeans", "Cap"] },
];

export interface ScoredPost {
  post: InspoPost;
  /** 0–100 */
  match: number;
}

/** Sortiert den Feed nach Match-Score zu den gespeicherten Präferenzen. */
export function personalizeFeed(prefs: StylePrefs): ScoredPost[] {
  const raw = (p: InspoPost) =>
    (prefs.vibes.includes(p.vibe) ? 3 : 0) +
    p.colors.filter((c) => prefs.colors.includes(c)).length +
    p.icons.filter((i) => prefs.icons.includes(i)).length;
  const MAX = 3 + 2 + 2;
  return INSPO_POSTS.map((post) => ({ post, match: Math.round((raw(post) / MAX) * 100) })).sort(
    (a, b) => b.match - a.match,
  );
}
