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

/** Dreht ein Bild um 90/180/270° und liefert eine JPEG-Data-URL (max. 800 px). Wirft, wenn das Bild nicht lesbar ist (z.B. CORS). */
export function rotateImage(src: string, degrees: 90 | 180 | 270, maxSize = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const swap = degrees !== 180;
        const canvas = document.createElement("canvas");
        canvas.width = swap ? h : w;
        canvas.height = swap ? w : h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Bild konnte nicht gelesen werden"));
    img.src = src;
  });
}
