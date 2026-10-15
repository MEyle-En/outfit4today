"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useChatStore, type ThreadMeta } from "@/lib/store/useChatStore";
import { useModerationStore } from "@/lib/store/useModerationStore";
import { useProfileStore } from "@/lib/store/useProfileStore";
import { gradientFor } from "@/lib/supabase-crews";
import { subscribeThread } from "@/lib/supabase-chat";
import { cn } from "@/lib/utils";

/** Echter Chat zu einem Angebot (Supabase). Neue Nachrichten kommen per Realtime, solange der Dialog offen ist. */
export function ChatDialog({
  meta,
  open,
  onOpenChange,
}: {
  meta: ThreadMeta;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const thread = useChatStore((s) => s.threads.find((x) => x.id === meta.id));
  const send = useChatStore((s) => s.send);
  const remove = useChatStore((s) => s.remove);
  const blocked = useModerationStore((s) => s.blocked.includes(meta.counterpartId));
  const avatar = useProfileStore((s) => s.avatar);
  const [text, setText] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // Nachrichten blockierter Nutzer bleiben ausgeblendet
  const messages = (thread?.messages ?? []).filter((m) => m.from === "me" || !blocked);
  const QUICK = [t("chat_q1"), t("chat_q2"), t("chat_q3")];

  // Solange der Dialog offen ist: laden, live mithören, als gelesen markieren
  useEffect(() => {
    if (!open) return;
    const s = useChatStore.getState();
    s.setOpen(meta.id);
    void s.loadMessages(meta.id);
    const unsubscribe = subscribeThread(
      meta.id,
      (m) => useChatStore.getState().ingest(m),
      (id) => useChatStore.getState().ingestDelete(id),
    );
    return () => {
      unsubscribe();
      useChatStore.getState().setOpen(null);
    };
  }, [open, meta.id]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages.length]);

  const submit = async (value = text) => {
    const v = value.trim();
    if (!v || blocked) return;
    if (value === text) setText("");
    const ok = await send(meta.id, v);
    if (!ok && value === text) setText(v); // bei Fehler den Text zurückgeben
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-center gap-3 pr-10">
          {meta.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
          ) : meta.counterpartAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.counterpartAvatar} alt="" className="h-12 w-10 rounded-lg object-cover" />
          ) : (
            <div className={cn("h-12 w-10 rounded-lg bg-gradient-to-br", gradientFor(meta.counterpartId))} />
          )}
          <div className="min-w-0">
            <DialogTitle className="truncate text-xl">{meta.counterpart || t("user_unknown")}</DialogTitle>
            <DialogDescription className="mt-0 truncate">{meta.title}</DialogDescription>
          </div>
        </div>

        <div className="mt-4 flex h-64 flex-col gap-2 overflow-y-auto rounded-2xl bg-black/30 p-3">
          {messages.length === 0 && <p className="m-auto text-center text-sm text-zinc-500">{t("chat_first")}</p>}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex items-end gap-1.5", m.from === "me" ? "flex-row-reverse" : "", m.pending && "opacity-60")}>
              {m.from === "me" && avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
              )}
              <div
                className={cn(
                  "max-w-[80%] break-words rounded-2xl px-3 py-2 text-sm",
                  m.from === "me" ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-white/10",
                )}
              >
                {m.text}
              </div>
              {/* Nur eigene, bereits gesendete Nachrichten: zweiter Tipp bestätigt */}
              {m.from === "me" && !m.pending && (
                <button
                  type="button"
                  aria-label={t("chat_delete")}
                  title={t("chat_delete")}
                  onClick={() => {
                    if (confirmId !== m.id) {
                      setConfirmId(m.id);
                      setTimeout(() => setConfirmId((cur) => (cur === m.id ? null : cur)), 3000);
                      return;
                    }
                    setConfirmId(null);
                    void remove(meta.id, m.id);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full p-1.5 text-[11px]",
                    confirmId === m.id ? "bg-red-500/15 px-2.5 text-red-300" : "bg-white/5 text-zinc-300 hover:text-white",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" /> {confirmId === m.id && t("comment_deleteConfirm")}
                </button>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {blocked ? (
          <p role="status" className="mt-3 rounded-xl bg-white/5 p-3 text-center text-sm text-zinc-400">
            {t("chat_blockedBanner")}
          </p>
        ) : (
          <>
            <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => void submit(q)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("chat_placeholder")} aria-label={t("chat_placeholder")} maxLength={2000} className="h-11" />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!text.trim()} aria-label={t("send")}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
