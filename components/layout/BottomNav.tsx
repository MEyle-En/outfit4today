"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Shirt, ShoppingBag, Sparkles, User } from "lucide-react";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { useTranslation } from "@/hooks/useTranslation";
import { useProfileStore } from "@/lib/store/useProfileStore";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "navHome", icon: Home },
  { href: "/wardrobe", label: "navWardrobe", icon: Shirt },
  { href: "/lab", label: "navLab", icon: Sparkles },
  { href: "/marketplace", label: "navMarket", icon: ShoppingBag },
  { href: "/profile", label: "navProfile", icon: User },
] as const satisfies readonly { href: string; label: TranslationKey; icon: unknown }[];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const avatar = useProfileStore((s) => s.avatar);

  return (
    <nav
      aria-label="Hauptnavigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-4 pb-3"
    >
      <ul className="glass flex items-center justify-between rounded-2xl bg-surface/70 p-1.5 shadow-2xl">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                onClick={() => {
                  if (active) return;
                  playSound("click");
                  haptic("light");
                }}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-all duration-300",
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-accent shadow-glow"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                {href === "/profile" && avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className={cn("relative h-5 w-5 rounded-full object-cover", active && "animate-icon-pop ring-2 ring-white")} />
                ) : (
                  <Icon className={cn("relative h-5 w-5", active && "animate-icon-pop text-white")} />
                )}
                <span className="relative">{t(label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
