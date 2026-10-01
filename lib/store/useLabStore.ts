import { STORAGE } from "@/lib/storage-keys";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/mock/wardrobe";
import { DEFAULT_SIZE, GRID } from "@/lib/lab";
import type { TextFont } from "@/lib/text-styles";

export interface CanvasItem {
  id: string;
  /** Referenz auf WardrobeItem.id */
  itemId: string;
  x: number;
  y: number;
  rotation: number;
  /** Breite in px; die Höhe ergibt sich aus dem 4:5-Format */
  size: number;
}

/** Frei platzierbarer Text auf dem Canvas (wie Story-Sticker). */
export interface CanvasText {
  id: string;
  type: "text";
  content: string;
  font: TextFont;
  /** Hex-Farbe */
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Grad; ältere gespeicherte Texte haben noch keinen Wert */
  rotation?: number;
}

interface LabState {
  /** Texte liegen immer über den Bildern; Reihenfolge = Z-Order untereinander */
  texts: CanvasText[];
  /** Nicht persistiert: Das Lab soll beim nächsten Öffnen NICHT geleert werden (z.B. Look von der Startseite übernommen) */
  keepOnce: boolean;
  setKeepOnce: (v: boolean) => void;
  addText: () => string;
  updateText: (id: string, patch: Partial<Omit<CanvasText, "id" | "type">>) => void;
  removeText: (id: string) => void;
  bringTextToFront: (id: string) => void;
  /** Reihenfolge = Z-Order (letztes Element liegt oben) */
  items: CanvasItem[];
  addItemToCanvas: (itemId: string, pos?: { x: number; y: number }) => string;
  removeItemFromCanvas: (id: string) => void;
  updateItemPosition: (id: string, pos: { x: number; y: number }) => void;
  /** Position und Größe in einem Rutsch (Resize von links/oben verschiebt auch x/y) */
  updateItemBox: (id: string, box: { x: number; y: number; size: number }) => void;
  rotateItem: (id: string, delta: number) => void;
  setRotation: (id: string, deg: number) => void;
  bringToFront: (id: string) => void;
  clearCanvas: () => void;
}

const patch = (items: CanvasItem[], id: string, p: Partial<CanvasItem>) =>
  items.map((i) => (i.id === id ? { ...i, ...p } : i));

const norm = (deg: number) => ((deg % 360) + 360) % 360;

export const useLabStore = create<LabState>()(
  persist(
    (set) => ({
      items: [],
      texts: [],
      keepOnce: false,
      setKeepOnce: (keepOnce) => set({ keepOnce }),
      addText: () => {
        const id = uid();
        set((s) => {
          const n = s.texts.length % 5;
          const text: CanvasText = {
            id,
            type: "text",
            content: "",
            font: "clash",
            color: "#ffffff",
            x: 40 + n * 20,
            y: 200 + n * 40,
            width: 220,
            height: 60,
            rotation: 0,
          };
          return { texts: [...s.texts, text] };
        });
        return id;
      },
      updateText: (id, p) => set((s) => ({ texts: s.texts.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
      removeText: (id) => set((s) => ({ texts: s.texts.filter((t) => t.id !== id) })),
      bringTextToFront: (id) =>
        set((s) => {
          const t = s.texts.find((x) => x.id === id);
          if (!t || s.texts[s.texts.length - 1].id === id) return s;
          return { texts: [...s.texts.filter((x) => x.id !== id), t] };
        }),
      addItemToCanvas: (itemId, pos) => {
        const id = uid();
        set((s) => {
          // Ohne Position: versetzt stapeln, damit Klick-Hinzufügen nicht alles übereinanderlegt
          const n = s.items.length % 6;
          const { x, y } = pos ?? { x: GRID + n * GRID * 2, y: GRID + n * GRID * 2 };
          return { items: [...s.items, { id, itemId, x, y, rotation: 0, size: DEFAULT_SIZE }] };
        });
        return id;
      },
      removeItemFromCanvas: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateItemPosition: (id, { x, y }) => set((s) => ({ items: patch(s.items, id, { x, y }) })),
      updateItemBox: (id, box) => set((s) => ({ items: patch(s.items, id, box) })),
      rotateItem: (id, delta) =>
        set((s) => {
          const it = s.items.find((i) => i.id === id);
          return it ? { items: patch(s.items, id, { rotation: norm(it.rotation + delta) }) } : s;
        }),
      setRotation: (id, deg) => set((s) => ({ items: patch(s.items, id, { rotation: norm(deg) }) })),
      bringToFront: (id) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id);
          if (!item || s.items[s.items.length - 1].id === id) return s;
          return { items: [...s.items.filter((i) => i.id !== id), item] };
        }),
      clearCanvas: () => set({ items: [], texts: [] }),
    }),
    {
      name: STORAGE.lab,
      partialize: (s) => ({ items: s.items, texts: s.texts }),
    },
  ),
);
