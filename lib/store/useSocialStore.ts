import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SocialState {
  /** Von mir gelikte Dinge, Schlüssel z.B. "post:abc" oder "listing:m-3" */
  liked: Record<string, true>;
  /** Zusätzliche (simulierte) Likes anderer, z.B. auf meinen Public Fit */
  bonus: Record<string, number>;
  toggleLike: (key: string) => void;
  addBonus: (key: string, n?: number) => void;
}

export const likeKey = {
  post: (id: string) => `post:${id}`,
  listing: (id: string) => `listing:${id}`,
};

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      liked: {},
      bonus: {},
      toggleLike: (key) =>
        set((s) => {
          const liked = { ...s.liked };
          if (liked[key]) delete liked[key];
          else liked[key] = true;
          return { liked };
        }),
      addBonus: (key, n = 1) => set((s) => ({ bonus: { ...s.bonus, [key]: (s.bonus[key] ?? 0) + n } })),
    }),
    { name: "outfit4today-social" },
  ),
);

/** Stabile Mock-Grundzahl je Objekt (3–40), eigene Objekte starten bei 0. */
export function baseLikes(key: string, mine: boolean) {
  if (mine) return 0;
  let h = 7;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
  return 3 + (h % 38);
}

export function useLikes(key: string, mine = false) {
  const liked = useSocialStore((s) => !!s.liked[key]);
  const bonus = useSocialStore((s) => s.bonus[key] ?? 0);
  const toggle = useSocialStore((s) => s.toggleLike);
  return { liked, count: baseLikes(key, mine) + bonus + (liked ? 1 : 0), toggle: () => toggle(key) };
}
