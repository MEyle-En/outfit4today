"use client";

import { useState } from "react";
import { Ban, Flag, Undo2 } from "lucide-react";
import { BlockDialog } from "@/components/moderation/BlockDialog";
import { KebabMenu } from "@/components/moderation/KebabMenu";
import { ReportDialog } from "@/components/moderation/ReportDialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useModerationStore } from "@/lib/store/useModerationStore";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

/** Mitgliederliste einer Crew mit Menü je Mitglied: Nutzer melden / blockieren / entblocken. Blockierte sind ausgegraut. */
export function MembersDialog({ open, onOpenChange, members }: { open: boolean; onOpenChange: (o: boolean) => void; members: Person[] }) {
  const { t } = useTranslation();
  const meId = useAuthStore((s) => s.user?.id);
  const blocked = useModerationStore((s) => s.blocked);
  const unblock = useModerationStore((s) => s.unblock);
  const [report, setReport] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<Person | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>{t("members_title")}</DialogTitle>
          <DialogDescription>{t("crew_members", { n: members.length })}</DialogDescription>
          <ul className="mt-4 space-y-1">
            {members.map((m) => {
              const isMe = m.id === meId;
              const isBlocked = blocked.includes(m.id);
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-xl p-2">
                  <div className={cn("flex min-w-0 flex-1 items-center gap-3", isBlocked && "opacity-50")}>
                    {m.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar} alt="" className={cn("h-9 w-9 rounded-full object-cover", isBlocked && "grayscale")} />
                    ) : (
                      <div className={cn("h-9 w-9 rounded-full bg-gradient-to-br", m.gradient, isBlocked && "grayscale")} />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{isMe ? t("crew_you") : m.name || t("user_unknown")}</span>
                    {isBlocked && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium">{t("mod_blockedLabel")}</span>}
                  </div>
                  {!isMe && (
                    <KebabMenu
                      label={t("mod_menu")}
                      items={[
                        { label: t("report_userItem"), icon: <Flag className="h-4 w-4" />, onSelect: () => setReport(m.id) },
                        isBlocked
                          ? { label: t("mod_unblock"), icon: <Undo2 className="h-4 w-4" />, onSelect: () => void unblock(m.id) }
                          : { label: t("mod_block"), icon: <Ban className="h-4 w-4" />, danger: true, onSelect: () => setBlockTarget(m) },
                      ]}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
      <ReportDialog target={report ? { type: "user", id: report } : null} onClose={() => setReport(null)} />
      <BlockDialog userId={blockTarget?.id ?? null} name={blockTarget?.name || t("user_unknown")} onClose={() => setBlockTarget(null)} />
    </>
  );
}
