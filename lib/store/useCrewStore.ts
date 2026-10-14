import { STORAGE } from "@/lib/storage-keys";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translate } from "@/lib/i18n/translate";
import * as cloud from "@/lib/supabase-crews";
import * as social from "@/lib/supabase-social";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAuthorsStore } from "@/lib/store/useAuthorsStore";
import { useSocialStore } from "@/lib/store/useSocialStore";
import { toast } from "@/lib/store/useToastStore";
import type { Crew, FitComment, FitLayer, FitPost, Person, ReactionType, SwapSuggestion } from "@/types";

type WardrobeView = "mine" | "crew";
export type CrewTab = "fits" | "items" | "public";

export type SendFitResult = { ok: true; id: string } | { ok: false; error: "pendingUpload" | "failed" };

interface CrewState {
  /** Aus Supabase geladen (nicht lokal gespeichert) */
  crews: Crew[];
  /** Mitglieder mit Profildaten je Crew-ID */
  members: Record<string, Person[]>;
  /** true, sobald die Crews einmal geladen wurden (verhindert kurzes Aufblitzen des Leerzustands) */
  crewsLoaded: boolean;
  activeCrewId: string | null;
  /** Posts aus Supabase (Crew-, öffentliche und eigene), nicht lokal gespeichert */
  posts: FitPost[];
  postsLoading: boolean;
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
  /** Posts einer Crew-ID, die öffentlichen ("public") oder meine ("mine") laden */
  loadPosts: (scope: social.PostScope) => Promise<void>;
  /** crewId = null: Fit wird nur öffentlich gepostet (Public Inspo), ohne Crew */
  sendFit: (input: { crewId: string | null; layers: FitLayer[]; caption: string; isPublic?: boolean }) => Promise<SendFitResult>;
  deletePost: (postId: string) => Promise<void>;
  togglePublic: (postId: string) => Promise<void>;
  toggleReaction: (postId: string, type: ReactionType) => Promise<void>;
  /** Eigenen Kommentar löschen (optimistisch, mit Rollback) */
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  addComment: (
    postId: string,
    c: { kind: "comment"; text: string } | { kind: "swap"; text: string; swap: SwapSuggestion },
  ) => Promise<boolean>;
  clearAll: () => void;
}

const meId = () => useAuthStore.getState().user?.id;

const patchPost = (posts: FitPost[], id: string, fn: (p: FitPost) => FitPost) => posts.map((p) => (p.id === id ? fn(p) : p));

/** Ersetzt die Posts des geladenen Bereichs durch den frischen Stand, andere Bereiche bleiben. */
function mergePosts(existing: FitPost[], incoming: FitPost[], scope: social.PostScope): FitPost[] {
  const me = meId();
  const inScope = (p: FitPost) => (scope === "public" ? !!p.isPublic : scope === "mine" ? p.authorId === me : p.crewId === scope);
  const kept = existing.filter((p) => !inScope(p) && !incoming.some((i) => i.id === p.id));
  return [...kept, ...incoming].sort((a, b) => b.createdAt - a.createdAt);
}

let lastErrorToast = 0;
const failToast = (key: Parameters<typeof translate>[0]) => {
  const now = Date.now();
  if (now - lastErrorToast < 4000) return;
  lastErrorToast = now;
  toast(translate(key), undefined, "error");
};

