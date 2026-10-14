import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translate } from "@/lib/i18n/translate";
import { getLikeCounts, getMyLikes, toggleLike } from "@/lib/supabase-social";
import { toast } from "@/lib/store/useToastStore";

interface SocialState {
  /** Marktplatz-Likes (noch lokal/Mock): "listing:m-3" */
  liked: Record<string, true>;
  bonus: Record<string, number>;
  toggleLike: (key: string) => void;
  addBonus: (key: string, n?: number) => void;

  /** Likes auf Posts aus Supabase (nicht lokal gespeichert), Schlüssel = Post-ID */
  cloudCounts: Record<string, number>;
  cloudLiked: Record<string, boolean>;
  loadPostLikes: (postIds: string[]) => Promise<void>;
  /** Optimistisch umschalten, bei Fehler zurückrollen */
  toggleCloudLike: (postId: string) => Promise<void>;
}

export const likeKey = {
  post: (id: string) => `post:${id}`,
  listing: (id: string) => `listing:${id}`,
};

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
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

      cloudCounts: {},
      cloudLiked: {},
      loadPostLikes: async (postIds) => {
        if (postIds.length === 0) return;
        try {
          const [counts, mine] = await Promise.all([getLikeCounts(postIds), getMyLikes(postIds)]);
          set((s) => ({
            cloudCounts: { ...s.cloudCounts, ...Object.fromEntries(postIds.map((id) => [id, counts[id] ?? 0])) },
            cloudLiked: { ...s.cloudLiked, ...Object.fromEntries(postIds.map((id) => [id, mine.includes(id)])) },
          }));
        } catch (e) {
          console.error("Likes laden fehlgeschlagen:", e);
        }
      },
      toggleCloudLike: async (postId) => {
        const wasLiked = !!get().cloudLiked[postId];
        const before = get().cloudCounts[postId] ?? 0;
        const delta = wasLiked ? -1 : 1;
        set((s) => ({
          cloudLiked: { ...s.cloudLiked, [postId]: !wasLiked },
          cloudCounts: { ...s.cloudCounts, [postId]: Math.max(0, before + delta) },
        }));
        try {
          const nowLiked = await toggleLike("post", postId);
          if (nowLiked === wasLiked) {
            // Server war anderer Meinung (z. B. zweites Gerät): auf den echten Stand korrigieren
            await get().loadPostLikes([postId]);
          }
        } catch (e) {
          console.error("Like fehlgeschlagen:", e);
          set((s) => ({
            cloudLiked: { ...s.cloudLiked, [postId]: wasLiked },
            cloudCounts: { ...s.cloudCounts, [postId]: before },
          }));
          toast(translate("social_errAction"), undefined, "error");
        }
      },
    }),
    { name: "outfit4today-social", partialize: (s) => ({ liked: s.liked, bonus: s.bonus }) },
  ),
);

/** Stabile Mock-Grundzahl je Marktplatz-Objekt (10–100), eigene Objekte starten bei 0. Für Posts gibt es sie nicht mehr. */
export function baseLikes(key: string, mine: boolean) {
  if (mine) return 0;
  let h = 7;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
  return 10 + (h % 91);
}

/** Posts: echte Zahlen aus Supabase. Marktplatz (noch Mock): lokale Zahlen. */
export function useLikes(key: string, mine = false) {
  const isPost = key.startsWith("post:");
  const postId = key.slice(5);
  const localLiked = useSocialStore((s) => !!s.liked[key]);
  const bonus = useSocialStore((s) => s.bonus[key] ?? 0);
  const toggleLocal = useSocialStore((s) => s.toggleLike);
  const cloudLiked = useSocialStore((s) => !!s.cloudLiked[postId]);
  const cloudCount = useSocialStore((s) => s.cloudCounts[postId] ?? 0);
  const toggleCloud = useSocialStore((s) => s.toggleCloudLike);

  if (isPost) return { liked: cloudLiked, count: cloudCount, toggle: () => void toggleCloud(postId) };
  return { liked: localLiked, count: baseLikes(key, mine) + bonus + (localLiked ? 1 : 0), toggle: () => toggleLocal(key) };
}
