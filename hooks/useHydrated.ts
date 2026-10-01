"use client";
import { useEffect, useState } from "react";

/** true, sobald der Client gerendert hat (persistierter Zustand ist dann geladen). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
