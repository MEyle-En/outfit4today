import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translate } from "@/lib/i18n/translate";
import { uid } from "@/lib/mock/wardrobe";
import { notify } from "@/lib/store/useNotificationStore";

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  at: number;
}

export interface ThreadMeta {
  id: string;
  /** Marketplace-Listing-ID (bei eigenen Angeboten "mine-<itemId>") */
  listingId: string;
  title: string;
  image: string;
  counterpart: string;
  /** buyer = ich schreibe einem Verkäufer, seller = jemand schreibt mir zu meinem Angebot */
  role: "buyer" | "seller";
}

export interface ChatThread extends ThreadMeta {
  messages: ChatMessage[];
}

interface ChatState {
  threads: ChatThread[];
  sendMessage: (meta: ThreadMeta, text: string) => void;
  receiveMessage: (meta: ThreadMeta, text: string) => void;
  clearAll: () => void;
}

const append = (threads: ChatThread[], meta: ThreadMeta, msg: Omit<ChatMessage, "id" | "at">): ChatThread[] => {
  const message: ChatMessage = { ...msg, id: uid(), at: Date.now() };
  return threads.some((t) => t.id === meta.id)
    ? threads.map((t) => (t.id === meta.id ? { ...t, messages: [...t.messages, message] } : t))
    : [{ ...meta, messages: [message] }, ...threads];
};

const cannedReply = (text: string, role: ThreadMeta["role"]) => {
  const t = text.toLowerCase();
  if (role === "seller") return translate("reply_thanks");
  if (/preis|€|günstiger|vb/.test(t)) return translate("reply_price");
  if (/tausch|swap/.test(t)) return translate("reply_swap");
  return translate("reply_here");
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      sendMessage: (meta, text) => {
        set((s) => ({ threads: append(s.threads, meta, { from: "me", text }) }));
        // Mock: Gegenüber antwortet nach kurzer Zeit
        setTimeout(() => {
          get().receiveMessage(meta, cannedReply(text, meta.role));
        }, 2500);
      },
      receiveMessage: (meta, text) => {
        set((s) => ({ threads: append(s.threads, meta, { from: "them", text }) }));
        notify("chat", translate("notif_chat", { name: meta.counterpart, text }), "/marketplace");
      },
      clearAll: () => set({ threads: [] }),
    }),
    { name: "outfit4today-chat" },
  ),
);

/** Mock: nachdem ich etwas anbiete, fragt nach einer Weile jemand danach. */
export function simulateBuyerInquiry(item: {
  id: string;
  name: string;
  image: string;
  listing?: "swap" | "sell" | "both";
  price?: number;
}) {
  setTimeout(() => {
    useChatStore.getState().receiveMessage(
      {
        id: `t-mine-${item.id}-buyer`,
        listingId: `mine-${item.id}`,
        title: item.name,
        image: item.image,
        counterpart: "Jonas",
        role: "seller",
      },
      translate("chat_q1"),
    );
  }, 8000);

  // Verkaufsangebot mit Preis: später kommt eine echte Kauf-Anfrage (das ist der Fall für das Geld-Rascheln)
  if (item.listing && item.listing !== "swap" && item.price != null) {
    setTimeout(() => {
      notify("purchase", translate("notif_purchase", { name: "Lea", item: item.name, price: item.price ?? 0 }), "/marketplace");
    }, 16000);
  }
}
