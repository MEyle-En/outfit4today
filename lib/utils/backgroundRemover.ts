/**
 * Entfernt den Hintergrund eines Fotos direkt im Browser (@imgly/background-removal).
 *
 * Hinweise:
 *  - Läuft nur im Browser. Die Bibliothek wird deshalb erst beim ersten Aufruf nachgeladen (dynamischer Import),
 *    das hält sie aus dem normalen Seiten-Bundle und aus dem Server-Rendering heraus.
 *  - Beim ersten Aufruf lädt sie das KI-Modell (einige 10 MB) von imgly nach; danach liegt es im Browser-Cache.
 *  - Das Ergebnis ist ein PNG mit transparentem Hintergrund.
 */
export async function removeBackgroundFromImage(
  file: File,
  onProgress?: (key: string, current: number, total: number) => void,
): Promise<Blob> {
  try {
    const { removeBackground } = await import("@imgly/background-removal");
    return await removeBackground(file, {
      progress: (key, current, total) => {
        onProgress?.(key, current, total);
      },
    });
  } catch (error) {
    console.error("Background removal failed:", error);
    throw error;
  }
}

/** Maximale Wartezeit auf die Freistellung (Modell-Download + Berechnung). */
export const BG_REMOVAL_TIMEOUT_MS = 45_000;

/**
 * Wie removeBackgroundFromImage, bricht aber nach dem Timeout mit einem Fehler ab.
 * Aufrufer behalten bei Fehler das Originalbild und zeigen einen dezenten Toast.
 */
export function removeBackgroundWithTimeout(file: File, ms = BG_REMOVAL_TIMEOUT_MS): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Background removal timed out")), ms);
    removeBackgroundFromImage(file).then(
      (blob) => {
        clearTimeout(timer);
        resolve(blob);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Blob (z.B. das freigestellte PNG) als Data-URL, damit es im Store/localStorage gespeichert werden kann. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Blob konnte nicht gelesen werden"));
    reader.readAsDataURL(blob);
  });
}
