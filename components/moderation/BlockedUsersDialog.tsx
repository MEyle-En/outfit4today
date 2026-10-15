"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthorsStore } from "@/lib/store/useAuthorsStore";
import { useModerationStore } from "@/lib/store/useModerationStore";
import { gradientFor } from "@/lib/supabase-crews";
import { getProfiles } from "@/lib/supabase-social";
import { cn } from "@/lib/utils";

/** Profil-Einstellungen: Liste der blockierten Nutzer mit "Entblocken". */
export function BlockedUsersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const blocked = useModerationStore((s) => s.blocked);
  const unblock = useModerationStore((s) => s.unblock);
  const profiles = useAuthorsStore((s) => s.profiles);

  // Namen der blockierten Nutzer nachladen
  useEffect(() => {
    if (!open || blocked.length === 0) return;
    getProfiles(blocked)
      .then((list) => useAuthorsStore.getState().add(list))
      .catch(() => {});
  }, [open, blocked]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("blocked_title")}</DialogTitle>
        <DialogDescription>{t("blocked_desc")}</DialogDescription>
        <ul className="mt-4 space-y-2">
          {blocked.length === 0 && <li className="py-6 text-center text-sm text-zinc-500">{t("blocked_empty")}</li>}
          {blocked.map((id) => {
            const p = profiles[id];
            return (
              <li key={id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                <div className="flex min-w-0 flex-1 items-center gap-3 opacity-60">
                  {p?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" className="h-9 w-9 rounded-full object-cover grayscale" />
                  ) : (
                    <div className={cn("h-9 w-9 rounded-full bg-gradient-to-br grayscale", gradientFor(id))} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">{p?.username || t("user_unknown")}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{t("mod_blockedLabel")}</span>
                </div>
                <Button size="sm" variant="glass" onClick={() => void unblock(id)}>
                  {t("mod_unblock")}
                </Button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
