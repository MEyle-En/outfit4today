export const GRID = 20;
export const CANVAS_ID = "fit-canvas";
export const DEFAULT_SIZE = 120;
export const MIN_SIZE = 60;
export const MAX_SIZE = 280;
export const ROTATE_STEP = 15;
/** Items sind 4:5 (Breite:Höhe) */
export const ASPECT = 4 / 5;

/** Höhe eines Canvas-Items aus seiner Breite. */
export const itemHeight = (size: number) => Math.round(size / ASPECT);

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Rastet auf das Raster ein und hält das Item innerhalb der Canvas-Fläche. */
export function snapToCanvas(x: number, y: number, size: number, canvasW: number, canvasH: number) {
  const maxX = Math.floor(Math.max(0, canvasW - size) / GRID) * GRID;
  const maxY = Math.floor(Math.max(0, canvasH - itemHeight(size)) / GRID) * GRID;
  return {
    x: clamp(Math.round(x / GRID) * GRID, 0, maxX),
    y: clamp(Math.round(y / GRID) * GRID, 0, maxY),
  };
}
