import { supabase } from "@/lib/supabase";
import { rowToItem } from "@/lib/supabase-wardrobe";
import type { Crew, FriendItem, Person } from "@/types";

/**
 * Crews in Supabase (Tabellen crews, crew_members, profiles; Beitritt per RPC join_crew).
 * Die Zugriffsregeln (RLS) liefern automatisch nur Crews, in denen der Nutzer Mitglied ist.
 */

interface CrewRow {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

const GRADIENTS = [
  "from-purple-500 to-pink-500",
  "from-emerald-400 to-cyan-500",
  "from-pink-500 to-fuchsia-600",
  "from-amber-400 to-orange-600",
  "from-sky-400 to-indigo-500",
  "from-rose-400 to-red-500",
];

/** Stabiler Farbverlauf je Nutzer, solange kein Avatar gesetzt ist. */
export const gradientFor = (id: string) => GRADIENTS[Array.from(id).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % GRADIENTS.length];

const toCrew = (r: CrewRow, memberIds: string[]): Crew => ({
  id: r.id,
  name: r.name,
  inviteCode: r.invite_code,
  ownerId: r.owner_id,
  memberIds,
  createdAt: new Date(r.created_at).getTime(),
});

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/** Alle Crews, in denen ich Mitglied bin (inkl. Mitglieds-IDs). */
export async function getCrews(): Promise<Crew[]> {
  const { data, error } = await supabase.from("crews").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CrewRow[];
  if (rows.length === 0) return [];

  const { data: memberships, error: mErr } = await supabase
    .from("crew_members")
    .select("crew_id, user_id")
    .in(
      "crew_id",
      rows.map((r) => r.id),
    );
  if (mErr) throw mErr;
  const byCrew = new Map<string, string[]>();
  for (const m of (memberships ?? []) as { crew_id: string; user_id: string }[]) {
    byCrew.set(m.crew_id, [...(byCrew.get(m.crew_id) ?? []), m.user_id]);
  }
  return rows.map((r) => toCrew(r, byCrew.get(r.id) ?? []));
}

/** Neue Crew anlegen. Der Owner wird per Datenbank-Trigger automatisch Mitglied. */
export async function createCrew(name: string): Promise<Crew> {
  const { data, error } = await supabase.from("crews").insert({ name: name.trim() }).select().single();
  if (error) throw error;
  const row = data as CrewRow;
  return toCrew(row, [row.owner_id]);
}

export type JoinResult = { ok: true; crewId: string } | { ok: false; error: "invalid" | "failed" };

/** Per Einladungscode beitreten (RPC join_crew). */
export async function joinCrew(code: string): Promise<JoinResult> {
  const clean = code.trim();
  if (!clean) return { ok: false, error: "invalid" };
  const { data, error } = await supabase.rpc("join_crew", { p_code: clean });
  if (error) {
    const invalid = error.code === "P0002" || /invalid invite code/i.test(error.message ?? "");
    return { ok: false, error: invalid ? "invalid" : "failed" };
  }
  return { ok: true, crewId: data as string };
}

/** Mitglieder einer Crew mit Profildaten (username, avatar_url). */
export async function getCrewMembers(crewId: string): Promise<Person[]> {
  const { data, error } = await supabase.from("crew_members").select("user_id").eq("crew_id", crewId);
  if (error) throw error;
  const ids = ((data ?? []) as { user_id: string }[]).map((m) => m.user_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, username, avatar_url").in("id", ids);
  if (pErr) throw pErr;
  const byId = new Map(((profiles ?? []) as { id: string; username: string | null; avatar_url: string | null }[]).map((p) => [p.id, p]));
  return ids.map((id) => {
    const p = byId.get(id);
    const name = p?.username || "User";
    return {
      id,
      name,
      handle: name.toLowerCase().replace(/\s+/g, ""),
      avatar: p?.avatar_url ?? undefined,
      gradient: gradientFor(id),
    };
  });
}

/** Crew verlassen: eigenen Eintrag in crew_members löschen. */
export async function leaveCrew(crewId: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from("crew_members").delete().eq("crew_id", crewId).eq("user_id", userId);
  if (error) throw error;
}

/** Mit der Crew geteilte Teile der Mitglieder (die RLS-Regel auf wardrobe_items lässt nur Freigegebenes durch). */
export async function getCrewItems(memberIds: string[]): Promise<FriendItem[]> {
  if (memberIds.length === 0) return [];
  const userId = await currentUserId();
  const others = memberIds.filter((id) => id !== userId);
  if (others.length === 0) return [];
  const { data, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .in("user_id", others)
    .order("created_at", { ascending: false });
  if (error) throw error;
  type Row = Parameters<typeof rowToItem>[0];
  return ((data ?? []) as Row[])
    .map((r) => ({ ...rowToItem(r), ownerId: r.user_id }))
    .filter((i) => i.visibility.sharedWithCrew && !i.visibility.isPrivate);
}
