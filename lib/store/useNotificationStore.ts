import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/mock/wardrobe";
import { playNotificationSound } from "@/lib/utils/sounds";

export type NotificationType = "like" | "comment" | "reaction" | "chat" | "swap" | "purchase" | "sale" | "follow";

export interface AppNotification {
  id: string;
  type: NotificationType;
  text: string;
  at: number;
  read: boolean;
  href?: string;
}

interface NotificationState {
  items: AppNotification[];
  add: (type: NotificationType, text: string, href?: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      items: [],
      add: (type, text, href) => {
        set((s) => ({
          items: [{ id: uid(), type, text, href, at: Date.now(), read: false }, ...s.items].slice(0, 30),
        }));
        // Der Sound hängt am Typ des Ereignisses und kommt an genau einer Stelle: beim Eintreffen.
        // (Die Glocke ist nicht auf jeder Seite sichtbar, deshalb nicht dort.)
        playNotificationSound(type);
      },
      markAllRead: () => set((s) => ({ items: s.items.map((n) => (n.read ? n : { ...n, read: true })) })),
      clear: () => set({ items: [] }),
    }),
    { name: "outfit4today-notifications" },
  ),
);

/** Von überall aufrufbar (auch aus Timern der Mock-Simulation). */
export const notify = (type: NotificationType, text: string, href?: string) =>
  useNotificationStore.getState().add(type, text, href);
