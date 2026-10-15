"use client";

import { useRef, useState } from "react";
import { ItemImage } from "@/components/wardrobe/ItemImage";
import { ArrowLeftRight, Ban, Bookmark, Flag, Globe, MessageCircle, Send, Trash2 } from "lucide-react";
import { BlockDialog } from "@/components/moderation/BlockDialog";
import { KebabMenu } from "@/components/moderation/KebabMenu";
import { ReportDialog } from "@/components/moderation/ReportDialog";
import { useModerationStore } from "@/lib/store/useModerationStore";
import type { ReportTarget } from "@/lib/supabase-moderation";
import { FitPreview } from "@/components/crew/FitPreview";
import { SwapDialog } from "@/components/crew/SwapDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LikeButton } from "@/components/ui/LikeButton";
import { Tip } from "@/components/ui/Tip";
import { useTranslation } from "@/hooks/useTranslation";
import { usePersonName } from "@/hooks/usePersonName";
import { useProfileStore } from "@/lib/store/useProfileStore";
import { stagger } from "@/lib/stagger";
import { likeKey } from "@/lib/store/useSocialStore";
import { useItemLookup } from "@/hooks/useItemLookup";
import { gradientFor } from "@/lib/supabase-crews";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAuthorsStore } from "@/lib/store/useAuthorsStore";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { cn, timeAgo } from "@/lib/utils";
import type { FitComment, FitPost } from "@/types";

function Avatar({ id, size = "h-9 w-9" }: { id: string; size?: string }) {
  const myAvatar = useProfileStore((s) => s.avatar);
  const meId = useAuthStore((s) => s.user?.id);
  const profile = useAuthorsStore((s) => s.profiles[id]);
  const src = id === meId && myAvatar ? myAvatar : profile?.avatar;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", size)} />;
  }
  return <div className={cn("shrink-0 rounded-full bg-gradient-to-br", gradientFor(id), size)} />;
}

function SwapCard({ comment }: { comment: FitComment }) {
  const { t } = useTranslation();
  const nameOf = usePersonName();
  const lookup = useItemLookup();
  const s = comment.swap!;
  const offered = lookup(s.offeredItemId);
  const target = lookup(s.targetItemId);
  const thumb = (src?: string, alt = "", transparent?: boolean) =>
    src ? (
      <ItemImage src={src} alt={alt} transparent={transparent} className="h-14 w-11 rounded-lg" />
    ) : (
      <div className="h-14 w-11 rounded-lg bg-zinc-800" />
    );

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/10 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Avatar id={comment.authorId} size="h-6 w-6" />
        <span className="text-xs font-semibold">{nameOf(comment.authorId)}</span>
        <Badge variant="default" className="ml-auto py-0.5">
          <ArrowLeftRight className="h-3 w-3" /> {t("swap_suggestion")}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center">
          {thumb(s.offeredImage ?? offered?.image, s.offeredName, s.offeredTransparent ?? offered?.hasTransparentBackground)}
          <p className="mt-1 w-14 truncate text-[10px] text-zinc-400">{s.offeredName}</p>
          {offered?.size && <p className="text-[10px] font-semibold text-accent-soft">{offered.size}</p>}
        </div>
        <ArrowLeftRight className="h-4 w-4 shrink-0 text-accent-soft" />
        <div className="text-center">
          {thumb(s.targetImage ?? target?.image, s.targetName, s.targetTransparent ?? target?.hasTransparentBackground)}
          <p className="mt-1 w-14 truncate text-[10px] text-zinc-400">{s.targetName}</p>
          {target?.size && <p className="text-[10px] font-semibold text-accent-soft">{target.size}</p>}
        </div>
        <p className="flex-1 text-sm">{comment.text}</p>
      </div>
    </div>
  );
}

