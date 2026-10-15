"use client";

import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useModerationStore } from "@/lib/store/useModerationStore";

/** Bestätigung vor dem Blockieren. */
export function BlockDialog({ userId, name, onClose }: { userId: string | null; name: string; onClose: () => void }) {
  const { t } = useTranslation();
  const block = useModerationStore((s) => s.block);
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-red-300" /> {t("block_title", { name })}
        </DialogTitle>
        <DialogDescription>{t("block_desc")}</DialogDescription>
        <div className="mt-5 space-y-2">
          <Button
            size="lg"
            className="w-full border border-red-400/50 bg-red-600 text-white hover:bg-red-500"
            disabled={busy}
            onClick={async () => {
              if (!userId) return;
              setBusy(true);
              const ok = await block(userId);
              setBusy(false);
              if (ok) onClose();
            }}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t("block_confirm")}
          </Button>
          <Button variant="glass" size="lg" className="w-full" disabled={busy} onClick={onClose}>
            {t("crop_cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
