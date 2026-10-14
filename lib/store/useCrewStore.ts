import { STORAGE } from "@/lib/storage-keys";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FRIEND_ITEMS, SEED_POSTS } from "@/lib/mock/crew";
import * as cloud from "@/lib/supabase-crews";
import { toast } from "@/lib/store/useToastStore";
import { translate } from "@/lib/i18n/translate";
import { uid } from "@/lib/mock/wardrobe";
import { notify } from "@/lib/store/useNotificationStore";
import { likeKey, useSocialStore } from "@/lib/store/useSocialStore";
import type { Crew, FitComment, FitLayer, FitPost, Person, ReactionType } from "@/types";

type WardrobeView = "mine" | "crew";
export type CrewTab = "fits" | "items" | "public";

interface CrewState {
  /** Aus Supabase geladen (nicht lokal gespeichert) */
  crews: Crew[];
  /** Mitglieder mit Profildaten je Crew-ID */
  members: Record<string, Person[]>;
  /** true, sobald die Crews einmal geladen wurden (verhindert kurzes Aufblitzen des Leerzustands) */
  crewsLoaded: boolean;
  activeCrewId: string | null;
  posts: FitPost[];
  /** UI-Zustand (nicht persistiert): welcher Wardrobe-Tab / Crew-Unterbereich ist offen */
  wardrobeView: WardrobeView;
  crewTab: CrewTab;
  setWardrobeView: (v: WardrobeView) => void;
  setCrewTab: (t: CrewTab) => void;
  loadCrews: () => Promise<void>;
  /** Setzt den Cloud-Zustand zurück (Abmelden / Kontowechsel) */
  resetCloud: () => void;
  createCrew: (name: string) => Promise<Crew | null>;
  joinCrew: (code: string) => Promise<cloud.JoinResult>;
  leaveCrew: (crewId: string) => Promise<boolean>;
  setActiveCrew: (id: string) => void;
  /** crewId = null: Fit wird nur öffentlich gepostet (Public Inspo), ohne Crew */
  sendFit: (input: { crewId: string | null; layers: FitLayer[]; caption: string; isPublic?: boolean }) => string;
  togglePublic: (postId: string) => void;
  toggleReaction: (postId: string, type: ReactionType, userId?: string) => void;
  addComment: (postId: string, c: Omit<FitComment, "id" | "createdAt">) => void;
  clearAll: () => void;
}


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
      crews: [],
      members: {},
      crewsLoaded: false,
      activeCrewId: null,
      posts: SEED_POSTS,
      wardrobeView: "mine",
      crewTab: "fits",
      setWardrobeView: (wardrobeView) => set({ wardrobeView }),
      setCrewTab: (crewTab) => set({ crewTab }),

      loadCrews: async () => {
        try {
          const crews = await cloud.getCrews();
          const memberLists = await Promise.all(crews.map((c) => cloud.getCrewMembers(c.id)));
          const members = Object.fromEntries(crews.map((c, i) => [c.id, memberLists[i]]));
          set((s) => ({
            crews,
            members,
            crewsLoaded: true,
            activeCrewId: crews.some((c) => c.id === s.activeCrewId) ? s.activeCrewId : crews[0]?.id ?? null,
          }));
        } catch (e) {
          console.error("Crews laden fehlgeschlagen:", e);
          set({ crewsLoaded: true });
          toast(translate("crew_errLoad"), undefined, "error");
        }
      },

      resetCloud: () => set({ crews: [], members: {}, crewsLoaded: false, activeCrewId: null }),

      createCrew: async (name) => {
        try {
          const crew = await cloud.createCrew(name);
          await get().loadCrews();
          set({ activeCrewId: crew.id });
          toast(translate("crew_createdToast", { name: crew.name }));
          return crew;
        } catch (e) {
          console.error("Crew erstellen fehlgeschlagen:", e);
          toast(translate("crew_errCreate"), undefined, "error");
          return null;
        }
      },

      joinCrew: async (code) => {
        const result = await cloud.joinCrew(code);
        if (result.ok) {
          await get().loadCrews();
          set({ activeCrewId: result.crewId });
          toast(translate("crew_joinedToast"));
        }
        return result;
      },

      leaveCrew: async (crewId) => {
        try {
          await cloud.leaveCrew(crewId);
          await get().loadCrews();
          toast(translate("crew_leftToast"));
          return true;
        } catch (e) {
          console.error("Crew verlassen fehlgeschlagen:", e);
          toast(translate("crew_errLeave"), undefined, "error");
          return false;
        }
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
          get().addComment(post.id, { authorId: "f-mila", kind: "comment", text: translate("reply_comment") });
          notify("comment", translate("notif_comment", { name: "Mila" }), "/wardrobe");
        }, 4500);
        setTimeout(() => {
          get().toggleReaction(post.id, "fire", "f-jonas");
          notify("reaction", translate("notif_reaction", { name: "Jonas" }), "/wardrobe");
        }, 2500);
        setTimeout(() => {
          const target = layers[0];
          if (!target) return;
          const offered =
            FRIEND_ITEMS.find((i) => i.visibility.sharedWithCrew && i.category === target.category && i.ownerId === "f-lea") ??
            FRIEND_ITEMS.find((i) => i.visibility.sharedWithCrew && i.category === target.category);
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

      // Crews liegen in der Cloud und bleiben unberührt; gelöscht werden nur die lokalen Posts
      clearAll: () => set({ posts: [] }),

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
      version: 3,
      // v2: neue Seed-Posts mit echten Kleidungsfotos; v3: Crews kommen aus Supabase (alte lokale Crews verwerfen)
      migrate: (persisted, version) => {
        const s = persisted as { posts?: FitPost[] };
        const posts =
          version < 2 ? [...(s.posts ?? []).filter((p) => !p.id.startsWith("seed-")), ...SEED_POSTS] : s.posts ?? SEED_POSTS;
        return { posts, activeCrewId: null } as unknown as CrewState;
      },
      partialize: (s) => ({ activeCrewId: s.activeCrewId, posts: s.posts }),
    },
  ),
);
