import { supabase } from "@/lib/supabase";
import type { FitComment, FitLayer, FitPost, ItemCategory, ReactionType, SwapSuggestion } from "@/types";

/**
 * Posts, Kommentare, Reaktionen und Likes in Supabase
 * (Tabellen fit_posts, post_comments, reactions, likes; View like_counts; Zugriff regelt RLS).
 * Namen/Avatare der Autoren kommen aus `profiles` (fit_posts.author_id verweist auf auth.users, daher ohne SQL-Join: ein
 * zusätzlicher Abruf pro Seite).
 */

const POST_LIMIT = 40;

interface DbLayer {
  item_id: string;
  name: string;
  category: ItemCategory;
  image_url?: string;
  has_transparent_background?: boolean;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface DbSwap {
  offered_item_id: string;
  offered_name: string;
  target_item_id: string;
  target_name: string;
  offered_image?: string;
  offered_transparent?: boolean;
  target_image?: string;
  target_transparent?: boolean;
}

interface PostRow {
  id: string;
  author_id: string;
  crew_id: string | null;
  caption: string;
  is_public: boolean;
  layers: DbLayer[] | null;
  created_at: string;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  kind: "comment" | "swap";
  text: string;
  swap: DbSwap | null;
  created_at: string;
}

export interface AuthorProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

// ---------- Mapping DB <-> App
const layerFromDb = (l: DbLayer): FitLayer => ({
  itemId: l.item_id,
  name: l.name,
  category: l.category,
  imageUrl: l.image_url,
  hasTransparentBackground: l.has_transparent_background,
  x: l.x,
  y: l.y,
  size: l.size,
  rotation: l.rotation,
});

const layerToDb = (l: FitLayer): DbLayer => ({
  item_id: l.itemId,
  name: l.name,
  category: l.category,
  image_url: l.imageUrl,
  has_transparent_background: !!l.hasTransparentBackground,
  x: l.x,
  y: l.y,
  size: l.size,
  rotation: l.rotation,
});

const swapFromDb = (s: DbSwap): SwapSuggestion => ({
  offeredItemId: s.offered_item_id,
  offeredName: s.offered_name,
  offeredImage: s.offered_image,
  offeredTransparent: s.offered_transparent,
  targetItemId: s.target_item_id,
  targetName: s.target_name,
  targetImage: s.target_image,
  targetTransparent: s.target_transparent,
});

const swapToDb = (s: SwapSuggestion): DbSwap => ({
  offered_item_id: s.offeredItemId,
  offered_name: s.offeredName,
  offered_image: s.offeredImage,
  offered_transparent: s.offeredTransparent,
  target_item_id: s.targetItemId,
  target_name: s.targetName,
  target_image: s.targetImage,
  target_transparent: s.targetTransparent,
});

const commentFromDb = (c: CommentRow): FitComment => ({
  id: c.id,
  authorId: c.author_id,
  kind: c.kind,
  text: c.text,
  swap: c.swap ? swapFromDb(c.swap) : undefined,
  createdAt: new Date(c.created_at).getTime(),
});

const postFromDb = (p: PostRow, comments: FitComment[] = [], reactions: { user_id: string; type: ReactionType }[] = []): FitPost => ({
  id: p.id,
  crewId: p.crew_id,
  authorId: p.author_id,
  caption: p.caption,
  isPublic: p.is_public,
  layers: (p.layers ?? []).map(layerFromDb),
  reactions: {
    fire: reactions.filter((r) => r.type === "fire").map((r) => r.user_id),
    idea: reactions.filter((r) => r.type === "idea").map((r) => r.user_id),
    want: reactions.filter((r) => r.type === "want").map((r) => r.user_id),
  },
  comments,
  createdAt: new Date(p.created_at).getTime(),
});

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/** Bild für einen Snapshot: nur echte URLs (oder kleine SVG-Platzhalter), keine großen Data-URLs aus noch nicht hochgeladenen Fotos. */
export function snapshotImage(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("data:") && !src.startsWith("data:image/svg")) return undefined;
  return src;
}

