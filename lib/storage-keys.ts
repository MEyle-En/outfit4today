// Persist-Keys. Beim Rebranding FitCheck -> Outfit4Today werden vorhandene Daten
// einmalig unter dem neuen Key übernommen (läuft beim ersten Import auf dem Client).
export const STORAGE = {
  style: "outfit4today-style",
  wardrobe: "outfit4today-wardrobe",
  crew: "outfit4today-crew",
  lab: "outfit4today-lab",
} as const;

export const LEGACY_STORAGE = {
  style: "fitcheck-style",
  wardrobe: "fitcheck-wardrobe",
  crew: "fitcheck-crew",
  lab: "fitcheck-lab",
} as const;

if (typeof window !== "undefined") {
  try {
    (Object.keys(STORAGE) as (keyof typeof STORAGE)[]).forEach((k) => {
      const old = localStorage.getItem(LEGACY_STORAGE[k]);
      if (old !== null && localStorage.getItem(STORAGE[k]) === null) localStorage.setItem(STORAGE[k], old);
      if (old !== null) localStorage.removeItem(LEGACY_STORAGE[k]);
    });
  } catch {
    /* localStorage nicht verfügbar */
  }
}
