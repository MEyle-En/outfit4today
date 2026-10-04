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

/** Blob (z.B. das freigestellte PNG) als Data-URL, damit es im Store/localStorage gespeichert werden kann. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Blob konnte nicht gelesen werden"));
    reader.readAsDataURL(blob);
  });
}
