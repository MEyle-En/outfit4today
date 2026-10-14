"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

/** Dezentes "Beispiel"-Badge für Demo-Inhalte. Die Position (z. B. oben links) legt der Aufrufer fest. */
export function ExampleBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "pointer-events-none inline-block rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-zinc-200 backdrop-blur-sm",
        className,
      )}
    >
      {t("example_badge")}
    </span>
  );
}