export const useCrewStore = create<CrewState>()(
  persist(
    (set, get) => ({
      crews: [],
      members: {},
      crewsLoaded: false,
      activeCrewId: null,
      posts: [],
      postsLoading: false,
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

      resetCloud: () => set({ crews: [], members: {}, crewsLoaded: false, activeCrewId: null, posts: [], postsLoading: false }),

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

      loadPosts: async (scope) => {
        set({ postsLoading: true });
        try {
          const { posts, profiles } = await social.getPosts(scope);
          useAuthorsStore.getState().add(profiles);
          set((s) => ({ posts: mergePosts(s.posts, posts, scope), postsLoading: false }));
          void useSocialStore.getState().loadPostLikes(posts.map((p) => p.id));
        } catch (e) {
          console.error("Posts laden fehlgeschlagen:", e);
          set({ postsLoading: false });
          failToast("social_errLoad");
        }
      },

      sendFit: async ({ crewId, layers, caption, isPublic }) => {
        const result = await social.createPost({ crewId, layers, caption, isPublic: crewId === null ? true : !!isPublic });
        if (!result.ok) return result;
        set((s) => ({ posts: [result.post, ...s.posts.filter((p) => p.id !== result.post.id)] }));
        void useSocialStore.getState().loadPostLikes([result.post.id]);
        return { ok: true, id: result.post.id };
      },

      deletePost: async (postId) => {
        const before = get().posts;
        set({ posts: before.filter((p) => p.id !== postId) });
        try {
          await social.deletePost(postId);
          toast(translate("post_deletedToast"));
        } catch (e) {
          console.error("Post löschen fehlgeschlagen:", e);
          set({ posts: before });
          failToast("social_errAction");
        }
      },

      togglePublic: async (postId) => {
        const post = get().posts.find((p) => p.id === postId);
        if (!post || post.crewId === null) return; // ohne Crew bleibt der Fit immer öffentlich
        const next = !post.isPublic;
        set((s) => ({ posts: patchPost(s.posts, postId, (p) => ({ ...p, isPublic: next })) }));
        try {
          await social.setPostPublic(postId, next);
        } catch (e) {
          console.error("Sichtbarkeit ändern fehlgeschlagen:", e);
          set((s) => ({ posts: patchPost(s.posts, postId, (p) => ({ ...p, isPublic: !next })) }));
          failToast("social_errAction");
        }
      },

      toggleReaction: async (postId, type) => {
        const me = meId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return;
        const had = post.reactions[type].includes(me);
        const apply = (on: boolean) =>
          set((s) => ({
            posts: patchPost(s.posts, postId, (p) => ({
              ...p,
              reactions: {
                ...p.reactions,
                [type]: on ? [...p.reactions[type].filter((u) => u !== me), me] : p.reactions[type].filter((u) => u !== me),
              },
            })),
          }));
        apply(!had); // optimistisch
        try {
          const on = await social.toggleReaction(postId, type);
          if (on === had) apply(on); // Server war anderer Meinung: Stand übernehmen
        } catch (e) {
          console.error("Reaktion fehlgeschlagen:", e);
          apply(had); // Rollback
          failToast("social_errAction");
        }
      },

      deleteComment: async (postId, commentId) => {
        const before = get().posts;
        set((s) => ({ posts: patchPost(s.posts, postId, (p) => ({ ...p, comments: p.comments.filter((c) => c.id !== commentId) })) }));
        try {
          await social.deleteComment(commentId);
          toast(translate("comment_deletedToast"));
        } catch (e) {
          console.error("Kommentar löschen fehlgeschlagen:", e);
          set({ posts: before });
          failToast("social_errAction");
        }
      },

      addComment: async (postId, c) => {
        try {
          const comment: FitComment =
            c.kind === "swap"
              ? await social.addSwapComment(postId, { text: c.text, swap: c.swap })
              : await social.addComment(postId, c.text);
          set((s) => ({ posts: patchPost(s.posts, postId, (p) => ({ ...p, comments: [...p.comments, comment] })) }));
          return true;
        } catch (e) {
          console.error("Kommentar fehlgeschlagen:", e);
          failToast("social_errAction");
          return false;
        }
      },

      // Crews und Posts liegen in der Cloud und bleiben unberührt
      clearAll: () => set({}),
    }),
    {
      name: STORAGE.crew,
      version: 4,
      // v3: Crews aus Supabase; v4: auch Posts aus Supabase (alte lokale Posts/Mock-Posts verwerfen)
      migrate: () => ({ activeCrewId: null }) as unknown as CrewState,
      partialize: (s) => ({ activeCrewId: s.activeCrewId }),
    },
  ),
);
