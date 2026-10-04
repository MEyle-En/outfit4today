import { cn } from "@/lib/utils";

/** Pulsierender Platzhalter, bis Inhalte da sind. Form/Größe per className (z.B. "h-24 w-full", "rounded-full"). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-white/10", className)} {...props} />;
}
