"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Bell, Coins, Flame, Heart, MessageCircle, MessageSquare, ShoppingBag, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotificationStore, type NotificationType } from "@/lib/store/useNotificationStore";
import { cn, timeAgo } from "@/lib/utils";

const ICONS: Record<NotificationType, typeof Bell> = {
  like: Heart,
  chat: MessageCircle,
  swap: ArrowLeftRight,
  reaction: Flame,
  comment: MessageSquare,
  purchase: ShoppingBag,
  sale: Coins,
  follow: UserPlus,
};

/** Glocke mit Zähler; öffnet die Liste als Bottom-Sheet und markiert beim Öffnen alles als gelesen. */
export function NotificationBell({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const items = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  // Beim Öffnen: Zähler sofort auf 0, die gerade neuen Einträge bleiben in der Liste noch hervorgehoben
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const unread = items.filter((n) => !n.read).length;

  const openPanel = () => {
    setFresh(new Set(items.filter((n) => !n.read).map((n) => n.id)));
    markAllRead();
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={openPanel}
        aria-label={`${t("notifications")}${unread ? ` (${unread})` : ""}`}
        className={cn("icon-btn glass relative grid h-10 w-10 place-items-center rounded-full", className)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) markAllRead(); // während des Öffnens eingetroffene Einträge ebenfalls als gelesen
        }}
      >
        <DialogContent>
          <DialogTitle>{t("notifications")}</DialogTitle>
          <DialogDescription>{items.length ? `${items.length}` : ""}</DialogDescription>

          <div className="mt-4 space-y-2">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">{t("notificationsEmpty")}</p>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false);
                      markAllRead();
                      if (n.href) router.push(n.href);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left",
                      fresh.has(n.id) ? "border-accent/40 bg-accent/10" : "border-white/10 bg-white/5",
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/20 text-accent-soft">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{n.text}</span>
                      <span className="text-xs text-zinc-500">{timeAgo(n.at)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button variant="glass" size="sm" className="flex-1" onClick={markAllRead}>
                {t("markAllRead")}
              </Button>
              <Button variant="glass" size="sm" className="flex-1" onClick={clear}>
                {t("clear")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
