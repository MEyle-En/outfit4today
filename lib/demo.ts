import { MOCK_WARDROBE } from "@/lib/mock/wardrobe";

const DEMO_IDS = new Set(MOCK_WARDROBE.map((m) => m.id));

/** Demo-Inhalt: mitgelieferte Beispiel-Teile und Platzhalter-Items (ohne eigenes Foto). */
export const isDemoItem = (i: { id: string; isPlaceholder?: boolean }) => !!i.isPlaceholder || DEMO_IDS.has(i.id);
