"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Kleinere Variante für enge Bereiche (z.B. Tray) */
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, compact, className }: EmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <Card
        className={cn(
          "relative flex flex-col items-center overflow-hidden border-dashed text-center",
          compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
          className,
        )}
      >
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
        <span
          className={cn(
            "relative grid place-items-center rounded-2xl bg-accent/15 text-accent-soft ring-1 ring-accent/30",
            compact ? "h-11 w-11" : "h-16 w-16",
          )}
        >
          <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} />
        </span>
        <h3 className={cn("relative font-display font-bold tracking-tight", compact ? "text-lg" : "text-2xl")}>{title}</h3>
        <p className="relative max-w-xs text-sm text-zinc-400">{description}</p>
        {actionLabel && onAction && (
          <Button size={compact ? "sm" : "default"} className="relative mt-2" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Card>
    </motion.div>
  );
}
