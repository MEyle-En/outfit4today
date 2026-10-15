import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translate } from "@/lib/i18n/translate";
import * as cloud from "@/lib/supabase-chat";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useModerationStore } from "@/lib/store/useModerationStore";
import { notify } from "@/lib/store/useNotificationStore";
import { toast } from "@/lib/store/useToastStore";
import { newId } from "@/lib/utils/uuid";

export interface ChatMessage {
  id: string;
  senderId: string;
  from: "me" | "them";
  text: string;
  at: number;
  /** wird gerade gesendet (optimistisch angezeigt) */
  pending?: boolean;
}

export interface ThreadMeta {
  /** Thread-ID (Supabase) */
  id: string;
  /** Angebot: wardrobe_items.id */
  listingId: string;
  title: string;
  image: string;
  counterpartId: string;
  counterpart: string;
  counterpartAvatar?: string;
  /** buyer = ich schreibe einem Verkäufer, seller = jemand schreibt mir zu meinem Angebot */
  role: "buyer" | "seller";
}

export interface ChatThread extends ThreadMeta {
  messages: ChatMessage[];
  last?: { text: string; at: number; from: "me" | "them" };
}

interface ChatState {
  threads: ChatThread[];
  /** Thread, dessen Dialog gerade offen ist (dafür gibt es keine Benachrichtigung) */
  openThreadId: string | null;
  /** Zeitpunkt, bis zu dem ich je Thread gelesen habe (lokal gespeichert, Basis der Anfragen-Badges) */
  readAt: Record<string, number>;
  loadThreads: () => Promise<void>;
  startThread: (input: { listingId: string; title: string; image: string; sellerId: string; sellerName: string }) => Promise<ThreadMeta | null>;
  loadMessages: (threadId: string) => Promise<void>;
  setOpen: (threadId: string | null) => void;
  send: (threadId: string, text: string) => Promise<boolean>;
  remove: (threadId: string, messageId: string) => Promise<void>;
  ingest: (m: cloud.CloudMessage) => void;
  ingestDelete: (messageId: string) => void;
  reset: () => void;
  clearAll: () => void;
}

const meId = () => useAuthStore.getState().user?.id;
const isBlocked = (userId: string) => useModerationStore.getState().blocked.includes(userId);
const toMsg = (m: cloud.CloudMessage): ChatMessage => ({ id: m.id, senderId: m.senderId, from: m.senderId === meId() ? "me" : "them", text: m.text, at: m.at });

const fromCloud = (t: cloud.CloudThread, messages: ChatMessage[] = []): ChatThread => ({
  id: t.id,
  listingId: t.listingId,
  title: t.title,
  image: t.image,
  counterpartId: t.counterpartId,
  counterpart: t.counterpart,
  counterpartAvatar: t.counterpartAvatar,
  role: t.role,
  messages,
  last: t.last ? { text: t.last.text, at: t.last.at, from: t.last.senderId === meId() ? "me" : "them" } : undefined,
});

/** Ungelesene Nachrichten eines Threads (nur vom Gegenüber, nach meinem letzten Lesezeitpunkt). */
export function unreadOf(t: ChatThread, readAt: Record<string, number>): number {
  const since = readAt[t.id] ?? 0;
  const loaded = t.messages.filter((m) => m.from === "them" && m.at > since).length;
  if (loaded > 0) return loaded;
  return t.last && t.last.from === "them" && t.last.at > since ? 1 : 0;
}

