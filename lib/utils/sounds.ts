import type { NotificationType } from "@/lib/store/useNotificationStore";
import { playSound, type SoundName } from "@/lib/sound";

/**
 * Welcher Sound passt zu welchem Ereignis?
 * Geld-Rascheln (cash) gibt es NUR bei Kauf-Anfragen und abgeschlossenen Verkäufen – alles andere ist ein dezentes Pop oder Whoosh.
 */
export const notificationSounds: Record<NotificationType, SoundName> = {
  like: "notification", // kleiner Pop
  comment: "notification", // kleiner Pop
  reaction: "notification", // kleiner Pop
  chat: "notification", // kleiner Pop
  follow: "notification", // kleiner Pop
  swap: "whoosh", // Tauschvorschlag
  purchase: "cash", // Kauf-Anfrage
  sale: "cash", // Verkauf abgeschlossen
};

export function playNotificationSound(type: NotificationType) {
  playSound(notificationSounds[type]);
}