// ---------- Profile
export async function getProfiles(ids: string[]): Promise<AuthorProfile[]> {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  if (unique.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("id, username, avatar_url").in("id", unique);
  if (error) throw error;
  return (data ?? []) as AuthorProfile[];
}

/**
 * Stellt sicher, dass es zum angemeldeten Nutzer ein Profil gibt (id = auth.uid()) und dass der Name nicht leer ist.
 * Der Name kommt aus Registrierung / Google-Name bzw. dem E-Mail-Anfang (siehe useAuthStore.toAuthUser).
 */
export async function ensureProfile(user: { id: string; username: string }): Promise<void> {
  try {
    const { data, error } = await supabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      await supabase.from("profiles").insert({ id: user.id, username: user.username });
    } else if (!data.username?.trim()) {
      await supabase.from("profiles").update({ username: user.username }).eq("id", user.id);
    }
  } catch (e) {
    console.error("Profil konnte nicht geprüft werden:", e);
  }
}

// ---------- Posts
export type PostScope = string | "public" | "mine";

/** Posts einer Crew (Crew-ID), die öffentlichen ("public") oder meine eigenen ("mine"), neueste zuerst – inkl. Kommentaren, Reaktionen und Autorenprofilen. */
export async function getPosts(scope: PostScope): Promise<{ posts: FitPost[]; profiles: AuthorProfile[] }> {
  let q = supabase.from("fit_posts").select("*").order("created_at", { ascending: false }).limit(POST_LIMIT);
  if (scope === "public") q = q.eq("is_public", true);
  else if (scope === "mine") q = q.eq("author_id", await currentUserId());
  else q = q.eq("crew_id", scope);

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as PostRow[];
  if (rows.length === 0) return { posts: [], profiles: [] };
  const ids = rows.map((r) => r.id);

  const [comments, reactions] = await Promise.all([
    supabase.from("post_comments").select("*").in("post_id", ids).order("created_at", { ascending: true }),
    supabase.from("reactions").select("post_id, user_id, type").in("post_id", ids),
  ]);
  if (comments.error) throw comments.error;
  if (reactions.error) throw reactions.error;

  const commentsByPost = new Map<string, FitComment[]>();
  for (const c of (comments.data ?? []) as CommentRow[]) {
    commentsByPost.set(c.post_id, [...(commentsByPost.get(c.post_id) ?? []), commentFromDb(c)]);
  }
  const reactionsByPost = new Map<string, { user_id: string; type: ReactionType }[]>();
  for (const r of (reactions.data ?? []) as { post_id: string; user_id: string; type: ReactionType }[]) {
    reactionsByPost.set(r.post_id, [...(reactionsByPost.get(r.post_id) ?? []), r]);
  }

  const posts = rows.map((r) => postFromDb(r, commentsByPost.get(r.id), reactionsByPost.get(r.id)));
  const authorIds = [...rows.map((r) => r.author_id), ...((comments.data ?? []) as CommentRow[]).map((c) => c.author_id)];
  const profiles = await getProfiles(authorIds).catch(() => []);
  return { posts, profiles };
}

export type CreatePostResult = { ok: true; post: FitPost } | { ok: false; error: "pendingUpload" | "failed" };

/** Fit posten. Die Layer enthalten einen Snapshot (Name, Kategorie, Bild-URL …), damit der Post auch ohne das Original-Item darstellbar bleibt. */
export async function createPost(input: {
  crewId: string | null;
  isPublic: boolean;
  caption: string;
  layers: FitLayer[];
}): Promise<CreatePostResult> {
  // Fotos, die noch nicht im Storage liegen (Data-URL), würden den Post aufblähen -> kurz warten lassen
  if (input.layers.some((l) => !snapshotImage(l.imageUrl))) return { ok: false, error: "pendingUpload" };
  try {
    const { data, error } = await supabase
      .from("fit_posts")
      .insert({
        crew_id: input.crewId,
        caption: input.caption.trim(),
        is_public: input.crewId === null ? true : input.isPublic, // ohne Crew ist ein Fit immer öffentlich
        layers: input.layers.map(layerToDb),
      })
      .select()
      .single();
    if (error) throw error;
    return { ok: true, post: postFromDb(data as PostRow) };
  } catch (e) {
    console.error("Post erstellen fehlgeschlagen:", e);
    return { ok: false, error: "failed" };
  }
}

