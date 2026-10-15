import { supabase } from "@/lib/supabase";
import { getProfiles, snapshotImage } from "@/lib/supabase-social";

/**
 * Marktplatz-Chat in Supabase (chat_threads, chat_messages; Realtime auf beiden Tabellen).
 * Pro Angebot und Käufer gibt es genau einen Thread (unique(listing_id, buyer_id)).
 */

interface ThreadRow {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface CloudMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  at: number;
}

export interface CloudThread {
  id: string;
  listingId: string;
  title: string;
  image: string;
  /** "buyer": ich schreibe einem Verkäufer; "seller": jemand schreibt zu meinem Angebot */
  role: "buyer" | "seller";
  counterpartId: string;
  counterpart: string;
  counterpartAvatar?: string;
  last?: CloudMessage;
}

const msgFromRow = (r: MessageRow): CloudMessage => ({
  id: r.id,
  threadId: r.thread_id,
  senderId: r.sender_id,
  text: r.text,
  at: new Date(r.created_at).getTime(),
});

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/** Threads zu CloudThread (Gegenüber-Profil, letzte Nachricht) anreichern. */
async function enrich(rows: ThreadRow[], me: string): Promise<CloudThread[]> {
  if (rows.length === 0) return [];
  const counterpartIds = rows.map((r) => (r.buyer_id === me ? r.seller_id : r.buyer_id));
  const [profiles, lastRes] = await Promise.all([
    getProfiles(counterpartIds).catch(() => []),
    supabase
      .from("chat_messages")
      .select("*")
      .in(
        "thread_id",
        rows.map((r) => r.id),
      )
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  if (lastRes.error) throw lastRes.error;
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const lastByThread = new Map<string, CloudMessage>();
  for (const m of (lastRes.data ?? []) as MessageRow[]) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, msgFromRow(m));
  }
  return rows.map((r) => {
    const counterpartId = r.buyer_id === me ? r.seller_id : r.buyer_id;
    const p = byId.get(counterpartId);
    return {
      id: r.id,
      listingId: r.listing_id,
      title: r.listing_title,
      image: r.listing_image ?? "",
      role: r.buyer_id === me ? "buyer" : "seller",
      counterpartId,
      counterpart: p?.username || "",
      counterpartAvatar: p?.avatar_url ?? undefined,
      last: lastByThread.get(r.id),
    };
  });
}

/** Alle meine Threads (als Käufer oder Verkäufer), neueste zuerst, inklusive Gegenüber und letzter Nachricht. */
export async function getThreads(): Promise<CloudThread[]> {
  const me = await currentUserId();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .or(`buyer_id.eq.${me},seller_id.eq.${me}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const threads = await enrich((data ?? []) as ThreadRow[], me);
  return threads.sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
}

/** Thread zu einem Angebot öffnen oder anlegen (unique(listing_id, buyer_id)). */
export async function getOrCreateThread(input: {
  listingId: string;
  listingTitle: string;
  listingImage: string;
  sellerId: string;
}): Promise<CloudThread> {
  const me = await currentUserId();
  const find = async () => {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("listing_id", input.listingId)
      .eq("buyer_id", me)
      .maybeSingle();
    if (error) throw error;
    return data as ThreadRow | null;
  };

  let row = await find();
  if (!row) {
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({
        listing_id: input.listingId,
        listing_title: input.listingTitle,
        listing_image: snapshotImage(input.listingImage) ?? null,
        buyer_id: me,
        seller_id: input.sellerId,
      })
      .select()
      .single();
    if (error) {
      if (error.code !== "23505") throw error;
      row = await find(); // gleichzeitig angelegt (z. B. Doppelklick)
    } else {
      row = data as ThreadRow;
    }
  }
  if (!row) throw new Error("Thread konnte nicht angelegt werden");
  return (await enrich([row], me))[0];
}

/** Nachrichten eines Threads, älteste zuerst. */
export async function getMessages(threadId: string): Promise<CloudMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as MessageRow[]).map(msgFromRow);
}

export async function sendMessage(threadId: string, text: string): Promise<CloudMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ thread_id: threadId, text: text.trim() })
    .select()
    .single();
  if (error) throw error;
  return msgFromRow(data as MessageRow);
}

/** Eigene Nachricht löschen. Eine RLS-Ablehnung löscht still 0 Zeilen, das werten wir als Fehler. */
export async function deleteMessage(messageId: string): Promise<void> {
  const { data, error } = await supabase.from("chat_messages").delete().eq("id", messageId).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Nachricht wurde nicht gelöscht (nicht gefunden oder keine Berechtigung)");
}

/** Realtime: neue (und gelöschte) Nachrichten eines Threads. Gibt die Abmelde-Funktion zurück. */
export function subscribeThread(
  threadId: string,
  onMessage: (m: CloudMessage) => void,
  onDelete?: (messageId: string) => void,
): () => void {
  const channel = supabase
    .channel(`chat-thread-${threadId}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
      (payload) => onMessage(msgFromRow(payload.new as MessageRow)),
    )
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
      const id = (payload.old as { id?: string }).id;
      if (id) onDelete?.(id);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Realtime für ALLE meine Threads (Benachrichtigungen bei geschlossenem Dialog; die RLS filtert fremde Nachrichten heraus). */
export function subscribeAll(
  onMessage: (m: CloudMessage) => void,
  onNewThread: () => void,
  onDelete?: (messageId: string) => void,
): () => void {
  const channel = supabase
    .channel(`chat-all-${Math.random().toString(36).slice(2, 8)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) =>
      onMessage(msgFromRow(payload.new as MessageRow)),
    )
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_threads" }, () => onNewThread())
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
      const id = (payload.old as { id?: string }).id;
      if (id) onDelete?.(id);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
