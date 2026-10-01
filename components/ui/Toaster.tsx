"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";

/** Einmal im Root Layout einbinden. Sitzt über der Bottom Navigation. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] mx-auto flex max-w-md flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass flex items-center gap-2.5 rounded-2xl bg-surface/90 px-4 py-3 shadow-2xl"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
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
