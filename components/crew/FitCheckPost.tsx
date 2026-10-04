"use client";

import { useRef, useState } from "react";
import { ArrowLeftRight, Bookmark, Globe, MessageCircle, Send } from "lucide-react";
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
import { getPerson } from "@/lib/mock/crew";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { cn, timeAgo } from "@/lib/utils";
import type { FitComment, FitPost } from "@/types";

function Avatar({ id, size = "h-9 w-9" }: { id: string; size?: string }) {
  const avatar = useProfileStore((s) => s.avatar);
  if (id === "me" && avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt="" className={cn("shrink-0 rounded-full object-cover", size)} />;
  }
  const person = getPerson(id);
  if (person.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.avatar} alt={person.name} className={cn("shrink-0 rounded-full object-cover", size)} />;
  }
  return <div className={cn("shrink-0 rounded-full bg-gradient-to-br", person.gradient, size)} />;
}

function SwapCard({ comment }: { comment: FitComment }) {
  const { t } = useTranslation();
  const nameOf = usePersonName();
  const lookup = useItemLookup();
  const s = comment.swap!;
  const offered = lookup(s.offeredItemId);
  const target = lookup(s.targetItemId);
  const thumb = (src?: string, alt = "") =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="h-14 w-11 rounded-lg object-cover" />
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
          {thumb(offered?.image, s.offeredName)}
          <p className="mt-1 w-14 truncate text-[10px] text-zinc-400">{s.offeredName}</p>
        </div>
        <ArrowLeftRight className="h-4 w-4 shrink-0 text-accent-soft" />
        <div className="text-center">
          {thumb(target?.image, s.targetName)}
          <p className="mt-1 w-14 truncate text-[10px] text-zinc-400">{s.targetName}</p>
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
  const { toggleReaction, addComment, togglePublic } = useCrewStore.getState();
  const [swapOpen, setSwapOpen] = useState(false);
  const [text, setText] = useState("");
  const commentRef = useRef<HTMLInputElement>(null);
  const isMine = post.authorId === "me";
  const inspired = post.reactions.idea.includes("me");

  return (
    <article style={stagger(index)} className="animate-fade-in-up card-lift space-y-3 rounded-2xl border border-white/10 bg-surface p-3">
      <header className="flex items-center gap-3">
        <Avatar id={post.authorId} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{nameOf(post.authorId)}</p>
          <p className="text-xs text-zinc-500">{t("post_fitCheck")} · {timeAgo(post.createdAt)}</p>
        </div>
        {isMine ? (
          <button
            onClick={() => togglePublic(post.id)}
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
            onClick={() => toggleReaction(post.id, "idea")}
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
            <span className="text-xs tabular-nums">{post.comments.length}</span>
          </button>
        </Tip>

        {!isMine && (
          <Button variant="glass" size="sm" className="ml-auto" onClick={() => setSwapOpen(true)}>
            <ArrowLeftRight className="h-4 w-4" /> {t("swap")}
          </Button>
        )}
      </div>

      {post.comments.length > 0 && (
        <ul className="space-y-2">
          {post.comments.map((c) => (
            <li key={c.id}>
              {c.kind === "swap" && c.swap ? (
                <SwapCard comment={c} />
              ) : (
                <p className="text-sm text-zinc-300">
                  <span className="font-semibold text-white">{nameOf(c.authorId)}</span> {c.text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addComment(post.id, { authorId: "me", kind: "comment", text: text.trim() });
          setText("");
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
        <Button type="submit" size="icon" variant="glass" disabled={!text.trim()} aria-label={t("send")}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {!isMine && <SwapDialog key={swapOpen ? "open" : "closed"} post={post} open={swapOpen} onOpenChange={setSwapOpen} />}
    </article>
  );
}
