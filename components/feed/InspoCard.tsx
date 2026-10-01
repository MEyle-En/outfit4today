"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import type { InspoPost } from "@/types";
import { cn } from "@/lib/utils";

export function InspoCard({ post, match, index }: { post: InspoPost; match: number; index: number }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 4) * 0.08, duration: 0.4, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-surface"
    >
      <div className="flex items-center gap-3 p-3">
        <div className={cn("h-9 w-9 rounded-full bg-gradient-to-br", post.user.gradient)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{post.user.name}</p>
          <p className="truncate text-xs text-zinc-500">@{post.user.handle}</p>
        </div>
        {match > 0 && (
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-soft ring-1 ring-accent/30">
            {match}% Match
          </span>
        )}
      </div>

      <div
        className="relative aspect-[4/5] bg-gradient-to-br from-zinc-800 to-zinc-900"
        onDoubleClick={() => setLiked(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt={post.caption} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-black/40 px-2.5 py-1 text-xs backdrop-blur-md">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setLiked((v) => !v)}
            aria-label="Like"
            aria-pressed={liked}
            className="flex items-center gap-1.5 text-sm"
          >
            <Heart className={cn("h-6 w-6 transition-colors", liked && "fill-accent text-accent")} />
            {(post.likes + (liked ? 1 : 0)).toLocaleString("de-DE")}
          </motion.button>
          <button className="flex items-center gap-1.5 text-sm text-zinc-300" aria-label="Kommentare">
            <MessageCircle className="h-6 w-6" />
            {post.comments}
          </button>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setSaved((v) => !v)}
            aria-label="Speichern"
            aria-pressed={saved}
            className="ml-auto"
          >
            <Bookmark className={cn("h-6 w-6", saved && "fill-white")} />
          </motion.button>
        </div>
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-white">{post.user.handle}</span> {post.caption}
        </p>
      </div>
    </motion.article>
  );
}