const withMessage = (threads: ChatThread[], threadId: string, fn: (t: ChatThread) => ChatThread) =>
  threads.map((t) => (t.id === threadId ? fn(t) : t));

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      openThreadId: null,
      readAt: {},

      loadThreads: async () => {
        try {
          const list = await cloud.getThreads();
          set((s) => ({
            threads: list.map((t) => fromCloud(t, s.threads.find((x) => x.id === t.id)?.messages ?? [])),
          }));
        } catch (e) {
          console.error("Chats laden fehlgeschlagen:", e);
        }
      },

      startThread: async ({ listingId, title, image, sellerId, sellerName }) => {
        if (isBlocked(sellerId)) {
          toast(translate("chat_errBlocked"), undefined, "error");
          return null;
        }
        try {
          const t = await cloud.getOrCreateThread({ listingId, listingTitle: title, listingImage: image, sellerId });
          const thread = fromCloud({ ...t, counterpart: t.counterpart || sellerName });
          set((s) => ({
            threads: s.threads.some((x) => x.id === thread.id)
              ? s.threads
              : [{ ...thread, messages: [] }, ...s.threads],
          }));
          const { messages: _m, last: _l, ...meta } = thread;
          void _m;
          void _l;
          return meta;
        } catch (e) {
          console.error("Chat öffnen fehlgeschlagen:", e);
          toast(translate("chat_errOpen"), undefined, "error");
          return null;
        }
      },

      loadMessages: async (threadId) => {
        try {
          const msgs = (await cloud.getMessages(threadId)).map(toMsg);
          set((s) => ({
            threads: withMessage(s.threads, threadId, (t) => {
              // noch nicht bestätigte eigene Nachrichten behalten
              const pending = t.messages.filter((m) => m.pending);
              return { ...t, messages: [...msgs, ...pending] };
            }),
          }));
        } catch (e) {
          console.error("Nachrichten laden fehlgeschlagen:", e);
          toast(translate("chat_errLoad"), undefined, "error");
        }
      },

      setOpen: (threadId) =>
        set((s) => ({
          openThreadId: threadId,
          readAt: threadId ? { ...s.readAt, [threadId]: Date.now() } : s.readAt,
        })),

      send: async (threadId, text) => {
        const me = meId();
        const thread = get().threads.find((t) => t.id === threadId);
        const value = text.trim();
        if (!me || !thread || !value) return false;
        if (isBlocked(thread.counterpartId)) {
          toast(translate("chat_errBlocked"), undefined, "error");
          return false;
        }
        const tmpId = `tmp-${newId()}`;
        const tmp: ChatMessage = { id: tmpId, senderId: me, from: "me", text: value, at: Date.now(), pending: true };
        set((s) => ({ threads: withMessage(s.threads, threadId, (t) => ({ ...t, messages: [...t.messages, tmp] })) }));
        try {
          const saved = toMsg(await cloud.sendMessage(threadId, value));
          set((s) => ({
            threads: withMessage(s.threads, threadId, (t) => {
              const withoutTmp = t.messages.filter((m) => m.id !== tmpId);
              // Kam die Nachricht schon per Realtime an, nicht doppelt einfügen
              const messages = withoutTmp.some((m) => m.id === saved.id) ? withoutTmp : [...withoutTmp, saved];
              return { ...t, messages, last: { text: saved.text, at: saved.at, from: "me" } };
            }),
          }));
          return true;
        } catch (e) {
          console.error("Senden fehlgeschlagen:", e);
          set((s) => ({ threads: withMessage(s.threads, threadId, (t) => ({ ...t, messages: t.messages.filter((m) => m.id !== tmpId) })) }));
          toast(translate("chat_errSend"), undefined, "error");
          return false;
        }
      },

      remove: async (threadId, messageId) => {
        const before = get().threads;
        set((s) => ({
          threads: withMessage(s.threads, threadId, (t) => ({ ...t, messages: t.messages.filter((m) => m.id !== messageId) })),
        }));
        try {
          await cloud.deleteMessage(messageId);
          toast(translate("chat_deletedToast"));
        } catch (e) {
          console.error("Nachricht löschen fehlgeschlagen:", e);
          set({ threads: before });
          toast(translate("social_errAction"), undefined, "error");
        }
      },

      ingest: (m) => {
        const me = meId();
        const state = get();
        const thread = state.threads.find((t) => t.id === m.threadId);
        if (!thread) {
          // Neuer Thread (z. B. erste Anfrage zu meinem Angebot): Liste neu laden, dann erneut einsortieren
          void get()
            .loadThreads()
            .then(() => {
              if (get().threads.some((t) => t.id === m.threadId)) get().ingest(m);
            });
          return;
        }
        if (thread.messages.some((x) => x.id === m.id)) return;
        const mine = m.senderId === me;
        // Eigene Nachricht, die gerade noch gesendet wird: send() übernimmt das
        if (mine && thread.messages.some((x) => x.pending && x.text === m.text)) return;
        if (!mine && isBlocked(m.senderId)) return; // Blockierte erzeugen weder Anzeige noch Benachrichtigung

        const msg = toMsg(m);
        const open = state.openThreadId === m.threadId;
        set((s) => ({
          threads: withMessage(s.threads, m.threadId, (t) => ({
            ...t,
            messages: [...t.messages, msg],
            last: { text: m.text, at: m.at, from: mine ? "me" : "them" },
          })),
          readAt: open && !mine ? { ...s.readAt, [m.threadId]: Date.now() } : s.readAt,
        }));
        // Bei geschlossenem Dialog: Benachrichtigung (inklusive Sound)
        if (!mine && !open) {
          notify("chat", translate("notif_chat", { name: thread.counterpart || translate("user_unknown"), text: m.text }), "/marketplace");
        }
      },

      ingestDelete: (messageId) =>
        set((s) => ({ threads: s.threads.map((t) => (t.messages.some((m) => m.id === messageId) ? { ...t, messages: t.messages.filter((m) => m.id !== messageId) } : t)) })),

      reset: () => set({ threads: [], openThreadId: null }),
      // Chats liegen in der Cloud; lokal wird nur der Lese-Stand zurückgesetzt
      clearAll: () => set({ threads: [], openThreadId: null, readAt: {} }),
    }),
    {
      name: "outfit4today-chat",
      version: 2,
      // v2: Chat kommt aus Supabase (alte lokale Mock-Threads verwerfen)
      migrate: () => ({ readAt: {} }) as unknown as ChatState,
      partialize: (s) => ({ readAt: s.readAt }),
    },
  ),
);

/** Beim Login starten: Threads laden und per Realtime auf neue Nachrichten/Threads lauschen. Gibt die Stop-Funktion zurück. */
export function startChatSync(): () => void {
  void useChatStore.getState().loadThreads();
  const stop = cloud.subscribeAll(
    (m) => useChatStore.getState().ingest(m),
    () => void useChatStore.getState().loadThreads(),
    (id) => useChatStore.getState().ingestDelete(id),
  );
  return () => {
    stop();
    useChatStore.getState().reset();
  };
}
