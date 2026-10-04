import type { Visibility } from "@/types";

/**
 * Sichtbarkeit eines Items – Kanäle sind kombinierbar:
 *  - isPrivate:      nur ich sehe es (schließt Crew und Marketplace aus)
 *  - sharedWithCrew: meine Crew sieht es
 *  - onMarketplace:  öffentlich zum Verkauf/Tausch (kombinierbar mit Crew)
 *  - availableInLab: im Fit Lab nutzbar (unabhängig von den anderen, Standard: an)
 */
export const defaultVisibility = (): Visibility => ({
  isPrivate: true,
  sharedWithCrew: false,
  onMarketplace: false,
  availableInLab: true,
});

/** Hält die Regeln ein: Privat und Crew/Marketplace schließen sich aus; ohne Kanal ist ein Item automatisch privat. */
export function normalizeVisibility(v: Visibility): Visibility {
  if (v.isPrivate) return { ...v, isPrivate: true, sharedWithCrew: false, onMarketplace: false };
  if (!v.sharedWithCrew && !v.onMarketplace) return { ...v, isPrivate: true };
  return { ...v, isPrivate: false };
}

/** Wendet eine Änderung an. "Privat an" leert Crew + Marketplace, "Crew/Marketplace an" schaltet Privat aus. */
export function applyVisibility(v: Visibility, patch: Partial<Visibility>): Visibility {
  const next = { ...v, ...patch };
  if (patch.isPrivate === true) return normalizeVisibility(next);
  if (patch.sharedWithCrew === true || patch.onMarketplace === true) next.isPrivate = false;
  return normalizeVisibility(next);
}

/** Für alte gespeicherte Items ohne `visibility` (nur sharedWithCrew / listing). */
export function visibilityFromLegacy(i: { sharedWithCrew?: boolean; listing?: unknown; visibility?: Visibility }): Visibility {
  if (i.visibility) return normalizeVisibility({ ...defaultVisibility(), ...i.visibility });
  return normalizeVisibility({
    isPrivate: false,
    sharedWithCrew: i.sharedWithCrew ?? false,
    onMarketplace: !!i.listing,
    availableInLab: true,
  });
}
