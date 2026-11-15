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
  if (v.isPrivate) return { ...v, isPrivate: true, sharedWithCrew: false, onMarketplace: false, crewIds: undefined };
  if (!v.sharedWithCrew && !v.onMarketplace) return { ...v, isPrivate: true, crewIds: undefined };
  // Die Crew-Auswahl gilt nur, solange mit der Crew geteilt wird; eine leere Liste bedeutet "alle"
  return { ...v, isPrivate: false, crewIds: v.sharedWithCrew && v.crewIds?.length ? v.crewIds : undefined };
}

/** Tausch/Verkauf ist möglich, sobald das Teil für andere sichtbar ist (Crew oder Marketplace). */
export const offersAllowed = (v: Visibility) => !v.isPrivate && (v.sharedWithCrew || v.onMarketplace);

/** Sieht diese Crew das Teil? (ohne Auswahl: alle Crews) */
export const sharedWithCrewId = (v: Visibility, crewId: string) =>
  !v.isPrivate && v.sharedWithCrew && (!v.crewIds?.length || v.crewIds.includes(crewId));

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
