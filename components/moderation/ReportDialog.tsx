"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { REPORT_REASONS, submitReport, type ReportReason, type ReportTarget } from "@/lib/supabase-moderation";
import { toast } from "@/lib/store/useToastStore";

const MIN_DETAILS = 10;

/** Melden-Dialog für Posts, Kommentare und Nutzer: Grund (Dropdown) + Beschreibung (mind. 10 Zeichen). */
export function ReportDialog({
  target,
  onClose,
}: {
  target: { type: ReportTarget; id: string } | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = details.trim().length >= MIN_DETAILS;
  const title =
    target?.type === "user" ? t("report_userTitle") : target?.type === "comment" ? t("report_commentTitle") : t("report_postTitle");

  const reset = () => {
    setDetails("");
    setReason("inappropriate");
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (!target || !valid || busy) return;
    setBusy(true);
    const r = await submitReport({ targetType: target.type, targetId: target.id, reason, details });
    setBusy(false);
    if (r.ok) {
      toast(t("report_done"));
      reset();
      onClose();
    } else {
      toast(
        t(r.error === "duplicate" ? "report_errDuplicate" : r.error === "notAllowed" ? "report_errOwn" : "mod_errAction"),
        undefined,
        "error",
      );
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-300" /> {title}
        </DialogTitle>
        <DialogDescription>{t("report_desc")}</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="report-reason" className="text-sm font-semibold">
              {t("report_reason")}
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r} className="bg-surface">
                  {t(`report_r_${r}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="report-details" className="text-sm font-semibold">
              {t("report_details")}
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t("report_detailsPh")}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-base text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            />
            <p className="text-xs text-zinc-500">{t("report_minChars", { n: MIN_DETAILS })}</p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={!valid || busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t("report_send")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