/** Nur eigene Posts (RLS lässt fremde nicht zu). */
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from("fit_posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function setPostPublic(postId: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase.from("fit_posts").update({ is_public: isPublic }).eq("id", postId);
  if (error) throw error;
}

// ---------- Kommentare
export async function getComments(postId: string): Promise<FitComment[]> {
  const { data, error } = await supabase.from("post_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as CommentRow[]).map(commentFromDb);
}

export async function addComment(postId: string, text: string): Promise<FitComment> {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, kind: "comment", text: text.trim() })
    .select()
    .single();
  if (error) throw error;
  return commentFromDb(data as CommentRow);
}

/** Nur eigene Kommentare (RLS erlaubt zusätzlich dem Post-Autor das Entfernen). */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function addSwapComment(postId: string, input: { text: string; swap: SwapSuggestion }): Promise<FitComment> {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, kind: "swap", text: input.text.trim(), swap: swapToDb(input.swap) })
    .select()
    .single();
  if (error) throw error;
  return commentFromDb(data as CommentRow);
}

// ---------- Profil-Statistik
/** Zahlen für das Profil direkt aus der Cloud: meine Crews (crew_members) und meine geteilten Fits (fit_posts). */
export async function getMyStats(): Promise<{ crews: number; fits: number }> {
  const userId = await currentUserId();
  const [crews, fits] = await Promise.all([
    supabase.from("crew_members").select("crew_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("fit_posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
  ]);
  if (crews.error) throw crews.error;
  if (fits.error) throw fits.error;
  return { crews: crews.count ?? 0, fits: fits.count ?? 0 };
}

// ---------- Reaktionen und Likes (Eintrag vorhanden -> löschen, sonst anlegen)
/** Gibt zurück, ob die Reaktion danach aktiv ist. */
export async function toggleReaction(postId: string, type: ReactionType): Promise<boolean> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const { error: dErr } = await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", userId).eq("type", type);
    if (dErr) throw dErr;
    return false;
  }
  const { error: iErr } = await supabase.from("reactions").insert({ post_id: postId, type });
  if (iErr) throw iErr;
  return true;
}

export type LikeTarget = "post" | "listing";

/** Gibt zurück, ob das Like danach aktiv ist. */
export async function toggleLike(targetType: LikeTarget, targetId: string): Promise<boolean> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("likes")
    .select("target_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const { error: dErr } = await supabase
      .from("likes")
      .delete()
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("user_id", userId);
    if (dErr) throw dErr;
    return false;
  }
  const { error: iErr } = await supabase.from("likes").insert({ target_type: targetType, target_id: targetId });
  if (iErr) throw iErr;
  return true;
}

/** Echte Like-Zahlen aus der View like_counts. */
export async function getLikeCounts(targetIds: string[], targetType: LikeTarget = "post"): Promise<Record<string, number>> {
  if (targetIds.length === 0) return {};
  const { data, error } = await supabase
    .from("like_counts")
    .select("target_id, likes")
    .eq("target_type", targetType)
    .in("target_id", targetIds);
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as { target_id: string; likes: number }[]).map((r) => [r.target_id, r.likes]));
}

/** Welche dieser Ziele habe ich geliket? */
export async function getMyLikes(targetIds: string[], targetType: LikeTarget = "post"): Promise<string[]> {
  if (targetIds.length === 0) return [];
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("likes")
    .select("target_id")
    .eq("target_type", targetType)
    .eq("user_id", userId)
    .in("target_id", targetIds);
  if (error) throw error;
  return ((data ?? []) as { target_id: string }[]).map((r) => r.target_id);
}