export function FitCheckPost({ post, index = 0 }: { post: FitPost; index?: number }) {
  const { t } = useTranslation();
  const nameOf = usePersonName();
  const lookupItem = useItemLookup();
  const { toggleReaction, addComment, togglePublic, deletePost, deleteComment } = useCrewStore.getState();
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);
  const meId = useAuthStore((s) => s.user?.id);
  const [swapOpen, setSwapOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const commentRef = useRef<HTMLInputElement>(null);
  const isMine = !!meId && post.authorId === meId;
  const blocked = useModerationStore((s) => s.blocked);
  const [report, setReport] = useState<{ type: ReportTarget; id: string } | null>(null);
  const [blockTarget, setBlockTarget] = useState<string | null>(null);
  // Kommentare blockierter Nutzer sind für mich ausgeblendet
  const visibleComments = post.comments.filter((c) => !blocked.includes(c.authorId));
  const inspired = !!meId && post.reactions.idea.includes(meId);

  return (
    <article style={stagger(index)} className="animate-fade-in-up card-lift space-y-3 rounded-2xl border border-white/10 bg-surface p-3">
      <header className="flex items-center gap-3">
        <Avatar id={post.authorId} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{nameOf(post.authorId)}</p>
          <p className="text-xs text-zinc-500">{t("post_fitCheck")} · {timeAgo(post.createdAt)}</p>
        </div>
        {isMine && post.crewId !== null ? (
          <button
            onClick={() => void togglePublic(post.id)}
            aria-pressed={!!post.isPublic}
            title={t("post_publicToggle")}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              post.isPublic ? "border-accent/60 bg-accent/20 text-accent-soft" : "border-white/10 text-zinc-500",
            )}
          >
            <Globe className="h-3 w-3" /> {post.isPublic ? t("post_public") : t("post_crewOnly")}
          </button>
        ) : (
          post.isPublic && (
            <Badge variant="default" className="py-0.5">
              <Globe className="h-3 w-3" /> {t("post_public")}
            </Badge>
          )
        )}
        {/* Nur eigene Posts lassen sich löschen (die Datenbank erzwingt das zusätzlich) */}
        {isMine && (
          <button
            type="button"
            aria-label={t("post_delete")}
            title={t("post_delete")}
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3000);
                return;
              }
              void deletePost(post.id);
            }}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-1 text-[11px]",
              confirmDelete ? "border-red-400/60 text-red-300" : "border-white/10 text-zinc-500 hover:text-white",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" /> {confirmDelete && t("post_deleteConfirm")}
          </button>
        )}
        {/* Fremde Posts: Menü mit Melden und Blockieren */}
        {!isMine && (
          <KebabMenu
            label={t("mod_menu")}
            items={[
              { label: t("report_postItem"), icon: <Flag className="h-4 w-4" />, onSelect: () => setReport({ type: "post", id: post.id }) },
              { label: t("mod_block"), icon: <Ban className="h-4 w-4" />, danger: true, onSelect: () => setBlockTarget(post.authorId) },
            ]}
          />
        )}
      </header>

      <FitPreview layers={post.layers} />

      {post.caption && <p className="text-sm text-zinc-200">{post.caption}</p>}

      {/* Aktionsleiste: Herz = Gefällt mir, Lesezeichen = Inspiriert, Sprechblase = Kommentare – jeweils mit Zähler */}
      <div className="flex flex-wrap items-center gap-2">
        <LikeButton
          likeKey={likeKey.post(post.id)}
          mine={isMine}
          // Vorlieben merken: welche Teile/Kategorien/Farben wurden geliket
          traits={{
            itemIds: post.layers.map((l) => l.itemId),
            categories: post.layers.map((l) => l.category),
            colors: post.layers.flatMap((l) => {
              const c = lookupItem(l.itemId)?.color;
              return c ? [c] : [];
            }),
          }}
        />

        <Tip label={t("inspired_tooltip")}>
          <button
            type="button"
            onClick={() => void toggleReaction(post.id, "idea")}
            aria-pressed={inspired}
            aria-label={t("inspired_tooltip")}
            className={cn(
              "icon-btn flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
              inspired ? "border-accent/60 bg-accent/20" : "border-white/10 bg-white/5",
            )}
          >
            <Bookmark className={cn("h-4 w-4 transition-colors", inspired && "fill-accent text-accent")} />
            <span className="text-xs tabular-nums">{post.reactions.idea.length}</span>
          </button>
        </Tip>

        <Tip label={t("comments_tooltip")}>
          <button
            type="button"
            onClick={() => commentRef.current?.focus()}
            aria-label={t("comments_tooltip")}
            className="icon-btn flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs tabular-nums">{visibleComments.length}</span>
          </button>
        </Tip>

        {!isMine && (
          <Button variant="glass" size="sm" className="ml-auto" onClick={() => setSwapOpen(true)}>
            <ArrowLeftRight className="h-4 w-4" /> {t("swap")}
          </Button>
        )}
      </div>

      {visibleComments.length > 0 && (
        <ul className="space-y-2">
          {visibleComments.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                {c.kind === "swap" && c.swap ? (
                  <SwapCard comment={c} />
                ) : (
                  <p className="text-sm text-zinc-300">
                    <span className="font-semibold text-white">{nameOf(c.authorId)}</span> {c.text}
                  </p>
                )}
              </div>
              {/* Fremde Kommentare: melden */}
              {!!meId && c.authorId !== meId && (
                <button
                  type="button"
                  aria-label={t("report_commentItem")}
                  title={t("report_commentItem")}
                  onClick={() => setReport({ type: "comment", id: c.id })}
                  className="shrink-0 rounded-full bg-white/5 p-1.5 text-zinc-400 hover:text-white"
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Nur eigene Kommentare: zweiter Tipp bestätigt (die Datenbank erzwingt das zusätzlich) */}
              {!!meId && c.authorId === meId && (
                <button
                  type="button"
                  aria-label={t("comment_delete")}
                  title={t("comment_delete")}
                  onClick={() => {
                    if (confirmCommentId !== c.id) {
                      setConfirmCommentId(c.id);
                      setTimeout(() => setConfirmCommentId((cur) => (cur === c.id ? null : cur)), 3000);
                      return;
                    }
                    setConfirmCommentId(null);
                    void deleteComment(post.id, c.id);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full p-1.5 text-[11px]",
                    confirmCommentId === c.id ? "bg-red-500/15 px-2.5 text-red-300" : "bg-white/5 text-zinc-300 hover:text-white",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" /> {confirmCommentId === c.id && t("comment_deleteConfirm")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim() || sending) return;
          setSending(true);
          const ok = await addComment(post.id, { kind: "comment", text: text.trim() });
          setSending(false);
          if (ok) setText(""); // bei Fehler bleibt der Text stehen
        }}
      >
        <Input
          ref={commentRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("post_commentPh")}
          aria-label={t("post_comment")}
          className="h-10 text-sm"
        />
        <Button type="submit" size="icon" variant="glass" disabled={!text.trim() || sending} aria-label={t("send")}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {!isMine && <SwapDialog key={swapOpen ? "open" : "closed"} post={post} open={swapOpen} onOpenChange={setSwapOpen} />}
      <ReportDialog target={report} onClose={() => setReport(null)} />
      <BlockDialog userId={blockTarget} name={nameOf(post.authorId)} onClose={() => setBlockTarget(null)} />
    </article>
  );
}
