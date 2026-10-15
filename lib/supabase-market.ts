import { supabase } from "@/lib/supabase";
import type { MarketListing } from "@/lib/mock/market";
import { getProfiles } from "@/lib/supabase-social";
import { rowToItem } from "@/lib/supabase-wardrobe";

/**
 * Echte Marktplatz-Angebote anderer Nutzer: Teile mit visibility.onMarketplace = true.
 * Die Leseregel auf wardrobe_items (wardrobe_items_select_shared) lässt genau diese Zeilen durch.
 */
export async function getMarketListings(): Promise<MarketListing[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .neq("user_id", user.id)
    .not("listing", "is", null)
    .filter("visibility->>onMarketplace", "eq", "true")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;

  type Row = Parameters<typeof rowToItem>[0];
  const rows = (data ?? []) as Row[];
  const profiles = await getProfiles(rows.map((r) => r.user_id)).catch(() => []);
  const names = new Map(profiles.map((p) => [p.id, p.username || ""]));

  return rows.flatMap((r) => {
    const item = rowToItem(r);
    if (!item.listing || item.visibility.isPrivate) return [];
    return [
      {
        id: item.id,
        seller: names.get(r.user_id) || "",
        sellerId: r.user_id,
        name: item.name,
        image: item.image,
        category: item.category,
        color: item.color ?? "multicolor",
        mode: item.listing,
        price: item.listing === "swap" ? undefined : item.price,
        size: item.size,
        transparent: item.hasTransparentBackground,
      } satisfies MarketListing,
    ];
  });
}
