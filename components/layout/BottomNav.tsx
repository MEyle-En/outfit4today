"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FlaskConical, Home, Shirt, ShoppingBag, User } from "lucide-react";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { useTranslation } from "@/hooks/useTranslation";
import { useProfileStore } from "@/lib/store/useProfileStore";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

// Alle fünf Icons: gleiche Größe (24px), klare Symbole. Lab = Reagenzglas-Kolben (Experimentierlabor).
const ITEMS = [
  { href: "/", label: "navHome", icon: Home },
  { href: "/wardrobe", label: "navWardrobe", icon: Shirt },
  { href: "/lab", label: "navLab", icon: FlaskConical },
  { href: "/marketplace", label: "navMarket", icon: ShoppingBag },
  { href: "/profile", label: "navProfile", icon: User },
] as const satisfies readonly { href: string; label: TranslationKey; icon: unknown }[];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const avatar = useProfileStore((s) => s.avatar);

  return (
    <nav aria-label="Hauptnavigation" className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-4 pb-3">
      <ul className="glass flex items-stretch justify-between rounded-2xl bg-surface/70 p-1.5 shadow-2xl">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                onClick={() => {
                  if (active) return;
                  playSound("click");
                  haptic("light");
                }}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // Icon (24px) und Text (12px) in einer festen Spalte: gap-1, nichts ragt über den Text
                  "relative flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xs font-medium leading-none transition-all duration-300",
                  active ? "text-accent" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-accent/15 ring-1 ring-accent/30"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                {href === "/profile" && avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    className={cn("relative h-6 w-6 shrink-0 rounded-full object-cover", active && "animate-icon-pop ring-2 ring-accent")}
                  />
                ) : (
                  <Icon className={cn("relative h-6 w-6 shrink-0", active && "animate-icon-pop")} />
                )}
                <span className="relative max-w-full truncate">{t(label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
