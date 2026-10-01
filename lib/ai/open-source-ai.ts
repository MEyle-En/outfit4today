/**
 * Platzhalter für die Open-Source-Bilderkennung.
 *
 * Hier wird später CLIP (Zero-Shot-Klassifikation von Kategorie, Farbe, Stil) und/oder
 * BLIP (Bildbeschreibung -> Name & Material) angebunden – z.B. über transformers.js im
 * Browser oder einen eigenen Inference-Endpoint.
 *
 * Geplante Schnittstelle (identisch zu mock-ai.ts, damit ein Austausch nur die Imports ändert):
 *
 *   export async function analyzeImage(image: Blob | string): Promise<AiResult>;
 *   export async function parseQuickAdd(text: string): Promise<AiResult>;
 *
 * Bis dahin bleibt die Mock-Logik in ./mock-ai.ts aktiv.
 */
export {};
