"use client";

import { useMemo } from "react";
import { getVibeTheme } from "@/lib/vibe-themes";
import { useStyleStore } from "@/lib/store/useStyleStore";

/** Theme des im Vibe Check gewählten Vibes (oder die Lavender-Marke). */
export function useVibeTheme() {
  const vibes = useStyleStore((s) => s.vibes);
  return useMemo(() => getVibeTheme(vibes), [vibes]);
}
