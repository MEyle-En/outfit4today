import type { CSSProperties } from "react";

/** Gestaffelte Eingangs-Animation: Karte i startet i * step ms später (max. bei `max`, damit lange Listen nicht ewig warten). */
export const stagger = (index = 0, step = 70, max = 12): CSSProperties => ({
  animationDelay: `${Math.min(index, max) * step}ms`,
});
