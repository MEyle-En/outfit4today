"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

/** Einmal im Root Layout einbinden. Toasts gleiten von oben herein und nach 3 s wieder hinaus. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] mx-auto flex max-w-md flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "glass flex items-center gap-2.5 rounded-2xl bg-surface/90 px-4 py-3 shadow-2xl",
              t.kind === "error" && "border-red-400/40",
            )}
          >
            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", t.kind === "error" ? "bg-red-500" : "bg-accent")}>
              {t.kind === "error" ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span className="text-sm">
              <span className="font-semibold">{t.message}</span>
              {t.description && <span className="text-zinc-400"> · {t.description}</span>}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
