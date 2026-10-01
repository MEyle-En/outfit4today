import { LogoSVG } from "@/components/brand/LogoSVG";
import { cn } from "@/lib/utils";

/** Header-Logo: Symbol (40px) + Wortmarke. `size` skaliert das Symbol (z.B. groß auf dem Login). */
export function Logo({ className, size = 40, showName = true }: { className?: string; size?: number; showName?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="shrink-0" style={{ filter: "drop-shadow(0 0 6px rgba(236,72,153,0.45))" }}>
        <LogoSVG size={size} title="Outfit4Today Logo" />
      </span>
      {showName && (
        <span className="font-display text-lg font-bold tracking-tight">
          Outfit<span className="text-accent-soft">4</span>Today
        </span>
      )}
    </div>
  );
}
