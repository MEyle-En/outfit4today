import { STORAGE } from "@/lib/storage-keys";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FRIEND_ITEMS, MOCK_FRIENDS, SEED_CREWS, SEED_POSTS } from "@/lib/mock/crew";
import { translate } from "@/lib/i18n/translate";
import { uid } from "@/lib/mock/wardrobe";
import { notify } from "@/lib/store/useNotificationStore";
import { likeKey, useSocialStore } from "@/lib/store/useSocialStore";
import type { Crew, FitComment, FitLayer, FitPost, ReactionType } from "@/types";

type WardrobeView = "mine" | "crew";
export type CrewTab = "fits" | "items" | "public";

interface CrewState {
  crews: Crew[];
  activeCrewId: string | null;
  posts: FitPost[];
  /** UI-Zustand (nicht persistiert): welcher Wardrobe-Tab / Crew-Unterbereich ist offen */
  wardrobeView: WardrobeView;
  crewTab: CrewTab;
  setWardrobeView: (v: WardrobeView) => void;
  setCrewTab: (t: CrewTab) => void;
  createCrew: (name: string) => Crew;
  setActiveCrew: (id: string) => void;
  /** crewId = null: Fit wird nur öffentlich gepostet (Public Inspo), ohne Crew */
  sendFit: (input: { crewId: string | null; layers: FitLayer[]; caption: string; isPublic?: boolean }) => string;
  togglePublic: (postId: string) => void;
  toggleReaction: (postId: string, type: ReactionType, userId?: string) => void;
  addComment: (postId: string, c: Omit<FitComment, "id" | "createdAt">) => void;
  clearAll: () => void;
}

export const inviteLink = (code: string) => `https://outfit4today.app/join/${code}`;

const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

/** Mock: andere liken meinen öffentlichen Fit (zeitversetzt) und lösen Benachrichtigungen aus. */
function simulatePublicLikes(postId: string, isStillPublic: () => boolean) {
  [
    [4000, "Jonas"],
    [9000, "Lea"],
  ].forEach(([delay, name]) => {
    setTimeout(() => {
      if (!isStillPublic()) return;
      useSocialStore.getState().addBonus(likeKey.post(postId), 1);
      notify("like", translate("notif_like", { name: String(name) }), "/wardrobe");
    }, delay as number);
  });
}

export const useCrewStore = create<CrewState>()(
  persist(
    (set, get) => ({
      crews: SEED_CREWS,
      activeCrewId: SEED_CREWS[0].id,
      posts: SEED_POSTS,
      wardrobeView: "mine",
      crewTab: "fits",
      setWardrobeView: (wardrobeView) => set({ wardrobeView }),
      setCrewTab: (crewTab) => set({ crewTab }),

      createCrew: (name) => {
        // Mock: Freunde "treten sofort bei", damit die Crew nicht leer ist
        const crew: Crew = {
          id: uid(),
          name: name.trim(),
          inviteCode: code(),
          memberIds: MOCK_FRIENDS.map((f) => f.id),
          createdAt: Date.now(),
        };
        set((s) => ({ crews: [...s.crews, crew], activeCrewId: crew.id }));
        return crew;
      },

      setActiveCrew: (activeCrewId) => set({ activeCrewId }),

      sendFit: ({ crewId, layers, caption, isPublic }) => {
        const post: FitPost = {
          id: uid(),
          crewId,
          authorId: "me",
          caption: caption.trim(),
          isPublic: crewId === null ? true : !!isPublic, // ohne Crew bleibt nur "öffentlich"
          layers,
          reactions: { fire: [], idea: [], want: [] },
          comments: [],
          createdAt: Date.now(),
        };
        set((s) => ({ posts: [post, ...s.posts] }));

        // Asynchrones Verhalten simulieren (Mock): Reaktion, Tauschvorschlag, Likes
        setTimeout(() => {
          get().toggleReaction(post.id, "fire", "f-jonas");
          notify("reaction", translate("notif_reaction", { name: "Jonas" }), "/wardrobe");
        }, 2500);
        setTimeout(() => {
          const target = layers[0];
          if (!target) return;
          const offered =
            FRIEND_ITEMS.find((i) => i.sharedWithCrew && i.category === target.category && i.ownerId === "f-lea") ??
            FRIEND_ITEMS.find((i) => i.sharedWithCrew && i.category === target.category);
          if (!offered) return;
          get().addComment(post.id, {
            authorId: offered.ownerId,
            kind: "swap",
            text: translate("swap_better", { name: offered.name }),
            swap: {
              offeredItemId: offered.id,
              offeredName: offered.name,
              targetItemId: target.itemId,
              targetName: target.name,
            },
          });
          notify(
            "swap",
            translate("notif_swap", { name: offered.ownerId === "f-lea" ? "Lea" : translate("notif_aFriend"), item: offered.name }),
            "/wardrobe",
          );
        }, 6000);
        if (post.isPublic) simulatePublicLikes(post.id, () => !!get().posts.find((p) => p.id === post.id)?.isPublic);

        return post.id;
      },

      clearAll: () => set({ crews: [], activeCrewId: null, posts: [] }),

      togglePublic: (postId) => {
        const post = get().posts.find((p) => p.id === postId);
        set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, isPublic: !p.isPublic } : p)) }));
        // Wird ein eigener Fit gerade öffentlich, kommen (simuliert) Likes
        if (post && post.authorId === "me" && !post.isPublic) {
          simulatePublicLikes(postId, () => !!get().posts.find((p) => p.id === postId)?.isPublic);
        }
      },

      toggleReaction: (postId, type, userId = "me") =>
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const has = p.reactions[type].includes(userId);
            return {
              ...p,
              reactions: {
                ...p.reactions,
                [type]: has ? p.reactions[type].filter((u) => u !== userId) : [...p.reactions[type], userId],
              },
            };
          }),
        })),

      addComment: (postId, c) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, { ...c, id: uid(), createdAt: Date.now() }] } : p,
          ),
        })),
    }),
    {
      name: STORAGE.crew,
      partialize: (s) => ({ crews: s.crews, activeCrewId: s.activeCrewId, posts: s.posts }),
    },
  ),
);
