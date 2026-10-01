/**
 * Verkleinert ein Bild auf max. `maxSize` px und gibt eine JPEG-Data-URL zurück.
 * Nötig, weil Blob-URLs einen Reload nicht überleben und localStorage (persist) klein ist.
 */
export function fileToDataUrl(file: File, maxSize = 640, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht gelesen werden"));
    };
    img.src = url;
  });
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Schneidet den Bereich `area` (Pixel des Originalbilds) aus und skaliert ihn quadratisch auf `size` px. */
export function cropToDataUrl(src: string, area: CropArea, size = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d")?.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Bild konnte nicht gelesen werden"));
    img.src = src;
  });
}
