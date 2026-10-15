import { supabase } from "@/lib/supabase";

const BUCKET = "wardrobe-images";
const DELETED_FLAG = "outfit4today-account-deleted";

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/** Alle Dateien unter einem Ordner (rekursiv) auflisten. */
async function listFiles(prefix: string): Promise<string[]> {
  const files: string[] = [];
  const PAGE = 100;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: PAGE, offset });
    if (error) throw error;
    const entries = data ?? [];
    for (const e of entries) {
      // Ordner haben keine id -> eine Ebene tiefer weitersuchen
      if (e.id) files.push(`${prefix}/${e.name}`);
      else files.push(...(await listFiles(`${prefix}/${e.name}`)));
    }
    if (entries.length < PAGE) break;
  }
  return files;
}

/** Löscht alle Storage-Dateien des Nutzers (wardrobe-images/<user_id>/…, inklusive Profilbild). */
async function deleteUserFiles(userId: string): Promise<void> {
  const files = await listFiles(userId);
  for (let i = 0; i < files.length; i += 100) {
    const { error } = await supabase.storage.from(BUCKET).remove(files.slice(i, i + 100));
    if (error) throw error;
  }
}

export type DeleteAccountResult = { ok: true } | { ok: false; step: "storage" | "rpc" };

/**
 * Konto endgültig löschen. Reihenfolge: 1) Storage-Dateien, 2) RPC delete_my_account() (löscht alle Daten und die
 * auth.users-Zeile), 3) lokale Abmeldung. Scheitert Schritt 1 oder 2, bleibt das Konto vollständig bestehen und
 * der Nutzer angemeldet (Wiederholen ist gefahrlos). Nach Schritt 2 ist das Konto weg: Fehler beim Abmelden sind egal.
 */
export async function deleteMyAccount(): Promise<DeleteAccountResult> {
  let userId: string;
  try {
    userId = await currentUserId();
    await deleteUserFiles(userId);
  } catch (e) {
    console.error("Konto löschen: Dateien entfernen fehlgeschlagen:", e);
    return { ok: false, step: "storage" };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("Konto löschen: RPC fehlgeschlagen:", error);
    return { ok: false, step: "rpc" };
  }

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* Konto existiert nicht mehr; lokale Sitzung wird unten ohnehin entfernt */
  }
  try {
    // Alle lokalen Daten dieser App entfernen; das Flag lässt die Login-Seite nach dem Neuladen den Toast zeigen
    Object.keys(localStorage)
      .filter((k) => k.startsWith("outfit4today") || k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
    sessionStorage.setItem(DELETED_FLAG, "1");
  } catch {
    /* ignorieren */
  }
  return { ok: true };
}

/** true, wenn gerade ein Konto gelöscht wurde (Flag wird beim Lesen entfernt). */
export function consumeAccountDeletedFlag(): boolean {
  try {
    const set = sessionStorage.getItem(DELETED_FLAG) === "1";
    if (set) sessionStorage.removeItem(DELETED_FLAG);
    return set;
  } catch {
    return false;
  }
}

/**
 * Profilbild in den Storage laden (<user_id>/avatar/avatar.jpg, im gleichen Ordner wie deine Teile, damit die
 * Bucket-Regeln greifen und die Kontolöschung es mitnimmt) und profiles.avatar_url setzen, damit Crew-Mitglieder es sehen.
 */
export async function uploadAvatar(dataUrl: string): Promise<string> {
  const userId = await currentUserId();
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/avatar/avatar.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
  if (error) throw error;
  // Zeitstempel in der URL, damit Browser/CDN nach einem Wechsel nicht das alte Bild zeigen
  const url = `${supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  const { error: pErr } = await supabase.from("profiles").upsert({ id: userId, avatar_url: url }, { onConflict: "id" });
  if (pErr) throw pErr;
  return url;
}

/** Eigenes gespeichertes Profilbild (z. B. auf einem neuen Gerät). */
export async function getMyAvatarUrl(): Promise<string | null> {
  const userId = await currentUserId();
  const { data, error } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data?.avatar_url as string | null) ?? null;
}
