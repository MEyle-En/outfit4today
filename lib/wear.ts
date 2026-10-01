import { translate } from "@/lib/i18n/translate";
import type { WardrobeItem } from "@/types";

export const DAY = 24 * 60 * 60 * 1000;
export const FORGOTTEN_AFTER_DAYS = 60;
/** Frisch hochgeladene Teile gelten nicht als "vergessen". */
const GRACE_DAYS = 14;

export const daysAgoIso = (n: number) => new Date(Date.now() - n * DAY).toISOString();

export const daysSince = (iso?: string) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : Infinity);

/** Grund, warum ein Teil ein "vergessener Schatz" ist – oder null, wenn nicht. */
export function forgottenReason(item: WardrobeItem): string | null {
  if (item.category === "lifestyle" || item.listing) return null; // Vibe-Items und bereits angebotene Teile ausnehmen
  if (Date.now() - item.createdAt < GRACE_DAYS * DAY) return null;
  if (item.wearCount === 0) return translate("reason_never");
  if (item.lastWorn) {
    const d = daysSince(item.lastWorn);
    if (d > FORGOTTEN_AFTER_DAYS) return translate("reason_days", { n: d });
  }
  return null;
}
