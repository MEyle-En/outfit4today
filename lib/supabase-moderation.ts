import { supabase } from "@/lib/supabase";

/**
 * Melden und Blockieren (Tabellen `reports` und `blocks`, RLS-geschützt).
 * Erwartete Spalten – bei abweichenden Namen nur hier anpassen:
 *   reports: reporter_id, target_type ('post' | 'comment' | 'user'), target_id, reason, details, created_at
 *   blocks:  blocker_id, blocked_id, created_at
 */

export type ReportTarget = "post" | "comment" | "user";
export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";
export const REPORT_REASONS: ReportReason[] = ["spam", "harassment", "inappropriate", "other"];

export type ModerationResult = { ok: true } | { ok: false; error: "duplicate" | "notAllowed" | "failed" };

const mapError = (e: { code?: string }): "duplicate" | "notAllowed" | "failed" =>
  e.code === "23505" ? "duplicate" : e.code === "42501" || e.code === "23514" ? "notAllowed" : "failed";

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function submitReport(input: {
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  details: string;
}): Promise<ModerationResult> {
  try {
    const reporter = await currentUserId();
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporter,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      details: input.details.trim(),
    });
    if (error) {
      console.error("Melden fehlgeschlagen:", error);
      return { ok: false, error: mapError(error) };
    }
    return { ok: true };
  } catch (e) {
    console.error("Melden fehlgeschlagen:", e);
    return { ok: false, error: "failed" };
  }
}

/** IDs aller Nutzer, die ich blockiert habe. */
export async function getBlockedIds(): Promise<string[]> {
  const me = await currentUserId();
  const { data, error } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", me);
  if (error) throw error;
  return ((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id);
}

export async function blockUser(userId: string): Promise<ModerationResult> {
  try {
    const me = await currentUserId();
    if (me === userId) return { ok: false, error: "notAllowed" };
    const { error } = await supabase.from("blocks").insert({ blocker_id: me, blocked_id: userId });
    // schon blockiert zählt als Erfolg
    if (error && error.code !== "23505") {
      console.error("Blockieren fehlgeschlagen:", error);
      return { ok: false, error: mapError(error) };
    }
    return { ok: true };
  } catch (e) {
    console.error("Blockieren fehlgeschlagen:", e);
    return { ok: false, error: "failed" };
  }
}

export async function unblockUser(userId: string): Promise<ModerationResult> {
  try {
    const me = await currentUserId();
    const { error } = await supabase.from("blocks").delete().eq("blocker_id", me).eq("blocked_id", userId);
    if (error) {
      console.error("Entblocken fehlgeschlagen:", error);
      return { ok: false, error: mapError(error) };
    }
    return { ok: true };
  } catch (e) {
    console.error("Entblocken fehlgeschlagen:", e);
    return { ok: false, error: "failed" };
  }
}
