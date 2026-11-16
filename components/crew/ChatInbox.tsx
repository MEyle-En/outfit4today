"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { ChatDialog } from "@/components/market/ChatDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { unreadOf, useChatStore, type ThreadMeta } from "@/lib/store/useChatStore";
import { useModerationStore } from "@/lib/store/useModerationStore";

/**
 * Posteingang: ALLE meine Chats – Anfragen an mich (Leihen, Tauschen, Kaufen) und Anfragen, die ich gestellt habe.
 * Bisher waren eingehende Chats nur unter Marketplace > Meine Verkäufe zu finden, eigene Anfragen gar nicht.
 */
export function ChatInbox() {
  const { t } = useTranslation();
  const threads = useChatStore((s) => s.threads);
  const readAt = useChatStore((s) => s.readAt);
  const blocked = useModerationStore((s) => s.blocked);
  const [open, setOpen] = useState<ThreadMeta | null>(null);
  const [expanded, setExpanded] = useState(false);

  const list = useMemo(() => threads.filter((x) => !blocked.includes(x.counterpartId)), [threads, blocked]);
  const total = list.reduce((n, th) => n + unreadOf(th, readAt), 0);
  if (list.length === 0) return null;
  const shown = expanded ? list : list.slice(0, 3);

  return (
    <section className="space-y-2 rounded-2xl border border-accent/30 bg-accent/10 p-3" aria-label={t("inbox_title")}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageCircle className="h-4 w-4 text-accent-soft" /> {t("inbox_title")}
        {total > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{total}</span>}
      </h3>
      <ul className="space-y-1.5">
        {shown.map((th) => {
          const unread = unreadOf(th, readAt);
          return (
            <li key={th.id}>
              <button onClick={() => setOpen(th)} className="flex w-full items-center gap-3 rounded-xl bg-black/20 p-2 text-left hover:bg-black/30">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {th.counterpart || t("user_unknown")} <span className="font-normal text-zinc-400">{th.title}</span>
                  </span>
                  <span className={`block truncate text-xs ${unread ? "text-white" : "text-zinc-500"}`}>
                    {th.last ? `${th.last.from === "me" ? `${t("crew_you")}: ` : ""}${th.last.text}` : t("chat_first")}
                  </span>
                </span>
                {unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label={t("inq_unread")} />}
              </button>
            </li>
          );
        })}
      </ul>
      {list.length > 3 && (
        <button onClick={() => setExpanded((e) => !e)} className="text-xs text-accent-soft">
          {expanded ? t("inbox_less") : t("inbox_more", { n: list.length - 3 })}
        </button>
      )}
      {open && <ChatDialog meta={open} open onOpenChange={(o) => !o && setOpen(null)} />}
    </section>
  );
}
