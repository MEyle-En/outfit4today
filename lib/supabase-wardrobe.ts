import { supabase } from "@/lib/supabase";
import { categoryFromLabel } from "@/lib/categories";
import { MOCK_WARDROBE } from "@/lib/mock/wardrobe";
import { toast } from "@/lib/store/useToastStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { newId } from "@/lib/utils/uuid";
import { visibilityFromLegacy } from "@/lib/visibility";
import type { ItemCategory, ItemColor, ItemTag, Visibility, WardrobeItem } from "@/types";

/**
 * Wardrobe <-> Supabase.
 *
 * Erwartete Tabelle `wardrobe_items` (Spalten in EINER Stelle abgebildet: rowToItem / itemToRow – bei abweichenden
 * Namen nur dort anpassen):
 *   id uuid (PK), user_id uuid, name text, image_url text, category text, color text, tags jsonb,
 *   visibility jsonb, listing text, price numeric, has_transparent_background bool, is_placeholder bool,
 *   wear_count int, last_worn timestamptz, created_at timestamptz
 * Fotos liegen im Storage-Bucket `wardrobe-images` (öffentlich lesbar) unter `<user_id>/<item_id>.<ext>`.
 */
const TABLE = "wardrobe_items";
const BUCKET = "wardrobe-images";

interface Row {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  category: string | null;
  color: string | null;
  tags: ItemTag[] | null;
  visibility: Visibility | null;
  listing: string | null;
  price: number | null;
  has_transparent_background: boolean | null;
  is_placeholder: boolean | null;
  wear_count: number | null;
  last_worn: string | null;
  created_at: string;
}

const MOCK_IDS = new Set(MOCK_WARDROBE.map((m) => m.id));
/** Demo-Teile (Unsplash) gehören niemandem und werden nie synchronisiert. */
const isMock = (id: string) => MOCK_IDS.has(id);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rowToItem(r: Row): WardrobeItem {
  const tags = r.tags ?? [];
  const listing = (r.listing ?? undefined) as WardrobeItem["listing"];
  return {
    id: r.id,
    name: r.name,
    image: r.image_url,
    isPlaceholder: !!r.is_placeholder,
    tags,
    category: (r.category as ItemCategory | null) ?? categoryFromLabel(tags.find((t) => t.kind === "category")?.label),
    color: (r.color ?? undefined) as ItemColor | undefined,
    visibility: r.visibility ?? visibilityFromLegacy({ listing }),
    listing,
    price: r.price ?? undefined,
    hasTransparentBackground: !!r.has_transparent_background,
    wearCount: r.wear_count ?? 0,
    lastWorn: r.last_worn ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}

const itemToRow = (userId: string, i: WardrobeItem): Row => ({
  id: i.id,
  user_id: userId,
  name: i.name,
  image_url: i.image,
  category: i.category,
  color: i.color ?? null,
  tags: i.tags,
  visibility: i.visibility,
  listing: i.listing ?? null,
  price: i.price ?? null,
  has_transparent_background: !!i.hasTransparentBackground,
  is_placeholder: i.isPlaceholder,
  wear_count: i.wearCount,
  last_worn: i.lastWorn ?? null,
  created_at: new Date(i.createdAt).toISOString(),
});

export async function loadItems(userId: string): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(rowToItem);
}

/** Data-URL (Upload/Freistellung) -> Storage; liefert die öffentliche URL. Andere Bilder bleiben unverändert. */
async function uploadImage(userId: string, item: WardrobeItem): Promise<string> {
  if (!item.image.startsWith("data:")) return item.image;
  const blob = await (await fetch(item.image)).blob();
  const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
  // Neuer Dateiname pro Bild, damit CDN/Browser nach Änderungen (z. B. Freistellen) nichts Altes zeigen
  const path = `${userId}/${item.id}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

let lastErrorToast = 0;
function reportError(e: unknown) {
  console.error("Wardrobe sync failed:", e);
  const now = Date.now();
  if (now - lastErrorToast > 8000) {
    lastErrorToast = now;
    toast("Speichern fehlgeschlagen", "Deine Änderung wurde nicht in der Cloud gesichert.", "error");
  }
}

/**
 * Lädt die Items des Nutzers und hält Supabase danach automatisch aktuell: jede Änderung am Store
 * (hinzufügen, bearbeiten, Sichtbarkeit, löschen …) wird gebündelt als Insert/Update/Delete geschrieben.
 * Gibt eine Stop-Funktion zurück.
 */
export async function startWardrobeSync(userId: string): Promise<() => void> {
  const store = useWardrobeStore;
  const known = new Map<string, WardrobeItem>(); // zuletzt synchronisierter Stand je Item
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flushing = false;

  try {
    const cloud = await loadItems(userId);
    if (stopped) return () => {};
    const cloudIds = new Set(cloud.map((c) => c.id));
    const local = store.getState().items;
    // Demo-Teile bleiben lokal sichtbar; eigene lokale Teile aus der Zeit vor dem Login werden übernommen,
    // aber nur, wenn die Cloud noch leer ist (sonst würden fremde Reste in ein bestehendes Konto wandern).
    const demo = local.filter((i) => isMock(i.id));
    const adopt = cloud.length === 0 ? local.filter((i) => !isMock(i.id)) : [];
    const items = [...adopt, ...cloud, ...demo.filter((d) => !cloudIds.has(d.id))];
    for (const c of cloud) known.set(c.id, c); // Referenz = Stand der Cloud
    store.setState({ items: items.map((i) => known.get(i.id) ?? i) });
  } catch (e) {
    reportError(e);
  }

  const flush = async () => {
    if (flushing || stopped) return;
    flushing = true;
    try {
      const current = store.getState().items.filter((i) => !isMock(i.id));
      const currentIds = new Set(current.map((i) => i.id));

      const removed = Array.from(known.keys()).filter((id) => !currentIds.has(id));
      if (removed.length) {
        const { error } = await supabase.from(TABLE).delete().eq("user_id", userId).in("id", removed);
        if (error) throw error;
        removed.forEach((id) => known.delete(id));
      }

      for (const item of current) {
        if (known.get(item.id) === item) continue;
        let next = item;
        if (!UUID_RE.test(item.id)) next = { ...item, id: newId() }; // alte Kurz-IDs -> UUID
        const image = await uploadImage(userId, next);
        if (image !== next.image) next = { ...next, image };
        const { error } = await supabase.from(TABLE).upsert(itemToRow(userId, next), { onConflict: "id" });
        if (error) throw error;
        known.set(next.id, next);
        // Store auf den gespeicherten Stand bringen (neue ID / Bild-URL), sofern der Nutzer nichts Neueres geändert hat
        if (next !== item) {
          store.setState((s) => ({ items: s.items.map((i) => (i === item ? next : i)) }));
        }
      }
    } catch (e) {
      reportError(e);
    } finally {
      flushing = false;
    }
  };

  const unsubscribe = store.subscribe((state, prev) => {
    if (state.items === prev.items) return;
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), 600);
  });
  // Übernommene lokale Teile sofort hochladen
  timer = setTimeout(() => void flush(), 100);

  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe();
  };
}

/** Beim Abmelden: persönliche Teile aus dem Gerät entfernen, damit das nächste Konto sie nicht sieht. */
export function resetLocalWardrobe() {
  useWardrobeStore.setState({ items: MOCK_WARDROBE });
}
